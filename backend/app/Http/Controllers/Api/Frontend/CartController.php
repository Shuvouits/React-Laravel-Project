<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    // Cart summary
    public function summary(Request $request)
    {
        $validated = $request->validate([
            'items' => ['required', 'array'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.variant_id' => ['nullable', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $requestedItems = collect($validated['items']);

        if ($requestedItems->isEmpty()) {
            return $this->emptyCartResponse();
        }

        $productIds = $requestedItems
            ->pluck('product_id')
            ->unique()
            ->values();

        $query = Product::query()
            ->whereIn('id', $productIds)
            ->where('status', 'active')
            ->where('online_store', true)
            ->with([
                'media',
                'variants.optionValues.option',
            ]);

        // Seller relation
        if (method_exists(Product::class, 'vendor')) {
            $query->with('vendor');
        }

        if (method_exists(Product::class, 'store')) {
            $query->with('store');
        }

        if (method_exists(Product::class, 'seller')) {
            $query->with('seller');
        }

        $products = $query
            ->get()
            ->keyBy('id');

        $cartItems = collect();
        $unavailableItems = collect();

        foreach ($requestedItems as $requestedItem) {
            $product = $products->get(
                $requestedItem['product_id']
            );

            if (! $product) {
                $unavailableItems->push([
                    'product_id' => $requestedItem['product_id'],
                    'variant_id' => $requestedItem['variant_id'] ?? null,
                    'reason' => 'Product is unavailable.',
                ]);

                continue;
            }

            $item = $this->formatCartItem(
                $product,
                $requestedItem
            );

            if (! $item) {
                $unavailableItems->push([
                    'product_id' => $requestedItem['product_id'],
                    'variant_id' => $requestedItem['variant_id'] ?? null,
                    'reason' => 'Selected variant is unavailable.',
                ]);

                continue;
            }

            $cartItems->push($item);
        }

        $subtotal = $cartItems->sum('line_total');
        $savings = $cartItems->sum('line_savings');

        $groups = $cartItems
            ->groupBy('seller.key')
            ->map(function ($items) {
                $firstItem = $items->first();

                return [
                    'seller' => $firstItem['seller'],
                    'items' => $items->values(),
                    'subtotal' => round(
                        $items->sum('line_total'),
                        2
                    ),
                ];
            })
            ->values();

        return response()->json([
            'status' => true,
            'groups' => $groups,
            'items' => $cartItems->values(),
            'unavailable_items' => $unavailableItems->values(),

            'summary' => [
                'subtotal' => round($subtotal, 2),
                'shipping' => null,
                'estimated_tax' => null,
                'promo_discount' => 0,
                'sale_savings' => round($savings, 2),
                'total' => round($subtotal, 2),
            ],
        ]);
    }

    // Format cart item
    private function formatCartItem($product, $requestedItem)
    {
        $variantId = $requestedItem['variant_id'] ?? null;
        $quantity = (int) $requestedItem['quantity'];

        $variant = null;

        if ($variantId) {
            $variant = $product->variants
                ->firstWhere('id', $variantId);

            if (! $variant || ! $variant->is_active) {
                return null;
            }
        }

        $price = $variant
            ? (float) ($variant->price ?? 0)
            : (float) ($product->price ?? 0);

        $compareAtPrice = $variant
            ? (float) ($variant->compare_at_price ?? 0)
            : (float) ($product->compare_at_price ?? 0);

        $availableQuantity = $variant
            ? (int) ($variant->quantity ?? 0)
            : (int) ($product->quantity ?? 0);

        $imageUrl = $variant
            ? $this->resolveVariantImage($product, $variant)
            : $this->resolveProductImage($product);

        $options = $variant
            ? $this->formatVariantOptions($variant)
            : [];

        $seller = $this->resolveSeller($product);

        $lineTotal = $price * $quantity;

        $lineSavings = 0;

        if ($compareAtPrice > $price) {
            $lineSavings = (
                $compareAtPrice -
                $price
            ) * $quantity;
        }

        return [
            'product_id' => $product->id,
            'variant_id' => $variant?->id,

            'title' => $product->title,
            'slug' => $product->slug,

            'image_url' => $imageUrl,

            'price' => $price,
            'compare_at_price' => $compareAtPrice,

            'quantity' => $quantity,
            'available_quantity' => $availableQuantity,
            'in_stock' => $availableQuantity > 0,

            'options' => $options,
            'seller' => $seller,

            'line_total' => round($lineTotal, 2),
            'line_savings' => round($lineSavings, 2),
        ];
    }

    // Variant options
    private function formatVariantOptions($variant)
    {
        if (! $variant->relationLoaded('optionValues')) {
            return [];
        }

        return $variant->optionValues
            ->map(function ($optionValue) {
                $name = $optionValue->option?->name;

                return [
                    'name' => $name,
                    'value' => $optionValue->value,
                    'color_code' => $optionValue->color_code ?? null,
                ];
            })
            ->filter(function ($option) {
                return (
                    ! empty($option['name']) &&
                    $option['value'] !== null
                );
            })
            ->values()
            ->toArray();
    }

    // Variant image
    private function resolveVariantImage($product, $variant)
    {
        if (! empty($variant->product_media_id)) {
            $media = $product->media
                ->firstWhere(
                    'id',
                    $variant->product_media_id
                );

            if ($media) {
                return $this->resolveMediaUrl($media);
            }
        }

        return $this->resolveProductImage($product);
    }

    // Product image
    private function resolveProductImage($product)
    {
        if (
            $product->relationLoaded('media') &&
            $product->media &&
            $product->media->isNotEmpty()
        ) {
            $media = $product->media
                ->firstWhere('is_cover', true)
                ?? $product->media->first();

            return $this->resolveMediaUrl($media);
        }

        if (! empty($product->image_url)) {
            return $product->image_url;
        }

        return null;
    }

    // Media URL
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

    // Seller
    private function resolveSeller($product)
    {
        $seller = null;

        if (
            $product->relationLoaded('vendor') &&
            $product->vendor
        ) {
            $seller = $product->vendor;
        }

        if (
            ! $seller &&
            $product->relationLoaded('store') &&
            $product->store
        ) {
            $seller = $product->store;
        }

        if (
            ! $seller &&
            $product->relationLoaded('seller') &&
            $product->seller
        ) {
            $seller = $product->seller;
        }

        if (! $seller) {
            return [
                'key' => 'storify',
                'id' => null,
                'name' => 'Storify',
                'slug' => null,
            ];
        }

        $id = $seller->id ?? null;

        $name = $seller->store_name
            ?? $seller->shop_name
            ?? $seller->name
            ?? 'Storify';

        $slug = $seller->slug
            ?? $seller->store_slug
            ?? null;

        return [
            'key' => $id
                ? 'seller-' . $id
                : 'storify',
            'id' => $id,
            'name' => $name,
            'slug' => $slug,
        ];
    }

    // Empty cart
    private function emptyCartResponse()
    {
        return response()->json([
            'status' => true,
            'groups' => [],
            'items' => [],
            'unavailable_items' => [],

            'summary' => [
                'subtotal' => 0,
                'shipping' => null,
                'estimated_tax' => null,
                'promo_discount' => 0,
                'sale_savings' => 0,
                'total' => 0,
            ],
        ]);
    }
}
