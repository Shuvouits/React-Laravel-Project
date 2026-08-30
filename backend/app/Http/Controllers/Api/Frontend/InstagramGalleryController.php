<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\HomeSection;
use Illuminate\Http\JsonResponse;

class InstagramGalleryController extends Controller
{
    public function index(): JsonResponse
    {
        $section = HomeSection::query()
            ->where(
                'section_key',
                'from_instagram'
            )
            ->first();

        if (!$section || !$section->is_active) {
            return response()->json([
                'status' => true,
                'active' => false,
                'title' => '',
                'settings' => [
                    'limit' => 10,
                    'desktop_columns' => 5,
                ],
                'images' => [],
            ]);
        }

        $settings = is_array(
            $section->settings
        )
            ? $section->settings
            : [];

        $limit = min(
            max(
                (int) (
                    $settings['limit']
                    ?? 10
                ),
                1
            ),
            30
        );

        $desktopColumns = min(
            max(
                (int) (
                    $settings[
                        'desktop_columns'
                    ] ?? 5
                ),
                3
            ),
            6
        );

        $savedImages =
            isset($settings['images']) &&
            is_array($settings['images'])
                ? $settings['images']
                : [];

        $images = collect($savedImages)
            ->filter(function ($image) {
                return (
                    ($image['is_active'] ?? true) &&
                    !empty($image['image'])
                );
            })
            ->take($limit)
            ->values()
            ->map(function ($image, $index) {
                $relativePath =
                    $image['image'] ?? '';

                return [
                    'id' =>
                        $image['id']
                        ?? 'instagram-image-'
                        . ($index + 1),

                    'image' =>
                        $relativePath,

                    'image_url' =>
                        $relativePath
                            ? asset($relativePath)
                            : (
                                $image['image_url']
                                ?? ''
                            ),

                    'image_alt' =>
                        $image['image_alt']
                        ?? '',

                    'link' =>
                        $image['link']
                        ?? '',
                ];
            })
            ->all();

        return response()->json([
            'status' => true,
            'active' => true,

            'title' =>
                $section->title
                ?: 'From Instagram',

            'settings' => [
                'limit' =>
                    $limit,

                'desktop_columns' =>
                    $desktopColumns,
            ],

            'images' =>
                $images,
        ]);
    }
}