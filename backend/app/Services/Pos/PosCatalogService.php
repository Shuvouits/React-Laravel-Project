<?php

namespace App\Services\Pos;

use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PosCatalogService
{
    public function catalog(
        array $context,
        array $filters = []
    ): array {
        $locationId = (int) $context['location_id'];

        $search = trim(
            (string) ($filters['search'] ?? '')
        );

        $categoryId = isset($filters['category_id'])
            ? (int) $filters['category_id']
            : null;

        $stock = $filters['stock'] ?? 'all';

        $perPage = min(
            max(
                (int) ($filters['per_page'] ?? 24),
                1
            ),
            100
        );

        $page = max(
            (int) ($filters['page'] ?? 1),
            1
        );

        $query = DB::table('products')
            ->where('products.status', 'active')
            ->where('products.point_of_sale', true);

        $this->applyOwnerScope(
            $query,
            $context
        );

        if ($categoryId) {
            $query->where(
                'products.category_id',
                $categoryId
            );
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where(
                        'products.title',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'products.sku',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'products.barcode',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereExists(function ($variantQuery) use ($search) {
                        $variantQuery
                            ->selectRaw('1')
                            ->from('product_variants')
                            ->whereColumn(
                                'product_variants.product_id',
                                'products.id'
                            )
                            ->where('product_variants.is_active', true)
                            ->where(function ($variantSearch) use ($search) {
                                $variantSearch
                                    ->where(
                                        'product_variants.title',
                                        'like',
                                        "%{$search}%"
                                    )
                                    ->orWhere(
                                        'product_variants.sku',
                                        'like',
                                        "%{$search}%"
                                    )
                                    ->orWhere(
                                        'product_variants.barcode',
                                        'like',
                                        "%{$search}%"
                                    );
                            });
                    });
            });
        }

        $query
            ->orderByDesc('products.is_featured')
            ->orderByDesc('products.id');

        $paginator = $query->paginate(
            $perPage,
            ['products.*'],
            'page',
            $page
        );

        $productCollection = collect(
            $paginator->items()
        );

        $productIds = $productCollection
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->values()
            ->all();

        $media = $this->loadProductMedia(
            $productIds
        );

        $variants = $this->loadVariants(
            $productIds
        );

        $inventory = $this->loadInventory(
            $locationId,
            $productIds
        );

        $products = $productCollection
            ->map(function ($product) use (
                $media,
                $variants,
                $inventory,
                $locationId
            ) {
                return $this->formatProduct(
                    $product,
                    $media,
                    $variants,
                    $inventory,
                    $locationId
                );
            });

        if ($stock === 'in_stock') {
            $products = $products
                ->filter(
                    fn ($product) =>
                        $product['available_quantity'] > 0
                );
        }

        if ($stock === 'out_of_stock') {
            $products = $products
                ->filter(
                    fn ($product) =>
                        $product['available_quantity'] <= 0
                );
        }

        if ($stock === 'low_stock') {
            $products = $products
                ->filter(function ($product) {
                    return
                        $product['available_quantity'] > 0
                        && $product['available_quantity']
                            <= $product['low_stock_threshold'];
                });
        }

        return [
            'products' => $products
                ->values()
                ->all(),

            'pagination' => [
                'current_page' =>
                    $paginator->currentPage(),

                'last_page' =>
                    $paginator->lastPage(),

                'per_page' =>
                    $paginator->perPage(),

                'total' =>
                    $paginator->total(),

                'from' =>
                    $paginator->firstItem(),

                'to' =>
                    $paginator->lastItem(),
            ],
        ];
    }

    public function categories(
        array $context
    ): array {
        $query = DB::table('categories')
            ->where('categories.status', 'active')
            ->whereExists(function ($productQuery) use ($context) {
                $productQuery
                    ->selectRaw('1')
                    ->from('products')
                    ->whereColumn(
                        'products.category_id',
                        'categories.id'
                    )
                    ->where('products.status', 'active')
                    ->where('products.point_of_sale', true);

                $this->applyOwnerScope(
                    $productQuery,
                    $context
                );
            })
            ->orderBy('categories.display_order')
            ->orderBy('categories.name');

        return $query
            ->get([
                'categories.id',
                'categories.name',
                'categories.slug',
                'categories.image',
            ])
            ->map(function ($category) {
                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'image' => $category->image,

                    'image_url' =>
                        $category->image
                            ? asset($category->image)
                            : null,
                ];
            })
            ->values()
            ->all();
    }

    public function barcodeLookup(
        array $context,
        int $locationId,
        string $code
    ): array {
        $code = trim($code);

        if ($code === '') {
            throw ValidationException::withMessages([
                'code' => [
                    'A SKU or barcode is required.',
                ],
            ]);
        }

        $productQuery = DB::table('products')
            ->where('status', 'active')
            ->where('point_of_sale', true)
            ->where(function ($builder) use ($code) {
                $builder
                    ->where('sku', $code)
                    ->orWhere('barcode', $code);
            });

        $this->applyOwnerScope(
            $productQuery,
            $context
        );

        $product = $productQuery->first();

        if ($product) {
            $formattedProduct =
                $this->singleFormattedProduct(
                    $product,
                    $locationId
                );

            if (
                $formattedProduct['has_variants']
                && count(
                    $formattedProduct['variants']
                ) > 1
            ) {
                return [
                    'match_type' => 'product',
                    'action' => 'select_variant',
                    'product' => $formattedProduct,
                    'variant' => null,
                ];
            }

            return [
                'match_type' => 'product',
                'action' => 'add',
                'product' => $formattedProduct,

                'variant' =>
                    $formattedProduct['variants'][0]
                    ?? null,
            ];
        }

        $variantQuery = DB::table('product_variants')
            ->join(
                'products',
                'products.id',
                '=',
                'product_variants.product_id'
            )
            ->where('products.status', 'active')
            ->where('products.point_of_sale', true)
            ->where('product_variants.is_active', true)
            ->where(function ($builder) use ($code) {
                $builder
                    ->where(
                        'product_variants.sku',
                        $code
                    )
                    ->orWhere(
                        'product_variants.barcode',
                        $code
                    );
            });

        $this->applyOwnerScope(
            $variantQuery,
            $context
        );

        $variantMatch = $variantQuery
            ->select([
                'product_variants.id as variant_match_id',
                'products.*',
            ])
            ->first();

        if (!$variantMatch) {
            throw ValidationException::withMessages([
                'code' => [
                    'No POS product matched this SKU or barcode.',
                ],
            ]);
        }

        $formattedProduct =
            $this->singleFormattedProduct(
                $variantMatch,
                $locationId
            );

        $matchedVariant = collect(
            $formattedProduct['variants']
        )->firstWhere(
            'id',
            (int) $variantMatch->variant_match_id
        );

        if (!$matchedVariant) {
            throw ValidationException::withMessages([
                'code' => [
                    'The matching product variant is unavailable.',
                ],
            ]);
        }

        return [
            'match_type' => 'variant',
            'action' => 'add',
            'product' => $formattedProduct,
            'variant' => $matchedVariant,
        ];
    }

    private function singleFormattedProduct(
        object $product,
        int $locationId
    ): array {
        $productIds = [
            (int) $product->id,
        ];

        return $this->formatProduct(
            $product,
            $this->loadProductMedia($productIds),
            $this->loadVariants($productIds),
            $this->loadInventory(
                $locationId,
                $productIds
            ),
            $locationId
        );
    }

    private function loadProductMedia(
        array $productIds
    ): Collection {
        if (!$productIds) {
            return collect();
        }

        return DB::table('product_media')
            ->whereIn('product_id', $productIds)
            ->where('media_type', 'image')
            ->orderByDesc('is_cover')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->groupBy('product_id');
    }

    private function loadVariants(
        array $productIds
    ): Collection {
        if (!$productIds) {
            return collect();
        }

        return DB::table('product_variants')
            ->leftJoin(
                'product_media',
                'product_media.id',
                '=',
                'product_variants.product_media_id'
            )
            ->whereIn(
                'product_variants.product_id',
                $productIds
            )
            ->where(
                'product_variants.is_active',
                true
            )
            ->orderBy(
                'product_variants.sort_order'
            )
            ->orderBy(
                'product_variants.id'
            )
            ->get([
                'product_variants.*',
                'product_media.file_path as variant_image',
            ])
            ->groupBy('product_id');
    }

    private function loadInventory(
        int $locationId,
        array $productIds
    ): Collection {
        if (!$productIds) {
            return collect();
        }

        return DB::table('inventory_levels')
            ->where('location_id', $locationId)
            ->whereIn('product_id', $productIds)
            ->get()
            ->groupBy('product_id');
    }

    private function formatProduct(
        object $product,
        Collection $mediaCollection,
        Collection $variantCollection,
        Collection $inventoryCollection,
        int $locationId
    ): array {
        $productMedia = $mediaCollection->get(
            $product->id,
            collect()
        );

        $coverMedia = $productMedia->first();

        $productImage = $coverMedia
            ? $coverMedia->file_path
            : null;

        $productImageUrl = $productImage
            ? asset($productImage)
            : null;

        $productVariants = $variantCollection->get(
            $product->id,
            collect()
        );

        $productInventory = $inventoryCollection->get(
            $product->id,
            collect()
        );

        $formattedVariants = $productVariants
            ->map(function ($variant) use (
                $product,
                $productInventory,
                $productImage,
                $productImageUrl,
                $locationId
            ) {
                $level = $productInventory
                    ->firstWhere(
                        'variant_id',
                        $variant->id
                    );

                $availableQuantity =
                    $this->availableQuantity(
                        $level,
                        (int) $variant->quantity
                    );

                $variantImage =
                    $variant->variant_image
                    ?: $productImage;

                return [
                    'id' => (int) $variant->id,
                    'product_id' => (int) $product->id,
                    'location_id' => $locationId,
                    'title' => $variant->title,
                    'sku' => $variant->sku,
                    'barcode' => $variant->barcode,

                    'price' => (float) (
                        $variant->price
                        ?? $product->price
                        ?? 0
                    ),

                    'compare_at_price' =>
                        $variant->compare_at_price !== null
                            ? (float) $variant->compare_at_price
                            : (
                                $product->compare_at_price !== null
                                    ? (float) $product->compare_at_price
                                    : null
                            ),

                    'image' => $variantImage,

                    'image_url' =>
                        $variantImage
                            ? asset($variantImage)
                            : $productImageUrl,

                    'available_quantity' =>
                        $availableQuantity,

                    'in_stock' =>
                        $availableQuantity > 0
                        || (bool) $product
                            ->continue_selling_when_out_of_stock,
                ];
            })
            ->values();

        if ($formattedVariants->isNotEmpty()) {
            $availableQuantity = (int) $formattedVariants
                ->sum('available_quantity');
        } else {
            $level = $productInventory
                ->firstWhere(
                    'variant_id',
                    null
                );

            $availableQuantity =
                $this->availableQuantity(
                    $level,
                    (int) $product->quantity
                );
        }

        $lowStockThreshold = (int) (
            $productInventory->first()
                ->low_stock_threshold
            ?? 10
        );

        return [
            'id' => (int) $product->id,
            'category_id' =>
                $product->category_id
                    ? (int) $product->category_id
                    : null,

            'title' => $product->title,
            'slug' => $product->slug,
            'source' => $product->source,
            'created_by' => $product->created_by,
            'product_format' => $product->product_format,
            'sku' => $product->sku,
            'barcode' => $product->barcode,

            'price' => (float) (
                $product->price
                ?? $formattedVariants->min('price')
                ?? 0
            ),

            'compare_at_price' =>
                $product->compare_at_price !== null
                    ? (float) $product->compare_at_price
                    : null,

            'image' => $productImage,
            'image_url' => $productImageUrl,
            'location_id' => $locationId,

            'has_variants' =>
                $formattedVariants->isNotEmpty(),

            'variant_count' =>
                $formattedVariants->count(),

            'variants' =>
                $formattedVariants->all(),

            'available_quantity' =>
                $availableQuantity,

            'low_stock_threshold' =>
                $lowStockThreshold,

            'in_stock' =>
                $availableQuantity > 0
                || (bool) $product
                    ->continue_selling_when_out_of_stock,

            'continue_selling_when_out_of_stock' =>
                (bool) $product
                    ->continue_selling_when_out_of_stock,
        ];
    }

    private function availableQuantity(
        ?object $level,
        int $fallbackQuantity
    ): int {
        if (!$level) {
            return max(
                0,
                $fallbackQuantity
            );
        }

        return max(
            0,
            (int) $level->on_hand
            - (int) $level->committed
            - (int) $level->unavailable
        );
    }

    private function applyOwnerScope(
        $query,
        array $context
    ): void {
        if ($context['role'] === 'admin') {
            $query
                ->where(
                    'products.source',
                    'admin'
                );

            return;
        }

        $query
            ->where(
                'products.source',
                'vendor'
            )
            ->where(
                'products.created_by',
                $context['vendor_user_id']
            );
    }
}