<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PreOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $sort = $request->query('sort', 'ships_soonest');
        $perPage = min(max((int) $request->query('per_page', 12), 1), 48);

        $query = Product::query()
            ->leftJoin('product_preorders as preorder_sort', 'products.id', '=', 'preorder_sort.product_id')
            ->select('products.*')
            ->with([
                'media',
                'variants.media',
                'category',
                'brand',
                'preorder',
            ])
            ->where('products.status', 'active')
            ->where('products.online_store', true)
            ->where('products.preorder_enabled', true);

        $query->where(function ($query) {
            $query->whereNull('preorder_sort.preorder_start_at')
                ->orWhere('preorder_sort.preorder_start_at', '<=', now());
        });

        $query->where(function ($query) {
            $query->whereNull('preorder_sort.preorder_end_at')
                ->orWhere('preorder_sort.preorder_end_at', '>=', now());
        });

        if ($search !== '') {
            $query->where(function ($query) use ($search) {
                $query->where('products.title', 'like', '%' . $search . '%')
                    ->orWhere('products.summary', 'like', '%' . $search . '%')
                    ->orWhere('products.sku', 'like', '%' . $search . '%')
                    ->orWhereHas('brand', function ($brandQuery) use ($search) {
                        $brandQuery->where('name', 'like', '%' . $search . '%');
                    })
                    ->orWhereHas('category', function ($categoryQuery) use ($search) {
                        $categoryQuery->where('name', 'like', '%' . $search . '%');
                    });
            });
        }

        if ($sort === 'most_reserved') {
            $query->orderByRaw('COALESCE(preorder_sort.reserved_quantity, 0) DESC')
                ->orderByDesc('products.created_at');
        } elseif ($sort === 'newest') {
            $query->orderByDesc('products.created_at');
        } else {
            $query->orderByRaw('preorder_sort.expected_ship_from IS NULL')
                ->orderBy('preorder_sort.expected_ship_from')
                ->orderByDesc('products.created_at');
        }

        $products = $query->paginate($perPage);

        $items = collect($products->items())
            ->map(function ($product) {
                return $this->formatProduct($product);
            })
            ->values();

        return response()->json([
            'success' => true,

            'products' => $items,

            'pagination' => [
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'per_page' => $products->perPage(),
                'total' => $products->total(),
                'from' => $products->firstItem(),
                'to' => $products->lastItem(),
            ],

            'filters' => [
                'search' => $search,
                'sort' => $sort,
            ],

            'available_sorts' => [
                [
                    'value' => 'ships_soonest',
                    'label' => 'Ships soonest',
                ],
                [
                    'value' => 'most_reserved',
                    'label' => 'Most reserved',
                ],
                [
                    'value' => 'newest',
                    'label' => 'Newest drops',
                ],
            ],
        ]);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::query()
            ->with([
                'media',
                'variants.media',
                'category',
                'brand',
                'preorder',
            ])
            ->where('slug', $slug)
            ->where('status', 'active')
            ->where('online_store', true)
            ->where('preorder_enabled', true)
            ->first();

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Pre-order product not found.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'product' => $this->formatProduct($product, true),
        ]);
    }

    private function formatProduct(Product $product, bool $includeDetails = false): array
    {
        $variants = $product->variants ?? collect();
        $preorder = $product->preorder;

        $hasVariants = $variants->isNotEmpty();

        $prices = $hasVariants
            ? $variants->pluck('price')->filter(fn ($price) => $price !== null)
            : collect([$product->price])->filter(fn ($price) => $price !== null);

        $minimumPrice = $prices->isNotEmpty()
            ? (float) $prices->min()
            : 0;

        $maximumPrice = $prices->isNotEmpty()
            ? (float) $prices->max()
            : 0;

        $availableQuantity = $hasVariants
            ? $variants->sum(function ($variant) {
                return max(0, (int) ($variant->quantity ?? 0));
            })
            : max(0, (int) ($product->quantity ?? 0));

        $reservedQuantity = (int) ($preorder?->reserved_quantity ?? 0);

        $maxPreorderQuantity = $preorder?->max_preorder_quantity !== null
            ? (int) $preorder->max_preorder_quantity
            : null;

        $remainingPreorderQuantity = $maxPreorderQuantity !== null
            ? max(0, $maxPreorderQuantity - $reservedQuantity)
            : null;

        $depositAmountFrom = $this->calculateDepositAmount(
            $minimumPrice,
            $preorder
        );

        $data = [
            'id' => $product->id,
            'title' => $product->title,
            'slug' => $product->slug,
            'summary' => $product->summary,
            'preorder_enabled' => (bool) $product->preorder_enabled,
            'product_format' => $product->product_format,

            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
                'slug' => $product->category->slug ?? null,
            ] : null,

            'brand' => $product->brand ? [
                'id' => $product->brand->id,
                'name' => $product->brand->name,
                'slug' => $product->brand->slug ?? null,
            ] : null,

            'image_url' => $this->getProductImageUrl($product),

            'has_variants' => $hasVariants,

            'price' => $hasVariants
                ? null
                : (float) ($product->price ?? 0),

            'price_min' => $minimumPrice,
            'price_max' => $maximumPrice,

            'compare_at_price' => !$hasVariants && $product->compare_at_price !== null
                ? (float) $product->compare_at_price
                : null,

            'available_quantity' => $availableQuantity,

            'preorder' => [
                'status' => $this->getPreorderStatus($preorder),

                'badge_text' => $preorder?->badge_text ?: 'Pre-order',

                'preorder_start_at' => $preorder?->preorder_start_at,
                'preorder_end_at' => $preorder?->preorder_end_at,

                'expected_ship_from' => $preorder?->expected_ship_from,
                'expected_ship_to' => $preorder?->expected_ship_to,

                'payment_type' => $preorder?->payment_type ?: 'full',

                'deposit_type' => $preorder?->deposit_type,

                'deposit_value' => $preorder?->deposit_value !== null
                    ? (float) $preorder->deposit_value
                    : null,

                'deposit_amount_from' => $depositAmountFrom,

                'allow_full_payment' => $preorder
                    ? (bool) $preorder->allow_full_payment
                    : true,

                'balance_due_at' => $preorder?->balance_due_at,

                'reserved_quantity' => $reservedQuantity,

                'max_preorder_quantity' => $maxPreorderQuantity,

                'remaining_quantity' => $remainingPreorderQuantity,

                'max_quantity_per_customer' => $preorder?->max_quantity_per_customer !== null
                    ? (int) $preorder->max_quantity_per_customer
                    : null,

                'show_remaining_quantity' => $preorder
                    ? (bool) $preorder->show_remaining_quantity
                    : false,

                'preorder_message' => $preorder?->preorder_message,
            ],

            'created_at' => $product->created_at,
        ];

        if ($includeDetails) {
            $data['description'] = $product->description;
            $data['specifications'] = $product->specifications;
            $data['tags'] = $product->tags;

            $data['preorder']['terms'] = $preorder?->terms;

            $data['variants'] = $variants
                ->map(function ($variant) use ($product, $preorder) {
                    $price = (float) ($variant->price ?? 0);

                    return [
                        'id' => $variant->id,
                        'product_id' => $product->id,

                        'name' => $variant->name
                            ?? $variant->title
                            ?? null,

                        'sku' => $variant->sku,

                        'price' => $price,

                        'compare_at_price' => $variant->compare_at_price !== null
                            ? (float) $variant->compare_at_price
                            : null,

                        'deposit_amount' => $this->calculateDepositAmount(
                            $price,
                            $preorder
                        ),

                        'quantity' => max(
                            0,
                            (int) ($variant->quantity ?? 0)
                        ),

                        'track_quantity' => (bool) (
                            $variant->track_quantity ?? true
                        ),

                        'continue_selling_when_out_of_stock' => (bool) (
                            $variant->continue_selling_when_out_of_stock ?? false
                        ),

                        'image_url' => $this->getVariantImageUrl(
                            $variant,
                            $product
                        ),
                    ];
                })
                ->values();
        }

        return $data;
    }

    private function calculateDepositAmount(float $price, $preorder): ?float
    {
        if (!$preorder) {
            return null;
        }

        if ($preorder->payment_type !== 'deposit') {
            return null;
        }

        if ($preorder->deposit_value === null) {
            return null;
        }

        $depositValue = (float) $preorder->deposit_value;

        if ($preorder->deposit_type === 'percentage') {
            return round(
                $price * ($depositValue / 100),
                2
            );
        }

        if ($preorder->deposit_type === 'fixed') {
            return round(
                min($price, $depositValue),
                2
            );
        }

        return null;
    }

    private function getPreorderStatus($preorder): string
    {
        if (!$preorder) {
            return 'open';
        }

        if (
            $preorder->preorder_start_at &&
            $preorder->preorder_start_at->isFuture()
        ) {
            return 'upcoming';
        }

        if (
            $preorder->preorder_end_at &&
            $preorder->preorder_end_at->isPast()
        ) {
            return 'closed';
        }

        if (
            $preorder->max_preorder_quantity !== null &&
            $preorder->reserved_quantity >= $preorder->max_preorder_quantity
        ) {
            return 'sold_out';
        }

        return 'open';
    }

    private function getVariantImageUrl($variant, Product $product): ?string
    {
        if ($variant->media) {
            return asset($variant->media->file_path);
        }

        return $this->getProductImageUrl($product);
    }

    private function getProductImageUrl(Product $product): ?string
    {
        if (!$product->media || $product->media->isEmpty()) {
            return null;
        }

        $cover = $product->media->firstWhere('is_cover', true);
        $media = $cover ?? $product->media->first();

        if (!$media) {
            return null;
        }

        return asset($media->file_path);
    }
}