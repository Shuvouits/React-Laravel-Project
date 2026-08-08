<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Collection;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CollectionController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | COLLECTION LIST
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/collections
    |
    | ?tab=all
    | ?tab=active
    | ?tab=inactive
    | ?tab=manual
    | ?tab=automated
    | ?search=summer
    | ?page=1
    |
    */

    public function index(Request $request)
    {
        $query = Collection::query()
            ->withCount('products');


        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {

            $search = trim(
                $request->input('search')
            );


            $query->where(function ($q) use ($search) {

                $q->where(
                    'title',
                    'like',
                    "%{$search}%"
                )
                ->orWhere(
                    'slug',
                    'like',
                    "%{$search}%"
                );

            });
        }


        /*
        |--------------------------------------------------------------------------
        | FILTER TAB
        |--------------------------------------------------------------------------
        */

        $tab = $request->input(
            'tab',
            'all'
        );


        switch ($tab) {

            case 'active':

                $query->where(
                    'status',
                    'active'
                );

                break;


            case 'inactive':

                $query->where(
                    'status',
                    'inactive'
                );

                break;


            case 'manual':

                $query->where(
                    'collection_type',
                    'manual'
                );

                break;


            case 'automated':

                $query->where(
                    'collection_type',
                    'automated'
                );

                break;
        }


        /*
        |--------------------------------------------------------------------------
        | ORDER
        |--------------------------------------------------------------------------
        */

        $query
            ->orderBy('display_position')
            ->orderBy('title');


        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

        $collections = $query
            ->paginate(15);


        $collections
            ->getCollection()
            ->transform(
                fn ($collection) =>
                    $this->collectionData(
                        $collection
                    )
            );


        /*
        |--------------------------------------------------------------------------
        | STATS
        |--------------------------------------------------------------------------
        */

        $stats = [

            'total' =>
                Collection::count(),

            'active' =>
                Collection::where(
                    'status',
                    'active'
                )->count(),

            'inactive' =>
                Collection::where(
                    'status',
                    'inactive'
                )->count(),

            'manual' =>
                Collection::where(
                    'collection_type',
                    'manual'
                )->count(),

            'automated' =>
                Collection::where(
                    'collection_type',
                    'automated'
                )->count(),

            'assigned_products' =>
                DB::table(
                    'collection_product'
                )
                ->distinct()
                ->count(
                    'product_id'
                ),

        ];


        return response()->json([

            'status' => true,

            'collections' =>
                $collections,

            'stats' =>
                $stats,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE COLLECTION
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/collections
    |
    */

    public function store(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | NORMALIZE PRODUCTS
        |--------------------------------------------------------------------------
        */

        $request->merge([

            'products' =>
                $this->normalizeProducts(
                    $request->input(
                        'products'
                    )
                ),

        ]);


        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([

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

            'description' => [
                'nullable',
                'string',
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'status' => [
                'required',

                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],

            'online_store' => [
                'nullable',
            ],

            'point_of_sale' => [
                'nullable',
            ],

            'collection_type' => [
                'required',

                Rule::in([
                    'manual',
                    'automated',
                ]),
            ],

            'sort_order' => [
                'nullable',
                'string',
                'max:50',
            ],

            'display_position' => [
                'nullable',
                'integer',
                'min:0',
            ],

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
            | MANUAL PRODUCTS
            |--------------------------------------------------------------------------
            */

            'products' => [
                'nullable',
                'array',
            ],

            'products.*.id' => [
                'required',
                'integer',
                'exists:products,id',
            ],

            'products.*.sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

        ]);


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
                $slug
            );


        /*
        |--------------------------------------------------------------------------
        | IMAGE
        |--------------------------------------------------------------------------
        */

        $imagePath = null;


        if ($request->hasFile('image')) {

            $imagePath =
                $this->uploadImage(
                    $request->file(
                        'image'
                    )
                );

        }


        /*
        |--------------------------------------------------------------------------
        | CREATE
        |--------------------------------------------------------------------------
        */

        try {

            $collection =
                DB::transaction(
                    function () use (
                        $validated,
                        $request,
                        $slug,
                        $imagePath
                    ) {

                        $collection =
                            Collection::create([

                                'title' =>
                                    trim(
                                        $validated['title']
                                    ),

                                'slug' =>
                                    $slug,

                                'description' =>
                                    $validated['description']
                                    ?? null,

                                'image' =>
                                    $imagePath,

                                'status' =>
                                    $validated['status'],

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
                                            false
                                        )
                                    ),

                                'collection_type' =>
                                    $validated[
                                        'collection_type'
                                    ],

                                'sort_order' =>
                                    $validated[
                                        'sort_order'
                                    ]
                                    ?? 'manual',

                                'display_position' =>
                                    $validated[
                                        'display_position'
                                    ]
                                    ?? 0,

                                'seo_title' =>
                                    $validated[
                                        'seo_title'
                                    ]
                                    ?? null,

                                'seo_description' =>
                                    $validated[
                                        'seo_description'
                                    ]
                                    ?? null,

                            ]);


                        /*
                        |--------------------------------------------------------------------------
                        | MANUAL PRODUCTS
                        |--------------------------------------------------------------------------
                        */

                        if (
                            $collection
                                ->collection_type
                            ===
                            'manual'
                        ) {

                            $this
                                ->syncManualProducts(

                                    $collection,

                                    $validated[
                                        'products'
                                    ]
                                    ?? []

                                );

                        }


                        return $collection;

                    }
                );


            $collection
                ->loadCount(
                    'products'
                );


            return response()->json([

                'status' => true,

                'message' =>
                    'Collection created successfully.',

                'collection' =>
                    $this->collectionData(
                        $collection
                    ),

            ], 201);

        } catch (\Throwable $error) {

            report($error);


            /*
            |--------------------------------------------------------------------------
            | REMOVE UPLOADED IMAGE IF DB FAILS
            |--------------------------------------------------------------------------
            */

            if ($imagePath) {

                $this->deleteImage(
                    $imagePath
                );

            }


            return response()->json([

                'status' => false,

                'message' =>
                    'Unable to create collection.',

            ], 500);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SHOW COLLECTION
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/collections/{id}
    |
    */

    public function show($id)
    {
        $collection =
            Collection::withCount(
                'products'
            )
            ->with([
                'products.media',
                'products.variants',
            ])
            ->findOrFail(
                $id
            );


        return response()->json([

            'status' => true,

            'collection' =>
                $this->collectionData(
                    $collection,
                    true
                ),

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE COLLECTION
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/collections/{id}/update
    |
    */

    public function update(
        Request $request,
        $id
    ) {
        $collection =
            Collection::findOrFail(
                $id
            );


        /*
        |--------------------------------------------------------------------------
        | NORMALIZE PRODUCTS
        |--------------------------------------------------------------------------
        */

        $request->merge([

            'products' =>
                $this->normalizeProducts(
                    $request->input(
                        'products'
                    )
                ),

        ]);


        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([

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

            'description' => [
                'nullable',
                'string',
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'remove_image' => [
                'nullable',
            ],

            'status' => [
                'required',

                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],

            'online_store' => [
                'nullable',
            ],

            'point_of_sale' => [
                'nullable',
            ],

            'collection_type' => [
                'required',

                Rule::in([
                    'manual',
                    'automated',
                ]),
            ],

            'sort_order' => [
                'nullable',
                'string',
                'max:50',
            ],

            'display_position' => [
                'nullable',
                'integer',
                'min:0',
            ],

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

            'products' => [
                'nullable',
                'array',
            ],

            'products.*.id' => [
                'required',
                'integer',
                'exists:products,id',
            ],

            'products.*.sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

        ]);


        /*
        |--------------------------------------------------------------------------
        | SLUG
        |--------------------------------------------------------------------------
        */

        $slug =
            $request->filled(
                'slug'
            )

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
                $collection->id
            );


        /*
        |--------------------------------------------------------------------------
        | IMAGE
        |--------------------------------------------------------------------------
        */

        $oldImage =
            $collection->image;


        $newImagePath =
            null;


        if (
            $request->hasFile(
                'image'
            )
        ) {

            $newImagePath =
                $this->uploadImage(
                    $request->file(
                        'image'
                    )
                );

        }


        try {

            DB::transaction(
                function () use (
                    $collection,
                    $validated,
                    $request,
                    $slug,
                    $newImagePath
                ) {

                    /*
                    |--------------------------------------------------------------------------
                    | BASIC
                    |--------------------------------------------------------------------------
                    */

                    $collection->title =
                        trim(
                            $validated['title']
                        );


                    $collection->slug =
                        $slug;


                    $collection->description =
                        $validated[
                            'description'
                        ]
                        ?? null;


                    /*
                    |--------------------------------------------------------------------------
                    | IMAGE
                    |--------------------------------------------------------------------------
                    */

                    if ($newImagePath) {

                        $collection->image =
                            $newImagePath;

                    } elseif (
                        $this->toBoolean(
                            $request->input(
                                'remove_image',
                                false
                            )
                        )
                    ) {

                        $collection->image =
                            null;

                    }


                    /*
                    |--------------------------------------------------------------------------
                    | STATUS
                    |--------------------------------------------------------------------------
                    */

                    $collection->status =
                        $validated['status'];


                    $collection->online_store =
                        $this->toBoolean(
                            $request->input(
                                'online_store',
                                true
                            )
                        );


                    $collection->point_of_sale =
                        $this->toBoolean(
                            $request->input(
                                'point_of_sale',
                                false
                            )
                        );


                    /*
                    |--------------------------------------------------------------------------
                    | TYPE
                    |--------------------------------------------------------------------------
                    */

                    $collection->collection_type =
                        $validated[
                            'collection_type'
                        ];


                    $collection->sort_order =
                        $validated[
                            'sort_order'
                        ]
                        ?? 'manual';


                    $collection->display_position =
                        $validated[
                            'display_position'
                        ]
                        ?? 0;


                    /*
                    |--------------------------------------------------------------------------
                    | SEO
                    |--------------------------------------------------------------------------
                    */

                    $collection->seo_title =
                        $validated[
                            'seo_title'
                        ]
                        ?? null;


                    $collection->seo_description =
                        $validated[
                            'seo_description'
                        ]
                        ?? null;


                    $collection->save();


                    /*
                    |--------------------------------------------------------------------------
                    | MANUAL PRODUCTS
                    |--------------------------------------------------------------------------
                    */

                    if (
                        $collection
                            ->collection_type
                        ===
                        'manual'
                    ) {

                        $this
                            ->syncManualProducts(

                                $collection,

                                $validated[
                                    'products'
                                ]
                                ?? []

                            );

                    } else {

                        /*
                        |--------------------------------------------------------------------------
                        | AUTOMATED COLLECTION
                        |--------------------------------------------------------------------------
                        |
                        | Automated conditions পরে add করব।
                        | Manual product pivot clear করছি।
                        |
                        */

                        $collection
                            ->products()
                            ->detach();

                    }

                }
            );


            /*
            |--------------------------------------------------------------------------
            | DELETE OLD IMAGE AFTER SUCCESS
            |--------------------------------------------------------------------------
            */

            if (
                $newImagePath &&
                $oldImage
            ) {

                $this->deleteImage(
                    $oldImage
                );

            }


            if (
                ! $newImagePath &&
                $oldImage &&
                $this->toBoolean(
                    $request->input(
                        'remove_image',
                        false
                    )
                )
            ) {

                $this->deleteImage(
                    $oldImage
                );

            }


            /*
            |--------------------------------------------------------------------------
            | RELOAD
            |--------------------------------------------------------------------------
            */

            $collection->refresh();


            $collection->loadCount(
                'products'
            );


            $collection->load([
                'products.media',
                'products.variants',
            ]);


            return response()->json([

                'status' => true,

                'message' =>
                    'Collection updated successfully.',

                'collection' =>
                    $this->collectionData(
                        $collection,
                        true
                    ),

            ]);

        } catch (\Throwable $error) {

            report($error);


            if ($newImagePath) {

                $this->deleteImage(
                    $newImagePath
                );

            }


            return response()->json([

                'status' => false,

                'message' =>
                    'Unable to update collection.',

            ], 500);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE COLLECTION
    |--------------------------------------------------------------------------
    |
    | DELETE /api/admin/collections/{id}
    |
    */

    public function destroy($id)
    {
        $collection =
            Collection::findOrFail(
                $id
            );


        $image =
            $collection->image;


        try {

            $collection->delete();


            if ($image) {

                $this->deleteImage(
                    $image
                );

            }


            return response()->json([

                'status' => true,

                'message' =>
                    'Collection deleted successfully.',

            ]);

        } catch (\Throwable $error) {

            report($error);


            return response()->json([

                'status' => false,

                'message' =>
                    'Unable to delete collection.',

            ], 500);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | PRODUCT SEARCH
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/collections/products/search
    |
    | ?search=iphone
    |
    */

    public function searchProducts(
        Request $request
    ) {
        $search =
            trim(
                $request->input(
                    'search',
                    ''
                )
            );


        $query =
            Product::query()
                ->where(
                    'status',
                    '!=',
                    'archived'
                )
                ->with([
                    'media',
                    'variants',
                ]);


        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($search !== '') {

            $query->where(
                function ($q) use (
                    $search
                ) {

                    $q->where(
                        'title',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'sku',
                        'like',
                        "%{$search}%"
                    );

                }
            );

        }


        $products =
            $query
                ->orderBy(
                    'title'
                )
                ->limit(20)
                ->get()
                ->map(
                    fn ($product) =>
                        $this->productData(
                            $product
                        )
                );


        return response()->json([

            'status' => true,

            'products' =>
                $products,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | REORDER COLLECTION PRODUCTS
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/collections/{id}/products/reorder
    |
    | {
    |   "products": [
    |       {"id": 5, "sort_order": 0},
    |       {"id": 9, "sort_order": 1}
    |   ]
    | }
    |
    */

    public function reorderProducts(
        Request $request,
        $id
    ) {
        $collection =
            Collection::findOrFail(
                $id
            );


        $validated =
            $request->validate([

                'products' => [
                    'required',
                    'array',
                ],

                'products.*.id' => [
                    'required',
                    'integer',
                    'exists:products,id',
                ],

                'products.*.sort_order' => [
                    'required',
                    'integer',
                    'min:0',
                ],

            ]);


        /*
        |--------------------------------------------------------------------------
        | MAKE SURE PRODUCTS BELONG TO COLLECTION
        |--------------------------------------------------------------------------
        */

        $attachedIds =
            $collection
                ->products()
                ->pluck(
                    'products.id'
                )
                ->map(
                    fn ($value) =>
                        (int) $value
                )
                ->all();


        foreach (
            $validated['products']
            as $item
        ) {

            if (
                ! in_array(
                    (int) $item['id'],
                    $attachedIds,
                    true
                )
            ) {

                return response()->json([

                    'status' => false,

                    'message' =>
                        'One or more products are not assigned to this collection.',

                ], 422);
            }

        }


        /*
        |--------------------------------------------------------------------------
        | UPDATE ORDER
        |--------------------------------------------------------------------------
        */

        DB::transaction(
            function () use (
                $collection,
                $validated
            ) {

                foreach (
                    $validated['products']
                    as $item
                ) {

                    DB::table(
                        'collection_product'
                    )
                    ->where(
                        'collection_id',
                        $collection->id
                    )
                    ->where(
                        'product_id',
                        $item['id']
                    )
                    ->update([

                        'sort_order' =>
                            $item[
                                'sort_order'
                            ],

                        'updated_at' =>
                            now(),

                    ]);

                }

            }
        );


        return response()->json([

            'status' => true,

            'message' =>
                'Collection products reordered successfully.',

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | COLLECTION RESPONSE
    |--------------------------------------------------------------------------
    */

    private function collectionData(
        Collection $collection,
        bool $includeProducts = false
    ): array {

        $data = [

            'id' =>
                $collection->id,

            'title' =>
                $collection->title,

            'slug' =>
                $collection->slug,

            'description' =>
                $collection->description,


            /*
            |--------------------------------------------------------------------------
            | IMAGE
            |--------------------------------------------------------------------------
            */

            'image' =>
                $collection->image,

            'image_url' =>
                $collection->image

                    ? asset(
                        $collection->image
                    )

                    : null,


            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            'status' =>
                $collection->status,

            'online_store' =>
                (bool)
                $collection->online_store,

            'point_of_sale' =>
                (bool)
                $collection->point_of_sale,


            /*
            |--------------------------------------------------------------------------
            | TYPE
            |--------------------------------------------------------------------------
            */

            'collection_type' =>
                $collection
                    ->collection_type,

            'sort_order' =>
                $collection
                    ->sort_order,

            'display_position' =>
                (int)
                $collection
                    ->display_position,


            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */

            'seo_title' =>
                $collection
                    ->seo_title,

            'seo_description' =>
                $collection
                    ->seo_description,


            /*
            |--------------------------------------------------------------------------
            | COUNT
            |--------------------------------------------------------------------------
            */

            'products_count' =>
                isset(
                    $collection
                        ->products_count
                )

                    ? (int)
                    $collection
                        ->products_count

                    : 0,


            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' =>
                $collection
                    ->created_at,

            'updated_at' =>
                $collection
                    ->updated_at,

        ];


        /*
        |--------------------------------------------------------------------------
        | PRODUCTS
        |--------------------------------------------------------------------------
        */

        if (
            $includeProducts &&
            $collection->relationLoaded(
                'products'
            )
        ) {

            $data['products'] =
                $collection
                    ->products
                    ->map(
                        fn ($product) => [

                            ...$this
                                ->productData(
                                    $product
                                ),

                            'sort_order' =>
                                (int)
                                (
                                    $product
                                        ->pivot
                                        ->sort_order
                                    ?? 0
                                ),

                        ]
                    )
                    ->values();

        }


        return $data;
    }


    /*
    |--------------------------------------------------------------------------
    | PRODUCT RESPONSE
    |--------------------------------------------------------------------------
    */

    private function productData(
        Product $product
    ): array {

        /*
        |--------------------------------------------------------------------------
        | COVER IMAGE
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | PRICE
        |--------------------------------------------------------------------------
        */

        $variantPrices =
            $product
                ->variants
                ->pluck(
                    'price'
                )
                ->filter(
                    fn ($price) =>
                        $price !== null
                );


        $price =
            $variantPrices
                ->isNotEmpty()

                ? $variantPrices
                    ->map(
                        fn ($value) =>
                            (float) $value
                    )
                    ->min()

                : (
                    $product->price !== null

                        ? (float)
                        $product->price

                        : null
                );


        return [

            'id' =>
                $product->id,

            'title' =>
                $product->title,

            'slug' =>
                $product->slug,

            'sku' =>
                $product->sku,

            'status' =>
                $product->status,

            'price' =>
                $price,

            'formatted_price' =>
                $price !== null

                    ? '$' .
                      number_format(
                          $price,
                          2
                      )

                    : null,

            'cover_url' =>
                $cover

                    ? asset(
                        $cover->file_path
                    )

                    : null,

        ];
    }


    /*
    |--------------------------------------------------------------------------
    | SYNC MANUAL PRODUCTS
    |--------------------------------------------------------------------------
    */

    private function syncManualProducts(
        Collection $collection,
        array $products
    ): void {

        $syncData = [];


        foreach (
            $products as $index => $item
        ) {

            $productId =
                (int)
                $item['id'];


            $syncData[
                $productId
            ] = [

                'sort_order' =>
                    isset(
                        $item[
                            'sort_order'
                        ]
                    )

                        ? (int)
                        $item[
                            'sort_order'
                        ]

                        : $index,

            ];

        }


        $collection
            ->products()
            ->sync(
                $syncData
            );
    }


    /*
    |--------------------------------------------------------------------------
    | NORMALIZE PRODUCTS
    |--------------------------------------------------------------------------
    |
    | Accepts:
    |
    | [1,2,3]
    |
    | OR
    |
    | [
    |   {"id":1,"sort_order":0},
    |   {"id":2,"sort_order":1}
    | ]
    |
    | OR JSON string from FormData
    |
    */

    private function normalizeProducts(
        $products
    ): array {

        if (
            empty(
                $products
            )
        ) {

            return [];

        }


        /*
        |--------------------------------------------------------------------------
        | JSON STRING
        |--------------------------------------------------------------------------
        */

        if (
            is_string(
                $products
            )
        ) {

            $decoded =
                json_decode(
                    $products,
                    true
                );


            if (
                json_last_error()
                ===
                JSON_ERROR_NONE &&
                is_array(
                    $decoded
                )
            ) {

                $products =
                    $decoded;

            } else {

                return [];

            }

        }


        if (
            ! is_array(
                $products
            )
        ) {

            return [];

        }


        $result = [];


        foreach (
            $products as $index => $item
        ) {

            /*
            |--------------------------------------------------------------------------
            | SIMPLE ID
            |--------------------------------------------------------------------------
            */

            if (
                is_numeric(
                    $item
                )
            ) {

                $result[] = [

                    'id' =>
                        (int) $item,

                    'sort_order' =>
                        $index,

                ];


                continue;
            }


            /*
            |--------------------------------------------------------------------------
            | OBJECT / ARRAY
            |--------------------------------------------------------------------------
            */

            if (
                is_array(
                    $item
                ) &&
                isset(
                    $item['id']
                )
            ) {

                $result[] = [

                    'id' =>
                        (int)
                        $item['id'],

                    'sort_order' =>
                        isset(
                            $item[
                                'sort_order'
                            ]
                        )

                            ? (int)
                            $item[
                                'sort_order'
                            ]

                            : $index,

                ];

            }

        }


        /*
        |--------------------------------------------------------------------------
        | REMOVE DUPLICATES
        |--------------------------------------------------------------------------
        */

        return collect(
            $result
        )
        ->unique('id')
        ->values()
        ->all();
    }


    /*
    |--------------------------------------------------------------------------
    | IMAGE UPLOAD
    |--------------------------------------------------------------------------
    */

    private function uploadImage(
        $image
    ): string {

        $uploadPath =
            public_path(
                'uploads/collections'
            );


        if (
            ! File::exists(
                $uploadPath
            )
        ) {

            File::makeDirectory(
                $uploadPath,
                0755,
                true
            );

        }


        $fileName =
            time()
            . '-'
            . Str::random(12)
            . '.'
            . strtolower(
                $image
                    ->getClientOriginalExtension()
            );


        $image->move(
            $uploadPath,
            $fileName
        );


        return
            'uploads/collections/'
            . $fileName;
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE IMAGE
    |--------------------------------------------------------------------------
    */

    private function deleteImage(
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
                'collection';

        }


        $original =
            $slug;


        $counter =
            1;


        while (true) {

            $query =
                Collection::where(
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
                $original
                . '-'
                . $counter;


            $counter++;

        }


        return $slug;
    }
}
