<?php

namespace App\Services\Pos;

use App\Models\InventoryLevel;
use App\Models\InventoryMovement;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentTransaction;
use App\Models\PosPayment;
use App\Models\PosRegisterSession;
use App\Models\PosSale;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PosCheckoutService
{
    public function checkout(array $context, array $data): array
    {
        return DB::transaction(function () use ($context, $data) {
            $userId = (int) $context['user_id'];
            $locationId = (int) $context['location_id'];
            $vendorId = $context['vendor_id']
                ? (int) $context['vendor_id']
                : null;

            $registerSession = $this->getRegisterSession(
                $userId,
                $vendorId,
                $locationId,
                (int) $data['register_session_id']
            );

            $cartItems = $this->prepareCartItems(
                $context,
                $data['items']
            );

            if (empty($cartItems)) {
                throw ValidationException::withMessages([
                    'items' => [
                        'Cart খালি রাখা যাবে না।',
                    ],
                ]);
            }

            $subtotal = round(
                collect($cartItems)->sum('line_total'),
                2
            );

            $discount = $this->calculateDiscount(
                $subtotal,
                $data['discount'] ?? null
            );

            $taxableAmount = max(
                0,
                $subtotal - $discount['amount']
            );

            $taxRate = round(
                (float) ($data['tax_rate'] ?? 0),
                2
            );

            if ($taxRate < 0 || $taxRate > 100) {
                throw ValidationException::withMessages([
                    'tax_rate' => [
                        'Tax rate 0 থেকে 100-এর মধ্যে হতে হবে।',
                    ],
                ]);
            }

            $taxTotal = round(
                ($taxableAmount * $taxRate) / 100,
                2
            );

            $grandTotal = round(
                $taxableAmount + $taxTotal,
                2
            );

            $paymentResult = $this->preparePayments(
                $data['payments'],
                $grandTotal
            );

            $order = $this->createOrder(
                $data,
                $subtotal,
                $discount,
                $taxTotal,
                $grandTotal,
                $paymentResult
            );

            foreach ($cartItems as $cartItem) {
                $this->createOrderItem(
                    $context,
                    $order,
                    $cartItem
                );
            }

            $sale = $this->createPosSale(
                $context,
                $data,
                $order,
                $registerSession,
                $cartItems,
                $subtotal,
                $discount,
                $taxRate,
                $taxTotal,
                $grandTotal,
                $paymentResult
            );

            foreach ($paymentResult['payments'] as $payment) {
                $this->createPayment(
                    $sale,
                    $order,
                    $userId,
                    $payment
                );
            }

            foreach ($cartItems as $cartItem) {
                $this->deductInventory(
                    $context,
                    $order,
                    $cartItem
                );
            }

            if ($paymentResult['cash_applied'] > 0) {
                $registerSession->increment(
                    'cash_sales',
                    $paymentResult['cash_applied']
                );
            }

            return [
                'message' => 'POS sale সফলভাবে সম্পন্ন হয়েছে।',

                'order' => [
                    'id' => $order->id,
                    'order_no' => $order->order_no,
                    'status' => $order->status,
                    'payment_status' => $order->payment_status,
                ],

              'sale' => [
    'id' => $sale->id,
    'sale_number' => $sale->sale_number,
    'subtotal' => (float) $sale->subtotal,
    'discount_total' => (float) $sale->discount_total,
    'tax_total' => (float) $sale->tax_total,
    'grand_total' => (float) $sale->grand_total,
    'amount_paid' => (float) $sale->amount_paid,
    'change_amount' => (float) $sale->change_amount,
    'payment_method' => $sale->primary_payment_method,
    'payment_status' => $sale->payment_status,
],

                'receipt' => [
                    'items' => $cartItems,
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'tax_rate' => $taxRate,
                    'tax_total' => $taxTotal,
                    'grand_total' => $grandTotal,
                    'amount_received' => $paymentResult['received_total'],
                    'change' => $paymentResult['change'],
                ],
            ];
        }, 3);
    }

    private function getRegisterSession(
        int $userId,
        ?int $vendorId,
        int $locationId,
        int $registerSessionId
    ): PosRegisterSession {
        $query = PosRegisterSession::query()
            ->whereKey($registerSessionId)
            ->where('location_id', $locationId)
            ->where('cashier_id', $userId)
            ->where('status', 'open');

        if ($vendorId) {
            $query->where('vendor_id', $vendorId);
        } else {
            $query->whereNull('vendor_id');
        }

        $registerSession = $query
            ->lockForUpdate()
            ->first();

        if (!$registerSession) {
            throw ValidationException::withMessages([
                'register_session_id' => [
                    'এই location-এর জন্য active register session পাওয়া যায়নি।',
                ],
            ]);
        }

        return $registerSession;
    }

    private function prepareCartItems(
        array $context,
        array $items
    ): array {
        $preparedItems = [];

        foreach ($items as $index => $item) {
            $quantity = (int) ($item['quantity'] ?? 0);

            if ($quantity < 1) {
                throw ValidationException::withMessages([
                    "items.$index.quantity" => [
                        'Quantity কমপক্ষে 1 হতে হবে।',
                    ],
                ]);
            }

            $product = Product::query()
                ->whereKey($item['product_id'])
                ->where('status', 'active')
                ->where('point_of_sale', true)
                ->lockForUpdate()
                ->first();

            if (!$product) {
                throw ValidationException::withMessages([
                    "items.$index.product_id" => [
                        'Product পাওয়া যায়নি অথবা POS-এর জন্য active নয়।',
                    ],
                ]);
            }

            $this->validateProductOwnership(
                $context,
                $product,
                $index
            );

            $variant = $this->resolveVariant(
                $product,
                $item['variant_id'] ?? null,
                $index
            );

            $unitPrice = round(
                (float) ($variant?->price ?? $product->price),
                2
            );

            if ($unitPrice < 0) {
                throw ValidationException::withMessages([
                    "items.$index.product_id" => [
                        'Product price সঠিক নয়।',
                    ],
                ]);
            }

            $inventoryLevel = $this->getInventoryLevel(
                (int) $context['location_id'],
                $product,
                $variant
            );

            $trackQuantity = (bool) (
                $inventoryLevel->track_quantity
                ?? $product->track_quantity
            );

            $availableQuantity = max(
                0,
                (int) $inventoryLevel->on_hand
                - (int) $inventoryLevel->committed
                - (int) $inventoryLevel->unavailable
            );

            if (
                $trackQuantity
                && !$product->continue_selling_when_out_of_stock
                && $quantity > $availableQuantity
            ) {
                throw ValidationException::withMessages([
                    "items.$index.quantity" => [
                        "{$product->title} এর available stock {$availableQuantity}টি।",
                    ],
                ]);
            }

            $preparedItems[] = [
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'product_title' => $product->title,
                'variant_title' => $variant?->title,
                'sku' => $variant?->sku ?? $product->sku,
                'barcode' => $variant?->barcode ?? $product->barcode,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'compare_at_price' => round(
                    (float) (
                        $variant?->compare_at_price
                        ?? $product->compare_at_price
                        ?? 0
                    ),
                    2
                ),
                'line_total' => round(
                    $unitPrice * $quantity,
                    2
                ),
                'note' => $item['note'] ?? null,
                'inventory_level_id' => $inventoryLevel->id,
                'track_quantity' => $trackQuantity,
                'available_quantity' => $availableQuantity,
            ];
        }

        return $preparedItems;
    }

    private function validateProductOwnership(
        array $context,
        Product $product,
        int $index
    ): void {
        if ($context['role'] === 'vendor') {
            if (
                $product->source !== 'vendor'
                || (int) $product->created_by
                    !== (int) $context['vendor_user_id']
            ) {
                throw ValidationException::withMessages([
                    "items.$index.product_id" => [
                        'এই product বর্তমান vendor-এর নয়।',
                    ],
                ]);
            }

            return;
        }

        if ($product->source !== 'admin') {
            throw ValidationException::withMessages([
                "items.$index.product_id" => [
                    'Admin POS থেকে vendor product বিক্রি করা যাবে না।',
                ],
            ]);
        }
    }

    private function resolveVariant(
        Product $product,
        ?int $variantId,
        int $index
    ): ?ProductVariant {
        if ($variantId) {
            $variant = ProductVariant::query()
                ->whereKey($variantId)
                ->where('product_id', $product->id)
                ->where('is_active', true)
                ->lockForUpdate()
                ->first();

            if (!$variant) {
                throw ValidationException::withMessages([
                    "items.$index.variant_id" => [
                        'নির্বাচিত product variant পাওয়া যায়নি।',
                    ],
                ]);
            }

            return $variant;
        }

        $hasVariants = ProductVariant::query()
            ->where('product_id', $product->id)
            ->where('is_active', true)
            ->exists();

        if ($hasVariants) {
            throw ValidationException::withMessages([
                "items.$index.variant_id" => [
                    'এই product-এর একটি variant নির্বাচন করুন।',
                ],
            ]);
        }

        return null;
    }

    private function getInventoryLevel(
        int $locationId,
        Product $product,
        ?ProductVariant $variant
    ): InventoryLevel {
        $query = InventoryLevel::query()
            ->where('location_id', $locationId)
            ->where('product_id', $product->id);

        if ($variant) {
            $query->where('variant_id', $variant->id);
        } else {
            $query->whereNull('variant_id');
        }

        $inventoryLevel = $query
            ->lockForUpdate()
            ->first();

        if ($inventoryLevel) {
            return $inventoryLevel;
        }

        InventoryLevel::query()->create([
            'location_id' => $locationId,
            'product_id' => $product->id,
            'variant_id' => $variant?->id,
            'on_hand' => (int) (
                $variant?->quantity
                ?? $product->quantity
                ?? 0
            ),
            'committed' => 0,
            'unavailable' => 0,
            'incoming' => 0,
            'track_quantity' => (bool) $product->track_quantity,
        ]);

        $newQuery = InventoryLevel::query()
            ->where('location_id', $locationId)
            ->where('product_id', $product->id);

        if ($variant) {
            $newQuery->where('variant_id', $variant->id);
        } else {
            $newQuery->whereNull('variant_id');
        }

        return $newQuery
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function calculateDiscount(
        float $subtotal,
        ?array $discount
    ): array {
        if (
            !$discount
            || empty($discount['type'])
            || (float) ($discount['value'] ?? 0) <= 0
        ) {
            return [
                'type' => null,
                'value' => 0,
                'amount' => 0,
                'reason' => null,
            ];
        }

        $type = $discount['type'];
        $value = round(
            (float) $discount['value'],
            2
        );

        if (!in_array($type, ['fixed', 'percentage'], true)) {
            throw ValidationException::withMessages([
                'discount.type' => [
                    'Discount type fixed অথবা percentage হতে হবে।',
                ],
            ]);
        }

        if ($value < 0) {
            throw ValidationException::withMessages([
                'discount.value' => [
                    'Discount value negative হতে পারবে না।',
                ],
            ]);
        }

        if ($type === 'percentage' && $value > 100) {
            throw ValidationException::withMessages([
                'discount.value' => [
                    'Percentage discount 100-এর বেশি হতে পারবে না।',
                ],
            ]);
        }

        $amount = $type === 'percentage'
            ? round(($subtotal * $value) / 100, 2)
            : round($value, 2);

        return [
            'type' => $type,
            'value' => $value,
            'amount' => min($amount, $subtotal),
            'reason' => $discount['reason'] ?? null,
        ];
    }


    private function preparePayments(
    array $payments,
    float $grandTotal
): array {
    if (empty($payments)) {
        throw ValidationException::withMessages([
            'payments' => [
                'কমপক্ষে একটি payment method দিতে হবে।',
            ],
        ]);
    }

    $allowedMethods = [
        'cash',
        'card',
        'bank',
        'mobile_banking',
        'manual',
    ];

    $preparedPayments = [];
    $receivedTotal = 0;
    $cashReceivedTotal = 0;

    foreach ($payments as $index => $payment) {
        $method = $payment['method'] ?? null;

        $amount = round(
            (float) ($payment['amount'] ?? 0),
            2
        );

        if (!in_array($method, $allowedMethods, true)) {
            throw ValidationException::withMessages([
                "payments.$index.method" => [
                    'Payment method সঠিক নয়।',
                ],
            ]);
        }

        if ($amount <= 0) {
            throw ValidationException::withMessages([
                "payments.$index.amount" => [
                    'Payment amount অবশ্যই 0-এর বেশি হতে হবে।',
                ],
            ]);
        }

        if (
            $method === 'card'
            && !empty($payment['last_four'])
            && strlen((string) $payment['last_four']) !== 4
        ) {
            throw ValidationException::withMessages([
                "payments.$index.last_four" => [
                    'Card-এর শেষ চারটি digit দিতে হবে।',
                ],
            ]);
        }

        $receivedTotal += $amount;

        if ($method === 'cash') {
            $cashReceivedTotal += $amount;
        }

        $preparedPayments[] = [
            'method' => $method,
            'received_amount' => $amount,
            'applied_amount' => $amount,
            'reference' => $payment['reference'] ?? null,
            'last_four' => $payment['last_four'] ?? null,
            'metadata' => $payment['metadata'] ?? [],
        ];
    }

    $receivedTotal = round($receivedTotal, 2);
    $cashReceivedTotal = round($cashReceivedTotal, 2);

    if ($receivedTotal < $grandTotal) {
        throw ValidationException::withMessages([
            'payments' => [
                'Payment amount grand total-এর চেয়ে কম।',
            ],
        ]);
    }

    $change = round(
        $receivedTotal - $grandTotal,
        2
    );

    if ($change > 0 && $cashReceivedTotal <= 0) {
        throw ValidationException::withMessages([
            'payments' => [
                'Cash payment ছাড়া অতিরিক্ত payment নেওয়া যাবে না।',
            ],
        ]);
    }

    if ($change > $cashReceivedTotal) {
        throw ValidationException::withMessages([
            'payments' => [
                'Cash payment-এর চেয়ে change amount বেশি হতে পারবে না।',
            ],
        ]);
    }

    $remainingChange = $change;

    if ($remainingChange > 0) {
        foreach ($preparedPayments as &$payment) {
            if (
                $payment['method'] !== 'cash'
                || $remainingChange <= 0
            ) {
                continue;
            }

            $deductibleAmount = min(
                $payment['applied_amount'],
                $remainingChange
            );

            $payment['applied_amount'] = round(
                $payment['applied_amount'] - $deductibleAmount,
                2
            );

            $remainingChange = round(
                $remainingChange - $deductibleAmount,
                2
            );
        }

        unset($payment);
    }

    $preparedPayments = array_values(
        array_filter(
            $preparedPayments,
            fn (array $payment): bool =>
                $payment['applied_amount'] > 0
        )
    );

    $appliedTotal = round(
        collect($preparedPayments)
            ->sum('applied_amount'),
        2
    );

    if (abs($appliedTotal - $grandTotal) > 0.01) {
        throw ValidationException::withMessages([
            'payments' => [
                'Payment calculation সঠিক হয়নি। আবার চেষ্টা করুন।',
            ],
        ]);
    }

    $methods = array_values(
        array_unique(
            array_column(
                $preparedPayments,
                'method'
            )
        )
    );

    $primaryMethod = count($methods) > 1
        ? 'mixed'
        : ($methods[0] ?? 'cash');

    $cashApplied = round(
        (float) collect($preparedPayments)
            ->where('method', 'cash')
            ->sum('applied_amount'),
        2
    );

    return [
        'payments' => $preparedPayments,
        'received_total' => $receivedTotal,
        'applied_total' => $appliedTotal,
        'change' => $change,
        'primary_method' => $primaryMethod,
        'cash_applied' => $cashApplied,
    ];
}






   private function createOrder(
    array $data,
    float $subtotal,
    array $discount,
    float $taxTotal,
    float $grandTotal,
    array $paymentResult
): Order {
    return Order::query()->create([
        'user_id' => $data['customer_id'] ?? null,
        'order_no' => $this->generateOrderNumber(),

        'status' => 'delivered',
        'payment_method' => $paymentResult['primary_method'],
        'payment_status' => 'paid',

        'channel' => 'pos',
        'fulfillment_status' => 'fulfilled',
        'delivery_status' => 'delivered',
        'shipping_method' => 'pickup',

        'currency' => $data['currency'] ?? 'USD',

        'subtotal' => $subtotal,
        'discount_total' => $discount['amount'],
        'shipping_total' => 0,
        'tax_total' => $taxTotal,
        'grand_total' => $grandTotal,

        'coupon_code' => null,
        'notes' => $data['note'] ?? null,

        'placed_at' => now(),
        'paid_at' => now(),
        'fulfilled_at' => now(),
    ]);
}





   private function createOrderItem(
    array $context,
    Order $order,
    array $cartItem
): void {
    $vendor = $context['vendor'] ?? null;

    OrderItem::query()->create([
        'order_id' => $order->id,

        'store_id' => $context['vendor_id'] ?? null,

        'store_name' => $vendor['store_name']
            ?? 'Storify',

        'product_id' => $cartItem['product_id'],

        'variant_id' => $cartItem['variant_id'],

        'product_name' => $cartItem['product_title'],

        'product_slug' => $cartItem['product_slug']
            ?? null,

        'variant_name' => $cartItem['variant_title']
            ?? null,

        'sku' => $cartItem['sku'],

        'quantity' => $cartItem['quantity'],

        'unit_price' => $cartItem['unit_price'],

        'compare_at_price' => $cartItem['compare_at_price']
            ?? null,

        'line_total' => $cartItem['line_total'],
    ]);
}



    private function createPosSale(
    array $context,
    array $data,
    Order $order,
    PosRegisterSession $registerSession,
    array $cartItems,
    float $subtotal,
    array $discount,
    float $taxRate,
    float $taxTotal,
    float $grandTotal,
    array $paymentResult
): PosSale {
    return PosSale::query()->create([
        'order_id' => $order->id,
        'register_session_id' => $registerSession->id,
        'vendor_id' => $context['vendor_id'] ?? null,
        'location_id' => $context['location_id'],
        'cashier_id' => $context['user_id'],
        'customer_id' => $data['customer_id'] ?? null,

        'sale_number' => $this->generateSaleNumber(),
        'status' => 'completed',
        'currency' => $data['currency'] ?? 'USD',

        'subtotal' => $subtotal,

        'discount_type' => $discount['type'],
        'discount_value' => $discount['value'],
        'discount_total' => $discount['amount'],
        'discount_data' => $discount,

        'tax_rate' => $taxRate,
        'tax_total' => $taxTotal,
        'grand_total' => $grandTotal,

        'amount_paid' => $paymentResult['received_total'],
        'change_amount' => $paymentResult['change'],
        'refunded_total' => 0,

        'payment_status' => 'paid',
        'primary_payment_method' => $paymentResult['primary_method'],

        'cart_snapshot' => $cartItems,

        'customer_note' => $data['note'] ?? null,
        'internal_note' => $data['internal_note'] ?? null,

        'completed_at' => now(),
        'refunded_at' => null,
        'cancelled_at' => null,
    ]);
}



private function createPayment(
    PosSale $sale,
    Order $order,
    int $receivedBy,
    array $payment
): void {
    $metadata = array_merge(
        $payment['metadata'] ?? [],
        [
            'received_amount' => $payment['received_amount'],
            'applied_amount' => $payment['applied_amount'],
        ]
    );

    $transactionId = $payment['reference']
        ?: 'POS-' . Str::upper(Str::random(16));

    PosPayment::query()->create([
        'pos_sale_id' => $sale->id,
        'received_by' => $receivedBy,
        'payment_method' => $payment['method'],
        'status' => 'succeeded',
        'amount' => $payment['applied_amount'],
        'currency' => $sale->currency,
        'reference' => $transactionId,
        'card_last_four' => $payment['last_four'] ?? null,
        'metadata' => $metadata,
        'paid_at' => now(),
        'refunded_at' => null,
    ]);

    PaymentTransaction::query()->create([
        'order_id' => $order->id,
        'gateway' => 'pos_' . $payment['method'],
        'type' => 'charge',
        'status' => 'succeeded',
        'amount' => $payment['applied_amount'],
        'currency' => $sale->currency,
        'transaction_id' => $transactionId,
        'metadata' => $metadata,
    ]);
}








    private function deductInventory(
        array $context,
        Order $order,
        array $cartItem
    ): void {
        if (!$cartItem['track_quantity']) {
            return;
        }

        $inventoryLevel = InventoryLevel::query()
            ->whereKey($cartItem['inventory_level_id'])
            ->lockForUpdate()
            ->firstOrFail();

        $beforeQuantity = (int) $inventoryLevel->on_hand;

        $afterQuantity = $beforeQuantity
            - $cartItem['quantity'];

        $product = Product::query()
            ->whereKey($cartItem['product_id'])
            ->firstOrFail();

        if (
            $afterQuantity < 0
            && !$product->continue_selling_when_out_of_stock
        ) {
            throw ValidationException::withMessages([
                'items' => [
                    "{$cartItem['product_title']} এর পর্যাপ্ত stock নেই।",
                ],
            ]);
        }

        $inventoryLevel->update([
            'on_hand' => $afterQuantity,
        ]);

        InventoryMovement::query()->create([
            'location_id' => $context['location_id'],
            'product_id' => $cartItem['product_id'],
            'variant_id' => $cartItem['variant_id'],
            'type' => 'sale',
            'quantity_change' => -$cartItem['quantity'],
            'quantity_before' => $beforeQuantity,
            'quantity_after' => $afterQuantity,
            'reference_type' => Order::class,
            'reference_id' => $order->id,
            'note' => 'POS sale: ' . $order->order_no,
            'created_by' => $context['user_id'],
        ]);

        $this->syncProductQuantity(
            $cartItem['product_id'],
            $cartItem['variant_id']
        );
    }

    private function syncProductQuantity(
        int $productId,
        ?int $variantId
    ): void {
        if ($variantId) {
            $variantQuantity = InventoryLevel::query()
                ->where('variant_id', $variantId)
                ->sum('on_hand');

            ProductVariant::query()
                ->whereKey($variantId)
                ->update([
                    'quantity' => $variantQuantity,
                ]);

            $productQuantity = InventoryLevel::query()
                ->where('product_id', $productId)
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
            ->where('product_id', $productId)
            ->whereNull('variant_id')
            ->sum('on_hand');

        Product::query()
            ->whereKey($productId)
            ->update([
                'quantity' => $productQuantity,
            ]);
    }

    private function generateOrderNumber(): string
    {
        do {
            $number = 'POS-'
                . now()->format('Ymd')
                . '-'
                . Str::upper(Str::random(6));
        } while (
            Order::query()
                ->where('order_no', $number)
                ->exists()
        );

        return $number;
    }

    private function generateSaleNumber(): string
    {
        do {
            $number = 'SALE-'
                . now()->format('Ymd')
                . '-'
                . Str::upper(Str::random(8));
        } while (
            PosSale::query()
                ->where('sale_number', $number)
                ->exists()
        );

        return $number;
    }
}
