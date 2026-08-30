<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\FooterSetting;
use Illuminate\Http\JsonResponse;

class FooterController extends Controller
{
    public function show(): JsonResponse
    {
        $footer = FooterSetting::query()
            ->first();

        if (!$footer) {
            return response()->json([
                'status' => true,
                'active' => false,
                'footer' => null,
            ]);
        }

        return response()->json([
            'status' => true,
            'active' =>
                (bool) $footer->is_active,

            'footer' => [
                'store_information' =>
                    $footer->store_information,

                'menus' =>
                    $footer->menus,

                'social_links' =>
                    $footer->social_links,

                'copyright' => [
                    'key' =>
                        'copyright',

                    'type' =>
                        'copyright',

                    'editor_title' =>
                        'Copyright',

                    'text' =>
                        $footer->copyright_text,
                ],
            ],
        ]);
    }
}