<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $wishlists = Wishlist::with([
            'product.media',
            'product.variants.optionValues.option',
        ])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        $formattedWishlists = $wishlists->map(function ($wishlist) {
            if (! $wishlist->product) {
                return null;
            }

            return [
                'id' => $wishlist->id,
                'user_id' => $wishlist->user_id,
                'product_id' => $wishlist->product_id,
                'created_at' => $wishlist->created_at,
                'product' => $this->formatProduct($wishlist->product),
            ];
        })
            ->filter()
            ->values();

        return response()->json([
            'success' => true,
            'wishlist_count' => $formattedWishlists->count(),
            'wishlists' => $formattedWishlists,
        ]);
    }

    public function store(
        Request $request,
        Product $product
    ): JsonResponse {
        $wishlist = Wishlist::firstOrCreate([
            'user_id' => $request->user()->id,
            'product_id' => $product->id,
        ]);

        $count = Wishlist::where(
            'user_id',
            $request->user()->id
        )->count();

        return response()->json([
            'success' => true,
            'message' => 'Product added to wishlist.',
            'wishlist_count' => $count,
            'wishlist' => $wishlist,
        ]);
    }

    public function destroy(
        Request $request,
        Product $product
    ): JsonResponse {
        Wishlist::where(
            'user_id',
            $request->user()->id
        )
            ->where('product_id', $product->id)
            ->delete();

        $count = Wishlist::where(
            'user_id',
            $request->user()->id
        )->count();

        return response()->json([
            'success' => true,
            'message' => 'Product removed from wishlist.',
            'wishlist_count' => $count,
        ]);
    }

    public function check(
        Request $request,
        Product $product
    ): JsonResponse {
        $wishlisted = Wishlist::where(
            'user_id',
            $request->user()->id
        )
            ->where('product_id', $product->id)
            ->exists();

        return response()->json([
            'success' => true,
            'wishlisted' => $wishlisted,
        ]);
    }

    private function formatProduct($product): array
    {
        $productMedia = $product->media ?? collect();
        $variants = $product->variants ?? collect();

        $imageUrl = $this->resolveProductImage(
            $product
        );

        $formattedVariants = $variants->map(function ($variant) use (
            $productMedia,
            $imageUrl
        ) {
            return $this->formatVariant(
                $variant,
                $productMedia,
                $imageUrl
            );
        })->values();

        $price = $product->price;
        $compareAtPrice = $product->compare_at_price;

        if ($formattedVariants->isNotEmpty()) {
            $saleVariant = $formattedVariants->first(function ($variant) {
                return (
                    $variant['price'] > 0 &&
                    $variant['compare_at_price'] > $variant['price']
                );
            });

            if ($saleVariant) {
                $price = $saleVariant['price'];
                $compareAtPrice = $saleVariant['compare_at_price'];
            } elseif ($price === null) {
                $validPrices = $formattedVariants
                    ->pluck('price')
                    ->filter(function ($value) {
                        return $value > 0;
                    });

                if ($validPrices->isNotEmpty()) {
                    $price = $validPrices->min();
                }
            }
        }

        return [
            'id' => $product->id,
            'title' => $product->title,
            'slug' => $product->slug,
            'summary' => $product->summary,
            'description' => $product->description,
            'type' => $product->type,

            'price' => $price !== null
                ? (float) $price
                : 0,

            'compare_at_price' => $compareAtPrice !== null
                ? (float) $compareAtPrice
                : 0,

            'is_featured' => (bool) $product->is_featured,
            'preorder_enabled' => (bool) ($product->preorder_enabled ?? false),
            'quantity' => (int) ($product->quantity ?? 0),
            'image_url' => $imageUrl,
            'store_name' => 'Storify',
            'variants' => $formattedVariants,
        ];
    }

    private function formatVariant(
        $variant,
        $productMedia,
        $productImage
    ): array {
        $optionValues = $variant->optionValues ?? collect();

        $options = $optionValues->map(function ($optionValue) {
            $optionName = $optionValue->option->name ?? null;

            return [
                'id' => $optionValue->id,

                'global_variant_value_id' =>
                    $optionValue->global_variant_value_id ?? null,

                'global_variant_name' => $optionName,
                'name' => $optionName,
                'option_name' => $optionName,
                'value' => $optionValue->value ?? null,
                'color_code' => $optionValue->color_code ?? null,
            ];
        })
            ->filter(function ($option) {
                return (
                    ! empty($option['option_name']) &&
                    $option['value'] !== null
                );
            })
            ->values();

        $variantImage = null;

        if (! empty($variant->product_media_id)) {
            $media = $productMedia->firstWhere(
                'id',
                $variant->product_media_id
            );

            if ($media) {
                $variantImage = $this->resolveMediaUrl(
                    $media
                );
            }
        }

        if (! $variantImage) {
            $variantImage = $productImage;
        }

        return [
            'id' => $variant->id,
            'title' => $variant->title ?? $variant->name ?? null,
            'name' => $variant->name ?? $variant->title ?? null,
            'combination_key' => $variant->combination_key ?? null,
            'product_media_id' => $variant->product_media_id ?? null,
            'sku' => $variant->sku ?? null,
            'barcode' => $variant->barcode ?? null,

            'price' => $variant->price !== null
                ? (float) $variant->price
                : 0,

            'compare_at_price' => $variant->compare_at_price !== null
                ? (float) $variant->compare_at_price
                : 0,

            'quantity' => (int) ($variant->quantity ?? 0),
            'is_default' => (bool) ($variant->is_default ?? false),
            'is_active' => (bool) ($variant->is_active ?? true),
            'image_url' => $variantImage,
            'options' => $options,
        ];
    }

    private function resolveProductImage($product)
    {
        if (
            $product->media &&
            $product->media->isNotEmpty()
        ) {
            $media = $product->media->firstWhere(
                'is_cover',
                true
            );

            if (! $media) {
                $media = $product->media->first();
            }

            return $this->resolveMediaUrl(
                $media
            );
        }

        if (! empty($product->image_url)) {
            return $product->image_url;
        }

        return null;
    }

    private function resolveMediaUrl($media)
    {
        if (! $media) {
            return null;
        }

        $path = $media->file_path
            ?? $media->image
            ?? $media->path
            ?? $media->url
            ?? null;

        if (! $path) {
            return null;
        }

        if (
            str_starts_with($path, 'http://') ||
            str_starts_with($path, 'https://')
        ) {
            return $path;
        }

        return asset($path);
    }
}