<?php

namespace App\Services\SalesAi;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Collection;

class SalesAiIntentResolver
{
    public function resolve(
        string $message,
        array $pageContext = []
    ): array {
        $originalMessage = trim($message);

        $normalizedMessage = $this->normalize(
            $originalMessage
        );

        $controlIntent =
            $this->detectControlIntent(
                $normalizedMessage
            );

        if ($controlIntent) {
            return $this->makeResult(
                intent: $controlIntent,
                originalMessage: $originalMessage,
                normalizedMessage: $normalizedMessage,
                pageContext: $pageContext,
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

        $priceFilters =
            $this->extractPriceFilters(
                $normalizedMessage
            );

        $flags = $this->detectFlags(
            $normalizedMessage
        );

        $currentProduct =
            $this->getCurrentProductContext(
                $pageContext
            );

        $intent = $this->detectIntent(
            message: $normalizedMessage,
            brand: $brand,
            category: $category,
            collection: $collection,
            priceFilters: $priceFilters,
            flags: $flags,
            currentProduct: $currentProduct
        );

        $comparisonProducts =
            $intent === 'compare_products'
                ? $this->extractComparisonProducts(
                    $normalizedMessage
                )
                : [];

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

        $filters = array_filter([
            'search' =>
                $search ?: null,

            'brand' =>
                $brand['slug'] ?? null,

            'category' =>
                $category['slug'] ?? null,

            'collection' =>
                $collection['slug'] ?? null,

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
        ], function ($value) {
            return $value !== null &&
                $value !== '';
        });

        if (
            $intent === 'product_details' &&
            $currentProduct
        ) {
            if (
                !empty(
                    $currentProduct['id']
                )
            ) {
                $filters['product_id'] =
                    $currentProduct['id'];
            }

            if (
                !empty(
                    $currentProduct['slug']
                )
            ) {
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

            'comparison_products' =>
                $comparisonProducts,

            'current_product' =>
                $currentProduct,

            'flags' =>
                $flags,

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
        ?array $currentProduct
    ): string {
        if ($this->containsAny($message, [
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
        ])) {
            return 'order_status';
        }

        if ($this->containsAny($message, [
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
        ])) {
            return 'compare_products';
        }

        if ($this->containsAny($message, [
            'add to cart',
            'put in cart',
            'buy this',
            'buy it',
            'কার্টে যোগ',
            'কার্টে দাও',
            'কিনতে চাই',
        ])) {
            return 'add_to_cart';
        }

        if ($this->containsAny($message, [
            'show my cart',
            'view my cart',
            'my cart',
            'cart items',
            'what is in my cart',
            'কার্ট দেখাও',
            'কার্টে কি আছে',
        ])) {
            return 'view_cart';
        }

        if (
            $currentProduct &&
            $this->containsAny($message, [
                'this product',
                'current product',
                'this item',
                'its price',
                'its stock',
                'এই প্রোডাক্ট',
                'এই পণ্য',
                'এই জিনিস',
                'এটার দাম',
                'এটার স্টক',
            ])
        ) {
            return 'product_details';
        }

        if ($this->containsAny($message, [
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
        ])) {
            return 'product_details';
        }

        if ($this->containsAny($message, [
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
        ])) {
            return 'store_information';
        }

        if ($this->isGreeting($message)) {
            return 'greeting';
        }

        if (
            $brand ||
            $category ||
            $collection ||
            $priceFilters['min_price'] !== null ||
            $priceFilters['max_price'] !== null ||
            in_array(true, $flags, true)
        ) {
            return 'search_products';
        }

        if ($this->containsAny($message, [
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
            'earphone',
            'watch',
            'television',
            'tv',
            'available',
            'in stock',
            'sale',
            'discount',
            'deal',
            'offer',
            'find',
            'show me',
            'looking for',
            'need a',
            'want a',
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
            'দেখাও',
            'খুঁজে দাও',
            'আছে কি',
            'অফার',
            'ডিসকাউন্ট',
            'সাজেস্ট',
        ])) {
            return 'search_products';
        }

        if ($this->looksLikeProductModel($message)) {
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

        foreach ($categories as $category) {
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

        foreach ($collections as $collection) {
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
            $this->normalize($name),

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
            '/(?:between|from)\s*' .
            '(?:\$|৳|tk|bdt)?\s*' .
            $number .
            '\s*(?:and|to|-)\s*' .
            '(?:\$|৳|tk|bdt)?\s*' .
            $number .
            '/iu';

        if (
            preg_match(
                $rangePattern,
                $message,
                $matches
            )
        ) {
            $first = $this->normalizePrice(
                $matches[1]
            );

            $second = $this->normalizePrice(
                $matches[2]
            );

            return [
                'min_price' =>
                    min($first, $second),

                'max_price' =>
                    max($first, $second),
            ];
        }

        $maximumPatterns = [
            '/(?:under|below|less than|up to|within|maximum|max|budget(?: is| of)?|এর মধ্যে|টাকার মধ্যে|নিচে|কম)\s*(?:\$|৳|tk|bdt)?\s*' . $number . '/iu',

            '/(?:\$|৳|tk|bdt)?\s*' . $number . '\s*(?:or less|maximum|এর মধ্যে|টাকার মধ্যে|টাকার নিচে)/iu',
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
            '/(?:over|above|more than|minimum|min|starting from|কমপক্ষে|এর বেশি|উপরে)\s*(?:\$|৳|tk|bdt)?\s*' . $number . '/iu',

            '/(?:\$|৳|tk|bdt)?\s*' . $number . '\s*(?:or more|minimum|এর বেশি|টাকার বেশি)/iu',
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
                        'available now',
                        'currently available',
                        'stock available',
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
                        'recommended product',
                        'best product',
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

    private function extractComparisonProducts(
        string $message
    ): array {
        $message = preg_replace(
            '/^(?:please\s+)?(?:compare|comparison of|difference between|তুলনা করো|তুলনা)\s+/iu',
            '',
            trim($message)
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
            !$parts ||
            count($parts) < 2
        ) {
            return [];
        }

        return collect($parts)
            ->map(
                fn ($part) =>
                    $this->cleanProductPhrase(
                        $part
                    )
            )
            ->filter(
                fn ($part) =>
                    mb_strlen($part) > 1
            )
            ->unique()
            ->take(4)
            ->values()
            ->all();
    }

    private function buildSearchQuery(
        string $message,
        array $taxonomyValues
    ): ?string {
        $cleaned = $message;

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
            'im looking for',
            'looking for',
            'i want',
            'i need',
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
            'in stock',
            'available now',
            'on sale',
            'sale product',
            'products',
            'product',
            'items',
            'item',
            'please',
            'compare',
            'comparison',
            'versus',
            'which one is better',
            'which is better',
            'difference between',
            'আমাকে দেখাও',
            'খুঁজে দাও',
            'দেখাও',
            'আমি চাই',
            'আমার দরকার',
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

        foreach ($phrases as $phrase) {
            $cleaned = str_replace(
                $phrase,
                ' ',
                $cleaned
            );
        }

        $cleaned = preg_replace(
            '/(?:under|below|less than|up to|within|over|above|more than|minimum|maximum|max|min|budget|between|from)\s*(?:\$|৳|tk|bdt)?\s*[0-9,.]+/iu',
            ' ',
            $cleaned
        );

        $cleaned = preg_replace(
            '/[^\p{L}\p{N}\s-]/u',
            ' ',
            $cleaned
        );

        $tokens = preg_split(
            '/\s+/u',
            trim($cleaned)
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
            'was',
            'were',
            'be',
            'this',
            'that',
            'my',
            'your',
            'you',
            'me',
            'we',
            'our',
            'current',
            'website',
            'store',
            'please',
            'hello',
            'hi',
            'hey',
            'কি',
            'কোন',
            'একটা',
            'কিছু',
            'আছে',
            'আমার',
            'আমাকে',
            'তোমার',
            'তোমাদের',
            'এই',
            'ওই',
            'দিয়ে',
            'জন্য',
        ];

        $tokens = array_values(
            array_filter(
                $tokens,
                function ($token) use (
                    $stopWords
                ) {
                    return
                        $token !== '' &&
                        mb_strlen($token) > 1 &&
                        !in_array(
                            $token,
                            $stopWords,
                            true
                        );
                }
            )
        );

        if (!$tokens) {
            return null;
        }

        return implode(
            ' ',
            array_slice(
                array_unique($tokens),
                0,
                8
            )
        );
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
            return array_filter([
                'id' =>
                    $product['id'] ?? null,

                'title' =>
                    $product['title'] ?? null,

                'slug' =>
                    $product['slug'] ?? null,
            ]);
        }

        if (
            ($pageContext['page_type'] ?? null)
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

        return $context ?: null;
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

        if ($intent !== 'general') {
            $confidence += 0.20;
        }

        if ($filters) {
            $confidence += 0.15;
        }

        if (
            count($comparisonProducts) >= 2
        ) {
            $confidence += 0.15;
        }

        if ($currentProduct) {
            $confidence += 0.05;
        }

        return min(
            1,
            round($confidence, 2)
        );
    }

    private function makeResult(
        string $intent,
        string $originalMessage,
        string $normalizedMessage,
        array $pageContext,
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

            'comparison_products' =>
                [],

            'current_product' =>
                $this->getCurrentProductContext(
                    $pageContext
                ),

            'flags' => [
                'in_stock' => false,
                'on_sale' => false,
                'featured' => false,
                'preorder' => false,
            ],

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
        foreach ($phrases as $phrase) {
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
        ) || str_contains(
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
            trim($value)
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

        return trim($value);
    }

    private function convertBanglaDigits(
        string $value
    ): string {
        return strtr($value, [
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
        ]);
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