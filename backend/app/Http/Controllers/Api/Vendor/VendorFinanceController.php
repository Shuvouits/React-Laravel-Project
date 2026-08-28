<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Models\VendorFinanceEntry;
use App\Models\VendorPayout;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorFinanceController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $vendor = $this->vendor($request);

        [$startDate, $endDate] = $this->dateRange($request);

        $openingBalance = VendorFinanceEntry::query()
            ->ownedBy($vendor->id)
            ->where('occurred_at', '<', $startDate)
            ->sum('held_amount');

        $earned = VendorFinanceEntry::query()
            ->ownedBy($vendor->id)
            ->whereBetween('occurred_at', [
                $startDate,
                $endDate,
            ])
            ->whereIn('type', [
                'sale',
                'refund',
            ])
            ->sum('held_amount');

        $paidOut = VendorPayout::query()
            ->where('vendor_id', $vendor->id)
            ->where('status', 'paid')
            ->whereBetween('paid_at', [
                $startDate,
                $endDate,
            ])
            ->sum('net_payout');

        $heldForYou = VendorFinanceEntry::query()
            ->ownedBy($vendor->id)
            ->where('occurred_at', '<=', $endDate)
            ->sum('held_amount');

        $youOwe = VendorFinanceEntry::query()
            ->ownedBy($vendor->id)
            ->where('occurred_at', '<=', $endDate)
            ->sum('owed_amount');

        $activity = VendorFinanceEntry::query()
            ->ownedBy($vendor->id)
            ->whereBetween('occurred_at', [
                $startDate,
                $endDate,
            ])
            ->latest('occurred_at')
            ->limit(20)
            ->get();

        return response()->json([
            'summary' => [
                'opening_balance' => round(
                    (float) $openingBalance,
                    2
                ),
                'earned' => round(
                    (float) $earned,
                    2
                ),
                'paid_out' => round(
                    (float) $paidOut,
                    2
                ),
                'held_for_you' => round(
                    (float) $heldForYou,
                    2
                ),
                'you_owe' => round(
                    (float) $youOwe,
                    2
                ),
                'currency' => 'USD',
            ],
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
            'activity' => $activity,
        ]);
    }

    public function statements(Request $request): JsonResponse
    {
        $vendor = $this->vendor($request);

        [$startDate, $endDate] = $this->dateRange($request);

        $perPage = min(
            max(
                (int) $request->input('per_page', 20),
                1
            ),
            100
        );

        $query = VendorFinanceEntry::query()
            ->ownedBy($vendor->id)
            ->whereBetween('occurred_at', [
                $startDate,
                $endDate,
            ]);

        if ($request->filled('type')) {
            $query->where(
                'type',
                $request->type
            );
        }

        if ($request->filled('search')) {
            $search = trim(
                (string) $request->search
            );

            $query->where(function (Builder $builder) use ($search) {
                $builder
                    ->where(
                        'reference',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'description',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        $entries = $query
            ->latest('occurred_at')
            ->paginate($perPage);

        return response()->json([
            'entries' => $entries,
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
        ]);
    }

    public function owedToPlatform(Request $request): JsonResponse
    {
        $vendor = $this->vendor($request);

        [$startDate, $endDate] = $this->dateRange($request);

        $query = VendorFinanceEntry::query()
            ->ownedBy($vendor->id)
            ->whereBetween('occurred_at', [
                $startDate,
                $endDate,
            ])
            ->where('owed_amount', '!=', 0);

        $totalOwed = (clone $query)
            ->sum('owed_amount');

        $orderCount = (clone $query)
            ->whereNotNull('order_id')
            ->distinct('order_id')
            ->count('order_id');

        $perPage = min(
            max(
                (int) $request->input('per_page', 20),
                1
            ),
            100
        );

        $entries = $query
            ->latest('occurred_at')
            ->paginate($perPage);

        return response()->json([
            'summary' => [
                'you_owe' => round(
                    (float) $totalOwed,
                    2
                ),
                'orders' => $orderCount,
                'currency' => 'USD',
            ],
            'entries' => $entries,
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
            ],
        ]);
    }

    private function vendor(Request $request): Vendor
    {
        return Vendor::query()
            ->where(
                'user_id',
                $request->user()->id
            )
            ->firstOrFail();
    }

    private function dateRange(Request $request): array
    {
        $range = $request->input(
            'range',
            '30_days'
        );

        $endDate = now()->endOfDay();

        $startDate = match ($range) {
            '7_days' => now()
                ->subDays(6)
                ->startOfDay(),

            '90_days' => now()
                ->subDays(89)
                ->startOfDay(),

            'year' => now()
                ->startOfYear(),

            'all' => Carbon::create(
                2000,
                1,
                1
            )->startOfDay(),

            default => now()
                ->subDays(29)
                ->startOfDay(),
        };

        if (
            $request->filled('start_date') &&
            $request->filled('end_date')
        ) {
            $startDate = Carbon::parse(
                $request->start_date
            )->startOfDay();

            $endDate = Carbon::parse(
                $request->end_date
            )->endOfDay();
        }

        return [
            $startDate,
            $endDate,
        ];
    }
}
