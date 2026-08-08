<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class BrandController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/brands
    |
    */

    public function index(Request $request)
    {
        $query = Brand::query()
            ->withCount('products');


        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($request->filled('search')) {

            $search = $request->search;

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

            case 'pending':

                $query->where(
                    'approval_status',
                    'pending'
                );

                break;


            case 'active':

                $query
                    ->where(
                        'status',
                        'active'
                    )
                    ->where(
                        'approval_status',
                        'approved'
                    );

                break;


            case 'featured':

                $query
                    ->where(
                        'is_featured',
                        true
                    )
                    ->where(
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


            case 'rejected':

                $query->where(
                    'approval_status',
                    'rejected'
                );

                break;


            case 'archived':

                $query->where(
                    'status',
                    'archived'
                );

                break;


            default:

                $query->where(
                    'status',
                    '!=',
                    'archived'
                );

                break;
        }


        /*
        |--------------------------------------------------------------------------
        | SORT
        |--------------------------------------------------------------------------
        */

        $query
            ->orderBy('display_order')
            ->orderByDesc('id');


        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

        $brands = $query->paginate(10);


        /*
        |--------------------------------------------------------------------------
        | FORMAT RESPONSE
        |--------------------------------------------------------------------------
        */

        $brands->getCollection()->transform(
            function ($brand) {

                return $this->brandData(
                    $brand
                );
            }
        );


        /*
        |--------------------------------------------------------------------------
        | DASHBOARD STATS
        |--------------------------------------------------------------------------
        */

        $stats = [

            'total' =>
            Brand::where(
                'status',
                '!=',
                'archived'
            )->count(),

            'active' =>
            Brand::where(
                'status',
                'active'
            )
                ->where(
                    'approval_status',
                    'approved'
                )
                ->count(),

            'inactive' =>
            Brand::where(
                'status',
                'inactive'
            )->count(),

            'pending' =>
            Brand::where(
                'approval_status',
                'pending'
            )->count(),

            'featured' =>
            Brand::where(
                'is_featured',
                true
            )
                ->where(
                    'status',
                    'active'
                )->count(),

        ];


        return response()->json([
            'status' => true,
            'stats' => $stats,
            'brands' => $brands,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/brands
    |
    */

    public function store(Request $request)
    {
        $request->validate([

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                'unique:brands,slug',
            ],

            'description' => [
                'nullable',
                'string',
                'max:500',
            ],

            'website' => [
                'nullable',
                'url',
                'max:2048',
            ],

            'logo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:3072',
            ],

            'status' => [
                'nullable',
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

        ]);


        /*
        |--------------------------------------------------------------------------
        | UNIQUE SLUG
        |--------------------------------------------------------------------------
        */

        $slug = $request->filled('slug')
            ? Str::slug($request->slug)
            : Str::slug($request->name);


        $baseSlug = $slug;

        $counter = 1;


        while (
            Brand::where(
                'slug',
                $slug
            )->exists()
        ) {

            $slug =
                $baseSlug .
                '-' .
                $counter;

            $counter++;
        }


        /*
        |--------------------------------------------------------------------------
        | LOGO UPLOAD
        |--------------------------------------------------------------------------
        */

        $logoPath = null;


        if ($request->hasFile('logo')) {

            $uploadPath =
                public_path(
                    'uploads/brands'
                );


            if (!File::exists($uploadPath)) {

                File::makeDirectory(
                    $uploadPath,
                    0755,
                    true
                );
            }


            $logo =
                $request->file('logo');


            $fileName =
                time() .
                '-' .
                uniqid() .
                '.' .
                $logo->getClientOriginalExtension();


            $logo->move(
                $uploadPath,
                $fileName
            );


            $logoPath =
                'uploads/brands/' .
                $fileName;
        }


        /*
        |--------------------------------------------------------------------------
        | CREATE BRAND
        |--------------------------------------------------------------------------
        */

        $brand = Brand::create([

            'name' =>
            $request->name,

            'slug' =>
            $slug,

            'description' =>
            $request->description,

            'website' =>
            $request->website,

            'logo' =>
            $logoPath,

            'source' =>
            'official',

            'vendor_id' =>
            null,

            'approval_status' =>
            'approved',

            'status' =>
            $request->input(
                'status',
                'active'
            ),

            'is_featured' =>
            filter_var(
                $request->input(
                    'is_featured',
                    false
                ),
                FILTER_VALIDATE_BOOLEAN
            ),

            'display_order' =>
            $request->input(
                'display_order',
                0
            ),

            'seo_title' =>
            $request->seo_title,

            'seo_description' =>
            $request->seo_description,

        ]);


        return response()->json([
            'status' => true,
            'message' =>
            'Brand created successfully.',
            'brand' =>
            $this->brandData($brand),
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */

    public function show($id)
    {
        $brand =
            Brand::findOrFail($id);


        return response()->json([
            'status' => true,
            'brand' =>
            $this->brandData(
                $brand
            ),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        $id
    ) {
        $brand =
            Brand::findOrFail($id);


        $request->validate([

            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'slug' => [
                'required',
                'string',
                'max:255',

                Rule::unique(
                    'brands',
                    'slug'
                )->ignore($brand->id),
            ],

            'description' => [
                'nullable',
                'string',
                'max:500',
            ],

            'website' => [
                'nullable',
                'url',
                'max:2048',
            ],

            'logo' => [
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:3072',
            ],

            'status' => [
                'required',
                Rule::in([
                    'active',
                    'inactive',
                    'archived',
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

        ]);


        /*
        |--------------------------------------------------------------------------
        | LOGO
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('logo')) {

            if (
                $brand->logo &&
                File::exists(
                    public_path(
                        $brand->logo
                    )
                )
            ) {

                File::delete(
                    public_path(
                        $brand->logo
                    )
                );
            }


            $uploadPath =
                public_path(
                    'uploads/brands'
                );


            if (!File::exists($uploadPath)) {

                File::makeDirectory(
                    $uploadPath,
                    0755,
                    true
                );
            }


            $logo =
                $request->file('logo');


            $fileName =
                time() .
                '-' .
                uniqid() .
                '.' .
                $logo->getClientOriginalExtension();


            $logo->move(
                $uploadPath,
                $fileName
            );


            $brand->logo =
                'uploads/brands/' .
                $fileName;
        }


        $brand->name =
            $request->name;

        $brand->slug =
            Str::slug(
                $request->slug
            );

        $brand->description =
            $request->description;

        $brand->website =
            $request->website;

        $brand->status =
            $request->status;

        $brand->is_featured =
            filter_var(
                $request->input(
                    'is_featured',
                    false
                ),
                FILTER_VALIDATE_BOOLEAN
            );

        $brand->display_order =
            $request->input(
                'display_order',
                0
            );

        $brand->seo_title =
            $request->seo_title;

        $brand->seo_description =
            $request->seo_description;


        $brand->save();


        return response()->json([
            'status' => true,
            'message' =>
            'Brand updated successfully.',
            'brand' =>
            $this->brandData(
                $brand
            ),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | TOGGLE FEATURED
    |--------------------------------------------------------------------------
    */

    /*
|--------------------------------------------------------------------------
| TOGGLE FEATURED
|--------------------------------------------------------------------------
*/

    public function toggleFeatured($id)
    {
        $brand = Brand::findOrFail($id);

        $brand->is_featured =
            ! (bool) $brand->is_featured;

        $brand->save();

        return response()->json([
            'status' => true,

            'message' => $brand->is_featured
                ? 'Brand added to featured successfully.'
                : 'Brand removed from featured successfully.',

            'brand' => [
                'id' => $brand->id,
                'is_featured' => (bool) $brand->is_featured,
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | ARCHIVE
    |--------------------------------------------------------------------------
    */

    public function archive($id)
    {
        $brand =
            Brand::findOrFail($id);


        $brand->status =
            'archived';


        $brand->save();


        return response()->json([
            'status' => true,
            'message' =>
            'Brand archived successfully.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE
    |--------------------------------------------------------------------------
    */

    public function destroy($id)
    {
        $brand =
            Brand::findOrFail($id);


        if (
            $brand->logo &&
            File::exists(
                public_path(
                    $brand->logo
                )
            )
        ) {

            File::delete(
                public_path(
                    $brand->logo
                )
            );
        }


        $brand->delete();


        return response()->json([
            'status' => true,
            'message' =>
            'Brand deleted successfully.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | RESPONSE FORMAT
    |--------------------------------------------------------------------------
    */

   /*
|--------------------------------------------------------------------------
| RESPONSE FORMAT
|--------------------------------------------------------------------------
*/

private function brandData($brand)
{
    return [

        'id' =>
            $brand->id,

        'name' =>
            $brand->name,

        'slug' =>
            $brand->slug,

        'description' =>
            $brand->description,

        'website' =>
            $brand->website,

        'logo' =>
            $brand->logo,

        'logo_url' =>
            $brand->logo
                ? asset($brand->logo)
                : null,

        'source' =>
            $brand->source,

        'vendor_id' =>
            $brand->vendor_id,

        'approval_status' =>
            $brand->approval_status,

        'status' =>
            $brand->status,

        'is_featured' =>
            (bool) $brand->is_featured,

        'display_order' =>
            (int) $brand->display_order,

        'seo_title' =>
            $brand->seo_title,

        'seo_description' =>
            $brand->seo_description,


        /*
        |--------------------------------------------------------------------------
        | PRODUCTS COUNT
        |--------------------------------------------------------------------------
        */

        'products_count' =>
            array_key_exists(
                'products_count',
                $brand->getAttributes()
            )
                ? (int) $brand->products_count
                : $brand->products()->count(),


        'created_at' =>
            $brand->created_at,

    ];
}



}
