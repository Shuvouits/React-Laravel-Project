<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class VendorBrandController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendor($request);

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

        $query = $this
            ->visibleBrandQuery(
                $vendor->id
            )
            ->withCount([
                'products as products_count' =>
                    function ($query) use ($vendor) {
                        $query
                            ->where(
                                'source',
                                'vendor'
                            )
                            ->where(
                                'created_by',
                                $vendor->id
                            );
                    },
            ]);

        if ($search !== '') {
            $query->where(
                function ($query) use ($search) {
                    $query
                        ->where(
                            'name',
                            'like',
                            '%' . $search . '%'
                        )
                        ->orWhere(
                            'slug',
                            'like',
                            '%' . $search . '%'
                        );
                }
            );
        }

        switch ($tab) {
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
                    )
                    ->where(
                        'approval_status',
                        'approved'
                    );

                break;

            case 'inactive':

                $query
                    ->where(
                        'vendor_id',
                        $vendor->id
                    )
                    ->where(
                        'status',
                        'inactive'
                    );

                break;

            case 'pending':

                $query
                    ->where(
                        'vendor_id',
                        $vendor->id
                    )
                    ->where(
                        'approval_status',
                        'pending'
                    );

                break;

            case 'rejected':

                $query
                    ->where(
                        'vendor_id',
                        $vendor->id
                    )
                    ->where(
                        'approval_status',
                        'rejected'
                    );

                break;
        }

        $brands = $query
            ->orderBy(
                'display_order'
            )
            ->orderByDesc(
                'id'
            )
            ->paginate(
                $perPage
            );

        $brands
            ->getCollection()
            ->transform(
                fn ($brand) =>
                    $this->brandData(
                        $brand,
                        $vendor->id
                    )
            );

        $statsBase =
            $this->visibleBrandQuery(
                $vendor->id
            );

        $stats = [
            'total' =>
                (clone $statsBase)
                    ->count(),

            'active' =>
                (clone $statsBase)
                    ->where(
                        'status',
                        'active'
                    )
                    ->where(
                        'approval_status',
                        'approved'
                    )
                    ->count(),

            'inactive' =>
                (clone $statsBase)
                    ->where(
                        'vendor_id',
                        $vendor->id
                    )
                    ->where(
                        'status',
                        'inactive'
                    )
                    ->count(),

            'featured' =>
                (clone $statsBase)
                    ->where(
                        'status',
                        'active'
                    )
                    ->where(
                        'approval_status',
                        'approved'
                    )
                    ->where(
                        'is_featured',
                        true
                    )
                    ->count(),

            'your_branded_products' =>
                Product::query()
                    ->where(
                        'source',
                        'vendor'
                    )
                    ->where(
                        'created_by',
                        $vendor->id
                    )
                    ->whereNotNull(
                        'brand_id'
                    )
                    ->count(),
        ];

        return response()->json([
            'status' => true,

            'stats' =>
                $stats,

            'brands' =>
                $brands,
        ]);
    }


    public function store(
        Request $request
    ): JsonResponse {
        $vendor =
            $this->vendor(
                $request
            );

        $validated =
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

        $slug =
            $this->uniqueSlug(
                $validated['slug']
                    ?? null,

                $validated['name']
            );

        $logoPath =
            $this->uploadLogo(
                $request
            );

        $brand =
            Brand::create([
                'name' =>
                    $validated['name'],

                'slug' =>
                    $slug,

                'description' =>
                    $validated[
                        'description'
                    ]
                    ?? null,

                'website' =>
                    $validated[
                        'website'
                    ]
                    ?? null,

                'logo' =>
                    $logoPath,

                'source' =>
                    'vendor',

                'vendor_id' =>
                    $vendor->id,

                'approval_status' =>
                    'pending',

                'status' =>
                    $validated[
                        'status'
                    ]
                    ?? 'active',

                'is_featured' =>
                    false,

                'display_order' =>
                    0,

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

        return response()->json([
            'status' => true,

            'message' =>
                'Brand submitted for approval successfully.',

            'brand' =>
                $this->brandData(
                    $brand,
                    $vendor->id
                ),
        ], 201);
    }


    public function show(
        Request $request,
        $id
    ): JsonResponse {
        $vendor =
            $this->vendor(
                $request
            );

        $brand =
            $this
                ->visibleBrandQuery(
                    $vendor->id
                )
                ->withCount([
                    'products as products_count' =>
                        function ($query) use ($vendor) {
                            $query
                                ->where(
                                    'source',
                                    'vendor'
                                )
                                ->where(
                                    'created_by',
                                    $vendor->id
                                );
                        },
                ])
                ->findOrFail(
                    $id
                );

        return response()->json([
            'status' => true,

            'brand' =>
                $this->brandData(
                    $brand,
                    $vendor->id
                ),
        ]);
    }


    public function update(
        Request $request,
        $id
    ): JsonResponse {
        $vendor =
            $this->vendor(
                $request
            );

        $brand =
            Brand::query()
                ->where(
                    'source',
                    'vendor'
                )
                ->where(
                    'vendor_id',
                    $vendor->id
                )
                ->findOrFail(
                    $id
                );

        $validated =
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
                    )->ignore(
                        $brand->id
                    ),
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
                    ]),
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

        if (
            $request->hasFile(
                'logo'
            )
        ) {
            $this->deleteLogo(
                $brand->logo
            );

            $brand->logo =
                $this->uploadLogo(
                    $request
                );
        }

        $brand->name =
            $validated['name'];

        $brand->slug =
            Str::slug(
                $validated['slug']
            );

        $brand->description =
            $validated[
                'description'
            ]
            ?? null;

        $brand->website =
            $validated[
                'website'
            ]
            ?? null;

        $brand->status =
            $validated['status'];

        /*
        |--------------------------------------------------------------------------
        | RE-APPROVAL
        |--------------------------------------------------------------------------
        |
        | Any vendor edit goes back through approval.
        |
        */

        $brand->approval_status =
            'pending';

        $brand->is_featured =
            false;

        $brand->seo_title =
            $validated[
                'seo_title'
            ]
            ?? null;

        $brand->seo_description =
            $validated[
                'seo_description'
            ]
            ?? null;

        $brand->save();

        $brand->loadCount([
            'products as products_count' =>
                function ($query) use ($vendor) {
                    $query
                        ->where(
                            'source',
                            'vendor'
                        )
                        ->where(
                            'created_by',
                            $vendor->id
                        );
                },
        ]);

        return response()->json([
            'status' => true,

            'message' =>
                'Brand updated and submitted for approval successfully.',

            'brand' =>
                $this->brandData(
                    $brand,
                    $vendor->id
                ),
        ]);
    }


    private function vendor(
        Request $request
    ) {
        $user =
            $request->user();

        if (
            ! $user ||
            $user->role !==
                'vendor'
        ) {
            abort(403);
        }

        return $user;
    }


    private function visibleBrandQuery(
        int $vendorId
    ): Builder {
        return Brand::query()
            ->where(
                function ($query) use ($vendorId) {
                    $query
                        ->where(
                            function ($query) {
                                $query
                                    ->where(
                                        'source',
                                        'official'
                                    )
                                    ->where(
                                        'status',
                                        'active'
                                    )
                                    ->where(
                                        'approval_status',
                                        'approved'
                                    );
                            }
                        )
                        ->orWhere(
                            function ($query) use ($vendorId) {
                                $query
                                    ->where(
                                        'source',
                                        'vendor'
                                    )
                                    ->where(
                                        'vendor_id',
                                        $vendorId
                                    )
                                    ->where(
                                        'status',
                                        '!=',
                                        'archived'
                                    );
                            }
                        );
                }
            );
    }


    private function uniqueSlug(
        ?string $requestedSlug,
        string $name
    ): string {
        $slug =
            Str::slug(
                $requestedSlug
                    ?: $name
            );

        $baseSlug =
            $slug;

        $counter =
            1;

        while (
            Brand::query()
                ->where(
                    'slug',
                    $slug
                )
                ->exists()
        ) {
            $slug =
                $baseSlug .
                '-' .
                $counter;

            $counter++;
        }

        return $slug;
    }


    private function uploadLogo(
        Request $request
    ): ?string {
        if (
            ! $request->hasFile(
                'logo'
            )
        ) {
            return null;
        }

        $uploadPath =
            public_path(
                'uploads/brands'
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

        $logo =
            $request->file(
                'logo'
            );

        $fileName =
            time() .
            '-' .
            uniqid() .
            '.' .
            $logo
                ->getClientOriginalExtension();

        $logo->move(
            $uploadPath,
            $fileName
        );

        return
            'uploads/brands/' .
            $fileName;
    }


    private function deleteLogo(
        ?string $path
    ): void {
        if (! $path) {
            return;
        }

        $filePath =
            public_path(
                $path
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


    private function brandData(
        Brand $brand,
        int $vendorId
    ): array {
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
                    ? asset(
                        $brand->logo
                    )
                    : null,

            'source' =>
                $brand->source,

            'vendor_id' =>
                $brand->vendor_id,

            'approval_status' =>
                $brand
                    ->approval_status,

            'status' =>
                $brand->status,

            'is_featured' =>
                (bool)
                $brand->is_featured,

            'display_order' =>
                (int)
                $brand->display_order,

            'seo_title' =>
                $brand->seo_title,

            'seo_description' =>
                $brand
                    ->seo_description,

            'products_count' =>
                (int) (
                    $brand
                        ->products_count
                    ?? 0
                ),

            'can_edit' =>
                $brand->source ===
                    'vendor' &&
                (int)
                $brand->vendor_id ===
                    $vendorId,

            'is_catalog' =>
                $brand->source ===
                'official',

            'created_at' =>
                $brand->created_at,
        ];
    }
}
