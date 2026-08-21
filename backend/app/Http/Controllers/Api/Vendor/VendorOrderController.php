<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class VendorOrderController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | ORDERS
    |--------------------------------------------------------------------------
    */

    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendor($request);

        $search = trim(
            (string) $request->query(
                'search',
                ''
            )
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

        if (
            ! in_array(
                $tab,
                $allowedTabs,
                true
            )
        ) {
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
            ->whereHas(
                'items.product',
                function ($query) use ($vendor) {
                    $this->applyVendorProductScope(
                        $query,
                        $vendor->id
                    );
                }
            )
            ->with([
                'user:id,name,email',

                'items' => function ($query) use ($vendor) {
                    $query
                        ->whereHas(
                            'product',
                            function ($query) use ($vendor) {
                                $this->applyVendorProductScope(
                                    $query,
                                    $vendor->id
                                );
                            }
                        )
                        ->select([
                            'id',
                            'order_id',
                            'product_id',
                            'variant_id',
                            'product_name',
                            'variant_name',
                            'quantity',
                            'unit_price',
                            'line_total',
                        ]);
                },
            ]);


        if ($search !== '') {
            $like =
                '%' .
                $search .
                '%';

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
            ->orderByDesc(
                'orders.id'
            )
            ->paginate(
                $perPage
            );


        $orders
            ->getCollection()
            ->transform(
                function ($order) {
                    $netSales =
                        round(
                            (float) $order
                                ->items
                                ->sum(
                                    fn ($item) =>
                                        (float) (
                                            $item->line_total
                                            ?? 0
                                        )
                                ),
                            2
                        );

                    $order->setAttribute(
                        'net_sales',
                        $netSales
                    );

                    return $order;
                }
            );


        $baseOrderQuery =
            $this->vendorOrderQuery(
                $vendor->id
            );


        $totalOrders =
            (clone $baseOrderQuery)
                ->count();


        $openOrders =
            (clone $baseOrderQuery)
                ->whereIn(
                    'status',
                    [
                        'pending',
                        'processing',
                    ]
                )
                ->count();


        $paidOrders =
            (clone $baseOrderQuery)
                ->where(
                    'payment_status',
                    'paid'
                )
                ->count();


        /*
        |--------------------------------------------------------------------------
        | VENDOR REVENUE
        |--------------------------------------------------------------------------
        |
        | Only line totals belonging to this vendor are counted.
        |
        */

        $totalRevenue =
            (float) DB::table(
                'order_items'
            )
                ->join(
                    'products',
                    'products.id',
                    '=',
                    'order_items.product_id'
                )
                ->join(
                    'orders',
                    'orders.id',
                    '=',
                    'order_items.order_id'
                )
                ->where(
                    'products.source',
                    'vendor'
                )
                ->where(
                    'products.created_by',
                    $vendor->id
                )
                ->where(
                    'orders.payment_status',
                    'paid'
                )
                ->sum(
                    'order_items.line_total'
                );


        $averageOrderValue = 0;

        if ($paidOrders > 0) {
            $averageOrderValue =
                round(
                    $totalRevenue /
                    $paidOrders,
                    2
                );
        }


        return response()->json([
            'success' => true,

            'stats' => [
                'total_orders' =>
                    $totalOrders,

                'open_orders' =>
                    $openOrders,

                'paid_orders' =>
                    $paidOrders,

                'total_revenue' =>
                    round(
                        $totalRevenue,
                        2
                    ),

                'average_order_value' =>
                    $averageOrderValue,
            ],

            'orders' =>
                $orders,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    public function show(
        Request $request,
        $id
    ): JsonResponse {
        $vendor =
            $this->vendor(
                $request
            );


        $order = Order::query()
            ->whereHas(
                'items.product',
                function ($query) use ($vendor) {
                    $this->applyVendorProductScope(
                        $query,
                        $vendor->id
                    );
                }
            )
            ->with([
                'user',

                'items' => function ($query) use ($vendor) {
                    $query
                        ->whereHas(
                            'product',
                            function ($query) use ($vendor) {
                                $this->applyVendorProductScope(
                                    $query,
                                    $vendor->id
                                );
                            }
                        )
                        ->with([
                            'product.media',
                            'variant.media',
                        ]);
                },

                'shippingAddress',
                'billingAddress',
                'paymentTransactions',
            ])
            ->findOrFail(
                $id
            );


        $order->items->transform(
            function ($item) {
                $imageUrl = null;


                if (
                    $item->variant &&
                    $item->variant->media
                ) {
                    $imageUrl =
                        asset(
                            $item
                                ->variant
                                ->media
                                ->file_path
                        );
                }


                if (
                    ! $imageUrl &&
                    $item->product &&
                    $item
                        ->product
                        ->media
                        ->isNotEmpty()
                ) {
                    $cover =
                        $item
                            ->product
                            ->media
                            ->firstWhere(
                                'is_cover',
                                true
                            );

                    $media =
                        $cover ??
                        $item
                            ->product
                            ->media
                            ->first();

                    if ($media) {
                        $imageUrl =
                            asset(
                                $media->file_path
                            );
                    }
                }


                $item->setAttribute(
                    'image_url',
                    $imageUrl
                );

                return $item;
            }
        );


        $vendorNetSales =
            round(
                (float) $order
                    ->items
                    ->sum(
                        fn ($item) =>
                            (float) (
                                $item->line_total
                                ?? 0
                            )
                    ),
                2
            );


        $order->setAttribute(
            'net_sales',
            $vendorNetSales
        );


        return response()->json([
            'success' => true,

            'order' =>
                $order,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE ORDER PRODUCTS
    |--------------------------------------------------------------------------
    */

    public function createProducts(
        Request $request
    ): JsonResponse {
        $vendor =
            $this->vendor(
                $request
            );


        $search = trim(
            (string) $request->query(
                'search',
                ''
            )
        );


        $perPage =
            min(
                max(
                    (int) $request->query(
                        'per_page',
                        30
                    ),
                    10
                ),
                100
            );


        $products = Product::query()
            ->where(
                'source',
                'vendor'
            )
            ->where(
                'created_by',
                $vendor->id
            )
            ->with([
                'media',
                'variants.media',
            ])
            ->when(
                $search !== '',
                function ($query) use ($search) {
                    $query->where(
                        function ($query) use ($search) {
                            $query
                                ->where(
                                    'title',
                                    'like',
                                    '%' . $search . '%'
                                )
                                ->orWhere(
                                    'sku',
                                    'like',
                                    '%' . $search . '%'
                                )
                                ->orWhereHas(
                                    'variants',
                                    function ($query) use ($search) {
                                        $query->where(
                                            'sku',
                                            'like',
                                            '%' . $search . '%'
                                        );
                                    }
                                );
                        }
                    );
                }
            )
            ->orderBy(
                'title'
            )
            ->paginate(
                $perPage
            );


        $rows = [];


        foreach (
            $products->items()
            as $product
        ) {
            if (
                $product
                    ->variants
                    ->isNotEmpty()
            ) {
                foreach (
                    $product->variants
                    as $variant
                ) {
                    $rows[] = [
                        'key' =>
                            $product->id .
                            '-' .
                            $variant->id,

                        'product_id' =>
                            $product->id,

                        'variant_id' =>
                            $variant->id,

                        'product_name' =>
                            $product->title,

                        'variant_name' =>
                            $variant->name ??
                            $variant->title ??
                            null,

                        'sku' =>
                            $variant->sku ??
                            $product->sku,

                        'price' =>
                            (float) (
                                $variant->price ??
                                $product->price ??
                                0
                            ),

                        'compare_at_price' =>
                            $variant
                                ->compare_at_price !==
                            null
                                ? (float)
                                    $variant
                                        ->compare_at_price
                                : null,

                        'available' =>
                            $this
                                ->getVariantAvailableQuantity(
                                    $variant
                                ),

                        'track_quantity' =>
                            (bool) (
                                $variant
                                    ->track_quantity
                                ?? true
                            ),

                        'continue_selling_when_out_of_stock' =>
                            (bool) (
                                $variant
                                    ->continue_selling_when_out_of_stock
                                ?? false
                            ),

                        'image_url' =>
                            $this
                                ->getVariantImageUrl(
                                    $variant,
                                    $product
                                ),
                    ];
                }

                continue;
            }


            $rows[] = [
                'key' =>
                    $product->id .
                    '-product',

                'product_id' =>
                    $product->id,

                'variant_id' =>
                    null,

                'product_name' =>
                    $product->title,

                'variant_name' =>
                    null,

                'sku' =>
                    $product->sku,

                'price' =>
                    (float) (
                        $product->price ??
                        0
                    ),

                'compare_at_price' =>
                    $product
                        ->compare_at_price !==
                    null
                        ? (float)
                            $product
                                ->compare_at_price
                        : null,

                'available' =>
                    $this
                        ->getProductAvailableQuantity(
                            $product
                        ),

                'track_quantity' =>
                    (bool) (
                        $product
                            ->track_quantity
                        ?? true
                    ),

                'continue_selling_when_out_of_stock' =>
                    (bool) (
                        $product
                            ->continue_selling_when_out_of_stock
                        ?? false
                    ),

                'image_url' =>
                    $this
                        ->getProductImageUrl(
                            $product
                        ),
            ];
        }


        return response()->json([
            'success' => true,

            'products' =>
                $rows,

            'pagination' => [
                'current_page' =>
                    $products
                        ->currentPage(),

                'last_page' =>
                    $products
                        ->lastPage(),

                'per_page' =>
                    $products
                        ->perPage(),

                'total_products' =>
                    $products
                        ->total(),
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE ORDER CUSTOMERS
    |--------------------------------------------------------------------------
    */

   public function createCustomers(
    Request $request
): JsonResponse {
    $this->vendor(
        $request
    );

    $search = trim(
        (string) $request->query(
            'search',
            ''
        )
    );

    $customers = User::query()
        ->whereIn(
            'role',
            [
                'user',
                'customer',
            ]
        )
        ->when(
            $search !== '',
            function ($query) use ($search) {
                $query->where(
                    function ($query) use ($search) {
                        $query
                            ->where(
                                'name',
                                'like',
                                '%' . $search . '%'
                            )
                            ->orWhere(
                                'first_name',
                                'like',
                                '%' . $search . '%'
                            )
                            ->orWhere(
                                'last_name',
                                'like',
                                '%' . $search . '%'
                            )
                            ->orWhere(
                                'email',
                                'like',
                                '%' . $search . '%'
                            )
                            ->orWhere(
                                'phone',
                                'like',
                                '%' . $search . '%'
                            );
                    }
                );
            }
        )
        ->orderBy(
            'name'
        )
        ->limit(30)
        ->get();

    return response()->json([
        'success' => true,

        'customers' =>
            $customers->map(
                function ($customer) {
                    return [
                        'id' =>
                            $customer->id,

                        'name' =>
                            $customer->name
                            ?: trim(
                                (
                                    $customer->first_name
                                    ?? ''
                                )
                                . ' '
                                . (
                                    $customer->last_name
                                    ?? ''
                                )
                            ),

                        'email' =>
                            $customer->email,

                        'phone' =>
                            $customer->phone,
                    ];
                }
            ),
    ]);
}



public function storeCustomer(
    Request $request
): JsonResponse {
    $this->vendor(
        $request
    );

    $validated =
        $request->validate([
            'first_name' => [
                'required',
                'string',
                'max:100',
            ],

            'last_name' => [
                'nullable',
                'string',
                'max:100',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:50',
            ],

            'shipping_phone' => [
                'nullable',
                'string',
                'max:50',
            ],

            'address_line1' => [
                'nullable',
                'string',
                'max:255',
            ],

            'address_line2' => [
                'nullable',
                'string',
                'max:255',
            ],

            'city' => [
                'nullable',
                'string',
                'max:100',
            ],

            'state' => [
                'nullable',
                'string',
                'max:100',
            ],

            'postal_code' => [
                'nullable',
                'string',
                'max:50',
            ],

            'country' => [
                'nullable',
                'string',
                'max:100',
            ],

            'tags' => [
                'nullable',
                'string',
                'max:500',
            ],

            'notes' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);


    $customer = DB::transaction(
        function () use ($validated) {
            $name = trim(
                $validated['first_name']
                . ' '
                . (
                    $validated['last_name']
                    ?? ''
                )
            );


            $userData = [
                'name' =>
                    $name,

                'first_name' =>
                    $validated[
                        'first_name'
                    ],

                'last_name' =>
                    $validated[
                        'last_name'
                    ]
                    ?? null,

                'email' =>
                    $validated[
                        'email'
                    ],

                'phone' =>
                    $validated[
                        'phone'
                    ]
                    ?? null,

                'password' =>
                    Hash::make(
                        Str::random(40)
                    ),

                'role' =>
                    'customer',
            ];


            if (
                Schema::hasColumn(
                    'users',
                    'tags'
                )
            ) {
                $tags = collect(
                    explode(
                        ',',
                        $validated[
                            'tags'
                        ]
                        ?? ''
                    )
                )
                    ->map(
                        fn ($tag) =>
                            trim($tag)
                    )
                    ->filter()
                    ->values()
                    ->all();


                $columnType =
                    Schema::getColumnType(
                        'users',
                        'tags'
                    );


                $userData['tags'] =
                    in_array(
                        $columnType,
                        [
                            'json',
                            'jsonb',
                        ],
                        true
                    )
                        ? json_encode(
                            $tags
                        )
                        : implode(
                            ', ',
                            $tags
                        );
            }


            if (
                Schema::hasColumn(
                    'users',
                    'notes'
                )
            ) {
                $userData['notes'] =
                    $validated[
                        'notes'
                    ]
                    ?? null;
            }


            $customer =
                User::forceCreate(
                    $userData
                );


            $hasAddress =
                ! empty(
                    $validated[
                        'address_line1'
                    ]
                )
                ||
                ! empty(
                    $validated[
                        'address_line2'
                    ]
                )
                ||
                ! empty(
                    $validated[
                        'city'
                    ]
                )
                ||
                ! empty(
                    $validated[
                        'state'
                    ]
                )
                ||
                ! empty(
                    $validated[
                        'postal_code'
                    ]
                )
                ||
                ! empty(
                    $validated[
                        'country'
                    ]
                );


            if ($hasAddress) {
                $addressData = [
                    'user_id' =>
                        $customer->id,

                    'first_name' =>
                        $validated[
                            'first_name'
                        ],

                    'last_name' =>
                        $validated[
                            'last_name'
                        ]
                        ?? null,

                    'phone' =>
                        $validated[
                            'shipping_phone'
                        ]
                        ??
                        $validated[
                            'phone'
                        ]
                        ??
                        null,

                    'address_line1' =>
                        $validated[
                            'address_line1'
                        ]
                        ?? null,

                    'address_line2' =>
                        $validated[
                            'address_line2'
                        ]
                        ?? null,

                    'city' =>
                        $validated[
                            'city'
                        ]
                        ?? null,

                    'state' =>
                        $validated[
                            'state'
                        ]
                        ?? null,

                    'postal_code' =>
                        $validated[
                            'postal_code'
                        ]
                        ?? null,

                    'country' =>
                        $validated[
                            'country'
                        ]
                        ?? null,
                ];


                if (
                    Schema::hasColumn(
                        'customer_addresses',
                        'type'
                    )
                ) {
                    $addressData['type'] =
                        'shipping';
                }


                if (
                    Schema::hasColumn(
                        'customer_addresses',
                        'label'
                    )
                ) {
                    $addressData['label'] =
                        'Shipping';
                }


                if (
                    Schema::hasColumn(
                        'customer_addresses',
                        'is_default'
                    )
                ) {
                    $addressData[
                        'is_default'
                    ] = true;
                }


                CustomerAddress::forceCreate(
                    $addressData
                );
            }


            return $customer;
        }
    );


    return response()->json([
        'success' => true,

        'message' =>
            'Customer created successfully.',

        'customer' => [
            'id' =>
                $customer->id,

            'name' =>
                $customer->name,

            'email' =>
                $customer->email,

            'phone' =>
                $customer->phone,
        ],
    ], 201);
}

    /*
    |--------------------------------------------------------------------------
    | CREATE MANUAL ORDER
    |--------------------------------------------------------------------------
    */

    public function storeManual(
        Request $request
    ): JsonResponse {
        $vendor =
            $this->vendor(
                $request
            );


        $validated =
            $request->validate([
                'customer_id' => [
                    'required',
                    'integer',
                    'exists:users,id',
                ],

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

                'discount_total' => [
                    'nullable',
                    'numeric',
                    'min:0',
                ],

                'shipping_total' => [
                    'nullable',
                    'numeric',
                    'min:0',
                ],

                'tax_rate' => [
                    'nullable',
                    'numeric',
                    'min:0',
                    'max:100',
                ],

                'customer_note' => [
                    'nullable',
                    'string',
                    'max:2000',
                ],

                'payment_due_later' => [
                    'nullable',
                    'boolean',
                ],

                'mark_as_paid' => [
                    'nullable',
                    'boolean',
                ],
            ]);


        $order = DB::transaction(
            function () use (
                $validated,
                $vendor
            ) {
                $subtotal = 0;

                $orderItems = [];


                foreach (
                    $validated['items']
                    as $line
                ) {
                    $product = Product::query()
                        ->where(
                            'source',
                            'vendor'
                        )
                        ->where(
                            'created_by',
                            $vendor->id
                        )
                        ->with(
                            'store'
                        )
                        ->lockForUpdate()
                        ->find(
                            $line[
                                'product_id'
                            ]
                        );


                    if (! $product) {
                        throw ValidationException::withMessages([
                            'items' => [
                                'A selected product does not belong to your store.',
                            ],
                        ]);
                    }


                    $variant = null;


                    if (
                        ! empty(
                            $line[
                                'variant_id'
                            ]
                        )
                    ) {
                        $variant =
                            ProductVariant::query()
                                ->lockForUpdate()
                                ->where(
                                    'id',
                                    $line[
                                        'variant_id'
                                    ]
                                )
                                ->where(
                                    'product_id',
                                    $product->id
                                )
                                ->first();


                        if (! $variant) {
                            throw ValidationException::withMessages([
                                'items' => [
                                    'A selected product variant is invalid.',
                                ],
                            ]);
                        }
                    }


                    $quantity =
                        (int) $line[
                            'quantity'
                        ];


                    $available =
                        $variant
                            ? (int) (
                                $variant
                                    ->quantity
                                ?? 0
                            )
                            : (int) (
                                $product
                                    ->quantity
                                ?? 0
                            );


                    $trackQuantity =
                        $variant
                            ? (bool) (
                                $variant
                                    ->track_quantity
                                ?? true
                            )
                            : (bool) (
                                $product
                                    ->track_quantity
                                ?? true
                            );


                    $continueSelling =
                        $variant
                            ? (bool) (
                                $variant
                                    ->continue_selling_when_out_of_stock
                                ?? false
                            )
                            : (bool) (
                                $product
                                    ->continue_selling_when_out_of_stock
                                ?? false
                            );


                    if (
                        $trackQuantity &&
                        ! $continueSelling &&
                        $quantity >
                            $available
                    ) {
                        throw ValidationException::withMessages([
                            'items' => [
                                'Not enough stock is available for ' .
                                (
                                    $product->title
                                    ?? 'this product'
                                ) .
                                '.',
                            ],
                        ]);
                    }


                    $unitPrice =
                        $variant
                            ? (float)
                                $variant->price
                            : (float)
                                $product->price;


                    $lineTotal =
                        round(
                            $unitPrice *
                            $quantity,
                            2
                        );


                    $subtotal +=
                        $lineTotal;


                    $orderItems[] = [
                        'store_id' =>
                            $product
                                ->store_id
                            ?? null,

                        'store_name' =>
                            $product
                                ->store
                                ?->name
                            ?? null,

                        'product_id' =>
                            $product->id,

                        'variant_id' =>
                            $variant?->id,

                        'product_name' =>
                            $product->title
                            ?? 'Product',

                        'product_slug' =>
                            $product->slug,

                        'variant_name' =>
                            $variant?->name
                            ??
                            $variant?->title,

                        'sku' =>
                            $variant?->sku
                            ??
                            $product->sku,

                        'quantity' =>
                            $quantity,

                        'unit_price' =>
                            $unitPrice,

                        'compare_at_price' =>
                            $variant
                                ?->compare_at_price
                            ??
                            $product
                                ->compare_at_price,

                        'line_total' =>
                            $lineTotal,
                    ];
                }


                $subtotal =
                    round(
                        $subtotal,
                        2
                    );


                $discountTotal =
                    min(
                        (float) (
                            $validated[
                                'discount_total'
                            ]
                            ?? 0
                        ),
                        $subtotal
                    );


                $shippingTotal =
                    round(
                        (float) (
                            $validated[
                                'shipping_total'
                            ]
                            ?? 0
                        ),
                        2
                    );


                $taxRate =
                    (float) (
                        $validated[
                            'tax_rate'
                        ]
                        ?? 0
                    );


                $taxTotal =
                    round(
                        $subtotal *
                        (
                            $taxRate /
                            100
                        ),
                        2
                    );


                $grandTotal =
                    round(
                        $subtotal -
                        $discountTotal +
                        $shippingTotal +
                        $taxTotal,
                        2
                    );


                $markAsPaid =
                    (bool) (
                        $validated[
                            'mark_as_paid'
                        ]
                        ?? false
                    );


                $order =
                    Order::create([
                        'order_no' =>
                            $this
                                ->generateManualOrderNumber(),

                        'user_id' =>
                            $validated[
                                'customer_id'
                            ],

                        'status' =>
                            $markAsPaid
                                ? 'processing'
                                : 'pending',

                        'payment_method' =>
                            'manual',

                        'payment_status' =>
                            $markAsPaid
                                ? 'paid'
                                : 'pending',

                        'channel' =>
                            'manual',

                        'fulfillment_status' =>
                            'unfulfilled',

                        'delivery_status' =>
                            'not_shipped',

                        'shipping_method' =>
                            'manual',

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

                        'billing_same_as_shipping' =>
                            true,

                        'marketing_emails' =>
                            false,

                        'customer_note' =>
                            $validated[
                                'customer_note'
                            ]
                            ?? null,

                        'placed_at' =>
                            now(),

                        'paid_at' =>
                            $markAsPaid
                                ? now()
                                : null,
                    ]);


                foreach (
                    $orderItems
                    as $item
                ) {
                    $order
                        ->items()
                        ->create(
                            $item
                        );
                }


                if ($markAsPaid) {
                    PaymentTransaction::create([
                        'order_id' =>
                            $order->id,

                        'gateway' =>
                            'manual',

                        'status' =>
                            'paid',

                        'gateway_reference' =>
                            'MANUAL-' .
                            $order->order_no,

                        'amount' =>
                            $order
                                ->grand_total,

                        'currency' =>
                            $order
                                ->currency,

                        'paid_at' =>
                            now(),
                    ]);
                }


                return $order->fresh([
                    'user',
                    'items',
                    'paymentTransactions',
                ]);
            }
        );


        return response()->json([
            'success' => true,

            'message' =>
                $order
                    ->payment_status ===
                'paid'
                    ? 'Order created and marked as paid.'
                    : 'Order created successfully.',

            'order' =>
                $order,
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | HELPERS
    |--------------------------------------------------------------------------
    */

    private function vendor(
        Request $request
    ) {
        $user =
            $request->user();


        if (
            ! $user ||
            $user->role !==
                'vendor'
        ) {
            abort(403);
        }


        return $user;
    }


    private function vendorOrderQuery(
        int $vendorId
    ): Builder {
        return Order::query()
            ->whereHas(
                'items.product',
                function ($query) use ($vendorId) {
                    $this->applyVendorProductScope(
                        $query,
                        $vendorId
                    );
                }
            );
    }


    private function applyVendorProductScope(
        Builder $query,
        int $vendorId
    ): void {
        $query
            ->where(
                'products.source',
                'vendor'
            )
            ->where(
                'products.created_by',
                $vendorId
            );
    }


    private function generateManualOrderNumber(): string
    {
        do {
            $orderNo =
                'ORD-' .
                now()->format(
                    'Ymd'
                ) .
                '-' .
                strtoupper(
                    Str::random(
                        6
                    )
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


    private function getVariantAvailableQuantity(
        $variant
    ): ?int {
        $trackQuantity =
            (bool) (
                $variant
                    ->track_quantity
                ?? true
            );


        if (! $trackQuantity) {
            return null;
        }


        return max(
            0,
            (int) (
                $variant->quantity
                ?? 0
            )
        );
    }


    private function getProductAvailableQuantity(
        Product $product
    ): ?int {
        $trackQuantity =
            (bool) (
                $product
                    ->track_quantity
                ?? true
            );


        if (! $trackQuantity) {
            return null;
        }


        return max(
            0,
            (int) (
                $product->quantity
                ?? 0
            )
        );
    }


    private function getVariantImageUrl(
        $variant,
        Product $product
    ): ?string {
        if ($variant->media) {
            return asset(
                $variant
                    ->media
                    ->file_path
            );
        }


        return $this
            ->getProductImageUrl(
                $product
            );
    }


    private function getProductImageUrl(
        Product $product
    ): ?string {
        $cover =
            $product
                ->media
                ->firstWhere(
                    'is_cover',
                    true
                )
            ??
            $product
                ->media
                ->first();


        if (! $cover) {
            return null;
        }


        return asset(
            $cover->file_path
        );
    }
}