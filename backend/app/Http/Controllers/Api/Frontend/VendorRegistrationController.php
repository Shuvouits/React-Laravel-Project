<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\VendorApplication;
use App\Models\VendorPlan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class VendorRegistrationController extends Controller
{
    // Step 1: Create account and start vendor application.
    public function start(Request $request)
    {
        $authenticatedUser = $request->user('sanctum');

        if ($authenticatedUser) {
            if ($authenticatedUser->role === 'vendor') {
                return response()->json([
                    'status' => false,
                    'message' => 'Your account is already a vendor.',
                ], 422);
            }

            $application = VendorApplication::firstOrCreate(
                ['user_id' => $authenticatedUser->id],
                ['status' => 'draft']
            );

            if ($application->status === 'rejected') {
                $application->update([
                    'status' => 'draft',
                    'reviewed_by' => null,
                    'reviewed_at' => null,
                    'rejection_reason' => null,
                ]);
            }

            return response()->json([
                'status' => true,
                'message' => 'Vendor application started.',
                'user' => $authenticatedUser,
                'application' => $application->fresh(),
                'token' => null,
            ]);
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        return DB::transaction(function () use ($validated) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'role' => 'customer',
            ]);

            $application = VendorApplication::create([
                'user_id' => $user->id,
                'status' => 'draft',
            ]);

            $token = $user->createToken('vendor-registration')->plainTextToken;

            return response()->json([
                'status' => true,
                'message' => 'Account created successfully.',
                'user' => $user,
                'application' => $application,
                'token' => $token,
            ], 201);
        });
    }

    // Get available subscription plans.
    public function plans()
    {
        $plans = VendorPlan::where('is_active', true)
            ->orderBy('sort_order')
            ->get();

        return response()->json([
            'status' => true,
            'plans' => $plans,
        ]);
    }

    // Get current application for resume/review/status.
    public function application(Request $request)
    {
        $application = VendorApplication::with('plan')
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$application) {
            return response()->json([
                'status' => false,
                'message' => 'Vendor application not found.',
            ], 404);
        }

        return response()->json([
            'status' => true,
            'application' => $application,
            'user' => $request->user(),
            'current_step' => $this->resolveCurrentStep($application),
        ]);
    }

    // Step 2: Save store information.
    public function saveStore(Request $request)
    {
        $application = $this->editableApplication($request);

        $validated = $request->validate([
            'store_name' => ['required', 'string', 'max:255'],
            'store_description' => ['nullable', 'string', 'max:5000'],
            'country' => ['required', 'string', 'max:100'],
            'state' => ['required', 'string', 'max:100'],
            'phone_country_code' => ['nullable', 'string', 'max:10'],
            'phone' => ['nullable', 'string', 'max:50'],
        ]);

        $application->update($validated);

        return response()->json([
            'status' => true,
            'message' => 'Store details saved successfully.',
            'application' => $application->fresh(),
        ]);
    }

    // Step 3: Save selected subscription plan.
    public function selectPlan(Request $request)
    {
        $application = $this->editableApplication($request);

        $validated = $request->validate([
            'vendor_plan_id' => ['required', 'integer', 'exists:vendor_plans,id'],
            'billing_cycle' => ['required', 'in:monthly,yearly'],
        ]);

        $plan = VendorPlan::where('id', $validated['vendor_plan_id'])
            ->where('is_active', true)
            ->firstOrFail();

        if ($validated['billing_cycle'] === 'monthly' && $plan->monthly_price === null) {
            return response()->json([
                'status' => false,
                'message' => 'Monthly billing is not available for this plan yet.',
            ], 422);
        }

        if ($validated['billing_cycle'] === 'yearly' && $plan->yearly_price === null) {
            return response()->json([
                'status' => false,
                'message' => 'Yearly billing is not available for this plan.',
            ], 422);
        }

        $application->update([
            'vendor_plan_id' => $plan->id,
            'billing_cycle' => $validated['billing_cycle'],
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Subscription plan selected successfully.',
            'application' => $application->fresh('plan'),
        ]);
    }

    // Step 4: Submit vendor application.
    public function submit(Request $request)
    {
        $application = $this->editableApplication($request);

        $validated = $request->validate([
            'terms_accepted' => ['required', 'accepted'],
        ]);

        if (!$application->store_name || !$application->country || !$application->state) {
            return response()->json([
                'status' => false,
                'message' => 'Please complete your store details before submitting.',
            ], 422);
        }

        if (!$application->vendor_plan_id || !$application->billing_cycle) {
            return response()->json([
                'status' => false,
                'message' => 'Please select a subscription plan before submitting.',
            ], 422);
        }

        $plan = VendorPlan::findOrFail($application->vendor_plan_id);

        $price = $application->billing_cycle === 'monthly'
            ? $plan->monthly_price
            : $plan->yearly_price;

        $application->update([
            'status' => 'pending',
            'terms_accepted_at' => now(),
            'submitted_at' => now(),
            'plan_snapshot' => [
                'id' => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
                'billing_cycle' => $application->billing_cycle,
                'price' => $price,
                'commission_rate' => $plan->commission_rate,
                'features' => $plan->features,
                'product_limit' => $plan->product_limit,
                'staff_limit' => $plan->staff_limit,
            ],
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Your vendor application has been submitted for review.',
            'application' => $application->fresh('plan'),
            'application_status' => 'pending',
        ]);
    }

    // Return only an editable draft/rejected application.
    private function editableApplication(Request $request): VendorApplication
    {
        $application = VendorApplication::where('user_id', $request->user()->id)->firstOrFail();

        if (!in_array($application->status, ['draft', 'rejected'])) {
            abort(response()->json([
                'status' => false,
                'message' => 'This vendor application can no longer be edited.',
            ], 422));
        }

        return $application;
    }

    // Resolve frontend registration step.
    private function resolveCurrentStep(VendorApplication $application)
    {
        if ($application->status === 'pending') return 'under_review';
        if ($application->status === 'approved') return 'approved';
        if ($application->status === 'rejected') return 'rejected';
        if (!$application->store_name) return 2;
        if (!$application->vendor_plan_id) return 3;

        return 4;
    }
}
