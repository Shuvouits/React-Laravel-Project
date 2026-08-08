<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\HomeSection;
use App\Models\Product;

class HomeController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | FEATURED CATEGORIES
    |--------------------------------------------------------------------------
    */

    public function featuredCategories()
    {
        $section = HomeSection::where(
            'section_key',
            'featured_categories'
        )->first();


        if (! $section) {
            return response()->json([
                'status' => true,
                'section' => null,
                'categories' => [],
            ]);
        }


        if (! $section->is_active) {
            return response()->json([
                'status' => true,

                'section' => [
                    'title' => $section->title,
                    'is_active' => false,
                    'settings' => $section->settings ?? [],
                ],

                'categories' => [],
            ]);
        }


        $settings =
            $section->settings ?? [];


        $source =
            $settings['category_source']
            ?? 'featured';


        $limit =
            (int) (
                $settings['max_categories']
                ?? 8
            );


        $limit = max(
            1,
            min(
                $limit,
                20
            )
        );


        $query = Category::query()
            ->where(
                'status',
                'active'
            );


        if ($source === 'top_level') {
            $query->whereNull(
                'parent_id'
            );
        } else {
            $query->where(
                'is_featured',
                true
            );
        }


        $categories =
            $query
                ->orderBy(
                    'display_order'
                )
                ->orderBy(
                    'name'
                )
                ->limit(
                    $limit
                )
                ->get();


        /*
        |--------------------------------------------------------------------------
        | FEATURED FALLBACK
        |--------------------------------------------------------------------------
        */

        if (
            $source === 'featured' &&
            $categories->isEmpty()
        ) {
            $categories =
                Category::query()
                    ->where(
                        'status',
                        'active'
                    )
                    ->whereNull(
                        'parent_id'
                    )
                    ->orderBy(
                        'display_order'
                    )
                    ->orderBy(
                        'name'
                    )
                    ->limit(
                        $limit
                    )
                    ->get();
        }


        return response()->json([
            'status' => true,

            'section' => [
                'title' =>
                    $section->title
                    ?: 'Featured Categories',

                'is_active' =>
                    (bool) $section->is_active,

                'settings' => [
                    'category_source' =>
                        $source,

                    'max_categories' =>
                        $limit,
                ],
            ],

            'categories' =>
                $categories
                    ->map(
                        function ($category) {
                            return [
                                'id' =>
                                    $category->id,

                                'name' =>
                                    $category->name,

                                'slug' =>
                                    $category->slug,

                                'image' =>
                                    $category->image,

                                'image_url' =>
                                    $category->image
                                        ? asset(
                                            $category->image
                                        )
                                        : null,

                                'is_featured' =>
                                    (bool)
                                        $category
                                            ->is_featured,
                            ];
                        }
                    )
                    ->values(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PRODUCTS ON SALE
    |--------------------------------------------------------------------------
    */

    public function productsOnSale()
    {
        /*
        |--------------------------------------------------------------------------
        | SECTION
        |--------------------------------------------------------------------------
        */

        $section = HomeSection::where(
            'section_key',
            'products_on_sale'
        )->first();


        if (! $section) {
            return response()->json([
                'status' => true,
                'section' => null,
                'products' => [],
            ]);
        }


        if (! $section->is_active) {
            return response()->json([
                'status' => true,

                'section' => [
                    'title' =>
                        $section->title,

                    'is_active' =>
                        false,

                    'settings' =>
                        $section->settings ?? [],
                ],

                'products' => [],
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | SETTINGS
        |--------------------------------------------------------------------------
        */

        $settings =
            $section->settings ?? [];


        $source =
            $settings['product_source']
            ?? 'on_sale';


        $limit =
            (int) (
                $settings['max_products']
                ?? 8
            );


        $limit = max(
            1,
            min(
                $limit,
                24
            )
        );


        /*
        |--------------------------------------------------------------------------
        | BASE QUERY
        |--------------------------------------------------------------------------
        */

        $query = Product::query()
            ->where(
                'status',
                'active'
            )
            ->where(
                'online_store',
                true
            );


        /*
        |--------------------------------------------------------------------------
        | PRODUCT MEDIA
        |--------------------------------------------------------------------------
        */

        if (
            method_exists(
                Product::class,
                'media'
            )
        ) {
            $query->with(
                'media'
            );
        }


        /*
        |--------------------------------------------------------------------------
        | VARIANTS + OPTIONS
        |--------------------------------------------------------------------------
        */

        if (
            method_exists(
                Product::class,
                'variants'
            )
        ) {
            $query->with([
                'variants.optionValues.option',
            ]);
        }


        /*
        |--------------------------------------------------------------------------
        | PRODUCT SOURCE
        |--------------------------------------------------------------------------
        */

        if ($source === 'featured') {
            $query->where(
                'is_featured',
                true
            );
        }


        if ($source === 'on_sale') {
            $query->where(
                function ($saleQuery) {

                    /*
                    |--------------------------------------------------------------------------
                    | PRODUCT LEVEL SALE
                    |--------------------------------------------------------------------------
                    */

                    $saleQuery->where(
                        function ($productSaleQuery) {
                            $productSaleQuery
                                ->whereNotNull(
                                    'price'
                                )
                                ->whereNotNull(
                                    'compare_at_price'
                                )
                                ->whereColumn(
                                    'compare_at_price',
                                    '>',
                                    'price'
                                );
                        }
                    );


                    /*
                    |--------------------------------------------------------------------------
                    | VARIANT LEVEL SALE
                    |--------------------------------------------------------------------------
                    */

                    if (
                        method_exists(
                            Product::class,
                            'variants'
                        )
                    ) {
                        $saleQuery->orWhereHas(
                            'variants',
                            function ($variantQuery) {
                                $variantQuery
                                    ->whereNotNull(
                                        'price'
                                    )
                                    ->whereNotNull(
                                        'compare_at_price'
                                    )
                                    ->whereColumn(
                                        'compare_at_price',
                                        '>',
                                        'price'
                                    );
                            }
                        );
                    }
                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | LATEST FIRST
        |--------------------------------------------------------------------------
        */

        $products =
            $query
                ->latest(
                    'created_at'
                )
                ->limit(
                    $limit
                )
                ->get();


        /*
        |--------------------------------------------------------------------------
        | ON SALE FALLBACK TO LATEST
        |--------------------------------------------------------------------------
        */

        if (
            $source === 'on_sale' &&
            $products->isEmpty()
        ) {
            $fallbackQuery =
                Product::query()
                    ->where(
                        'status',
                        'active'
                    )
                    ->where(
                        'online_store',
                        true
                    );


            if (
                method_exists(
                    Product::class,
                    'media'
                )
            ) {
                $fallbackQuery->with(
                    'media'
                );
            }


            if (
                method_exists(
                    Product::class,
                    'variants'
                )
            ) {
                $fallbackQuery->with([
                    'variants.optionValues.option',
                ]);
            }


            $products =
                $fallbackQuery
                    ->latest(
                        'created_at'
                    )
                    ->limit(
                        $limit
                    )
                    ->get();
        }


        /*
        |--------------------------------------------------------------------------
        | FORMAT PRODUCTS
        |--------------------------------------------------------------------------
        */

        $formattedProducts =
            $products
                ->map(
                    function ($product) {

                        /*
                        |--------------------------------------------------------------------------
                        | PRODUCT MEDIA
                        |--------------------------------------------------------------------------
                        */

                        $productMedia =
                            collect();


                        if (
                            $product->relationLoaded(
                                'media'
                            )
                        ) {
                            $productMedia =
                                $product->media;
                        }


                        /*
                        |--------------------------------------------------------------------------
                        | VARIANTS
                        |--------------------------------------------------------------------------
                        */

                        $variants =
                            collect();


                        if (
                            $product->relationLoaded(
                                'variants'
                            )
                        ) {
                            $variants =
                                $product->variants;
                        }


                        /*
                        |--------------------------------------------------------------------------
                        | BASE PRODUCT IMAGE
                        |--------------------------------------------------------------------------
                        */

                        $imageUrl =
                            $this->resolveProductImage(
                                $product
                            );


                        /*
                        |--------------------------------------------------------------------------
                        | FORMAT VARIANTS
                        |--------------------------------------------------------------------------
                        */

                        $formattedVariants =
                            $variants
                                ->map(
                                    function ($variant) use (
                                        $productMedia,
                                        $imageUrl
                                    ) {

                                        /*
                                        |--------------------------------------------------------------------------
                                        | OPTION VALUES
                                        |--------------------------------------------------------------------------
                                        */

                                        $optionValues =
                                            $variant->relationLoaded(
                                                'optionValues'
                                            )
                                                ? $variant
                                                    ->optionValues
                                                : collect();


                                        /*
                                        |--------------------------------------------------------------------------
                                        | OPTIONS
                                        |--------------------------------------------------------------------------
                                        */

                                        $formattedOptions =
                                            $optionValues
                                                ->map(
                                                    function ($optionValue) {

                                                        $optionName =
                                                            $optionValue
                                                                ->option
                                                                ->name
                                                            ?? null;


                                                        return [
                                                            'id' =>
                                                                $optionValue
                                                                    ->id,

                                                            'global_variant_value_id' =>
                                                                $optionValue
                                                                    ->global_variant_value_id
                                                                ?? null,

                                                            'global_variant_name' =>
                                                                $optionName,

                                                            'name' =>
                                                                $optionName,

                                                            'option_name' =>
                                                                $optionName,

                                                            'value' =>
                                                                $optionValue
                                                                    ->value
                                                                ?? null,

                                                            'color_code' =>
                                                                $optionValue
                                                                    ->color_code
                                                                ?? null,
                                                        ];
                                                    }
                                                )
                                                ->filter(
                                                    function ($option) {
                                                        return (
                                                            ! empty(
                                                                $option[
                                                                    'option_name'
                                                                ]
                                                            ) &&
                                                            $option[
                                                                'value'
                                                            ] !== null
                                                        );
                                                    }
                                                )
                                                ->values();


                                        /*
                                        |--------------------------------------------------------------------------
                                        | VARIANT IMAGE
                                        |--------------------------------------------------------------------------
                                        |
                                        | Variant-এর product_media_id দিয়ে
                                        | correct product media খুঁজে বের করছি।
                                        |
                                        |--------------------------------------------------------------------------
                                        */

                                        $variantImageUrl =
                                            null;


                                        if (
                                            ! empty(
                                                $variant
                                                    ->product_media_id
                                            )
                                        ) {
                                            $variantMedia =
                                                $productMedia
                                                    ->firstWhere(
                                                        'id',
                                                        $variant
                                                            ->product_media_id
                                                    );


                                            if ($variantMedia) {
                                                $variantImageUrl =
                                                    $this
                                                        ->resolveMediaUrl(
                                                            $variantMedia
                                                        );
                                            }
                                        }


                                        /*
                                        |--------------------------------------------------------------------------
                                        | FALLBACK IMAGE
                                        |--------------------------------------------------------------------------
                                        */

                                        if (
                                            ! $variantImageUrl
                                        ) {
                                            $variantImageUrl =
                                                $imageUrl;
                                        }


                                        /*
                                        |--------------------------------------------------------------------------
                                        | VARIANT RESPONSE
                                        |--------------------------------------------------------------------------
                                        */

                                        return [
                                            'id' =>
                                                $variant->id,

                                            'title' =>
                                                $variant->title
                                                ?? $variant->name
                                                ?? null,

                                            'name' =>
                                                $variant->name
                                                ?? $variant->title
                                                ?? null,

                                            'combination_key' =>
                                                $variant
                                                    ->combination_key
                                                ?? null,

                                            'product_media_id' =>
                                                $variant
                                                    ->product_media_id
                                                ?? null,

                                            'sku' =>
                                                $variant->sku
                                                ?? null,

                                            'barcode' =>
                                                $variant->barcode
                                                ?? null,

                                            'price' =>
                                                $variant->price !== null
                                                    ? (float)
                                                        $variant
                                                            ->price
                                                    : 0,

                                            'compare_at_price' =>
                                                $variant
                                                    ->compare_at_price
                                                !== null
                                                    ? (float)
                                                        $variant
                                                            ->compare_at_price
                                                    : 0,

                                            'quantity' =>
                                                (int) (
                                                    $variant
                                                        ->quantity
                                                    ?? 0
                                                ),

                                            'is_default' =>
                                                (bool) (
                                                    $variant
                                                        ->is_default
                                                    ?? false
                                                ),

                                            'is_active' =>
                                                (bool) (
                                                    $variant
                                                        ->is_active
                                                    ?? true
                                                ),

                                            /*
                                            |--------------------------------------------------------------------------
                                            | IMPORTANT
                                            |--------------------------------------------------------------------------
                                            */

                                            'image_url' =>
                                                $variantImageUrl,

                                            'options' =>
                                                $formattedOptions,
                                        ];
                                    }
                                )
                                ->values();


                        /*
                        |--------------------------------------------------------------------------
                        | PRODUCT DISPLAY PRICE
                        |--------------------------------------------------------------------------
                        */

                        $price =
                            $product->price;


                        $compareAtPrice =
                            $product
                                ->compare_at_price;


                        /*
                        |--------------------------------------------------------------------------
                        | USE VARIANT PRICE
                        |--------------------------------------------------------------------------
                        */

                        if (
                            $formattedVariants
                                ->isNotEmpty()
                        ) {
                            /*
                            |--------------------------------------------------------------------------
                            | SALE VARIANT FIRST
                            |--------------------------------------------------------------------------
                            */

                            $saleVariant =
                                $formattedVariants
                                    ->first(
                                        function ($variant) {
                                            return (
                                                $variant[
                                                    'price'
                                                ] > 0 &&
                                                $variant[
                                                    'compare_at_price'
                                                ] >
                                                $variant[
                                                    'price'
                                                ]
                                            );
                                        }
                                    );


                            if ($saleVariant) {
                                $price =
                                    $saleVariant[
                                        'price'
                                    ];

                                $compareAtPrice =
                                    $saleVariant[
                                        'compare_at_price'
                                    ];
                            } elseif (
                                $price === null
                            ) {
                                $validPrices =
                                    $formattedVariants
                                        ->pluck(
                                            'price'
                                        )
                                        ->filter(
                                            fn ($value) =>
                                                $value > 0
                                        );


                                if (
                                    $validPrices
                                        ->isNotEmpty()
                                ) {
                                    $price =
                                        $validPrices
                                            ->min();
                                }
                            }
                        }


                        /*
                        |--------------------------------------------------------------------------
                        | RESPONSE
                        |--------------------------------------------------------------------------
                        */

                        return [
                            'id' =>
                                $product->id,

                            'title' =>
                                $product->title,

                            'slug' =>
                                $product->slug,

                            'summary' =>
                                $product->summary,

                            'description' =>
                                $product
                                    ->description,

                            'type' =>
                                $product->type,

                            'price' =>
                                $price !== null
                                    ? (float) $price
                                    : 0,

                            'compare_at_price' =>
                                $compareAtPrice !== null
                                    ? (float)
                                        $compareAtPrice
                                    : 0,

                            'is_featured' =>
                                (bool)
                                    $product
                                        ->is_featured,

                            'quantity' =>
                                (int) (
                                    $product
                                        ->quantity
                                    ?? 0
                                ),

                            'image_url' =>
                                $imageUrl,

                            'store_name' =>
                                'Storify',

                            'variants' =>
                                $formattedVariants,
                        ];
                    }
                )
                ->values();


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'status' => true,

            'section' => [
                'title' =>
                    $section->title
                    ?: 'Product on Sale',

                'is_active' =>
                    (bool)
                        $section
                            ->is_active,

                'settings' => [
                    'subtitle' =>
                        $settings[
                            'subtitle'
                        ] ?? '',

                    'product_source' =>
                        $source,

                    'max_products' =>
                        $limit,

                    'desktop_cards_per_row' =>
                        (int) (
                            $settings[
                                'desktop_cards_per_row'
                            ] ?? 4
                        ),
                ],
            ],

            'products' =>
                $formattedProducts,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | RESOLVE PRODUCT IMAGE
    |--------------------------------------------------------------------------
    */

    private function resolveProductImage(
        $product
    ) {
        /*
        |--------------------------------------------------------------------------
        | PRODUCT MEDIA
        |--------------------------------------------------------------------------
        */

        if (
            $product->relationLoaded(
                'media'
            ) &&
            $product->media &&
            $product->media
                ->isNotEmpty()
        ) {
            /*
            |--------------------------------------------------------------------------
            | COVER FIRST
            |--------------------------------------------------------------------------
            */

            $media =
                $product->media
                    ->firstWhere(
                        'is_cover',
                        true
                    )
                ?? $product->media
                    ->first();


            return
                $this->resolveMediaUrl(
                    $media
                );
        }


        /*
        |--------------------------------------------------------------------------
        | DIRECT IMAGE URL
        |--------------------------------------------------------------------------
        */

        if (
            ! empty(
                $product->image_url
            )
        ) {
            return
                $product->image_url;
        }


        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | RESOLVE MEDIA URL
    |--------------------------------------------------------------------------
    */

    private function resolveMediaUrl(
        $media
    ) {
        if (! $media) {
            return null;
        }


        $path =
            $media->file_path
            ?? $media->image
            ?? $media->path
            ?? $media->url
            ?? null;


        if (! $path) {
            return null;
        }


        /*
        |--------------------------------------------------------------------------
        | REMOTE URL
        |--------------------------------------------------------------------------
        */

        if (
            str_starts_with(
                $path,
                'http://'
            ) ||
            str_starts_with(
                $path,
                'https://'
            )
        ) {
            return $path;
        }


        /*
        |--------------------------------------------------------------------------
        | LOCAL FILE
        |--------------------------------------------------------------------------
        */

        return asset(
            $path
        );
    }
}
