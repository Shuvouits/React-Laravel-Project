<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Models\VendorPayout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VendorPayoutController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendor($request);

        $perPage = min(
            max(
                (int) $request->input('per_page', 20),
                1
            ),
            100
        );

        $query = VendorPayout::query()
            ->where('vendor_id', $vendor->id);

        if (
            $request->filled('status') &&
            $request->status !== 'all'
        ) {
            $request->validate([
                'status' => [
                    Rule::in([
                        'pending',
                        'processing',
                        'paid',
                        'failed',
                        'cancelled',
                    ]),
                ],
            ]);

            $query->where(
                'status',
                $request->status
            );
        }

        if ($request->filled('search')) {
            $search = trim(
                (string) $request->search
            );

            $query->where(
                'payout_no',
                'like',
                "%{$search}%"
            );
        }

        $payouts = $query
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'payouts' => $payouts,
        ]);
    }

    public function show(
        Request $request,
        int $id
    ): JsonResponse {
        $vendor = $this->vendor($request);

        $payout = VendorPayout::query()
            ->where('vendor_id', $vendor->id)
            ->with([
                'orders' => function ($query) {
                    $query
                        ->select([
                            'orders.id',
                            'orders.order_no',
                            'orders.status',
                            'orders.payment_status',
                            'orders.grand_total',
                            'orders.created_at',
                        ])
                        ->latest(
                            'orders.created_at'
                        );
                },
            ])
            ->findOrFail($id);

        return response()->json([
            'payout' => $payout,
        ]);
    }

    private function vendor(
        Request $request
    ): Vendor {
        return Vendor::query()
            ->where(
                'user_id',
                $request->user()->id
            )
            ->firstOrFail();
    }
}
