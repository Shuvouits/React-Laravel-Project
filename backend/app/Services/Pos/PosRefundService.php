<?php

namespace App\Services\Pos;

use App\Models\InventoryLevel;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentTransaction;
use App\Models\PosPayment;
use App\Models\PosRefund;
use App\Models\PosRefundItem;
use App\Models\PosRegisterSession;
use App\Models\PosSale;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PosRefundService
{
    public function refund(
        array $context,
        int $saleId,
        array $data
    ): array {
        return DB::transaction(function () use (
            $context,
            $saleId,
            $data
        ) {
            $sale = $this->findSale(
                $context,
                $saleId
            );

            $refundItems = $this->prepareRefundItems(
                $sale,
                $data['items']
            );

            $totals = $this->calculateRefundTotals(
                $sale,
                $refundItems
            );

            $this->validateRefundableAmount(
                $sale,
                $totals['total']
            );

            $paymentMethod = $data['payment_method']
                ?? $sale->primary_payment_method
                ?? 'cash';

            $this->validatePaymentMethod(
                $paymentMethod
            );

            $refund = PosRefund::query()->create([
                'pos_sale_id' => $sale->id,
                'order_id' => $sale->order_id,
                'vendor_id' => $sale->vendor_id,
                'location_id' => $sale->location_id,
                'register_session_id' => $sale->register_session_id,
                'processed_by' => $context['user_id'],

                'refund_number' => $this->generateRefundNumber(),
                'status' => 'completed',

                'reason' => $data['reason'] ?? null,
                'notes' => $data['notes'] ?? null,

                'subtotal' => $totals['subtotal'],
                'tax_total' => $totals['tax_total'],
                'total' => $totals['total'],

                'currency' => $sale->currency,
                'payment_method' => $paymentMethod,
                'payment_reference' => $data['payment_reference']
                    ?? null,

                'restock_items' => (bool) (
                    $data['restock_items'] ?? true
                ),

                'metadata' => [
                    'sale_number' => $sale->sale_number,
                    'previous_refunded_total' => (float) $sale->refunded_total,
                    'refund_items_count' => count($refundItems),
                ],

                'completed_at' => now(),
            ]);

            foreach ($refundItems as $refundItem) {
                $restocked = false;

                if ($refund->restock_items) {
                    $this->restockInventory(
                        $context,
                        $sale,
                        $refund,
                        $refundItem
                    );

                    $restocked = true;
                }

                PosRefundItem::query()->create([
                    'pos_refund_id' => $refund->id,
                    'order_item_id' => $refundItem['order_item_id'],
                    'product_id' => $refundItem['product_id'],
                    'variant_id' => $refundItem['variant_id'],
                    'product_title' => $refundItem['product_title'],
                    'variant_title' => $refundItem['variant_title'],
                    'sku' => $refundItem['sku'],
                    'quantity' => $refundItem['quantity'],
                    'unit_price' => $refundItem['unit_price'],
                    'line_total' => $refundItem['line_total'],
                    'restocked' => $restocked,
                ]);
            }

            $newRefundedTotal = round(
                (float) $sale->refunded_total
                + $totals['total'],
                2
            );

            $fullyRefunded = $newRefundedTotal
                >= round((float) $sale->grand_total, 2);

            $sale->update([
                'refunded_total' => min(
                    $newRefundedTotal,
                    (float) $sale->grand_total
                ),
                'payment_status' => $fullyRefunded
                    ? 'refunded'
                    : 'partially_refunded',
                'status' => $fullyRefunded
                    ? 'refunded'
                    : $sale->status,
                'refunded_at' => $fullyRefunded
                    ? now()
                    : $sale->refunded_at,
            ]);

            $this->updateOrder(
                $sale,
                $fullyRefunded
            );

            $this->updatePosPayments(
                $sale,
                $paymentMethod,
                $fullyRefunded
            );

            $this->createPaymentTransaction(
                $sale,
                $refund,
                $paymentMethod,
                $totals['total']
            );

            if ($paymentMethod === 'cash') {
                $this->updateRegisterCashRefund(
                    $sale,
                    $totals['total']
                );
            }

            return [
                'message' => 'POS refund সফলভাবে সম্পন্ন হয়েছে।',

                'refund' => [
                    'id' => $refund->id,
                    'refund_number' => $refund->refund_number,
                    'status' => $refund->status,
                    'reason' => $refund->reason,
                    'subtotal' => (float) $refund->subtotal,
                    'tax_total' => (float) $refund->tax_total,
                    'total' => (float) $refund->total,
                    'currency' => $refund->currency,
                    'payment_method' => $refund->payment_method,
                    'restock_items' => (bool) $refund->restock_items,
                    'completed_at' => $refund->completed_at,
                ],

                'sale' => [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'status' => $sale->fresh()->status,
                    'payment_status' => $sale->fresh()->payment_status,
                    'grand_total' => (float) $sale->grand_total,
                    'refunded_total' => $newRefundedTotal,
                    'refundable_total' => max(
                        0,
                        round(
                            (float) $sale->grand_total
                            - $newRefundedTotal,
                            2
                        )
                    ),
                ],

                'items' => $refundItems,
            ];
        }, 3);
    }

    private function findSale(
        array $context,
        int $saleId
    ): PosSale {
        $query = PosSale::query()
            ->whereKey($saleId)
            ->where(
                'location_id',
                $context['location_id']
            )
            ->whereNotIn(
                'status',
                ['cancelled']
            );

        if (($context['role'] ?? null) === 'vendor') {
            $query->where(
                'vendor_id',
                $context['vendor_id']
            );
        } else {
            $query->whereNull('vendor_id');
        }

        $sale = $query
            ->lockForUpdate()
            ->first();

        if (!$sale) {
            throw ValidationException::withMessages([
                'sale_id' => [
                    'POS sale পাওয়া যায়নি অথবা refund করার অনুমতি নেই।',
                ],
            ]);
        }

        if (
            round((float) $sale->refunded_total, 2)
            >= round((float) $sale->grand_total, 2)
        ) {
            throw ValidationException::withMessages([
                'sale_id' => [
                    'এই POS sale সম্পূর্ণ refund করা হয়েছে।',
                ],
            ]);
        }

        return $sale;
    }

    private function prepareRefundItems(
        PosSale $sale,
        array $items
    ): array {
        if (empty($items)) {
            throw ValidationException::withMessages([
                'items' => [
                    'Refund করার জন্য কমপক্ষে একটি item নির্বাচন করুন।',
                ],
            ]);
        }

        $preparedItems = [];

        foreach ($items as $index => $item) {
            $orderItemId = (int) (
                $item['order_item_id'] ?? 0
            );

            $quantity = (int) (
                $item['quantity'] ?? 0
            );

            if ($orderItemId < 1) {
                throw ValidationException::withMessages([
                    "items.$index.order_item_id" => [
                        'Order item নির্বাচন করুন।',
                    ],
                ]);
            }

            if ($quantity < 1) {
                throw ValidationException::withMessages([
                    "items.$index.quantity" => [
                        'Refund quantity কমপক্ষে 1 হতে হবে।',
                    ],
                ]);
            }

            $orderItem = OrderItem::query()
                ->whereKey($orderItemId)
                ->where(
                    'order_id',
                    $sale->order_id
                )
                ->lockForUpdate()
                ->first();

            if (!$orderItem) {
                throw ValidationException::withMessages([
                    "items.$index.order_item_id" => [
                        'নির্বাচিত item এই POS sale-এর অন্তর্ভুক্ত নয়।',
                    ],
                ]);
            }

            $alreadyRefunded = $this->getRefundedQuantity(
                $sale,
                $orderItem->id
            );

            $availableQuantity = max(
                0,
                (int) $orderItem->quantity
                - $alreadyRefunded
            );

            if ($quantity > $availableQuantity) {
                throw ValidationException::withMessages([
                    "items.$index.quantity" => [
                        "{$orderItem->product_title} এর সর্বোচ্চ refundable quantity {$availableQuantity}টি।",
                    ],
                ]);
            }

            $unitPrice = round(
                (float) $orderItem->unit_price,
                2
            );

            $preparedItems[] = [
                'order_item_id' => $orderItem->id,
                'product_id' => $orderItem->product_id,
                'variant_id' => $orderItem->variant_id,
                'product_title' => $orderItem->product_name,
                'variant_title' => $orderItem->variant_name,
                'sku' => $orderItem->sku,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'line_total' => round(
                    $unitPrice * $quantity,
                    2
                ),
                'original_quantity' => (int) $orderItem->quantity,
                'already_refunded_quantity' => $alreadyRefunded,
                'remaining_quantity' => $availableQuantity - $quantity,
            ];
        }

        return $preparedItems;
    }

    private function getRefundedQuantity(
        PosSale $sale,
        int $orderItemId
    ): int {
        return (int) DB::table('pos_refund_items')
            ->join(
                'pos_refunds',
                'pos_refunds.id',
                '=',
                'pos_refund_items.pos_refund_id'
            )
            ->where(
                'pos_refunds.pos_sale_id',
                $sale->id
            )
            ->where(
                'pos_refunds.status',
                'completed'
            )
            ->where(
                'pos_refund_items.order_item_id',
                $orderItemId
            )
            ->sum('pos_refund_items.quantity');
    }

    private function calculateRefundTotals(
        PosSale $sale,
        array $refundItems
    ): array {
        $selectedLineTotal = round(
            collect($refundItems)->sum('line_total'),
            2
        );

        $saleSubtotal = round(
            (float) $sale->subtotal,
            2
        );

        if ($saleSubtotal <= 0) {
            throw ValidationException::withMessages([
                'sale_id' => [
                    'Sale subtotal সঠিক নয়।',
                ],
            ]);
        }

        $ratio = min(
            1,
            $selectedLineTotal / $saleSubtotal
        );

        $discountAmount = round(
            (float) $sale->discount_total * $ratio,
            2
        );

        $refundSubtotal = round(
            max(
                0,
                $selectedLineTotal - $discountAmount
            ),
            2
        );

        $taxTotal = round(
            (float) $sale->tax_total * $ratio,
            2
        );

        $refundTotal = round(
            $refundSubtotal + $taxTotal,
            2
        );

        return [
            'original_line_total' => $selectedLineTotal,
            'discount_total' => $discountAmount,
            'subtotal' => $refundSubtotal,
            'tax_total' => $taxTotal,
            'total' => $refundTotal,
        ];
    }

    private function validateRefundableAmount(
        PosSale $sale,
        float $refundTotal
    ): void {
        if ($refundTotal <= 0) {
            throw ValidationException::withMessages([
                'items' => [
                    'Refund amount অবশ্যই 0-এর বেশি হতে হবে।',
                ],
            ]);
        }

        $refundableTotal = round(
            (float) $sale->grand_total
            - (float) $sale->refunded_total,
            2
        );

        if ($refundTotal > $refundableTotal + 0.01) {
            throw ValidationException::withMessages([
                'items' => [
                    "সর্বোচ্চ refundable amount {$refundableTotal} {$sale->currency}।",
                ],
            ]);
        }
    }

    private function validatePaymentMethod(
        string $paymentMethod
    ): void {
        $allowedMethods = [
            'cash',
            'card',
            'bank',
            'mobile_banking',
            'manual',
            'mixed',
        ];

        if (!in_array(
            $paymentMethod,
            $allowedMethods,
            true
        )) {
            throw ValidationException::withMessages([
                'payment_method' => [
                    'Refund payment method সঠিক নয়।',
                ],
            ]);
        }
    }

    private function restockInventory(
        array $context,
        PosSale $sale,
        PosRefund $refund,
        array $refundItem
    ): void {
        $query = InventoryLevel::query()
            ->where(
                'location_id',
                $sale->location_id
            )
            ->where(
                'product_id',
                $refundItem['product_id']
            );

        if ($refundItem['variant_id']) {
            $query->where(
                'variant_id',
                $refundItem['variant_id']
            );
        } else {
            $query->whereNull('variant_id');
        }

        $inventoryLevel = $query
            ->lockForUpdate()
            ->first();

        if (!$inventoryLevel) {
            $inventoryLevel = InventoryLevel::query()->create([
                'location_id' => $sale->location_id,
                'product_id' => $refundItem['product_id'],
                'variant_id' => $refundItem['variant_id'],
                'on_hand' => 0,
                'committed' => 0,
                'unavailable' => 0,
                'incoming' => 0,
                'track_quantity' => true,
            ]);
        }

        $beforeQuantity = (int) $inventoryLevel->on_hand;

        $afterQuantity = $beforeQuantity
            + $refundItem['quantity'];

        $inventoryLevel->update([
            'on_hand' => $afterQuantity,
        ]);

       
        InventoryMovement::query()->create([
    'location_id' => $sale->location_id,
    'product_id' => $refundItem['product_id'],
    'variant_id' => $refundItem['variant_id'],
    'type' => 'return',
    'quantity_change' => $refundItem['quantity'],
    'quantity_before' => $beforeQuantity,
    'quantity_after' => $afterQuantity,
    'reference_type' => PosRefund::class,
    'reference_id' => $refund->id,
    'note' => 'POS refund: ' . $refund->refund_number,
    'created_by' => $context['user_id'],
]);



        $this->syncProductQuantity(
            $refundItem['product_id'],
            $refundItem['variant_id']
        );
    }

    private function syncProductQuantity(
        int $productId,
        ?int $variantId
    ): void {
        if ($variantId) {
            $variantQuantity = InventoryLevel::query()
                ->where(
                    'variant_id',
                    $variantId
                )
                ->sum('on_hand');

            ProductVariant::query()
                ->whereKey($variantId)
                ->update([
                    'quantity' => $variantQuantity,
                ]);

            $productQuantity = InventoryLevel::query()
                ->where(
                    'product_id',
                    $productId
                )
                ->whereNotNull('variant_id')
                ->sum('on_hand');

            Product::query()
                ->whereKey($productId)
                ->update([
                    'quantity' => $productQuantity,
                ]);

            return;
        }

        $productQuantity = InventoryLevel::query()
            ->where(
                'product_id',
                $productId
            )
            ->whereNull('variant_id')
            ->sum('on_hand');

        Product::query()
            ->whereKey($productId)
            ->update([
                'quantity' => $productQuantity,
            ]);
    }

    private function updateOrder(
        PosSale $sale,
        bool $fullyRefunded
    ): void {
        $order = Order::query()
            ->whereKey($sale->order_id)
            ->lockForUpdate()
            ->first();

        if (!$order) {
            return;
        }

        $order->update([
            'status' => $fullyRefunded
                ? 'refunded'
                : $order->status,
            'payment_status' => $fullyRefunded
                ? 'refunded'
                : 'partially_refunded',
        ]);
    }

    private function updatePosPayments(
        PosSale $sale,
        string $paymentMethod,
        bool $fullyRefunded
    ): void {
        $query = PosPayment::query()
            ->where(
                'pos_sale_id',
                $sale->id
            );

        if (
            $paymentMethod !== 'mixed'
            && $sale->primary_payment_method === 'mixed'
        ) {
            $query->where(
                'payment_method',
                $paymentMethod
            );
        }

        if ($fullyRefunded) {
            $query->update([
                'status' => 'refunded',
                'refunded_at' => now(),
            ]);
        }
    }

    private function createPaymentTransaction(
        PosSale $sale,
        PosRefund $refund,
        string $paymentMethod,
        float $refundTotal
    ): void {
        PaymentTransaction::query()->create([
            'order_id' => $sale->order_id,
            'gateway' => 'pos_' . $paymentMethod,
            'type' => 'refund',
            'status' => 'succeeded',
            'amount' => $refundTotal,
            'currency' => $sale->currency,
            'transaction_id' => $refund->payment_reference
                ?: 'POS-REFUND-' . Str::upper(
                    Str::random(14)
                ),
            'metadata' => [
                'pos_sale_id' => $sale->id,
                'pos_refund_id' => $refund->id,
                'refund_number' => $refund->refund_number,
                'reason' => $refund->reason,
            ],
        ]);
    }

    private function updateRegisterCashRefund(
        PosSale $sale,
        float $refundTotal
    ): void {
        if (!$sale->register_session_id) {
            return;
        }

        $registerSession = PosRegisterSession::query()
            ->whereKey($sale->register_session_id)
            ->lockForUpdate()
            ->first();

        if (!$registerSession) {
            return;
        }

        $registerSession->increment(
            'cash_refunds',
            $refundTotal
        );
    }

    private function generateRefundNumber(): string
    {
        do {
            $number = 'REFUND-'
                . now()->format('Ymd')
                . '-'
                . Str::upper(
                    Str::random(8)
                );
        } while (
            PosRefund::query()
                ->where(
                    'refund_number',
                    $number
                )
                ->exists()
        );

        return $number;
    }
}  
