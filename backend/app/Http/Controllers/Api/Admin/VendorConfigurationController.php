<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\VendorConfiguration;
use Illuminate\Http\Request;

class VendorConfigurationController extends Controller
{
    // Get configuration
    public function show()
    {
        $configuration = $this->getConfiguration();

        return response()->json([
            'status' => true,
            'configuration' => $configuration,
        ]);
    }

    // Update configuration
    public function update(Request $request)
    {
        $validated = $request->validate([
            'allow_vendor_registration' => ['required', 'boolean'],
            'auto_approve_applications' => ['required', 'boolean'],
            'enable_subscription_plans' => ['required', 'boolean'],
            'require_plan_at_signup' => ['required', 'boolean'],
            'free_trial_days' => ['required', 'integer', 'min:0', 'max:3650'],
            'default_commission_rate' => ['required', 'numeric', 'min:0', 'max:100'],
            'minimum_withdrawal_amount' => ['required', 'numeric', 'min:0'],
        ]);

        $configuration = $this->getConfiguration();

        if (!$validated['enable_subscription_plans']) {
            $validated['require_plan_at_signup'] = false;
        }

        $configuration->update($validated);

        return response()->json([
            'status' => true,
            'message' => 'Vendor configuration saved successfully.',
            'configuration' => $configuration->fresh(),
        ]);
    }

    // Get singleton configuration
    private function getConfiguration()
    {
        $configuration = VendorConfiguration::first();

        if ($configuration) {
            return $configuration;
        }

        return VendorConfiguration::create([
            'allow_vendor_registration' => true,
            'auto_approve_applications' => false,
            'enable_subscription_plans' => true,
            'require_plan_at_signup' => true,
            'free_trial_days' => 0,
            'default_commission_rate' => 10,
            'minimum_withdrawal_amount' => 1000,
        ]);
    }
}
