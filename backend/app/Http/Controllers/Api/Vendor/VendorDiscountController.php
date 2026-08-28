<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Discount;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class VendorDiscountController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $vendorId = (int) $request->user()->id;

        $query = Discount::query()
            ->ownedBy($vendorId);

        if ($request->filled('search')) {
            $search = trim((string) $request->search);

            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('code', 'like', "%{$search}%")
                    ->orWhere('label', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $this->applyStatusFilter($query, $request->status);
        }

        $perPage = min(
            max((int) $request->input('per_page', 10), 1),
            100
        );

        $discounts = $query
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'message' => 'Discounts retrieved successfully.',
            'discounts' => $discounts,
            'statistics' => $this->statistics($vendorId),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $vendorId = (int) $request->user()->id;

        $validated = $this->validateDiscount(
            $request,
            $vendorId
        );

        $validated['vendor_id'] = $vendorId;
        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['used_count'] = 0;

        $discount = Discount::create($validated);

        return response()->json([
            'message' => 'Discount created successfully.',
            'discount' => $discount->fresh(),
        ], 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $discount = $this->findVendorDiscount($request, $id);

        return response()->json([
            'message' => 'Discount retrieved successfully.',
            'discount' => $discount,
        ]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $vendorId = (int) $request->user()->id;
        $discount = $this->findVendorDiscount($request, $id);

        $validated = $this->validateDiscount(
            $request,
            $vendorId,
            $discount->id
        );

        $validated['code'] = strtoupper(trim($validated['code']));

        $discount->update($validated);

        return response()->json([
            'message' => 'Discount updated successfully.',
            'discount' => $discount->fresh(),
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $discount = $this->findVendorDiscount($request, $id);

        $discount->delete();

        return response()->json([
            'message' => 'Discount deleted successfully.',
        ]);
    }

    private function findVendorDiscount(
        Request $request,
        int $id
    ): Discount {
        return Discount::query()
            ->ownedBy((int) $request->user()->id)
            ->findOrFail($id);
    }

    private function validateDiscount(
        Request $request,
        int $vendorId,
        ?int $discountId = null
    ): array {
        $codeRule = Rule::unique('discounts', 'code')
            ->where(function ($query) use ($vendorId) {
                return $query->where('vendor_id', $vendorId);
            });

        if ($discountId !== null) {
            $codeRule->ignore($discountId);
        }

        return $request->validate([
            'code' => [
                'required',
                'string',
                'max:100',
                'regex:/^[A-Za-z0-9_-]+$/',
                $codeRule,
            ],
            'label' => [
                'nullable',
                'string',
                'max:255',
            ],
            'description' => [
                'nullable',
                'string',
                'max:2000',
            ],
            'status' => [
                'required',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],
            'type' => [
                'required',
                Rule::in([
                    'percentage',
                    'fixed',
                ]),
            ],
            'value' => [
                'required',
                'numeric',
                'gt:0',
                function ($attribute, $value, $fail) use ($request) {
                    if (
                        $request->type === 'percentage' &&
                        (float) $value > 100
                    ) {
                        $fail('Percentage discount cannot exceed 100%.');
                    }
                },
            ],
            'minimum_order_amount' => [
                'nullable',
                'numeric',
                'min:0',
            ],
            'maximum_discount_cap' => [
                'nullable',
                'numeric',
                'gt:0',
            ],
            'total_usage_limit' => [
                'nullable',
                'integer',
                'min:1',
            ],
            'per_customer_usage_limit' => [
                'nullable',
                'integer',
                'min:1',
            ],
            'starts_at' => [
                'required',
                'date',
            ],
            'ends_at' => [
                'nullable',
                'date',
                'after:starts_at',
            ],
        ]);
    }

    private function applyStatusFilter(
        $query,
        string $status
    ): void {
        if ($status === 'active') {
            $query
                ->where('status', 'active')
                ->where('starts_at', '<=', now())
                ->where(function ($builder) {
                    $builder
                        ->whereNull('ends_at')
                        ->orWhere('ends_at', '>=', now());
                });

            return;
        }

        if ($status === 'inactive') {
            $query->where('status', 'inactive');

            return;
        }

        if ($status === 'expired') {
            $query
                ->whereNotNull('ends_at')
                ->where('ends_at', '<', now());
        }
    }

    private function statistics(int $vendorId): array
    {
        $baseQuery = Discount::query()
            ->ownedBy($vendorId);

        $totalDiscounts = (clone $baseQuery)->count();

        $activeDiscounts = (clone $baseQuery)
            ->where('status', 'active')
            ->where('starts_at', '<=', now())
            ->where(function ($query) {
                $query
                    ->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', now());
            })
            ->count();

        $totalRedemptions = (clone $baseQuery)
            ->sum('used_count');

        $expiringInSevenDays = (clone $baseQuery)
            ->where('status', 'active')
            ->whereBetween('ends_at', [
                now(),
                now()->addDays(7),
            ])
            ->count();

        return [
            'total_discounts' => $totalDiscounts,
            'active_discounts' => $activeDiscounts,
            'total_redemptions' => (int) $totalRedemptions,
            'expiring_in_seven_days' => $expiringInSevenDays,
        ];
    }
}
