<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\InventoryLocation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

use App\Models\InventoryLevel;
use App\Models\Product;

class VendorInventoryLocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendor($request);

        $search = trim(
            (string) $request->query('search', '')
        );

        $tab = $request->query(
            'tab',
            'all'
        );

        $perPage = min(
            max(
                (int) $request->query('per_page', 15),
                1
            ),
            100
        );

        $query = $this
            ->vendorLocationQuery($vendor->id)
            ->withCount([
                'inventoryLevels' => function ($query) use ($vendor) {
                    $query->whereHas(
                        'product',
                        function ($productQuery) use ($vendor) {
                            $productQuery
                                ->where('source', 'vendor')
                                ->where('created_by', $vendor->id);
                        }
                    );
                },
            ])
            ->withSum(
                [
                    'inventoryLevels as on_hand_units' =>
                        function ($query) use ($vendor) {
                            $query->whereHas(
                                'product',
                                function ($productQuery) use ($vendor) {
                                    $productQuery
                                        ->where('source', 'vendor')
                                        ->where('created_by', $vendor->id);
                                }
                            );
                        },
                ],
                'on_hand'
            );

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
                            'code',
                            'like',
                            '%' . $search . '%'
                        )
                        ->orWhere(
                            'address_line1',
                            'like',
                            '%' . $search . '%'
                        )
                        ->orWhere(
                            'city',
                            'like',
                            '%' . $search . '%'
                        )
                        ->orWhere(
                            'state',
                            'like',
                            '%' . $search . '%'
                        )
                        ->orWhere(
                            'country',
                            'like',
                            '%' . $search . '%'
                        );
                }
            );
        }

        if ($tab === 'active') {
            $query->where(
                'is_active',
                true
            );
        }

        if ($tab === 'inactive') {
            $query->where(
                'is_active',
                false
            );
        }

        $locations = $query
            ->orderByDesc('is_default')
            ->orderBy('shipping_priority')
            ->orderBy('name')
            ->paginate($perPage);

        $baseQuery = $this
            ->vendorLocationQuery($vendor->id);

        $stats = [
            'total' =>
                (clone $baseQuery)->count(),

            'active' =>
                (clone $baseQuery)
                    ->where('is_active', true)
                    ->count(),

            'inactive' =>
                (clone $baseQuery)
                    ->where('is_active', false)
                    ->count(),
        ];

        return response()->json([
            'success' => true,

            'stats' => $stats,

            'tab_counts' => [
                'all' => $stats['total'],
                'active' => $stats['active'],
                'inactive' => $stats['inactive'],
            ],

            'locations' => $locations,
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

            'code' => [
                'nullable',
                'string',
                'max:50',
                'unique:inventory_locations,code',
            ],

            'address' => [
                'nullable',
                'string',
                'max:255',
            ],

            'address_line1' => [
                'nullable',
                'string',
                'max:255',
            ],

            'address_line2' => [
                'nullable',
                'string',
                'max:255',
            ],

            'city' => [
                'nullable',
                'string',
                'max:100',
            ],

            'state' => [
                'nullable',
                'string',
                'max:100',
            ],

            'postal_code' => [
                'nullable',
                'string',
                'max:30',
            ],

            'country' => [
                'nullable',
                'string',
                'max:100',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:50',
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'pickup_enabled' => [
                'nullable',
                'boolean',
            ],

            'shipping_enabled' => [
                'nullable',
                'boolean',
            ],

            'is_default' => [
                'nullable',
                'boolean',
            ],
        ]);

    $location =
        DB::transaction(
            function () use (
                $validated,
                $vendor
            ) {
                $hasExistingLocation =
                    $this
                        ->vendorLocationQuery(
                            $vendor->id
                        )
                        ->exists();

                $isDefault =
                    !$hasExistingLocation ||
                    (bool) (
                        $validated['is_default']
                        ?? false
                    );

                if ($isDefault) {
                    $this
                        ->vendorLocationQuery(
                            $vendor->id
                        )
                        ->update([
                            'is_default' => false,
                        ]);
                }

                $code =
                    !empty(
                        $validated['code']
                    )
                        ? strtoupper(
                            trim(
                                $validated['code']
                            )
                        )
                        : $this
                            ->makeLocationCode(
                                $vendor->id,
                                $validated['name']
                            );

                $shippingPriority =
                    (int) (
                        $this
                            ->vendorLocationQuery(
                                $vendor->id
                            )
                            ->where(
                                'shipping_enabled',
                                true
                            )
                            ->max(
                                'shipping_priority'
                            )
                        ?? -1
                    ) + 1;

                $location =
                    InventoryLocation::create([
                        'vendor_id' =>
                            $vendor->id,

                        'name' =>
                            trim(
                                $validated['name']
                            ),

                        'code' =>
                            $code,

                        'phone' =>
                            $validated['phone']
                            ?? null,

                        'email' =>
                            $validated['email']
                            ?? null,

                        'address_line1' =>
                            $validated['address_line1']
                            ?? $validated['address']
                            ?? null,

                        'address_line2' =>
                            $validated['address_line2']
                            ?? null,

                        'city' =>
                            $validated['city']
                            ?? null,

                        'state' =>
                            $validated['state']
                            ?? null,

                        'postal_code' =>
                            $validated['postal_code']
                            ?? null,

                        'country' =>
                            $validated['country']
                            ?? null,

                        'pickup_enabled' =>
                            (bool) (
                                $validated['pickup_enabled']
                                ?? false
                            ),

                        'shipping_enabled' =>
                            (bool) (
                                $validated['shipping_enabled']
                                ?? true
                            ),

                        'shipping_priority' =>
                            $shippingPriority,

                        'is_default' =>
                            $isDefault,

                        'is_active' =>
                            true,
                    ]);

                if (
                    !$hasExistingLocation
                ) {
                    $this
                        ->moveExistingInventoryToFirstLocation(
                            vendorId:
                                (int) $vendor->id,

                            locationId:
                                (int) $location->id
                        );
                }

                return $location;
            }
        );

    return response()->json([
        'success' => true,

        'message' =>
            'Location created successfully.',

        'location' =>
            $location,
    ], 201);
}


    private function moveExistingInventoryToFirstLocation(
    int $vendorId,
    int $locationId
): void {
    $productIds =
        Product::query()
            ->where(
                'source',
                'vendor'
            )
            ->where(
                'created_by',
                $vendorId
            )
            ->pluck('id');

    if ($productIds->isEmpty()) {
        return;
    }

    $globalLocationIds =
        InventoryLocation::query()
            ->whereNull(
                'vendor_id'
            )
            ->pluck('id');

    if ($globalLocationIds->isEmpty()) {
        return;
    }

    $inventoryRows =
        InventoryLevel::query()
            ->whereIn(
                'product_id',
                $productIds
            )
            ->whereIn(
                'location_id',
                $globalLocationIds
            )
            ->select([
                'product_id',
                'variant_id',
            ])
            ->selectRaw(
                'SUM(on_hand) as on_hand'
            )
            ->selectRaw(
                'SUM(committed) as committed'
            )
            ->selectRaw(
                'SUM(unavailable) as unavailable'
            )
            ->selectRaw(
                'SUM(incoming) as incoming'
            )
            ->selectRaw(
                'MAX(low_stock_threshold) as low_stock_threshold'
            )
            ->selectRaw(
                'MAX(track_quantity) as track_quantity'
            )
            ->groupBy([
                'product_id',
                'variant_id',
            ])
            ->get();

    foreach ($inventoryRows as $row) {
        $targetQuery =
            InventoryLevel::query()
                ->where(
                    'location_id',
                    $locationId
                )
                ->where(
                    'product_id',
                    $row->product_id
                );

        if ($row->variant_id === null) {
            $targetQuery->whereNull(
                'variant_id'
            );
        } else {
            $targetQuery->where(
                'variant_id',
                $row->variant_id
            );
        }

        $target =
            $targetQuery->first();

        if ($target) {
            $target->update([
                'on_hand' =>
                    (int) $target->on_hand +
                    (int) $row->on_hand,

                'committed' =>
                    (int) $target->committed +
                    (int) $row->committed,

                'unavailable' =>
                    (int) $target->unavailable +
                    (int) $row->unavailable,

                'incoming' =>
                    (int) $target->incoming +
                    (int) $row->incoming,

                'low_stock_threshold' =>
                    max(
                        (int) $target->low_stock_threshold,
                        (int) $row->low_stock_threshold
                    ),

                'track_quantity' =>
                    (bool) $row->track_quantity,
            ]);

            continue;
        }

        InventoryLevel::create([
            'location_id' =>
                $locationId,

            'product_id' =>
                $row->product_id,

            'variant_id' =>
                $row->variant_id,

            'on_hand' =>
                (int) $row->on_hand,

            'committed' =>
                (int) $row->committed,

            'unavailable' =>
                (int) $row->unavailable,

            'incoming' =>
                (int) $row->incoming,

            'low_stock_threshold' =>
                (int) (
                    $row->low_stock_threshold
                    ?? 10
                ),

            'track_quantity' =>
                (bool) $row->track_quantity,
        ]);
    }

    InventoryLevel::query()
        ->whereIn(
            'product_id',
            $productIds
        )
        ->whereIn(
            'location_id',
            $globalLocationIds
        )
        ->delete();
}

    public function show(
        Request $request,
        $id
    ): JsonResponse {
        $vendor = $this->vendor($request);

        $location =
            $this
                ->vendorLocationQuery($vendor->id)
                ->withCount([
                    'inventoryLevels' =>
                        function ($query) use ($vendor) {
                            $query->whereHas(
                                'product',
                                function ($productQuery) use ($vendor) {
                                    $productQuery
                                        ->where('source', 'vendor')
                                        ->where('created_by', $vendor->id);
                                }
                            );
                        },
                ])
                ->withSum(
                    [
                        'inventoryLevels as on_hand_units' =>
                            function ($query) use ($vendor) {
                                $query->whereHas(
                                    'product',
                                    function ($productQuery) use ($vendor) {
                                        $productQuery
                                            ->where('source', 'vendor')
                                            ->where('created_by', $vendor->id);
                                    }
                                );
                            },
                    ],
                    'on_hand'
                )
                ->findOrFail($id);

        return response()->json([
            'success' => true,
            'location' => $location,
        ]);
    }

    public function update(
        Request $request,
        $id
    ): JsonResponse {
        $vendor = $this->vendor($request);

        $location =
            $this
                ->vendorLocationQuery($vendor->id)
                ->findOrFail($id);

        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'code' => [
                'nullable',
                'string',
                'max:50',

                Rule::unique(
                    'inventory_locations',
                    'code'
                )->ignore($location->id),
            ],

            'address' => [
                'nullable',
                'string',
                'max:255',
            ],

            'address_line1' => [
                'nullable',
                'string',
                'max:255',
            ],

            'address_line2' => [
                'nullable',
                'string',
                'max:255',
            ],

            'city' => [
                'nullable',
                'string',
                'max:100',
            ],

            'state' => [
                'nullable',
                'string',
                'max:100',
            ],

            'postal_code' => [
                'nullable',
                'string',
                'max:30',
            ],

            'country' => [
                'nullable',
                'string',
                'max:100',
            ],

            'phone' => [
                'nullable',
                'string',
                'max:50',
            ],

            'email' => [
                'nullable',
                'email',
                'max:255',
            ],

            'pickup_enabled' => [
                'nullable',
                'boolean',
            ],

            'shipping_enabled' => [
                'nullable',
                'boolean',
            ],

            'is_default' => [
                'nullable',
                'boolean',
            ],
        ]);

        if (
            $location->is_default &&
            array_key_exists(
                'is_default',
                $validated
            ) &&
            !$validated['is_default']
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'Choose another default location before removing this one as default.',
            ], 422);
        }

        DB::transaction(
            function () use (
                $validated,
                $vendor,
                $location
            ) {
                $isDefault =
                    array_key_exists(
                        'is_default',
                        $validated
                    )
                        ? (bool) $validated['is_default']
                        : (bool) $location->is_default;

                if ($isDefault) {
                    $this
                        ->vendorLocationQuery($vendor->id)
                        ->whereKeyNot($location->id)
                        ->update([
                            'is_default' => false,
                        ]);
                }

                $payload = [
                    'name' =>
                        trim($validated['name']),

                    'is_default' =>
                        $isDefault,
                ];

                if (
                    array_key_exists(
                        'code',
                        $validated
                    ) &&
                    !empty($validated['code'])
                ) {
                    $payload['code'] =
                        strtoupper(
                            trim($validated['code'])
                        );
                }

                $fields = [
                    'phone',
                    'email',
                    'address_line1',
                    'address_line2',
                    'city',
                    'state',
                    'postal_code',
                    'country',
                ];

                foreach ($fields as $field) {
                    if (
                        array_key_exists(
                            $field,
                            $validated
                        )
                    ) {
                        $payload[$field] =
                            $validated[$field];
                    }
                }

                if (
                    array_key_exists(
                        'address',
                        $validated
                    ) &&
                    !array_key_exists(
                        'address_line1',
                        $validated
                    )
                ) {
                    $payload['address_line1'] =
                        $validated['address'];
                }

                if (
                    array_key_exists(
                        'pickup_enabled',
                        $validated
                    )
                ) {
                    $payload['pickup_enabled'] =
                        (bool) $validated['pickup_enabled'];
                }

                if (
                    array_key_exists(
                        'shipping_enabled',
                        $validated
                    )
                ) {
                    $payload['shipping_enabled'] =
                        (bool) $validated['shipping_enabled'];
                }

                $location->update(
                    $payload
                );
            }
        );

        return response()->json([
            'success' => true,

            'message' =>
                'Location updated successfully.',

            'location' =>
                $location->fresh(),
        ]);
    }

    public function setDefault(
        Request $request,
        $id
    ): JsonResponse {
        $vendor = $this->vendor($request);

        $location =
            $this
                ->vendorLocationQuery($vendor->id)
                ->findOrFail($id);

        if (!$location->is_active) {
            return response()->json([
                'success' => false,

                'message' =>
                    'An inactive location cannot be set as default.',
            ], 422);
        }

        DB::transaction(
            function () use (
                $vendor,
                $location
            ) {
                $this
                    ->vendorLocationQuery($vendor->id)
                    ->update([
                        'is_default' => false,
                    ]);

                $location->update([
                    'is_default' => true,
                ]);
            }
        );

        return response()->json([
            'success' => true,

            'message' =>
                'Default location updated successfully.',

            'location' =>
                $location->fresh(),
        ]);
    }

    public function toggleStatus(
        Request $request,
        $id
    ): JsonResponse {
        $vendor = $this->vendor($request);

        $location =
            $this
                ->vendorLocationQuery($vendor->id)
                ->findOrFail($id);

        if (
            $location->is_default &&
            $location->is_active
        ) {
            return response()->json([
                'success' => false,

                'message' =>
                    'The default location cannot be deactivated.',
            ], 422);
        }

        $location->update([
            'is_active' =>
                !$location->is_active,
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                $location->is_active
                    ? 'Location activated successfully.'
                    : 'Location deactivated successfully.',

            'location' =>
                $location->fresh(),
        ]);
    }

    public function shipSooner(
        Request $request,
        $id
    ): JsonResponse {
        $vendor = $this->vendor($request);

        $location =
            $this
                ->vendorLocationQuery($vendor->id)
                ->findOrFail($id);

        if (!$location->is_active) {
            return response()->json([
                'success' => false,

                'message' =>
                    'An inactive location cannot be prioritized for shipping.',
            ], 422);
        }

        if (!$location->shipping_enabled) {
            return response()->json([
                'success' => false,

                'message' =>
                    'Enable shipping for this location before changing its shipping priority.',
            ], 422);
        }

        DB::transaction(
            function () use (
                $vendor,
                $location
            ) {
                $locations =
                    $this
                        ->vendorLocationQuery($vendor->id)
                        ->where(
                            'is_active',
                            true
                        )
                        ->where(
                            'shipping_enabled',
                            true
                        )
                        ->orderBy(
                            'shipping_priority'
                        )
                        ->orderBy('id')
                        ->lockForUpdate()
                        ->get();

                $orderedLocations =
                    $locations
                        ->reject(
                            fn ($item) =>
                                $item->id ===
                                $location->id
                        )
                        ->prepend($location)
                        ->values();

                foreach (
                    $orderedLocations
                    as $priority => $item
                ) {
                    if (
                        (int) $item->shipping_priority !==
                        $priority
                    ) {
                        $item->update([
                            'shipping_priority' =>
                                $priority,
                        ]);
                    }
                }
            }
        );

        return response()->json([
            'success' => true,

            'message' =>
                'This location will be prioritized for shipping.',

            'location' =>
                $location->fresh(),
        ]);
    }

    public function destroy(
        Request $request,
        $id
    ): JsonResponse {
        $vendor = $this->vendor($request);

        $location =
            $this
                ->vendorLocationQuery($vendor->id)
                ->findOrFail($id);

        if ($location->is_default) {
            return response()->json([
                'success' => false,

                'message' =>
                    'The default location cannot be deleted.',
            ], 422);
        }

        if (
            $location
                ->inventoryLevels()
                ->exists()
        ) {
            return response()->json([
                'success' => false,

                'message' =>
                    'This location has inventory and cannot be deleted. Deactivate it instead.',
            ], 422);
        }

        $location->delete();

        return response()->json([
            'success' => true,

            'message' =>
                'Location deleted successfully.',
        ]);
    }

    private function vendor(
        Request $request
    ) {
        $user = $request->user();

        if (
            !$user ||
            $user->role !== 'vendor'
        ) {
            abort(403);
        }

        return $user;
    }

    private function vendorLocationQuery(
        int $vendorId
    ): Builder {
        return InventoryLocation::query()
            ->where(
                'vendor_id',
                $vendorId
            );
    }

    private function makeLocationCode(
        int $vendorId,
        string $name
    ): string {
        $namePart =
            Str::upper(
                Str::slug(
                    $name,
                    '-'
                )
            );

        if ($namePart === '') {
            $namePart = 'LOCATION';
        }

        $prefix =
            'V' .
            $vendorId .
            '-';

        $base =
            substr(
                $prefix . $namePart,
                0,
                50
            );

        $code = $base;
        $counter = 2;

        while (
            InventoryLocation::query()
                ->where(
                    'code',
                    $code
                )
                ->exists()
        ) {
            $suffix =
                '-' . $counter;

            $code =
                substr(
                    $base,
                    0,
                    50 - strlen($suffix)
                ) .
                $suffix;

            $counter++;
        }

        return $code;
    }
}
