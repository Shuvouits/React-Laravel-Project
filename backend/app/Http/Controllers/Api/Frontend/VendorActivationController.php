<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;

class VendorActivationController extends Controller
{
    // Activate approved vendor account
    public function activate(Request $request, User $user)
    {
        if (!$request->hasValidSignature()) {
            return response()->json([
                'status' => false,
                'message' => 'This activation link is invalid or has expired.',
            ], 403);
        }

        if ($user->role !== 'vendor') {
            return response()->json([
                'status' => false,
                'message' => 'This account is not a vendor account.',
            ], 422);
        }

        if (!$user->vendor) {
            return response()->json([
                'status' => false,
                'message' => 'Vendor account not found.',
            ], 404);
        }

        if ($user->account_status === 'active') {
            return response()->json([
                'status' => true,
                'message' => 'Your vendor account is already active.',
            ]);
        }

        if ($user->account_status !== 'pending_activation') {
            return response()->json([
                'status' => false,
                'message' => 'This vendor account cannot be activated.',
            ], 422);
        }

        $user->update([
            'account_status' => 'active',
            'email_verified_at' => $user->email_verified_at ?? now(),
        ]);

        return response()->json([
            'status' => true,
            'message' => 'Your vendor account has been activated successfully. You can now sign in.',
        ]);
    }
}
