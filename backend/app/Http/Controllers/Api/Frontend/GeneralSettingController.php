<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\GeneralSetting;
use Illuminate\Http\JsonResponse;

class GeneralSettingController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = GeneralSetting::query()->first();

        return response()->json([
            'success' => true,
            'settings' => [
                'navbar_logo' =>
                    $settings?->navbar_logo,

                'navbar_logo_url' =>
                    $settings?->navbar_logo
                        ? asset($settings->navbar_logo)
                        : null,

                'navbar_logo_alt' =>
                    $settings?->navbar_logo_alt
                        ?: 'Storify',
            ],
        ]);
    }
}