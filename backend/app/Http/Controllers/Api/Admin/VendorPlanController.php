<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\VendorPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class VendorPlanController extends Controller
{
    // Vendor plan list
    public function index()
    {
        $plans = VendorPlan::withCount([
            'vendors',
            'applications',
        ])
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        return response()->json([
            'status' => true,
            'plans' => $plans,
        ]);
    }

    // Create vendor plan
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:vendor_plans,slug'],
            'description' => ['nullable', 'string', 'max:2000'],

            'monthly_price' => ['nullable', 'numeric', 'min:0'],
            'yearly_price' => ['nullable', 'numeric', 'min:0'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:3650'],

            'features' => ['nullable'],

            'product_limit' => ['nullable', 'integer', 'min:1'],
            'staff_limit' => ['nullable', 'integer', 'min:1'],

            'ai_authoring' => ['nullable', 'boolean'],

            'stripe_product_id' => ['nullable', 'string', 'max:255'],
            'stripe_price_id' => ['nullable', 'string', 'max:255'],

            'is_active' => ['nullable', 'boolean'],
            'is_default' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        return DB::transaction(function () use ($validated) {
            $isDefault = (bool) ($validated['is_default'] ?? false);
            $isActive = (bool) ($validated['is_active'] ?? true);

            if ($isDefault) {
                $isActive = true;

                VendorPlan::where('is_default', true)->update([
                    'is_default' => false,
                ]);
            }

            $slug = trim($validated['slug'] ?? '');
            $slug = $slug !== ''
                ? Str::slug($slug)
                : Str::slug($validated['name']);

            $slug = $this->uniqueSlug($slug);

            $plan = VendorPlan::create([
                'name' => $validated['name'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,

                'monthly_price' => $validated['monthly_price'] ?? null,
                'yearly_price' => $validated['yearly_price'] ?? null,
                'commission_rate' => $validated['commission_rate'],
                'trial_days' => (int) ($validated['trial_days'] ?? 0),

                'features' => $this->normalizeFeatures(
                    $validated['features'] ?? []
                ),

                'product_limit' => $validated['product_limit'] ?? null,
                'staff_limit' => $validated['staff_limit'] ?? null,

                'ai_authoring' => (bool) ($validated['ai_authoring'] ?? false),

                'stripe_product_id' => $validated['stripe_product_id'] ?? null,
                'stripe_price_id' => $validated['stripe_price_id'] ?? null,

                'is_active' => $isActive,
                'is_default' => $isDefault,
                'sort_order' => (int) ($validated['sort_order'] ?? 0),
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Vendor plan created successfully.',
                'plan' => $plan->fresh(),
            ], 201);
        });
    }

    // Show vendor plan
    public function show($id)
    {
        $plan = VendorPlan::withCount([
            'vendors',
            'applications',
        ])->findOrFail($id);

        return response()->json([
            'status' => true,
            'plan' => $plan,
        ]);
    }

    // Update vendor plan
    public function update(Request $request, $id)
    {
        $plan = VendorPlan::findOrFail($id);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('vendor_plans', 'slug')->ignore($plan->id),
            ],

            'description' => ['nullable', 'string', 'max:2000'],

            'monthly_price' => ['nullable', 'numeric', 'min:0'],
            'yearly_price' => ['nullable', 'numeric', 'min:0'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'trial_days' => ['nullable', 'integer', 'min:0', 'max:3650'],

            'features' => ['nullable'],

            'product_limit' => ['nullable', 'integer', 'min:1'],
            'staff_limit' => ['nullable', 'integer', 'min:1'],

            'ai_authoring' => ['nullable', 'boolean'],

            'stripe_product_id' => ['nullable', 'string', 'max:255'],
            'stripe_price_id' => ['nullable', 'string', 'max:255'],

            'is_active' => ['nullable', 'boolean'],
            'is_default' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ]);

        return DB::transaction(function () use ($validated, $plan) {
            $isDefault = (bool) ($validated['is_default'] ?? false);
            $isActive = (bool) ($validated['is_active'] ?? true);

            if ($isDefault) {
                $isActive = true;

                VendorPlan::where('id', '!=', $plan->id)
                    ->where('is_default', true)
                    ->update([
                        'is_default' => false,
                    ]);
            }

            if (!$isActive) {
                $isDefault = false;
            }

            $slug = trim($validated['slug'] ?? '');

            if ($slug === '') {
                $slug = Str::slug($validated['name']);
            } else {
                $slug = Str::slug($slug);
            }

            $slug = $this->uniqueSlug(
                $slug,
                $plan->id
            );

            $plan->update([
                'name' => $validated['name'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,

                'monthly_price' => $validated['monthly_price'] ?? null,
                'yearly_price' => $validated['yearly_price'] ?? null,
                'commission_rate' => $validated['commission_rate'],
                'trial_days' => (int) ($validated['trial_days'] ?? 0),

                'features' => $this->normalizeFeatures(
                    $validated['features'] ?? []
                ),

                'product_limit' => $validated['product_limit'] ?? null,
                'staff_limit' => $validated['staff_limit'] ?? null,

                'ai_authoring' => (bool) ($validated['ai_authoring'] ?? false),

                'stripe_product_id' => $validated['stripe_product_id'] ?? null,
                'stripe_price_id' => $validated['stripe_price_id'] ?? null,

                'is_active' => $isActive,
                'is_default' => $isDefault,
                'sort_order' => (int) ($validated['sort_order'] ?? 0),
            ]);

            return response()->json([
                'status' => true,
                'message' => 'Vendor plan updated successfully.',
                'plan' => $plan->fresh(),
            ]);
        });
    }

    // Delete vendor plan
    public function destroy($id)
    {
        $plan = VendorPlan::withCount([
            'vendors',
            'applications',
        ])->findOrFail($id);

        if ($plan->vendors_count > 0) {
            return response()->json([
                'status' => false,
                'message' => 'This plan cannot be deleted because vendors are currently using it.',
            ], 422);
        }

        if ($plan->applications_count > 0) {
            return response()->json([
                'status' => false,
                'message' => 'This plan cannot be deleted because vendor applications are linked to it.',
            ], 422);
        }

        $plan->delete();

        return response()->json([
            'status' => true,
            'message' => 'Vendor plan deleted successfully.',
        ]);
    }

    // Normalize plan features
    private function normalizeFeatures($features): array
    {
        if (is_string($features)) {
            $features = preg_split('/\r\n|\r|\n/', $features);
        }

        if (!is_array($features)) {
            return [];
        }

        return collect($features)
            ->map(function ($feature) {
                return trim((string) $feature);
            })
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    // Generate unique slug
    private function uniqueSlug(string $slug, ?int $ignoreId = null): string
    {
        $slug = $slug ?: 'vendor-plan';
        $originalSlug = $slug;
        $counter = 1;

        while (
            VendorPlan::where('slug', $slug)
                ->when($ignoreId, function ($query) use ($ignoreId) {
                    $query->where('id', '!=', $ignoreId);
                })
                ->exists()
        ) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}
