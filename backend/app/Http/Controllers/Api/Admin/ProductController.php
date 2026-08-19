<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Collection;
use App\Models\GlobalVariant;
use App\Models\GlobalVariantValue;
use App\Models\InventoryLevel;
use App\Models\InventoryLocation;

use App\Models\Product;
use App\Models\ProductMedia;
use App\Models\ProductOption;
use App\Models\ProductOptionValue;
use App\Models\ProductVariant;

use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;

use Illuminate\Support\Str;

use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | PRODUCT LIST
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/products
    |
    | Supports:
    |
    | ?tab=all
    | ?tab=active
    | ?tab=draft
    | ?tab=archived
    | ?search=nike
    | ?category_id=1
    | ?brand_id=1
    | ?source=admin
    |
    */

    public function index(Request $request)
    {
        $query = Product::query()
            ->with([
                'category:id,name',
                'brand:id,name',
                'creator:id,name',
                'media',
            ])
            ->withCount('variants')
            ->withSum(
                'variants as variant_inventory',
                'quantity'
            )
            ->withMin(
                'variants as variant_min_price',
                'price'
            );


        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {

            $search = trim(
                $request->input('search')
            );


            $query->where(
                function ($q) use ($search) {

                    $q->where(
                        'title',
                        'like',
                        "%{$search}%"
                    )
                        ->orWhere(
                            'slug',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'sku',
                            'like',
                            "%{$search}%"
                        )
                        ->orWhere(
                            'barcode',
                            'like',
                            "%{$search}%"
                        );
                }
            );
        }


        /*
        |--------------------------------------------------------------------------
        | STATUS TAB
        |--------------------------------------------------------------------------
        */

        $tab = $request->input(
            'tab',
            'all'
        );


        if (
            in_array(
                $tab,
                [
                    'active',
                    'draft',
                    'archived',
                ],
                true
            )
        ) {

            $query->where(
                'status',
                $tab
            );
        }


        /*
        |--------------------------------------------------------------------------
        | CATEGORY
        |--------------------------------------------------------------------------
        */

        if ($request->filled('category_id')) {

            $query->where(
                'category_id',
                $request->input(
                    'category_id'
                )
            );
        }


        /*
        |--------------------------------------------------------------------------
        | BRAND
        |--------------------------------------------------------------------------
        */

        if ($request->filled('brand_id')) {

            $query->where(
                'brand_id',
                $request->input(
                    'brand_id'
                )
            );
        }


        /*
        |--------------------------------------------------------------------------
        | SOURCE
        |--------------------------------------------------------------------------
        */

        if (
            $request->filled('source') &&
            in_array(
                $request->input('source'),
                [
                    'admin',
                    'vendor',
                ],
                true
            )
        ) {

            $query->where(
                'source',
                $request->input('source')
            );
        }


        /*
        |--------------------------------------------------------------------------
        | ORDER
        |--------------------------------------------------------------------------
        */

        $query->latest('id');


        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

        $products = $query
            ->paginate(15);


        $products
            ->getCollection()
            ->transform(
                fn($product) =>
                $this->productListData(
                    $product
                )
            );


        /*
        |--------------------------------------------------------------------------
        | DASHBOARD STATS
        |--------------------------------------------------------------------------
        */

        $baseInventory =
            Product::doesntHave('variants')
            ->where(
                'quantity',
                '>',
                0
            )
            ->sum('quantity');


        $variantInventory =
            ProductVariant::where(
                'quantity',
                '>',
                0
            )
            ->sum('quantity');


        $outOfStock =
            Product::where(
                function ($query) {

                    /*
                    |--------------------------------------------------------------------------
                    | PRODUCTS WITHOUT VARIANTS
                    |--------------------------------------------------------------------------
                    */

                    $query
                        ->where(
                            function ($q) {

                                $q->doesntHave(
                                    'variants'
                                )
                                    ->where(
                                        'track_quantity',
                                        true
                                    )
                                    ->where(
                                        'quantity',
                                        '<=',
                                        0
                                    );
                            }
                        )

                        /*
                        |--------------------------------------------------------------------------
                        | PRODUCTS WITH VARIANTS BUT NONE AVAILABLE
                        |--------------------------------------------------------------------------
                        */

                        ->orWhere(
                            function ($q) {

                                $q->whereHas(
                                    'variants'
                                )
                                    ->whereDoesntHave(
                                        'variants',
                                        function ($variantQuery) {

                                            $variantQuery
                                                ->where(
                                                    'quantity',
                                                    '>',
                                                    0
                                                )
                                                ->where(
                                                    'is_active',
                                                    true
                                                );
                                        }
                                    );
                            }
                        );
                }
            )
            ->count();


        $stats = [

            'total' =>
            Product::count(),

            'active' =>
            Product::where(
                'status',
                'active'
            )->count(),

            'draft' =>
            Product::where(
                'status',
                'draft'
            )->count(),

            'archived' =>
            Product::where(
                'status',
                'archived'
            )->count(),

            'out_of_stock' =>
            $outOfStock,

            'inventory_units' =>
            (int)
            (
                $baseInventory +
                $variantInventory
            ),

        ];


        return response()->json([

            'status' => true,

            'products' =>
            $products,

            'stats' =>
            $stats,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | FORM OPTIONS
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/products/form-options
    |
    | Product Create/Edit page initial dropdown data.
    |
    */

   public function formOptions(Request $request)
{
    $user = $request->user();

    /*
    |--------------------------------------------------------------------------
    | CATEGORIES
    |--------------------------------------------------------------------------
    */

    $categories = Category::query()
        ->where('status', 'active')
        ->orderBy('name')
        ->get([
            'id',
            'name',
        ]);

    /*
    |--------------------------------------------------------------------------
    | BRANDS
    |--------------------------------------------------------------------------
    */

    $brands = Brand::query()
        ->where('status', 'active')
        ->orderBy('name')
        ->get([
            'id',
            'name',
        ]);

    /*
    |--------------------------------------------------------------------------
    | COLLECTIONS
    |--------------------------------------------------------------------------
    */

    $collections = Collection::query()
        ->where('status', 'active')
        ->orderBy('display_position')
        ->orderBy('title')
        ->get([
            'id',
            'title',
            'slug',
        ]);

    /*
    |--------------------------------------------------------------------------
    | GLOBAL VARIANTS
    |--------------------------------------------------------------------------
    */

    $globalVariants = GlobalVariant::with([
        'values',
    ])
        ->ordered()
        ->get()
        ->map(function ($variant) {
            return [
                'id' =>
                    $variant->id,

                'name' =>
                    $variant->name,

                'visual_type' =>
                    $variant->visual_type,

                'is_color' =>
                    in_array(
                        strtolower(
                            trim(
                                $variant->name
                            )
                        ),
                        [
                            'color',
                            'colour',
                        ],
                        true
                    ),

                'values' =>
                    $variant
                        ->values
                        ->map(
                            fn($value) => [
                                'id' =>
                                    $value->id,

                                'value' =>
                                    $value->value,

                                'color_code' =>
                                    $value->color_code,

                                'sort_order' =>
                                    (int) $value->sort_order,
                            ]
                        )
                        ->values(),
            ];
        })
        ->values();

    /*
    |--------------------------------------------------------------------------
    | INVENTORY LOCATIONS
    |--------------------------------------------------------------------------
    */

    $locationQuery = InventoryLocation::query()
        ->where('is_active', true);

    if (
        $user &&
        $user->role === 'vendor'
    ) {
        $locationQuery->where(
            'vendor_id',
            $user->id
        );
    } else {
        $locationQuery->whereNull(
            'vendor_id'
        );
    }

    $locations = $locationQuery
        ->orderByDesc('is_default')
        ->orderBy('shipping_priority')
        ->orderBy('name')
        ->get([
            'id',
            'name',
            'code',
            'address_line1',
            'city',
            'state',
            'country',
            'is_default',
            'pickup_enabled',
            'shipping_enabled',
            'shipping_priority',
        ]);

    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return response()->json([
        'status' => true,

        'categories' =>
            $categories,

        'brands' =>
            $brands,

        'collections' =>
            $collections,

        'global_variants' =>
            $globalVariants,

        'locations' =>
            $locations,
    ]);
}


    /*
    |--------------------------------------------------------------------------
    | CREATE PRODUCT
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/products
    |
    */

    public function store(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | NORMALIZE FORM DATA
        |--------------------------------------------------------------------------
        */

        $this->normalizeProductRequest(
            $request
        );


        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $validated =
            $this->validateProduct(
                $request
            );


        /*
        |--------------------------------------------------------------------------
        | UNIQUE SLUG
        |--------------------------------------------------------------------------
        */

        $slug =
            $request->filled('slug')

            ? Str::slug(
                $request->input(
                    'slug'
                )
            )

            : Str::slug(
                $validated['title']
            );


        $slug =
            $this->makeUniqueSlug(
                $slug
            );


        $uploadedPaths = [];


        try {

            $product =
                DB::transaction(
                    function () use (
                        $request,
                        $validated,
                        $slug,
                        &$uploadedPaths
                    ) {

                        /*
                        |--------------------------------------------------------------------------
                        | CREATE PRODUCT
                        |--------------------------------------------------------------------------
                        */

                        $product =
                            Product::create(
                                $this->productPayload(
                                    request: $request,

                                    validated: $validated,

                                    slug: $slug,

                                    product: null
                                )
                            );


                        /*
                        |--------------------------------------------------------------------------
                        | COLLECTIONS
                        |--------------------------------------------------------------------------
                        */

                        $this->syncCollections(

                            product: $product,

                            collectionIds: $validated['collection_ids']
                                ?? []

                        );


                        /*
                        |--------------------------------------------------------------------------
                        | MEDIA
                        |--------------------------------------------------------------------------
                        */

                        $mediaResult =
                            $this->uploadNewMedia(

                                product: $product,

                                request: $request

                            );


                        $uploadedPaths =
                            $mediaResult['uploaded_paths'];


                        /*
                        |--------------------------------------------------------------------------
                        | OPTIONS
                        |--------------------------------------------------------------------------
                        */

                        $optionMap =
                            $this->syncProductOptions(

                                product: $product,

                                options: $validated['options']
                                    ?? []

                            );


                        /*
                        |--------------------------------------------------------------------------
                        | VARIANTS
                        |--------------------------------------------------------------------------
                        */

                        $variants =
                            $validated['variants']
                            ?? [];


                        /*
                        |--------------------------------------------------------------------------
                        | AUTO GENERATE COMBINATIONS
                        |--------------------------------------------------------------------------
                        */

                        if (
                            empty($variants) &&
                            ! empty($validated['options']
                                ?? [])
                        ) {

                            $variants =
                                $this
                                ->buildAutoVariantPayload(

                                    options: $validated['options'],

                                    product: $product

                                );
                        }


                        $this->syncVariants(

                            product: $product,

                            variants: $variants,

                            optionMap: $optionMap,

                            newMediaMap: $mediaResult['new_media_map']

                        );


                        /*
                        |--------------------------------------------------------------------------
                        | INVENTORY LEVELS
                        |--------------------------------------------------------------------------
                        */

                        $this->syncInventoryLevelsFromProduct(
                            product:
                                $product,

                            inventoryByLocation:
                                $validated[
                                    'inventory_by_location'
                                ]
                                ?? null
                        );


                        return $product;
                    }
                );


            /*
            |--------------------------------------------------------------------------
            | LOAD COMPLETE PRODUCT
            |--------------------------------------------------------------------------
            */

            return response()->json([

                'status' => true,

                'message' =>
                'Product created successfully.',

                'product' =>
                $this->loadProductData(
                    $product->id
                ),

            ], 201);
        } catch (\Throwable $error) {

            foreach ($uploadedPaths as $path) {
                $this->deleteFile($path);
            }

            if ($error instanceof ValidationException) {
                throw $error;
            }

            report($error);

            return response()->json([
                'status' => false,
                'message' => 'Unable to create product.',

                // TEMP DEBUG
                'error' => $error->getMessage(),
                'file' => $error->getFile(),
                'line' => $error->getLine(),
            ], 500);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SHOW PRODUCT
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/products/{id}
    |
    */

    public function show($id)
    {
        return response()->json([

            'status' => true,

            'product' =>
            $this->loadProductData(
                $id
            ),

        ]);
    }


    public function uploadVariantImage(
        Request $request,
        Product $product,
        $variantId
    ) {
        $request->validate([
            'image' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
        ]);


        /*
    |--------------------------------------------------------------------------
    | FIND VARIANT
    |--------------------------------------------------------------------------
    */

        $variant = $product
            ->variants()
            ->where('id', $variantId)
            ->firstOrFail();


        /*
    |--------------------------------------------------------------------------
    | UPLOAD DIRECTORY
    |--------------------------------------------------------------------------
    */

        $uploadPath =
            public_path(
                'uploads/products/' .
                    $product->id .
                    '/variants'
            );


        if (! file_exists($uploadPath)) {
            mkdir(
                $uploadPath,
                0755,
                true
            );
        }


        /*
    |--------------------------------------------------------------------------
    | SAVE FILE
    |--------------------------------------------------------------------------
    */

        $image =
            $request->file('image');


        $fileName =
            time() .
            '-' .
            uniqid() .
            '.' .
            $image->getClientOriginalExtension();


        $image->move(
            $uploadPath,
            $fileName
        );


        $relativePath =
            'uploads/products/' .
            $product->id .
            '/variants/' .
            $fileName;


        /*
    |--------------------------------------------------------------------------
    | CREATE PRODUCT MEDIA
    |--------------------------------------------------------------------------
    */

        $media = $product
            ->media()
            ->create([
                'file_path' =>
                $relativePath,

                'media_type' =>
                'image',

                'is_cover' =>
                false,

                'sort_order' =>
                999,
            ]);


        /*
    |--------------------------------------------------------------------------
    | ASSIGN MEDIA TO VARIANT
    |--------------------------------------------------------------------------
    */

        $variant->product_media_id =
            $media->id;


        $variant->save();


        /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

        return response()->json([
            'status' => true,

            'message' =>
            'Variant image updated successfully.',

            'variant' => [
                'id' =>
                $variant->id,

                'product_media_id' =>
                $variant->product_media_id,

                'image_url' =>
                asset(
                    $relativePath
                ),
            ],
        ]);
    }



   // Single product
public function showBySlug($slug)
{
    $product = Product::query()
        ->where('slug', $slug)
        ->where('status', 'active')
        ->where('online_store', true)
        ->with([
            'category',
            'brand',
            'media',
            'variants.optionValues.option',
        ])
        ->firstOrFail();

    $productMedia = $product->media ?? collect();
    $variants = $product->variants ?? collect();

    $imageUrl = $this->resolveProductImage($product);

    // Format variants
    $formattedVariants = $variants->map(function ($variant) use ($productMedia, $imageUrl) {
        $optionValues = $variant->relationLoaded('optionValues')
            ? $variant->optionValues
            : collect();

        $formattedOptions = $optionValues->map(function ($optionValue) {
            $optionName = $optionValue->option?->name ?? null;

            return [
                'id' => $optionValue->id,
                'global_variant_value_id' => $optionValue->global_variant_value_id ?? null,
                'global_variant_name' => $optionName,
                'name' => $optionName,
                'option_name' => $optionName,
                'value' => $optionValue->value ?? null,
                'color_code' => $optionValue->color_code ?? null,
                'image_path' => $optionValue->image_path ?? null,
            ];
        })->filter(function ($option) {
            return (
                ! empty($option['option_name']) &&
                $option['value'] !== null
            );
        })->values();

        // Variant image
        $variantImageUrl = null;

        if (! empty($variant->product_media_id)) {
            $variantMedia = $productMedia->firstWhere(
                'id',
                $variant->product_media_id
            );

            if ($variantMedia) {
                $variantImageUrl = $this->resolveMediaUrl($variantMedia);
            }
        }

        // Product image fallback
        if (! $variantImageUrl) {
            $variantImageUrl = $imageUrl;
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
            'image_url' => $variantImageUrl,
            'options' => $formattedOptions,
        ];
    })->values();

    // Product gallery
    $media = $productMedia->map(function ($media) {
        return [
            'id' => $media->id,
            'image_url' => $this->resolveMediaUrl($media),
            'is_cover' => (bool) ($media->is_cover ?? false),
        ];
    })->filter(function ($media) {
        return ! empty($media['image_url']);
    })->values();

    return response()->json([
        'status' => true,

        'product' => [
            'id' => $product->id,
            'title' => $product->title,
            'slug' => $product->slug,

            'summary' => $product->summary,
            'description' => $product->description,
            'specifications' => $product->specifications,

            'type' => $product->type,
            'product_type' => $product->type,

            'price' => $product->price !== null
                ? (float) $product->price
                : 0,

            'compare_at_price' => $product->compare_at_price !== null
                ? (float) $product->compare_at_price
                : 0,

            'quantity' => (int) ($product->quantity ?? 0),
            'track_quantity' => (bool) ($product->track_quantity ?? false),

            'is_featured' => (bool) ($product->is_featured ?? false),
            'preorder_enabled' => (bool) ($product->preorder_enabled ?? false),

            'has_variants' => $formattedVariants->isNotEmpty(),

            'image_url' => $imageUrl,
            'media' => $media,

            'category' => $product->category
                ? [
                    'id' => $product->category->id,
                    'name' => $product->category->name,
                    'slug' => $product->category->slug,
                ]
                : null,

            'brand' => $product->brand
                ? [
                    'id' => $product->brand->id,
                    'name' => $product->brand->name,
                    'slug' => $product->brand->slug,
                ]
                : null,

            'store_name' => 'Storify',
            'variants' => $formattedVariants,
        ],
    ]);
}



// Resolve product image
private function resolveProductImage($product)
{
    if (
        $product->relationLoaded('media') &&
        $product->media &&
        $product->media->isNotEmpty()
    ) {
        $media = $product->media->firstWhere('is_cover', true)
            ?? $product->media->first();

        return $this->resolveMediaUrl($media);
    }

    if (! empty($product->image_url)) {
        return $product->image_url;
    }

    return null;
}

// Resolve media URL
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

    /*
    |--------------------------------------------------------------------------
    | UPDATE PRODUCT
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/products/{id}/update
    |
    */

     public function update(
    Request $request,
    $id
) {
    /*
    |--------------------------------------------------------------------------
    | PRODUCT ACCESS
    |--------------------------------------------------------------------------
    */

    $user =
        $request->user();

    $query =
        Product::query();

    if (
        $user?->role === 'vendor'
    ) {
        $query
            ->where(
                'source',
                'vendor'
            )
            ->where(
                'created_by',
                $user->id
            );
    }

    $product =
        $query->findOrFail(
            $id
        );


    /*
    |--------------------------------------------------------------------------
    | NORMALIZE
    |--------------------------------------------------------------------------
    */

    $this->normalizeProductRequest(
        $request
    );


    /*
    |--------------------------------------------------------------------------
    | VALIDATE
    |--------------------------------------------------------------------------
    */

    $validated =
        $this->validateProduct(
            $request,
            $product->id
        );


    /*
    |--------------------------------------------------------------------------
    | SLUG
    |--------------------------------------------------------------------------
    */

    $slug =
        $request->filled('slug')

            ? Str::slug(
                $request->input(
                    'slug'
                )
            )

            : Str::slug(
                $validated['title']
            );


    $slug =
        $this->makeUniqueSlug(
            $slug,
            $product->id
        );


    $uploadedPaths = [];


    try {

        DB::transaction(
            function () use (
                $request,
                $validated,
                $slug,
                $product,
                &$uploadedPaths
            ) {

                /*
                |--------------------------------------------------------------------------
                | UPDATE PRODUCT
                |--------------------------------------------------------------------------
                */

                $product->update(
                    $this->productPayload(

                        request:
                            $request,

                        validated:
                            $validated,

                        slug:
                            $slug,

                        product:
                            $product

                    )
                );


                /*
                |--------------------------------------------------------------------------
                | COLLECTIONS
                |--------------------------------------------------------------------------
                */

                $this->syncCollections(

                    product:
                        $product,

                    collectionIds:
                        $validated[
                            'collection_ids'
                        ]
                        ?? []

                );


                /*
                |--------------------------------------------------------------------------
                | DELETE SELECTED MEDIA
                |--------------------------------------------------------------------------
                */

                $this->deleteSelectedMedia(

                    product:
                        $product,

                    mediaIds:
                        $validated[
                            'deleted_media_ids'
                        ]
                        ?? []

                );


                /*
                |--------------------------------------------------------------------------
                | UPLOAD NEW MEDIA
                |--------------------------------------------------------------------------
                */

                $mediaResult =
                    $this->uploadNewMedia(

                        product:
                            $product,

                        request:
                            $request

                    );


                $uploadedPaths =
                    $mediaResult[
                        'uploaded_paths'
                    ];


                /*
                |--------------------------------------------------------------------------
                | COVER
                |--------------------------------------------------------------------------
                */

                if (
                    $request->filled(
                        'cover_media_id'
                    )
                ) {

                    $this->setCoverMedia(

                        product:
                            $product,

                        mediaId:
                            $request->input(
                                'cover_media_id'
                            )

                    );
                }


                /*
                |--------------------------------------------------------------------------
                | PRODUCT OPTIONS
                |--------------------------------------------------------------------------
                */

                $optionMap =
                    $this->syncProductOptions(

                        product:
                            $product,

                        options:
                            $validated[
                                'options'
                            ]
                            ?? []

                    );


                /*
                |--------------------------------------------------------------------------
                | VARIANTS
                |--------------------------------------------------------------------------
                */

                if (
                    $request->exists(
                        'variants'
                    )
                ) {

                    $this->syncVariants(

                        product:
                            $product,

                        variants:
                            $validated[
                                'variants'
                            ]
                            ?? [],

                        optionMap:
                            $optionMap,

                        newMediaMap:
                            $mediaResult[
                                'new_media_map'
                            ]

                    );
                }


                /*
                |--------------------------------------------------------------------------
                | INVENTORY LEVELS
                |--------------------------------------------------------------------------
                */

                $this->syncInventoryLevelsFromProduct(
                            product:
                                $product,

                            inventoryByLocation:
                                $validated[
                                    'inventory_by_location'
                                ]
                                ?? null
                        );

            }
        );


        return response()->json([

            'status' => true,

            'message' =>
                'Product updated successfully.',

            'product' =>
                $this->loadProductData(
                    $product->id
                ),

        ]);

    } catch (\Throwable $error) {

        foreach (
            $uploadedPaths
            as $path
        ) {

            $this->deleteFile(
                $path
            );

        }


        if (
            $error instanceof
            ValidationException
        ) {

            throw $error;

        }


        report($error);


        return response()->json([

            'status' => false,

            'message' =>
                'Unable to update product.',

        ], 500);
    }
}

    /*
    |--------------------------------------------------------------------------
    | DELETE PRODUCT
    |--------------------------------------------------------------------------
    |
    | DELETE /api/admin/products/{id}
    |
    */

    public function destroy($id)
    {
        $product =
            Product::with(
                'media'
            )
            ->findOrFail(
                $id
            );


        $files =
            $product
            ->media
            ->pluck(
                'file_path'
            )
            ->filter()
            ->values()
            ->all();


        try {

            $product->delete();


            /*
            |--------------------------------------------------------------------------
            | DELETE PHYSICAL FILES
            |--------------------------------------------------------------------------
            */

            foreach (
                $files
                as $file
            ) {

                $this->deleteFile(
                    $file
                );
            }


            /*
            |--------------------------------------------------------------------------
            | REMOVE EMPTY PRODUCT DIRECTORY
            |--------------------------------------------------------------------------
            */

            $directory =
                public_path(
                    'uploads/products/'
                        . $product->id
                );


            if (
                File::exists(
                    $directory
                )
            ) {

                File::deleteDirectory(
                    $directory
                );
            }


            return response()->json([

                'status' => true,

                'message' =>
                'Product deleted successfully.',

            ]);
        } catch (\Throwable $error) {

            report($error);


            return response()->json([

                'status' => false,

                'message' =>
                'Unable to delete product.',

            ], 500);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | TOGGLE FEATURED
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/products/{id}/toggle-featured
    |
    */

    public function toggleFeatured($id)
    {
        $product =
            Product::findOrFail(
                $id
            );


        $product->is_featured =
            ! $product->is_featured;


        $product->save();


        return response()->json([

            'status' => true,

            'message' =>
            $product->is_featured

                ? 'Product marked as featured.'

                : 'Product removed from featured products.',

            'is_featured' =>
            (bool)
            $product->is_featured,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | SET MEDIA COVER
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/products/{productId}/media/{mediaId}/cover
    |
    */

    public function setCover(
        $productId,
        $mediaId
    ) {
        $product =
            Product::findOrFail(
                $productId
            );


        $this->setCoverMedia(
            $product,
            $mediaId
        );


        return response()->json([

            'status' => true,

            'message' =>
            'Product cover updated successfully.',

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE SINGLE MEDIA
    |--------------------------------------------------------------------------
    |
    | DELETE /api/admin/products/{productId}/media/{mediaId}
    |
    */

    public function destroyMedia(
        $productId,
        $mediaId
    ) {
        $product =
            Product::findOrFail(
                $productId
            );


        $media =
            $product
            ->media()
            ->where(
                'id',
                $mediaId
            )
            ->firstOrFail();


        $wasCover =
            (bool)
            $media->is_cover;


        $path =
            $media->file_path;


        $media->delete();


        $this->deleteFile(
            $path
        );


        /*
        |--------------------------------------------------------------------------
        | ASSIGN NEXT COVER
        |--------------------------------------------------------------------------
        */

        if ($wasCover) {

            $next =
                $product
                ->media()
                ->orderBy(
                    'sort_order'
                )
                ->first();


            if ($next) {

                $next->update([
                    'is_cover' =>
                    true,
                ]);
            }
        }


        return response()->json([

            'status' => true,

            'message' =>
            'Product media deleted successfully.',

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | REORDER MEDIA
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/products/{id}/media/reorder
    |
    */

    public function reorderMedia(
        Request $request,
        $id
    ) {
        $product =
            Product::findOrFail(
                $id
            );


        $validated =
            $request->validate([

                'media' => [
                    'required',
                    'array',
                ],

                'media.*.id' => [
                    'required',
                    'integer',
                ],

                'media.*.sort_order' => [
                    'required',
                    'integer',
                    'min:0',
                ],

            ]);


        DB::transaction(
            function () use (
                $product,
                $validated
            ) {

                foreach (
                    $validated['media']
                    as $item
                ) {

                    $product
                        ->media()
                        ->where(
                            'id',
                            $item['id']
                        )
                        ->update([

                            'sort_order' =>
                            $item['sort_order'],

                        ]);
                }
            }
        );


        return response()->json([

            'status' => true,

            'message' =>
            'Product media reordered successfully.',

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | VALIDATE PRODUCT
    |--------------------------------------------------------------------------
    */

    private function validateProduct(
        Request $request,
        $productId = null
    ): array {

        return $request->validate([

            /*
            |--------------------------------------------------------------------------
            | DETAILS
            |--------------------------------------------------------------------------
            */

            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
            ],

            'summary' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'specifications' => [
                'nullable',
                'string',
            ],


            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            'status' => [
                'required',

                Rule::in([
                    'active',
                    'draft',
                    'archived',
                ]),
            ],

            'is_featured' => [
                'nullable',
            ],


            /*
            |--------------------------------------------------------------------------
            | PUBLISHING
            |--------------------------------------------------------------------------
            */

            'online_store' => [
                'nullable',
            ],

            'point_of_sale' => [
                'nullable',
            ],


            /*
            |--------------------------------------------------------------------------
            | ORGANIZATION
            |--------------------------------------------------------------------------
            */

            'category_id' => [
                'required',
                'integer',
                'exists:categories,id',
            ],

            'brand_id' => [
                'nullable',
                'integer',
                'exists:brands,id',
            ],

            'type' => [
                'nullable',
                'string',
                'max:100',
            ],

            'tags' => [
                'nullable',
                'array',
            ],

            'tags.*' => [
                'string',
                'max:100',
            ],

            'collection_ids' => [
                'nullable',
                'array',
            ],

            'collection_ids.*' => [
                'integer',
                'exists:collections,id',
            ],


            /*
            |--------------------------------------------------------------------------
            | FORMAT
            |--------------------------------------------------------------------------
            */

            'product_format' => [
                'nullable',
                'string',
                'max:30',
            ],


            /*
            |--------------------------------------------------------------------------
            | PREORDER
            |--------------------------------------------------------------------------
            */

            'preorder_enabled' => [
                'nullable',
            ],


            /*
            |--------------------------------------------------------------------------
            | BASE PRICING
            |--------------------------------------------------------------------------
            */

            'price' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'compare_at_price' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'cost_per_item' => [
                'nullable',
                'numeric',
                'min:0',
            ],


            /*
            |--------------------------------------------------------------------------
            | BASE INVENTORY
            |--------------------------------------------------------------------------
            */

            'sku' => [
                'nullable',
                'string',
                'max:255',

                Rule::unique(
                    'products',
                    'sku'
                )
                    ->ignore(
                        $productId
                    ),
            ],

            'barcode' => [
                'nullable',
                'string',
                'max:255',
            ],

            'quantity' => [
                'nullable',
                'integer',
            ],

            'inventory_by_location' => [
                'nullable',
                'array',
            ],

            'inventory_by_location.*.location_id' => [
                'required',
                'integer',
                'distinct',
                'exists:inventory_locations,id',
            ],

            'inventory_by_location.*.quantity' => [
                'required',
                'integer',
                'min:0',
            ],

            'track_quantity' => [
                'nullable',
            ],

            'continue_selling_when_out_of_stock' => [
                'nullable',
            ],


            /*
            |--------------------------------------------------------------------------
            | SHIPPING
            |--------------------------------------------------------------------------
            */

            'weight' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'weight_unit' => [
                'nullable',

                Rule::in([
                    'kg',
                    'g',
                    'lb',
                    'oz',
                ]),
            ],

            'country_of_origin' => [
                'nullable',
                'string',
                'max:100',
            ],

            'hs_code' => [
                'nullable',
                'string',
                'max:50',
            ],

            'customs_description' => [
                'nullable',
                'string',
                'max:255',
            ],


            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */

            'seo_title' => [
                'nullable',
                'string',
                'max:70',
            ],

            'seo_description' => [
                'nullable',
                'string',
                'max:160',
            ],


            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */

            'media' => [
                'nullable',
                'array',
                'max:10',
            ],

            'media.*' => [
                'file',

                'mimes:jpg,jpeg,png,webp,mp4,webm',

                'max:20480',
            ],

            'media_alt_texts' => [
                'nullable',
                'array',
            ],

            'cover_media_index' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'cover_media_id' => [
                'nullable',
                'integer',
            ],

            'deleted_media_ids' => [
                'nullable',
                'array',
            ],

            'deleted_media_ids.*' => [
                'integer',
            ],


            /*
            |--------------------------------------------------------------------------
            | GLOBAL OPTIONS
            |--------------------------------------------------------------------------
            */

            'options' => [
                'nullable',
                'array',
            ],

            'options.*.global_variant_id' => [
                'required',
                'integer',
                'exists:global_variants,id',
            ],

            'options.*.sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'options.*.values' => [
                'required',
                'array',
                'min:1',
            ],

            'options.*.values.*.global_variant_value_id' => [
                'required',
                'integer',
                'exists:global_variant_values,id',
            ],

            'options.*.values.*.sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],


            /*
            |--------------------------------------------------------------------------
            | PRODUCT VARIANTS
            |--------------------------------------------------------------------------
            */

            'variants' => [
                'nullable',
                'array',
            ],

            'variants.*.id' => [
                'nullable',
                'integer',
            ],

            'variants.*.title' => [
                'nullable',
                'string',
                'max:255',
            ],

            'variants.*.global_variant_value_ids' => [
                'required',
                'array',
                'min:1',
            ],

            'variants.*.global_variant_value_ids.*' => [
                'integer',
                'exists:global_variant_values,id',
            ],

            'variants.*.price' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'variants.*.compare_at_price' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'variants.*.cost_per_item' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'variants.*.sku' => [
                'nullable',
                'string',
                'max:255',
            ],

            'variants.*.barcode' => [
                'nullable',
                'string',
                'max:255',
            ],

            'variants.*.quantity' => [
                'nullable',
                'integer',
            ],

            'variants.*.is_active' => [
                'nullable',
            ],

            'variants.*.sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

            /*
            |--------------------------------------------------------------------------
            | EXISTING MEDIA
            |--------------------------------------------------------------------------
            */

            'variants.*.product_media_id' => [
                'nullable',
                'integer',
            ],

            /*
            |--------------------------------------------------------------------------
            | NEWLY UPLOADED MEDIA INDEX
            |--------------------------------------------------------------------------
            */

            'variants.*.media_index' => [
                'nullable',
                'integer',
                'min:0',
            ],

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PRODUCT PAYLOAD
    |--------------------------------------------------------------------------
    */

   private function productPayload(
    Request $request,
    array $validated,
    string $slug,
    ?Product $product = null
): array {

    $user = $request->user();

    $source = $product
        ? $product->source
        : (
            $user?->role === 'vendor'
                ? 'vendor'
                : 'admin'
        );

    return [

        'title' =>
        trim(
            $validated['title']
        ),

        'slug' =>
        $slug,

        'summary' =>
        $validated['summary']
            ?? null,

        'description' =>
        $validated['description']
            ?? null,

        'specifications' =>
        $validated['specifications']
            ?? null,


        /*
        |--------------------------------------------------------------------------
        | STATUS
        |--------------------------------------------------------------------------
        */

        'status' =>
        $validated['status'],

        'is_featured' =>
        $this->toBoolean(
            $request->input(
                'is_featured',
                false
            )
        ),


        /*
        |--------------------------------------------------------------------------
        | PUBLISHING
        |--------------------------------------------------------------------------
        */

        'online_store' =>
        $this->toBoolean(
            $request->input(
                'online_store',
                true
            )
        ),

        'point_of_sale' =>
        $this->toBoolean(
            $request->input(
                'point_of_sale',
                true
            )
        ),


        /*
        |--------------------------------------------------------------------------
        | ORGANIZATION
        |--------------------------------------------------------------------------
        */

        'category_id' =>
        $validated['category_id'],

        'brand_id' =>
        $validated['brand_id']
            ?? null,

        'type' =>
        $validated['type']
            ?? null,

        'tags' =>
        $validated['tags']
            ?? [],


        /*
        |--------------------------------------------------------------------------
        | OWNER
        |--------------------------------------------------------------------------
        */

        'source' =>
        $source,

        'created_by' =>
        $product
            ? $product->created_by
            : $user?->id,


        /*
        |--------------------------------------------------------------------------
        | FORMAT
        |--------------------------------------------------------------------------
        */

        'product_format' =>
        $validated['product_format']
            ?? 'physical',


        /*
        |--------------------------------------------------------------------------
        | PREORDER
        |--------------------------------------------------------------------------
        */

        'preorder_enabled' =>
        $this->toBoolean(
            $request->input(
                'preorder_enabled',
                false
            )
        ),


        /*
        |--------------------------------------------------------------------------
        | PRICING
        |--------------------------------------------------------------------------
        */

        'price' =>
        $validated['price']
            ?? null,

        'compare_at_price' =>
        $validated['compare_at_price']
            ?? null,

        'cost_per_item' =>
        $validated['cost_per_item']
            ?? null,


        /*
        |--------------------------------------------------------------------------
        | INVENTORY
        |--------------------------------------------------------------------------
        */

        'sku' =>
        $validated['sku']
            ?? null,

        'barcode' =>
        $validated['barcode']
            ?? null,

        'quantity' =>
        $validated['quantity']
            ?? 0,

        'track_quantity' =>
        $this->toBoolean(
            $request->input(
                'track_quantity',
                true
            )
        ),

        'continue_selling_when_out_of_stock' =>
        $this->toBoolean(
            $request->input(
                'continue_selling_when_out_of_stock',
                false
            )
        ),


        /*
        |--------------------------------------------------------------------------
        | SHIPPING
        |--------------------------------------------------------------------------
        */

        'weight' =>
        $validated['weight']
            ?? 0,

        'weight_unit' =>
        $validated['weight_unit']
            ?? 'kg',

        'country_of_origin' =>
        $validated['country_of_origin']
            ?? null,

        'hs_code' =>
        $validated['hs_code']
            ?? null,

        'customs_description' =>
        $validated['customs_description']
            ?? null,


        /*
        |--------------------------------------------------------------------------
        | SEO
        |--------------------------------------------------------------------------
        */

        'seo_title' =>
        $validated['seo_title']
            ?? null,

        'seo_description' =>
        $validated['seo_description']
            ?? null,

    ];
}


    /*
    |--------------------------------------------------------------------------
    | NORMALIZE FORM DATA
    |--------------------------------------------------------------------------
    */

   private function normalizeProductRequest(
    Request $request
): void {
    $jsonFields = [
        'tags',
        'collection_ids',
        'options',
        'variants',
        'inventory_by_location',
        'media_alt_texts',
        'deleted_media_ids',
    ];

    foreach (
        $jsonFields
        as $field
    ) {
        if (
            ! $request->has($field)
        ) {
            continue;
        }

        $value =
            $request->input(
                $field
            );

        if (
            is_array($value)
        ) {
            continue;
        }

        if (
            is_string($value)
        ) {
            $decoded =
                json_decode(
                    $value,
                    true
                );

            if (
                json_last_error()
                === JSON_ERROR_NONE &&
                is_array($decoded)
            ) {
                $request->merge([
                    $field =>
                        $decoded,
                ]);
            }
        }
    }
}


    /*
    |--------------------------------------------------------------------------
    | COLLECTION SYNC
    |--------------------------------------------------------------------------
    */

    private function syncCollections(
        Product $product,
        array $collectionIds
    ): void {

        $collectionIds =
            collect(
                $collectionIds
            )
            ->map(
                fn($id) =>
                (int) $id
            )
            ->unique()
            ->values();


        $existing =
            DB::table(
                'collection_product'
            )
            ->where(
                'product_id',
                $product->id
            )
            ->get()
            ->keyBy(
                'collection_id'
            );


        $syncData = [];


        foreach (
            $collectionIds
            as $collectionId
        ) {

            if (
                isset(
                    $existing[$collectionId]
                )
            ) {

                $sortOrder =
                    (int)
                    $existing[$collectionId]
                        ->sort_order;
            } else {

                $sortOrder =
                    (
                        (int)
                        DB::table(
                            'collection_product'
                        )
                            ->where(
                                'collection_id',
                                $collectionId
                            )
                            ->max(
                                'sort_order'
                            )
                    ) + 1;
            }


            $syncData[$collectionId] = [

                'sort_order' =>
                $sortOrder,

            ];
        }


        $product
            ->collections()
            ->sync(
                $syncData
            );
    }


    /*
    |--------------------------------------------------------------------------
    | SYNC PRODUCT OPTIONS
    |--------------------------------------------------------------------------
    |
    | Return:
    |
    | [
    |   global_variant_value_id => [
    |       product_option_value_id,
    |       value,
    |       option_sort
    |   ]
    | ]
    |
    */

    private function syncProductOptions(
        Product $product,
        array $options
    ): array {

        $existingOptions =
            $product
            ->options()
            ->with('values')
            ->get()
            ->keyBy(
                'global_variant_id'
            );


        $keepOptionIds = [];

        $optionMap = [];


        foreach (
            $options
            as $optionIndex => $item
        ) {

            $globalVariant =
                GlobalVariant::with(
                    'values'
                )
                ->findOrFail(
                    $item['global_variant_id']
                );


            /*
            |--------------------------------------------------------------------------
            | EXISTING OR NEW PRODUCT OPTION
            |--------------------------------------------------------------------------
            */

            $productOption =
                $existingOptions->get(
                    $globalVariant->id
                );


            if (! $productOption) {

                $productOption =
                    $product
                    ->options()
                    ->create([

                        'global_variant_id' =>
                        $globalVariant
                            ->id,

                        'name' =>
                        $globalVariant
                            ->name,

                        'sort_order' =>
                        $item['sort_order']
                            ?? $optionIndex,

                    ]);
            } else {

                $productOption->update([

                    'name' =>
                    $globalVariant->name,

                    'sort_order' =>
                    $item['sort_order']
                        ?? $optionIndex,

                ]);
            }


            $keepOptionIds[] =
                $productOption->id;


            /*
            |--------------------------------------------------------------------------
            | EXISTING PRODUCT OPTION VALUES
            |--------------------------------------------------------------------------
            */

            $existingValues =
                $productOption
                ->values()
                ->get()
                ->keyBy(
                    'global_variant_value_id'
                );


            $keepValueIds = [];


            foreach (
                $item['values']
                as $valueIndex => $valueItem
            ) {

                $globalValue =
                    GlobalVariantValue::where(
                        'id',
                        $valueItem['global_variant_value_id']
                    )
                    ->where(
                        'global_variant_id',
                        $globalVariant->id
                    )
                    ->first();


                if (! $globalValue) {

                    throw ValidationException::withMessages([

                        'options' => [
                            "Variant value does not belong to {$globalVariant->name}.",
                        ],

                    ]);
                }


                $productValue =
                    $existingValues->get(
                        $globalValue->id
                    );


                if (! $productValue) {

                    $productValue =
                        $productOption
                        ->values()
                        ->create([

                            'global_variant_value_id' =>
                            $globalValue
                                ->id,

                            'value' =>
                            $globalValue
                                ->value,

                            'color_code' =>
                            $globalValue
                                ->color_code,

                            'sort_order' =>
                            $valueItem['sort_order']
                                ?? $valueIndex,

                        ]);
                } else {

                    $productValue->update([

                        'value' =>
                        $globalValue
                            ->value,

                        'color_code' =>
                        $globalValue
                            ->color_code,

                        'sort_order' =>
                        $valueItem['sort_order']
                            ?? $valueIndex,

                    ]);
                }


                $keepValueIds[] =
                    $productValue->id;


                $optionMap[$globalValue->id] = [

                    'product_option_value_id' =>
                    $productValue
                        ->id,

                    'value' =>
                    $productValue
                        ->value,

                    'option_sort' =>
                    $productOption
                        ->sort_order,

                    'value_sort' =>
                    $productValue
                        ->sort_order,

                ];
            }


            /*
            |--------------------------------------------------------------------------
            | REMOVE UNSELECTED VALUES
            |--------------------------------------------------------------------------
            */

            $productOption
                ->values()
                ->whereNotIn(
                    'id',
                    $keepValueIds ?: [0]
                )
                ->delete();
        }


        /*
        |--------------------------------------------------------------------------
        | REMOVE UNSELECTED OPTIONS
        |--------------------------------------------------------------------------
        */

        $product
            ->options()
            ->whereNotIn(
                'id',
                $keepOptionIds ?: [0]
            )
            ->delete();


        return $optionMap;
    }


    /*
    |--------------------------------------------------------------------------
    | BUILD AUTO VARIANT COMBINATIONS
    |--------------------------------------------------------------------------
    */

    private function buildAutoVariantPayload(
        array $options,
        Product $product
    ): array {

        $groups = [];


        foreach (
            $options
            as $option
        ) {

            $ids =
                collect(
                    $option['values']
                        ?? []
                )
                ->pluck(
                    'global_variant_value_id'
                )
                ->map(
                    fn($id) =>
                    (int) $id
                )
                ->filter()
                ->values()
                ->all();


            if (! empty($ids)) {

                $groups[] =
                    $ids;
            }
        }


        if (empty($groups)) {

            return [];
        }


        $combinations = [
            [],
        ];


        foreach (
            $groups
            as $group
        ) {

            $next = [];


            foreach (
                $combinations
                as $combination
            ) {

                foreach (
                    $group
                    as $valueId
                ) {

                    $next[] = [
                        ...$combination,
                        $valueId,
                    ];
                }
            }


            $combinations =
                $next;


            /*
            |--------------------------------------------------------------------------
            | SAFETY LIMIT
            |--------------------------------------------------------------------------
            */

            if (
                count(
                    $combinations
                ) > 100
            ) {

                throw ValidationException::withMessages([

                    'options' => [
                        'A product can have a maximum of 100 generated variant combinations.',
                    ],

                ]);
            }
        }


        return collect(
            $combinations
        )
            ->map(
                function (
                    $combination,
                    $index
                ) use (
                    $product
                ) {

                    return [

                        'global_variant_value_ids' =>
                        $combination,

                        'price' =>
                        $product->price,

                        'compare_at_price' =>
                        $product
                            ->compare_at_price,

                        'cost_per_item' =>
                        $product
                            ->cost_per_item,

                        'quantity' =>
                        $product->quantity,

                        'is_active' =>
                        true,

                        'sort_order' =>
                        $index,

                    ];
                }
            )
            ->values()
            ->all();
    }


    /*
    |--------------------------------------------------------------------------
    | SYNC PRODUCT VARIANTS
    |--------------------------------------------------------------------------
    */

    private function syncVariants(
        Product $product,
        array $variants,
        array $optionMap,
        array $newMediaMap = []
    ): void {

        /*
        |--------------------------------------------------------------------------
        | NO OPTIONS = NO VARIANTS
        |--------------------------------------------------------------------------
        */

        if (empty($optionMap)) {

            $product
                ->variants()
                ->delete();


            return;
        }


        $existingVariants =
            $product
            ->variants()
            ->with(
                'optionValues'
            )
            ->get()
            ->keyBy('id');


        $keepVariantIds = [];


        foreach (
            $variants
            as $index => $item
        ) {

            $globalValueIds =
                collect(
                    $item['global_variant_value_ids']
                        ?? []
                )
                ->map(
                    fn($id) =>
                    (int) $id
                )
                ->unique()
                ->values();


            /*
            |--------------------------------------------------------------------------
            | MAP GLOBAL VALUES -> PRODUCT OPTION VALUES
            |--------------------------------------------------------------------------
            */

            $selected = [];


            foreach (
                $globalValueIds
                as $globalValueId
            ) {

                if (
                    ! isset(
                        $optionMap[$globalValueId]
                    )
                ) {

                    throw ValidationException::withMessages([

                        'variants' => [
                            'A variant contains an option value that is not selected for this product.',
                        ],

                    ]);
                }


                $selected[] =
                    $optionMap[$globalValueId];
            }


            /*
            |--------------------------------------------------------------------------
            | SORT BY OPTION ORDER
            |--------------------------------------------------------------------------
            */

            usort(
                $selected,
                function ($a, $b) {

                    if (
                        $a['option_sort']
                        ===
                        $b['option_sort']
                    ) {

                        return
                            $a['value_sort']
                            <=>
                            $b['value_sort'];
                    }


                    return
                        $a['option_sort']
                        <=>
                        $b['option_sort'];
                }
            );


            $productOptionValueIds =
                collect(
                    $selected
                )
                ->pluck(
                    'product_option_value_id'
                )
                ->map(
                    fn($id) =>
                    (int) $id
                )
                ->all();


            /*
            |--------------------------------------------------------------------------
            | COMBINATION KEY
            |--------------------------------------------------------------------------
            */

            $sortedForKey =
                $productOptionValueIds;


            sort(
                $sortedForKey,
                SORT_NUMERIC
            );


            $combinationKey =
                implode(
                    '-',
                    $sortedForKey
                );


            /*
            |--------------------------------------------------------------------------
            | TITLE
            |--------------------------------------------------------------------------
            */

            $title =
                trim(
                    $item['title']
                        ?? ''
                );


            if ($title === '') {

                $title =
                    collect(
                        $selected
                    )
                    ->pluck('value')
                    ->implode(' / ');
            }


            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */

            $mediaId =
                $this->resolveVariantMediaId(

                    product: $product,

                    item: $item,

                    newMediaMap: $newMediaMap

                );


            /*
            |--------------------------------------------------------------------------
            | EXISTING VARIANT
            |--------------------------------------------------------------------------
            */

            $variant = null;


            if (
                ! empty($item['id'])
            ) {

                $variant =
                    $existingVariants->get(
                        (int)
                        $item['id']
                    );
            }


            /*
            |--------------------------------------------------------------------------
            | FALLBACK BY COMBINATION
            |--------------------------------------------------------------------------
            */

            if (! $variant) {

                $variant =
                    $product
                    ->variants()
                    ->where(
                        'combination_key',
                        $combinationKey
                    )
                    ->first();
            }


            $payload = [

                'title' =>
                $title,

                'combination_key' =>
                $combinationKey,

                'product_media_id' =>
                $mediaId,

                'price' =>
                $item['price']
                    ?? null,

                'compare_at_price' =>
                $item['compare_at_price']
                    ?? null,

                'cost_per_item' =>
                $item['cost_per_item']
                    ?? null,

                'sku' =>
                ! empty($item['sku'])
                    ? trim(
                        $item['sku']
                    )
                    : null,

                'barcode' =>
                ! empty($item['barcode'])
                    ? trim(
                        $item['barcode']
                    )
                    : null,

                'quantity' =>
                $item['quantity']
                    ?? 0,

                'is_active' =>
                $this->toBoolean(
                    $item['is_active']
                        ?? true
                ),

                'sort_order' =>
                $item['sort_order']
                    ?? $index,

            ];


            if ($variant) {

                $variant->update(
                    $payload
                );
            } else {

                $variant =
                    $product
                    ->variants()
                    ->create(
                        $payload
                    );
            }


            /*
            |--------------------------------------------------------------------------
            | OPTION VALUES PIVOT
            |--------------------------------------------------------------------------
            */

            $variant
                ->optionValues()
                ->sync(
                    $productOptionValueIds
                );


            $keepVariantIds[] =
                $variant->id;
        }


        /*
        |--------------------------------------------------------------------------
        | DELETE REMOVED VARIANTS
        |--------------------------------------------------------------------------
        */

        $product
            ->variants()
            ->whereNotIn(
                'id',
                $keepVariantIds ?: [0]
            )
            ->delete();
    }


    /*
    |--------------------------------------------------------------------------
    | RESOLVE VARIANT MEDIA
    |--------------------------------------------------------------------------
    */

    private function resolveVariantMediaId(
        Product $product,
        array $item,
        array $newMediaMap
    ): ?int {

        /*
        |--------------------------------------------------------------------------
        | EXISTING MEDIA
        |--------------------------------------------------------------------------
        */

        if (
            ! empty($item['product_media_id'])
        ) {

            $media =
                $product
                ->media()
                ->where(
                    'id',
                    $item['product_media_id']
                )
                ->first();


            return
                $media
                ? $media->id
                : null;
        }


        /*
        |--------------------------------------------------------------------------
        | NEW MEDIA INDEX
        |--------------------------------------------------------------------------
        */

        if (
            isset(
                $item['media_index']
            )
        ) {

            $index =
                (int)
                $item['media_index'];


            return
                $newMediaMap[$index]
                ?? null;
        }


        return null;
    }


    /*
    |--------------------------------------------------------------------------
    | UPLOAD PRODUCT MEDIA
    |--------------------------------------------------------------------------
    */

    private function uploadNewMedia(
        Product $product,
        Request $request
    ): array {

        $files =
            $request->file(
                'media',
                []
            );


        if (! is_array($files)) {

            $files = [
                $files,
            ];
        }


        $altTexts =
            $request->input(
                'media_alt_texts',
                []
            );


        $coverIndex =
            $request->filled(
                'cover_media_index'
            )
            ? (int)
            $request->input(
                'cover_media_index'
            )
            : null;


        $currentMax =
            (int)
            $product
                ->media()
                ->max(
                    'sort_order'
                );


        $hasCover =
            $product
            ->media()
            ->where(
                'is_cover',
                true
            )
            ->exists();


        $uploadedPaths = [];

        $newMediaMap = [];


        foreach (
            $files
            as $index => $file
        ) {

            if (
                ! $file instanceof
                    UploadedFile
            ) {

                continue;
            }


            $stored =
                $this->storeProductFile(

                    product: $product,

                    file: $file

                );


            $uploadedPaths[] =
                $stored['path'];


            /*
            |--------------------------------------------------------------------------
            | COVER
            |--------------------------------------------------------------------------
            */

            $isCover =
                $coverIndex !== null

                ? $index ===
                $coverIndex

                : (
                    ! $hasCover &&
                    $index === 0
                );


            if ($isCover) {

                $product
                    ->media()
                    ->update([
                        'is_cover' =>
                        false,
                    ]);

                $hasCover = true;
            }


            $media =
                $product
                ->media()
                ->create([

                    'file_path' =>
                    $stored['path'],

                    'media_type' =>
                    $stored['type'],

                    'alt_text' =>
                    $altTexts[$index]
                        ?? null,

                    'is_cover' =>
                    $isCover,

                    'sort_order' =>
                    $currentMax +
                        $index +
                        1,

                ]);


            $newMediaMap[$index] = $media->id;
        }


        return [

            'uploaded_paths' =>
            $uploadedPaths,

            'new_media_map' =>
            $newMediaMap,

        ];
    }


    /*
    |--------------------------------------------------------------------------
    | STORE PRODUCT FILE
    |--------------------------------------------------------------------------
    */

    private function storeProductFile(
        Product $product,
        UploadedFile $file
    ): array {

        $directory =
            public_path(
                'uploads/products/'
                    . $product->id
            );


        if (
            ! File::exists(
                $directory
            )
        ) {

            File::makeDirectory(
                $directory,
                0755,
                true
            );
        }


        $extension =
            strtolower(
                $file
                    ->getClientOriginalExtension()
            );


        $fileName =
            time()
            . '-'
            . Str::random(14)
            . '.'
            . $extension;


        $file->move(
            $directory,
            $fileName
        );


        $mime =
            strtolower(
                $file
                    ->getClientMimeType()
                    ?? ''
            );


        $type =
            Str::startsWith(
                $mime,
                'video/'
            )
            ? 'video'
            : 'image';


        return [

            'path' =>
            'uploads/products/'
                . $product->id
                . '/'
                . $fileName,

            'type' =>
            $type,

        ];
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE SELECTED MEDIA
    |--------------------------------------------------------------------------
    */

    private function deleteSelectedMedia(
        Product $product,
        array $mediaIds
    ): void {

        if (empty($mediaIds)) {

            return;
        }


        $mediaItems =
            $product
            ->media()
            ->whereIn(
                'id',
                $mediaIds
            )
            ->get();


        foreach (
            $mediaItems
            as $media
        ) {

            $wasCover =
                (bool)
                $media->is_cover;


            $path =
                $media->file_path;


            $media->delete();


            $this->deleteFile(
                $path
            );


            if ($wasCover) {

                $next =
                    $product
                    ->media()
                    ->orderBy(
                        'sort_order'
                    )
                    ->first();


                if ($next) {

                    $next->update([
                        'is_cover' =>
                        true,
                    ]);
                }
            }
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SET COVER
    |--------------------------------------------------------------------------
    */

    private function setCoverMedia(
        Product $product,
        $mediaId
    ): void {

        $media =
            $product
            ->media()
            ->where(
                'id',
                $mediaId
            )
            ->firstOrFail();


        $product
            ->media()
            ->update([
                'is_cover' =>
                false,
            ]);


        $media->update([
            'is_cover' =>
            true,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PRODUCT LIST DATA
    |--------------------------------------------------------------------------
    */

    private function productListData(
        Product $product
    ): array {

        $cover =
            $product
            ->media
            ->firstWhere(
                'is_cover',
                true
            )
            ??
            $product
            ->media
            ->first();


        $hasVariants =
            (int)
            (
                $product
                ->variants_count
                ?? 0
            ) > 0;


        $price =
            $hasVariants

            ? (
                $product
                ->variant_min_price
                !== null

                ? (float)
                $product
                    ->variant_min_price

                : null
            )

            : (
                $product->price
                !== null

                ? (float)
                $product->price

                : null
            );


        $inventory =
            $hasVariants

            ? (int)
            (
                $product
                ->variant_inventory
                ?? 0
            )

            : (int)
            $product->quantity;


        return [

            'id' =>
            $product->id,

            'title' =>
            $product->title,

            'slug' =>
            $product->slug,

            'image_url' =>
            $cover

                ? asset(
                    $cover->file_path
                )

                : null,

            'category' =>
            $product->category
                ? [
                    'id' =>
                    $product
                        ->category
                        ->id,

                    'name' =>
                    $product
                        ->category
                        ->name,
                ]
                : null,

            'brand' =>
            $product->brand
                ? [
                    'id' =>
                    $product
                        ->brand
                        ->id,

                    'name' =>
                    $product
                        ->brand
                        ->name,
                ]
                : null,

            'source' =>
            $product->source,

            'store_name' =>
            $product->source
                ===
                'vendor'

                ? (
                    $product
                    ->creator
                    ->name
                    ?? 'Vendor'
                )

                : config(
                    'app.name',
                    'Storify'
                ),

            'status' =>
            $product->status,

            'is_featured' =>
            (bool)
            $product
                ->is_featured,

            'inventory' =>
            $inventory,

            'price' =>
            $price,

            'formatted_price' =>
            $price !== null

                ? '$'
                . number_format(
                    $price,
                    2
                )

                : null,

            'variants_count' =>
            (int)
            (
                $product
                ->variants_count
                ?? 0
            ),

            'online_store' =>
            (bool)
            $product
                ->online_store,

            'point_of_sale' =>
            (bool)
            $product
                ->point_of_sale,

        ];
    }


    /*
    |--------------------------------------------------------------------------
    | SYNC INVENTORY LEVELS FROM PRODUCT
    |--------------------------------------------------------------------------
    |
    | Product create/edit stores quantity on products/product_variants.
    | Inventory screens read from inventory_levels.
    |
    | Keep both sources aligned by writing the product/variant quantity to the
    | default active inventory location after every product create/update.
    |
    */

   private function syncInventoryLevelsFromProduct(
    Product $product,
    ?array $inventoryByLocation = null
): void {
    $isVendorProduct =
        $product->source === 'vendor' &&
        ! empty(
            $product->created_by
        );

    /*
    |--------------------------------------------------------------------------
    | OWNER LOCATIONS
    |--------------------------------------------------------------------------
    */

    $locationQuery =
        InventoryLocation::query()
            ->where(
                'is_active',
                true
            );

    if ($isVendorProduct) {
        $locationQuery->where(
            'vendor_id',
            $product->created_by
        );
    } else {
        $locationQuery->whereNull(
            'vendor_id'
        );
    }

    $locations =
        $locationQuery
            ->orderByDesc(
                'is_default'
            )
            ->orderBy(
                'shipping_priority'
            )
            ->orderBy(
                'id'
            )
            ->get()
            ->keyBy('id');

    /*
    |--------------------------------------------------------------------------
    | LOAD VARIANTS
    |--------------------------------------------------------------------------
    */

    $product->load(
        'variants'
    );

    /*
    |--------------------------------------------------------------------------
    | LOCATION INVENTORY
    |--------------------------------------------------------------------------
    */

    if (
        $product
            ->variants
            ->isEmpty() &&
        $inventoryByLocation !== null &&
        $locations->isNotEmpty()
    ) {
        $requestedInventory =
            collect(
                $inventoryByLocation
            )
            ->mapWithKeys(
                function ($item) {
                    $locationId =
                        (int) (
                            $item[
                                'location_id'
                            ]
                            ?? 0
                        );

                    $quantity =
                        max(
                            0,
                            (int) (
                                $item[
                                    'quantity'
                                ]
                                ?? 0
                            )
                        );

                    return [
                        $locationId =>
                            $quantity,
                    ];
                }
            );

        $invalidLocationIds =
            $requestedInventory
                ->keys()
                ->filter(
                    fn($locationId) =>
                        ! $locations
                            ->has(
                                (int) $locationId
                            )
                )
                ->values();

        if (
            $invalidLocationIds
                ->isNotEmpty()
        ) {
            throw ValidationException::withMessages([
                'inventory_by_location' => [
                    'One or more inventory locations are invalid or do not belong to this product owner.',
                ],
            ]);
        }

        $ownerLocationQuery =
            InventoryLocation::query();

        if ($isVendorProduct) {
            $ownerLocationQuery->where(
                'vendor_id',
                $product->created_by
            );
        } else {
            $ownerLocationQuery
                ->whereNull(
                    'vendor_id'
                );
        }

        $ownerLocationIds =
            $ownerLocationQuery
                ->pluck('id');

        InventoryLevel::query()
            ->where(
                'product_id',
                $product->id
            )
            ->whereNull(
                'variant_id'
            )
            ->whereNotIn(
                'location_id',
                $ownerLocationIds
            )
            ->delete();

        foreach (
            $locations
            as $location
        ) {
            $quantity =
                (int) (
                    $requestedInventory
                        ->get(
                            $location->id,
                            0
                        )
                );

            InventoryLevel::updateOrCreate(
                [
                    'location_id' =>
                        $location->id,

                    'product_id' =>
                        $product->id,

                    'variant_id' =>
                        null,
                ],
                [
                    'on_hand' =>
                        $quantity,

                    'committed' =>
                        0,

                    'unavailable' =>
                        0,

                    'incoming' =>
                        0,

                    'low_stock_threshold' =>
                        10,

                    'track_quantity' =>
                        (bool)
                        $product
                            ->track_quantity,
                ]
            );
        }

        $totalQuantity =
            $locations
                ->sum(
                    function ($location) use (
                        $requestedInventory
                    ) {
                        return (int)
                            $requestedInventory
                                ->get(
                                    $location->id,
                                    0
                                );
                    }
                );

        $product->update([
            'quantity' =>
                $totalQuantity,
        ]);

        return;
    }

    /*
    |--------------------------------------------------------------------------
    | EXISTING DEFAULT LOCATION BEHAVIOR
    |--------------------------------------------------------------------------
    */

    $location =
        $locations
            ->first();

    if (
        ! $location &&
        $isVendorProduct
    ) {
        $location =
            InventoryLocation::query()
                ->whereNull(
                    'vendor_id'
                )
                ->where(
                    'is_active',
                    true
                )
                ->orderByDesc(
                    'is_default'
                )
                ->orderBy(
                    'id'
                )
                ->first();
    }

    if (! $location) {
        return;
    }

    if (
        $isVendorProduct &&
        $location->vendor_id
            !== null
    ) {
        $allowedLocationIds =
            InventoryLocation::query()
                ->where(
                    'vendor_id',
                    $product->created_by
                )
                ->pluck('id');

        InventoryLevel::query()
            ->where(
                'product_id',
                $product->id
            )
            ->whereNotIn(
                'location_id',
                $allowedLocationIds
            )
            ->delete();
    }

    if (
        ! $isVendorProduct
    ) {
        $allowedLocationIds =
            InventoryLocation::query()
                ->whereNull(
                    'vendor_id'
                )
                ->pluck('id');

        InventoryLevel::query()
            ->where(
                'product_id',
                $product->id
            )
            ->whereNotIn(
                'location_id',
                $allowedLocationIds
            )
            ->delete();
    }

    if (
        $product
            ->variants
            ->isNotEmpty()
    ) {
        InventoryLevel::query()
            ->where(
                'product_id',
                $product->id
            )
            ->whereNull(
                'variant_id'
            )
            ->delete();

        foreach (
            $product->variants
            as $variant
        ) {
            $this->syncSingleInventoryLevel(
                locationId:
                    (int)
                    $location->id,

                productId:
                    (int)
                    $product->id,

                variantId:
                    (int)
                    $variant->id,

                quantity:
                    max(
                        0,
                        (int)
                        $variant
                            ->quantity
                    ),

                trackQuantity:
                    (bool)
                    $product
                        ->track_quantity
            );
        }

        return;
    }

    $this->syncSingleInventoryLevel(
        locationId:
            (int)
            $location->id,

        productId:
            (int)
            $product->id,

        variantId:
            null,

        quantity:
            max(
                0,
                (int)
                $product
                    ->quantity
            ),

        trackQuantity:
            (bool)
            $product
                ->track_quantity
    );
}


    /*
    |--------------------------------------------------------------------------
    | SYNC ONE INVENTORY LEVEL
    |--------------------------------------------------------------------------
    */

    private function syncSingleInventoryLevel(
        int $locationId,
        int $productId,
        ?int $variantId,
        int $quantity,
        bool $trackQuantity
    ): void {
        $query = InventoryLevel::query()
            ->where(
                'product_id',
                $productId
            );


        if ($variantId === null) {
            $query->whereNull(
                'variant_id'
            );
        } else {
            $query->where(
                'variant_id',
                $variantId
            );
        }


        /*
        | Keep tracking preference aligned across any existing locations.
        */

        (clone $query)->update([
            'track_quantity' =>
                $trackQuantity,
        ]);


        $otherLocationQuantity =
            (int) (clone $query)
                ->where(
                    'location_id',
                    '!=',
                    $locationId
                )
                ->sum(
                    'on_hand'
                );


        $locationQuantity = max(
            0,
            $quantity - $otherLocationQuantity
        );


        $inventoryLevel =
            (clone $query)
                ->where(
                    'location_id',
                    $locationId
                )
                ->first();


        if ($inventoryLevel) {
            $inventoryLevel->update([
                'on_hand' =>
                    $locationQuantity,

                'track_quantity' =>
                    $trackQuantity,
            ]);


            return;
        }


        InventoryLevel::create([
            'location_id' =>
                $locationId,

            'product_id' =>
                $productId,

            'variant_id' =>
                $variantId,

            'on_hand' =>
                $locationQuantity,

            'committed' =>
                0,

            'unavailable' =>
                0,

            'incoming' =>
                0,

            'low_stock_threshold' =>
                10,

            'track_quantity' =>
                $trackQuantity,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | LOAD FULL PRODUCT
    |--------------------------------------------------------------------------
    */

    private function getProductInventoryByLocation(
    Product $product
): array {
    $locationQuery =
        InventoryLocation::query();

    if (
        $product->source ===
            'vendor' &&
        ! empty(
            $product->created_by
        )
    ) {
        $locationQuery->where(
            'vendor_id',
            $product->created_by
        );
    } else {
        $locationQuery
            ->whereNull(
                'vendor_id'
            );
    }

    $locationIds =
        $locationQuery
            ->pluck('id');

    if (
        $locationIds
            ->isEmpty()
    ) {
        return [];
    }

    return InventoryLevel::query()
        ->where(
            'product_id',
            $product->id
        )
        ->whereNull(
            'variant_id'
        )
        ->whereIn(
            'location_id',
            $locationIds
        )
        ->get([
            'location_id',
            'on_hand',
        ])
        ->map(
            fn($item) => [
                'location_id' =>
                    (int)
                    $item->location_id,

                'quantity' =>
                    (int)
                    $item->on_hand,
            ]
        )
        ->values()
        ->all();
}


private function loadProductData(
        $id
    ): array {

        $product =
            Product::with([

                'category',

                'brand',

                'creator',

                'collections',

                'media',

                'options.globalVariant',

                'options.values.globalValue',

                'variants.optionValues.option',

                'variants.media',

            ])
            ->findOrFail(
                $id
            );


        return [

            /*
            |--------------------------------------------------------------------------
            | BASIC
            |--------------------------------------------------------------------------
            */

            'id' =>
            $product->id,

            'title' =>
            $product->title,

            'slug' =>
            $product->slug,

            'summary' =>
            $product->summary,

            'description' =>
            $product->description,

            'specifications' =>
            $product
                ->specifications,


            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            'status' =>
            $product->status,

            'is_featured' =>
            (bool)
            $product
                ->is_featured,


            /*
            |--------------------------------------------------------------------------
            | PUBLISHING
            |--------------------------------------------------------------------------
            */

            'online_store' =>
            (bool)
            $product
                ->online_store,

            'point_of_sale' =>
            (bool)
            $product
                ->point_of_sale,


            /*
            |--------------------------------------------------------------------------
            | ORGANIZATION
            |--------------------------------------------------------------------------
            */

            'category_id' =>
            $product
                ->category_id,

            'category' =>
            $product->category,

            'brand_id' =>
            $product
                ->brand_id,

            'brand' =>
            $product->brand,

            'type' =>
            $product->type,

            'tags' =>
            $product->tags
                ?? [],


            /*
            |--------------------------------------------------------------------------
            | COLLECTIONS
            |--------------------------------------------------------------------------
            */

            'collection_ids' =>
            $product
                ->collections
                ->pluck('id')
                ->map(
                    fn($id) =>
                    (int) $id
                )
                ->values(),

            'collections' =>
            $product
                ->collections
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


            /*
            |--------------------------------------------------------------------------
            | SOURCE
            |--------------------------------------------------------------------------
            */

            'source' =>
            $product->source,

            'created_by' =>
            $product
                ->created_by,


            /*
            |--------------------------------------------------------------------------
            | FORMAT
            |--------------------------------------------------------------------------
            */

            'product_format' =>
            $product
                ->product_format,


            /*
            |--------------------------------------------------------------------------
            | PREORDER
            |--------------------------------------------------------------------------
            */

            'preorder_enabled' =>
            (bool)
            $product
                ->preorder_enabled,


            /*
            |--------------------------------------------------------------------------
            | PRICING
            |--------------------------------------------------------------------------
            */

            'price' =>
            $product->price,

            'compare_at_price' =>
            $product
                ->compare_at_price,

            'cost_per_item' =>
            $product
                ->cost_per_item,


            /*
            |--------------------------------------------------------------------------
            | INVENTORY
            |--------------------------------------------------------------------------
            */

            'sku' =>
            $product->sku,

            'barcode' =>
            $product->barcode,

            'quantity' =>
            (int)
            $product->quantity,

            'inventory_by_location' =>
            $this->getProductInventoryByLocation(
                $product
            ),

            'track_quantity' =>
            (bool)
            $product
                ->track_quantity,

            'continue_selling_when_out_of_stock' =>
            (bool)
            $product
                ->continue_selling_when_out_of_stock,


            /*
            |--------------------------------------------------------------------------
            | SHIPPING
            |--------------------------------------------------------------------------
            */

            'weight' =>
            $product->weight,

            'weight_unit' =>
            $product
                ->weight_unit,

            'country_of_origin' =>
            $product
                ->country_of_origin,

            'hs_code' =>
            $product
                ->hs_code,

            'customs_description' =>
            $product
                ->customs_description,


            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */

            'seo_title' =>
            $product
                ->seo_title,

            'seo_description' =>
            $product
                ->seo_description,


            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            */

            'media' =>
            $product
                ->media
                ->map(
                    fn($media) => [

                        'id' =>
                        $media->id,

                        'file_path' =>
                        $media
                            ->file_path,

                        'url' =>
                        asset(
                            $media
                                ->file_path
                        ),

                        'media_type' =>
                        $media
                            ->media_type,

                        'alt_text' =>
                        $media
                            ->alt_text,

                        'is_cover' =>
                        (bool)
                        $media
                            ->is_cover,

                        'sort_order' =>
                        (int)
                        $media
                            ->sort_order,

                    ]
                )
                ->values(),


            /*
            |--------------------------------------------------------------------------
            | PRODUCT OPTIONS
            |--------------------------------------------------------------------------
            */

            'options' =>
            $product
                ->options
                ->map(
                    fn($option) => [

                        'id' =>
                        $option->id,

                        'global_variant_id' =>
                        $option
                            ->global_variant_id,

                        'name' =>
                        $option->name,

                        'sort_order' =>
                        (int)
                        $option
                            ->sort_order,

                        'visual_type' =>
                        $option
                            ->globalVariant
                            ->visual_type
                            ?? 'rectangle',

                        'values' =>
                        $option
                            ->values
                            ->map(
                                fn($value) => [

                                    'id' =>
                                    $value
                                        ->id,

                                    'global_variant_value_id' =>
                                    $value
                                        ->global_variant_value_id,

                                    'value' =>
                                    $value
                                        ->value,

                                    'color_code' =>
                                    $value
                                        ->color_code,

                                    'sort_order' =>
                                    (int)
                                    $value
                                        ->sort_order,

                                ]
                            )
                            ->values(),

                    ]
                )
                ->values(),


            /*
            |--------------------------------------------------------------------------
            | VARIANTS
            |--------------------------------------------------------------------------
            */

            'variants' =>
            $product
                ->variants
                ->map(
                    function ($variant) {

                        return [

                            'id' =>
                            $variant->id,

                            'title' =>
                            $variant->title,

                            'combination_key' =>
                            $variant
                                ->combination_key,

                            'product_media_id' =>
                            $variant
                                ->product_media_id,

                            'image_url' =>
                            $variant->media

                                ? asset(
                                    $variant
                                        ->media
                                        ->file_path
                                )

                                : null,

                            'price' =>
                            $variant->price,

                            'compare_at_price' =>
                            $variant
                                ->compare_at_price,

                            'cost_per_item' =>
                            $variant
                                ->cost_per_item,

                            'sku' =>
                            $variant->sku,

                            'barcode' =>
                            $variant
                                ->barcode,

                            'quantity' =>
                            (int)
                            $variant
                                ->quantity,

                            'is_active' =>
                            (bool)
                            $variant
                                ->is_active,

                            'sort_order' =>
                            (int)
                            $variant
                                ->sort_order,

                            /*
                                |--------------------------------------------------------------------------
                                | FRONTEND USES GLOBAL IDS
                                |--------------------------------------------------------------------------
                                */

                            'global_variant_value_ids' =>
                            $variant
                                ->optionValues
                                ->pluck(
                                    'global_variant_value_id'
                                )
                                ->filter()
                                ->map(
                                    fn($id) =>
                                    (int) $id
                                )
                                ->values(),

                            'option_values' =>
                            $variant
                                ->optionValues
                                ->map(
                                    fn($value) => [

                                        'id' =>
                                        $value
                                            ->id,

                                        'global_variant_value_id' =>
                                        $value
                                            ->global_variant_value_id,

                                        'value' =>
                                        $value
                                            ->value,

                                        'color_code' =>
                                        $value
                                            ->color_code,

                                        'option_name' =>
                                        $value
                                            ->option
                                            ->name
                                            ?? null,

                                    ]
                                )
                                ->values(),

                        ];
                    }
                )
                ->values(),

            'created_at' =>
            $product->created_at,

            'updated_at' =>
            $product->updated_at,

        ];
    }


    /*
    |--------------------------------------------------------------------------
    | UNIQUE SLUG
    |--------------------------------------------------------------------------
    */

    private function makeUniqueSlug(
        string $slug,
        $ignoreId = null
    ): string {

        if (
            trim($slug) === ''
        ) {

            $slug =
                'product';
        }


        $base =
            $slug;


        $counter =
            1;


        while (true) {

            $query =
                Product::where(
                    'slug',
                    $slug
                );


            if ($ignoreId) {

                $query->where(
                    'id',
                    '!=',
                    $ignoreId
                );
            }


            if (
                ! $query->exists()
            ) {

                break;
            }


            $slug =
                $base
                . '-'
                . $counter;


            $counter++;
        }


        return $slug;
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE FILE
    |--------------------------------------------------------------------------
    */

    private function deleteFile(
        ?string $path
    ): void {

        if (! $path) {
            return;
        }


        $fullPath =
            public_path(
                $path
            );


        if (
            File::exists(
                $fullPath
            )
        ) {

            File::delete(
                $fullPath
            );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | BOOLEAN
    |--------------------------------------------------------------------------
    */

    private function toBoolean(
        $value
    ): bool {

        return filter_var(
            $value,
            FILTER_VALIDATE_BOOLEAN
        );
    }
}
