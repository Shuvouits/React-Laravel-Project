<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminExpense;
use App\Models\PaymentTransaction;
use App\Models\VendorFinanceEntry;
use App\Models\VendorPayout;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;

class AdminFinanceController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | ADMIN FINANCE OVERVIEW
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/finance/overview
    |
    | Query:
    | ?period=last_30_days
    | ?book=both
    |
    */

    public function overview(Request $request): JsonResponse
    {
        $request->validate([
            'period' => [
                'nullable',
                Rule::in([
                    'today',
                    'last_7_days',
                    'last_30_days',
                    'last_90_days',
                    'this_month',
                    'this_year',
                    'all_time',
                    'custom',
                ]),
            ],

            'book' => [
                'nullable',
                Rule::in([
                    'both',
                    'own_store',
                    'marketplace',
                ]),
            ],

            'date_from' => [
                'nullable',
                'required_if:period,custom',
                'date',
            ],

            'date_to' => [
                'nullable',
                'required_if:period,custom',
                'date',
                'after_or_equal:date_from',
            ],
        ]);

        $period = $request->input(
            'period',
            'last_30_days'
        );

        $book = $request->input(
            'book',
            'both'
        );

        [$dateFrom, $dateTo] = $this->resolveDateRange(
            $period,
            $request->date_from,
            $request->date_to
        );

        /*
        |--------------------------------------------------------------------------
        | PRODUCT SALES
        |--------------------------------------------------------------------------
        */

        $ownStoreProductSales =
            $this->calculateProductSales(
                'admin',
                $dateFrom,
                $dateTo
            );

        $marketplaceProductSales =
            $this->calculateProductSales(
                'vendor',
                $dateFrom,
                $dateTo
            );

        /*
        |--------------------------------------------------------------------------
        | COMMISSION
        |--------------------------------------------------------------------------
        */

        $marketplaceCommission =
            $this->calculateMarketplaceCommission(
                $dateFrom,
                $dateTo
            );

        /*
        |--------------------------------------------------------------------------
        | SHIPPING AND TAX
        |--------------------------------------------------------------------------
        */

        $shippingCharged =
            $this->calculateOrderTotal(
                'shipping_total',
                $dateFrom,
                $dateTo
            );

        $taxCollected =
            $this->calculateOrderTotal(
                'tax_total',
                $dateFrom,
                $dateTo
            );

        /*
        |--------------------------------------------------------------------------
        | REFUNDS
        |--------------------------------------------------------------------------
        */

        $totalRefunds =
            $this->calculateRefunds(
                $dateFrom,
                $dateTo
            );

        $ownStoreRefunds =
            $this->calculateRefundShare(
                'admin',
                $dateFrom,
                $dateTo
            );

        $marketplaceRefunds =
            $this->calculateRefundShare(
                'vendor',
                $dateFrom,
                $dateTo
            );

        /*
        |--------------------------------------------------------------------------
        | EXPENSES
        |--------------------------------------------------------------------------
        */

        $ownStoreExpenses =
            $this->calculateExpenses(
                'own_store',
                $dateFrom,
                $dateTo
            );

        $marketplaceExpenses =
            $this->calculateExpenses(
                'marketplace',
                $dateFrom,
                $dateTo
            );

        /*
        |--------------------------------------------------------------------------
        | PAYOUT AND RECEIVABLE BALANCES
        |--------------------------------------------------------------------------
        */

        $paidPayoutAmount =
            $this->calculatePaidPayoutAmount(
                $dateFrom,
                $dateTo
            );

        $pendingPayoutAmount =
            $this->calculatePendingPayoutAmount(
                $dateFrom,
                $dateTo
            );

        $owedToVendors =
            $this->calculateOwedToVendors();

        $commissionOwedToAdmin =
            $this->calculateCommissionOwedToAdmin();

        /*
        |--------------------------------------------------------------------------
        | PAYMENT BALANCES
        |--------------------------------------------------------------------------
        */

        $inGateway =
            $this->calculateGatewayBalance(
                $dateFrom,
                $dateTo
            );

        $cashInHand =
            $this->calculateCashInHand(
                $dateFrom,
                $dateTo
            );

        /*
        |--------------------------------------------------------------------------
        | BOOK TOTALS
        |--------------------------------------------------------------------------
        */

        $ownStoreIncome =
            $ownStoreProductSales
            + $shippingCharged
            - $ownStoreRefunds;

        $ownStoreNet =
            $ownStoreIncome
            - $ownStoreExpenses;

        $marketplaceIncome =
            $marketplaceCommission;

        $marketplaceNet =
            $marketplaceIncome
            - $marketplaceExpenses;

        $totalIncome =
            $ownStoreIncome
            + $marketplaceIncome;

        $totalCosts =
            $ownStoreExpenses
            + $marketplaceExpenses;

        $totalNet =
            $totalIncome
            - $totalCosts;

        $orderVolume =
            $ownStoreProductSales
            + $marketplaceProductSales
            + $shippingCharged
            + $taxCollected
            - $totalRefunds;

        /*
        |--------------------------------------------------------------------------
        | BOOK FILTER
        |--------------------------------------------------------------------------
        */

        if ($book === 'own_store') {
            $totalIncome = $ownStoreIncome;
            $totalCosts = $ownStoreExpenses;
            $totalNet = $ownStoreNet;
        }

        if ($book === 'marketplace') {
            $totalIncome = $marketplaceIncome;
            $totalCosts = $marketplaceExpenses;
            $totalNet = $marketplaceNet;
        }

        return response()->json([
            'success' => true,

            'message' =>
                'Finance overview fetched successfully.',

            'filters' => [
                'period' => $period,
                'book' => $book,

                'date_from' =>
                    $dateFrom?->toDateString(),

                'date_to' =>
                    $dateTo?->toDateString(),
            ],

            'currency' => 'USD',

            /*
            |--------------------------------------------------------------------------
            | TWO MAIN BOOKS
            |--------------------------------------------------------------------------
            */

            'books' => [
                'own_store' => [
                    'income' => $this->money(
                        $ownStoreIncome
                    ),

                    'costs' => $this->money(
                        $ownStoreExpenses
                    ),

                    'net' => $this->money(
                        $ownStoreNet
                    ),
                ],

                'marketplace' => [
                    'income' => $this->money(
                        $marketplaceIncome
                    ),

                    'costs' => $this->money(
                        $marketplaceExpenses
                    ),

                    'net' => $this->money(
                        $marketplaceNet
                    ),
                ],
            ],

            /*
            |--------------------------------------------------------------------------
            | TOP SUMMARY CARDS
            |--------------------------------------------------------------------------
            */

            'summary' => [
                'income' => $this->money(
                    $totalIncome
                ),

                'costs' => $this->money(
                    $totalCosts
                ),

                'net' => $this->money(
                    $totalNet
                ),

                'order_volume' => $this->money(
                    $orderVolume
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | WHERE IT CAME FROM
            |--------------------------------------------------------------------------
            */

            'income_sources' => [
                'product_sales' => $this->money(
                    $ownStoreProductSales
                    + $marketplaceProductSales
                ),

                'own_store_product_sales' =>
                    $this->money(
                        $ownStoreProductSales
                    ),

                'marketplace_product_sales' =>
                    $this->money(
                        $marketplaceProductSales
                    ),

                'commission' => $this->money(
                    $marketplaceCommission
                ),

                'shipping_charged' =>
                    $this->money(
                        $shippingCharged
                    ),

                'refunds' => $this->money(
                    -$totalRefunds
                ),

                'income' => $this->money(
                    $totalIncome
                ),
            ],

            /*
            |--------------------------------------------------------------------------
            | WHERE IT WENT
            |--------------------------------------------------------------------------
            */

            'cost_sources' => [
                'own_store_expenses' =>
                    $this->money(
                        $ownStoreExpenses
                    ),

                'marketplace_expenses' =>
                    $this->money(
                        $marketplaceExpenses
                    ),

                'total_expenses' =>
                    $this->money(
                        $totalCosts
                    ),
            ],

            /*
            |--------------------------------------------------------------------------
            | BALANCE CARDS
            |--------------------------------------------------------------------------
            */

            'balances' => [
                'in_gateway' => $this->money(
                    $inGateway
                ),

                'in_bank' => $this->money(
                    $paidPayoutAmount
                    - $totalCosts
                ),

                'cash_in_hand' => $this->money(
                    $cashInHand
                ),

                'owed_to_vendors' => $this->money(
                    $owedToVendors
                ),

                'commission_owed_to_admin' =>
                    $this->money(
                        $commissionOwedToAdmin
                    ),

                'pending_payout_amount' =>
                    $this->money(
                        $pendingPayoutAmount
                    ),

                'paid_payout_amount' =>
                    $this->money(
                        $paidPayoutAmount
                    ),

                'tax_collected' => $this->money(
                    $taxCollected
                ),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PRODUCT SALES BY PRODUCT SOURCE
    |--------------------------------------------------------------------------
    */

    private function calculateProductSales(
        string $source,
        ?Carbon $dateFrom,
        ?Carbon $dateTo
    ): float {
        $query = DB::table('order_items')
            ->join(
                'orders',
                'orders.id',
                '=',
                'order_items.order_id'
            )
            ->join(
                'products',
                'products.id',
                '=',
                'order_items.product_id'
            )
            ->where(
                'products.source',
                $source
            )
            ->whereIn(
                'orders.payment_status',
                [
                    'paid',
                    'partially_refunded',
                    'refunded',
                ]
            );

        $this->applyDateRange(
            $query,
            'orders.paid_at',
            $dateFrom,
            $dateTo
        );

        return (float) $query->sum(
            'order_items.line_total'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | MARKETPLACE COMMISSION
    |--------------------------------------------------------------------------
    */

    private function calculateMarketplaceCommission(
        ?Carbon $dateFrom,
        ?Carbon $dateTo
    ): float {
        $query = DB::table('order_items')
            ->join(
                'orders',
                'orders.id',
                '=',
                'order_items.order_id'
            )
            ->join(
                'products',
                'products.id',
                '=',
                'order_items.product_id'
            )
            ->join(
                'vendors',
                'vendors.user_id',
                '=',
                'products.created_by'
            )
            ->where(
                'products.source',
                'vendor'
            )
            ->whereIn(
                'orders.payment_status',
                [
                    'paid',
                    'partially_refunded',
                    'refunded',
                ]
            );

        $this->applyDateRange(
            $query,
            'orders.paid_at',
            $dateFrom,
            $dateTo
        );

        $commission = $query->sum(
            DB::raw(
                'order_items.line_total
                * vendors.commission_rate
                / 100'
            )
        );

        $marketplaceRefunds =
            $this->calculateRefundShare(
                'vendor',
                $dateFrom,
                $dateTo
            );

        $averageCommissionRate =
            (float) DB::table('vendors')
                ->where(
                    'status',
                    'approved'
                )
                ->avg('commission_rate');

        if ($averageCommissionRate <= 0) {
            $averageCommissionRate = 10;
        }

        $refundedCommission =
            $marketplaceRefunds
            * ($averageCommissionRate / 100);

        return max(
            0,
            (float) $commission
            - $refundedCommission
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ORDER FIELD TOTAL
    |--------------------------------------------------------------------------
    */

    private function calculateOrderTotal(
        string $column,
        ?Carbon $dateFrom,
        ?Carbon $dateTo
    ): float {
        $allowedColumns = [
            'shipping_total',
            'tax_total',
            'grand_total',
            'subtotal',
            'discount_total',
        ];

        if (!in_array($column, $allowedColumns, true)) {
            return 0;
        }

        $query = DB::table('orders')
            ->whereIn(
                'payment_status',
                [
                    'paid',
                    'partially_refunded',
                    'refunded',
                ]
            );

        $this->applyDateRange(
            $query,
            'paid_at',
            $dateFrom,
            $dateTo
        );

        return (float) $query->sum(
            $column
        );
    }

    /*
    |--------------------------------------------------------------------------
    | TOTAL REFUNDS
    |--------------------------------------------------------------------------
    */

    private function calculateRefunds(
        ?Carbon $dateFrom,
        ?Carbon $dateTo
    ): float {
        $query = PaymentTransaction::query()
            ->whereIn(
                'status',
                [
                    'refunded',
                    'partially_refunded',
                ]
            );

        $this->applyDateRange(
            $query,
            'created_at',
            $dateFrom,
            $dateTo
        );

        return (float) $query->sum(
            'amount'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | REFUND SHARE BY PRODUCT SOURCE
    |--------------------------------------------------------------------------
    */

    private function calculateRefundShare(
        string $source,
        ?Carbon $dateFrom,
        ?Carbon $dateTo
    ): float {
        $refundTransactions = DB::table(
            'payment_transactions'
        )
            ->whereIn(
                'status',
                [
                    'refunded',
                    'partially_refunded',
                ]
            );

        $this->applyDateRange(
            $refundTransactions,
            'created_at',
            $dateFrom,
            $dateTo
        );

        $refundTransactions = $refundTransactions->get([
            'order_id',
            'amount',
        ]);

        $refundShare = 0;

        foreach ($refundTransactions as $transaction) {
            $orderSubtotal = (float) DB::table(
                'order_items'
            )
                ->where(
                    'order_id',
                    $transaction->order_id
                )
                ->sum('line_total');

            if ($orderSubtotal <= 0) {
                continue;
            }

            $sourceSubtotal = (float) DB::table(
                'order_items'
            )
                ->join(
                    'products',
                    'products.id',
                    '=',
                    'order_items.product_id'
                )
                ->where(
                    'order_items.order_id',
                    $transaction->order_id
                )
                ->where(
                    'products.source',
                    $source
                )
                ->sum(
                    'order_items.line_total'
                );

            $ratio =
                $sourceSubtotal
                / $orderSubtotal;

            $refundShare +=
                (float) $transaction->amount
                * $ratio;
        }

        return $refundShare;
    }

    /*
    |--------------------------------------------------------------------------
    | EXPENSE TOTAL
    |--------------------------------------------------------------------------
    */

    private function calculateExpenses(
        string $book,
        ?Carbon $dateFrom,
        ?Carbon $dateTo
    ): float {
        $query = AdminExpense::query()
            ->where(
                'book',
                $book
            );

        $this->applyDateRange(
            $query,
            'expense_date',
            $dateFrom,
            $dateTo
        );

        return (float) $query->sum(
            'amount'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | PAID PAYOUTS
    |--------------------------------------------------------------------------
    */

    private function calculatePaidPayoutAmount(
    ?Carbon $dateFrom,
    ?Carbon $dateTo
): float {
    $amountColumn = $this->getPayoutAmountColumn();

    if (!$amountColumn) {
        return 0;
    }

    $query = VendorPayout::query()
        ->where('status', 'paid');

    $this->applyDateRange(
        $query,
        'paid_at',
        $dateFrom,
        $dateTo
    );

    return (float) $query->sum($amountColumn);
}

    /*
    |--------------------------------------------------------------------------
    | PENDING PAYOUTS
    |--------------------------------------------------------------------------
    */

  private function calculatePendingPayoutAmount(
    ?Carbon $dateFrom,
    ?Carbon $dateTo
): float {
    $amountColumn = $this->getPayoutAmountColumn();

    if (!$amountColumn) {
        return 0;
    }

    $query = VendorPayout::query()
        ->whereIn('status', [
            'pending',
            'processing',
        ]);

    $this->applyDateRange(
        $query,
        'created_at',
        $dateFrom,
        $dateTo
    );

    return (float) $query->sum($amountColumn);
}
    /*
    |--------------------------------------------------------------------------
    | OWED TO VENDORS
    |--------------------------------------------------------------------------
    */

    private function calculateOwedToVendors(): float
    {
        return (float) VendorFinanceEntry::query()
            ->sum('held_amount');
    }

    /*
    |--------------------------------------------------------------------------
    | COMMISSION OWED TO ADMIN
    |--------------------------------------------------------------------------
    */

    private function calculateCommissionOwedToAdmin(): float
    {
        return (float) VendorFinanceEntry::query()
            ->sum('owed_amount');
    }

    /*
    |--------------------------------------------------------------------------
    | GATEWAY BALANCE
    |--------------------------------------------------------------------------
    */

    private function calculateGatewayBalance(
        ?Carbon $dateFrom,
        ?Carbon $dateTo
    ): float {
        $paidQuery = PaymentTransaction::query()
            ->whereIn(
                'status',
                [
                    'paid',
                    'succeeded',
                ]
            )
            ->whereNotIn(
                'gateway',
                [
                    'manual',
                    'cash',
                    'cash_on_delivery',
                    'pos_cash',
                ]
            );

        $this->applyDateRange(
            $paidQuery,
            'created_at',
            $dateFrom,
            $dateTo
        );

        $paidAmount = (float) $paidQuery->sum(
            'amount'
        );

        $refundQuery = PaymentTransaction::query()
            ->whereIn(
                'status',
                [
                    'refunded',
                    'partially_refunded',
                ]
            )
            ->whereNotIn(
                'gateway',
                [
                    'manual',
                    'cash',
                    'cash_on_delivery',
                    'pos_cash',
                ]
            );

        $this->applyDateRange(
            $refundQuery,
            'created_at',
            $dateFrom,
            $dateTo
        );

        $refundAmount = (float) $refundQuery->sum(
            'amount'
        );

        return $paidAmount - $refundAmount;
    }

    /*
    |--------------------------------------------------------------------------
    | CASH IN HAND
    |--------------------------------------------------------------------------
    */

    private function calculateCashInHand(
        ?Carbon $dateFrom,
        ?Carbon $dateTo
    ): float {
        $query = DB::table('orders')
            ->whereIn(
                'payment_status',
                [
                    'paid',
                    'partially_refunded',
                ]
            )
            ->where(function ($builder) {
                $builder
                    ->whereIn(
                        'payment_method',
                        [
                            'manual',
                            'cash',
                            'cash_on_delivery',
                            'cod',
                            'pos_cash',
                        ]
                    )
                    ->orWhere(
                        'channel',
                        'pos'
                    );
            });

        $this->applyDateRange(
            $query,
            'paid_at',
            $dateFrom,
            $dateTo
        );

        return (float) $query->sum(
            'grand_total'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DATE RANGE
    |--------------------------------------------------------------------------
    */

    private function resolveDateRange(
        string $period,
        ?string $dateFrom,
        ?string $dateTo
    ): array {
        $end = Carbon::now()->endOfDay();

        switch ($period) {
            case 'today':
                return [
                    Carbon::today()->startOfDay(),
                    Carbon::today()->endOfDay(),
                ];

            case 'last_7_days':
                return [
                    Carbon::today()
                        ->subDays(6)
                        ->startOfDay(),

                    $end,
                ];

            case 'last_90_days':
                return [
                    Carbon::today()
                        ->subDays(89)
                        ->startOfDay(),

                    $end,
                ];

            case 'this_month':
                return [
                    Carbon::now()
                        ->startOfMonth()
                        ->startOfDay(),

                    $end,
                ];

            case 'this_year':
                return [
                    Carbon::now()
                        ->startOfYear()
                        ->startOfDay(),

                    $end,
                ];

            case 'all_time':
                return [
                    null,
                    null,
                ];

            case 'custom':
                return [
                    Carbon::parse($dateFrom)
                        ->startOfDay(),

                    Carbon::parse($dateTo)
                        ->endOfDay(),
                ];

            default:
                return [
                    Carbon::today()
                        ->subDays(29)
                        ->startOfDay(),

                    $end,
                ];
        }
    }

    /*
    |--------------------------------------------------------------------------
    | APPLY DATE RANGE
    |--------------------------------------------------------------------------
    */

    private function applyDateRange(
        $query,
        string $column,
        ?Carbon $dateFrom,
        ?Carbon $dateTo
    ): void {
        if ($dateFrom) {
            $query->where(
                $column,
                '>=',
                $dateFrom
            );
        }

        if ($dateTo) {
            $query->where(
                $column,
                '<=',
                $dateTo
            );
        }
    }

    /*
    |--------------------------------------------------------------------------
    | MONEY FORMAT
    |--------------------------------------------------------------------------
    */

    private function money(
        float|int|string|null $amount
    ): float {
        return round(
            (float) $amount,
            2
        );
    }  


    private function getPayoutAmountColumn(): ?string
{
    $columns = [
        'net_amount',
        'net_payout',
        'amount',
    ];

    foreach ($columns as $column) {
        if (Schema::hasColumn('vendor_payouts', $column)) {
            return $column;
        }
    }

    return null;
}



}
