<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HeroSlide;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HeroSlideController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GET ALL HERO SLIDES
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/hero-slides
    |
    */

    public function index()
    {
        $slides = HeroSlide::orderBy('sort_order')
            ->get()
            ->map(function ($slide) {

                return [
                    'id' => $slide->id,

                    'image' => $slide->image,

                    'image_url' => $slide->image
                        ? asset($slide->image)
                        : null,

                    'image_alt' => $slide->image_alt,

                    'link' => $slide->link,

                    'sort_order' => $slide->sort_order,

                    'is_active' => $slide->is_active,

                    'created_at' => $slide->created_at,

                    'updated_at' => $slide->updated_at,
                ];
            });


        return response()->json([
            'status' => true,
            'slides' => $slides,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE HERO SLIDE
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/hero-slides
    |
    */

    public function store(Request $request)
    {
        $validated = $request->validate([

            'image' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],

            'image_alt' => [
                'nullable',
                'string',
                'max:255',
            ],

            'link' => [
                'nullable',
                'string',
                'max:2048',
            ],

            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],

        ]);


        /*
        |--------------------------------------------------------------------------
        | CREATE PUBLIC DIRECTORY
        |--------------------------------------------------------------------------
        */

        $uploadPath = public_path('uploads/hero-slides');

        if (! file_exists($uploadPath)) {
            mkdir(
                $uploadPath,
                0755,
                true
            );
        }


        /*
        |--------------------------------------------------------------------------
        | UPLOAD IMAGE
        |--------------------------------------------------------------------------
        */

        $image = $request->file('image');

        $fileName =
            time()
            . '-'
            . Str::random(10)
            . '.'
            . $image->getClientOriginalExtension();


        $image->move(
            $uploadPath,
            $fileName
        );


        /*
        |--------------------------------------------------------------------------
        | IMAGE PATH SAVED IN DATABASE
        |--------------------------------------------------------------------------
        */

        $imagePath =
            'uploads/hero-slides/'
            . $fileName;


        /*
        |--------------------------------------------------------------------------
        | AUTOMATIC SORT ORDER
        |--------------------------------------------------------------------------
        */

        $sortOrder =
            $request->filled('sort_order')
                ? $validated['sort_order']
                : HeroSlide::max('sort_order') + 1;


        /*
        |--------------------------------------------------------------------------
        | CREATE
        |--------------------------------------------------------------------------
        */

        $slide = HeroSlide::create([

            'image' => $imagePath,

            'image_alt' =>
                $validated['image_alt']
                ?? null,

            'link' =>
                $validated['link']
                ?? null,

            'sort_order' =>
                $sortOrder,

            'is_active' =>
                $request->has('is_active')
                    ? $request->boolean('is_active')
                    : true,

        ]);


        return response()->json([
            'status' => true,

            'message' =>
                'Hero slide created successfully.',

            'slide' => [
                'id' => $slide->id,

                'image' => $slide->image,

                'image_url' =>
                    asset($slide->image),

                'image_alt' =>
                    $slide->image_alt,

                'link' =>
                    $slide->link,

                'sort_order' =>
                    $slide->sort_order,

                'is_active' =>
                    $slide->is_active,
            ],

        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | GET SINGLE SLIDE
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/hero-slides/{id}
    |
    */

    public function show($id)
    {
        $slide = HeroSlide::findOrFail($id);


        return response()->json([
            'status' => true,

            'slide' => [
                'id' => $slide->id,

                'image' => $slide->image,

                'image_url' =>
                    asset($slide->image),

                'image_alt' =>
                    $slide->image_alt,

                'link' =>
                    $slide->link,

                'sort_order' =>
                    $slide->sort_order,

                'is_active' =>
                    $slide->is_active,
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE HERO SLIDE
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/hero-slides/{id}/update
    |
    */

    public function update(Request $request, $id)
{
    $slide = HeroSlide::findOrFail($id);

    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    $request->validate([
        'image' => [
            'nullable',
            'image',
            'mimes:jpg,jpeg,png,webp',
            'max:5120',
        ],

        'image_alt' => [
            'nullable',
            'string',
            'max:255',
        ],

        'link' => [
            'nullable',
            'string',
            'max:2048',
        ],

        'sort_order' => [
            'nullable',
            'integer',
            'min:0',
        ],

        'is_active' => [
            'nullable',
        ],
    ]);


    /*
    |--------------------------------------------------------------------------
    | UPDATE IMAGE
    |--------------------------------------------------------------------------
    */

    if ($request->hasFile('image')) {

        /*
        |--------------------------------------------------------------------------
        | DELETE OLD IMAGE
        |--------------------------------------------------------------------------
        */

        if (
            $slide->image &&
            file_exists(public_path($slide->image))
        ) {
            unlink(
                public_path($slide->image)
            );
        }


        /*
        |--------------------------------------------------------------------------
        | UPLOAD DIRECTORY
        |--------------------------------------------------------------------------
        */

        $uploadPath = public_path(
            'uploads/hero-slides'
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
        | UPLOAD NEW IMAGE
        |--------------------------------------------------------------------------
        */

        $image = $request->file('image');


        $fileName =
            time()
            . '-'
            . uniqid()
            . '.'
            . $image->getClientOriginalExtension();


        $image->move(
            $uploadPath,
            $fileName
        );


        $slide->image =
            'uploads/hero-slides/'
            . $fileName;
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE ALT TEXT
    |--------------------------------------------------------------------------
    */

    $slide->image_alt =
        $request->input(
            'image_alt',
            $slide->image_alt
        );


    /*
    |--------------------------------------------------------------------------
    | UPDATE LINK
    |--------------------------------------------------------------------------
    */

    $slide->link =
        $request->input(
            'link',
            $slide->link
        );


    /*
    |--------------------------------------------------------------------------
    | UPDATE SORT ORDER
    |--------------------------------------------------------------------------
    */

    if ($request->filled('sort_order')) {

        $slide->sort_order =
            $request->input('sort_order');
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE STATUS
    |--------------------------------------------------------------------------
    */

    if ($request->exists('is_active')) {

        $slide->is_active =
            filter_var(
                $request->input('is_active'),
                FILTER_VALIDATE_BOOLEAN
            );
    }


    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    $slide->save();


    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return response()->json([
        'status' => true,

        'message' =>
            'Hero slide updated successfully.',

        'slide' => [
            'id' =>
                $slide->id,

            'image' =>
                $slide->image,

            'image_url' =>
                asset($slide->image),

            'image_alt' =>
                $slide->image_alt,

            'link' =>
                $slide->link,

            'sort_order' =>
                $slide->sort_order,

            'is_active' =>
                (bool) $slide->is_active,
        ],
    ]);
}


    /*
    |--------------------------------------------------------------------------
    | DELETE HERO SLIDE
    |--------------------------------------------------------------------------
    |
    | DELETE /api/admin/hero-slides/{id}
    |
    */

    public function destroy($id)
    {
        $slide = HeroSlide::findOrFail($id);


        /*
        |--------------------------------------------------------------------------
        | DELETE IMAGE FROM PUBLIC
        |--------------------------------------------------------------------------
        */

        if (
            $slide->image &&
            file_exists(
                public_path($slide->image)
            )
        ) {

            unlink(
                public_path($slide->image)
            );
        }


        /*
        |--------------------------------------------------------------------------
        | DELETE DATABASE ROW
        |--------------------------------------------------------------------------
        */

        $slide->delete();


        return response()->json([
            'status' => true,

            'message' =>
                'Hero slide deleted successfully.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | TOGGLE VISIBILITY
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/hero-slides/{id}/toggle
    |
    */

    public function toggle($id)
    {
        $slide = HeroSlide::findOrFail($id);


        $slide->is_active =
            ! $slide->is_active;


        $slide->save();


        return response()->json([
            'status' => true,

            'message' =>
                'Hero slide visibility updated.',

            'is_active' =>
                $slide->is_active,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | REORDER HERO SLIDES
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/hero-slides/reorder
    |
    */

    public function reorder(Request $request)
    {
        $validated = $request->validate([

            'slides' => [
                'required',
                'array',
            ],

            'slides.*.id' => [
                'required',
                'integer',
                'exists:hero_slides,id',
            ],

            'slides.*.sort_order' => [
                'required',
                'integer',
                'min:0',
            ],

        ]);


        DB::transaction(function () use ($validated) {

            foreach (
                $validated['slides']
                as $item
            ) {

                HeroSlide::where(
                    'id',
                    $item['id']
                )->update([

                    'sort_order' =>
                        $item['sort_order']

                ]);
            }

        });


        return response()->json([
            'status' => true,

            'message' =>
                'Hero slides reordered successfully.',
        ]);
    }
}
