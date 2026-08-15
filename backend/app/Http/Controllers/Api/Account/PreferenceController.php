<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Controller;
use App\Models\UserPreference;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PreferenceController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $preference = UserPreference::firstOrCreate(
            [
                'user_id' => $user->id,
            ],
            [
                'order_updates' => true,
                'promotions_deals' => true,
                'newsletter' => false,
                'price_drop_alerts' => true,
                'back_in_stock_alerts' => true,
                'marketing_emails' => true,
            ]
        );

        return response()->json([
            'success' => true,
            'preferences' => $preference,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_updates' => ['sometimes', 'boolean'],
            'promotions_deals' => ['sometimes', 'boolean'],
            'newsletter' => ['sometimes', 'boolean'],
            'price_drop_alerts' => ['sometimes', 'boolean'],
            'back_in_stock_alerts' => ['sometimes', 'boolean'],
            'marketing_emails' => ['sometimes', 'boolean'],
        ]);

        $user = $request->user();

        $preference = UserPreference::firstOrCreate(
            [
                'user_id' => $user->id,
            ],
            [
                'order_updates' => true,
                'promotions_deals' => true,
                'newsletter' => false,
                'price_drop_alerts' => true,
                'back_in_stock_alerts' => true,
                'marketing_emails' => true,
            ]
        );

        $preference->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Preferences updated successfully.',
            'preferences' => $preference->fresh(),
        ]);
    }
}