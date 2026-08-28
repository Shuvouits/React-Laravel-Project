<?php

namespace App\Http\Controllers\Api\Pos;

use App\Http\Controllers\Controller;
use App\Models\CustomerProfile;
use App\Models\User;
use App\Services\Pos\PosCatalogService;
use App\Services\Pos\PosCheckoutService;
use App\Services\Pos\PosHeldSaleService;
use App\Services\Pos\PosRegisterService;
use App\Services\Pos\PosSaleHistoryService;
use App\Services\Pos\PosRefundService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;




abstract class BasePosController extends Controller
{

    public function __construct(
        protected PosCatalogService $catalogService
    ) {
    }

    abstract protected function resolveContext(
        User $user,
        ?int $locationId = null
    ): array;

    abstract protected function locationsForContext(
        array $context
    ): array;

    public function context(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => [
                'nullable',
                'integer',
            ],
        ]);

        $context = $this->makeContext(
            $request,
            $validated['location_id'] ?? null
        );

        return response()->json([
            'success' => true,
            'message' => 'POS context fetched successfully.',
            'context' => $context,
            'locations' => $this->locationsForContext($context),
        ]);
    }

    public function locations(Request $request): JsonResponse
    {
        $context = $this->makeContext($request);

        return response()->json([
            'success' => true,
            'locations' => $this->locationsForContext($context),
        ]);
    }

    public function categories(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => [
                'nullable',
                'integer',
            ],
        ]);

        $context = $this->makeContext(
            $request,
            $validated['location_id'] ?? null
        );

        return response()->json([
            'success' => true,
            'categories' => $this->catalogService->categories($context),
        ]);
    }

    public function products(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => [
                'nullable',
                'integer',
            ],

            'search' => [
                'nullable',
                'string',
                'max:191',
            ],

            'category_id' => [
                'nullable',
                'integer',
                'exists:categories,id',
            ],

            'stock' => [
                'nullable',
                Rule::in([
                    'all',
                    'in_stock',
                    'out_of_stock',
                    'low_stock',
                ]),
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $context = $this->makeContext(
            $request,
            $validated['location_id'] ?? null
        );

        $catalog = $this->catalogService->catalog(
            $context,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'POS products fetched successfully.',
            'location' => $context['location'],
            'products' => $catalog['products'],
            'pagination' => $catalog['pagination'],
        ]);
    }

    public function barcodeLookup(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'location_id' => [
                'required',
                'integer',
            ],

            'code' => [
                'required',
                'string',
                'max:255',
            ],
        ]);

        $context = $this->makeContext(
            $request,
            $validated['location_id']
        );

        $result = $this->catalogService->barcodeLookup(
            $context,
            $context['location_id'],
            trim($validated['code'])
        );

        return response()->json([
            'success' => true,
            'message' => 'POS product matched successfully.',
            ...$result,
        ]);
    }

    public function customers(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => [
                'required',
                'string',
                'min:2',
                'max:191',
            ],

            'limit' => [
                'nullable',
                'integer',
                'min:1',
                'max:30',
            ],
        ]);

        $search = trim($validated['search']);
        $limit = (int) ($validated['limit'] ?? 15);

        $customers = User::query()
            ->where('role', 'customer')
            ->where('account_status', 'active')
            ->where(function ($query) use ($search) {
                $query
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            })
            ->with('customerProfile')
            ->orderBy('name')
            ->limit($limit)
            ->get()
            ->map(
                fn (User $customer) => $this->customerData($customer)
            )
            ->values();

        return response()->json([
            'success' => true,
            'customers' => $customers,
        ]);
    }

    public function storeCustomer(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email'),
            ],

            'phone' => [
                'nullable',
                'string',
                'max:50',
            ],

            'marketing_opt_in' => [
                'nullable',
                'boolean',
            ],
        ]);

        $customer = DB::transaction(function () use ($validated) {
            $nameParts = $this->splitCustomerName(
                $validated['name']
            );

            $customer = User::query()->create([
                'name' => trim($validated['name']),
                'first_name' => $nameParts['first_name'],
                'last_name' => $nameParts['last_name'],
                'email' => strtolower(trim($validated['email'])),
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make(Str::random(40)),
                'role' => 'customer',
                'account_status' => 'active',
            ]);

            CustomerProfile::query()->create([
                'user_id' => $customer->id,
                'acquisition_source' => 'pos',
                'tags' => [],
                'loyalty_tier' => 'bronze',
                'loyalty_points' => 0,
                'marketing_opt_in' => (bool) (
                    $validated['marketing_opt_in'] ?? false
                ),
            ]);

            return $customer->load('customerProfile');
        });

        return response()->json([
            'success' => true,
            'message' => 'Customer created successfully.',
            'customer' => $this->customerData($customer),
        ], 201);
    }

    public function currentRegister(
        Request $request,
        PosRegisterService $registerService
    ): JsonResponse {
        $validated = $request->validate([
            'location_id' => [
                'nullable',
                'integer',
            ],
        ]);

        $context = $this->makeContext(
            $request,
            $validated['location_id'] ?? null
        );

        return response()->json([
            'success' => true,
            'register_session' => $registerService->current($context),
        ]);
    }

    public function openRegister(
        Request $request,
        PosRegisterService $registerService
    ): JsonResponse {
        $validated = $request->validate([
            'location_id' => [
                'required',
                'integer',
            ],

            'opening_balance' => [
                'required',
                'numeric',
                'min:0',
                'max:999999999.99',
            ],

            'opening_note' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $context = $this->makeContext(
            $request,
            $validated['location_id']
        );

        $session = $registerService->open(
            $context,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'POS register opened successfully.',
            'register_session' => $session,
        ], 201);
    }

    public function closeRegister(
        Request $request,
        int $registerSessionId,
        PosRegisterService $registerService
    ): JsonResponse {
        $validated = $request->validate([
            'location_id' => [
                'required',
                'integer',
            ],

            'closing_balance' => [
                'required',
                'numeric',
                'min:0',
                'max:999999999.99',
            ],

            'closing_note' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        $context = $this->makeContext(
            $request,
            $validated['location_id']
        );

        $session = $registerService->close(
            $context,
            $registerSessionId,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'POS register closed successfully.',
            'register_session' => $session,
        ]);
    }

    public function checkout(
        Request $request,
        PosCheckoutService $checkoutService
    ): JsonResponse {
        $validated = $request->validate(
            $this->checkoutRules()
        );

        $context = $this->makeContext(
            $request,
            $validated['location_id']
        );

        $validated['currency'] = strtoupper(
            $validated['currency'] ?? 'USD'
        );

        $validated['customer_snapshot'] = $this->getCustomerSnapshot(
            $validated['customer_id'] ?? null
        );

        $result = $checkoutService->checkout(
            $context,
            $validated
        );

        return response()->json([
            'success' => true,
            ...$result,
        ], 201);
    }

    public function heldSales(
        Request $request,
        PosHeldSaleService $heldSaleService
    ): JsonResponse {
        $validated = $request->validate([
            'location_id' => [
                'required',
                'integer',
                'exists:inventory_locations,id',
            ],

            'search' => [
                'nullable',
                'string',
                'max:255',
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $context = $this->makeContext(
            $request,
            $validated['location_id']
        );

        $heldSales = $heldSaleService->list(
            $context,
            $validated
        );

        return response()->json([
            'success' => true,
            'held_sales' => $heldSales->items(),

            'pagination' => [
                'current_page' => $heldSales->currentPage(),
                'last_page' => $heldSales->lastPage(),
                'per_page' => $heldSales->perPage(),
                'total' => $heldSales->total(),
                'from' => $heldSales->firstItem(),
                'to' => $heldSales->lastItem(),
            ],
        ]);
    }

    public function holdSale(
        Request $request,
        PosHeldSaleService $heldSaleService
    ): JsonResponse {
        $validated = $request->validate(
            $this->holdSaleRules()
        );

        $context = $this->makeContext(
            $request,
            $validated['location_id']
        );

        $validated['currency'] = strtoupper(
            $validated['currency'] ?? 'USD'
        );

        $validated['customer_snapshot'] = $this->getCustomerSnapshot(
            $validated['customer_id'] ?? null
        );

        $heldSale = $heldSaleService->hold(
            $context,
            $validated
        );

        return response()->json([
            'success' => true,
            'message' => 'Sale successfully held.',

            'held_sale' => [
                'id' => $heldSale->id,
                'reference' => $heldSale->reference,
                'status' => $heldSale->status,
                'customer_id' => $heldSale->customer_id,
                'subtotal' => (float) $heldSale->subtotal,
                'discount_total' => (float) $heldSale->discount_total,
                'tax_rate' => (float) $heldSale->tax_rate,
                'tax_total' => (float) $heldSale->tax_total,
                'grand_total' => (float) $heldSale->grand_total,
                'held_at' => $heldSale->held_at,
            ],
        ], 201);
    }

    public function resumeHeldSale(
        Request $request,
        int $heldSaleId,
        PosHeldSaleService $heldSaleService
    ): JsonResponse {
        $validated = $request->validate(
            $this->heldSaleActionRules()
        );

        $context = $this->makeContext(
            $request,
            $validated['location_id']
        );

        $heldSale = $heldSaleService->resume(
            $context,
            $heldSaleId
        );

        return response()->json([
            'success' => true,
            'message' => 'Held sale fetched successfully.',
            'held_sale' => $heldSale,
        ]);
    }

    public function completeHeldSale(
        Request $request,
        int $heldSaleId,
        PosHeldSaleService $heldSaleService
    ): JsonResponse {
        $validated = $request->validate(
            $this->heldSaleActionRules()
        );

        $context = $this->makeContext(
            $request,
            $validated['location_id']
        );

        $heldSaleService->complete(
            $context,
            $heldSaleId
        );

        return response()->json([
            'success' => true,
            'message' => 'Held sale completed successfully.',
        ]);
    }

    public function cancelHeldSale(
        Request $request,
        int $heldSaleId,
        PosHeldSaleService $heldSaleService
    ): JsonResponse {
        $validated = $request->validate(
            $this->heldSaleActionRules()
        );

        $context = $this->makeContext(
            $request,
            $validated['location_id']
        );

        $heldSaleService->remove(
            $context,
            $heldSaleId
        );

        return response()->json([
            'success' => true,
            'message' => 'Held sale cancelled successfully.',
        ]);
    }

    public function sales(
        Request $request,
        PosSaleHistoryService $saleHistoryService
    ): JsonResponse {
        $validated = $request->validate([
            'location_id' => [
                'required',
                'integer',
                'exists:inventory_locations,id',
            ],

            'search' => [
                'nullable',
                'string',
                'max:255',
            ],

            'status' => [
                'nullable',
                Rule::in([
                    'completed',
                    'partially_refunded',
                    'refunded',
                    'cancelled',
                ]),
            ],

            'payment_status' => [
                'nullable',
                Rule::in([
                    'pending',
                    'partially_paid',
                    'paid',
                    'partially_refunded',
                    'refunded',
                    'failed',
                ]),
            ],

            'payment_method' => [
                'nullable',
                Rule::in([
                    'cash',
                    'card',
                    'bank',
                    'mobile_banking',
                    'manual',
                    'mixed',
                ]),
            ],

            'cashier_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'customer_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],

            'sort' => [
                'nullable',
                Rule::in([
                    'asc',
                    'desc',
                ]),
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],

            'page' => [
                'nullable',
                'integer',
                'min:1',
            ],
        ]);

        $context = $this->makeContext(
            $request,
            $validated['location_id']
        );

        $sales = $saleHistoryService->list(
            $context,
            $validated
        );

        $formattedSales = collect($sales->items())
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'sale_number' => $sale->sale_number,
                    'order_id' => $sale->order_id,
                    'order_no' => $sale->order_no,
                    'register_session_id' => $sale->register_session_id,
                    'customer_id' => $sale->customer_id,
                    'cashier_id' => $sale->cashier_id,
                    'status' => $sale->status,
                    'payment_status' => $sale->payment_status,
                    'payment_method' => $sale->primary_payment_method,
                    'currency' => $sale->currency,
                    'subtotal' => (float) $sale->subtotal,
                    'discount_total' => (float) $sale->discount_total,
                    'tax_total' => (float) $sale->tax_total,
                    'grand_total' => (float) $sale->grand_total,
                    'amount_paid' => (float) $sale->amount_paid,
                    'change_amount' => (float) $sale->change_amount,
                    'refunded_total' => (float) (
                        $sale->refunded_total ?? 0
                    ),
                    'completed_at' => $sale->completed_at,
                    'refunded_at' => $sale->refunded_at,
                ];
            })
            ->values();

        return response()->json([
            'success' => true,
            'sales' => $formattedSales,

            'pagination' => [
                'current_page' => $sales->currentPage(),
                'last_page' => $sales->lastPage(),
                'per_page' => $sales->perPage(),
                'total' => $sales->total(),
                'from' => $sales->firstItem(),
                'to' => $sales->lastItem(),
            ],
        ]);
    }

    public function saleDetails(
        Request $request,
        int $saleId,
        PosSaleHistoryService $saleHistoryService
    ): JsonResponse {
        $validated = $request->validate(
            $this->saleActionRules()
        );

        $context = $this->makeContext(
            $request,
            $validated['location_id']
        );

        return response()->json([
            'success' => true,

            'sale' => $saleHistoryService->details(
                $context,
                $saleId
            ),
        ]);
    }

    public function saleReceipt(
        Request $request,
        int $saleId,
        PosSaleHistoryService $saleHistoryService
    ): JsonResponse {
        $validated = $request->validate(
            $this->saleActionRules()
        );

        $context = $this->makeContext(
            $request,
            $validated['location_id']
        );

        return response()->json([
            'success' => true,

            'receipt' => $saleHistoryService->receipt(
                $context,
                $saleId
            ),
        ]);
    }

    public function refundSale(
    Request $request,
    int $saleId,
    PosRefundService $refundService
): JsonResponse {
    $validated = $request->validate(
        $this->refundSaleRules()
    );

    $context = $this->makeContext(
        $request,
        $validated['location_id']
    );

    $result = $refundService->refund(
        $context,
        $saleId,
        $validated
    );

    return response()->json([
        'success' => true,
        ...$result,
    ], 201);
}

    protected function authenticatedUser(Request $request): User
    {
        $user = $request->user();

        if (!$user instanceof User) {
            throw ValidationException::withMessages([
                'user' => [
                    'Authenticated user was not found.',
                ],
            ]);
        }

        return $user;
    }

    protected function customerData(User $customer): array
    {
        $profile = $customer->customerProfile;

        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'first_name' => $customer->first_name,
            'last_name' => $customer->last_name,
            'email' => $customer->email,
            'phone' => $customer->phone,
            'photo' => $customer->photo,

            'photo_url' => $customer->photo
                ? asset($customer->photo)
                : null,

            'loyalty_tier' => $profile?->loyalty_tier ?? 'bronze',

            'loyalty_points' => (int) (
                $profile?->loyalty_points ?? 0
            ),

            'marketing_opt_in' => (bool) (
                $profile?->marketing_opt_in ?? false
            ),
        ];
    }

    protected function makeContext(
        Request $request,
        ?int $locationId = null
    ): array {
        return $this->resolveContext(
            $this->authenticatedUser($request),
            $locationId !== null
                ? (int) $locationId
                : null
        );
    }

    private function getCustomerSnapshot(
        ?int $customerId
    ): ?array {
        if (!$customerId) {
            return null;
        }

        $customer = User::query()
            ->where('role', 'customer')
            ->where('account_status', 'active')
            ->with('customerProfile')
            ->find($customerId);

        if (!$customer) {
            throw ValidationException::withMessages([
                'customer_id' => [
                    'Active customer account পাওয়া যায়নি।',
                ],
            ]);
        }

        return [
            'id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'phone' => $customer->phone,

            'loyalty_tier' => $customer
                ->customerProfile
                ?->loyalty_tier,

            'loyalty_points' => (int) (
                $customer
                    ->customerProfile
                    ?->loyalty_points ?? 0
            ),
        ];
    }

    private function splitCustomerName(string $name): array
    {
        $cleanName = preg_replace(
            '/\s+/',
            ' ',
            trim($name)
        );

        $parts = explode(' ', $cleanName);
        $firstName = array_shift($parts);

        return [
            'first_name' => $firstName,

            'last_name' => count($parts)
                ? implode(' ', $parts)
                : null,
        ];
    }

    private function checkoutRules(): array
    {
        return [
            ...$this->commonSaleRules(),

            'register_session_id' => [
                'required',
                'integer',
                'exists:pos_register_sessions,id',
            ],

            'payments' => [
                'required',
                'array',
                'min:1',
            ],

            'payments.*.method' => [
                'required',
                Rule::in([
                    'cash',
                    'card',
                    'bank',
                    'mobile_banking',
                    'manual',
                ]),
            ],

            'payments.*.amount' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'payments.*.reference' => [
                'nullable',
                'string',
                'max:255',
            ],

            'payments.*.last_four' => [
                'nullable',
                'digits:4',
            ],

            'payments.*.metadata' => [
                'nullable',
                'array',
            ],
        ];
    }

    private function holdSaleRules(): array
    {
        return $this->commonSaleRules();
    }

    private function commonSaleRules(): array
    {
        return [
            'location_id' => [
                'required',
                'integer',
                'exists:inventory_locations,id',
            ],

            'customer_id' => [
                'nullable',
                'integer',
                'exists:users,id',
            ],

            'currency' => [
                'nullable',
                'string',
                'size:3',
            ],

            'note' => [
                'nullable',
                'string',
                'max:1000',
            ],

            'internal_note' => [
                'nullable',
                'string',
                'max:1000',
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
                'max:10000',
            ],

            'items.*.note' => [
                'nullable',
                'string',
                'max:500',
            ],

            'discount' => [
                'nullable',
                'array',
            ],

            'discount.type' => [
                'nullable',
                Rule::in([
                    'fixed',
                    'percentage',
                ]),
            ],

            'discount.value' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'discount.reason' => [
                'nullable',
                'string',
                'max:255',
            ],

            'tax_rate' => [
                'nullable',
                'numeric',
                'min:0',
                'max:100',
            ],
        ];
    }

    private function heldSaleActionRules(): array
    {
        return [
            'location_id' => [
                'required',
                'integer',
                'exists:inventory_locations,id',
            ],
        ];
    }


    private function saleActionRules(): array
{
    return [
        'location_id' => [
            'required',
            'integer',
            'exists:inventory_locations,id',
        ],
    ];
}

private function refundSaleRules(): array
{
    return [
        'location_id' => [
            'required',
            'integer',
            'exists:inventory_locations,id',
        ],

        'items' => [
            'required',
            'array',
            'min:1',
        ],

        'items.*.order_item_id' => [
            'required',
            'integer',
            'distinct',
            'exists:order_items,id',
        ],

        'items.*.quantity' => [
            'required',
            'integer',
            'min:1',
        ],

        'reason' => [
            'nullable',
            'string',
            'max:255',
        ],

        'notes' => [
            'nullable',
            'string',
            'max:2000',
        ],

        'payment_method' => [
            'nullable',
            Rule::in([
                'cash',
                'card',
                'bank',
                'mobile_banking',
                'manual',
                'mixed',
            ]),
        ],

        'payment_reference' => [
            'nullable',
            'string',
            'max:255',
        ],

        'restock_items' => [
            'nullable',
            'boolean',
        ],
    ];
}



   
}
