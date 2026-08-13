<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorApplication;
use App\Models\VendorPermission;
use App\Notifications\VendorApprovedNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class VendorController extends Controller
{
    // Vendor list
    public function index(Request $request)
    {
        $status = $request->get('status', 'all');
        $search = trim($request->get('search', ''));

        $query = Vendor::with(['user', 'plan']);

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($search !== '') {
            $query->where(function ($query) use ($search) {
                $query->where('store_name', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        $vendors = $query->latest()->get();

        $pendingApplications = VendorApplication::with(['user', 'plan'])
            ->where('status', 'pending')
            ->whereDoesntHave('user.vendor')
            ->latest()
            ->get()
            ->map(function ($application) {
                return [
                    'id' => 'application_' . $application->id,
                    'application_id' => $application->id,
                    'store_name' => $application->store_name,
                    'slug' => null,
                    'status' => 'pending',
                    'commission_rate' => $application->plan?->commission_rate ?? 10,
                    'billing_cycle' => $application->billing_cycle,
                    'logo' => null,
                    'banner' => null,
                    'sales' => 0,
                    'created_at' => $application->submitted_at ?? $application->created_at,
                    'is_application' => true,
                    'user' => $application->user,
                    'plan' => $application->plan,
                ];
            });

        if ($status === 'pending') {
            $vendors = $vendors->concat($pendingApplications)->values();
        }

        if ($status === 'all') {
            $vendors = $vendors->concat($pendingApplications)->values();
        }

        $stats = [
            'total_vendors' => Vendor::count() + VendorApplication::where('status', 'pending')->whereDoesntHave('user.vendor')->count(),
            'approved_vendors' => Vendor::where('status', 'approved')->count(),
            'pending_review' => VendorApplication::where('status', 'pending')->whereDoesntHave('user.vendor')->count(),
            'flagged_vendors' => Vendor::whereIn('status', ['suspended', 'rejected'])->count(),
            'vendor_sales' => 0,
        ];

        return response()->json([
            'status' => true,
            'stats' => $stats,
            'vendors' => $vendors,
        ]);
    }

    // Create vendor manually
    public function store(Request $request)
    {
        $validated = $request->validate([
            'store_name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:vendors,slug'],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:pending,payment_required,approved,suspended,rejected'],
            'account_status' => ['required', 'in:active,pending_activation,banned,suspended'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],

            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'owner_phone' => ['nullable', 'string', 'max:50'],

            'vendor_plan_id' => ['nullable', 'integer', 'exists:vendor_plans,id'],
            'billing_cycle' => ['nullable', 'in:monthly,yearly'],

            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'banner' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],

            'permissions' => ['nullable', 'array'],
            'permissions.*.resource' => ['required_with:permissions', 'string', 'max:100'],
            'permissions.*.can_view' => ['nullable', 'boolean'],
            'permissions.*.can_create' => ['nullable', 'boolean'],
            'permissions.*.can_edit' => ['nullable', 'boolean'],
            'permissions.*.can_delete' => ['nullable', 'boolean'],
        ]);

        return DB::transaction(function () use ($request, $validated) {
            $temporaryPassword = Str::password(12);

            $user = User::create([
                'name' => $validated['owner_name'],
                'email' => $validated['owner_email'],
                'phone' => $validated['owner_phone'] ?? null,
                'password' => Hash::make($temporaryPassword),
                'role' => 'vendor',
                'account_status' => $validated['account_status'],
            ]);

            $logo = $this->uploadImage($request, 'logo', 'uploads/vendors/logos');
            $banner = $this->uploadImage($request, 'banner', 'uploads/vendors/banners');

            $slug = $validated['slug'] ?? null;
            $slug = $slug ?: Str::slug($validated['store_name']);
            $slug = $this->uniqueSlug($slug);

            $vendor = Vendor::create([
                'user_id' => $user->id,
                'vendor_plan_id' => $validated['vendor_plan_id'] ?? null,
                'store_name' => $validated['store_name'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'logo' => $logo,
                'banner' => $banner,
                'status' => $validated['status'],
                'billing_cycle' => $validated['billing_cycle'] ?? null,
                'commission_rate' => $validated['commission_rate'],
                'approved_at' => $validated['status'] === 'approved' ? now() : null,
            ]);

            $permissions = $validated['permissions'] ?? $this->defaultPermissions();

            $this->syncPermissions($vendor, $permissions);

            return response()->json([
                'status' => true,
                'message' => 'Vendor created successfully.',
                'vendor' => $vendor->load(['user', 'plan', 'permissions']),
                'temporary_password' => $temporaryPassword,
            ], 201);
        });
    }

    // Show vendor
    public function show($id)
    {
        $vendor = Vendor::with([
            'user',
            'plan',
            'application',
            'permissions',
        ])->findOrFail($id);

        return response()->json([
            'status' => true,
            'vendor' => $vendor,
        ]);
    }

    // Update vendor
    public function update(Request $request, $id)
    {
        $vendor = Vendor::with('user')->findOrFail($id);

        $validated = $request->validate([
            'store_name' => ['required', 'string', 'max:255'],
            'slug' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('vendors', 'slug')->ignore($vendor->id),
            ],
            'description' => ['nullable', 'string'],
            'status' => ['required', 'in:pending,payment_required,approved,suspended,rejected'],
            'account_status' => ['required', 'in:active,pending_activation,banned,suspended'],
            'commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],

            'owner_name' => ['required', 'string', 'max:255'],
            'owner_email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($vendor->user_id),
            ],
            'owner_phone' => ['nullable', 'string', 'max:50'],

            'vendor_plan_id' => ['nullable', 'integer', 'exists:vendor_plans,id'],
            'billing_cycle' => ['nullable', 'in:monthly,yearly'],

            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
            'banner' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:8192'],

            'permissions' => ['nullable', 'array'],
            'permissions.*.resource' => ['required_with:permissions', 'string', 'max:100'],
            'permissions.*.can_view' => ['nullable', 'boolean'],
            'permissions.*.can_create' => ['nullable', 'boolean'],
            'permissions.*.can_edit' => ['nullable', 'boolean'],
            'permissions.*.can_delete' => ['nullable', 'boolean'],
        ]);

        return DB::transaction(function () use ($request, $validated, $vendor) {
            $vendor->user->update([
                'name' => $validated['owner_name'],
                'email' => $validated['owner_email'],
                'phone' => $validated['owner_phone'] ?? null,
                'account_status' => $validated['account_status'],
            ]);

            $logo = $vendor->logo;
            $banner = $vendor->banner;

            if ($request->hasFile('logo')) {
                $logo = $this->uploadImage($request, 'logo', 'uploads/vendors/logos');
            }

            if ($request->hasFile('banner')) {
                $banner = $this->uploadImage($request, 'banner', 'uploads/vendors/banners');
            }

            $slug = $validated['slug'] ?? $vendor->slug;

            $vendor->update([
                'vendor_plan_id' => $validated['vendor_plan_id'] ?? null,
                'store_name' => $validated['store_name'],
                'slug' => $slug,
                'description' => $validated['description'] ?? null,
                'logo' => $logo,
                'banner' => $banner,
                'status' => $validated['status'],
                'billing_cycle' => $validated['billing_cycle'] ?? null,
                'commission_rate' => $validated['commission_rate'],
                'approved_at' => $validated['status'] === 'approved'
                    ? ($vendor->approved_at ?? now())
                    : $vendor->approved_at,
            ]);

            if (isset($validated['permissions'])) {
                $this->syncPermissions($vendor, $validated['permissions']);
            }

            return response()->json([
                'status' => true,
                'message' => 'Vendor updated successfully.',
                'vendor' => $vendor->fresh()->load(['user', 'plan', 'permissions']),
            ]);
        });
    }

    // Approve vendor application
    public function approve($applicationId)
    {
        $application = VendorApplication::with(['user', 'plan'])
            ->findOrFail($applicationId);

        if ($application->status !== 'pending') {
            return response()->json([
                'status' => false,
                'message' => 'Only pending applications can be approved.',
            ], 422);
        }

        return DB::transaction(function () use ($application) {
            $plan = $application->plan;

            $price = 0;

            if ($plan) {
                $price = $application->billing_cycle === 'monthly'
                    ? $plan->monthly_price
                    : $plan->yearly_price;
            }

            $requiresPayment = $price !== null && (float) $price > 0;

            $vendorStatus = $requiresPayment
                ? 'payment_required'
                : 'approved';

            $application->update([
                'status' => 'approved',
                'reviewed_at' => now(),
            ]);

            $application->user->update([
                'role' => 'vendor',
                'account_status' => 'pending_activation',
            ]);

            $vendor = Vendor::updateOrCreate(
                [
                    'user_id' => $application->user_id,
                ],
                [
                    'vendor_application_id' => $application->id,
                    'vendor_plan_id' => $application->vendor_plan_id,
                    'store_name' => $application->store_name,
                    'slug' => $this->uniqueSlug(
                        Str::slug($application->store_name),
                        $application->user_id
                    ),
                    'description' => $application->store_description,
                    'status' => $vendorStatus,
                    'billing_cycle' => $application->billing_cycle,
                    'commission_rate' => $plan?->commission_rate ?? 10,
                    'approved_at' => $requiresPayment ? null : now(),
                ]
            );

            if ($vendor->permissions()->count() === 0) {
                $this->syncPermissions(
                    $vendor,
                    $this->defaultPermissions()
                );
            }

            $application->user->notify(
                new VendorApprovedNotification($vendor)
            );

            return response()->json([
                'status' => true,
                'message' => $requiresPayment
                    ? 'Vendor approved. Activation email sent and subscription payment is required.'
                    : 'Vendor approved. Activation email sent successfully.',
                'vendor' => $vendor->load(['user', 'plan', 'permissions']),
            ]);
        });
    }

    // Reject vendor application
    public function reject(Request $request, $applicationId)
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $application = VendorApplication::findOrFail($applicationId);

        if ($application->status !== 'pending') {
            return response()->json([
                'status' => false,
                'message' => 'Only pending applications can be rejected.',
            ], 422);
        }

        $application->update([
            'status' => 'rejected',
            'reviewed_at' => now(),
            'rejection_reason' => $validated['reason'] ?? null,
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Vendor application rejected.',
            'application' => $application->fresh(),
        ]);
    }

    // Suspend vendor
    public function suspend(Request $request, $id)
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:2000'],
        ]);

        $vendor = Vendor::with('user')->findOrFail($id);

        $vendor->update([
            'status' => 'suspended',
            'suspended_at' => now(),
            'admin_note' => $validated['reason'] ?? $vendor->admin_note,
        ]);

        $vendor->user->update([
            'account_status' => 'suspended',
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Vendor suspended successfully.',
            'vendor' => $vendor->fresh()->load('user'),
        ]);
    }

    // Reactivate vendor
    public function restore($id)
    {
        $vendor = Vendor::with('user')->findOrFail($id);

        $vendor->update([
            'status' => 'approved',
            'suspended_at' => null,
            'approved_at' => $vendor->approved_at ?? now(),
        ]);

        $vendor->user->update([
            'account_status' => 'active',
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Vendor reactivated successfully.',
            'vendor' => $vendor->fresh()->load('user'),
        ]);
    }

    // Delete vendor
    public function destroy($id)
    {
        $vendor = Vendor::with('user')->findOrFail($id);

        return DB::transaction(function () use ($vendor) {
            $user = $vendor->user;

            $vendor->delete();

            if ($user) {
                $user->update([
                    'role' => 'customer',
                    'account_status' => 'active',
                ]);
            }

            return response()->json([
                'status' => true,
                'message' => 'Vendor removed successfully.',
            ]);
        });
    }

    // Save vendor permissions
    private function syncPermissions(Vendor $vendor, array $permissions): void
    {
        foreach ($permissions as $permission) {
            VendorPermission::updateOrCreate(
                [
                    'vendor_id' => $vendor->id,
                    'resource' => $permission['resource'],
                ],
                [
                    'can_view' => (bool) ($permission['can_view'] ?? false),
                    'can_create' => (bool) ($permission['can_create'] ?? false),
                    'can_edit' => (bool) ($permission['can_edit'] ?? false),
                    'can_delete' => (bool) ($permission['can_delete'] ?? false),
                ]
            );
        }
    }

    // Default vendor permissions
    private function defaultPermissions(): array
    {
        return [
            [
                'resource' => 'point_of_sale',
                'can_view' => true,
                'can_create' => true,
                'can_edit' => true,
                'can_delete' => true,
            ],
            [
                'resource' => 'orders',
                'can_view' => true,
                'can_create' => true,
                'can_edit' => true,
                'can_delete' => true,
            ],
            [
                'resource' => 'products',
                'can_view' => true,
                'can_create' => true,
                'can_edit' => true,
                'can_delete' => true,
            ],
            [
                'resource' => 'store_settings',
                'can_view' => true,
                'can_create' => true,
                'can_edit' => true,
                'can_delete' => true,
            ],
            [
                'resource' => 'payouts',
                'can_view' => true,
                'can_create' => true,
                'can_edit' => true,
                'can_delete' => true,
            ],
            [
                'resource' => 'analytics',
                'can_view' => true,
                'can_create' => true,
                'can_edit' => true,
                'can_delete' => true,
            ],
            [
                'resource' => 'brands',
                'can_view' => true,
                'can_create' => true,
                'can_edit' => true,
                'can_delete' => false,
            ],
            [
                'resource' => 'discounts',
                'can_view' => true,
                'can_create' => true,
                'can_edit' => true,
                'can_delete' => true,
            ],
        ];
    }

    // Upload vendor image
    private function uploadImage(Request $request, string $field, string $directory): ?string
    {
        if (!$request->hasFile($field)) {
            return null;
        }

        $file = $request->file($field);
        $fileName = time() . '_' . Str::random(8) . '.' . $file->getClientOriginalExtension();

        $file->move(
            public_path($directory),
            $fileName
        );

        return $directory . '/' . $fileName;
    }

    // Generate unique vendor slug
    private function uniqueSlug(string $slug, ?int $userId = null): string
    {
        $slug = $slug ?: 'vendor';
        $originalSlug = $slug;
        $counter = 1;

        while (
            Vendor::where('slug', $slug)
                ->when($userId, function ($query) use ($userId) {
                    $query->where('user_id', '!=', $userId);
                })
                ->exists()
        ) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}