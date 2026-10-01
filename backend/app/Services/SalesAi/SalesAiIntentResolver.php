<?php

namespace App\Services\SalesAi;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Collection;

class SalesAiIntentResolver
{
    public function resolve(
        string $message,
        array $pageContext = [],
        array $shoppingContext = []
    ): array {
        $originalMessage = trim($message);

        $normalizedMessage = $this->normalize(
            $originalMessage
        );

        $controlIntent = $this->detectControlIntent(
            $normalizedMessage
        );

        if ($controlIntent) {
            return $this->makeResult(
                intent: $controlIntent,
                originalMessage: $originalMessage,
                normalizedMessage: $normalizedMessage,
                pageContext: $pageContext,
                shoppingContext: $shoppingContext,
                confidence: 1,
                executeDirectly: true
            );
        }

        $brand = $this->detectBrand(
            $normalizedMessage
        );

        $category = $this->detectCategory(
            $normalizedMessage
        );

        $collection = $this->detectCollection(
            $normalizedMessage
        );

        $priceFilters = $this->extractPriceFilters(
            $normalizedMessage
        );

        $flags = $this->detectFlags(
            $normalizedMessage
        );

        $sort = $this->detectSort(
            $normalizedMessage
        );

        $pageProduct = $this->getCurrentProductContext(
            $pageContext
        );

        $savedProduct = $this->getSavedProductContext(
            $shoppingContext
        );

        $currentProduct = $pageProduct
            ?: $savedProduct;

        $search = $this->buildSearchQuery(
            $normalizedMessage,
            [
                $brand['name'] ?? null,
                $brand['slug'] ?? null,
                $category['name'] ?? null,
                $category['slug'] ?? null,
                $collection['title'] ?? null,
                $collection['slug'] ?? null,
            ]
        );

        $previousFilters = $this->getPreviousFilters(
            $shoppingContext
        );

        $contextMode = $this->determineContextMode(
            message: $normalizedMessage,
            search: $search,
            brand: $brand,
            category: $category,
            collection: $collection,
            priceFilters: $priceFilters,
            flags: $flags,
            sort: $sort,
            previousFilters: $previousFilters
        );

        $currentFilters = array_filter([
            'search' => $search ?: null,

            'brand' =>
                $brand['slug']
                ?? null,

            'category' =>
                $category['slug']
                ?? null,

            'collection' =>
                $collection['slug']
                ?? null,

            'min_price' =>
                $priceFilters['min_price'],

            'max_price' =>
                $priceFilters['max_price'],

            'in_stock' =>
                $flags['in_stock']
                    ? true
                    : null,

            'on_sale' =>
                $flags['on_sale']
                    ? true
                    : null,

            'featured' =>
                $flags['featured']
                    ? true
                    : null,

            'preorder' =>
                $flags['preorder']
                    ? true
                    : null,

            'sort' =>
                $sort,
        ], function ($value) {
            return $value !== null
                && $value !== ''
                && $value !== false;
        });

        $filters = $this->mergeFilters(
            previousFilters: $previousFilters,
            currentFilters: $currentFilters,
            contextMode: $contextMode
        );

        $intent = $this->detectIntent(
            message: $normalizedMessage,
            brand: $brand,
            category: $category,
            collection: $collection,
            priceFilters: $priceFilters,
            flags: $flags,
            currentProduct: $currentProduct,
            search: $search,
            shoppingContext: $shoppingContext
        );

        $comparisonProducts =
            $intent === 'compare_products'
                ? $this->extractComparisonProducts(
                    $normalizedMessage
                )
                : [];

        if (
            $intent === 'product_details'
            && $currentProduct
        ) {
            if (!empty($currentProduct['id'])) {
                $filters['product_id'] =
                    $currentProduct['id'];
            }

            if (!empty($currentProduct['slug'])) {
                $filters['product_slug'] =
                    $currentProduct['slug'];
            }
        }

        return [
            'intent' =>
                $intent,

            'original_message' =>
                $originalMessage,

            'normalized_message' =>
                $normalizedMessage,

            'search' =>
                $search,

            'brand' =>
                $brand,

            'category' =>
                $category,

            'collection' =>
                $collection,

            'filters' =>
                $filters,

            'current_filters' =>
                $currentFilters,

            'previous_filters' =>
                $previousFilters,

            'comparison_products' =>
                $comparisonProducts,

            'current_product' =>
                $currentProduct,

            'flags' =>
                $flags,

            'sort' =>
                $sort,

            'context_mode' =>
                $contextMode,

            'replace_context' =>
                $contextMode === 'replace',

            'confidence' =>
                $this->getConfidence(
                    $intent,
                    $filters,
                    $comparisonProducts,
                    $currentProduct
                ),

            'should_execute_directly' =>
                $this->shouldExecuteDirectly(
                    $intent
                ),
        ];
    }

private function determineContextMode(
    string $message,
    ?string $search,
    ?array $brand,
    ?array $category,
    ?array $collection,
    array $priceFilters,
    array $flags,
    ?string $sort,
    array $previousFilters
): string {
    if (empty($previousFilters)) {
        return 'new';
    }

    $previousSearch = trim(
        (string) (
            $previousFilters['search']
            ?? ''
        )
    );

    $hasConstraint =
        $priceFilters['min_price']
            !== null
        || $priceFilters['max_price']
            !== null
        || in_array(
            true,
            $flags,
            true
        )
        || $sort !== null;

    $hasTaxonomy =
        $brand !== null
        || $category !== null
        || $collection !== null;

    /*
    |--------------------------------------------------------------------------
    | "Only watch"
    |--------------------------------------------------------------------------
    |
    | Previous:
    | brand = apple
    | search = watch
    |
    | New:
    | Only watch
    |
    | Means:
    | remove old brand/category/budget,
    | keep just the requested subject.
    |
    */

    if (
        $search
        && $this->startsWithOnly(
            $message
        )
        && $this->searchesOverlap(
            $search,
            $previousSearch
        )
    ) {
        return 'subject_only';
    }

    /*
    |--------------------------------------------------------------------------
    | EXPLICIT NEW PRODUCT REQUEST
    |--------------------------------------------------------------------------
    |
    | These must start a NEW product search,
    | even if the sentence also contains:
    |
    | under $200
    | in stock
    | on sale
    |
    | Example:
    |
    | Previous: watch
    |
    | "Actually show me chair under $200"
    |
    | Must become:
    |
    | search = chair
    | max_price = 200
    |
    | NOT:
    |
    | search = watch chair
    |
    */

    if (
        $search
        && $this->isExplicitNewSearchRequest(
            $message
        )
        && !$this->searchesOverlap(
            $search,
            $previousSearch
        )
    ) {
        return 'replace';
    }

    /*
    |--------------------------------------------------------------------------
    | DIFFERENT PRODUCT SUBJECT
    |--------------------------------------------------------------------------
    |
    | Even without "show me":
    |
    | Previous:
    | watch
    |
    | New:
    | chair under $200
    |
    | Different search subject means the old
    | search should not survive.
    |
    */

    if (
        $search
        && $previousSearch !== ''
        && !$this->searchesOverlap(
            $search,
            $previousSearch
        )
        && !$this->isAttributeRefinement(
            $message
        )
    ) {
        return 'replace';
    }

    /*
    |--------------------------------------------------------------------------
    | "Only chair"
    |--------------------------------------------------------------------------
    |
    | Previous:
    | Furniture
    |
    | New:
    | Only chair
    |
    | This is a narrowing request.
    |
    */

    if (
        $search
        && $this->startsWithOnly(
            $message
        )
    ) {
        return 'refine';
    }

    /*
    |--------------------------------------------------------------------------
    | SAME PRODUCT + NEW REQUIREMENT
    |--------------------------------------------------------------------------
    |
    | Previous:
    | watch
    |
    | New:
    | watch under $300
    |
    | Keep subject, add constraint.
    |
    */

    if (
        $search
        && $previousSearch !== ''
        && $this->searchesOverlap(
            $search,
            $previousSearch
        )
    ) {
        return 'refine';
    }

    /*
    |--------------------------------------------------------------------------
    | ATTRIBUTE-ONLY REFINEMENT
    |--------------------------------------------------------------------------
    |
    | Previous:
    | chair
    |
    | New:
    | black only
    |
    | Previous:
    | phone
    |
    | New:
    | cheaper
    |
    */

    if (
        $search
        && $this->isAttributeRefinement(
            $message
        )
    ) {
        return 'refine';
    }

    /*
    |--------------------------------------------------------------------------
    | PURE CONSTRAINT
    |--------------------------------------------------------------------------
    |
    | under $300
    | in stock only
    | cheapest
    |
    | No new product subject exists.
    |
    */

    if (
        !$search
        && !$hasTaxonomy
        && $hasConstraint
    ) {
        return 'refine';
    }

    /*
    |--------------------------------------------------------------------------
    | BRAND/CATEGORY REFINEMENT
    |--------------------------------------------------------------------------
    |
    | Samsung only
    | Apple only
    |
    */

    if (
        $hasTaxonomy
        && $this->isExplicitRefinement(
            $message
        )
    ) {
        return 'refine';
    }

    /*
    |--------------------------------------------------------------------------
    | NEW BRAND/CATEGORY
    |--------------------------------------------------------------------------
    |
    | Samsung
    | Furniture
    | Accessories
    |
    | Without refinement wording,
    | this becomes a new target.
    |
    */

    if (
        !$search
        && $hasTaxonomy
    ) {
        return 'replace';
    }

    /*
    |--------------------------------------------------------------------------
    | MEANINGFUL SEARCH PHRASE
    |--------------------------------------------------------------------------
    */

    if ($search) {
        return 'replace';
    }

    /*
    |--------------------------------------------------------------------------
    | LAST FALLBACK
    |--------------------------------------------------------------------------
    */

    return 'refine';
}


private function isExplicitNewSearchRequest(
    string $message
): bool {
    return $this->containsAny(
        $message,
        [
            'show me',
            'find me',
            'find a',
            'find some',

            'i want',
            'i need',
            'i would like',

            'looking for',
            'searching for',

            'do you have',
            'have you any',

            'recommend',
            'suggest',

            'actually show me',
            'actually i want',
            'actually i need',

            'instead show me',
            'show me instead',

            'আমাকে দেখাও',
            'খুঁজে দাও',
            'আমি চাই',
            'আমার দরকার',
            'আসলে আমি চাই',
            'আসলে দেখাও',
        ]
    );
}

private function isAttributeRefinement(
    string $message
): bool {
    /*
     * These are modifiers rather than
     * strong new product subjects.
     */

    return $this->containsAny(
        $message,
        [
            'black only',
            'white only',
            'blue only',
            'red only',
            'green only',
            'silver only',
            'gold only',
            'grey only',
            'gray only',

            'cheaper',
            'cheapest',
            'more affordable',

            'more expensive',

            'in stock only',
            'only in stock',

            'on sale only',
            'only on sale',

            'featured only',
            'preorder only',

            'same color',
            'same brand',
            'same type',

            'কালো',
            'সাদা',
            'নীল',
            'লাল',

            'কম দামের',
            'কম দামে',

            'স্টকে আছে',
            'শুধু স্টকে',
        ]
    );
}

    private function isExplicitRefinement(
        string $message
    ): bool {
        return $this->containsAny(
            $message,
            [
                'only',
                'just',
                'same',
                'same one',
                'same type',
                'same product',
                'same products',

                'under',
                'below',
                'less than',
                'up to',
                'within',
                'maximum',
                'max',
                'budget',

                'over',
                'above',
                'more than',
                'minimum',
                'starting from',

                'in stock only',
                'only in stock',
                'available only',
                'only available',

                'on sale only',
                'sale only',
                'discounted only',

                'cheaper',
                'cheapest',
                'lower price',
                'more affordable',

                'more expensive',
                'expensive ones',

                'featured only',
                'preorder only',

                'শুধু',
                'একই',
                'এর মধ্যে',
                'টাকার মধ্যে',
                'নিচে',
                'কম',
                'কমপক্ষে',
                'এর বেশি',
                'উপরে',
                'স্টকে',
                'স্টক আছে',
                'কম দামে',
            ]
        );
    }

   private function mergeFilters(
    array $previousFilters,
    array $currentFilters,
    string $contextMode
): array {
    if (
        $contextMode === 'new'
        || $contextMode === 'replace'
        || $contextMode === 'subject_only'
    ) {
        return $this->sanitizeFilters(
            $currentFilters
        );
    }

    $filters = $this->sanitizeFilters(
        $previousFilters
    );

    foreach (
        $currentFilters
        as $key => $value
    ) {
        if (
            $key === 'search'
            && !empty(
                $filters['search']
            )
            && !empty($value)
        ) {
            $filters['search'] =
                $this->mergeSearchTerms(
                    (string) $filters['search'],
                    (string) $value
                );

            continue;
        }

        $filters[$key] = $value;
    }

    if (
        array_key_exists(
            'max_price',
            $currentFilters
        )
        && isset(
            $filters['min_price']
        )
        && (float) $filters['min_price']
            > (float) $filters['max_price']
    ) {
        unset(
            $filters['min_price']
        );
    }

    if (
        array_key_exists(
            'min_price',
            $currentFilters
        )
        && isset(
            $filters['max_price']
        )
        && (float) $filters['max_price']
            < (float) $filters['min_price']
    ) {
        unset(
            $filters['max_price']
        );
    }

    unset(
        $filters['product_id'],
        $filters['product_slug']
    );

    return $this->sanitizeFilters(
        $filters
    );
}

    private function mergeSearchTerms(
        string $previous,
        string $current
    ): string {
        $tokens = preg_split(
            '/\s+/u',
            trim(
                $previous
                . ' '
                . $current
            )
        );

        if (!$tokens) {
            return trim(
                $current
            );
        }

        $tokens = collect(
            $tokens
        )
            ->map(
                fn ($token) =>
                    trim(
                        mb_strtolower(
                            (string)
                            $token
                        )
                    )
            )
            ->filter(
                fn ($token) =>
                    $token !== ''
            )
            ->unique()
            ->take(8)
            ->values()
            ->all();

        return implode(
            ' ',
            $tokens
        );
    }


    private function startsWithOnly(
    string $message
): bool {
    return preg_match(
        '/^(?:only|just|শুধু)\s+/iu',
        trim($message)
    ) === 1;
}

private function searchesOverlap(
    ?string $currentSearch,
    ?string $previousSearch
): bool {
    $currentSearch = trim(
        mb_strtolower(
            (string) $currentSearch
        )
    );

    $previousSearch = trim(
        mb_strtolower(
            (string) $previousSearch
        )
    );

    if (
        $currentSearch === ''
        || $previousSearch === ''
    ) {
        return false;
    }

    $currentTokens = collect(
        preg_split(
            '/\s+/u',
            $currentSearch
        ) ?: []
    )
        ->filter()
        ->unique();

    $previousTokens = collect(
        preg_split(
            '/\s+/u',
            $previousSearch
        ) ?: []
    )
        ->filter()
        ->unique();

    return $currentTokens
        ->intersect(
            $previousTokens
        )
        ->isNotEmpty();
}

    private function detectControlIntent(
        string $message
    ): ?string {
        $compactMessage = trim(
            preg_replace(
                '/[.!?]+$/u',
                '',
                $message
            )
        );

        $stopCommands = [
            'stop',
            'cancel',
            'cancel request',
            'stop request',
            'never mind',
            'nevermind',

            'থামো',
            'বন্ধ করো',
            'স্টপ',
            'বাতিল',
            'বাদ দাও',
        ];

        if (
            in_array(
                $compactMessage,
                $stopCommands,
                true
            )
        ) {
            return 'stop';
        }

        $resetCommands = [
            'reset',
            'reset chat',
            'clear chat',
            'clear conversation',
            'clear context',
            'reset context',
            'new topic',
            'start over',
            'start again',

            'নতুন টপিক',
            'নতুন বিষয়',
            'চ্যাট রিসেট',
            'সব মুছে দাও',
            'আবার শুরু',
        ];

        if (
            in_array(
                $compactMessage,
                $resetCommands,
                true
            )
        ) {
            return 'reset_context';
        }

        return null;
    }

    private function detectIntent(
        string $message,
        ?array $brand,
        ?array $category,
        ?array $collection,
        array $priceFilters,
        array $flags,
        ?array $currentProduct,
        ?string $search,
        array $shoppingContext
    ): string {
        if (
            $this->containsAny(
                $message,
                [
                    'order status',
                    'track order',
                    'track my order',
                    'where is my order',
                    'check my order',
                    'order tracking',

                    'অর্ডার স্ট্যাটাস',
                    'অর্ডার ট্র্যাক',
                    'অর্ডার কোথায়',
                    'অর্ডার চেক',
                ]
            )
        ) {
            return 'order_status';
        }

        if (
            $this->containsAny(
                $message,
                [
                    'compare',
                    'comparison',
                    'versus',
                    ' vs ',
                    'which one is better',
                    'which is better',
                    'difference between',

                    'তুলনা',
                    'কোনটা ভালো',
                    'পার্থক্য',
                ]
            )
        ) {
            return 'compare_products';
        }

        if (
            $this->containsAny(
                $message,
                [
                    'add to cart',
                    'put in cart',
                    'add it',
                    'add this',
                    'add this one',
                    'buy this',
                    'buy it',

                    'কার্টে যোগ',
                    'কার্টে দাও',
                    'কিনতে চাই',
                ]
            )
        ) {
            return 'add_to_cart';
        }

        if (
            $this->containsAny(
                $message,
                [
                    'show my cart',
                    'view my cart',
                    'open cart',
                    'my cart',
                    'cart items',
                    'what is in my cart',

                    'কার্ট দেখাও',
                    'কার্টে কি আছে',
                ]
            )
        ) {
            return 'view_cart';
        }

        if (
            $currentProduct
            && $this->containsAny(
                $message,
                [
                    'this product',
                    'current product',
                    'this item',
                    'this one',
                    'tell me more',
                    'more details',
                    'its price',
                    'its stock',

                    'এই প্রোডাক্ট',
                    'এই পণ্য',
                    'এই জিনিস',
                    'এটার দাম',
                    'এটার স্টক',
                    'আরও বলো',
                ]
            )
        ) {
            return 'product_details';
        }

        if (
            $this->containsAny(
                $message,
                [
                    'product details',
                    'details of',
                    'tell me about',
                    'more information',
                    'specification',
                    'specifications',
                    'features',
                    'price of',
                    'stock of',
                    'is it available',

                    'বিস্তারিত',
                    'সম্পর্কে বলো',
                    'স্পেসিফিকেশন',
                    'ফিচার',
                    'দাম কত',
                    'স্টক আছে',
                ]
            )
        ) {
            return 'product_details';
        }

        if (
            $this->containsAny(
                $message,
                [
                    'contact',
                    'address',
                    'store location',
                    'opening hours',
                    'support hours',
                    'shipping policy',
                    'return policy',
                    'refund policy',
                    'payment method',
                    'delivery information',

                    'যোগাযোগ',
                    'ঠিকানা',
                    'দোকান কোথায়',
                    'খোলার সময়',
                    'রিটার্ন পলিসি',
                    'রিফান্ড',
                    'ডেলিভারি',
                    'পেমেন্ট',
                ]
            )
        ) {
            return 'store_information';
        }

        if ($this->isGreeting($message)) {
            return 'greeting';
        }

        if (
            $brand
            || $category
            || $collection
            || $priceFilters['min_price']
                !== null
            || $priceFilters['max_price']
                !== null
            || in_array(
                true,
                $flags,
                true
            )
        ) {
            return 'search_products';
        }

        if ($search) {
            return 'search_products';
        }

        if (
            $this->containsAny(
                $message,
                [
                    'product',
                    'products',
                    'item',
                    'items',

                    'phone',
                    'mobile',
                    'smartphone',
                    'laptop',
                    'camera',

                    'headphone',
                    'headphones',
                    'earphone',
                    'earphones',
                    'earbuds',

                    'watch',
                    'smartwatch',
                    'television',
                    'tv',

                    'chair',
                    'table',
                    'desk',
                    'sofa',
                    'furniture',

                    'available',
                    'in stock',

                    'sale',
                    'discount',
                    'deal',
                    'offer',

                    'find',
                    'show me',
                    'show',

                    'looking for',
                    'need a',
                    'i need',
                    'want a',
                    'i want',

                    'have you any',
                    'do you have',

                    'recommend',
                    'suggest',

                    'প্রোডাক্ট',
                    'পণ্য',

                    'ফোন',
                    'মোবাইল',
                    'ল্যাপটপ',
                    'ক্যামেরা',
                    'হেডফোন',
                    'ঘড়ি',
                    'টিভি',

                    'চেয়ার',
                    'টেবিল',
                    'সোফা',
                    'ফার্নিচার',

                    'দেখাও',
                    'খুঁজে দাও',
                    'আছে কি',

                    'অফার',
                    'ডিসকাউন্ট',
                    'সাজেস্ট',
                ]
            )
        ) {
            return 'search_products';
        }

        if (
            $this->looksLikeProductModel(
                $message
            )
        ) {
            return 'search_products';
        }

        if (
            $this->hasShoppingContext(
                $shoppingContext
            )
            && $this->looksLikeSearchRefinement(
                $message
            )
        ) {
            return 'search_products';
        }

        return 'general';
    }

    private function detectBrand(
        string $message
    ): ?array {
        $brands = Brand::query()
            ->select([
                'id',
                'name',
                'slug',
            ])
            ->where(
                'status',
                'active'
            )
            ->orderByRaw(
                'CHAR_LENGTH(name) DESC'
            )
            ->get();

        foreach ($brands as $brand) {
            if (
                $this->matchesTaxonomy(
                    $message,
                    $brand->name,
                    $brand->slug
                )
            ) {
                return [
                    'id' =>
                        $brand->id,

                    'name' =>
                        $brand->name,

                    'slug' =>
                        $brand->slug,
                ];
            }
        }

        return null;
    }

    private function detectCategory(
        string $message
    ): ?array {
        $categories = Category::query()
            ->select([
                'id',
                'name',
                'slug',
            ])
            ->where(
                'status',
                'active'
            )
            ->orderByRaw(
                'CHAR_LENGTH(name) DESC'
            )
            ->get();

        foreach (
            $categories
            as $category
        ) {
            if (
                $this->matchesTaxonomy(
                    $message,
                    $category->name,
                    $category->slug
                )
            ) {
                return [
                    'id' =>
                        $category->id,

                    'name' =>
                        $category->name,

                    'slug' =>
                        $category->slug,
                ];
            }
        }

        return null;
    }

    private function detectCollection(
        string $message
    ): ?array {
        $collections = Collection::query()
            ->select([
                'id',
                'title',
                'slug',
            ])
            ->where(
                'status',
                'active'
            )
            ->where(
                'online_store',
                true
            )
            ->orderByRaw(
                'CHAR_LENGTH(title) DESC'
            )
            ->get();

        foreach (
            $collections
            as $collection
        ) {
            if (
                $this->matchesTaxonomy(
                    $message,
                    $collection->title,
                    $collection->slug
                )
            ) {
                return [
                    'id' =>
                        $collection->id,

                    'title' =>
                        $collection->title,

                    'slug' =>
                        $collection->slug,
                ];
            }
        }

        return null;
    }

    private function matchesTaxonomy(
        string $message,
        ?string $name,
        ?string $slug
    ): bool {
        $values = array_filter([
            $this->normalize(
                $name
            ),

            $this->normalize(
                str_replace(
                    '-',
                    ' ',
                    (string) $slug
                )
            ),
        ]);

        foreach (
            array_unique($values)
            as $value
        ) {
            if (
                $this->containsPhrase(
                    $message,
                    $value
                )
            ) {
                return true;
            }
        }

        return false;
    }

    private function extractPriceFilters(
        string $message
    ): array {
        $message = $this->convertBanglaDigits(
            $message
        );

        $minPrice = null;
        $maxPrice = null;

        $number =
            '([0-9]+(?:[,.][0-9]+)?)';

        $rangePattern =
            '/(?:between|from)\s*'
            . '(?:\$|৳|tk|bdt)?\s*'
            . $number
            . '\s*(?:and|to|-)\s*'
            . '(?:\$|৳|tk|bdt)?\s*'
            . $number
            . '/iu';

        if (
            preg_match(
                $rangePattern,
                $message,
                $matches
            )
        ) {
            $first =
                $this->normalizePrice(
                    $matches[1]
                );

            $second =
                $this->normalizePrice(
                    $matches[2]
                );

            return [
                'min_price' =>
                    min(
                        $first,
                        $second
                    ),

                'max_price' =>
                    max(
                        $first,
                        $second
                    ),
            ];
        }

        $maximumPatterns = [
            '/(?:under|below|less than|up to|within|maximum|max|budget(?: is| of)?|এর মধ্যে|টাকার মধ্যে|নিচে|কম)\s*(?:\$|৳|tk|bdt)?\s*'
            . $number
            . '/iu',

            '/(?:\$|৳|tk|bdt)?\s*'
            . $number
            . '\s*(?:or less|maximum|এর মধ্যে|টাকার মধ্যে|টাকার নিচে)/iu',
        ];

        foreach (
            $maximumPatterns
            as $pattern
        ) {
            if (
                preg_match(
                    $pattern,
                    $message,
                    $matches
                )
            ) {
                $maxPrice =
                    $this->normalizePrice(
                        $matches[1]
                    );

                break;
            }
        }

        $minimumPatterns = [
            '/(?:over|above|more than|minimum|min|starting from|কমপক্ষে|এর বেশি|উপরে)\s*(?:\$|৳|tk|bdt)?\s*'
            . $number
            . '/iu',

            '/(?:\$|৳|tk|bdt)?\s*'
            . $number
            . '\s*(?:or more|minimum|এর বেশি|টাকার বেশি)/iu',
        ];

        foreach (
            $minimumPatterns
            as $pattern
        ) {
            if (
                preg_match(
                    $pattern,
                    $message,
                    $matches
                )
            ) {
                $minPrice =
                    $this->normalizePrice(
                        $matches[1]
                    );

                break;
            }
        }

        return [
            'min_price' =>
                $minPrice,

            'max_price' =>
                $maxPrice,
        ];
    }

    private function detectFlags(
        string $message
    ): array {
        return [
            'in_stock' =>
                $this->containsAny(
                    $message,
                    [
                        'in stock',
                        'available',
                        'available now',
                        'currently available',
                        'stock available',
                        'only available',

                        'স্টক আছে',
                        'স্টকে আছে',
                    ]
                ),

            'on_sale' =>
                $this->containsAny(
                    $message,
                    [
                        'on sale',
                        'sale product',
                        'sale products',
                        'discount',
                        'discounted',
                        'deal',
                        'offer',
                        'special price',

                        'অফার',
                        'ডিসকাউন্ট',
                        'কম দামে',
                        'সেল',
                    ]
                ),

            'featured' =>
                $this->containsAny(
                    $message,
                    [
                        'featured',
                        'popular product',
                        'popular products',
                        'recommended product',
                        'recommended products',
                        'best product',
                        'best products',

                        'ফিচার্ড',
                        'জনপ্রিয়',
                        'সেরা প্রোডাক্ট',
                    ]
                ),

            'preorder' =>
                $this->containsAny(
                    $message,
                    [
                        'preorder',
                        'pre order',
                        'pre-order',

                        'আগাম অর্ডার',
                        'প্রি অর্ডার',
                        'প্রি-অর্ডার',
                    ]
                ),
        ];
    }

    private function detectSort(
        string $message
    ): ?string {
        if (
            $this->containsAny(
                $message,
                [
                    'cheapest',
                    'cheaper',
                    'lowest price',
                    'low to high',
                    'price low to high',
                    'more affordable',
                    'কম দাম',
                    'কম দামে',
                    'সবচেয়ে কম দাম',
                ]
            )
        ) {
            return 'price_asc';
        }

        if (
            $this->containsAny(
                $message,
                [
                    'most expensive',
                    'highest price',
                    'high to low',
                    'price high to low',
                    'expensive first',
                    'সবচেয়ে বেশি দাম',
                ]
            )
        ) {
            return 'price_desc';
        }

        if (
            $this->containsAny(
                $message,
                [
                    'newest',
                    'latest',
                    'new arrivals',
                    'recent',
                    'নতুন',
                    'সর্বশেষ',
                ]
            )
        ) {
            return 'newest';
        }

        return null;
    }

   private function buildSearchQuery(
    string $message,
    array $taxonomyValues
): ?string {
    $cleaned = $message;

    /*
    |--------------------------------------------------------------------------
    | REMOVE DETECTED TAXONOMY NAMES
    |--------------------------------------------------------------------------
    */

    foreach (
        array_filter($taxonomyValues)
        as $value
    ) {
        $normalizedValue =
            $this->normalize(
                str_replace(
                    '-',
                    ' ',
                    $value
                )
            );

        $cleaned = str_replace(
            $normalizedValue,
            ' ',
            $cleaned
        );
    }

    /*
    |--------------------------------------------------------------------------
    | REMOVE CONVERSATIONAL PHRASES
    |--------------------------------------------------------------------------
    */

    $phrases = [
        'have you any',
        'do you have',

        'can you show me',
        'could you show me',
        'please show me',
        'show me',

        'help me find',
        'find me',

        'i am looking for',
        "i'm looking for",
        'im looking for',
        'looking for',

        'i am searching for',
        "i'm searching for",
        'im searching for',
        'searching for',

        'i want',
        'i need',
        'i would like',
        "i'd like",

        'i found',
        'i have found',

        'actually i want',
        'actually i need',
        'actually',
        'basically',

        'recommend me',
        'recommend',

        'suggest me',
        'suggest',

        'tell me about',
        'more information',
        'product details',

        'current website',
        'this website',
        'your website',
        'your store',

        /*
         * Brand preference phrases.
         */
        'for any brand',
        'from any brand',
        'any brand',
        'any brands',
        'whatever brand',
        'brand does not matter',
        "brand doesn't matter",
        'no brand preference',

        /*
         * Follow-up wording.
         */
        'what about',
        'how about',
        'what if',
        'instead of that',

        /*
         * Stock.
         */
        'in stock only',
        'only in stock',
        'in stock',
        'available now',
        'currently available',
        'only available',

        /*
         * Sale.
         */
        'on sale only',
        'only on sale',
        'on sale',
        'sale product',
        'sale products',
        'discounted product',
        'discounted products',

        /*
         * Generic product language.
         */
        'products',
        'product',
        'items',
        'item',

        'please',

        /*
         * Comparison.
         */
        'compare',
        'comparison',
        'versus',
        'which one is better',
        'which is better',
        'difference between',

        /*
         * Sorting.
         */
        'cheapest first',
        'cheapest',
        'cheaper',
        'lowest price',
        'low to high',
        'price low to high',
        'more affordable',

        'most expensive',
        'highest price',
        'high to low',
        'price high to low',
        'expensive first',

        'newest first',
        'newest',
        'latest',
        'new arrivals',

        /*
         * Bangla conversational phrases.
         */
        'আমাকে দেখাও',
        'খুঁজে দাও',
        'দেখাও',

        'আমি চাই',
        'আমার দরকার',

        'আসলে আমি চাই',
        'আসলে আমার দরকার',
        'আসলে',

        'যেকোনো ব্র্যান্ড',
        'যে কোনো ব্র্যান্ড',
        'ব্র্যান্ড যেকোনো',
        'ব্র্যান্ড কোনো ব্যাপার না',

        'সাজেস্ট করো',
        'সম্পর্কে বলো',

        'এই ওয়েবসাইটে',
        'তোমাদের ওয়েবসাইটে',

        'প্রোডাক্ট',
        'পণ্য',

        'স্টক আছে',

        'তুলনা',
        'কোনটা ভালো',
    ];

    /*
     * Long phrases first.
     *
     * This prevents shorter phrases from
     * partially breaking a longer sentence.
     */
    usort(
        $phrases,
        fn ($a, $b) =>
            mb_strlen($b)
            <=> mb_strlen($a)
    );

    foreach (
        $phrases
        as $phrase
    ) {
        $cleaned = str_replace(
            $phrase,
            ' ',
            $cleaned
        );
    }

    /*
    |--------------------------------------------------------------------------
    | REMOVE PRICE EXPRESSIONS
    |--------------------------------------------------------------------------
    */

    $cleaned = preg_replace(
        '/(?:between|from)\s*'
        . '(?:\$|৳|tk|bdt)?\s*'
        . '[0-9,.]+'
        . '\s*(?:and|to|-)\s*'
        . '(?:\$|৳|tk|bdt)?\s*'
        . '[0-9,.]+/iu',
        ' ',
        $cleaned
    );

    $cleaned = preg_replace(
        '/(?:under|below|less than|up to|within|over|above|more than|minimum|maximum|max|min|budget(?: is| of)?|starting from|এর মধ্যে|টাকার মধ্যে|নিচে|কম|কমপক্ষে|এর বেশি|উপরে)\s*'
        . '(?:\$|৳|tk|bdt)?\s*'
        . '[0-9,.]+/iu',
        ' ',
        $cleaned
    );

    $cleaned = preg_replace(
        '/(?:\$|৳|tk|bdt)?\s*'
        . '[0-9,.]+'
        . '\s*(?:or less|or more|maximum|minimum|এর মধ্যে|টাকার মধ্যে|টাকার নিচে|এর বেশি|টাকার বেশি)/iu',
        ' ',
        $cleaned
    );

    /*
    |--------------------------------------------------------------------------
    | CLEAN PUNCTUATION
    |--------------------------------------------------------------------------
    */

    $cleaned = preg_replace(
        '/[^\p{L}\p{N}\s-]/u',
        ' ',
        $cleaned
    );

    $cleaned = preg_replace(
        '/\s+/u',
        ' ',
        $cleaned
    );

    /*
    |--------------------------------------------------------------------------
    | TOKENIZE
    |--------------------------------------------------------------------------
    */

    $tokens = preg_split(
        '/\s+/u',
        trim($cleaned)
    );

    $stopWords = [
        /*
         * English grammar.
         */
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
        'from',

        'is',
        'are',
        'was',
        'were',
        'be',

        /*
         * Pronouns.
         */
        'i',
        'my',
        'me',
        'you',
        'your',
        'we',
        'our',

        'this',
        'that',
        'these',
        'those',

        /*
         * Conversational filler.
         */
        'actually',
        'basically',
        'really',
        'maybe',
        'perhaps',

        'found',
        'finding',

        'want',
        'wanted',
        'need',
        'needed',

        'looking',
        'searching',

        'show',
        'find',

        'give',
        'get',

        'please',

        'only',
        'just',

        'same',
        'another',

        /*
         * Brand wording should never become
         * a product-search keyword by itself.
         */
        'brand',
        'brands',

        /*
         * Store wording.
         */
        'current',
        'website',
        'store',

        /*
         * Availability.
         */
        'available',
        'availability',
        'stock',

        /*
         * Product filler.
         */
        'product',
        'products',
        'item',
        'items',

        /*
         * Sale/sort filler.
         */
        'sale',
        'discount',
        'discounted',
        'deal',
        'offer',

        'cheaper',
        'cheapest',
        'affordable',
        'expensive',

        'newest',
        'latest',
        'recent',

        /*
         * Bangla.
         */
        'কি',
        'কোন',
        'একটা',
        'কিছু',

        'আছে',

        'আমি',
        'আমার',
        'আমাকে',

        'তুমি',
        'তোমার',
        'তোমাদের',

        'এই',
        'ওই',

        'দিয়ে',
        'জন্য',

        'শুধু',
        'আসলে',

        'ব্র্যান্ড',
    ];

    $tokens = array_values(
        array_filter(
            $tokens,
            function ($token) use (
                $stopWords
            ) {
                $token = trim(
                    mb_strtolower(
                        (string) $token
                    )
                );

                return
                    $token !== ''
                    && mb_strlen(
                        $token
                    ) > 1
                    && !in_array(
                        $token,
                        $stopWords,
                        true
                    );
            }
        )
    );

    $tokens = array_values(
        array_unique(
            $tokens
        )
    );

    if (!$tokens) {
        return null;
    }

    /*
    |--------------------------------------------------------------------------
    | LIMIT SEARCH TERMS
    |--------------------------------------------------------------------------
    */

    return implode(
        ' ',
        array_slice(
            $tokens,
            0,
            8
        )
    );
}

    private function sanitizeFilters(
        array $filters
    ): array {
        $allowed = [
            'search',
            'brand',
            'category',
            'collection',

            'min_price',
            'max_price',

            'in_stock',
            'on_sale',
            'featured',
            'preorder',

            'sort',
        ];

        return collect(
            $filters
        )
            ->only(
                $allowed
            )
            ->reject(
                fn ($value) =>
                    $value === null
                    || $value === ''
                    || $value === false
            )
            ->all();
    }

    private function getPreviousFilters(
        array $shoppingContext
    ): array {
        $filters =
            $shoppingContext['filters']
            ?? [];

        if (!is_array($filters)) {
            return [];
        }

        return $this->sanitizeFilters(
            $filters
        );
    }

    private function hasShoppingContext(
        array $shoppingContext
    ): bool {
        return !empty(
            $shoppingContext['filters']
            ?? []
        )
        || !empty(
            $shoppingContext['last_products']
            ?? []
        )
        || !empty(
            $shoppingContext['selected_product']
            ?? []
        );
    }

    private function looksLikeSearchRefinement(
        string $message
    ): bool {
        return $this->isExplicitRefinement(
            $message
        );
    }

    private function extractComparisonProducts(
        string $message
    ): array {
        $message = preg_replace(
            '/^(?:please\s+)?'
            . '(?:compare|comparison of|difference between|তুলনা করো|তুলনা)\s+/iu',
            '',
            trim(
                $message
            )
        );

        $message = preg_replace(
            '/\s+(?:which one is better|which is better|কোনটা ভালো)\??$/iu',
            '',
            $message
        );

        $parts = preg_split(
            '/\s+(?:vs\.?|versus|and|with|ও|এবং|নাকি)\s+/iu',
            $message
        );

        if (
            !$parts
            || count(
                $parts
            ) < 2
        ) {
            return [];
        }

        return collect(
            $parts
        )
            ->map(
                fn ($part) =>
                    $this->cleanProductPhrase(
                        $part
                    )
            )
            ->filter(
                fn ($part) =>
                    mb_strlen(
                        $part
                    ) > 1
            )
            ->unique()
            ->take(4)
            ->values()
            ->all();
    }

    private function cleanProductPhrase(
        string $value
    ): string {
        $value = $this->normalize(
            $value
        );

        $value = preg_replace(
            '/^(?:compare|product|the|a|an)\s+/iu',
            '',
            $value
        );

        $value = preg_replace(
            '/\s+(?:product|phone|details)\??$/iu',
            '',
            $value
        );

        return trim(
            preg_replace(
                '/\s+/u',
                ' ',
                $value
            )
        );
    }

    private function getCurrentProductContext(
        array $pageContext
    ): ?array {
        $product =
            $pageContext['product']
            ?? null;

        if (is_array($product)) {
            $context = array_filter([
                'id' =>
                    $product['id']
                    ?? null,

                'title' =>
                    $product['title']
                    ?? null,

                'slug' =>
                    $product['slug']
                    ?? null,
            ]);

            return $context
                ?: null;
        }

        if (
            ($pageContext['page_type']
                ?? null)
            !== 'product'
        ) {
            return null;
        }

        $context = array_filter([
            'id' =>
                $pageContext['product_id']
                ?? null,

            'title' =>
                $pageContext['product_title']
                ?? null,

            'slug' =>
                $pageContext['product_slug']
                ?? null,
        ]);

        return $context
            ?: null;
    }

    private function getSavedProductContext(
        array $shoppingContext
    ): ?array {
        $product =
            $shoppingContext[
                'selected_product'
            ]
            ?? null;

        if (!is_array($product)) {
            return null;
        }

        $context = array_filter([
            'id' =>
                $product['id']
                ?? null,

            'title' =>
                $product['title']
                ?? null,

            'slug' =>
                $product['slug']
                ?? null,
        ]);

        return $context
            ?: null;
    }

    private function looksLikeProductModel(
        string $message
    ): bool {
        if (
            preg_match(
                '/\b(?:[a-z]+\s*)?[a-z]*[0-9]+[a-z0-9\s-]*\b/iu',
                $message
            )
        ) {
            return true;
        }

        return $this->containsAny(
            $message,
            [
                'iphone',
                'ipad',
                'galaxy',
                'pixel',
                'macbook',
                'airpods',
                'playstation',
                'xbox',
                'ultra',
                'pro max',
            ]
        );
    }

    private function isGreeting(
        string $message
    ): bool {
        $message = trim(
            preg_replace(
                '/[.!?]+$/u',
                '',
                $message
            )
        );

        return in_array(
            $message,
            [
                'hi',
                'hello',
                'hey',

                'good morning',
                'good afternoon',
                'good evening',

                'assalamu alaikum',
                'salam',

                'হাই',
                'হ্যালো',
                'সালাম',
                'আসসালামু আলাইকুম',
                'শুভ সকাল',
            ],
            true
        );
    }

    private function shouldExecuteDirectly(
        string $intent
    ): bool {
        return in_array(
            $intent,
            [
                'stop',
                'reset_context',

                'search_products',
                'product_details',
                'compare_products',

                'order_status',

                'add_to_cart',
                'view_cart',
            ],
            true
        );
    }

    private function getConfidence(
        string $intent,
        array $filters,
        array $comparisonProducts,
        ?array $currentProduct
    ): float {
        if (
            in_array(
                $intent,
                [
                    'stop',
                    'reset_context',
                ],
                true
            )
        ) {
            return 1;
        }

        $confidence = 0.45;

        if (
            $intent !== 'general'
        ) {
            $confidence += 0.20;
        }

        if ($filters) {
            $confidence += 0.15;
        }

        if (
            count(
                $comparisonProducts
            ) >= 2
        ) {
            $confidence += 0.15;
        }

        if ($currentProduct) {
            $confidence += 0.05;
        }

        return min(
            1,
            round(
                $confidence,
                2
            )
        );
    }

    private function makeResult(
        string $intent,
        string $originalMessage,
        string $normalizedMessage,
        array $pageContext,
        array $shoppingContext,
        float $confidence,
        bool $executeDirectly
    ): array {
        return [
            'intent' =>
                $intent,

            'original_message' =>
                $originalMessage,

            'normalized_message' =>
                $normalizedMessage,

            'search' =>
                null,

            'brand' =>
                null,

            'category' =>
                null,

            'collection' =>
                null,

            'filters' =>
                [],

            'current_filters' =>
                [],

            'previous_filters' =>
                $this->getPreviousFilters(
                    $shoppingContext
                ),

            'comparison_products' =>
                [],

            'current_product' =>
                $this->getCurrentProductContext(
                    $pageContext
                )
                ?: $this->getSavedProductContext(
                    $shoppingContext
                ),

            'flags' => [
                'in_stock' => false,
                'on_sale' => false,
                'featured' => false,
                'preorder' => false,
            ],

            'sort' =>
                null,

            'context_mode' =>
                'control',

            'replace_context' =>
                $intent
                    === 'reset_context',

            'confidence' =>
                $confidence,

            'should_execute_directly' =>
                $executeDirectly,
        ];
    }

    private function containsAny(
        string $message,
        array $phrases
    ): bool {
        foreach (
            $phrases
            as $phrase
        ) {
            if (
                $this->containsPhrase(
                    $message,
                    $phrase
                )
            ) {
                return true;
            }
        }

        return false;
    }

    private function containsPhrase(
        string $message,
        string $phrase
    ): bool {
        $phrase = $this->normalize(
            $phrase
        );

        if ($phrase === '') {
            return false;
        }

        return str_contains(
            " {$message} ",
            " {$phrase} "
        )
        || str_contains(
            $message,
            $phrase
        );
    }

    private function normalize(
        ?string $value
    ): string {
        $value = $this->convertBanglaDigits(
            (string) $value
        );

        $value = mb_strtolower(
            trim(
                $value
            )
        );

        $value = str_replace(
            [
                '’',
                '‘',
                '"',
                "'",
                '_',
                '/',
                '\\',
            ],
            ' ',
            $value
        );

        $value = preg_replace(
            '/\s+/u',
            ' ',
            $value
        );

        return trim(
            $value
        );
    }

    private function convertBanglaDigits(
        string $value
    ): string {
        return strtr(
            $value,
            [
                '০' => '0',
                '১' => '1',
                '২' => '2',
                '৩' => '3',
                '৪' => '4',
                '৫' => '5',
                '৬' => '6',
                '৭' => '7',
                '৮' => '8',
                '৯' => '9',
            ]
        );
    }

    private function normalizePrice(
        string $value
    ): float {
        return (float) str_replace(
            ',',
            '',
            $value
        );
    }
}
