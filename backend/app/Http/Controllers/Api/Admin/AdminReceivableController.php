<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Models\VendorFinanceEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminReceivableController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'search' => [
                'nullable',
                'string',
                'max:255',
            ],

            'status' => [
                'nullable',
                Rule::in([
                    'all',
                    'pending',
                    'payment_required',
                    'approved',
                    'suspended',
                    'rejected',
                ]),
            ],

            'balance' => [
                'nullable',
                Rule::in([
                    'all',
                    'with_balance',
                    'vendor_payable',
                    'admin_receivable',
                    'settled',
                ]),
            ],

            'sort' => [
                'nullable',
                Rule::in([
                    'store_asc',
                    'store_desc',
                    'newest',
                    'oldest',
                ]),
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $query = Vendor::query()
            ->select([
                'vendors.id',
                'vendors.user_id',
                'vendors.store_name',
                'vendors.slug',
                'vendors.status',
                'vendors.commission_rate',
                'vendors.created_at',
            ])
            ->with([
                'user:id,name,email',
            ])
            ->selectSub(
                VendorFinanceEntry::query()
                    ->selectRaw(
                        'COALESCE(SUM(held_amount), 0)'
                    )
                    ->whereColumn(
                        'vendor_finance_entries.vendor_id',
                        'vendors.id'
                    ),
                'held_balance'
            )
            ->selectSub(
                VendorFinanceEntry::query()
                    ->selectRaw(
                        'COALESCE(SUM(owed_amount), 0)'
                    )
                    ->whereColumn(
                        'vendor_finance_entries.vendor_id',
                        'vendors.id'
                    ),
                'commission_balance'
            );

        if (
            $request->filled('status')
            && $request->status !== 'all'
        ) {
            $query->where(
                'vendors.status',
                $request->status
            );
        }

        if ($request->filled('search')) {
            $search = trim($request->search);

            $query->where(function ($builder) use ($search) {
                $builder
                    ->where(
                        'vendors.store_name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'vendors.slug',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereHas(
                        'user',
                        function ($userQuery) use ($search) {
                            $userQuery
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'email',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
            });
        }

        $this->applyBalanceFilter(
            $query,
            $request->input('balance', 'all')
        );

        $this->applySorting(
            $query,
            $request->input('sort', 'store_asc')
        );

        $vendors = $query->paginate(
            $request->integer(
                'per_page',
                20
            )
        );

        $vendors->getCollection()->transform(
            function ($vendor) {
                return $this->formatVendorBalance(
                    $vendor
                );
            }
        );

        return response()->json([
            'success' => true,

            'message' =>
                'Vendor receivables fetched successfully.',

            'summary' =>
                $this->summary(),

            'data' => $vendors,
        ]);
    }

    public function show(
        Request $request,
        Vendor $vendor
    ): JsonResponse {
        $request->validate([
            'type' => [
                'nullable',
                Rule::in([
                    'all',
                    'sale',
                    'refund',
                    'commission',
                    'commission_refund',
                    'payout',
                    'adjustment',
                ]),
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

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $query = VendorFinanceEntry::query()
            ->where(
                'vendor_id',
                $vendor->id
            )
            ->with([
                'order:id,order_no,status,payment_status,grand_total,currency,created_at',

                'payout:id,payout_number,status,net_amount,currency',
            ]);

        if (
            $request->filled('type')
            && $request->type !== 'all'
        ) {
            $query->where(
                'type',
                $request->type
            );
        }

        if ($request->filled('date_from')) {
            $query->whereDate(
                'occurred_at',
                '>=',
                $request->date_from
            );
        }

        if ($request->filled('date_to')) {
            $query->whereDate(
                'occurred_at',
                '<=',
                $request->date_to
            );
        }

        $entries = $query
            ->orderByDesc('occurred_at')
            ->orderByDesc('id')
            ->paginate(
                $request->integer(
                    'per_page',
                    20
                )
            );

        $balances = $this->vendorBalances(
            $vendor->id
        );

        return response()->json([
            'success' => true,

            'message' =>
                'Vendor receivable details fetched successfully.',

            'vendor' => [
                'id' => $vendor->id,
                'user_id' => $vendor->user_id,
                'store_name' => $vendor->store_name,
                'slug' => $vendor->slug,
                'status' => $vendor->status,

                'commission_rate' =>
                    round(
                        (float) $vendor->commission_rate,
                        2
                    ),
            ],

            'balances' => $balances,

            'entries' => $entries,
        ]);
    }

    private function summary(): array
    {
        $heldBalance = (float) VendorFinanceEntry::query()
            ->sum('held_amount');

        $commissionBalance = (float) VendorFinanceEntry::query()
            ->sum('owed_amount');

        $owedToVendors = -$heldBalance;

        $netToSettle =
            $owedToVendors
            - $commissionBalance;

        return [
            'owed_to_vendors' =>
                round($owedToVendors, 2),

            'commission_owed_to_admin' =>
                round($commissionBalance, 2),

            'net_to_settle' =>
                round($netToSettle, 2),

            'currency' => 'USD',
        ];
    }

    private function vendorBalances(
        int $vendorId
    ): array {
        $heldBalance = (float) VendorFinanceEntry::query()
            ->where(
                'vendor_id',
                $vendorId
            )
            ->sum('held_amount');

        $commissionBalance = (float) VendorFinanceEntry::query()
            ->where(
                'vendor_id',
                $vendorId
            )
            ->sum('owed_amount');

        $owedToVendor = -$heldBalance;

        $netToSettle =
            $owedToVendor
            - $commissionBalance;

        return [
            'owed_to_vendor' =>
                round($owedToVendor, 2),

            'commission_owed_to_admin' =>
                round($commissionBalance, 2),

            'net_to_settle' =>
                round($netToSettle, 2),

            'currency' => 'USD',
        ];
    }

    private function formatVendorBalance(
        Vendor $vendor
    ): array {
        $heldBalance = (float) $vendor->held_balance;

        $commissionBalance =
            (float) $vendor->commission_balance;

        $owedToVendor = -$heldBalance;

        $netToSettle =
            $owedToVendor
            - $commissionBalance;

        return [
            'id' => $vendor->id,

            'user_id' => $vendor->user_id,

            'store_name' =>
                $vendor->store_name,

            'slug' => $vendor->slug,

            'status' => $vendor->status,

            'commission_rate' =>
                round(
                    (float) $vendor->commission_rate,
                    2
                ),

            'owner' => $vendor->user
                ? [
                    'id' =>
                        $vendor->user->id,

                    'name' =>
                        $vendor->user->name,

                    'email' =>
                        $vendor->user->email,
                ]
                : null,

            'owed_to_vendor' =>
                round($owedToVendor, 2),

            'commission_owed_to_admin' =>
                round($commissionBalance, 2),

            'net_to_settle' =>
                round($netToSettle, 2),

            'settlement_direction' =>
                $this->settlementDirection(
                    $netToSettle
                ),

            'currency' => 'USD',
        ];
    }

    private function settlementDirection(
        float $netToSettle
    ): string {
        if ($netToSettle < 0) {
            return 'admin_pays_vendor';
        }

        if ($netToSettle > 0) {
            return 'vendor_pays_admin';
        }

        return 'settled';
    }

    private function applyBalanceFilter(
        $query,
        string $balance
    ): void {
        switch ($balance) {
            case 'with_balance':
                $query->where(function ($builder) {
                    $builder
                        ->whereExists(
                            function ($subQuery) {
                                $subQuery
                                    ->selectRaw('1')
                                    ->from(
                                        'vendor_finance_entries'
                                    )
                                    ->whereColumn(
                                        'vendor_finance_entries.vendor_id',
                                        'vendors.id'
                                    )
                                    ->where(function ($entryQuery) {
                                        $entryQuery
                                            ->where(
                                                'held_amount',
                                                '!=',
                                                0
                                            )
                                            ->orWhere(
                                                'owed_amount',
                                                '!=',
                                                0
                                            );
                                    });
                            }
                        );
                });

                break;

            case 'vendor_payable':
                $query->whereRaw(
                    '(
                        SELECT COALESCE(SUM(held_amount), 0)
                        FROM vendor_finance_entries
                        WHERE vendor_finance_entries.vendor_id = vendors.id
                    ) > 0'
                );

                break;

            case 'admin_receivable':
                $query->whereRaw(
                    '(
                        (
                            SELECT COALESCE(SUM(held_amount), 0)
                            FROM vendor_finance_entries
                            WHERE vendor_finance_entries.vendor_id = vendors.id
                        )
                        +
                        (
                            SELECT COALESCE(SUM(owed_amount), 0)
                            FROM vendor_finance_entries
                            WHERE vendor_finance_entries.vendor_id = vendors.id
                        )
                    ) < 0'
                );

                break;

            case 'settled':
                $query->whereRaw(
                    '(
                        SELECT COALESCE(SUM(held_amount), 0)
                        FROM vendor_finance_entries
                        WHERE vendor_finance_entries.vendor_id = vendors.id
                    ) = 0'
                );

                $query->whereRaw(
                    '(
                        SELECT COALESCE(SUM(owed_amount), 0)
                        FROM vendor_finance_entries
                        WHERE vendor_finance_entries.vendor_id = vendors.id
                    ) = 0'
                );

                break;
        }
    }

    private function applySorting(
        $query,
        string $sort
    ): void {
        switch ($sort) {
            case 'store_desc':
                $query->orderByDesc(
                    'vendors.store_name'
                );

                break;

            case 'newest':
                $query->orderByDesc(
                    'vendors.created_at'
                );

                break;

            case 'oldest':
                $query->orderBy(
                    'vendors.created_at'
                );

                break;

            default:
                $query->orderBy(
                    'vendors.store_name'
                );

                break;
        }
    }
}
