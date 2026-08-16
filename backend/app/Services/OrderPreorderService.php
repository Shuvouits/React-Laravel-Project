<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderPreorder;
use App\Models\Product;
use App\Models\ProductPreorder;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class OrderPreorderService
{
    public function createFromOrder(Order $order): ?OrderPreorder
    {
        $existingPreorder = OrderPreorder::query()
            ->where('order_id', $order->id)
            ->first();

        if ($existingPreorder) {
            return $existingPreorder;
        }

        $order->loadMissing([
            'items',
        ]);

        if ($order->items->isEmpty()) {
            return null;
        }

        $preorderItems = collect();

        foreach ($order->items as $orderItem) {
            if (!$orderItem->product_id) {
                continue;
            }

            $product = Product::query()
                ->with('preorder')
                ->whereKey($orderItem->product_id)
                ->lockForUpdate()
                ->first();

            if (
                !$product ||
                !$product->preorder_enabled
            ) {
                continue;
            }

            $productPreorder = ProductPreorder::query()
                ->where('product_id', $product->id)
                ->lockForUpdate()
                ->first();

            if (!$productPreorder) {
                $productPreorder = ProductPreorder::create([
                    'product_id' => $product->id,
                    'payment_type' => 'full',
                    'reserved_quantity' => 0,
                    'allow_full_payment' => true,
                    'show_remaining_quantity' => false,
                ]);
            }

            $quantity = max(
                1,
                (int) $orderItem->quantity
            );

            $this->validateReleaseWindow(
                $product,
                $productPreorder
            );

            $this->validateReservationLimit(
                $product,
                $productPreorder,
                $quantity
            );

            $this->validateCustomerLimit(
                $order,
                $product,
                $productPreorder,
                $quantity
            );

            $preorderItems->push([
                'order_item' => $orderItem,
                'product' => $product,
                'preorder' => $productPreorder,
                'quantity' => $quantity,
            ]);
        }

        if ($preorderItems->isEmpty()) {
            return null;
        }

        $reservedQuantity = $preorderItems->sum(
            fn ($item) => $item['quantity']
        );

        $expectedAt = $this->getExpectedDate(
            $preorderItems
        );

        $paymentTerms = $this->getPaymentTerms(
            $preorderItems
        );

        $depositAmount = $this->getDepositAmount(
            $preorderItems
        );

        $grandTotal = round(
            (float) $order->grand_total,
            2
        );

        if (
            $paymentTerms === 'deposit' &&
            $depositAmount <= 0
        ) {
            throw ValidationException::withMessages([
                'items' => [
                    'The pre-order deposit configuration is invalid.',
                ],
            ]);
        }

        if (
            $paymentTerms === 'deposit' &&
            $depositAmount > $grandTotal
        ) {
            throw ValidationException::withMessages([
                'items' => [
                    'The pre-order deposit amount cannot exceed the order total.',
                ],
            ]);
        }

        $balanceDue = match ($paymentTerms) {
            'deposit' => max(
                0,
                round(
                    $grandTotal - $depositAmount,
                    2
                )
            ),

            'pay_later' => $grandTotal,

            default => 0,
        };

        foreach ($preorderItems as $item) {
            $productPreorder = $item['preorder'];
            $quantity = $item['quantity'];

            $productPreorder->increment(
                'reserved_quantity',
                $quantity
            );
        }

        return OrderPreorder::create([
            'order_id' => $order->id,
            'status' => 'reserved',

            'expected_at' => $expectedAt,

            'payment_terms' => $paymentTerms,

            'deposit_amount' => $paymentTerms === 'deposit'
                ? $depositAmount
                : null,

            'balance_due' => $balanceDue,

            'balance_due_at' => $this->getBalanceDueDate(
                $preorderItems
            ),

            'reserved_quantity' => $reservedQuantity,

            'released_at' => null,
            'cancelled_at' => null,
            'cancellation_reason' => null,
        ]);
    }

    private function validateReleaseWindow(
        Product $product,
        ProductPreorder $preorder
    ): void {
        if (
            $preorder->preorder_start_at &&
            $preorder->preorder_start_at->isFuture()
        ) {
            throw ValidationException::withMessages([
                'items' => [
                    "{$product->title} is not available for pre-order yet.",
                ],
            ]);
        }

        if (
            $preorder->preorder_end_at &&
            $preorder->preorder_end_at->isPast()
        ) {
            throw ValidationException::withMessages([
                'items' => [
                    "The pre-order window for {$product->title} has ended.",
                ],
            ]);
        }
    }

    private function validateReservationLimit(
        Product $product,
        ProductPreorder $preorder,
        int $quantity
    ): void {
        if ($preorder->max_preorder_quantity === null) {
            return;
        }

        $reserved = (int) $preorder->reserved_quantity;

        $remaining = max(
            0,
            (int) $preorder->max_preorder_quantity - $reserved
        );

        if ($quantity <= $remaining) {
            return;
        }

        if ($remaining <= 0) {
            throw ValidationException::withMessages([
                'items' => [
                    "{$product->title} is fully reserved.",
                ],
            ]);
        }

        throw ValidationException::withMessages([
            'items' => [
                "Only {$remaining} pre-order units remain for {$product->title}.",
            ],
        ]);
    }

    private function validateCustomerLimit(
        Order $order,
        Product $product,
        ProductPreorder $preorder,
        int $quantity
    ): void {
        if (
            !$order->user_id ||
            $preorder->max_quantity_per_customer === null
        ) {
            return;
        }

        $alreadyReserved = OrderPreorder::query()
            ->where('status', '!=', 'cancelled')
            ->whereHas('order', function ($query) use ($order) {
                $query->where(
                    'user_id',
                    $order->user_id
                );
            })
            ->whereHas('order.items', function ($query) use ($product) {
                $query->where(
                    'product_id',
                    $product->id
                );
            })
            ->with('order.items')
            ->get()
            ->sum(function ($orderPreorder) use ($product) {
                return $orderPreorder->order
                    ?->items
                    ?->where(
                        'product_id',
                        $product->id
                    )
                    ->sum('quantity') ?? 0;
            });

        $limit = (int) $preorder->max_quantity_per_customer;

        if (
            $alreadyReserved + $quantity <= $limit
        ) {
            return;
        }

        $remaining = max(
            0,
            $limit - $alreadyReserved
        );

        if ($remaining <= 0) {
            throw ValidationException::withMessages([
                'items' => [
                    "You have reached the pre-order limit for {$product->title}.",
                ],
            ]);
        }

        throw ValidationException::withMessages([
            'items' => [
                "You can reserve only {$remaining} more unit(s) of {$product->title}.",
            ],
        ]);
    }

    private function getExpectedDate(
        Collection $items
    ): ?string {
        $dates = $items
            ->map(function ($item) {
                $preorder = $item['preorder'];

                if ($preorder->expected_ship_to) {
                    return $preorder->expected_ship_to;
                }

                return $preorder->expected_ship_from;
            })
            ->filter()
            ->sortBy(function ($date) {
                return $date->timestamp;
            });

        $latest = $dates->last();

        return $latest
            ? $latest->format('Y-m-d')
            : null;
    }

    private function getPaymentTerms(
        Collection $items
    ): string {
        $paymentTypes = $items
            ->map(function ($item) {
                return $item['preorder']->payment_type;
            })
            ->filter()
            ->values();

        if (
            $paymentTypes->contains('deposit')
        ) {
            return 'deposit';
        }

        if (
            $paymentTypes->contains('pay_later')
        ) {
            return 'pay_later';
        }

        return 'full';
    }

    private function getDepositAmount(
        Collection $items
    ): float {
        $deposit = $items->sum(
            function ($item) {
                $orderItem = $item['order_item'];
                $preorder = $item['preorder'];
                $quantity = $item['quantity'];

                if (
                    $preorder->payment_type !== 'deposit' ||
                    $preorder->deposit_value === null
                ) {
                    return 0;
                }

                $unitPrice = (float) $orderItem->unit_price;

                if (
                    $preorder->deposit_type === 'percentage'
                ) {
                    $unitDeposit =
                        $unitPrice *
                        (
                            (float) $preorder->deposit_value /
                            100
                        );

                    return $unitDeposit * $quantity;
                }

                if (
                    $preorder->deposit_type === 'fixed'
                ) {
                    $unitDeposit = min(
                        $unitPrice,
                        (float) $preorder->deposit_value
                    );

                    return $unitDeposit * $quantity;
                }

                return 0;
            }
        );

        return round(
            (float) $deposit,
            2
        );
    }

    private function getBalanceDueDate(
        Collection $items
    ) {
        return $items
            ->map(function ($item) {
                return $item['preorder']->balance_due_at;
            })
            ->filter()
            ->sortBy(function ($date) {
                return $date->timestamp;
            })
            ->first();
    }
}