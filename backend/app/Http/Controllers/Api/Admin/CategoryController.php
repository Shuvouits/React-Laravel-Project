<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class CategoryController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | CATEGORY LIST
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/categories
    |
    | Query:
    | ?tab=all
    | ?tab=active
    | ?tab=featured
    | ?tab=inactive
    | ?search=electronics
    | ?page=1
    |
    */

    public function index(Request $request)
    {

    $query = Category::query()
    ->withCount('products');


        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {

            $search = trim(
                $request->search
            );

            $query->where(function ($q) use ($search) {

                $q->where(
                    'name',
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
        | TAB FILTER
        |--------------------------------------------------------------------------
        */

        $tab = $request->get(
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


            case 'featured':

                $query->where(
                    'is_featured',
                    true
                );

                break;


            case 'inactive':

                $query->where(
                    'status',
                    'inactive'
                );

                break;
        }


        /*
        |--------------------------------------------------------------------------
        | ORDER
        |--------------------------------------------------------------------------
        */

        $query
            ->orderBy(
                'display_order'
            )
            ->orderBy(
                'name'
            );


        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

        $categories = $query
            ->paginate(15);


        /*
        |--------------------------------------------------------------------------
        | FORMAT CATEGORY DATA
        |--------------------------------------------------------------------------
        */

        $categories
            ->getCollection()
            ->transform(
                function ($category) {

                    return $this
                        ->categoryData(
                            $category
                        );

                }
            );


        /*
        |--------------------------------------------------------------------------
        | STATS
        |--------------------------------------------------------------------------
        */

        $stats = [

            'total' =>
                Category::count(),

            'active' =>
                Category::where(
                    'status',
                    'active'
                )->count(),

            'inactive' =>
                Category::where(
                    'status',
                    'inactive'
                )->count(),

            'featured' =>
                Category::where(
                    'is_featured',
                    true
                )->count(),

            'parents' =>
                Category::whereNull(
                    'parent_id'
                )->count(),

            /*
            |--------------------------------------------------------------------------
            | PRODUCTS
            |--------------------------------------------------------------------------
            |
            | Product relation add করার পরে আমরা এখানে actual count বসাব।
            |
            */

            'assigned_products' => 0,

        ];


        return response()->json([

            'status' => true,

            'categories' =>
                $categories,

            'stats' =>
                $stats,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | STORE CATEGORY
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/categories
    |
    */

    public function store(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | NORMALIZE TAGS
        |--------------------------------------------------------------------------
        */

        $request->merge([
            'tags' => $this
                ->normalizeTags(
                    $request->input(
                        'tags'
                    )
                ),
        ]);


        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                'unique:categories,slug',
            ],

            'description' => [
                'nullable',
                'string',
                'max:500',
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'parent_id' => [
                'nullable',
                'integer',
                'exists:categories,id',
            ],

            'status' => [
                'required',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],

            'is_featured' => [
                'nullable',
            ],

            'display_order' => [
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

            'tags' => [
                'nullable',
                'array',
            ],

            'tags.*' => [
                'nullable',
                'string',
                'max:100',
            ],

        ]);


        /*
        |--------------------------------------------------------------------------
        | SLUG
        |--------------------------------------------------------------------------
        */

        $slug = $request->filled(
            'slug'
        )
            ? Str::slug(
                $request->slug
            )
            : Str::slug(
                $request->name
            );


        /*
        |--------------------------------------------------------------------------
        | DOUBLE CHECK UNIQUE SLUG
        |--------------------------------------------------------------------------
        */

        $slug = $this
            ->makeUniqueSlug(
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

        $category = Category::create([

            'name' =>
                $validated['name'],

            'slug' =>
                $slug,

            'description' =>
                $validated['description']
                ?? null,

            'image' =>
                $imagePath,

            'parent_id' =>
                $validated['parent_id']
                ?? null,

            'status' =>
                $validated['status'],

            'is_featured' =>
                $this->toBoolean(
                    $request->input(
                        'is_featured',
                        false
                    )
                ),

            'display_order' =>
                $validated['display_order']
                ?? 0,

            'seo_title' =>
                $validated['seo_title']
                ?? null,

            'seo_description' =>
                $validated['seo_description']
                ?? null,

            'tags' =>
                $validated['tags']
                ?? [],

        ]);


        $category->load(
            'parent:id,name'
        );


        return response()->json([

            'status' => true,

            'message' =>
                'Category created successfully.',

            'category' =>
                $this->categoryData(
                    $category
                ),

        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | SHOW CATEGORY
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/categories/{id}
    |
    */

    public function show($id)
    {
        $category = Category::with([
            'parent:id,name',
            'children:id,name,parent_id',
        ])
        ->findOrFail(
            $id
        );


        return response()->json([

            'status' => true,

            'category' =>
                $this->categoryData(
                    $category
                ),

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE CATEGORY
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/categories/{id}/update
    |
    */

    public function update(
        Request $request,
        $id
    ) {
        $category =
            Category::findOrFail(
                $id
            );


        /*
        |--------------------------------------------------------------------------
        | NORMALIZE TAGS
        |--------------------------------------------------------------------------
        */

        $request->merge([
            'tags' => $this
                ->normalizeTags(
                    $request->input(
                        'tags'
                    )
                ),
        ]);


        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',

                Rule::unique(
                    'categories',
                    'slug'
                )->ignore(
                    $category->id
                ),
            ],

            'description' => [
                'nullable',
                'string',
                'max:500',
            ],

            'image' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'parent_id' => [
                'nullable',
                'integer',
                'exists:categories,id',
            ],

            'status' => [
                'required',
                Rule::in([
                    'active',
                    'inactive',
                ]),
            ],

            'is_featured' => [
                'nullable',
            ],

            'display_order' => [
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

            'tags' => [
                'nullable',
                'array',
            ],

            'tags.*' => [
                'nullable',
                'string',
                'max:100',
            ],

        ]);


        /*
        |--------------------------------------------------------------------------
        | PREVENT SELF PARENT
        |--------------------------------------------------------------------------
        */

        if (
            isset(
                $validated['parent_id']
            ) &&
            (int) $validated['parent_id']
                ===
            (int) $category->id
        ) {

            return response()->json([

                'status' => false,

                'message' =>
                    'A category cannot be its own parent.',

                'errors' => [

                    'parent_id' => [
                        'A category cannot be its own parent.',
                    ],

                ],

            ], 422);
        }


        /*
        |--------------------------------------------------------------------------
        | PREVENT CHILD FROM BECOMING PARENT
        |--------------------------------------------------------------------------
        */

        if (
            ! empty(
                $validated['parent_id']
            ) &&
            $this->isDescendant(
                $category->id,
                $validated['parent_id']
            )
        ) {

            return response()->json([

                'status' => false,

                'message' =>
                    'A child category cannot be selected as the parent.',

                'errors' => [

                    'parent_id' => [
                        'Please select another parent category.',
                    ],

                ],

            ], 422);
        }


        /*
        |--------------------------------------------------------------------------
        | SLUG
        |--------------------------------------------------------------------------
        */

        $slug = $request->filled(
            'slug'
        )
            ? Str::slug(
                $request->slug
            )
            : Str::slug(
                $request->name
            );


        $slug = $this
            ->makeUniqueSlug(
                $slug,
                $category->id
            );


        /*
        |--------------------------------------------------------------------------
        | IMAGE REPLACEMENT
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('image')) {

            /*
            | Delete old file
            */

            $this->deleteImage(
                $category->image
            );


            /*
            | Upload new file
            */

            $category->image =
                $this->uploadImage(
                    $request->file(
                        'image'
                    )
                );

        }


        /*
        |--------------------------------------------------------------------------
        | UPDATE VALUES
        |--------------------------------------------------------------------------
        */

        $category->name =
            $validated['name'];


        $category->slug =
            $slug;


        $category->description =
            $validated['description']
            ?? null;


        $category->parent_id =
            $validated['parent_id']
            ?? null;


        $category->status =
            $validated['status'];


        if (
            $request->exists(
                'is_featured'
            )
        ) {

            $category->is_featured =
                $this->toBoolean(
                    $request->input(
                        'is_featured'
                    )
                );

        }


        $category->display_order =
            $validated['display_order']
            ?? 0;


        $category->seo_title =
            $validated['seo_title']
            ?? null;


        $category->seo_description =
            $validated['seo_description']
            ?? null;


        $category->tags =
            $validated['tags']
            ?? [];


        $category->save();


        $category->load(
            'parent:id,name'
        );


        return response()->json([

            'status' => true,

            'message' =>
                'Category updated successfully.',

            'category' =>
                $this->categoryData(
                    $category
                ),

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | TOGGLE FEATURED
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/categories/{id}/toggle-featured
    |
    */

    public function toggleFeatured($id)
    {
        $category =
            Category::findOrFail(
                $id
            );


        $category->is_featured =
            ! (bool)
            $category->is_featured;


        $category->save();


        return response()->json([

            'status' => true,

            'message' =>
                $category->is_featured

                    ? 'Category added to featured successfully.'

                    : 'Category removed from featured successfully.',

            'category' => [

                'id' =>
                    $category->id,

                'is_featured' =>
                    (bool)
                    $category->is_featured,

            ],

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PARENT CATEGORIES
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/categories/parents
    |
    | Create/Edit parent dropdown-এর জন্য।
    |
    | ?exclude=5
    |
    */

    public function parents(
        Request $request
    ) {
        $query = Category::query()
            ->select([
                'id',
                'name',
                'slug',
                'parent_id',
            ])
            ->where(
                'status',
                'active'
            );


        /*
        |--------------------------------------------------------------------------
        | EXCLUDE CURRENT CATEGORY
        |--------------------------------------------------------------------------
        */

        if (
            $request->filled(
                'exclude'
            )
        ) {

            $excludeId =
                (int)
                $request->exclude;


            $excludeIds = [
                $excludeId,
                ...$this->getDescendantIds(
                    $excludeId
                ),
            ];


            $query->whereNotIn(
                'id',
                $excludeIds
            );

        }


        $categories =
            $query
                ->orderBy(
                    'name'
                )
                ->get();


        return response()->json([

            'status' => true,

            'categories' =>
                $categories,

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE CATEGORY
    |--------------------------------------------------------------------------
    |
    | DELETE /api/admin/categories/{id}
    |
    */

    public function destroy($id)
    {
        $category =
            Category::findOrFail(
                $id
            );


        /*
        |--------------------------------------------------------------------------
        | CHILDREN
        |--------------------------------------------------------------------------
        |
        | Delete parent করলে child categories delete হবে না।
        | তাদের parent_id null হয়ে যাবে।
        |
        */

        Category::where(
            'parent_id',
            $category->id
        )
        ->update([
            'parent_id' => null,
        ]);


        /*
        |--------------------------------------------------------------------------
        | DELETE IMAGE
        |--------------------------------------------------------------------------
        */

        $this->deleteImage(
            $category->image
        );


        /*
        |--------------------------------------------------------------------------
        | DELETE CATEGORY
        |--------------------------------------------------------------------------
        */

        $category->delete();


        return response()->json([

            'status' => true,

            'message' =>
                'Category deleted successfully.',

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CATEGORY RESPONSE
    |--------------------------------------------------------------------------
    */

    private function categoryData(
        Category $category
    ): array {
        return [

            'id' =>
                $category->id,

            'name' =>
                $category->name,

            'slug' =>
                $category->slug,

            'description' =>
                $category->description,

            /*
            |--------------------------------------------------------------------------
            | IMAGE
            |--------------------------------------------------------------------------
            */

            'image' =>
                $category->image,

            'image_url' =>
                $category->image
                    ? asset(
                        $category->image
                    )
                    : null,


            /*
            |--------------------------------------------------------------------------
            | HIERARCHY
            |--------------------------------------------------------------------------
            */

            'parent_id' =>
                $category->parent_id,

            'parent' =>
                $category->relationLoaded(
                    'parent'
                ) && $category->parent

                    ? [

                        'id' =>
                            $category
                                ->parent
                                ->id,

                        'name' =>
                            $category
                                ->parent
                                ->name,

                    ]

                    : null,


            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            'status' =>
                $category->status,

            'is_featured' =>
                (bool)
                $category->is_featured,

            'display_order' =>
                (int)
                $category->display_order,


            /*
            |--------------------------------------------------------------------------
            | PRODUCTS
            |--------------------------------------------------------------------------
            |
            | Product relation add হলে actual count বসাব।
            |
            */

            'products_count' =>
                isset(
                    $category->products_count
                )
                    ? (int)
                    $category->products_count
                    : 0,


            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */

            'seo_title' =>
                $category->seo_title,

            'seo_description' =>
                $category->seo_description,

            'tags' =>
                $category->tags
                ?? [],


            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' =>
                $category->created_at,

            'updated_at' =>
                $category->updated_at,

        ];
    }


    /*
    |--------------------------------------------------------------------------
    | UPLOAD IMAGE
    |--------------------------------------------------------------------------
    */

    private function uploadImage(
        $image
    ): string {
        $uploadPath =
            public_path(
                'uploads/categories'
            );


        /*
        |--------------------------------------------------------------------------
        | CREATE DIRECTORY
        |--------------------------------------------------------------------------
        */

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


        /*
        |--------------------------------------------------------------------------
        | FILE NAME
        |--------------------------------------------------------------------------
        */

        $fileName =
            time()
            . '-'
            . Str::random(12)
            . '.'
            . $image
                ->getClientOriginalExtension();


        /*
        |--------------------------------------------------------------------------
        | MOVE
        |--------------------------------------------------------------------------
        */

        $image->move(
            $uploadPath,
            $fileName
        );


        return
            'uploads/categories/'
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
        if (
            ! $path
        ) {

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
    | BOOLEAN NORMALIZER
    |--------------------------------------------------------------------------
    |
    | Handles:
    |
    | true
    | false
    | 1
    | 0
    | "1"
    | "0"
    | "true"
    | "false"
    |
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
    | NORMALIZE TAGS
    |--------------------------------------------------------------------------
    |
    | Supports:
    |
    | ["electronics", "cables"]
    |
    | OR
    |
    | '["electronics","cables"]'
    |
    | OR
    |
    | "electronics,cables"
    |
    */

    private function normalizeTags(
        $tags
    ): array {
        if (
            empty(
                $tags
            )
        ) {

            return [];

        }


        /*
        |--------------------------------------------------------------------------
        | ALREADY ARRAY
        |--------------------------------------------------------------------------
        */

        if (
            is_array(
                $tags
            )
        ) {

            return collect(
                $tags
            )
                ->map(
                    fn ($tag) =>
                        trim(
                            (string)
                            $tag
                        )
                )
                ->filter()
                ->unique()
                ->values()
                ->all();

        }


        /*
        |--------------------------------------------------------------------------
        | JSON STRING
        |--------------------------------------------------------------------------
        */

        if (
            is_string(
                $tags
            )
        ) {

            $decoded =
                json_decode(
                    $tags,
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

                return collect(
                    $decoded
                )
                    ->map(
                        fn ($tag) =>
                            trim(
                                (string)
                                $tag
                            )
                    )
                    ->filter()
                    ->unique()
                    ->values()
                    ->all();

            }


            /*
            |--------------------------------------------------------------------------
            | COMMA SEPARATED
            |--------------------------------------------------------------------------
            */

            return collect(
                explode(
                    ',',
                    $tags
                )
            )
                ->map(
                    fn ($tag) =>
                        trim(
                            $tag
                        )
                )
                ->filter()
                ->unique()
                ->values()
                ->all();

        }


        return [];
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
        /*
        |--------------------------------------------------------------------------
        | EMPTY SLUG FALLBACK
        |--------------------------------------------------------------------------
        */

        if (
            empty(
                $slug
            )
        ) {

            $slug =
                'category';

        }


        $originalSlug =
            $slug;


        $counter =
            1;


        while (true) {

            $query =
                Category::where(
                    'slug',
                    $slug
                );


            if (
                $ignoreId
            ) {

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
                $originalSlug
                . '-'
                . $counter;


            $counter++;

        }


        return $slug;
    }


    /*
    |--------------------------------------------------------------------------
    | CHECK DESCENDANT
    |--------------------------------------------------------------------------
    |
    | Prevent:
    |
    | Electronics
    |   └── Phones
    |       └── Smartphones
    |
    | Electronics-এর parent যেন Smartphones করা না যায়।
    |
    */

    private function isDescendant(
        $categoryId,
        $possibleDescendantId
    ): bool {
        $descendantIds =
            $this->getDescendantIds(
                $categoryId
            );


        return in_array(
            (int)
            $possibleDescendantId,
            $descendantIds,
            true
        );
    }


    /*
    |--------------------------------------------------------------------------
    | GET DESCENDANT IDS
    |--------------------------------------------------------------------------
    */

    private function getDescendantIds(
        $categoryId
    ): array {
        $ids = [];


        $children =
            Category::where(
                'parent_id',
                $categoryId
            )
            ->pluck(
                'id'
            );


        foreach (
            $children as $childId
        ) {

            $ids[] =
                (int)
                $childId;


            $ids = array_merge(

                $ids,

                $this
                    ->getDescendantIds(
                        $childId
                    )

            );

        }


        return $ids;
    }
}
