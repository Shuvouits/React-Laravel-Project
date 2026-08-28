<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AdminExpense;
use App\Models\FinancePeriodClosure;
use App\Models\PaymentTransaction;
use App\Models\VendorFinanceEntry;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminFinanceReportController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'book' => ['nullable', Rule::in(['both', 'own_store', 'marketplace'])],
        ]);

        $year = $request->integer('year', now()->year);
        $book = $request->input('book', 'both');

        $startDate = Carbon::create($year, 1, 1)->startOfDay();
        $endDate = Carbon::create($year, 12, 31)->endOfDay();

        if ($year === now()->year) {
            $endDate = now()->endOfDay();
        }

        $report = $this->calculateReport(
            $startDate,
            $endDate,
            $book
        );

        $closures = FinancePeriodClosure::query()
            ->with('closedBy:id,name,email')
            ->whereYear('period_start', $year)
            ->when(
                $book !== 'both',
                function ($query) use ($book) {
                    $query->where('book', $book);
                }
            )
            ->orderByDesc('period_month')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Finance report fetched successfully.',

            'filters' => [
                'year' => $year,
                'book' => $book,
                'date_from' => $startDate->toDateString(),
                'date_to' => $endDate->toDateString(),
            ],

            'currency' => 'USD',
            'report' => $report,
            'closed_months' => $closures,
        ]);
    }

    public function closeMonth(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'month' => [
                'required',
                'date_format:Y-m',
            ],

            'book' => [
                'nullable',
                Rule::in([
                    'both',
                    'own_store',
                    'marketplace',
                ]),
            ],
        ]);

        $month = $validated['month'];
        $book = $validated['book'] ?? 'both';

        $periodStart = Carbon::createFromFormat(
            'Y-m',
            $month
        )->startOfMonth()->startOfDay();

        $periodEnd = $periodStart
            ->copy()
            ->endOfMonth()
            ->endOfDay();

        if ($periodEnd->greaterThanOrEqualTo(now()->startOfMonth())) {
            throw ValidationException::withMessages([
                'month' => [
                    'The current or a future month cannot be closed.',
                ],
            ]);
        }

        $closure = DB::transaction(function () use (
            $request,
            $month,
            $book,
            $periodStart,
            $periodEnd
        ) {
            $existingClosure = FinancePeriodClosure::query()
                ->where('period_month', $month)
                ->where('book', $book)
                ->lockForUpdate()
                ->first();

            if ($existingClosure) {
                throw ValidationException::withMessages([
                    'month' => [
                        'This finance month has already been closed.',
                    ],
                ]);
            }

            $report = $this->calculateReport(
                $periodStart,
                $periodEnd,
                $book
            );

            return FinancePeriodClosure::create([
                'period_month' => $month,
                'period_start' => $periodStart->toDateString(),
                'period_end' => $periodEnd->toDateString(),
                'book' => $book,
                'currency' => 'USD',

                'product_sales' =>
                    $report['income_sources']['product_sales'],

                'commission_income' =>
                    $report['income_sources']['commission'],

                'shipping_income' =>
                    $report['income_sources']['shipping_charged'],

                'refunds' =>
                    $report['income_sources']['refunds'],

                'total_income' =>
                    $report['summary']['income'],

                'total_costs' =>
                    $report['summary']['costs'],

                'net_at_close' =>
                    $report['summary']['net'],

                'order_volume' =>
                    $report['summary']['order_volume'],

                'tax_collected' =>
                    $report['tax']['collected'],

                'tax_refunded' =>
                    $report['tax']['refunded'],

                'tax_owed_onward' =>
                    $report['tax']['owed_onward'],

                'owed_to_vendors' =>
                    $report['balances']['owed_to_vendors'],

                'commission_owed_to_admin' =>
                    $report['balances']['commission_owed_to_admin'],

                'snapshot' => $report,
                'closed_by' => $request->user()->id,
                'closed_at' => now(),
            ]);
        });

        return response()->json([
            'success' => true,
            'message' => 'Finance month closed successfully.',
            'data' => $closure->load('closedBy:id,name,email'),
        ], 201);
    }

    public function ledgerCsv(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'month' => ['nullable', 'date_format:Y-m'],
        ]);

        [$startDate, $endDate, $label] = $this->exportDateRange(
            $validated['year'] ?? null,
            $validated['month'] ?? null
        );

        $fileName = 'finance-ledger-' . $label . '.csv';

        return response()->streamDownload(
            function () use ($startDate, $endDate) {
                $output = fopen('php://output', 'w');

                fwrite($output, "\xEF\xBB\xBF");

                fputcsv($output, [
                    'Date',
                    'Book',
                    'Type',
                    'Reference',
                    'Description',
                    'Debit',
                    'Credit',
                    'Currency',
                ]);

                PaymentTransaction::query()
                    ->with('order:id,order_no')
                    ->whereBetween('created_at', [$startDate, $endDate])
                    ->orderBy('id')
                    ->chunkById(500, function ($transactions) use ($output) {
                        foreach ($transactions as $transaction) {
                            $isRefund = $this->isRefund(
                                $transaction
                            );

                            fputcsv($output, [
                                optional($transaction->created_at)
                                    ->format('Y-m-d H:i:s'),

                                'store',

                                $isRefund
                                    ? 'refund'
                                    : 'charge',

                                $transaction->order
                                    ? $transaction->order->order_no
                                    : $transaction->gateway_reference,

                                $this->gatewayName(
                                    $transaction->gateway
                                ),

                                $isRefund
                                    ? $transaction->amount
                                    : 0,

                                $isRefund
                                    ? 0
                                    : $transaction->amount,

                                $transaction->currency ?: 'USD',
                            ]);
                        }
                    });

                AdminExpense::query()
                    ->whereBetween(
                        'expense_date',
                        [
                            $startDate->toDateString(),
                            $endDate->toDateString(),
                        ]
                    )
                    ->orderBy('id')
                    ->chunkById(500, function ($expenses) use ($output) {
                        foreach ($expenses as $expense) {
                            fputcsv($output, [
                                optional($expense->expense_date)
                                    ->format('Y-m-d'),

                                $expense->book,

                                'expense',

                                'EXPENSE-' . $expense->id,

                                $expense->description,

                                $expense->amount,

                                0,

                                $expense->currency ?: 'USD',
                            ]);
                        }
                    });

                VendorFinanceEntry::query()
                    ->whereBetween(
                        'occurred_at',
                        [$startDate, $endDate]
                    )
                    ->orderBy('id')
                    ->chunkById(500, function ($entries) use ($output) {
                        foreach ($entries as $entry) {
                            $value =
                                (float) $entry->held_amount
                                + (float) $entry->owed_amount;

                            fputcsv($output, [
                                optional($entry->occurred_at)
                                    ->format('Y-m-d H:i:s'),

                                'marketplace',

                                $entry->type,

                                $entry->reference,

                                $entry->description,

                                $value < 0
                                    ? abs($value)
                                    : 0,

                                $value > 0
                                    ? $value
                                    : 0,

                                $entry->currency ?: 'USD',
                            ]);
                        }
                    });

                fclose($output);
            },
            $fileName,
            [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]
        );
    }

    public function expensesCsv(Request $request): StreamedResponse
    {
        $validated = $request->validate([
            'year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'month' => ['nullable', 'date_format:Y-m'],

            'book' => [
                'nullable',
                Rule::in([
                    'both',
                    'own_store',
                    'marketplace',
                ]),
            ],
        ]);

        [$startDate, $endDate, $label] = $this->exportDateRange(
            $validated['year'] ?? null,
            $validated['month'] ?? null
        );

        $book = $validated['book'] ?? 'both';

        $query = AdminExpense::query()
            ->whereBetween(
                'expense_date',
                [
                    $startDate->toDateString(),
                    $endDate->toDateString(),
                ]
            )
            ->when(
                $book !== 'both',
                function ($query) use ($book) {
                    $query->where('book', $book);
                }
            )
            ->orderBy('expense_date')
            ->orderBy('id');

        return response()->streamDownload(
            function () use ($query) {
                $output = fopen('php://output', 'w');

                fwrite($output, "\xEF\xBB\xBF");

                fputcsv($output, [
                    'Date',
                    'Description',
                    'Category',
                    'Paid From',
                    'Paid To',
                    'Book',
                    'Amount',
                    'Currency',
                    'Repeats',
                    'Note',
                ]);

                $query->chunkById(500, function ($expenses) use ($output) {
                    foreach ($expenses as $expense) {
                        fputcsv($output, [
                            optional($expense->expense_date)
                                ->format('Y-m-d'),

                            $expense->description,
                            $expense->category,
                            $expense->paid_from,
                            $expense->paid_to,
                            $expense->book,
                            $expense->amount,
                            $expense->currency,

                            $expense->repeats
                                ? 'Yes'
                                : 'No',

                            $expense->note,
                        ]);
                    }
                });

                fclose($output);
            },
            'finance-expenses-' . $label . '.csv',
            [
                'Content-Type' => 'text/csv; charset=UTF-8',
            ]
        );
    }

    private function calculateReport(
        Carbon $startDate,
        Carbon $endDate,
        string $book
    ): array {
        $ownStoreSales = $this->productSales(
            'admin',
            $startDate,
            $endDate
        );

        $marketplaceSales = $this->productSales(
            'vendor',
            $startDate,
            $endDate
        );

        $ownStoreRefunds = $this->refundShare(
            'admin',
            $startDate,
            $endDate
        );

        $marketplaceRefunds = $this->refundShare(
            'vendor',
            $startDate,
            $endDate
        );

        $totalRefunds =
            $ownStoreRefunds
            + $marketplaceRefunds;

        $commission = $this->commissionIncome(
            $startDate,
            $endDate,
            $marketplaceRefunds
        );

        $shipping = $this->orderSum(
            'shipping_total',
            $startDate,
            $endDate
        );

        $taxCollected = $this->orderSum(
            'tax_total',
            $startDate,
            $endDate
        );

        $taxRefunded = $this->taxRefunded(
            $startDate,
            $endDate
        );

        $taxOwedOnward = max(
            0,
            $taxCollected - $taxRefunded
        );

        $ownStoreCosts = $this->expenseSum(
            'own_store',
            $startDate,
            $endDate
        );

        $marketplaceCosts = $this->expenseSum(
            'marketplace',
            $startDate,
            $endDate
        );

        $ownStoreIncome =
            $ownStoreSales
            + $shipping
            - $ownStoreRefunds;

        $marketplaceIncome = $commission;

        if ($book === 'own_store') {
            $income = $ownStoreIncome;
            $costs = $ownStoreCosts;
            $productSales = $ownStoreSales;
            $refunds = $ownStoreRefunds;
            $commissionIncome = 0;
            $shippingIncome = $shipping;
        } elseif ($book === 'marketplace') {
            $income = $marketplaceIncome;
            $costs = $marketplaceCosts;
            $productSales = 0;
            $refunds = $marketplaceRefunds;
            $commissionIncome = $commission;
            $shippingIncome = 0;
        } else {
            $income =
                $ownStoreIncome
                + $marketplaceIncome;

            $costs =
                $ownStoreCosts
                + $marketplaceCosts;

            $productSales = $ownStoreSales;
            $refunds = $totalRefunds;
            $commissionIncome = $commission;
            $shippingIncome = $shipping;
        }

        $orderVolume = $this->orderSum(
            'grand_total',
            $startDate,
            $endDate
        );

        $heldBalance = (float) VendorFinanceEntry::query()
            ->where(
                'occurred_at',
                '<=',
                $endDate
            )
            ->sum('held_amount');

        $commissionBalance = (float) VendorFinanceEntry::query()
            ->where(
                'occurred_at',
                '<=',
                $endDate
            )
            ->sum('owed_amount');

        return [
            'summary' => [
                'income' => $this->money($income),
                'costs' => $this->money($costs),
                'net' => $this->money($income - $costs),
                'order_volume' => $this->money($orderVolume),
            ],

            'books' => [
                'own_store' => [
                    'income' => $this->money($ownStoreIncome),
                    'costs' => $this->money($ownStoreCosts),

                    'net' => $this->money(
                        $ownStoreIncome - $ownStoreCosts
                    ),
                ],

                'marketplace' => [
                    'income' => $this->money($marketplaceIncome),
                    'costs' => $this->money($marketplaceCosts),

                    'net' => $this->money(
                        $marketplaceIncome - $marketplaceCosts
                    ),
                ],
            ],

            'income_sources' => [
                'product_sales' => $this->money($productSales),
                'marketplace_sales' => $this->money($marketplaceSales),
                'commission' => $this->money($commissionIncome),
                'shipping_charged' => $this->money($shippingIncome),
                'refunds' => $this->money($refunds),
            ],

            'cost_sources' => [
                'own_store_expenses' => $this->money($ownStoreCosts),
                'marketplace_expenses' => $this->money($marketplaceCosts),
                'total_expenses' => $this->money($costs),
            ],

            'tax' => [
                'collected' => $this->money($taxCollected),
                'refunded' => $this->money($taxRefunded),
                'owed_onward' => $this->money($taxOwedOnward),
            ],

            'balances' => [
                'owed_to_vendors' => $this->money(-$heldBalance),

                'commission_owed_to_admin' =>
                    $this->money($commissionBalance),

                'net_to_settle' =>
                    $this->money(
                        -$heldBalance
                        - $commissionBalance
                    ),
            ],
        ];
    }

    private function productSales(
        string $source,
        Carbon $startDate,
        Carbon $endDate
    ): float {
        return (float) DB::table('order_items')
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
            )
            ->whereBetween(
                'orders.paid_at',
                [$startDate, $endDate]
            )
            ->sum('order_items.line_total');
    }

    private function commissionIncome(
        Carbon $startDate,
        Carbon $endDate,
        float $marketplaceRefunds
    ): float {
        $commission = (float) DB::table('order_items')
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
            )
            ->whereBetween(
                'orders.paid_at',
                [$startDate, $endDate]
            )
            ->sum(
                DB::raw(
                    'order_items.line_total
                    * vendors.commission_rate
                    / 100'
                )
            );

        $averageRate = (float) DB::table('vendors')
            ->where('status', 'approved')
            ->avg('commission_rate');

        $averageRate = $averageRate > 0
            ? $averageRate
            : 10;

        $refundCommission =
            $marketplaceRefunds
            * ($averageRate / 100);

        return max(
            0,
            $commission - $refundCommission
        );
    }

    private function refundShare(
        string $source,
        Carbon $startDate,
        Carbon $endDate
    ): float {
        $refunds = PaymentTransaction::query()
            ->whereIn(
                'status',
                [
                    'refunded',
                    'partially_refunded',
                ]
            )
            ->whereBetween(
                'created_at',
                [$startDate, $endDate]
            )
            ->get([
                'order_id',
                'amount',
            ]);

        $total = 0;

        foreach ($refunds as $refund) {
            $orderSubtotal = (float) DB::table('order_items')
                ->where('order_id', $refund->order_id)
                ->sum('line_total');

            if ($orderSubtotal <= 0) {
                continue;
            }

            $sourceSubtotal = (float) DB::table('order_items')
                ->join(
                    'products',
                    'products.id',
                    '=',
                    'order_items.product_id'
                )
                ->where(
                    'order_items.order_id',
                    $refund->order_id
                )
                ->where(
                    'products.source',
                    $source
                )
                ->sum('order_items.line_total');

            $total +=
                (float) $refund->amount
                * ($sourceSubtotal / $orderSubtotal);
        }

        return $total;
    }

    private function taxRefunded(
        Carbon $startDate,
        Carbon $endDate
    ): float {
        $refunds = PaymentTransaction::query()
            ->with('order:id,grand_total,tax_total')
            ->whereIn(
                'status',
                [
                    'refunded',
                    'partially_refunded',
                ]
            )
            ->whereBetween(
                'created_at',
                [$startDate, $endDate]
            )
            ->get();

        $total = 0;

        foreach ($refunds as $refund) {
            if (
                !$refund->order
                || (float) $refund->order->grand_total <= 0
            ) {
                continue;
            }

            $taxRatio =
                (float) $refund->order->tax_total
                / (float) $refund->order->grand_total;

            $total +=
                (float) $refund->amount
                * $taxRatio;
        }

        return $total;
    }

    private function orderSum(
        string $column,
        Carbon $startDate,
        Carbon $endDate
    ): float {
        $allowed = [
            'subtotal',
            'shipping_total',
            'tax_total',
            'grand_total',
        ];

        if (!in_array($column, $allowed, true)) {
            return 0;
        }

        return (float) DB::table('orders')
            ->whereIn(
                'payment_status',
                [
                    'paid',
                    'partially_refunded',
                    'refunded',
                ]
            )
            ->whereBetween(
                'paid_at',
                [$startDate, $endDate]
            )
            ->sum($column);
    }

    private function expenseSum(
        string $book,
        Carbon $startDate,
        Carbon $endDate
    ): float {
        return (float) AdminExpense::query()
            ->where('book', $book)
            ->whereBetween(
                'expense_date',
                [
                    $startDate->toDateString(),
                    $endDate->toDateString(),
                ]
            )
            ->sum('amount');
    }

    private function exportDateRange(
        ?int $year,
        ?string $month
    ): array {
        if ($month) {
            $start = Carbon::createFromFormat(
                'Y-m',
                $month
            )->startOfMonth();

            return [
                $start->copy()->startOfDay(),
                $start->copy()->endOfMonth()->endOfDay(),
                $month,
            ];
        }

        $year = $year ?: now()->year;

        return [
            Carbon::create($year, 1, 1)->startOfDay(),
            Carbon::create($year, 12, 31)->endOfDay(),
            (string) $year,
        ];
    }

    private function isRefund(
        PaymentTransaction $transaction
    ): bool {
        if (
            in_array(
                $transaction->status,
                [
                    'refunded',
                    'partially_refunded',
                ],
                true
            )
        ) {
            return true;
        }

        $reference = strtolower(
            (string) $transaction->gateway_reference
        );

        return
            str_starts_with($reference, 'refund')
            || str_starts_with($reference, 're_');
    }

    private function gatewayName(
        ?string $gateway
    ): string {
        return ucwords(
            str_replace(
                '_',
                ' ',
                (string) $gateway
            )
        );
    }

    private function money(
        float|int|string|null $amount
    ): float {
        return round(
            (float) $amount,
            2
        );
    }
}