<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\GlobalVariant;
use App\Models\GlobalVariantValue;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class GlobalVariantController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GET ALL GLOBAL VARIANTS
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/global-variants
    |
    */

    public function index()
    {
        $variants = GlobalVariant::with([
            'values',
        ])
        ->ordered()
        ->get()
        ->map(
            fn ($variant) =>
                $this->variantData(
                    $variant
                )
        );


        return response()->json([
            'status' => true,

            'variants' => $variants,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | CREATE GLOBAL VARIANT
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/global-variants
    |
    */

    public function store(Request $request)
    {
        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([

            'name' => [
                'required',
                'string',
                'max:100',
                'unique:global_variants,name',
            ],

            'visual_type' => [
                'nullable',
                Rule::in([
                    'rectangle',
                    'circle',
                    'pill',
                    'color',
                ]),
            ],

            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'values' => [
                'required',
                'array',
                'min:1',
            ],

            'values.*.value' => [
                'required',
                'string',
                'max:100',
            ],

            'values.*.color_code' => [
                'nullable',
                'string',
                'max:20',
            ],

            'values.*.sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

        ]);


        /*
        |--------------------------------------------------------------------------
        | PREVENT DUPLICATE VALUES
        |--------------------------------------------------------------------------
        */

        $duplicate =
            $this->findDuplicateValue(
                $validated['values']
            );


        if ($duplicate) {

            return response()->json([

                'status' => false,

                'message' =>
                    "Duplicate option value: {$duplicate}",

                'errors' => [

                    'values' => [
                        "Option value '{$duplicate}' is duplicated.",
                    ],

                ],

            ], 422);
        }


        try {

            $variant = DB::transaction(
                function () use (
                    $validated
                ) {

                    /*
                    |--------------------------------------------------------------------------
                    | CREATE VARIANT
                    |--------------------------------------------------------------------------
                    */

                    $variant =
                        GlobalVariant::create([

                            'name' =>
                                trim(
                                    $validated['name']
                                ),

                            'visual_type' =>
                                $validated['visual_type']
                                ?? 'rectangle',

                            'sort_order' =>
                                $validated['sort_order']
                                ?? (
                                    GlobalVariant::max(
                                        'sort_order'
                                    ) + 1
                                ),

                        ]);


                    /*
                    |--------------------------------------------------------------------------
                    | CREATE VALUES
                    |--------------------------------------------------------------------------
                    */

                    foreach (
                        $validated['values']
                        as $index => $item
                    ) {

                        $value =
                            trim(
                                $item['value']
                            );


                        $variant
                            ->values()
                            ->create([

                                'value' =>
                                    $value,

                                'color_code' =>
                                    $this->resolveColorCode(

                                        variantName:
                                            $variant->name,

                                        value:
                                            $value,

                                        colorCode:
                                            $item['color_code']
                                            ?? null

                                    ),

                                'sort_order' =>
                                    $item['sort_order']
                                    ?? $index,

                            ]);

                    }


                    return $variant;

                }
            );


            /*
            |--------------------------------------------------------------------------
            | LOAD VALUES
            |--------------------------------------------------------------------------
            */

            $variant->load(
                'values'
            );


            return response()->json([

                'status' => true,

                'message' =>
                    'Global variant created successfully.',

                'variant' =>
                    $this->variantData(
                        $variant
                    ),

            ], 201);

        } catch (\Throwable $error) {

            report($error);


            return response()->json([

                'status' => false,

                'message' =>
                    'Unable to create global variant.',

            ], 500);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | SHOW GLOBAL VARIANT
    |--------------------------------------------------------------------------
    |
    | GET /api/admin/global-variants/{id}
    |
    */

    public function show($id)
    {
        $variant =
            GlobalVariant::with([
                'values',
            ])
            ->findOrFail(
                $id
            );


        return response()->json([

            'status' => true,

            'variant' =>
                $this->variantData(
                    $variant
                ),

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE GLOBAL VARIANT
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/global-variants/{id}/update
    |
    | Existing value IDs preserve করা হচ্ছে।
    |
    */

    public function update(
        Request $request,
        $id
    ) {
        $variant =
            GlobalVariant::with(
                'values'
            )
            ->findOrFail(
                $id
            );


        /*
        |--------------------------------------------------------------------------
        | VALIDATION
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([

            'name' => [
                'required',
                'string',
                'max:100',

                Rule::unique(
                    'global_variants',
                    'name'
                )
                ->ignore(
                    $variant->id
                ),
            ],

            'visual_type' => [
                'nullable',

                Rule::in([
                    'rectangle',
                    'circle',
                    'pill',
                    'color',
                ]),
            ],

            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'values' => [
                'required',
                'array',
                'min:1',
            ],

            /*
            |--------------------------------------------------------------------------
            | EXISTING VALUE ID
            |--------------------------------------------------------------------------
            */

            'values.*.id' => [
                'nullable',
                'integer',
            ],

            'values.*.value' => [
                'required',
                'string',
                'max:100',
            ],

            'values.*.color_code' => [
                'nullable',
                'string',
                'max:20',
            ],

            'values.*.sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

        ]);


        /*
        |--------------------------------------------------------------------------
        | PREVENT DUPLICATE OPTION VALUES
        |--------------------------------------------------------------------------
        */

        $duplicate =
            $this->findDuplicateValue(
                $validated['values']
            );


        if ($duplicate) {

            return response()->json([

                'status' => false,

                'message' =>
                    "Duplicate option value: {$duplicate}",

                'errors' => [

                    'values' => [
                        "Option value '{$duplicate}' is duplicated.",
                    ],

                ],

            ], 422);
        }


        /*
        |--------------------------------------------------------------------------
        | VERIFY EXISTING IDS BELONG TO THIS VARIANT
        |--------------------------------------------------------------------------
        */

        foreach (
            $validated['values']
            as $item
        ) {

            if (
                empty(
                    $item['id']
                )
            ) {

                continue;
            }


            $belongs =
                $variant
                    ->values()
                    ->where(
                        'id',
                        $item['id']
                    )
                    ->exists();


            if (! $belongs) {

                return response()->json([

                    'status' => false,

                    'message' =>
                        'Invalid global variant value.',

                    'errors' => [

                        'values' => [
                            'One or more option values do not belong to this variant.',
                        ],

                    ],

                ], 422);
            }
        }


        try {

            DB::transaction(
                function () use (
                    $variant,
                    $validated
                ) {

                    /*
                    |--------------------------------------------------------------------------
                    | UPDATE VARIANT
                    |--------------------------------------------------------------------------
                    */

                    $variant->name =
                        trim(
                            $validated['name']
                        );


                    $variant->visual_type =
                        $validated['visual_type']
                        ?? 'rectangle';


                    if (
                        array_key_exists(
                            'sort_order',
                            $validated
                        )
                    ) {

                        $variant->sort_order =
                            $validated['sort_order'];

                    }


                    $variant->save();


                    /*
                    |--------------------------------------------------------------------------
                    | TRACK EXISTING IDS
                    |--------------------------------------------------------------------------
                    */

                    $keptValueIds = [];


                    /*
                    |--------------------------------------------------------------------------
                    | UPDATE / CREATE VALUES
                    |--------------------------------------------------------------------------
                    */

                    foreach (
                        $validated['values']
                        as $index => $item
                    ) {

                        $value =
                            trim(
                                $item['value']
                            );


                        /*
                        |--------------------------------------------------------------------------
                        | EXISTING VALUE
                        |--------------------------------------------------------------------------
                        */

                        if (
                            ! empty(
                                $item['id']
                            )
                        ) {

                            $variantValue =
                                $variant
                                    ->values()
                                    ->where(
                                        'id',
                                        $item['id']
                                    )
                                    ->firstOrFail();


                            $variantValue->value =
                                $value;


                            $variantValue->color_code =
                                $this->resolveColorCode(

                                    variantName:
                                        $variant->name,

                                    value:
                                        $value,

                                    colorCode:
                                        $item['color_code']
                                        ?? null

                                );


                            $variantValue->sort_order =
                                $item['sort_order']
                                ?? $index;


                            $variantValue->save();


                            $keptValueIds[] =
                                $variantValue->id;


                            continue;
                        }


                        /*
                        |--------------------------------------------------------------------------
                        | NEW VALUE
                        |--------------------------------------------------------------------------
                        */

                        $newValue =
                            $variant
                                ->values()
                                ->create([

                                    'value' =>
                                        $value,

                                    'color_code' =>
                                        $this->resolveColorCode(

                                            variantName:
                                                $variant->name,

                                            value:
                                                $value,

                                            colorCode:
                                                $item['color_code']
                                                ?? null

                                        ),

                                    'sort_order' =>
                                        $item['sort_order']
                                        ?? $index,

                                ]);


                        $keptValueIds[] =
                            $newValue->id;

                    }


                    /*
                    |--------------------------------------------------------------------------
                    | DELETE REMOVED VALUES
                    |--------------------------------------------------------------------------
                    |
                    | Example:
                    |
                    | Before:
                    | Small
                    | Medium
                    | Large
                    |
                    | User removes Medium
                    |
                    | Medium record will be deleted.
                    |
                    */

                    $variant
                        ->values()
                        ->whereNotIn(
                            'id',
                            $keptValueIds
                        )
                        ->delete();

                }
            );


            /*
            |--------------------------------------------------------------------------
            | REFRESH
            |--------------------------------------------------------------------------
            */

            $variant->refresh();


            $variant->load(
                'values'
            );


            return response()->json([

                'status' => true,

                'message' =>
                    'Global variant updated successfully.',

                'variant' =>
                    $this->variantData(
                        $variant
                    ),

            ]);

        } catch (\Throwable $error) {

            report($error);


            return response()->json([

                'status' => false,

                'message' =>
                    'Unable to update global variant.',

            ], 500);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE GLOBAL VARIANT
    |--------------------------------------------------------------------------
    |
    | DELETE /api/admin/global-variants/{id}
    |
    | global_variant_values automatically cascade delete হবে।
    |
    */

    public function destroy($id)
    {
        $variant =
            GlobalVariant::findOrFail(
                $id
            );


        try {

            $variant->delete();


            return response()->json([

                'status' => true,

                'message' =>
                    'Global variant deleted successfully.',

            ]);

        } catch (\Throwable $error) {

            report($error);


            return response()->json([

                'status' => false,

                'message' =>
                    'Unable to delete global variant.',

            ], 500);
        }
    }


    /*
    |--------------------------------------------------------------------------
    | REORDER GLOBAL VARIANTS
    |--------------------------------------------------------------------------
    |
    | POST /api/admin/global-variants/reorder
    |
    | Future drag/drop support.
    |
    | Payload:
    |
    | {
    |   "variants": [
    |       {"id": 3, "sort_order": 0},
    |       {"id": 1, "sort_order": 1}
    |   ]
    | }
    |
    */

    public function reorder(
        Request $request
    ) {
        $validated =
            $request->validate([

                'variants' => [
                    'required',
                    'array',
                ],

                'variants.*.id' => [
                    'required',
                    'integer',
                    'exists:global_variants,id',
                ],

                'variants.*.sort_order' => [
                    'required',
                    'integer',
                    'min:0',
                ],

            ]);


        DB::transaction(
            function () use (
                $validated
            ) {

                foreach (
                    $validated['variants']
                    as $item
                ) {

                    GlobalVariant::where(
                        'id',
                        $item['id']
                    )
                    ->update([

                        'sort_order' =>
                            $item['sort_order'],

                    ]);

                }

            }
        );


        return response()->json([

            'status' => true,

            'message' =>
                'Global variants reordered successfully.',

        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | API RESPONSE FORMAT
    |--------------------------------------------------------------------------
    */

    private function variantData(
        GlobalVariant $variant
    ): array {

        /*
        |--------------------------------------------------------------------------
        | COLOR VARIANT
        |--------------------------------------------------------------------------
        */

        $isColor =
            $this->isColorVariant(
                $variant->name
            );


        return [

            'id' =>
                $variant->id,

            'name' =>
                $variant->name,

            'visual_type' =>
                $variant->visual_type,

            'sort_order' =>
                (int)
                $variant->sort_order,

            /*
            |--------------------------------------------------------------------------
            | FRONTEND HELPER
            |--------------------------------------------------------------------------
            */

            'is_color' =>
                $isColor,


            /*
            |--------------------------------------------------------------------------
            | VALUES
            |--------------------------------------------------------------------------
            */

            'values' =>
                $variant
                    ->values
                    ->map(
                        function (
                            $value
                        ) use (
                            $isColor
                        ) {

                            return [

                                'id' =>
                                    $value->id,

                                'value' =>
                                    $value->value,

                                'color_code' =>
                                    $isColor
                                        ? (
                                            $value
                                                ->color_code
                                            ??
                                            $this
                                                ->inferColorCode(
                                                    $value->value
                                                )
                                        )
                                        : null,

                                'sort_order' =>
                                    (int)
                                    $value
                                        ->sort_order,

                            ];

                        }
                    )
                    ->values(),


            /*
            |--------------------------------------------------------------------------
            | COUNT
            |--------------------------------------------------------------------------
            */

            'values_count' =>
                $variant
                    ->values
                    ->count(),


            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            'created_at' =>
                $variant->created_at,

            'updated_at' =>
                $variant->updated_at,

        ];
    }


    /*
    |--------------------------------------------------------------------------
    | COLOR VARIANT CHECK
    |--------------------------------------------------------------------------
    */

    private function isColorVariant(
        string $name
    ): bool {

        $normalized =
            strtolower(
                trim(
                    $name
                )
            );


        return in_array(
            $normalized,
            [
                'color',
                'colour',
            ],
            true
        );
    }


    /*
    |--------------------------------------------------------------------------
    | COLOR CODE RESOLVER
    |--------------------------------------------------------------------------
    */

    private function resolveColorCode(
        string $variantName,
        string $value,
        ?string $colorCode
    ): ?string {

        /*
        |--------------------------------------------------------------------------
        | NOT COLOR VARIANT
        |--------------------------------------------------------------------------
        */

        if (
            ! $this->isColorVariant(
                $variantName
            )
        ) {

            return null;

        }


        /*
        |--------------------------------------------------------------------------
        | MANUAL COLOR
        |--------------------------------------------------------------------------
        */

        if (
            ! empty(
                $colorCode
            )
        ) {

            return trim(
                $colorCode
            );

        }


        /*
        |--------------------------------------------------------------------------
        | AUTO COLOR
        |--------------------------------------------------------------------------
        */

        return $this
            ->inferColorCode(
                $value
            );
    }


    /*
    |--------------------------------------------------------------------------
    | COMMON COLOR MAPPING
    |--------------------------------------------------------------------------
    |
    | Screenshot-এর মতো:
    |
    | Red    → red dot
    | Blue   → blue dot
    | Green  → green dot
    | Yellow → yellow dot
    | Black  → black dot
    |
    */

    private function inferColorCode(
        string $value
    ): ?string {

        $color =
            strtolower(
                trim(
                    $value
                )
            );


        $colors = [

            'red' =>
                '#EF4444',

            'blue' =>
                '#3B82F6',

            'green' =>
                '#22C55E',

            'yellow' =>
                '#EAB308',

            'black' =>
                '#111111',

            'white' =>
                '#FFFFFF',

            'gray' =>
                '#6B7280',

            'grey' =>
                '#6B7280',

            'orange' =>
                '#F97316',

            'purple' =>
                '#8B5CF6',

            'pink' =>
                '#EC4899',

            'brown' =>
                '#92400E',

            'beige' =>
                '#D6C6A5',

            'navy' =>
                '#1E3A8A',

            'cyan' =>
                '#06B6D4',

            'teal' =>
                '#14B8A6',

            'lime' =>
                '#84CC16',

            'gold' =>
                '#D4AF37',

            'silver' =>
                '#C0C0C0',

        ];


        return $colors[
            $color
        ] ?? null;
    }


    /*
    |--------------------------------------------------------------------------
    | DUPLICATE VALUE CHECK
    |--------------------------------------------------------------------------
    |
    | Prevent:
    |
    | Small
    | small
    | SMALL
    |
    | from being stored in the same variant.
    |
    */

    private function findDuplicateValue(
        array $values
    ): ?string {

        $seen = [];


        foreach (
            $values
            as $item
        ) {

            $value =
                trim(
                    (string)
                    (
                        $item['value']
                        ?? ''
                    )
                );


            if (
                $value === ''
            ) {

                continue;

            }


            $key =
                strtolower(
                    $value
                );


            if (
                isset(
                    $seen[$key]
                )
            ) {

                return $value;

            }


            $seen[$key] =
                true;

        }


        return null;
    }
}
