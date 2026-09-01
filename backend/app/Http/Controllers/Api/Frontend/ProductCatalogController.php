<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Collection;
use App\Models\InventoryLocation;
use App\Models\Product;
use App\Models\ProductMedia;
use App\Models\ProductVariant;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductCatalogController extends Controller
{



public function index(
    Request $request
): JsonResponse {
    $perPage = min(
        max(
            (int) $request->input(
                'per_page',
                12
            ),
            4
        ),
        48
    );

    $query = Product::query()
        ->active()
        ->onlineStore()
        ->with([
            'category:id,name,slug',
            'brand:id,name,slug',
            'media',
            'options.values',

            'variants' =>
                function (
                    $variantQuery
                ) {
                    $variantQuery
                        ->where(
                            'is_active',
                            true
                        )
                        ->with([
                            'media',
                            'optionValues',
                        ]);
                },

            'collections:id,title,slug',
            'inventoryLevels',
        ]);

    $this->applySearchFilter(
        $query,
        $request
    );

    $this->applyCategoryFilter(
        $query,
        $request
    );

    $this->applyCollectionFilter(
        $query,
        $request
    );

    $this->applyBrandFilter(
        $query,
        $request
    );

    $this->applyLocationFilter(
        $query,
        $request
    );

    $this->applyPriceFilter(
        $query,
        $request
    );

    $this->applyStockFilter(
        $query,
        $request
    );

    $this->applySorting(
        $query,
        $request
    );

    $products = $query->paginate(
        $perPage
    );

    $products
        ->getCollection()
        ->transform(
            fn (Product $product) =>
                $this->productData(
                    $product
                )
        );

    return response()->json([
        'success' => true,

        'active_filters' => [
            'search' =>
                $request->input(
                    'search'
                ),

            'category' =>
                $this->arrayInput(
                    $request->input(
                        'category'
                    )
                ),

            'collection' =>
                $this->arrayInput(
                    $request->input(
                        'collection'
                    )
                ),

            'brand' =>
                $this->arrayInput(
                    $request->input(
                        'brand'
                    )
                ),

            'location' =>
                $this->arrayInput(
                    $request->input(
                        'location'
                    )
                ),

            'min_price' =>
                $request->input(
                    'min_price'
                ),

            'max_price' =>
                $request->input(
                    'max_price'
                ),

            'in_stock' =>
                $request->boolean(
                    'in_stock'
                ),

            'sort' =>
                $request->input(
                    'sort',
                    'default'
                ),
        ],

        'products' =>
            $products->items(),

        'pagination' => [
            'current_page' =>
                $products
                    ->currentPage(),

            'last_page' =>
                $products
                    ->lastPage(),

            'per_page' =>
                $products
                    ->perPage(),

            'total' =>
                $products->total(),

            'from' =>
                $products
                    ->firstItem(),

            'to' =>
                $products
                    ->lastItem(),

            'has_more_pages' =>
                $products
                    ->hasMorePages(),
        ],
    ]);
}

    public function filters(): JsonResponse
    {
        $categories = Category::query()
            ->active()
            ->withCount([
                'products as products_count' =>
                function ($query) {
                    $query
                        ->active()
                        ->onlineStore();
                },
            ])
            ->ordered()
            ->get([
                'id',
                'name',
                'slug',
                'parent_id',
            ])
            ->map(function (Category $category) {
                return [
                    'id' =>
                    $category->id,

                    'name' =>
                    $category->name,

                    'slug' =>
                    $category->slug,

                    'parent_id' =>
                    $category->parent_id,

                    'products_count' =>
                    (int) $category->products_count,
                ];
            })
            ->values();

        $collections = Collection::query()
            ->onlineStore()
            ->withCount([
                'products as products_count' =>
                function ($query) {
                    $query
                        ->active()
                        ->onlineStore();
                },
            ])
            ->ordered()
            ->get([
                'id',
                'title',
                'slug',
            ])
            ->map(function (Collection $collection) {
                return [
                    'id' =>
                    $collection->id,

                    'title' =>
                    $collection->title,

                    'slug' =>
                    $collection->slug,

                    'products_count' =>
                    (int) $collection->products_count,
                ];
            })
            ->values();

        $locations = InventoryLocation::query()
            ->where('is_active', true)
            ->whereHas(
                'inventoryLevels',
                function ($query) {
                    $query->where(
                        'on_hand',
                        '>',
                        0
                    );
                }
            )
            ->withCount([
                'inventoryLevels as products_count' =>
                function ($query) {
                    $query->where(
                        'on_hand',
                        '>',
                        0
                    );
                },
            ])
            ->orderBy('name')
            ->get([
                'id',
                'name',
                'city',
                'state',
                'country',
            ])
            ->map(function (
                InventoryLocation $location
            ) {
                return [
                    'id' =>
                    $location->id,

                    'name' =>
                    $location->name,

                    'city' =>
                    $location->city,

                    'state' =>
                    $location->state,

                    'country' =>
                    $location->country,

                    'label' =>
                    $this->locationLabel(
                        $location
                    ),

                    'products_count' =>
                    (int) $location->products_count,
                ];
            })
            ->values();

        $priceRange = Product::query()
            ->active()
            ->onlineStore()
            ->selectRaw(
                'MIN(price) as min_price, MAX(price) as max_price'
            )
            ->first();

        return response()->json([
            'success' => true,

            'filters' => [
                'categories' =>
                $categories,

                'collections' =>
                $collections,

                'locations' =>
                $locations,

                'price_range' => [
                    'min' =>
                    (float) (
                        $priceRange?->min_price ?? 0
                    ),

                    'max' =>
                    (float) (
                        $priceRange?->max_price ?? 0
                    ),
                ],

                'location_radius_available' =>
                false,
            ],
        ]);
    }

    private function applySearchFilter(
        Builder $query,
        Request $request
    ): void {
        $search = trim(
            (string) $request->input(
                'search',
                ''
            )
        );

        if ($search === '') {
            return;
        }

        $query->where(
            function (Builder $subQuery) use (
                $search
            ) {
                $subQuery
                    ->where(
                        'title',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'summary',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'sku',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereHas(
                        'category',
                        function (
                            Builder $categoryQuery
                        ) use ($search) {
                            $categoryQuery->where(
                                'name',
                                'like',
                                "%{$search}%"
                            );
                        }
                    )
                    ->orWhereHas(
                        'brand',
                        function (
                            Builder $brandQuery
                        ) use ($search) {
                            $brandQuery->where(
                                'name',
                                'like',
                                "%{$search}%"
                            );
                        }
                    );
            }
        );
    }

    private function applyCategoryFilter(
        Builder $query,
        Request $request
    ): void {
        $categories = $this->arrayInput(
            $request->input('category')
        );

        if (empty($categories)) {
            return;
        }

        $query->whereHas(
            'category',
            function (Builder $categoryQuery) use (
                $categories
            ) {
                $categoryQuery->whereIn(
                    'slug',
                    $categories
                );
            }
        );
    }

    private function applyCollectionFilter(
        Builder $query,
        Request $request
    ): void {
        $collections = $this->arrayInput(
            $request->input('collection')
        );

        if (empty($collections)) {
            return;
        }

        $query->whereHas(
            'collections',
            function (
                Builder $collectionQuery
            ) use ($collections) {
                $collectionQuery->whereIn(
                    'collections.slug',
                    $collections
                );
            }
        );
    }

    private function applyLocationFilter(
        Builder $query,
        Request $request
    ): void {
        $locationIds = $this->arrayInput(
            $request->input('location')
        );

        if (empty($locationIds)) {
            return;
        }

        $query->whereHas(
            'inventoryLevels',
            function (
                Builder $inventoryQuery
            ) use ($locationIds) {
                $inventoryQuery
                    ->whereIn(
                        'location_id',
                        array_map(
                            'intval',
                            $locationIds
                        )
                    )
                    ->whereRaw(
                        '(on_hand - committed - unavailable) > 0'
                    );
            }
        );
    }

    private function applyPriceFilter(
        Builder $query,
        Request $request
    ): void {
        $minPrice = $request->input(
            'min_price'
        );

        $maxPrice = $request->input(
            'max_price'
        );

        if (
            $minPrice !== null &&
            $minPrice !== ''
        ) {
            $minimum = max(
                0,
                (float) $minPrice
            );

            $query->where(
                function (Builder $priceQuery) use (
                    $minimum
                ) {
                    $priceQuery
                        ->where(
                            'price',
                            '>=',
                            $minimum
                        )
                        ->orWhereHas(
                            'variants',
                            function (
                                Builder $variantQuery
                            ) use ($minimum) {
                                $variantQuery
                                    ->where(
                                        'is_active',
                                        true
                                    )
                                    ->where(
                                        'price',
                                        '>=',
                                        $minimum
                                    );
                            }
                        );
                }
            );
        }

        if (
            $maxPrice !== null &&
            $maxPrice !== ''
        ) {
            $maximum = max(
                0,
                (float) $maxPrice
            );

            $query->where(
                function (Builder $priceQuery) use (
                    $maximum
                ) {
                    $priceQuery
                        ->where(
                            'price',
                            '<=',
                            $maximum
                        )
                        ->orWhereHas(
                            'variants',
                            function (
                                Builder $variantQuery
                            ) use ($maximum) {
                                $variantQuery
                                    ->where(
                                        'is_active',
                                        true
                                    )
                                    ->where(
                                        'price',
                                        '<=',
                                        $maximum
                                    );
                            }
                        );
                }
            );
        }
    }

    private function applyStockFilter(
        Builder $query,
        Request $request
    ): void {
        if (
            !$request->boolean(
                'in_stock'
            )
        ) {
            return;
        }

        $query->where(
            function (Builder $stockQuery) {
                $stockQuery
                    ->where(
                        'track_quantity',
                        false
                    )
                    ->orWhere(
                        'continue_selling_when_out_of_stock',
                        true
                    )
                    ->orWhere(
                        'quantity',
                        '>',
                        0
                    )
                    ->orWhereHas(
                        'variants',
                        function (
                            Builder $variantQuery
                        ) {
                            $variantQuery
                                ->where(
                                    'is_active',
                                    true
                                )
                                ->where(
                                    'quantity',
                                    '>',
                                    0
                                );
                        }
                    )
                    ->orWhereHas(
                        'inventoryLevels',
                        function (
                            Builder $inventoryQuery
                        ) {
                            $inventoryQuery->whereRaw(
                                '(on_hand - committed - unavailable) > 0'
                            );
                        }
                    );
            }
        );
    }

    private function applySorting(
        Builder $query,
        Request $request
    ): void {
        $sort = (string) $request->input(
            'sort',
            'default'
        );

        match ($sort) {
            'price_asc' =>
            $query
                ->orderByRaw(
                    'price IS NULL'
                )
                ->orderBy(
                    'price',
                    'asc'
                ),

            'price_desc' =>
            $query
                ->orderByRaw(
                    'price IS NULL'
                )
                ->orderBy(
                    'price',
                    'desc'
                ),

            'title_asc' =>
            $query->orderBy(
                'title',
                'asc'
            ),

            'title_desc' =>
            $query->orderBy(
                'title',
                'desc'
            ),

            'oldest' =>
            $query->orderBy(
                'created_at',
                'asc'
            ),

            'newest' =>
            $query->orderBy(
                'created_at',
                'desc'
            ),

            default =>
            $query
                ->orderByDesc(
                    'is_featured'
                )
                ->orderByDesc(
                    'created_at'
                ),
        };
    }

    private function productData(
        Product $product
    ): array {
        $activeVariants = $product
            ->variants
            ->where('is_active', true)
            ->values();

        $variantPrices = $activeVariants
            ->pluck('price')
            ->filter(
                fn($price) =>
                $price !== null
            )
            ->map(
                fn($price) =>
                (float) $price
            );

        $price = $variantPrices->isNotEmpty()
            ? $variantPrices->min()
            : (float) ($product->price ?? 0);

        $compareAtPrice =
            $product->compare_at_price !== null
            ? (float) $product->compare_at_price
            : null;

        $media = $product->media
            ->map(
                fn(ProductMedia $item) => [
                    'id' =>
                    $item->id,

                    'file_path' =>
                    $item->file_path,

                    'url' =>
                    asset($item->file_path),

                    'image_url' =>
                    asset($item->file_path),

                    'alt_text' =>
                    $item->alt_text,

                    'is_cover' =>
                    (bool) $item->is_cover,

                    'sort_order' =>
                    (int) $item->sort_order,
                ]
            )
            ->values();

        $cover = $product->media
            ->firstWhere(
                'is_cover',
                true
            ) ?? $product->media->first();

        $inventoryAvailable = $product
            ->inventoryLevels
            ->sum(
                fn($level) =>
                $level->available
            );

        $quantity = $activeVariants->isNotEmpty()
            ? $activeVariants->sum('quantity')
            : (int) ($product->quantity ?? 0);

        $availableQuantity = max(
            $quantity,
            $inventoryAvailable
        );

        $inStock =
            !$product->track_quantity ||
            $product
            ->continue_selling_when_out_of_stock ||
            $availableQuantity > 0;

        return [
            'id' =>
            $product->id,

            'title' =>
            $product->title,

            'slug' =>
            $product->slug,

            'summary' =>
            $product->summary,

            'price' =>
            $price,

            'compare_at_price' =>
            $compareAtPrice,

            'quantity' =>
            $availableQuantity,

            'in_stock' =>
            $inStock,

            'is_featured' =>
            (bool) $product->is_featured,

            'preorder_enabled' =>
            (bool) $product->preorder_enabled,

            'image_url' =>
            $cover
                ? asset(
                    $cover->file_path
                )
                : null,

            'media' =>
            $media,

            'category' =>
            $product->category
                ? [
                    'id' =>
                    $product->category->id,

                    'name' =>
                    $product->category->name,

                    'slug' =>
                    $product->category->slug,
                ]
                : null,

            'brand' =>
            $product->brand
                ? [
                    'id' =>
                    $product->brand->id,

                    'name' =>
                    $product->brand->name,

                    'slug' =>
                    $product->brand->slug,
                ]
                : null,

            'collections' =>
            $product->collections
                ->map(
                    fn($collection) => [
                        'id' =>
                        $collection->id,

                        'title' =>
                        $collection->title,

                        'slug' =>
                        $collection->slug,
                    ]
                )
                ->values(),

            'options' =>
            $product->options,

            'variants' =>
            $activeVariants->map(
                fn(
                    ProductVariant $variant
                ) => [
                    'id' =>
                    $variant->id,

                    'title' =>
                    $variant->title,

                    'price' =>
                    (float) (
                        $variant->price ??
                        $product->price ??
                        0
                    ),

                    'compare_at_price' =>
                    $variant->compare_at_price !== null
                        ? (float) $variant
                            ->compare_at_price
                        : null,

                    'quantity' =>
                    (int) $variant->quantity,

                    'is_active' =>
                    (bool) $variant->is_active,

                    'image_url' =>
                    $variant->media
                        ? asset(
                            $variant
                                ->media
                                ->file_path
                        )
                        : null,

                    'option_values' =>
                    $variant->optionValues,
                ]
            )
                ->values(),
        ];
    }

    private function arrayInput(
        mixed $value
    ): array {
        if (is_array($value)) {
            return array_values(
                array_filter(
                    $value,
                    fn($item) =>
                    $item !== null &&
                        $item !== ''
                )
            );
        }

        if (
            $value === null ||
            $value === ''
        ) {
            return [];
        }

        return array_values(
            array_filter(
                array_map(
                    'trim',
                    explode(
                        ',',
                        (string) $value
                    )
                )
            )
        );
    }

    private function locationLabel(
        InventoryLocation $location
    ): string {
        $parts = array_filter([
            $location->name,
            $location->city,
            $location->state,
        ]);

        return implode(
            ', ',
            array_unique($parts)
        );
    }



    private function applyBrandFilter(
        Builder $query,
        Request $request
    ): void {
        $brands = $this->arrayInput(
            $request->input('brand')
        );

        if (empty($brands)) {
            return;
        }

        $query->whereHas(
            'brand',
            function (
                Builder $brandQuery
            ) use ($brands) {
                $brandQuery
                    ->where('status', 'active')
                    ->where(
                        'approval_status',
                        'approved'
                    )
                    ->whereIn(
                        'slug',
                        $brands
                    );
            }
        );
    }
}
