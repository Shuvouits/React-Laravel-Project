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

    $section = \App\Models\HomeSection::where(
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
        $validated =
            $request->validate([
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
                $validated['settings']['category_source'],

            'max_categories' =>
                (int)
                    $validated['settings']['max_categories'],
        ];


        $section->save();


        return response()->json([
            'status' => true,

            'message' =>
                'Featured Categories saved successfully.',

            'section' =>
                $section->fresh(),
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
        $validated =
            $request->validate([
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


        $section->title =
            $validated['title'];


        $section->settings = [
            'subtitle' =>
                $validated['settings']['subtitle']
                ?? '',

            'product_source' =>
                $validated['settings']['product_source'],

            'max_products' =>
                (int)
                    $validated['settings']['max_products'],

            'desktop_cards_per_row' =>
                (int)
                    $validated['settings']['desktop_cards_per_row'],
        ];


        $section->save();


        return response()->json([
            'status' => true,

            'message' =>
                'Products on Sale saved successfully.',

            'section' =>
                $section->fresh(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PROMOTIONS & OFFERS
    |--------------------------------------------------------------------------
    */

    if (
        $sectionKey ===
        'promotions'
    ) {
        /*
        |--------------------------------------------------------------------------
        | VALIDATE
        |--------------------------------------------------------------------------
        */

        $validated =
            $request->validate([
                'title' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'settings.cards' => [
                    'required',
                    'array',
                    'max:5',
                ],

                'settings.cards.*.layout' => [
                    'required',
                    'string',
                    'max:100',
                ],

                'settings.cards.*.image_alt' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'settings.cards.*.link' => [
                    'nullable',
                    'string',
                    'max:2048',
                ],

                'settings.cards.*.image_url' => [
                    'nullable',
                    'string',
                    'max:2048',
                ],
            ]);


        /*
        |--------------------------------------------------------------------------
        | CURRENT SETTINGS
        |--------------------------------------------------------------------------
        |
        | Image upload endpoint already saved:
        |
        | image
        | image_url
        |
        | Save button যেন এগুলো delete না করে।
        |
        |--------------------------------------------------------------------------
        */

        $currentSettings =
            is_array(
                $section->settings
            )
                ? $section->settings
                : [];


        $currentCards =
            isset(
                $currentSettings['cards']
            ) &&
            is_array(
                $currentSettings['cards']
            )
                ? $currentSettings['cards']
                : [];


        $incomingCards =
            $validated['settings']['cards'];


        /*
        |--------------------------------------------------------------------------
        | DEFAULT LAYOUTS
        |--------------------------------------------------------------------------
        */

        $defaultLayouts = [
            'tall_left',
            'tall_middle',
            'square_top_right',
            'square_top_right_arrow',
            'wide_bottom_banner',
        ];


        /*
        |--------------------------------------------------------------------------
        | MERGE CARDS
        |--------------------------------------------------------------------------
        */

        $savedCards = [];


        for (
            $index = 0;
            $index < 5;
            $index++
        ) {
            $currentCard =
                $currentCards[$index]
                ?? [];


            $incomingCard =
                $incomingCards[$index]
                ?? [];


            /*
            |--------------------------------------------------------------------------
            | IMPORTANT
            |--------------------------------------------------------------------------
            |
            | image + image_url existing backend data থেকে preserve করবে।
            |
            |--------------------------------------------------------------------------
            */

            $savedCards[] = [
                'layout' =>
                    $incomingCard['layout']
                    ?? $currentCard['layout']
                    ?? $defaultLayouts[$index],

                'image' =>
                    $currentCard['image']
                    ?? '',

                'image_url' =>
                    $currentCard['image_url']
                    ?? $incomingCard['image_url']
                    ?? '',

                'image_alt' =>
                    $incomingCard['image_alt']
                    ?? '',

                'link' =>
                    $incomingCard['link']
                    ?? '/products',
            ];
        }


        /*
        |--------------------------------------------------------------------------
        | SAVE
        |--------------------------------------------------------------------------
        */

        $section->title =
            $validated['title'];


        $currentSettings['cards'] =
            $savedCards;


        $section->settings =
            $currentSettings;


        $section->save();


        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'status' => true,

            'message' =>
                'Promotions & Offers saved successfully.',

            'section' =>
                $section->fresh(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | NOT IMPLEMENTED
    |--------------------------------------------------------------------------
    */

    return response()->json([
        'status' => false,

        'message' =>
            'This section editor is not available yet.',
    ], 422);
}


    public function uploadPromotionImage(
        Request $request,
        $index
    ) {
        /*
    |--------------------------------------------------------------------------
    | VALIDATE CARD INDEX
    |--------------------------------------------------------------------------
    */

        $index = (int) $index;

        if (
            $index < 0 ||
            $index > 4
        ) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid promotion card.',
            ], 422);
        }


        /*
    |--------------------------------------------------------------------------
    | VALIDATE IMAGE
    |--------------------------------------------------------------------------
    */

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
    | FIND PROMOTIONS SECTION
    |--------------------------------------------------------------------------
    */

        $section = \App\Models\HomeSection::where(
            'section_key',
            'promotions'
        )->firstOrFail();


        /*
    |--------------------------------------------------------------------------
    | CURRENT SETTINGS
    |--------------------------------------------------------------------------
    */

        $settings =
            is_array($section->settings)
            ? $section->settings
            : [];


        $cards =
            isset($settings['cards']) &&
            is_array($settings['cards'])
            ? $settings['cards']
            : [];


        /*
    |--------------------------------------------------------------------------
    | DEFAULT CARDS
    |--------------------------------------------------------------------------
    */

        $defaultCards = [
            [
                'layout' => 'tall_left',
                'image' => '',
                'image_url' => '',
                'image_alt' => '',
                'link' => '/products',
            ],

            [
                'layout' => 'tall_middle',
                'image' => '',
                'image_url' => '',
                'image_alt' => '',
                'link' => '/products',
            ],

            [
                'layout' => 'square_top_right',
                'image' => '',
                'image_url' => '',
                'image_alt' => '',
                'link' => '/products',
            ],

            [
                'layout' => 'square_top_right_arrow',
                'image' => '',
                'image_url' => '',
                'image_alt' => '',
                'link' => '/products',
            ],

            [
                'layout' => 'wide_bottom_banner',
                'image' => '',
                'image_url' => '',
                'image_alt' => '',
                'link' => '/products',
            ],
        ];


        /*
    |--------------------------------------------------------------------------
    | ENSURE ALL 5 CARDS EXIST
    |--------------------------------------------------------------------------
    */

        for (
            $i = 0;
            $i < 5;
            $i++
        ) {
            $cards[$i] = array_merge(
                $defaultCards[$i],
                $cards[$i] ?? []
            );
        }


        /*
    |--------------------------------------------------------------------------
    | DELETE OLD IMAGE
    |--------------------------------------------------------------------------
    */

        $oldImage =
            $cards[$index]['image']
            ?? null;


        if (
            $oldImage &&
            str_starts_with(
                $oldImage,
                'uploads/home/promotions/'
            )
        ) {
            $oldPath =
                public_path(
                    $oldImage
                );


            if (
                file_exists(
                    $oldPath
                )
            ) {
                unlink(
                    $oldPath
                );
            }
        }


        /*
    |--------------------------------------------------------------------------
    | UPLOAD DIRECTORY
    |--------------------------------------------------------------------------
    */

        $uploadPath =
            public_path(
                'uploads/home/promotions'
            );


        if (
            ! file_exists(
                $uploadPath
            )
        ) {
            mkdir(
                $uploadPath,
                0755,
                true
            );
        }


        /*
    |--------------------------------------------------------------------------
    | SAVE IMAGE
    |--------------------------------------------------------------------------
    */

        $image =
            $request->file(
                'image'
            );


        $fileName =
            time()
            . '-'
            . uniqid()
            . '.'
            . $image
            ->getClientOriginalExtension();


        $image->move(
            $uploadPath,
            $fileName
        );


        $relativePath =
            'uploads/home/promotions/'
            . $fileName;


        /*
    |--------------------------------------------------------------------------
    | UPDATE CARD
    |--------------------------------------------------------------------------
    */

        $cards[$index] = array_merge(
            $cards[$index],
            [
                'image' =>
                $relativePath,

                'image_url' =>
                asset(
                    $relativePath
                ),
            ]
        );


        /*
    |--------------------------------------------------------------------------
    | SAVE SETTINGS
    |--------------------------------------------------------------------------
    */

        $settings['cards'] =
            array_values(
                $cards
            );


        $section->settings =
            $settings;


        $section->save();


        /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

        return response()->json([
            'status' => true,

            'message' =>
            'Promotion image uploaded successfully.',

            'card_index' =>
            $index,

            'card' =>
            $cards[$index],

            'image' =>
            $relativePath,

            'image_url' =>
            asset(
                $relativePath
            ),
        ]);
    }
}
