<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\JsonResponse;

class BrandController extends Controller
{
    public function index(): JsonResponse
    {
        $brands = Brand::query()
            ->where('status', 'active')
            ->where('approval_status', 'approved')
            ->withCount([
                'products as products_count' => function ($query) {
                    $query
                        ->where('status', 'active')
                        ->where('online_store', true);
                },
            ])
            ->orderBy('display_order')
            ->orderBy('name')
            ->get()
            ->map(function ($brand) {
                return [
                    'id' => $brand->id,
                    'name' => $brand->name,
                    'slug' => $brand->slug,
                    'description' => $brand->description,
                    'website' => $brand->website,
                    'logo' => $brand->logo,
                    'logo_url' => $this->resolveLogoUrl(
                        $brand->logo
                    ),
                    'is_featured' => (bool) $brand->is_featured,
                    'display_order' => (int) $brand->display_order,
                    'products_count' => (int) $brand->products_count,
                    'products_url' => url(
                        '/api/products?brand=' .
                        urlencode($brand->slug)
                    ),
                ];
            })
            ->values();

        return response()->json([
            'status' => true,
            'brands' => $brands,
        ]);
    }

    private function resolveLogoUrl(?string $logo): ?string
    {
        if (! $logo) {
            return null;
        }

        if (
            str_starts_with($logo, 'http://') ||
            str_starts_with($logo, 'https://')
        ) {
            return $logo;
        }

        return asset(
            ltrim($logo, '/')
        );
    }
}
