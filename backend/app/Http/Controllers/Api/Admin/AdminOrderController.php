<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\Product;
use App\Models\User;
use App\Models\PaymentTransaction;
use App\Models\ProductVariant;
use App\Models\OrderReturn;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use App\Models\PaymentSetting;
use Stripe\StripeClient;

use Throwable;

class AdminOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim(
            (string) $request->query('search', '')
        );

        $tab = $request->query(
            'tab',
            'all'
        );

        $perPage = (int) $request->query(
            'per_page',
            15
        );

        if ($perPage < 1) {
            $perPage = 15;
        }

        if ($perPage > 100) {
            $perPage = 100;
        }

        $allowedTabs = [
            'all',
            'unfulfilled',
            'unpaid',
            'open',
            'archived',
        ];

        if (!in_array($tab, $allowedTabs, true)) {
            $tab = 'all';
        }

        $query = Order::query()
            ->select('orders.*')
            ->leftJoin(
                'users',
                'users.id',
                '=',
                'orders.user_id'
            )
            ->with([
                'user:id,name,email',
                'items:id,order_id,product_name,variant_name,quantity',
            ]);

        if ($search !== '') {
            $like = '%' . $search . '%';

            $query->whereRaw(
                '(
                    orders.order_no LIKE ?
                    OR users.name LIKE ?
                    OR users.email LIKE ?
                )',
                [
                    $like,
                    $like,
                    $like,
                ]
            );
        }

        if ($tab === 'unfulfilled') {
            $query->where(
                'orders.fulfillment_status',
                'unfulfilled'
            );
        }

        if ($tab === 'unpaid') {
            $query->where(
                'orders.payment_status',
                '!=',
                'paid'
            );
        }

        if ($tab === 'open') {
            $query->whereIn(
                'orders.status',
                [
                    'pending',
                    'processing',
                ]
            );
        }

        if ($tab === 'archived') {
            $query->where(
                'orders.status',
                'archived'
            );
        }

        $orders = $query
            ->orderByDesc('orders.id')
            ->paginate($perPage);

        $totalOrders = Order::query()
            ->count();

        $openOrders = Order::query()
            ->whereIn(
                'status',
                [
                    'pending',
                    'processing',
                ]
            )
            ->count();

        $paidOrders = Order::query()
            ->where(
                'payment_status',
                'paid'
            )
            ->count();

        $totalRevenue = (float) Order::query()
            ->where(
                'payment_status',
                'paid'
            )
            ->sum('grand_total');

        $averageOrderValue = 0;

        if ($paidOrders > 0) {
            $averageOrderValue = round(
                $totalRevenue / $paidOrders,
                2
            );
        }

        return response()->json([
            'success' => true,

            'stats' => [
                'total_orders' => $totalOrders,
                'open_orders' => $openOrders,
                'paid_orders' => $paidOrders,
                'total_revenue' => round(
                    $totalRevenue,
                    2
                ),
                'average_order_value' => $averageOrderValue,
            ],

            'orders' => $orders,
        ]);
    }



   public function show(Order $order): JsonResponse
{
    $order->load([
        'user',
        'items.product.media',
        'items.variant.media',
        'shippingAddress',
        'billingAddress',
        'paymentTransactions',
    ]);

    $order->items->transform(function ($item) {
        $imageUrl = null;

        if (
            $item->variant &&
            $item->variant->media
        ) {
            $imageUrl = asset(
                $item->variant->media->file_path
            );
        }

        if (
            !$imageUrl &&
            $item->product &&
            $item->product->media->isNotEmpty()
        ) {
            $cover = $item->product->media
                ->firstWhere('is_cover', true);

            $media = $cover
                ?? $item->product->media->first();

            if ($media) {
                $imageUrl = asset(
                    $media->file_path
                );
            }
        }

        $item->setAttribute(
            'image_url',
            $imageUrl
        );

        return $item;
    });

    $order->setAttribute(
        'refundable_amount',
        $this->getRefundableAmount($order)
    );

    return response()->json([
        'success' => true,
        'order' => $order,
    ]);
}



public function markPaid(Order $order): JsonResponse
{
    if ($order->payment_status === 'paid') {
        return response()->json([
            'success' => true,
            'message' => 'Order is already marked as paid.',
            'order' => $order,
        ]);
    }

    if ($order->status === 'cancelled') {
        return response()->json([
            'success' => false,
            'message' => 'Cancelled order cannot be marked as paid.',
        ], 422);
    }

    $order->update([
        'payment_status' => 'paid',
        'status' => 'processing',
        'paid_at' => now(),
    ]);

    return response()->json([
        'success' => true,
        'message' => 'Order marked as paid successfully.',
        'order' => $order->fresh(),
    ]);
}




    public function markShipped(Order $order): JsonResponse
    {
        if ($order->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Cancelled order cannot be shipped.',
            ], 422);
        }

        $order->update([
            'status' => 'processing',
            'fulfillment_status' => 'fulfilled',
            'delivery_status' => 'shipped',
            'fulfilled_at' => $order->fulfilled_at ?? now(),
            'shipped_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order marked as shipped.',
            'order' => $order->fresh(),
        ]);
    }

    public function cancel(Order $order): JsonResponse
    {
        if ($order->status === 'cancelled') {
            return response()->json([
                'success' => true,
                'message' => 'Order is already cancelled.',
                'order' => $order,
            ]);
        }

        $order->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order cancelled successfully.',
            'order' => $order->fresh(),
        ]);
    }

    public function destroy(Order $order): JsonResponse
    {
        $order->delete();

        return response()->json([
            'success' => true,
            'message' => 'Order deleted successfully.',
        ]);
    }


    public function invoice(Order $order)
{
    $order->load([
        'user',
        'items',
        'shippingAddress',
        'billingAddress',
        'paymentTransactions',
    ]);

    $pdf = Pdf::loadView(
        'admin.orders.invoice',
        [
            'order' => $order,
        ]
    );

    $pdf->setPaper(
        'a4',
        'portrait'
    );

    $fileName =
        'invoice-'
        . $order->order_no
        . '.pdf';

    return $pdf->download(
        $fileName
    );
}



public function createProducts(Request $request): JsonResponse
{
    $search = trim((string) $request->query('search', ''));
    $perPage = min(max((int) $request->query('per_page', 30), 10), 100);

    $products = Product::query()
        ->with([
            'media',
            'variants.media',
        ])
        ->when($search !== '', function ($query) use ($search) {
            $query->where(function ($query) use ($search) {
                $query->where('title', 'like', '%' . $search . '%')
                    ->orWhere('sku', 'like', '%' . $search . '%')
                    ->orWhereHas('variants', function ($variantQuery) use ($search) {
                        $variantQuery->where('sku', 'like', '%' . $search . '%');
                    });
            });
        })
        ->orderBy('title')
        ->paginate($perPage);

    $rows = [];

    foreach ($products->items() as $product) {
        if ($product->variants->isNotEmpty()) {
            foreach ($product->variants as $variant) {
                $rows[] = [
                    'key' => $product->id . '-' . $variant->id,
                    'product_id' => $product->id,
                    'variant_id' => $variant->id,
                    'product_name' => $product->title,
                    'variant_name' => $variant->name ?? $variant->title ?? null,
                    'sku' => $variant->sku ?? $product->sku,
                    'price' => (float) ($variant->price ?? $product->price ?? 0),
                    'compare_at_price' => $variant->compare_at_price !== null ? (float) $variant->compare_at_price : null,
                    'available' => $this->getVariantAvailableQuantity($variant),
                    'track_quantity' => (bool) ($variant->track_quantity ?? true),
                    'continue_selling_when_out_of_stock' => (bool) ($variant->continue_selling_when_out_of_stock ?? false),
                    'image_url' => $this->getVariantImageUrl($variant, $product),
                ];
            }

            continue;
        }

        $rows[] = [
            'key' => $product->id . '-product',
            'product_id' => $product->id,
            'variant_id' => null,
            'product_name' => $product->title,
            'variant_name' => null,
            'sku' => $product->sku,
            'price' => (float) ($product->price ?? 0),
            'compare_at_price' => $product->compare_at_price !== null ? (float) $product->compare_at_price : null,
            'available' => $this->getProductAvailableQuantity($product),
            'track_quantity' => (bool) ($product->track_quantity ?? true),
            'continue_selling_when_out_of_stock' => (bool) ($product->continue_selling_when_out_of_stock ?? false),
            'image_url' => $this->getProductImageUrl($product),
        ];
    }

    return response()->json([
        'success' => true,
        'products' => $rows,
        'pagination' => [
            'current_page' => $products->currentPage(),
            'last_page' => $products->lastPage(),
            'per_page' => $products->perPage(),
            'total_products' => $products->total(),
        ],
    ]);
}



private function getVariantAvailableQuantity($variant): ?int
{
    $trackQuantity = (bool) ($variant->track_quantity ?? true);

    if (!$trackQuantity) {
        return null;
    }

    return max(0, (int) ($variant->quantity ?? 0));
}

private function getProductAvailableQuantity(Product $product): ?int
{
    $trackQuantity = (bool) ($product->track_quantity ?? true);

    if (!$trackQuantity) {
        return null;
    }

    return max(0, (int) ($product->quantity ?? 0));
}

private function getVariantImageUrl($variant, Product $product): ?string
{
    if ($variant->media) {
        return asset($variant->media->file_path);
    }

    return $this->getProductImageUrl($product);
}

private function getProductImageUrl(Product $product): ?string
{
    $cover = $product->media->firstWhere('is_cover', true) ?? $product->media->first();

    if (!$cover) {
        return null;
    }

    return asset($cover->file_path);
}




public function createCustomers(Request $request): JsonResponse
{
    $search = trim((string) $request->query('search', ''));

    $customers = User::query()
        ->whereIn('role', ['user', 'customer'])
        ->when($search !== '', function ($query) use ($search) {
            $query->where(function ($query) use ($search) {
                $query->where('name', 'like', '%' . $search . '%')
                    ->orWhere('first_name', 'like', '%' . $search . '%')
                    ->orWhere('last_name', 'like', '%' . $search . '%')
                    ->orWhere('email', 'like', '%' . $search . '%')
                    ->orWhere('phone', 'like', '%' . $search . '%');
            });
        })
        ->orderBy('name')
        ->limit(30)
        ->get();

    return response()->json([
        'success' => true,
        'customers' => $customers->map(function ($customer) {
            return [
                'id' => $customer->id,
                'name' => $customer->name ?: trim(
                    ($customer->first_name ?? '') . ' ' . ($customer->last_name ?? '')
                ),
                'email' => $customer->email,
                'phone' => $customer->phone,
            ];
        }),
    ]);
}


public function storeManual(Request $request): JsonResponse
{
    $validated = $request->validate([
        'customer_id' => ['required', 'integer', 'exists:users,id'],
        'items' => ['required', 'array', 'min:1'],
        'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
        'items.*.variant_id' => ['nullable', 'integer', 'exists:product_variants,id'],
        'items.*.quantity' => ['required', 'integer', 'min:1', 'max:999'],
        'discount_total' => ['nullable', 'numeric', 'min:0'],
        'shipping_total' => ['nullable', 'numeric', 'min:0'],
        'tax_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
        'customer_note' => ['nullable', 'string', 'max:2000'],
        'payment_due_later' => ['nullable', 'boolean'],
        'mark_as_paid' => ['nullable', 'boolean'],
    ]);

    $order = DB::transaction(function () use ($validated) {
        $subtotal = 0;
        $orderItems = [];

        foreach ($validated['items'] as $line) {
            $product = Product::query()
                ->with('store')
                ->lockForUpdate()
                ->findOrFail($line['product_id']);

            $variant = null;

            if (!empty($line['variant_id'])) {
                $variant = ProductVariant::query()
                    ->lockForUpdate()
                    ->where('id', $line['variant_id'])
                    ->where('product_id', $product->id)
                    ->first();

                if (!$variant) {
                    throw ValidationException::withMessages([
                        'items' => ['A selected product variant is invalid.'],
                    ]);
                }
            }

            $quantity = (int) $line['quantity'];

            $available = $variant
                ? (int) ($variant->quantity ?? 0)
                : (int) ($product->quantity ?? 0);

            $trackQuantity = $variant
                ? (bool) ($variant->track_quantity ?? true)
                : (bool) ($product->track_quantity ?? true);

            $continueSelling = $variant
                ? (bool) ($variant->continue_selling_when_out_of_stock ?? false)
                : (bool) ($product->continue_selling_when_out_of_stock ?? false);

            if ($trackQuantity && !$continueSelling && $quantity > $available) {
                throw ValidationException::withMessages([
                    'items' => [
                        'Not enough stock is available for '
                        . ($product->title ?? 'this product')
                        . '.',
                    ],
                ]);
            }

            $unitPrice = $variant
                ? (float) $variant->price
                : (float) $product->price;

            $lineTotal = round($unitPrice * $quantity, 2);

            $subtotal += $lineTotal;

            $orderItems[] = [
                'store_id' => $product->store_id ?? null,
                'store_name' => $product->store?->name ?? null,
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'product_name' => $product->title ?? 'Product',
                'product_slug' => $product->slug,
                'variant_name' => $variant?->name ?? $variant?->title,
                'sku' => $variant?->sku ?? $product->sku,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,
                'compare_at_price' => $variant?->compare_at_price ?? $product->compare_at_price,
                'line_total' => $lineTotal,
            ];
        }

        $subtotal = round($subtotal, 2);

        $discountTotal = min(
            (float) ($validated['discount_total'] ?? 0),
            $subtotal
        );

        $shippingTotal = round(
            (float) ($validated['shipping_total'] ?? 0),
            2
        );

        $taxRate = (float) ($validated['tax_rate'] ?? 0);

        $taxTotal = round(
            $subtotal * ($taxRate / 100),
            2
        );

        $grandTotal = round(
            $subtotal - $discountTotal + $shippingTotal + $taxTotal,
            2
        );

        $markAsPaid = (bool) ($validated['mark_as_paid'] ?? false);

        $order = Order::create([
            'order_no' => $this->generateManualOrderNumber(),
            'user_id' => $validated['customer_id'],
            'status' => $markAsPaid ? 'processing' : 'pending',
            'payment_method' => 'manual',
            'payment_status' => $markAsPaid ? 'paid' : 'pending',
            'channel' => 'manual',
            'fulfillment_status' => 'unfulfilled',
            'delivery_status' => 'not_shipped',
            'shipping_method' => 'manual',
            'currency' => 'USD',
            'subtotal' => $subtotal,
            'discount_total' => $discountTotal,
            'shipping_total' => $shippingTotal,
            'tax_total' => $taxTotal,
            'grand_total' => $grandTotal,
            'billing_same_as_shipping' => true,
            'marketing_emails' => false,
            'customer_note' => $validated['customer_note'] ?? null,
            'placed_at' => now(),
            'paid_at' => $markAsPaid ? now() : null,
        ]);

        foreach ($orderItems as $item) {
            $order->items()->create($item);
        }

        if ($markAsPaid) {
            PaymentTransaction::create([
                'order_id' => $order->id,
                'gateway' => 'manual',
                'status' => 'paid',
                'gateway_reference' => 'MANUAL-' . $order->order_no,
                'amount' => $order->grand_total,
                'currency' => $order->currency,
                'paid_at' => now(),
            ]);
        }

        return $order->fresh([
            'user',
            'items',
            'paymentTransactions',
        ]);
    });

    return response()->json([
        'success' => true,
        'message' => $order->payment_status === 'paid'
            ? 'Order created and marked as paid.'
            : 'Order created successfully.',
        'order' => $order,
    ], 201);
}

private function generateManualOrderNumber(): string
{
    do {
        $orderNo = 'ORD-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));
    } while (
        Order::query()->where('order_no', $orderNo)->exists()
    );

    return $orderNo;
}



public function refundReturn(
    Request $request,
    OrderReturn $orderReturn
): JsonResponse {
    $validated = $request->validate([
        'amount' => [
            'required',
            'numeric',
            'min:0.01',
        ],
        'reason' => [
            'nullable',
            'string',
            'max:2000',
        ],
    ]);

    $orderReturn->load([
        'order.items',
        'items',
    ]);

    $order = $orderReturn->order;

    if (!$order) {
        return response()->json([
            'success' => false,
            'message' => 'Order not found for this return.',
        ], 404);
    }

    if ($orderReturn->status !== 'received') {
        return response()->json([
            'success' => false,
            'message' => 'Only received returns can be refunded.',
        ], 422);
    }

    if ($orderReturn->refund_status === 'refunded') {
        return response()->json([
            'success' => false,
            'message' => 'This return has already been fully refunded.',
        ], 422);
    }

    $returnValue = 0;

    foreach ($orderReturn->items as $returnItem) {
        $orderItem = $order->items->firstWhere(
            'id',
            $returnItem->order_item_id
        );

        if (!$orderItem) {
            continue;
        }

        $returnValue += (
            (float) $orderItem->unit_price *
            (int) $returnItem->quantity
        );
    }

    $returnValue = round(
        $returnValue,
        2
    );

    if ($returnValue <= 0) {
        return response()->json([
            'success' => false,
            'message' => 'Unable to calculate the return value.',
        ], 422);
    }

    $alreadyRefunded = round(
        (float) $orderReturn->refund_amount,
        2
    );

    $remainingReturnAmount = max(
        0,
        round(
            $returnValue - $alreadyRefunded,
            2
        )
    );

    if ($remainingReturnAmount <= 0) {
        return response()->json([
            'success' => false,
            'message' => 'This return has no refundable balance remaining.',
        ], 422);
    }

    $amount = round(
        (float) $validated['amount'],
        2
    );

    if ($amount > $remainingReturnAmount) {
        return response()->json([
            'success' => false,
            'message' => 'Refund amount cannot exceed the remaining return value.',
        ], 422);
    }

    $orderRefundableAmount =
        $this->getRefundableAmount($order);

    if ($orderRefundableAmount <= 0) {
        return response()->json([
            'success' => false,
            'message' => 'This order has no refundable balance remaining.',
        ], 422);
    }

    if ($amount > $orderRefundableAmount) {
        return response()->json([
            'success' => false,
            'message' => 'Refund amount exceeds the remaining refundable balance for this order.',
        ], 422);
    }

    $refundResponse = $this->processRefund(
        $order,
        $amount
    );

    if (
        $refundResponse->getStatusCode() < 200 ||
        $refundResponse->getStatusCode() >= 300
    ) {
        return $refundResponse;
    }

    $newRefundAmount = round(
        $alreadyRefunded + $amount,
        2
    );

    $fullyRefunded =
        $newRefundAmount >=
        ($returnValue - 0.009);

    $adminNote =
        $orderReturn->admin_note;

    $reason = trim(
        (string) (
            $validated['reason'] ?? ''
        )
    );

    if ($reason !== '') {
        $refundNote =
            'Refund note: ' .
            $reason;

        $adminNote = $adminNote
            ? $adminNote . "\n" . $refundNote
            : $refundNote;
    }

    $orderReturn->update([
        'status' => $fullyRefunded
            ? 'refunded'
            : 'received',

        'refund_status' => $fullyRefunded
            ? 'refunded'
            : 'partially_refunded',

        'refund_amount' =>
            $newRefundAmount,

        'refunded_at' => $fullyRefunded
            ? now()
            : $orderReturn->refunded_at,

        'admin_note' =>
            $adminNote,
    ]);

    return response()->json([
        'success' => true,

        'message' => $fullyRefunded
            ? 'Return refund issued successfully.'
            : 'Partial return refund issued successfully.',

        'refunded_amount' =>
            $amount,

        'return_refunded_total' =>
            $newRefundAmount,

        'return_refundable_amount' => max(
            0,
            round(
                $returnValue -
                $newRefundAmount,
                2
            )
        ),

        'return' => $orderReturn->fresh([
            'order.user',
            'order.items',
            'items',
        ]),
    ]);
}



public function refundFull(Order $order): JsonResponse
{
    $refundableAmount = $this->getRefundableAmount($order);

    if ($refundableAmount <= 0) {
        return response()->json([
            'success' => false,
            'message' => 'This order has no refundable balance remaining.',
        ], 422);
    }

    return $this->processRefund(
        $order,
        $refundableAmount
    );
}

public function refundPartial(Request $request, Order $order): JsonResponse
{
    $validated = $request->validate([
        'amount' => [
            'required',
            'numeric',
            'min:0.01',
        ],
    ]);

    $amount = round(
        (float) $validated['amount'],
        2
    );

    $refundableAmount = $this->getRefundableAmount($order);

    if ($refundableAmount <= 0) {
        return response()->json([
            'success' => false,
            'message' => 'This order has no refundable balance remaining.',
        ], 422);
    }

    if ($amount > $refundableAmount) {
        return response()->json([
            'success' => false,
            'message' => 'Refund amount cannot exceed the remaining refundable balance.',
        ], 422);
    }

    return $this->processRefund(
        $order,
        $amount
    );
}



private function processRefund(Order $order, float $amount): JsonResponse
{
    $paymentStatus = strtolower(
        (string) $order->payment_status
    );

    if (!in_array($paymentStatus, ['paid', 'partially_refunded'], true)) {
        return response()->json([
            'success' => false,
            'message' => 'Only paid orders can be refunded.',
        ], 422);
    }

    try {
        $result = DB::transaction(function () use ($order, $amount) {
            $order = Order::query()
                ->lockForUpdate()
                ->findOrFail($order->id);

            $refundableAmount = $this->getRefundableAmount($order);

            if ($amount > $refundableAmount) {
                throw new \RuntimeException(
                    'Refund amount exceeds the remaining refundable balance.'
                );
            }

            $gateway = strtolower(
                (string) $order->payment_method
            );

            $gatewayReference = null;
            $gatewayTransactionId = null;
            $gatewayResponse = null;

            if ($gateway === 'stripe') {
                $stripeRefund = $this->createStripeRefund(
                    $order,
                    $amount
                );

                $gatewayReference = $stripeRefund->id;
                $gatewayTransactionId = $stripeRefund->id;

                $gatewayResponse = [
                    'refund_id' => $stripeRefund->id,
                    'payment_intent' => $stripeRefund->payment_intent,
                    'amount' => $stripeRefund->amount,
                    'currency' => $stripeRefund->currency,
                    'status' => $stripeRefund->status,
                ];
            }

            if (!in_array($gateway, ['manual', 'stripe'], true)) {
                throw new \RuntimeException(
                    'Refunds for this payment method are not supported yet.'
                );
            }

            $remainingAmount = round(
                $refundableAmount - $amount,
                2
            );

            $refundStatus = $remainingAmount <= 0
                ? 'refunded'
                : 'partially_refunded';

            PaymentTransaction::create([
                'order_id' => $order->id,
                'gateway' => $gateway,
                'status' => $refundStatus,
                'gateway_reference' => $gatewayReference ?? (
                    'REFUND-'
                    . $order->id
                    . '-'
                    . strtoupper(Str::random(8))
                ),
                'gateway_transaction_id' => $gatewayTransactionId,
                'amount' => $amount,
                'currency' => $order->currency,
                'gateway_response' => $gatewayResponse ?? [
                    'type' => 'manual_refund',
                    'amount' => $amount,
                    'currency' => $order->currency,
                ],
            ]);

            $order->update([
                'payment_status' => $refundStatus,
            ]);

            return [
                'order' => $order->fresh([
                    'user',
                    'items',
                    'shippingAddress',
                    'billingAddress',
                    'paymentTransactions',
                ]),
                'refunded_amount' => $amount,
                'refundable_amount' => $remainingAmount,
                'status' => $refundStatus,
            ];
        });

        $result['order']->setAttribute(
            'refundable_amount',
            $result['refundable_amount']
        );

        return response()->json([
            'success' => true,
            'message' => $result['status'] === 'refunded'
                ? 'Full refund processed successfully.'
                : 'Partial refund processed successfully.',
            'refunded_amount' => $result['refunded_amount'],
            'refundable_amount' => $result['refundable_amount'],
            'order' => $result['order'],
        ]);
    } catch (Throwable $error) {
        report($error);

        return response()->json([
            'success' => false,
            'message' => $error->getMessage(),
        ], 422);
    }
}


private function getRefundableAmount(Order $order): float
{
    $refundedAmount = PaymentTransaction::query()
        ->where('order_id', $order->id)
        ->whereIn('status', [
            'refunded',
            'partially_refunded',
            'refund_pending',
        ])
        ->sum('amount');

    return max(
        0,
        round(
            (float) $order->grand_total -
            (float) $refundedAmount,
            2
        )
    );
}


private function createStripeRefund(Order $order, float $amount)
{
    $paymentTransaction = PaymentTransaction::query()
        ->where('order_id', $order->id)
        ->where('gateway', 'stripe')
        ->where('status', 'paid')
        ->whereNotNull('gateway_transaction_id')
        ->latest('id')
        ->first();

    if (!$paymentTransaction) {
        throw new \RuntimeException(
            'Original Stripe payment transaction was not found.'
        );
    }

    $setting = PaymentSetting::query()
        ->where('gateway', 'stripe')
        ->first();

    if (!$setting || !$setting->is_enabled) {
        throw new \RuntimeException(
            'Stripe payment settings are unavailable.'
        );
    }

    $config = $setting->config ?? [];

    $secretKey = $config['secret_key'] ?? null;

    if (!$secretKey) {
        throw new \RuntimeException(
            'Stripe secret key is not configured.'
        );
    }

    $stripe = new StripeClient($secretKey);

    $refund = $stripe->refunds->create([
        'payment_intent' => $paymentTransaction->gateway_transaction_id,
        'amount' => (int) round($amount * 100),
        'metadata' => [
            'order_id' => (string) $order->id,
            'order_no' => $order->order_no,
        ],
    ]);

    if ($refund->status !== 'succeeded') {
        throw new \RuntimeException(
            'Stripe refund could not be completed.'
        );
    }

    return $refund;
}



}
