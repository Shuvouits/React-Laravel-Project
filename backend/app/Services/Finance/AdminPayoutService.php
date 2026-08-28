<?php

namespace App\Services\Finance;

use App\Models\Vendor;
use App\Models\VendorFinanceEntry;
use App\Models\VendorPayout;
use App\Models\VendorPayoutOrder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminPayoutService
{
    public function createPayout(
        Vendor $vendor,
        string $periodStart,
        string $periodEnd,
        ?string $note = null
    ): VendorPayout {
        $startDate = Carbon::parse($periodStart)->startOfDay();
        $endDate = Carbon::parse($periodEnd)->endOfDay();

        if ($endDate->lt($startDate)) {
            throw ValidationException::withMessages([
                'period_end' => [
                    'Period end date must be after or equal to period start.',
                ],
            ]);
        }

        return DB::transaction(function () use (
            $vendor,
            $startDate,
            $endDate,
            $note
        ) {
            /*
            |--------------------------------------------------------------------------
            | GET ELIGIBLE FINANCE ENTRIES
            |--------------------------------------------------------------------------
            */

            $entries = VendorFinanceEntry::query()
                ->where('vendor_id', $vendor->id)
                ->whereNull('vendor_payout_id')
                ->whereIn('type', [
                    'sale',
                    'refund',
                ])
                ->whereBetween('occurred_at', [
                    $startDate,
                    $endDate,
                ])
                ->where('held_amount', '!=', 0)
                ->lockForUpdate()
                ->get();

            if ($entries->isEmpty()) {
                throw ValidationException::withMessages([
                    'vendor_id' => [
                        'No unpaid marketplace balance was found for this vendor and period.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | NET PAYOUT
            |--------------------------------------------------------------------------
            */

            $netAmount = round(
                (float) $entries->sum('held_amount'),
                2
            );

            if ($netAmount <= 0) {
                throw ValidationException::withMessages([
                    'vendor_id' => [
                        'The vendor does not have a positive payable balance for this period.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | ORDER IDS
            |--------------------------------------------------------------------------
            */

            $orderIds = $entries
                ->pluck('order_id')
                ->filter()
                ->unique()
                ->values();

            if ($orderIds->isEmpty()) {
                throw ValidationException::withMessages([
                    'vendor_id' => [
                        'No valid orders were found for this payout.',
                    ],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | GROSS SALES
            |--------------------------------------------------------------------------
            */

            $grossSales = $this->calculateGrossSales(
                $vendor,
                $orderIds->all()
            );

            /*
            |--------------------------------------------------------------------------
            | COMMISSION
            |--------------------------------------------------------------------------
            */

            $commissionAmount = round(
                max(0, $grossSales - $netAmount),
                2
            );

            /*
            |--------------------------------------------------------------------------
            | CREATE PAYOUT
            |--------------------------------------------------------------------------
            */

            $payout = VendorPayout::create([
                'vendor_id' => $vendor->id,

                'payout_number' =>
                    $this->generatePayoutNumber(),

                'status' => 'pending',

                'period_start' =>
                    $startDate->toDateString(),

                'period_end' =>
                    $endDate->toDateString(),

                'gross_sales' =>
                    round($grossSales, 2),

                'commission_amount' =>
                    $commissionAmount,

                'net_amount' =>
                    $netAmount,

                'currency' => 'USD',

                'note' => $note,
            ]);

            /*
            |--------------------------------------------------------------------------
            | ATTACH ORDERS
            |--------------------------------------------------------------------------
            */

            foreach ($orderIds as $orderId) {
                $orderCalculation =
                    $this->calculateOrderAmounts(
                        $vendor,
                        $orderId,
                        $entries
                    );

                VendorPayoutOrder::create([
                    'vendor_payout_id' =>
                        $payout->id,

                    'order_id' =>
                        $orderId,

                    'gross_amount' =>
                        $orderCalculation['gross_amount'],

                    'commission_amount' =>
                        $orderCalculation['commission_amount'],

                    'net_amount' =>
                        $orderCalculation['net_amount'],
                ]);
            }

            /*
            |--------------------------------------------------------------------------
            | MARK ENTRIES AS ASSIGNED
            |--------------------------------------------------------------------------
            */

            VendorFinanceEntry::query()
                ->whereIn(
                    'id',
                    $entries->pluck('id')
                )
                ->update([
                    'vendor_payout_id' =>
                        $payout->id,
                ]);

            return $payout->load([
                'vendor:id,user_id,store_name,slug',
                'orders.order',
            ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PAYOUT STATUS
    |--------------------------------------------------------------------------
    */

    public function updateStatus(
        VendorPayout $payout,
        string $status,
        ?string $note = null
    ): VendorPayout {
        $allowedStatuses = [
            'pending',
            'processing',
            'paid',
            'failed',
            'cancelled',
        ];

        if (!in_array($status, $allowedStatuses, true)) {
            throw ValidationException::withMessages([
                'status' => [
                    'Invalid payout status.',
                ],
            ]);
        }

        return DB::transaction(function () use (
            $payout,
            $status,
            $note
        ) {
            $payout = VendorPayout::query()
                ->lockForUpdate()
                ->findOrFail($payout->id);

            /*
            |--------------------------------------------------------------------------
            | PROTECT COMPLETED PAYOUT
            |--------------------------------------------------------------------------
            */

            if (
                $payout->status === 'paid'
                && $status !== 'paid'
            ) {
                throw ValidationException::withMessages([
                    'status' => [
                        'A paid payout cannot be moved to another status.',
                    ],
                ]);
            }

            $updateData = [
                'status' => $status,
            ];

            if ($note !== null) {
                $updateData['note'] = $note;
            }

            if ($status === 'processing') {
                $updateData['processed_at'] = now();
            }

            if ($status === 'paid') {
                $updateData['processed_at'] =
                    $payout->processed_at ?? now();

                $updateData['paid_at'] =
                    $payout->paid_at ?? now();

                $updateData['failure_reason'] = null;
            }

            if ($status === 'failed') {
                $updateData['processed_at'] =
                    $payout->processed_at ?? now();

                $updateData['failure_reason'] =
                    $note ?: 'Payout failed.';
            }

            if ($status === 'cancelled') {
                $updateData['processed_at'] =
                    $payout->processed_at ?? now();
            }

            $payout->update($updateData);

            /*
            |--------------------------------------------------------------------------
            | CREATE PAID LEDGER ENTRY
            |--------------------------------------------------------------------------
            */

            if ($status === 'paid') {
                $this->recordPaidPayout(
                    $payout
                );
            }

            /*
            |--------------------------------------------------------------------------
            | RELEASE ENTRIES IF CANCELLED
            |--------------------------------------------------------------------------
            */

            if ($status === 'cancelled') {
                $this->releaseCancelledPayout(
                    $payout
                );
            }

            return $payout
                ->fresh()
                ->load([
                    'vendor:id,user_id,store_name,slug',
                    'orders.order',
                ]);
        });
    }

    /*
    |--------------------------------------------------------------------------
    | RECORD PAID PAYOUT IN VENDOR LEDGER
    |--------------------------------------------------------------------------
    */

    private function recordPaidPayout(
        VendorPayout $payout
    ): void {
        $eventKey =
            'vendor-payout-paid:'
            . $payout->id;

        VendorFinanceEntry::firstOrCreate(
            [
                'event_key' => $eventKey,
            ],
            [
                'vendor_id' =>
                    $payout->vendor_id,

                'order_id' => null,

                'vendor_payout_id' =>
                    $payout->id,

                'type' => 'payout',

                'reference' =>
                    $payout->payout_number,

                'held_amount' =>
                    -abs((float) $payout->net_amount),

                'owed_amount' => 0,

                'currency' =>
                    $payout->currency ?? 'USD',

                'description' =>
                    'Vendor payout marked as paid.',

                'occurred_at' =>
                    $payout->paid_at ?? now(),

                'metadata' => [
                    'payout_id' =>
                        $payout->id,

                    'payout_number' =>
                        $payout->payout_number,

                    'gross_sales' =>
                        (float) $payout->gross_sales,

                    'commission_amount' =>
                        (float) $payout->commission_amount,

                    'net_amount' =>
                        (float) $payout->net_amount,
                ],
            ]
        );
    }

    /*
    |--------------------------------------------------------------------------
    | RELEASE CANCELLED PAYOUT ENTRIES
    |--------------------------------------------------------------------------
    */

    private function releaseCancelledPayout(
        VendorPayout $payout
    ): void {
        VendorFinanceEntry::query()
            ->where(
                'vendor_payout_id',
                $payout->id
            )
            ->whereIn('type', [
                'sale',
                'refund',
            ])
            ->update([
                'vendor_payout_id' => null,
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | CALCULATE TOTAL GROSS SALES
    |--------------------------------------------------------------------------
    */

    private function calculateGrossSales(
        Vendor $vendor,
        array $orderIds
    ): float {
        if (empty($orderIds)) {
            return 0;
        }

        return (float) DB::table('order_items')
            ->join(
                'products',
                'products.id',
                '=',
                'order_items.product_id'
            )
            ->whereIn(
                'order_items.order_id',
                $orderIds
            )
            ->where(
                'products.source',
                'vendor'
            )
            ->where(
                'products.created_by',
                $vendor->user_id
            )
            ->sum(
                'order_items.line_total'
            );
    }

    /*
    |--------------------------------------------------------------------------
    | CALCULATE INDIVIDUAL ORDER AMOUNTS
    |--------------------------------------------------------------------------
    */

    private function calculateOrderAmounts(
        Vendor $vendor,
        int $orderId,
        $entries
    ): array {
        $grossAmount = (float) DB::table(
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
                $orderId
            )
            ->where(
                'products.source',
                'vendor'
            )
            ->where(
                'products.created_by',
                $vendor->user_id
            )
            ->sum(
                'order_items.line_total'
            );

        $orderEntries = $entries->where(
            'order_id',
            $orderId
        );

        $netAmount = round(
            (float) $orderEntries->sum(
                'held_amount'
            ),
            2
        );

        $commissionAmount = round(
            max(
                0,
                $grossAmount - $netAmount
            ),
            2
        );

        return [
            'gross_amount' =>
                round($grossAmount, 2),

            'commission_amount' =>
                $commissionAmount,

            'net_amount' =>
                $netAmount,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | GENERATE UNIQUE PAYOUT NUMBER
    |--------------------------------------------------------------------------
    */

    private function generatePayoutNumber(): string
    {
        do {
            $payoutNumber =
                'PAYOUT-'
                . strtoupper(
                    Str::random(6)
                )
                . '-'
                . strtoupper(
                    Str::random(4)
                );
        } while (
            VendorPayout::query()
                ->where(
                    'payout_number',
                    $payoutNumber
                )
                ->exists()
        );

        return $payoutNumber;
    }
}