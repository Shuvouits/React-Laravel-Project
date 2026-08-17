<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AdminCustomerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tab = $request->query('tab', 'all');
        $search = trim((string) $request->query('search', ''));
        $loyaltyTier = $request->query('loyalty_tier');
        $sort = $request->query('sort', 'recent');

        $perPage = min(
            max(
                (int) $request->query('per_page', 15),
                1
            ),
            100
        );

        if (!in_array($tab, [
            'all',
            'active',
            'inactive',
            'banned',
        ], true)) {
            $tab = 'all';
        }

        $query = User::query()
            ->where('role', 'customer')
            ->with([
                'customerProfile',
            ])
            ->withCount('orders')
            ->withSum([
                'orders as spent' => function ($query) {
                    $query->where(
                        'payment_status',
                        'paid'
                    );
                },
            ], 'grand_total');

        /*
        |--------------------------------------------------------------------------
        | TAB FILTER
        |--------------------------------------------------------------------------
        */

        if ($tab === 'active') {
            $query->where(
                'account_status',
                'active'
            );
        }

        if ($tab === 'inactive') {
            $query->whereIn(
                'account_status',
                [
                    'pending_activation',
                    'suspended',
                ]
            );
        }

        if ($tab === 'banned') {
            $query->where(
                'account_status',
                'banned'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($search !== '') {
            $query->where(function ($query) use ($search) {
                $query
                    ->where(
                        'name',
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
            });
        }

        /*
        |--------------------------------------------------------------------------
        | LOYALTY FILTER
        |--------------------------------------------------------------------------
        */

        if (in_array($loyaltyTier, [
            'bronze',
            'silver',
            'gold',
            'platinum',
        ], true)) {
            if ($loyaltyTier === 'bronze') {
                $query->where(function ($query) {
                    $query
                        ->whereDoesntHave(
                            'customerProfile'
                        )
                        ->orWhereHas(
                            'customerProfile',
                            function ($profileQuery) {
                                $profileQuery->where(
                                    'loyalty_tier',
                                    'bronze'
                                );
                            }
                        );
                });
            } else {
                $query->whereHas(
                    'customerProfile',
                    function ($profileQuery) use ($loyaltyTier) {
                        $profileQuery->where(
                            'loyalty_tier',
                            $loyaltyTier
                        );
                    }
                );
            }
        }

        /*
        |--------------------------------------------------------------------------
        | SORT
        |--------------------------------------------------------------------------
        */

        switch ($sort) {
            case 'oldest':
                $query->orderBy(
                    'created_at',
                    'asc'
                );
                break;

            case 'name_asc':
                $query->orderBy(
                    'name',
                    'asc'
                );
                break;

            case 'name_desc':
                $query->orderBy(
                    'name',
                    'desc'
                );
                break;

            case 'spent_high':
                $query
                    ->orderByDesc('spent')
                    ->orderByDesc('created_at');
                break;

            case 'orders_high':
                $query
                    ->orderByDesc('orders_count')
                    ->orderByDesc('created_at');
                break;

            default:
                $query->orderByDesc(
                    'created_at'
                );
                break;
        }

        $customers = $query->paginate(
            $perPage
        );

        $customers
            ->getCollection()
            ->transform(
                function ($customer) {
                    return $this->transformCustomerRow(
                        $customer
                    );
                }
            );

        return response()->json([
            'success' => true,

            'stats' =>
                $this->getCustomerStats(),

            'tab_counts' =>
                $this->getTabCounts(),

            'customers' =>
                $customers,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validateCustomer(
            $request
        );

        $customer = DB::transaction(
            function () use ($validated) {
                $name = trim(
                    $validated['name']
                );

                [
                    $firstName,
                    $lastName,
                ] = $this->splitName(
                    $name
                );

                $customer = User::create([
                    'name' =>
                        $name,

                    'first_name' =>
                        $firstName,

                    'last_name' =>
                        $lastName,

                    'email' =>
                        strtolower(
                            trim(
                                $validated['email']
                            )
                        ),

                    'phone' =>
                        $validated['phone']
                        ?? null,

                    'password' =>
                        $validated['password']
                        ?? Str::password(24),

                    'role' =>
                        'customer',

                    'account_status' =>
                        $validated['account_status']
                        ?? 'active',
                ]);

                $customer
                    ->customerProfile()
                    ->create(
                        $this->getProfilePayload(
                            $validated
                        )
                    );

                $this->syncShippingAddress(
                    $customer,
                    $validated['shipping_address']
                    ?? null
                );

                return $customer;
            }
        );

        $customer->load([
            'customerProfile',
            'defaultAddress',
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                'Customer created successfully.',

            'customer' =>
                $this->transformCustomerDetails(
                    $customer
                ),
        ], 201);
    }

    public function edit(User $customer): JsonResponse
    {
        $this->ensureCustomer(
            $customer
        );

        $customer->load([
            'customerProfile',
            'defaultAddress',
        ]);

        return response()->json([
            'success' => true,

            'customer' =>
                $this->transformCustomerDetails(
                    $customer
                ),
        ]);
    }

    public function update(
        Request $request,
        User $customer
    ): JsonResponse {
        $this->ensureCustomer(
            $customer
        );

        $validated =
            $this->validateCustomer(
                $request,
                $customer
            );

        DB::transaction(
            function () use (
                $validated,
                $customer
            ) {
                $name = trim(
                    $validated['name']
                );

                [
                    $firstName,
                    $lastName,
                ] = $this->splitName(
                    $name
                );

                $customer->update([
                    'name' =>
                        $name,

                    'first_name' =>
                        $firstName,

                    'last_name' =>
                        $lastName,

                    'email' =>
                        strtolower(
                            trim(
                                $validated['email']
                            )
                        ),

                    'phone' =>
                        $validated['phone']
                        ?? null,

                    'account_status' =>
                        $validated['account_status']
                        ?? $customer->account_status,
                ]);

                $customer
                    ->customerProfile()
                    ->updateOrCreate(
                        [
                            'user_id' =>
                                $customer->id,
                        ],
                        $this->getProfilePayload(
                            $validated,
                            $customer->customerProfile
                        )
                    );

                if (
                    array_key_exists(
                        'shipping_address',
                        $validated
                    )
                ) {
                    $this->syncShippingAddress(
                        $customer,
                        $validated[
                            'shipping_address'
                        ]
                    );
                }
            }
        );

        $customer->refresh();

        $customer->load([
            'customerProfile',
            'defaultAddress',
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                'Customer updated successfully.',

            'customer' =>
                $this->transformCustomerDetails(
                    $customer
                ),
        ]);
    }

    public function destroy(
        User $customer
    ): JsonResponse {
        $this->ensureCustomer(
            $customer
        );

        /*
        |--------------------------------------------------------------------------
        | PROTECT ORDER HISTORY
        |--------------------------------------------------------------------------
        |
        | Your orders.user_id currently uses cascadeOnDelete().
        | Deleting a customer with orders would also delete order history.
        |
        */

        if (
            $customer
                ->orders()
                ->exists()
        ) {
            return response()->json([
                'success' => false,

                'message' =>
                    'This customer has order history and cannot be deleted. Ban or suspend the account instead.',
            ], 422);
        }

        $customer->delete();

        return response()->json([
            'success' => true,

            'message' =>
                'Customer deleted successfully.',
        ]);
    }

    private function validateCustomer(
        Request $request,
        ?User $customer = null
    ): array {
        return $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',

                Rule::unique(
                    'users',
                    'email'
                )->ignore(
                    $customer?->id
                ),
            ],

            'phone' => [
                'nullable',
                'string',
                'max:50',
            ],

            'password' => [
                $customer
                    ? 'nullable'
                    : 'nullable',

                'string',
                'min:8',
                'max:255',
            ],

            'account_status' => [
                'nullable',

                Rule::in([
                    'active',
                    'banned',
                    'pending_activation',
                    'suspended',
                ]),
            ],

            /*
            |--------------------------------------------------------------------------
            | SEGMENTATION
            |--------------------------------------------------------------------------
            */

            'acquisition_source' => [
                'nullable',
                'string',
                'max:100',
            ],

            'tags' => [
                'nullable',
            ],

            /*
            |--------------------------------------------------------------------------
            | LOYALTY
            |--------------------------------------------------------------------------
            */

            'loyalty_tier' => [
                'nullable',

                Rule::in([
                    'bronze',
                    'silver',
                    'gold',
                    'platinum',
                ]),
            ],

            'loyalty_points' => [
                'nullable',
                'integer',
                'min:0',
            ],

            /*
            |--------------------------------------------------------------------------
            | COMMUNICATION PREFERENCES
            |--------------------------------------------------------------------------
            */

            'marketing_opt_in' => [
                'nullable',
                'boolean',
            ],

            'order_updates' => [
                'nullable',
                'boolean',
            ],

            'promotions' => [
                'nullable',
                'boolean',
            ],

            'newsletter' => [
                'nullable',
                'boolean',
            ],

            'price_drops' => [
                'nullable',
                'boolean',
            ],

            'back_in_stock' => [
                'nullable',
                'boolean',
            ],

            'internal_notes' => [
                'nullable',
                'string',
                'max:5000',
            ],

            /*
            |--------------------------------------------------------------------------
            | SHIPPING ADDRESS
            |--------------------------------------------------------------------------
            */

            'shipping_address' => [
                'nullable',
                'array',
            ],

            'shipping_address.first_name' => [
                'nullable',
                'string',
                'max:100',
            ],

            'shipping_address.last_name' => [
                'nullable',
                'string',
                'max:100',
            ],

            'shipping_address.address_line1' => [
                'nullable',
                'string',
                'max:255',
            ],

            'shipping_address.address_line2' => [
                'nullable',
                'string',
                'max:255',
            ],

            'shipping_address.city' => [
                'nullable',
                'string',
                'max:100',
            ],

            'shipping_address.state' => [
                'nullable',
                'string',
                'max:100',
            ],

            'shipping_address.postal_code' => [
                'nullable',
                'string',
                'max:30',
            ],

            'shipping_address.country' => [
                'nullable',
                'string',
                'max:100',
            ],

            'shipping_address.phone' => [
                'nullable',
                'string',
                'max:50',
            ],
        ]);
    }

    private function getProfilePayload(
        array $validated,
        $existingProfile = null
    ): array {
        return [
            'acquisition_source' =>
                $validated['acquisition_source']
                ?? $existingProfile?->acquisition_source
                ?? null,

            'tags' =>
                array_key_exists(
                    'tags',
                    $validated
                )
                    ? $this->normalizeTags(
                        $validated['tags']
                    )
                    : (
                        $existingProfile?->tags
                        ?? []
                    ),

            'loyalty_tier' =>
                $validated['loyalty_tier']
                ?? $existingProfile?->loyalty_tier
                ?? 'bronze',

            'loyalty_points' =>
                $validated['loyalty_points']
                ?? $existingProfile?->loyalty_points
                ?? 0,

            'marketing_opt_in' =>
                array_key_exists(
                    'marketing_opt_in',
                    $validated
                )
                    ? (bool) $validated[
                        'marketing_opt_in'
                    ]
                    : (
                        $existingProfile?->marketing_opt_in
                        ?? false
                    ),

            'order_updates' =>
                array_key_exists(
                    'order_updates',
                    $validated
                )
                    ? (bool) $validated[
                        'order_updates'
                    ]
                    : (
                        $existingProfile?->order_updates
                        ?? true
                    ),

            'promotions' =>
                array_key_exists(
                    'promotions',
                    $validated
                )
                    ? (bool) $validated[
                        'promotions'
                    ]
                    : (
                        $existingProfile?->promotions
                        ?? false
                    ),

            'newsletter' =>
                array_key_exists(
                    'newsletter',
                    $validated
                )
                    ? (bool) $validated[
                        'newsletter'
                    ]
                    : (
                        $existingProfile?->newsletter
                        ?? false
                    ),

            'price_drops' =>
                array_key_exists(
                    'price_drops',
                    $validated
                )
                    ? (bool) $validated[
                        'price_drops'
                    ]
                    : (
                        $existingProfile?->price_drops
                        ?? false
                    ),

            'back_in_stock' =>
                array_key_exists(
                    'back_in_stock',
                    $validated
                )
                    ? (bool) $validated[
                        'back_in_stock'
                    ]
                    : (
                        $existingProfile?->back_in_stock
                        ?? false
                    ),

            'internal_notes' =>
                $validated['internal_notes']
                ?? $existingProfile?->internal_notes
                ?? null,
        ];
    }

    private function syncShippingAddress(
        User $customer,
        ?array $data
    ): void {
        if ($data === null) {
            return;
        }

        $address =
            $customer
                ->defaultAddress()
                ->first();

        $hasAddressData = collect([
            $data['first_name']
            ?? null,

            $data['last_name']
            ?? null,

            $data['address_line1']
            ?? null,

            $data['address_line2']
            ?? null,

            $data['city']
            ?? null,

            $data['state']
            ?? null,

            $data['postal_code']
            ?? null,

            $data['country']
            ?? null,

            $data['phone']
            ?? null,
        ])->contains(
            function ($value) {
                return filled(
                    $value
                );
            }
        );

        /*
        |--------------------------------------------------------------------------
        | EMPTY ADDRESS
        |--------------------------------------------------------------------------
        */

        if (
            !$address &&
            !$hasAddressData
        ) {
            return;
        }

        /*
        |--------------------------------------------------------------------------
        | NEW ADDRESS REQUIRES REQUIRED DATABASE FIELDS
        |--------------------------------------------------------------------------
        */

        if (!$address) {
            if (
                !filled(
                    $data[
                        'address_line1'
                    ]
                    ?? null
                )
            ) {
                throw ValidationException::withMessages([
                    'shipping_address.address_line1' =>
                        'Street address is required.',
                ]);
            }

            if (
                !filled(
                    $data[
                        'country'
                    ]
                    ?? null
                )
            ) {
                throw ValidationException::withMessages([
                    'shipping_address.country' =>
                        'Country is required.',
                ]);
            }
        }

        [
            $customerFirstName,
            $customerLastName,
        ] = $this->splitName(
            $customer->name
        );

        $payload = [
            'type' =>
                $address?->type
                ?? 'Home',

            'first_name' =>
                $this->valueOrExisting(
                    $data,
                    'first_name',
                    $address?->first_name
                    ?? $customer->first_name
                    ?? $customerFirstName
                ),

            'last_name' =>
                $this->valueOrExisting(
                    $data,
                    'last_name',
                    $address?->last_name
                    ?? $customer->last_name
                    ?? $customerLastName
                ),

            'country' =>
                $this->requiredValueOrExisting(
                    $data,
                    'country',
                    $address?->country
                ),

            'address_line1' =>
                $this->requiredValueOrExisting(
                    $data,
                    'address_line1',
                    $address?->address_line1
                ),

            'address_line2' =>
                array_key_exists(
                    'address_line2',
                    $data
                )
                    ? (
                        $data[
                            'address_line2'
                        ]
                        ?: null
                    )
                    : $address?->address_line2,

            'city' =>
                $this->valueOrExisting(
                    $data,
                    'city',
                    $address?->city
                ),

            'state' =>
                array_key_exists(
                    'state',
                    $data
                )
                    ? (
                        $data['state']
                        ?: null
                    )
                    : $address?->state,

            'postal_code' =>
                array_key_exists(
                    'postal_code',
                    $data
                )
                    ? (
                        $data[
                            'postal_code'
                        ]
                        ?: null
                    )
                    : $address?->postal_code,

            'phone' =>
                array_key_exists(
                    'phone',
                    $data
                )
                    ? (
                        $data['phone']
                        ?: null
                    )
                    : (
                        $address?->phone
                        ?? $customer->phone
                    ),

            'is_default' =>
                true,
        ];

        if ($address) {
            $address->update(
                $payload
            );
        } else {
            $address =
                $customer
                    ->addresses()
                    ->create(
                        $payload
                    );
        }

        $customer
            ->addresses()
            ->where(
                'id',
                '!=',
                $address->id
            )
            ->update([
                'is_default' =>
                    false,
            ]);
    }

    private function transformCustomerRow(
        User $customer
    ): array {
        $profile =
            $customer->customerProfile;

        $lastActive =
            $profile?->last_active_at
            ?? $customer->updated_at;

        return [
            'id' =>
                $customer->id,

            'name' =>
                $customer->name,

            'email' =>
                $customer->email,

            'phone' =>
                $customer->phone,

            'photo_url' =>
                $this->getCustomerPhotoUrl(
                    $customer->photo
                ),

            'account_status' =>
                $customer->account_status,

            'account_label' =>
                $this->getAccountStatusLabel(
                    $customer->account_status
                ),

            'loyalty_tier' =>
                $profile?->loyalty_tier
                ?? 'bronze',

            'loyalty_points' =>
                (int) (
                    $profile?->loyalty_points
                    ?? 0
                ),

            'orders_count' =>
                (int) (
                    $customer->orders_count
                    ?? 0
                ),

            'spent' =>
                round(
                    (float) (
                        $customer->spent
                        ?? 0
                    ),
                    2
                ),

            'last_active_at' =>
                $lastActive,

            'last_active_formatted' =>
                $this->formatLastActive(
                    $lastActive
                ),

            'tags' =>
                $profile?->tags
                ?? [],
        ];
    }

    private function transformCustomerDetails(
        User $customer
    ): array {
        $profile =
            $customer->customerProfile;

        $address =
            $customer->defaultAddress;

        $orderStats =
            $this->getCustomerOrderStats(
                $customer
            );

        return [
            'id' =>
                $customer->id,

            'name' =>
                $customer->name,

            'first_name' =>
                $customer->first_name,

            'last_name' =>
                $customer->last_name,

            'email' =>
                $customer->email,

            'phone' =>
                $customer->phone,

            'photo_url' =>
                $this->getCustomerPhotoUrl(
                    $customer->photo
                ),

            'account_status' =>
                $customer->account_status,

            'account_label' =>
                $this->getAccountStatusLabel(
                    $customer->account_status
                ),

            'created_at' =>
                $customer->created_at,

            /*
            |--------------------------------------------------------------------------
            | TOP SUMMARY
            |--------------------------------------------------------------------------
            */

            'stats' =>
                $orderStats,

            /*
            |--------------------------------------------------------------------------
            | SEGMENTATION + LOYALTY
            |--------------------------------------------------------------------------
            */

            'acquisition_source' =>
                $profile?->acquisition_source,

            'tags' =>
                $profile?->tags
                ?? [],

            'loyalty_tier' =>
                $profile?->loyalty_tier
                ?? 'bronze',

            'loyalty_points' =>
                (int) (
                    $profile?->loyalty_points
                    ?? 0
                ),

            /*
            |--------------------------------------------------------------------------
            | COMMUNICATION PREFERENCES
            |--------------------------------------------------------------------------
            */

            'communication_preferences' => [
                'marketing_opt_in' =>
                    (bool) (
                        $profile?->marketing_opt_in
                        ?? false
                    ),

                'order_updates' =>
                    (bool) (
                        $profile?->order_updates
                        ?? true
                    ),

                'promotions' =>
                    (bool) (
                        $profile?->promotions
                        ?? false
                    ),

                'newsletter' =>
                    (bool) (
                        $profile?->newsletter
                        ?? false
                    ),

                'price_drops' =>
                    (bool) (
                        $profile?->price_drops
                        ?? false
                    ),

                'back_in_stock' =>
                    (bool) (
                        $profile?->back_in_stock
                        ?? false
                    ),
            ],

            /*
            |--------------------------------------------------------------------------
            | SHIPPING ADDRESS
            |--------------------------------------------------------------------------
            */

            'shipping_address' =>
                $address
                    ? [
                        'id' =>
                            $address->id,

                        'first_name' =>
                            $address->first_name,

                        'last_name' =>
                            $address->last_name,

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

                        'phone' =>
                            $address->phone,
                    ]
                    : null,

            /*
            |--------------------------------------------------------------------------
            | NOTES
            |--------------------------------------------------------------------------
            */

            'internal_notes' =>
                $profile?->internal_notes,
        ];
    }

    private function getCustomerOrderStats(
        User $customer
    ): array {
        $totalOrders =
            $customer
                ->orders()
                ->count();

        $paidOrders =
            $customer
                ->orders()
                ->where(
                    'payment_status',
                    'paid'
                );

        $paidOrdersCount =
            (clone $paidOrders)
                ->count();

        $totalSpent =
            (float) (
                (clone $paidOrders)
                    ->sum(
                        'grand_total'
                    )
            );

        $averageOrder =
            $paidOrdersCount > 0
                ? $totalSpent /
                    $paidOrdersCount
                : 0;

        $lastOrder =
            $customer
                ->orders()
                ->orderByDesc(
                    'placed_at'
                )
                ->orderByDesc(
                    'id'
                )
                ->first();

        return [
            'total_spent' =>
                round(
                    $totalSpent,
                    2
                ),

            'orders' =>
                $totalOrders,

            'average_order' =>
                round(
                    $averageOrder,
                    2
                ),

            'last_order_at' =>
                $lastOrder?->placed_at
                ?? $lastOrder?->created_at,

            'last_order_no' =>
                $lastOrder?->order_no,

            'loyalty_points' =>
                (int) (
                    $customer
                        ->customerProfile
                        ?->loyalty_points
                    ?? 0
                ),
        ];
    }

    private function getCustomerStats(): array
    {
        $totalCustomers =
            User::query()
                ->where(
                    'role',
                    'customer'
                )
                ->count();

        $activeAccounts =
            User::query()
                ->where(
                    'role',
                    'customer'
                )
                ->where(
                    'account_status',
                    'active'
                )
                ->count();

        $vipCustomers =
            User::query()
                ->where(
                    'role',
                    'customer'
                )
                ->whereHas(
                    'customerProfile',
                    function ($query) {
                        $query->whereIn(
                            'loyalty_tier',
                            [
                                'gold',
                                'platinum',
                            ]
                        );
                    }
                )
                ->count();

        $customerSpend =
            (float) Order::query()
                ->where(
                    'payment_status',
                    'paid'
                )
                ->whereHas(
                    'user',
                    function ($query) {
                        $query->where(
                            'role',
                            'customer'
                        );
                    }
                )
                ->sum(
                    'grand_total'
                );

        $averageSpend =
            $totalCustomers > 0
                ? $customerSpend /
                    $totalCustomers
                : 0;

        return [
            'total_customers' =>
                $totalCustomers,

            'active_accounts' =>
                $activeAccounts,

            'vip_customers' =>
                $vipCustomers,

            'customer_spend' =>
                round(
                    $customerSpend,
                    2
                ),

            'average_spend_per_customer' =>
                round(
                    $averageSpend,
                    2
                ),
        ];
    }

    private function getTabCounts(): array
    {
        $baseQuery =
            User::query()
                ->where(
                    'role',
                    'customer'
                );

        return [
            'all' =>
                (clone $baseQuery)
                    ->count(),

            'active' =>
                (clone $baseQuery)
                    ->where(
                        'account_status',
                        'active'
                    )
                    ->count(),

            'inactive' =>
                (clone $baseQuery)
                    ->whereIn(
                        'account_status',
                        [
                            'pending_activation',
                            'suspended',
                        ]
                    )
                    ->count(),

            'banned' =>
                (clone $baseQuery)
                    ->where(
                        'account_status',
                        'banned'
                    )
                    ->count(),
        ];
    }

    private function normalizeTags(
        mixed $tags
    ): array {
        if (is_string($tags)) {
            $tags = explode(
                ',',
                $tags
            );
        }

        if (!is_array($tags)) {
            return [];
        }

        return collect($tags)
            ->map(
                function ($tag) {
                    return trim(
                        (string) $tag
                    );
                }
            )
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function splitName(
        string $name
    ): array {
        $name =
            trim($name);

        if ($name === '') {
            return [
                '',
                '',
            ];
        }

        $parts =
            preg_split(
                '/\s+/',
                $name
            );

        $firstName =
            array_shift(
                $parts
            );

        $lastName =
            count($parts)
                ? implode(
                    ' ',
                    $parts
                )
                : '';

        return [
            $firstName,
            $lastName,
        ];
    }

    private function getAccountStatusLabel(
        ?string $status
    ): string {
        return match ($status) {
            'active' =>
                'Active',

            'banned' =>
                'Banned',

            'pending_activation' =>
                'Inactive',

            'suspended' =>
                'Inactive',

            default =>
                'Inactive',
        };
    }

    private function formatLastActive(
        $date
    ): string {
        if (!$date) {
            return '—';
        }

        if ($date->isToday()) {
            return 'Today';
        }

        if ($date->isYesterday()) {
            return 'Yesterday';
        }

        return $date->diffForHumans();
    }

    private function getCustomerPhotoUrl(
        ?string $photo
    ): ?string {
        if (!$photo) {
            return null;
        }

        if (
            str_starts_with(
                $photo,
                'http://'
            )
            ||
            str_starts_with(
                $photo,
                'https://'
            )
        ) {
            return $photo;
        }

        return
            request()
                ->getSchemeAndHttpHost()
            . '/'
            . ltrim(
                $photo,
                '/'
            );
    }

    private function valueOrExisting(
        array $data,
        string $key,
        mixed $existing = null
    ): mixed {
        if (
            array_key_exists(
                $key,
                $data
            ) &&
            filled(
                $data[$key]
            )
        ) {
            return $data[$key];
        }

        return $existing;
    }

    private function requiredValueOrExisting(
        array $data,
        string $key,
        mixed $existing = null
    ): mixed {
        if (
            array_key_exists(
                $key,
                $data
            ) &&
            filled(
                $data[$key]
            )
        ) {
            return $data[$key];
        }

        if (filled($existing)) {
            return $existing;
        }

        throw ValidationException::withMessages([
            'shipping_address.' . $key =>
                ucfirst(
                    str_replace(
                        '_',
                        ' ',
                        $key
                    )
                ) . ' is required.',
        ]);
    }

    private function ensureCustomer(
        User $customer
    ): void {
        if (
            $customer->role !==
            'customer'
        ) {
            abort(404);
        }
    }
}