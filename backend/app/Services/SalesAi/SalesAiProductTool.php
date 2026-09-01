<?php

namespace App\Services\SalesAi;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class SalesAiProductTool
{
    public function definitions(): array
    {
        return [
            [
                'type' => 'function',
                'function' => [
                    'name' => 'search_products',
                    'description' =>
                        'Search the live store product catalog using text, category, brand, collection, price, stock, sale, featured, or preorder filters.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'search' => [
                                'type' => 'string',
                                'description' =>
                                    'Product title, keyword, type, tag, SKU, or description.',
                            ],
                            'category' => [
                                'type' => 'string',
                                'description' =>
                                    'Category name or slug.',
                            ],
                            'brand' => [
                                'type' => 'string',
                                'description' =>
                                    'Brand name or slug.',
                            ],
                            'collection' => [
                                'type' => 'string',
                                'description' =>
                                    'Collection title or slug.',
                            ],
                            'min_price' => [
                                'type' => 'number',
                                'minimum' => 0,
                            ],
                            'max_price' => [
                                'type' => 'number',
                                'minimum' => 0,
                            ],
                            'in_stock' => [
                                'type' => 'boolean',
                            ],
                            'on_sale' => [
                                'type' => 'boolean',
                            ],
                            'featured' => [
                                'type' => 'boolean',
                            ],
                            'preorder' => [
                                'type' => 'boolean',
                            ],
                            'sort' => [
                                'type' => 'string',
                                'enum' => [
                                    'relevance',
                                    'newest',
                                    'price_asc',
                                    'price_desc',
                                    'title_asc',
                                    'title_desc',
                                ],
                            ],
                            'limit' => [
                                'type' => 'integer',
                                'minimum' => 1,
                                'maximum' => 12,
                            ],
                        ],
                    ],
                ],
            ],

            [
                'type' => 'function',
                'function' => [
                    'name' => 'get_product_details',
                    'description' =>
                        'Get complete live information about one product, including variants, options, stock, price, specifications, brand, category, collections, and reviews.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'product_id' => [
                                'type' => 'integer',
                            ],
                            'slug' => [
                                'type' => 'string',
                            ],
                        ],
                    ],
                ],
            ],

            [
                'type' => 'function',
                'function' => [
                    'name' => 'compare_products',
                    'description' =>
                        'Compare two to four live products using product IDs or slugs.',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => [
                            'product_ids' => [
                                'type' => 'array',
                                'items' => [
                                    'type' => 'integer',
                                ],
                                'maxItems' => 4,
                            ],
                            'slugs' => [
                                'type' => 'array',
                                'items' => [
                                    'type' => 'string',
                                ],
                                'maxItems' => 4,
                            ],
                        ],
                    ],
                ],
            ],
        ];
    }

    public function execute(
        string $toolName,
        array $arguments
    ): array {
        return match ($toolName) {
            'search_products' =>
                $this->searchProducts(
                    $arguments
                ),

            'get_product_details' =>
                $this->getProductDetails(
                    $arguments
                ),

            'compare_products' =>
                $this->compareProducts(
                    $arguments
                ),

            default => [
                'success' => false,
                'message' =>
                    'Unsupported product tool.',
                'tool' => $toolName,
            ],
        };
    }

    public function searchProducts(
        array $filters = []
    ): array {
        $limit = min(
            12,
            max(
                1,
                (int) (
                    $filters['limit'] ?? 6
                )
            )
        );

        $query = $this->baseProductQuery();

        $this->applySearchFilter(
            $query,
            $filters['search'] ?? null
        );

        $this->applyCategoryFilter(
            $query,
            $filters['category'] ?? null
        );

        $this->applyBrandFilter(
            $query,
            $filters['brand'] ?? null
        );

        $this->applyCollectionFilter(
            $query,
            $filters['collection'] ?? null
        );

        $this->applyPriceFilter(
            $query,
            $filters
        );

        if (
            filter_var(
                $filters['in_stock'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            )
        ) {
            $this->applyStockFilter(
                $query
            );
        }

        if (
            filter_var(
                $filters['on_sale'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            )
        ) {
            $query->onSale();
        }

        if (
            filter_var(
                $filters['featured'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            )
        ) {
            $query->featured();
        }

        if (
            filter_var(
                $filters['preorder'] ?? false,
                FILTER_VALIDATE_BOOLEAN
            )
        ) {
            $query->where(
                'preorder_enabled',
                true
            );
        }

        $this->applySorting(
            $query,
            $filters['sort'] ?? 'relevance'
        );

        $products = $query
            ->limit($limit)
            ->get();

        return [
            'success' => true,
            'content_type' => 'products',
            'count' => $products->count(),
            'filters' => $this->cleanFilters(
                $filters
            ),
            'products' => $products
                ->map(
                    fn (Product $product) =>
                        $this->formatProductCard(
                            $product
                        )
                )
                ->values()
                ->all(),
        ];
    }

    public function getProductDetails(
        array $arguments
    ): array {
        $productId = isset(
            $arguments['product_id']
        )
            ? (int) $arguments['product_id']
            : null;

        $slug = trim(
            (string) (
                $arguments['slug'] ?? ''
            )
        );

        if (!$productId && !$slug) {
            return [
                'success' => false,
                'message' =>
                    'A product ID or slug is required.',
            ];
        }

        $query = $this->baseProductQuery();

        if ($productId) {
            $query->where(
                'id',
                $productId
            );
        } else {
            $query->where(
                'slug',
                $slug
            );
        }

        $product = $query->first();

        if (!$product) {
            return [
                'success' => false,
                'message' =>
                    'Product not found or unavailable.',
            ];
        }

        return [
            'success' => true,
            'content_type' =>
                'product_details',
            'product' =>
                $this->formatProductDetails(
                    $product
                ),
        ];
    }

    public function compareProducts(
        array $arguments
    ): array {
        $productIds = collect(
            $arguments['product_ids'] ?? []
        )
            ->map(fn ($id) => (int) $id)
            ->filter()
            ->unique()
            ->take(4)
            ->values();

        $slugs = collect(
            $arguments['slugs'] ?? []
        )
            ->map(
                fn ($slug) =>
                    trim((string) $slug)
            )
            ->filter()
            ->unique()
            ->take(4)
            ->values();

        if (
            $productIds->isEmpty() &&
            $slugs->isEmpty()
        ) {
            return [
                'success' => false,
                'message' =>
                    'At least one product ID or slug is required.',
            ];
        }

        $products = $this
            ->baseProductQuery()
            ->where(function (
                Builder $query
            ) use (
                $productIds,
                $slugs
            ) {
                if (
                    $productIds->isNotEmpty()
                ) {
                    $query->whereIn(
                        'id',
                        $productIds
                    );
                }

                if ($slugs->isNotEmpty()) {
                    if (
                        $productIds->isNotEmpty()
                    ) {
                        $query->orWhereIn(
                            'slug',
                            $slugs
                        );
                    } else {
                        $query->whereIn(
                            'slug',
                            $slugs
                        );
                    }
                }
            })
            ->get()
            ->take(4);

        if ($products->isEmpty()) {
            return [
                'success' => false,
                'message' =>
                    'No available products were found for comparison.',
            ];
        }

        return [
            'success' => true,
            'content_type' =>
                'product_comparison',
            'count' => $products->count(),
            'products' => $products
                ->map(
                    fn (Product $product) =>
                        $this->formatComparisonProduct(
                            $product
                        )
                )
                ->values()
                ->all(),
        ];
    }

    private function baseProductQuery(): Builder
    {
        return Product::query()
            ->active()
            ->onlineStore()
            ->with([
                'store',
                'category',
                'brand',
                'collections',
                'media',
                'inventoryLevels',
                'options.values',
                'variants' => function (
                    $query
                ) {
                    $query
                        ->where(
                            'is_active',
                            true
                        )
                        ->with([
                            'media',
                            'inventoryLevels',
                            'optionValues.option',
                        ]);
                },
            ])
            ->withAvg(
                [
                    'reviews as reviews_avg_rating' =>
                        function ($query) {
                            $query->where(
                                'status',
                                'approved'
                            );
                        },
                ],
                'rating'
            )
            ->withCount([
                'reviews as approved_reviews_count' =>
                    function ($query) {
                        $query->where(
                            'status',
                            'approved'
                        );
                    },
            ]);
    }

    
   private function applySearchFilter(
    Builder $query,
    mixed $search
): void {
    $search = mb_strtolower(
        trim((string) $search)
    );

    if ($search === '') {
        return;
    }

    $search = str_replace(
        [
            '-',
            '_',
            '/',
            '\\',
            ',',
            '.',
            '(',
            ')',
            '[',
            ']',
        ],
        ' ',
        $search
    );

    $search = preg_replace(
        '/[^\p{L}\p{N}\s]/u',
        ' ',
        $search
    );

    $search = preg_replace(
        '/\s+/u',
        ' ',
        $search
    );

    $rawTokens = preg_split(
        '/\s+/u',
        trim($search)
    );

    $stopWords = [
        'a',
        'an',
        'the',
        'any',
        'some',
        'of',
        'for',
        'to',
        'in',
        'on',
        'at',
        'with',
        'and',
        'or',
        'is',
        'are',
        'do',
        'does',
        'have',
        'has',
        'show',
        'find',
        'need',
        'want',
        'please',
        'current',
        'website',
        'store',
        'available',
        'product',
        'products',
        'item',
        'items',
        'একটা',
        'কিছু',
        'আমাকে',
        'দেখাও',
        'খুঁজে',
        'দাও',
        'আছে',
        'পণ্য',
        'প্রোডাক্ট',
    ];

    $tokens = collect($rawTokens)
        ->map(
            fn ($token) =>
                trim((string) $token)
        )
        ->filter(
            fn ($token) =>
                $token !== '' &&
                mb_strlen($token) > 1 &&
                !in_array(
                    $token,
                    $stopWords,
                    true
                )
        )
        ->unique()
        ->take(6)
        ->values();

    if ($tokens->isEmpty()) {
        return;
    }

    /*
     * Specific model keyword থাকলে generic
     * device words search থেকে বাদ যাবে।
     *
     * "galaxy mobile phone" => "galaxy"
     */
    $genericProductWords = [
        'mobile',
        'phone',
        'smartphone',
        'device',
    ];

    $specificTokens = $tokens
        ->reject(
            fn ($token) =>
                in_array(
                    $token,
                    $genericProductWords,
                    true
                )
        )
        ->values();

    if ($specificTokens->isNotEmpty()) {
        $tokens = $specificTokens;
    }

    foreach ($tokens as $token) {
        $alternatives =
            $this->getSearchAlternatives(
                $token
            );

        /*
         * প্রতিটি token অবশ্যই match করবে।
         * তবে token-এর synonyms-এর মধ্যে
         * যেকোনো একটি match করলেই হবে।
         */
        $query->where(function (
            Builder $tokenQuery
        ) use ($alternatives) {
            foreach (
                $alternatives as $index => $term
            ) {
                $method = $index === 0
                    ? 'where'
                    : 'orWhere';

                $tokenQuery->{$method}(
                    function (
                        Builder $termQuery
                    ) use ($term) {
                        $this->applySearchTerm(
                            $termQuery,
                            $term
                        );
                    }
                );
            }
        });
    }
}

private function applySearchTerm(
    Builder $query,
    string $term
): void {
    $term = trim($term);

    if ($term === '') {
        return;
    }

    $likeTerm = '%' . $term . '%';

    $query
        ->where(
            'title',
            'like',
            $likeTerm
        )
        ->orWhere(
            'summary',
            'like',
            $likeTerm
        )
        ->orWhere(
            'description',
            'like',
            $likeTerm
        )
        ->orWhere(
            'type',
            'like',
            $likeTerm
        )
        ->orWhere(
            'sku',
            'like',
            $likeTerm
        )
        ->orWhere(
            'tags',
            'like',
            $likeTerm
        )
        ->orWhereHas(
            'category',
            function (
                Builder $categoryQuery
            ) use ($likeTerm) {
                $categoryQuery
                    ->where(
                        'name',
                        'like',
                        $likeTerm
                    )
                    ->orWhere(
                        'slug',
                        'like',
                        $likeTerm
                    );
            }
        )
        ->orWhereHas(
            'brand',
            function (
                Builder $brandQuery
            ) use ($likeTerm) {
                $brandQuery
                    ->where(
                        'name',
                        'like',
                        $likeTerm
                    )
                    ->orWhere(
                        'slug',
                        'like',
                        $likeTerm
                    );
            }
        )
        ->orWhereHas(
            'collections',
            function (
                Builder $collectionQuery
            ) use ($likeTerm) {
                $collectionQuery
                    ->where(
                        'collections.title',
                        'like',
                        $likeTerm
                    )
                    ->orWhere(
                        'collections.slug',
                        'like',
                        $likeTerm
                    );
            }
        )
        ->orWhereHas(
            'variants',
            function (
                Builder $variantQuery
            ) use ($likeTerm) {
                $variantQuery
                    ->where(
                        'title',
                        'like',
                        $likeTerm
                    )
                    ->orWhere(
                        'sku',
                        'like',
                        $likeTerm
                    );
            }
        )
        ->orWhereHas(
            'options.values',
            function (
                Builder $valueQuery
            ) use ($likeTerm) {
                $valueQuery->where(
                    'value',
                    'like',
                    $likeTerm
                );
            }
        );
}

private function getSearchAlternatives(
    string $token
): array {
    $synonyms = [
        'mobile' => [
            'mobile',
            'phone',
            'smartphone',
        ],

        'phone' => [
            'phone',
            'mobile',
            'smartphone',
        ],

        'smartphone' => [
            'smartphone',
            'mobile',
            'phone',
        ],

        'laptop' => [
            'laptop',
            'notebook',
        ],

        'notebook' => [
            'notebook',
            'laptop',
        ],

        'tv' => [
            'tv',
            'television',
        ],

        'television' => [
            'television',
            'tv',
        ],

        'headphone' => [
            'headphone',
            'headphones',
            'headset',
        ],

        'headphones' => [
            'headphones',
            'headphone',
            'headset',
        ],

        'earphone' => [
            'earphone',
            'earphones',
            'earbuds',
        ],

        'earbuds' => [
            'earbuds',
            'earphone',
            'earphones',
        ],

        'camera' => [
            'camera',
            'cameras',
        ],

        'watch' => [
            'watch',
            'smartwatch',
            'smart watch',
        ],

        'মোবাইল' => [
            'মোবাইল',
            'phone',
            'mobile',
            'smartphone',
        ],

        'ফোন' => [
            'ফোন',
            'phone',
            'mobile',
            'smartphone',
        ],

        'ল্যাপটপ' => [
            'ল্যাপটপ',
            'laptop',
            'notebook',
        ],

        'ক্যামেরা' => [
            'ক্যামেরা',
            'camera',
            'cameras',
        ],

        'হেডফোন' => [
            'হেডফোন',
            'headphone',
            'headphones',
            'headset',
        ],

        'ঘড়ি' => [
            'ঘড়ি',
            'watch',
            'smartwatch',
        ],
    ];

    return $synonyms[$token]
        ?? [$token];
}




    private function applyCategoryFilter(
        Builder $query,
        mixed $category
    ): void {
        $category = trim(
            (string) $category
        );

        if ($category === '') {
            return;
        }

        $query->whereHas(
            'category',
            function (
                Builder $categoryQuery
            ) use ($category) {
                $categoryQuery->where(
                    function (
                        Builder $builder
                    ) use ($category) {
                        $builder
                            ->where(
                                'slug',
                                $category
                            )
                            ->orWhere(
                                'name',
                                'like',
                                "%{$category}%"
                            );
                    }
                );
            }
        );
    }

    private function applyBrandFilter(
        Builder $query,
        mixed $brand
    ): void {
        $brand = trim(
            (string) $brand
        );

        if ($brand === '') {
            return;
        }

        $query->whereHas(
            'brand',
            function (
                Builder $brandQuery
            ) use ($brand) {
                $brandQuery->where(
                    function (
                        Builder $builder
                    ) use ($brand) {
                        $builder
                            ->where(
                                'slug',
                                $brand
                            )
                            ->orWhere(
                                'name',
                                'like',
                                "%{$brand}%"
                            );
                    }
                );
            }
        );
    }

    private function applyCollectionFilter(
        Builder $query,
        mixed $collection
    ): void {
        $collection = trim(
            (string) $collection
        );

        if ($collection === '') {
            return;
        }

        $query->whereHas(
            'collections',
            function (
                Builder $collectionQuery
            ) use ($collection) {
                $collectionQuery->where(
                    function (
                        Builder $builder
                    ) use ($collection) {
                        $builder
                            ->where(
                                'collections.slug',
                                $collection
                            )
                            ->orWhere(
                                'collections.title',
                                'like',
                                "%{$collection}%"
                            );
                    }
                );
            }
        );
    }

    private function applyPriceFilter(
        Builder $query,
        array $filters
    ): void {
        $hasMinimum =
            isset($filters['min_price']) &&
            is_numeric(
                $filters['min_price']
            );

        $hasMaximum =
            isset($filters['max_price']) &&
            is_numeric(
                $filters['max_price']
            );

        if (!$hasMinimum && !$hasMaximum) {
            return;
        }

        $minimum = $hasMinimum
            ? max(
                0,
                (float) $filters['min_price']
            )
            : null;

        $maximum = $hasMaximum
            ? max(
                0,
                (float) $filters['max_price']
            )
            : null;

        $query->where(function (
            Builder $builder
        ) use (
            $minimum,
            $maximum
        ) {
            $builder->where(function (
                Builder $productPriceQuery
            ) use (
                $minimum,
                $maximum
            ) {
                if ($minimum !== null) {
                    $productPriceQuery
                        ->where(
                            'price',
                            '>=',
                            $minimum
                        );
                }

                if ($maximum !== null) {
                    $productPriceQuery
                        ->where(
                            'price',
                            '<=',
                            $maximum
                        );
                }
            });

            $builder->orWhereHas(
                'variants',
                function (
                    Builder $variantQuery
                ) use (
                    $minimum,
                    $maximum
                ) {
                    $variantQuery->where(
                        'is_active',
                        true
                    );

                    if ($minimum !== null) {
                        $variantQuery->where(
                            'price',
                            '>=',
                            $minimum
                        );
                    }

                    if ($maximum !== null) {
                        $variantQuery->where(
                            'price',
                            '<=',
                            $maximum
                        );
                    }
                }
            );
        });
    }

    private function applyStockFilter(
        Builder $query
    ): void {
        $query->where(function (
            Builder $builder
        ) {
            $builder
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
                    'inventoryLevels',
                    function (
                        Builder $inventoryQuery
                    ) {
                        $inventoryQuery->whereRaw(
                            '(on_hand - committed - unavailable) > 0'
                        );
                    }
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
                            ->where(function (
                                Builder $stockQuery
                            ) {
                                $stockQuery
                                    ->where(
                                        'quantity',
                                        '>',
                                        0
                                    )
                                    ->orWhereHas(
                                        'inventoryLevels',
                                        function (
                                            Builder $inventoryQuery
                                        ) {
                                            $inventoryQuery
                                                ->whereRaw(
                                                    '(on_hand - committed - unavailable) > 0'
                                                );
                                        }
                                    );
                            });
                    }
                );
        });
    }

    private function applySorting(
        Builder $query,
        string $sort
    ): void {
        match ($sort) {
            'newest' =>
                $query->latest('id'),

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
                $query->orderBy(
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

            default =>
                $query
                    ->orderByDesc(
                        'is_featured'
                    )
                    ->latest('id'),
        };
    }

    private function formatProductCard(
        Product $product
    ): array {
        $stock = $this->resolveProductStock(
            $product
        );

        $price = $this->resolveStartingPrice(
            $product
        );

        $compareAtPrice =
            $this->resolveCompareAtPrice(
                $product,
                $price
            );

        return [
            'id' => $product->id,
            'title' => $product->title,
            'slug' => $product->slug,
            'summary' => $this->cleanText(
                $product->summary,
                180
            ),
            'type' => $product->type,
            'brand' => $product->brand
                ? [
                    'id' =>
                        $product->brand->id,
                    'name' =>
                        $product->brand->name,
                    'slug' =>
                        $product->brand->slug,
                ]
                : null,
            'category' => $product->category
                ? [
                    'id' =>
                        $product->category->id,
                    'name' =>
                        $product->category->name,
                    'slug' =>
                        $product->category->slug,
                ]
                : null,
            'image_url' =>
                $this->resolveProductImage(
                    $product
                ),
            'price' => $price,
            'compare_at_price' =>
                $compareAtPrice,
            'discount_percentage' =>
                $this->discountPercentage(
                    $price,
                    $compareAtPrice
                ),
            'in_stock' => $stock['in_stock'],
            'available_quantity' =>
                $stock['available_quantity'],
            'stock_type' =>
                $stock['stock_type'],
            'has_variants' =>
                $product->variants->isNotEmpty(),
            'variant_count' =>
                $product->variants->count(),
            'preorder_enabled' =>
                (bool) $product
                    ->preorder_enabled,
            'is_featured' =>
                (bool) $product->is_featured,
            'rating' => round(
                (float) (
                    $product
                        ->reviews_avg_rating ?? 0
                ),
                1
            ),
            'reviews_count' =>
                (int) (
                    $product
                        ->approved_reviews_count ?? 0
                ),
            'product_url' =>
                '/products/' . $product->slug,
            'cart_payload' =>
                $product->variants->isEmpty()
                    ? $this->makeCartPayload(
                        $product,
                        null,
                        $price,
                        $compareAtPrice,
                        $stock
                    )
                    : null,
        ];
    }

    private function formatProductDetails(
        Product $product
    ): array {
        $card = $this->formatProductCard(
            $product
        );

        return array_merge(
            $card,
            [
                'description' =>
                    $this->cleanText(
                        $product->description,
                        3000
                    ),

                'specifications' =>
                    $this->cleanText(
                        $product->specifications,
                        4000
                    ),

                'tags' =>
                    $product->tags ?: [],

                'sku' => $product->sku,

                'product_format' =>
                    $product
                        ->product_format,

                'weight' =>
                    $product->weight,

                'weight_unit' =>
                    $product->weight_unit,

                'country_of_origin' =>
                    $product
                        ->country_of_origin,

                'collections' =>
                    $product->collections
                        ->map(
                            fn ($collection) => [
                                'id' =>
                                    $collection->id,
                                'title' =>
                                    $collection->title,
                                'slug' =>
                                    $collection->slug,
                            ]
                        )
                        ->values()
                        ->all(),

                'images' =>
                    $product->media
                        ->map(
                            fn ($media) => [
                                'id' =>
                                    $media->id,
                                'url' =>
                                    $media->url,
                                'alt_text' =>
                                    $media->alt_text,
                                'is_cover' =>
                                    (bool) $media
                                        ->is_cover,
                            ]
                        )
                        ->values()
                        ->all(),

                'options' =>
                    $product->options
                        ->map(
                            fn ($option) => [
                                'id' =>
                                    $option->id,
                                'name' =>
                                    $option->name,
                                'values' =>
                                    $option->values
                                        ->map(
                                            fn ($value) => [
                                                'id' =>
                                                    $value
                                                        ->id,
                                                'value' =>
                                                    $value
                                                        ->value,
                                                'color_code' =>
                                                    $value
                                                        ->color_code,
                                            ]
                                        )
                                        ->values()
                                        ->all(),
                            ]
                        )
                        ->values()
                        ->all(),

                'variants' =>
                    $product->variants
                        ->map(
                            fn ($variant) =>
                                $this
                                    ->formatVariant(
                                        $product,
                                        $variant
                                    )
                        )
                        ->values()
                        ->all(),
            ]
        );
    }

    private function formatComparisonProduct(
        Product $product
    ): array {
        $details =
            $this->formatProductDetails(
                $product
            );

        return [
            'id' => $details['id'],
            'title' => $details['title'],
            'slug' => $details['slug'],
            'image_url' =>
                $details['image_url'],
            'brand' => $details['brand'],
            'category' =>
                $details['category'],
            'price' => $details['price'],
            'compare_at_price' =>
                $details['compare_at_price'],
            'discount_percentage' =>
                $details[
                    'discount_percentage'
                ],
            'in_stock' =>
                $details['in_stock'],
            'available_quantity' =>
                $details[
                    'available_quantity'
                ],
            'preorder_enabled' =>
                $details[
                    'preorder_enabled'
                ],
            'rating' =>
                $details['rating'],
            'reviews_count' =>
                $details['reviews_count'],
            'summary' =>
                $details['summary'],
            'specifications' =>
                $details['specifications'],
            'options' =>
                $details['options'],
            'variants' =>
                $details['variants'],
            'product_url' =>
                $details['product_url'],
        ];
    }

    private function formatVariant(
        Product $product,
        $variant
    ): array {
        $stock = $this->resolveVariantStock(
            $product,
            $variant
        );

        $price = (float) (
            $variant->price
            ?? $product->price
            ?? 0
        );

        $compareAtPrice = (float) (
            $variant->compare_at_price
            ?? $product->compare_at_price
            ?? 0
        );

        return [
            'id' => $variant->id,
            'title' => $variant->title,
            'sku' => $variant->sku,
            'price' => $price,
            'compare_at_price' =>
                $compareAtPrice,
            'discount_percentage' =>
                $this->discountPercentage(
                    $price,
                    $compareAtPrice
                ),
            'image_url' =>
                $variant->media?->url
                ?: $this->resolveProductImage(
                    $product
                ),
            'in_stock' =>
                $stock['in_stock'],
            'available_quantity' =>
                $stock[
                    'available_quantity'
                ],
            'options' =>
                $variant->optionValues
                    ->map(
                        fn ($value) => [
                            'name' =>
                                $value->option
                                    ?->name,
                            'value' =>
                                $value->value,
                            'color_code' =>
                                $value
                                    ->color_code,
                        ]
                    )
                    ->filter(
                        fn ($value) =>
                            !empty(
                                $value['name']
                            )
                    )
                    ->values()
                    ->all(),
            'cart_payload' =>
                $this->makeCartPayload(
                    $product,
                    $variant,
                    $price,
                    $compareAtPrice,
                    $stock
                ),
        ];
    }

    private function resolveProductStock(
        Product $product
    ): array {
        if (!$product->track_quantity) {
            return [
                'in_stock' => true,
                'available_quantity' => null,
                'stock_type' => 'unlimited',
            ];
        }

        if (
            $product
                ->continue_selling_when_out_of_stock
        ) {
            return [
                'in_stock' => true,
                'available_quantity' =>
                    $this->inventoryAvailable(
                        $product->inventoryLevels,
                        (int) $product->quantity
                    ),
                'stock_type' =>
                    'continue_selling',
            ];
        }

        if ($product->variants->isNotEmpty()) {
            $available = $product->variants
                ->sum(function ($variant) use (
                    $product
                ) {
                    $stock =
                        $this->resolveVariantStock(
                            $product,
                            $variant
                        );

                    return (int) (
                        $stock[
                            'available_quantity'
                        ] ?? 0
                    );
                });

            return [
                'in_stock' => $available > 0,
                'available_quantity' =>
                    $available,
                'stock_type' => 'variant',
            ];
        }

        $available =
            $this->inventoryAvailable(
                $product->inventoryLevels,
                (int) $product->quantity
            );

        return [
            'in_stock' => $available > 0,
            'available_quantity' =>
                $available,
            'stock_type' => 'product',
        ];
    }

    private function resolveVariantStock(
        Product $product,
        $variant
    ): array {
        if (!$product->track_quantity) {
            return [
                'in_stock' => true,
                'available_quantity' => null,
                'stock_type' => 'unlimited',
            ];
        }

        $available =
            $this->inventoryAvailable(
                $variant->inventoryLevels,
                (int) $variant->quantity
            );

        return [
            'in_stock' =>
                $available > 0 ||
                (bool) $product
                    ->continue_selling_when_out_of_stock,

            'available_quantity' =>
                $available,

            'stock_type' => 'variant',
        ];
    }

    private function inventoryAvailable(
        Collection $levels,
        int $fallback
    ): int {
        if ($levels->isEmpty()) {
            return max(
                0,
                $fallback
            );
        }

        return max(
            0,
            (int) $levels->sum(
                fn ($level) =>
                    $level->available
            )
        );
    }

    private function resolveStartingPrice(
        Product $product
    ): float {
        $prices = $product->variants
            ->pluck('price')
            ->filter(
                fn ($price) =>
                    $price !== null
            )
            ->map(
                fn ($price) =>
                    (float) $price
            );

        if ($prices->isNotEmpty()) {
            return (float) $prices->min();
        }

        return (float) (
            $product->price ?? 0
        );
    }

    private function resolveCompareAtPrice(
        Product $product,
        float $price
    ): float {
        $variant = $product->variants
            ->filter(
                fn ($variant) =>
                    (float) $variant->price ===
                    $price
            )
            ->first();

        if ($variant) {
            return (float) (
                $variant->compare_at_price
                ?? 0
            );
        }

        return (float) (
            $product->compare_at_price ?? 0
        );
    }

    private function resolveProductImage(
        Product $product
    ): ?string {
        $cover = $product->media
            ->firstWhere(
                'is_cover',
                true
            );

        $media = $cover
            ?: $product->media->first();

        return $media?->url;
    }

    private function makeCartPayload(
        Product $product,
        $variant,
        float $price,
        float $compareAtPrice,
        array $stock
    ): array {
        return [
            'product_id' => $product->id,
            'variant_id' =>
                $variant?->id,
            'title' => $product->title,
            'slug' => $product->slug,
            'image_url' =>
                $variant?->media?->url
                ?: $this->resolveProductImage(
                    $product
                ),
            'price' => $price,
            'compare_at_price' =>
                $compareAtPrice,
            'quantity' => 1,
            'available_quantity' =>
                $stock[
                    'available_quantity'
                ],
            'in_stock' =>
                $stock['in_stock'],
            'options' => $variant
                ? $variant->optionValues
                    ->map(
                        fn ($value) => [
                            'name' =>
                                $value->option
                                    ?->name,
                            'value' =>
                                $value->value,
                            'color_code' =>
                                $value
                                    ->color_code,
                        ]
                    )
                    ->filter(
                        fn ($value) =>
                            !empty(
                                $value['name']
                            )
                    )
                    ->values()
                    ->all()
                : [],
        ];
    }

    private function discountPercentage(
        float $price,
        float $compareAtPrice
    ): int {
        if (
            $price <= 0 ||
            $compareAtPrice <= $price
        ) {
            return 0;
        }

        return (int) round(
            (
                ($compareAtPrice - $price)
                / $compareAtPrice
            ) * 100
        );
    }

    private function cleanText(
        mixed $value,
        int $limit
    ): ?string {
        if ($value === null) {
            return null;
        }

        $text = trim(
            preg_replace(
                '/\s+/',
                ' ',
                strip_tags(
                    (string) $value
                )
            )
        );

        if ($text === '') {
            return null;
        }

        return Str::limit(
            $text,
            $limit
        );
    }

    private function cleanFilters(
        array $filters
    ): array {
        return collect($filters)
            ->reject(
                fn ($value) =>
                    $value === null ||
                    $value === ''
            )
            ->all();
    }
}