<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

use App\Models\InventoryLevel;
use App\Models\InventoryLocation;

use Illuminate\Support\Facades\File;

class VendorProductController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {
        $user = $request->user();

        if (
            !$user ||
            $user->role !== 'vendor'
        ) {
            abort(403);
        }

        $tab = $request->input(
            'tab',
            'all'
        );

        $search = trim(
            (string) $request->input(
                'search',
                ''
            )
        );

        $categoryId =
            $request->input(
                'category_id'
            );

        $brandId =
            $request->input(
                'brand_id'
            );

        $sort = $request->input(
            'sort',
            'recent'
        );

        $perPage = min(
            max(
                (int) $request->input(
                    'per_page',
                    10
                ),
                1
            ),
            100
        );

        $query =
            $this
                ->vendorProductQuery(
                    $user->id
                )
                ->with([
                    'category:id,name',
                    'brand:id,name',
                    'media',
                ])
                ->withCount(
                    'variants'
                )
                ->withSum(
                    'variants as variant_inventory',
                    'quantity'
                )
                ->withMin(
                    'variants as variant_min_price',
                    'price'
                );

        if ($search !== '') {
            $query->where(
                function ($query) use ($search) {
                    $query
                        ->where(
                            'title',
                            'like',
                            '%' . $search . '%'
                        )
                        ->orWhere(
                            'slug',
                            'like',
                            '%' . $search . '%'
                        )
                        ->orWhere(
                            'sku',
                            'like',
                            '%' . $search . '%'
                        )
                        ->orWhere(
                            'barcode',
                            'like',
                            '%' . $search . '%'
                        );
                }
            );
        }

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

        if ($categoryId) {
            $query->where(
                'category_id',
                $categoryId
            );
        }

        if ($brandId) {
            $query->where(
                'brand_id',
                $brandId
            );
        }

        switch ($sort) {
            case 'oldest':
                $query->orderBy(
                    'id',
                    'asc'
                );
                break;

            case 'name_asc':
                $query->orderBy(
                    'title',
                    'asc'
                );
                break;

            case 'name_desc':
                $query->orderBy(
                    'title',
                    'desc'
                );
                break;

            default:
                $query->latest(
                    'id'
                );
                break;
        }

        $products =
            $query->paginate(
                $perPage
            );

        $products
            ->getCollection()
            ->transform(
                function ($product) {
                    return $this
                        ->productListData(
                            $product
                        );
                }
            );

        return response()->json([
            'status' => true,

            'stats' =>
                $this->getStats(
                    $user->id
                ),

            'tab_counts' =>
                $this->getTabCounts(
                    $user->id
                ),

            'products' =>
                $products,
        ]);
    }



    public function show(
    Request $request,
    $id
): JsonResponse {
    $user = $request->user();

    if (
        ! $user ||
        $user->role !== 'vendor'
    ) {
        abort(403);
    }

    $product = Product::query()
        ->where(
            'source',
            'vendor'
        )
        ->where(
            'created_by',
            $user->id
        )
        ->with([
            'category',
            'brand',
            'collections',
            'media',
            'options.globalVariant',
            'options.values.globalValue',
            'variants.optionValues.option',
            'variants.media',
        ])
        ->findOrFail($id);

    /*
    |--------------------------------------------------------------------------
    | INVENTORY BY LOCATION
    |--------------------------------------------------------------------------
    */

    $vendorLocationIds =
        InventoryLocation::query()
            ->where(
                'vendor_id',
                $user->id
            )
            ->pluck('id');

    $inventoryByLocation =
        InventoryLevel::query()
            ->where(
                'product_id',
                $product->id
            )
            ->whereNull(
                'variant_id'
            )
            ->whereIn(
                'location_id',
                $vendorLocationIds
            )
            ->get([
                'location_id',
                'on_hand',
            ])
            ->map(
                fn ($item) => [
                    'location_id' =>
                        (int)
                        $item->location_id,

                    'quantity' =>
                        (int)
                        $item->on_hand,
                ]
            )
            ->values();

    return response()->json([
        'status' => true,

        'product' => [
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
                $product->specifications,

            'status' =>
                $product->status,

            'is_featured' =>
                (bool)
                $product->is_featured,

            'online_store' =>
                (bool)
                $product->online_store,

            'point_of_sale' =>
                (bool)
                $product->point_of_sale,

            'category_id' =>
                $product->category_id,

            'category' =>
                $product->category,

            'brand_id' =>
                $product->brand_id,

            'brand' =>
                $product->brand,

            'type' =>
                $product->type,

            'tags' =>
                $product->tags ?? [],

            'collection_ids' =>
                $product
                    ->collections
                    ->pluck('id')
                    ->map(
                        fn ($id) =>
                            (int) $id
                    )
                    ->values(),

            'collections' =>
                $product
                    ->collections
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
                    ->values(),

            'source' =>
                $product->source,

            'created_by' =>
                $product->created_by,

            'product_format' =>
                $product->product_format,

            'preorder_enabled' =>
                (bool)
                $product->preorder_enabled,

            'price' =>
                $product->price,

            'compare_at_price' =>
                $product->compare_at_price,

            'cost_per_item' =>
                $product->cost_per_item,

            'sku' =>
                $product->sku,

            'barcode' =>
                $product->barcode,

            'quantity' =>
                (int)
                $product->quantity,

            'inventory_by_location' =>
                $inventoryByLocation,

            'track_quantity' =>
                (bool)
                $product->track_quantity,

            'continue_selling_when_out_of_stock' =>
                (bool)
                $product
                    ->continue_selling_when_out_of_stock,

            'weight' =>
                $product->weight,

            'weight_unit' =>
                $product->weight_unit,

            'country_of_origin' =>
                $product->country_of_origin,

            'hs_code' =>
                $product->hs_code,

            'customs_description' =>
                $product->customs_description,

            'seo_title' =>
                $product->seo_title,

            'seo_description' =>
                $product->seo_description,

            'media' =>
                $product
                    ->media
                    ->map(
                        fn ($media) => [
                            'id' =>
                                $media->id,

                            'file_path' =>
                                $media->file_path,

                            'url' =>
                                asset(
                                    $media->file_path
                                ),

                            'media_type' =>
                                $media->media_type,

                            'alt_text' =>
                                $media->alt_text,

                            'is_cover' =>
                                (bool)
                                $media->is_cover,

                            'sort_order' =>
                                (int)
                                $media->sort_order,
                        ]
                    )
                    ->values(),

            'options' =>
                $product
                    ->options
                    ->map(
                        fn ($option) => [
                            'id' =>
                                $option->id,

                            'global_variant_id' =>
                                $option
                                    ->global_variant_id,

                            'name' =>
                                $option->name,

                            'sort_order' =>
                                (int)
                                $option->sort_order,

                            'visual_type' =>
                                $option
                                    ->globalVariant
                                    ->visual_type
                                ?? 'rectangle',

                            'values' =>
                                $option
                                    ->values
                                    ->map(
                                        fn ($value) => [
                                            'id' =>
                                                $value->id,

                                            'global_variant_value_id' =>
                                                $value
                                                    ->global_variant_value_id,

                                            'value' =>
                                                $value->value,

                                            'color_code' =>
                                                $value->color_code,

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
                                    $variant->barcode,

                                'quantity' =>
                                    (int)
                                    $variant->quantity,

                                'is_active' =>
                                    (bool)
                                    $variant->is_active,

                                'sort_order' =>
                                    (int)
                                    $variant->sort_order,

                                'global_variant_value_ids' =>
                                    $variant
                                        ->optionValues
                                        ->pluck(
                                            'global_variant_value_id'
                                        )
                                        ->filter()
                                        ->map(
                                            fn ($id) =>
                                                (int) $id
                                        )
                                        ->values(),

                                'option_values' =>
                                    $variant
                                        ->optionValues
                                        ->map(
                                            fn ($value) => [
                                                'id' =>
                                                    $value->id,

                                                'global_variant_value_id' =>
                                                    $value
                                                        ->global_variant_value_id,

                                                'value' =>
                                                    $value->value,

                                                'color_code' =>
                                                    $value->color_code,

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
        ],
    ]);
}





    public function destroy(
        Request $request,
        $id
    ): JsonResponse {
        $user = $request->user();

        if (
            !$user ||
            $user->role !== 'vendor'
        ) {
            abort(403);
        }

        $product =
            $this
                ->vendorProductQuery(
                    $user->id
                )
                ->with(
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

            foreach (
                $files
                as $file
            ) {
                $this->deleteFile(
                    $file
                );
            }

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

    private function vendorProductQuery(
        int $userId
    ): Builder {
        return Product::query()
            ->where(
                'source',
                'vendor'
            )
            ->where(
                'created_by',
                $userId
            );
    }

    private function getStats(
        int $userId
    ): array {
        $totalProducts =
            $this
                ->vendorProductQuery(
                    $userId
                )
                ->count();

        $activeProducts =
            $this
                ->vendorProductQuery(
                    $userId
                )
                ->where(
                    'status',
                    'active'
                )
                ->count();

        $draftProducts =
            $this
                ->vendorProductQuery(
                    $userId
                )
                ->where(
                    'status',
                    'draft'
                )
                ->count();

        $archivedProducts =
            $this
                ->vendorProductQuery(
                    $userId
                )
                ->where(
                    'status',
                    'archived'
                )
                ->count();

        $outOfStock =
            $this
                ->vendorProductQuery(
                    $userId
                )
                ->where(
                    function ($query) {
                        $query
                            ->where(
                                function ($query) {
                                    $query
                                        ->doesntHave(
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
                            ->orWhere(
                                function ($query) {
                                    $query
                                        ->whereHas(
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

        $inventoryProducts =
            $this
                ->vendorProductQuery(
                    $userId
                )
                ->withCount(
                    'variants'
                )
                ->withSum(
                    'variants as variant_inventory',
                    'quantity'
                )
                ->get([
                    'id',
                    'quantity',
                ]);

        $inventoryUnits =
            $inventoryProducts
                ->sum(
                    function ($product) {
                        $hasVariants =
                            (int) (
                                $product
                                    ->variants_count
                                ?? 0
                            ) > 0;

                        $quantity =
                            $hasVariants
                                ? (int) (
                                    $product
                                        ->variant_inventory
                                    ?? 0
                                )
                                : (int) (
                                    $product
                                        ->quantity
                                    ?? 0
                                );

                        return max(
                            0,
                            $quantity
                        );
                    }
                );

        return [
            'total_products' =>
                $totalProducts,

            'active_listings' =>
                $activeProducts,

            'draft_products' =>
                $draftProducts,

            'archived_products' =>
                $archivedProducts,

            'out_of_stock' =>
                $outOfStock,

            'inventory_units' =>
                (int) $inventoryUnits,
        ];
    }

    private function getTabCounts(
        int $userId
    ): array {
        return [
            'all' =>
                $this
                    ->vendorProductQuery(
                        $userId
                    )
                    ->count(),

            'active' =>
                $this
                    ->vendorProductQuery(
                        $userId
                    )
                    ->where(
                        'status',
                        'active'
                    )
                    ->count(),

            'draft' =>
                $this
                    ->vendorProductQuery(
                        $userId
                    )
                    ->where(
                        'status',
                        'draft'
                    )
                    ->count(),

            'archived' =>
                $this
                    ->vendorProductQuery(
                        $userId
                    )
                    ->where(
                        'status',
                        'archived'
                    )
                    ->count(),
        ];
    }

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
            (int) (
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
                        ? (float) $product
                            ->variant_min_price
                        : null
                )
                : (
                    $product->price
                    !== null
                        ? (float) $product
                            ->price
                        : null
                );

        $inventory =
            $hasVariants
                ? (int) (
                    $product
                        ->variant_inventory
                    ?? 0
                )
                : (int) (
                    $product
                        ->quantity
                    ?? 0
                );

        $availableIn = [];

        if (
            $product->point_of_sale
        ) {
            $availableIn[] =
                'in_store';
        }

        if (
            $product->online_store
        ) {
            $availableIn[] =
                'online';
        }

        return [
            'id' =>
                $product->id,

            'title' =>
                $product->title,

            'slug' =>
                $product->slug,

            'image_url' =>
                $cover
                    ? $this
                        ->resolveMediaUrl(
                            $cover
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

            'status' =>
                $product->status,

            'inventory' =>
                $inventory,

            'inventory_label' =>
                $this
                    ->getInventoryLabel(
                        $product,
                        $inventory
                    ),

            'price' =>
                $price,

            'formatted_price' =>
                $price !== null
                    ? '$'
                    . number_format(
                        $price,
                        2
                    )
                    : '$0.00',

            'variants_count' =>
                (int) (
                    $product
                        ->variants_count
                    ?? 0
                ),

            'online_store' =>
                (bool) $product
                    ->online_store,

            'point_of_sale' =>
                (bool) $product
                    ->point_of_sale,

            'available_in' =>
                $availableIn,

            'store_id' =>
                $product->store_id,
        ];
    }

    private function getInventoryLabel(
        Product $product,
        int $inventory
    ): string {
        if (
            !$product->track_quantity &&
            (int) (
                $product
                    ->variants_count
                ?? 0
            ) === 0
        ) {
            return 'Not tracked';
        }

        if ($inventory <= 0) {
            return 'Out of stock';
        }

        return
            $inventory
            . ' in stock';
    }

    private function resolveMediaUrl(
        $media
    ): ?string {
        if (!$media) {
            return null;
        }

        $path =
            $media->file_path
            ?? $media->image
            ?? $media->path
            ?? $media->url
            ?? null;

        if (!$path) {
            return null;
        }

        if (
            str_starts_with(
                $path,
                'http://'
            )
            ||
            str_starts_with(
                $path,
                'https://'
            )
        ) {
            return $path;
        }

        return asset(
            ltrim(
                $path,
                '/'
            )
        );
    }

    private function deleteFile(
        ?string $path
    ): void {
        if (!$path) {
            return;
        }

        if (
            str_starts_with(
                $path,
                'http://'
            )
            ||
            str_starts_with(
                $path,
                'https://'
            )
        ) {
            return;
        }

        $filePath =
            public_path(
                ltrim(
                    $path,
                    '/'
                )
            );

        if (
            File::exists(
                $filePath
            )
        ) {
            File::delete(
                $filePath
            );
        }
    }


    public function uploadVariantImage(
    Request $request,
    $productId,
    $variantId
): JsonResponse {
    $request->validate([
        'image' => [
            'required',
            'image',
            'mimes:jpg,jpeg,png,webp',
            'max:5120',
        ],
    ]);

    $product = Product::query()
        ->where('source', 'vendor')
        ->where('created_by', $request->user()->id)
        ->findOrFail($productId);

    $variant = $product
        ->variants()
        ->where('id', $variantId)
        ->firstOrFail();

    $uploadPath = public_path(
        'uploads/products/' .
        $product->id .
        '/variants'
    );

    if (! is_dir($uploadPath)) {
        mkdir(
            $uploadPath,
            0755,
            true
        );
    }

    $image = $request->file('image');

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

    $media = $product
        ->media()
        ->create([
            'file_path' => $relativePath,
            'media_type' => 'image',
            'is_cover' => false,
            'sort_order' => 999,
        ]);

    $variant->product_media_id =
        $media->id;

    $variant->save();

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
                asset($relativePath),
        ],
    ]);
}




}
