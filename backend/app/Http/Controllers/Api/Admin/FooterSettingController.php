<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\FooterSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class FooterSettingController extends Controller
{
    public function show(): JsonResponse
    {
        $footer = $this->getFooter();

        return response()->json([
            'status' => true,
            'footer' => $this->formatFooter(
                $footer
            ),
        ]);
    }

    public function update(
        Request $request,
        string $sectionKey
    ): JsonResponse {
        $footer = $this->getFooter();

        if (
            $sectionKey ===
            'store_information'
        ) {
            $validated = $request->validate([
                'store_name' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'description' => [
                    'nullable',
                    'string',
                    'max:2000',
                ],
                'contact_title' => [
                    'nullable',
                    'string',
                    'max:255',
                ],
                'phone' => [
                    'nullable',
                    'string',
                    'max:100',
                ],
                'email' => [
                    'nullable',
                    'email',
                    'max:255',
                ],
                'address' => [
                    'nullable',
                    'string',
                    'max:500',
                ],
            ]);

            $footer->store_information = [
                'key' =>
                    'store_information',

                'type' =>
                    'store',

                'editor_title' =>
                    'Store Information',

                'store_name' => trim(
                    $validated['store_name']
                ),

                'description' => trim(
                    $validated['description']
                        ?? ''
                ),

                'contact_title' => trim(
                    $validated['contact_title']
                        ?? ''
                ),

                'phone' => trim(
                    $validated['phone']
                        ?? ''
                ),

                'email' => trim(
                    $validated['email']
                        ?? ''
                ),

                'address' => trim(
                    $validated['address']
                        ?? ''
                ),
            ];

            $footer->save();
        } elseif (
            in_array(
                $sectionKey,
                [
                    'products',
                    'help',
                    'company',
                    'legal',
                ],
                true
            )
        ) {
            $validated = $request->validate([
                'title' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'links' => [
                    'nullable',
                    'array',
                    'max:20',
                ],
                'links.*.id' => [
                    'nullable',
                    'string',
                    'max:255',
                ],
                'links.*.label' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'links.*.url' => [
                    'required',
                    'string',
                    'max:2048',
                ],
            ]);

            $menus = is_array(
                $footer->menus
            )
                ? $footer->menus
                : [];

            $updatedMenu = [
                'key' =>
                    $sectionKey,

                'type' =>
                    'menu',

                'title' => trim(
                    $validated['title']
                ),

                'links' =>
                    $this->formatLinks(
                        $validated['links']
                            ?? [],
                        $sectionKey
                    ),
            ];

            $menuUpdated = false;

            foreach (
                $menus as $index => $menu
            ) {
                if (
                    ($menu['key'] ?? null)
                    !== $sectionKey
                ) {
                    continue;
                }

                $menus[$index] =
                    $updatedMenu;

                $menuUpdated = true;
                break;
            }

            if (!$menuUpdated) {
                $menus[] =
                    $updatedMenu;
            }

            $footer->menus =
                array_values($menus);

            $footer->save();
        } elseif (
            $sectionKey ===
            'social_links'
        ) {
            $validated = $request->validate([
                'title' => [
                    'nullable',
                    'string',
                    'max:255',
                ],
                'links' => [
                    'nullable',
                    'array',
                    'max:20',
                ],
                'links.*.id' => [
                    'nullable',
                    'string',
                    'max:255',
                ],
                'links.*.label' => [
                    'required',
                    'string',
                    'max:255',
                ],
                'links.*.shortLabel' => [
                    'nullable',
                    'string',
                    'max:10',
                ],
                'links.*.url' => [
                    'required',
                    'string',
                    'max:2048',
                ],
            ]);

            $links = [];

            foreach (
                $validated['links']
                    ?? [] as $index => $link
            ) {
                $links[] = [
                    'id' =>
                        $link['id']
                        ?? 'social-'
                            . ($index + 1),

                    'label' => trim(
                        $link['label']
                    ),

                    'shortLabel' => trim(
                        $link['shortLabel']
                            ?? ''
                    ),

                    'url' => trim(
                        $link['url']
                    ),
                ];
            }

            $footer->social_links = [
                'key' =>
                    'social_links',

                'type' =>
                    'social',

                'title' => trim(
                    $validated['title']
                        ?? 'Social Links'
                ),

                'links' =>
                    $links,
            ];

            $footer->save();
        } elseif (
            $sectionKey ===
            'copyright'
        ) {
            $validated = $request->validate([
                'text' => [
                    'required',
                    'string',
                    'max:500',
                ],
            ]);

            $footer->copyright_text = trim(
                $validated['text']
            );

            $footer->save();
        } else {
            return response()->json([
                'status' => false,
                'message' =>
                    'Invalid footer section.',
            ], 422);
        }

        return response()->json([
            'status' => true,
            'message' =>
                'Footer section updated successfully.',
            'footer' =>
                $this->formatFooter(
                    $footer->fresh()
                ),
        ]);
    }

    private function getFooter(): FooterSetting
    {
        return FooterSetting::query()
            ->firstOrCreate(
                ['id' => 1],
                $this->defaultFooter()
            );
    }

    private function formatLinks(
        array $links,
        string $prefix
    ): array {
        $formattedLinks = [];

        foreach (
            $links as $index => $link
        ) {
            $formattedLinks[] = [
                'id' =>
                    $link['id']
                    ?? $prefix
                        . '-'
                        . ($index + 1),

                'label' => trim(
                    $link['label']
                ),

                'url' => trim(
                    $link['url']
                ),
            ];
        }

        return $formattedLinks;
    }

    private function formatFooter(
        FooterSetting $footer
    ): array {
        return [
            'id' =>
                $footer->id,

            'store_information' =>
                $footer->store_information,

            'menus' =>
                $footer->menus,

            'social_links' =>
                $footer->social_links,

            'copyright' => [
                'key' =>
                    'copyright',

                'type' =>
                    'copyright',

                'editor_title' =>
                    'Copyright',

                'text' =>
                    $footer->copyright_text,
            ],

            'is_active' =>
                (bool) $footer->is_active,

            'updated_at' =>
                $footer->updated_at,
        ];
    }

    private function defaultFooter(): array
    {
        return [
            'store_information' => [
                'key' =>
                    'store_information',

                'type' =>
                    'store',

                'editor_title' =>
                    'Store Information',

                'store_name' =>
                    'Storify',

                'description' =>
                    'Storify is a modern self-hosted eCommerce platform built with Next.js for online stores, retail POS businesses, and multi-vendor marketplaces.',

                'contact_title' =>
                    'Contact',

                'phone' =>
                    '+1 775 986 5200',

                'email' =>
                    'store@example.com',

                'address' =>
                    'Main Street, New York, 1000',
            ],

            'menus' => [
                $this->defaultMenu(
                    'products',
                    'Products',
                    [
                        ['Products', '/products'],
                        ['Categories', '/categories'],
                        ['Collections', '/collections'],
                        [
                            'New Arrivals',
                            '/products?sort=newest',
                        ],
                    ]
                ),

                $this->defaultMenu(
                    'help',
                    'Help',
                    [
                        [
                            'Track Order',
                            '/account/orders',
                        ],
                        ['FAQ', '/faq'],
                        ['Returns', '/returns'],
                        ['Contact', '/contact'],
                    ]
                ),

                $this->defaultMenu(
                    'company',
                    'Company',
                    [
                        ['Blog', '/blog'],
                        [
                            'Become a Vendor',
                            '/become-vendor',
                        ],
                    ]
                ),

                $this->defaultMenu(
                    'legal',
                    'Legal',
                    [
                        [
                            'Terms of Service',
                            '/terms-of-service',
                        ],
                        [
                            'Privacy Policy',
                            '/privacy-policy',
                        ],
                    ]
                ),
            ],

            'social_links' => [
                'key' =>
                    'social_links',

                'type' =>
                    'social',

                'title' =>
                    'Social Links',

                'links' => [
                    [
                        'id' => 'social-1',
                        'label' => 'Facebook',
                        'shortLabel' => 'f',
                        'url' =>
                            'https://facebook.com',
                    ],
                    [
                        'id' => 'social-2',
                        'label' => 'Twitter',
                        'shortLabel' => 'X',
                        'url' =>
                            'https://twitter.com',
                    ],
                    [
                        'id' => 'social-3',
                        'label' => 'Instagram',
                        'shortLabel' => 'IG',
                        'url' =>
                            'https://instagram.com',
                    ],
                    [
                        'id' => 'social-4',
                        'label' => 'YouTube',
                        'shortLabel' => 'YT',
                        'url' =>
                            'https://youtube.com',
                    ],
                    [
                        'id' => 'social-5',
                        'label' => 'LinkedIn',
                        'shortLabel' => 'in',
                        'url' =>
                            'https://linkedin.com',
                    ],
                    [
                        'id' => 'social-6',
                        'label' => 'TikTok',
                        'shortLabel' => 'TT',
                        'url' =>
                            'https://tiktok.com',
                    ],
                ],
            ],

            'copyright_text' =>
                '© 2026 Storify. All rights reserved.',

            'is_active' =>
                true,
        ];
    }

    private function defaultMenu(
        string $key,
        string $title,
        array $links
    ): array {
        return [
            'key' =>
                $key,

            'type' =>
                'menu',

            'title' =>
                $title,

            'links' =>
                array_map(
                    function (
                        array $link,
                        int $index
                    ) use ($key) {
                        return [
                            'id' =>
                                $key
                                . '-'
                                . ($index + 1),

                            'label' =>
                                $link[0],

                            'url' =>
                                $link[1],
                        ];
                    },
                    $links,
                    array_keys($links)
                ),
        ];
    }
}