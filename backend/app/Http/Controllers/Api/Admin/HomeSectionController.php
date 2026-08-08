<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HomeSection;
use Illuminate\Http\Request;

class HomeSectionController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GET ALL HOME SECTIONS
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/home-sections
    |
    */

    public function index()
    {
        $sections = HomeSection::orderBy('sort_order')
            ->get();

        return response()->json([
            'status' => true,
            'sections' => $sections,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | TOGGLE SECTION VISIBILITY
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/home-sections/{section_key}/toggle
    |
    */

    public function toggle($section_key)
    {
        $section = HomeSection::where(
            'section_key',
            $section_key
        )->firstOrFail();


        $section->is_active =
            ! $section->is_active;


        $section->save();


        return response()->json([
            'status' => true,

            'message' =>
            $section->title .
                ' visibility updated successfully.',

            'section' => [
                'id' => $section->id,

                'section_key' =>
                $section->section_key,

                'title' =>
                $section->title,

                'is_active' =>
                $section->is_active,

                'sort_order' =>
                $section->sort_order,
            ],
        ]);
    }


    /*
|--------------------------------------------------------------------------
| UPDATE SECTION SETTINGS
|--------------------------------------------------------------------------
*/

   public function update(
    Request $request,
    $sectionKey
) {
    /*
    |--------------------------------------------------------------------------
    | FIND SECTION
    |--------------------------------------------------------------------------
    */

    $section = HomeSection::where(
        'section_key',
        $sectionKey
    )->firstOrFail();


    /*
    |--------------------------------------------------------------------------
    | FEATURED CATEGORIES
    |--------------------------------------------------------------------------
    */

    if (
        $sectionKey ===
        'featured_categories'
    ) {

        $validated = $request->validate([

            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'settings.category_source' => [
                'required',
                'in:featured,top_level',
            ],

            'settings.max_categories' => [
                'required',
                'integer',
                'min:1',
                'max:20',
            ],

        ]);


        $section->title =
            $validated['title'];


        $section->settings = [

            'category_source' =>
                $validated['settings']
                    ['category_source'],

            'max_categories' =>
                (int) $validated['settings']
                    ['max_categories'],

        ];


        $section->save();


        return response()->json([

            'status' => true,

            'message' =>
                'Featured Categories settings saved successfully.',

            'section' => [

                'id' =>
                    $section->id,

                'section_key' =>
                    $section->section_key,

                'title' =>
                    $section->title,

                'is_active' =>
                    (bool) $section->is_active,

                'sort_order' =>
                    (int) $section->sort_order,

                'settings' =>
                    $section->settings ?? [],

            ],

        ]);

    }


    /*
    |--------------------------------------------------------------------------
    | PRODUCTS ON SALE
    |--------------------------------------------------------------------------
    */

    if (
        $sectionKey ===
        'products_on_sale'
    ) {

        $validated = $request->validate([

            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'settings.subtitle' => [
                'nullable',
                'string',
                'max:255',
            ],

            'settings.product_source' => [
                'required',
                'in:on_sale,latest,featured',
            ],

            'settings.max_products' => [
                'required',
                'integer',
                'min:1',
                'max:24',
            ],

            'settings.desktop_cards_per_row' => [
                'required',
                'integer',
                'min:2',
                'max:6',
            ],

        ]);


        /*
        |--------------------------------------------------------------------------
        | SAVE TITLE
        |--------------------------------------------------------------------------
        */

        $section->title =
            $validated['title'];


        /*
        |--------------------------------------------------------------------------
        | SAVE SETTINGS
        |--------------------------------------------------------------------------
        */

        $section->settings = [

            'subtitle' =>
                $validated['settings']
                    ['subtitle']
                ?? '',

            'product_source' =>
                $validated['settings']
                    ['product_source'],

            'max_products' =>
                (int) $validated['settings']
                    ['max_products'],

            'desktop_cards_per_row' =>
                (int) $validated['settings']
                    ['desktop_cards_per_row'],

        ];


        $section->save();


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([

            'status' => true,

            'message' =>
                'Products on Sale settings saved successfully.',

            'section' => [

                'id' =>
                    $section->id,

                'section_key' =>
                    $section->section_key,

                'title' =>
                    $section->title,

                'is_active' =>
                    (bool) $section->is_active,

                'sort_order' =>
                    (int) $section->sort_order,

                'settings' =>
                    $section->settings ?? [],

            ],

        ]);

    }


    /*
    |--------------------------------------------------------------------------
    | OTHER SECTION EDITORS
    |--------------------------------------------------------------------------
    */

    return response()->json([

        'status' => false,

        'message' =>
            'This section editor is not available yet.',

    ], 422);
}





}
