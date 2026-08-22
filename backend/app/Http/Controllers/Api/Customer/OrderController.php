<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Controller;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Services\OrderPreorderService;
use App\Services\Payments\StripePaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Throwable;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = Order::query()
            ->where('user_id', $request->user()->id)
            ->with([
                'items',
                'shippingAddress',
                'preorder',
            ])
            ->latest('id')
            ->paginate(10);

        return response()->json([
            'success' => true,
            'orders' => $orders,
        ]);
    }

   public function show(Request $request, Order $order): JsonResponse
{
    if ((int) $order->user_id !== (int) $request->user()->id) {
        return response()->json([
            'success' => false,
            'message' => 'Order not found.',
        ], 404);
    }

    $order->load([
        'user',
        'items.product.media',
        'items.variant.media',
        'shippingAddress',
        'billingAddress',
        'paymentTransactions',
        'preorder',
    ]);

    $order->items->transform(function ($item) {
        $imageUrl = null;

        if ($item->variant && $item->variant->media) {
            $imageUrl = asset($item->variant->media->file_path);
        }

        if (!$imageUrl && $item->product && $item->product->media->isNotEmpty()) {
            $cover = $item->product->media->firstWhere('is_cover', true);
            $media = $cover ?? $item->product->media->first();

            if ($media) {
                $imageUrl = asset($media->file_path);
            }
        }

        $item->setAttribute('image_url', $imageUrl);

        return $item;
    });

    return response()->json([
        'success' => true,
        'order' => $order,
    ]);
}

    public function store(
        Request $request,
        StripePaymentService $stripePaymentService,
        OrderPreorderService $orderPreorderService
    ): JsonResponse {
        $validated = $request->validate([
            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],

            'items.*.variant_id' => [
                'nullable',
                'integer',
                'exists:product_variants,id',
            ],

            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
                'max:999',
            ],

            'shipping_address_id' => [
                'required',
                'integer',
                'exists:customer_addresses,id',
            ],

            'billing_same_as_shipping' => [
                'required',
                'boolean',
            ],

            'billing_address_id' => [
                'nullable',
                'integer',
                'exists:customer_addresses,id',
            ],

            'shipping_method' => [
                'required',
                Rule::in([
                    'standard',
                    'express',
                ]),
            ],

            'payment_method' => [
                'required',
                Rule::in([
                    'stripe',
                    'paypal',
                    'sslcommerz',
                ]),
            ],

            'coupon_code' => [
                'nullable',
                'string',
                'max:100',
            ],

            'marketing_emails' => [
                'nullable',
                'boolean',
            ],

            'customer_note' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        if (
            !$validated['billing_same_as_shipping'] &&
            empty($validated['billing_address_id'])
        ) {
            throw ValidationException::withMessages([
                'billing_address_id' => [
                    'Please select a billing address.',
                ],
            ]);
        }

        $user = $request->user();

        $shippingAddress = CustomerAddress::query()
            ->where('id', $validated['shipping_address_id'])
            ->where('user_id', $user->id)
            ->first();

        if (!$shippingAddress) {
            throw ValidationException::withMessages([
                'shipping_address_id' => [
                    'The selected shipping address is invalid.',
                ],
            ]);
        }

        $billingAddress = null;

        if (!$validated['billing_same_as_shipping']) {
            $billingAddress = CustomerAddress::query()
                ->where('id', $validated['billing_address_id'])
                ->where('user_id', $user->id)
                ->first();

            if (!$billingAddress) {
                throw ValidationException::withMessages([
                    'billing_address_id' => [
                        'The selected billing address is invalid.',
                    ],
                ]);
            }
        }

        $order = DB::transaction(function () use (
            $validated,
            $user,
            $shippingAddress,
            $billingAddress,
            $orderPreorderService
        ) {
            $orderItems = [];
            $subtotal = 0;

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
                            'items' => [
                                'A selected product variant is invalid.',
                            ],
                        ]);
                    }
                }

                $quantity = (int) $line['quantity'];

                $this->validateStock(
                    $product,
                    $variant,
                    $quantity
                );

                $unitPrice = $variant
                    ? (float) $variant->price
                    : (float) $product->price;

                if ($unitPrice < 0) {
                    throw ValidationException::withMessages([
                        'items' => [
                            'A product has an invalid price.',
                        ],
                    ]);
                }

                $compareAtPrice = $variant
                    ? $variant->compare_at_price
                    : $product->compare_at_price;

                $lineTotal = round(
                    $unitPrice * $quantity,
                    2
                );

                $subtotal += $lineTotal;

                $orderItems[] = [
                    'store_id' => $product->store_id ?? null,

                    'store_name' =>
                        $product->store?->name ?? null,

                    'product_id' => $product->id,

                    'variant_id' =>
                        $variant?->id,

                    'product_name' =>
                        $product->name ??
                        $product->title ??
                        'Product',

                    'product_slug' =>
                        $product->slug,

                    'variant_name' =>
                        $variant?->name ??
                        $variant?->title,

                    'sku' =>
                        $variant?->sku ??
                        $product->sku,

                    'quantity' => $quantity,

                    'unit_price' =>
                        $unitPrice,

                    'compare_at_price' =>
                        $compareAtPrice !== null
                            ? (float) $compareAtPrice
                            : null,

                    'line_total' =>
                        $lineTotal,
                ];
            }

            $subtotal = round(
                $subtotal,
                2
            );

            $discountTotal = 0;

            $shippingTotal =
                $this->shippingPrice(
                    $validated['shipping_method']
                );

            $taxTotal = round(
                $subtotal * 0.10,
                2
            );

            $grandTotal = round(
                $subtotal
                - $discountTotal
                + $shippingTotal
                + $taxTotal,
                2
            );

            $order = Order::create([
                'order_no' =>
                    $this->generateOrderNumber(),

                'user_id' =>
                    $user->id,

                'status' =>
                    'pending',

                'payment_method' =>
                    $validated['payment_method'],

                'payment_status' =>
                    'pending',

                'shipping_method' =>
                    $validated['shipping_method'],

                'currency' =>
                    'USD',

                'subtotal' =>
                    $subtotal,

                'discount_total' =>
                    $discountTotal,

                'shipping_total' =>
                    $shippingTotal,

                'tax_total' =>
                    $taxTotal,

                'grand_total' =>
                    $grandTotal,

                'coupon_code' =>
                    $validated['coupon_code'] ?? null,

                'billing_same_as_shipping' =>
                    $validated['billing_same_as_shipping'],

                'marketing_emails' =>
                    $validated['marketing_emails'] ?? false,

                'customer_note' =>
                    $validated['customer_note'] ?? null,

                'placed_at' =>
                    now(),
            ]);

            foreach ($orderItems as $item) {
                $order->items()->create(
                    $item
                );
            }

            $orderPreorderService->createFromOrder(
                $order
            );

            $this->createAddressSnapshot(
                $order,
                $shippingAddress,
                'shipping'
            );

            if ($validated['billing_same_as_shipping']) {
                $this->createAddressSnapshot(
                    $order,
                    $shippingAddress,
                    'billing'
                );
            } else {
                $this->createAddressSnapshot(
                    $order,
                    $billingAddress,
                    'billing'
                );
            }

            return $order;
        });

        $order->load([
            'user',
            'items',
            'shippingAddress',
            'billingAddress',
            'preorder',
        ]);

        if (
            $order->preorder &&
            $order->preorder->payment_terms === 'pay_later'
        ) {
            return response()->json([
                'success' => true,

                'message' =>
                    'Pre-order reserved successfully. Payment will be collected later.',

                'order' =>
                    $order,

                'payment' => [
                    'required' =>
                        false,

                    'method' =>
                        'pay_later',

                    'status' =>
                        'pending',

                    'amount_due' =>
                        (float) $order->preorder->balance_due,

                    'balance_due_at' =>
                        $order->preorder->balance_due_at,

                    'redirect_url' =>
                        null,
                ],
            ], 201);
        }

        if ($order->payment_method === 'stripe') {
            return $this->startStripePayment(
                $order,
                $stripePaymentService
            );
        }

        return response()->json([
            'success' => true,

            'message' =>
                'Order created successfully.',

            'order' =>
                $order,

            'payment' => [
                'required' => true,

                'method' =>
                    $order->payment_method,

                'status' =>
                    $order->payment_status,

                'redirect_url' =>
                    null,
            ],
        ], 201);
    }

    private function startStripePayment(
        Order $order,
        StripePaymentService $stripePaymentService
    ): JsonResponse {
        try {
            $order->loadMissing([
                'preorder',
            ]);

            $transaction =
                $stripePaymentService
                    ->createCheckout($order);

            return response()->json([
                'success' => true,

                'message' =>
                    $order->preorder &&
                    $order->preorder->payment_terms === 'deposit'
                        ? 'Pre-order created. Redirecting to Stripe for the deposit payment.'
                        : 'Order created. Redirecting to Stripe.',

                'order' =>
                    $order,

                'payment' => [
                    'required' => true,

                    'method' =>
                        'stripe',

                    'status' =>
                        'pending',

                    'transaction_id' =>
                        $transaction->id,

                    'redirect_url' =>
                        $transaction->redirect_url,
                ],
            ], 201);
        } catch (Throwable $error) {
            return response()->json([
                'success' => false,

                'message' =>
                    'Unable to start Stripe payment.',

                'error' =>
                    $error->getMessage(),

                'order' =>
                    $order,
            ], 500);
        }
    }

    private function validateStock(
        Product $product,
        ?ProductVariant $variant,
        int $quantity
    ): void {
        if ((bool) $product->preorder_enabled) {
            return;
        }

        if ($variant) {
            $trackQuantity = (bool) (
                $variant->track_quantity ?? true
            );

            $continueSelling = (bool) (
                $variant->continue_selling_when_out_of_stock ?? false
            );

            $available = (int) (
                $variant->quantity ?? 0
            );

            if (
                $trackQuantity &&
                !$continueSelling &&
                $quantity > $available
            ) {
                throw ValidationException::withMessages([
                    'items' => [
                        'Not enough stock is available for '
                        . ($product->name ?? 'this product')
                        . '.',
                    ],
                ]);
            }

            return;
        }

        $trackQuantity = (bool) (
            $product->track_quantity ?? true
        );

        $continueSelling = (bool) (
            $product->continue_selling_when_out_of_stock ?? false
        );

        $available = (int) (
            $product->quantity ?? 0
        );

        if (
            $trackQuantity &&
            !$continueSelling &&
            $quantity > $available
        ) {
            throw ValidationException::withMessages([
                'items' => [
                    'Not enough stock is available for '
                    . ($product->name ?? 'this product')
                    . '.',
                ],
            ]);
        }
    }

    private function shippingPrice(
        string $shippingMethod
    ): float {
        if ($shippingMethod === 'express') {
            return 50;
        }

        return 30;
    }

    private function createAddressSnapshot(
        Order $order,
        CustomerAddress $address,
        string $type
    ): void {
        $order->addresses()->create([
            'source_address_id' =>
                $address->id,

            'address_type' =>
                $type,

            'label' =>
                $address->type ??
                $address->label ??
                null,

            'first_name' =>
                $address->first_name,

            'last_name' =>
                $address->last_name,

            'phone' =>
                $address->phone,

            'address_line1' =>
                $address->address_line1,

            'address_line2' =>
                $address->address_line2,

            'city' =>
                $address->city,

            'state' =>
                $address->state,

            'postal_code' =>
                $address->postal_code,

            'country' =>
                $address->country,
        ]);
    }


    public function cancel(Request $request, Order $order): JsonResponse
{
    if ((int) $order->user_id !== (int) $request->user()->id) {

        return response()->json([
            'success' => false,
            'message' => 'Order not found.',
        ], 404);

    }


    if (
        in_array($order->status, [
            'delivered',
            'cancelled'
        ])
    ) {

        return response()->json([
            'success' => false,
            'message' => 'Order cannot be cancelled.',
        ], 422);

    }


    $order->update([
        'status' => 'cancelled',
    ]);


    return response()->json([

        'success' => true,

        'message' =>
            'Order cancelled successfully.',

        'order' => [

            'id' =>
                $order->id,

            'status' =>
                $order->status,

        ],

    ]);

}

    private function generateOrderNumber(): string
    {
        do {
            $orderNo =
                'ORD-'
                . now()->format('Ymd')
                . '-'
                . strtoupper(
                    Str::random(6)
                );
        } while (
            Order::query()
                ->where(
                    'order_no',
                    $orderNo
                )
                ->exists()
        );

        return $orderNo;
    }
}
