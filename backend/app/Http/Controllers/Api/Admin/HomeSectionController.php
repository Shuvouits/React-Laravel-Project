<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\HomeSection;
use Illuminate\Http\Request;

class HomeSectionController extends Controller
{
    // Get all homepage sections.
    public function index()
    {
        $sections = HomeSection::orderBy('sort_order')->get();

        return response()->json([
            'status' => true,
            'sections' => $sections,
        ]);
    }

    // Toggle section visibility.
    public function toggle($section_key)
    {
        $section = HomeSection::where('section_key', $section_key)->firstOrFail();
        $section->is_active = !$section->is_active;
        $section->save();

        return response()->json([
            'status' => true,
            'message' => $section->title . ' visibility updated successfully.',
            'section' => [
                'id' => $section->id,
                'section_key' => $section->section_key,
                'title' => $section->title,
                'is_active' => $section->is_active,
                'sort_order' => $section->sort_order,
            ],
        ]);
    }

    // Update homepage section settings.
public function update(
    Request $request,
    string $sectionKey
) {
    $section = HomeSection::query()
        ->where('section_key', $sectionKey)
        ->firstOrFail();

    /*
    |--------------------------------------------------------------------------
    | Featured Categories
    |--------------------------------------------------------------------------
    */

    if ($sectionKey === 'featured_categories') {
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

        $section->title = trim(
            $validated['title']
        );

        $section->settings = [
            'category_source' =>
                $validated['settings']['category_source'],

            'max_categories' => (int)
                $validated['settings']['max_categories'],
        ];

        $section->save();

        return response()->json([
            'status' => true,
            'message' =>
                'Featured Categories saved successfully.',
            'section' => $section->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Products on Sale
    |--------------------------------------------------------------------------
    */

    if ($sectionKey === 'products_on_sale') {
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

        $section->title = trim(
            $validated['title']
        );

        $section->settings = [
            'subtitle' => trim(
                $validated['settings']['subtitle']
                    ?? ''
            ),

            'product_source' =>
                $validated['settings']['product_source'],

            'max_products' => (int)
                $validated['settings']['max_products'],

            'desktop_cards_per_row' => (int)
                $validated['settings']['desktop_cards_per_row'],
        ];

        $section->save();

        return response()->json([
            'status' => true,
            'message' =>
                'Products on Sale settings saved successfully.',
            'section' => $section->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Promotions & Offers
    |--------------------------------------------------------------------------
    */

    if ($sectionKey === 'promotions') {
        $validated = $request->validate([
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

        $currentSettings = is_array(
            $section->settings
        )
            ? $section->settings
            : [];

        $currentCards = isset(
            $currentSettings['cards']
        ) && is_array(
            $currentSettings['cards']
        )
            ? $currentSettings['cards']
            : [];

        $incomingCards =
            $validated['settings']['cards'];

        $defaultLayouts = [
            'tall_left',
            'tall_middle',
            'square_top_right',
            'square_top_right_arrow',
            'wide_bottom_banner',
        ];

        $savedCards = [];

        for ($index = 0; $index < 5; $index++) {
            $currentCard =
                $currentCards[$index] ?? [];

            $incomingCard =
                $incomingCards[$index] ?? [];

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

                'image_alt' => trim(
                    $incomingCard['image_alt']
                        ?? ''
                ),

                'link' => trim(
                    $incomingCard['link']
                        ?? '/products'
                ),
            ];
        }

        $section->title = trim(
            $validated['title']
        );

        $currentSettings['cards'] =
            $savedCards;

        $section->settings =
            $currentSettings;

        $section->save();

        return response()->json([
            'status' => true,
            'message' =>
                'Promotions & Offers saved successfully.',
            'section' => $section->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Featured Products
    |--------------------------------------------------------------------------
    */

    if ($sectionKey === 'featured_products') {
        $validated = $request->validate([
            'title' => [
                'nullable',
                'string',
                'max:255',
            ],

            'settings.product_source' => [
                'required',
                'in:all_products,featured,latest,on_sale,hand_picked',
            ],

            'settings.product_ids' => [
                'nullable',
                'array',
            ],

            'settings.product_ids.*' => [
                'integer',
                'exists:products,id',
            ],
        ]);

        $productSource =
            $validated['settings']['product_source'];

        $productIds =
            $productSource === 'hand_picked'
                ? array_values(
                    array_unique(
                        $validated['settings']['product_ids']
                            ?? []
                    )
                )
                : [];

        if (
            $productSource === 'hand_picked'
            && empty($productIds)
        ) {
            return response()->json([
                'status' => false,
                'message' =>
                    'Select at least one product for the hand-picked source.',
            ], 422);
        }

        $section->title = trim(
            $validated['title'] ?? ''
        );

        $section->settings = [
            'product_source' =>
                $productSource,

            'product_ids' =>
                $productIds,
        ];

        $section->save();

        return response()->json([
            'status' => true,
            'message' =>
                'Featured Products settings saved successfully.',
            'section' => $section->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Top Vendors
    |--------------------------------------------------------------------------
    */

    if ($sectionKey === 'top_vendors') {
        $validated = $request->validate([
            'title' => [
                'required',
                'string',
                'max:255',
            ],

            'settings.max_vendors' => [
                'required',
                'integer',
                'min:1',
                'max:24',
            ],
        ]);

        $section->title = trim(
            $validated['title']
        );

        $section->settings = [
            'max_vendors' => (int)
                $validated['settings']['max_vendors'],
        ];

        $section->save();

        return response()->json([
            'status' => true,
            'message' =>
                'Top Vendors settings saved successfully.',
            'section' => $section->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Become a Vendor
    |--------------------------------------------------------------------------
    */

    if ($sectionKey === 'become_a_vendor') {
        $validated = $request->validate([
            'settings.title' => [
                'required',
                'string',
                'max:255',
            ],

            'settings.subtitle' => [
                'required',
                'string',
                'max:1000',
            ],

            'settings.button_label' => [
                'required',
                'string',
                'max:100',
            ],

            'settings.button_link' => [
                'required',
                'string',
                'max:2048',
            ],

            'settings.image' => [
                'nullable',
                'string',
                'max:2048',
            ],

            'settings.image_url' => [
                'nullable',
                'string',
                'max:2048',
            ],

            'settings.image_alt' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $currentSettings = is_array(
            $section->settings
        )
            ? $section->settings
            : [];

        $incomingSettings =
            $validated['settings'];

        $savedImage =
            $currentSettings['image']
            ?? $incomingSettings['image']
            ?? '';

        $savedImageUrl =
            $currentSettings['image_url']
            ?? $incomingSettings['image_url']
            ?? '';

        $section->settings = [
            'title' => trim(
                $incomingSettings['title']
            ),

            'subtitle' => trim(
                $incomingSettings['subtitle']
            ),

            'button_label' => trim(
                $incomingSettings['button_label']
            ),

            'button_link' => trim(
                $incomingSettings['button_link']
            ),

            'image' =>
                $savedImage,

            'image_url' =>
                $savedImageUrl,

            'image_alt' => trim(
                $incomingSettings['image_alt']
                    ?? 'Start selling products as a vendor'
            ),
        ];

        $section->save();

        return response()->json([
            'status' => true,
            'message' =>
                'Become a Vendor settings saved successfully.',
            'section' => $section->fresh(),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Unsupported Section
    |--------------------------------------------------------------------------
    */

    return response()->json([
        'status' => false,
        'message' =>
            'This section editor is not available yet.',
    ], 422);
}

    // Upload image for a promotion card.
    public function uploadPromotionImage(Request $request, $index)
    {
        $index = (int) $index;

        if ($index < 0 || $index > 4) {
            return response()->json([
                'status' => false,
                'message' => 'Invalid promotion card.',
            ], 422);
        }

        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $section = HomeSection::where('section_key', 'promotions')->firstOrFail();
        $settings = is_array($section->settings) ? $section->settings : [];
        $cards = isset($settings['cards']) && is_array($settings['cards']) ? $settings['cards'] : [];

        $defaultCards = [
            ['layout' => 'tall_left', 'image' => '', 'image_url' => '', 'image_alt' => '', 'link' => '/products'],
            ['layout' => 'tall_middle', 'image' => '', 'image_url' => '', 'image_alt' => '', 'link' => '/products'],
            ['layout' => 'square_top_right', 'image' => '', 'image_url' => '', 'image_alt' => '', 'link' => '/products'],
            ['layout' => 'square_top_right_arrow', 'image' => '', 'image_url' => '', 'image_alt' => '', 'link' => '/products'],
            ['layout' => 'wide_bottom_banner', 'image' => '', 'image_url' => '', 'image_alt' => '', 'link' => '/products'],
        ];

        for ($i = 0; $i < 5; $i++) {
            $cards[$i] = array_merge($defaultCards[$i], $cards[$i] ?? []);
        }

        // Delete previous uploaded image.
        $oldImage = $cards[$index]['image'] ?? null;

        if ($oldImage && str_starts_with($oldImage, 'uploads/home/promotions/')) {
            $oldPath = public_path($oldImage);
            if (file_exists($oldPath)) unlink($oldPath);
        }

        // Prepare upload directory.
        $uploadPath = public_path('uploads/home/promotions');
        if (!file_exists($uploadPath)) mkdir($uploadPath, 0755, true);

        // Save new image.
        $image = $request->file('image');
        $fileName = time() . '-' . uniqid() . '.' . $image->getClientOriginalExtension();
        $image->move($uploadPath, $fileName);

        $relativePath = 'uploads/home/promotions/' . $fileName;

        // Update selected promotion card.
        $cards[$index] = array_merge($cards[$index], [
            'image' => $relativePath,
            'image_url' => asset($relativePath),
        ]);

        $settings['cards'] = array_values($cards);
        $section->settings = $settings;
        $section->save();

        return response()->json([
            'status' => true,
            'message' => 'Promotion image uploaded successfully.',
            'card_index' => $index,
            'card' => $cards[$index],
            'image' => $relativePath,
            'image_url' => asset($relativePath),
        ]);
    }


    public function uploadBecomeVendorImage(
    Request $request
) {
    $validated = $request->validate([
        'image' => [
            'required',
            'image',
            'mimes:jpg,jpeg,png,webp',
            'max:5120',
        ],
    ]);

    $section = HomeSection::query()
        ->where(
            'section_key',
            'become_a_vendor'
        )
        ->firstOrFail();

    $settings = is_array($section->settings)
        ? $section->settings
        : [];

    $oldImage = $settings['image'] ?? null;

    $uploadDirectory = public_path(
        'uploads/home/become-vendor'
    );

    if (!file_exists($uploadDirectory)) {
        mkdir(
            $uploadDirectory,
            0755,
            true
        );
    }

    $image = $validated['image'];

    $extension = strtolower(
        $image->getClientOriginalExtension()
    );

    $fileName = now()->format('YmdHis')
        . '-'
        . uniqid()
        . '.'
        . $extension;

    $image->move(
        $uploadDirectory,
        $fileName
    );

    $relativePath =
        'uploads/home/become-vendor/'
        . $fileName;

    $settings = array_merge(
        [
            'title' =>
                'Start Selling With Us Today',

            'subtitle' =>
                'Join our marketplace, manage products easily, accept secure payments, and grow your business faster.',

            'button_label' =>
                'Become a Vendor',

            'button_link' =>
                '/become-vendor',

            'image' => '',

            'image_url' => '',

            'image_alt' =>
                'Start selling products as a vendor',
        ],
        $settings,
        [
            'image' => $relativePath,
            'image_url' => asset(
                $relativePath
            ),
        ]
    );

    $section->settings = $settings;
    $section->save();

    if (
        $oldImage &&
        $oldImage !== $relativePath &&
        str_starts_with(
            $oldImage,
            'uploads/home/become-vendor/'
        )
    ) {
        $oldImagePath = public_path(
            $oldImage
        );

        if (file_exists($oldImagePath)) {
            unlink($oldImagePath);
        }
    }

    return response()->json([
        'status' => true,
        'message' =>
            'Become a Vendor image uploaded successfully.',

        'image' => $relativePath,

        'image_url' => asset(
            $relativePath
        ),

        'section' => $section->fresh(),
    ]);
}





}
