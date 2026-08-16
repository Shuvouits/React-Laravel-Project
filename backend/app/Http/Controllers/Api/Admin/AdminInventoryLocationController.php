<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\InventoryLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AdminInventoryLocationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim(
            (string) $request->query(
                'search',
                ''
            )
        );

        $perPage = min(
            max(
                (int) $request->query(
                    'per_page',
                    15
                ),
                1
            ),
            100
        );

        $query = InventoryLocation::query()
            ->withCount([
                'inventoryLevels',
            ])
            ->withSum(
                'inventoryLevels as on_hand_units',
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

        $locations = $query
            ->orderByDesc('is_default')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json([
            'success' => true,

            'stats' => [
                'total' =>
                    InventoryLocation::query()
                        ->count(),

                'active' =>
                    InventoryLocation::query()
                        ->where(
                            'is_active',
                            true
                        )
                        ->count(),

                'inactive' =>
                    InventoryLocation::query()
                        ->where(
                            'is_active',
                            false
                        )
                        ->count(),
            ],

            'locations' =>
                $locations,
        ]);
    }

    public function store(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'code' => [
                'required',
                'string',
                'max:50',
                'unique:inventory_locations,code',
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

            'is_default' => [
                'nullable',
                'boolean',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],
        ]);

        $location = DB::transaction(
            function () use ($validated) {
                $isDefault = (bool) (
                    $validated['is_default']
                    ?? false
                );

                if ($isDefault) {
                    InventoryLocation::query()
                        ->update([
                            'is_default' => false,
                        ]);
                }

                return InventoryLocation::create([
                    'name' =>
                        $validated['name'],

                    'code' =>
                        strtoupper(
                            trim(
                                $validated['code']
                            )
                        ),

                    'phone' =>
                        $validated['phone']
                        ?? null,

                    'email' =>
                        $validated['email']
                        ?? null,

                    'address_line1' =>
                        $validated['address_line1']
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

                    'is_default' =>
                        $isDefault,

                    'is_active' => (bool) (
                        $validated['is_active']
                        ?? true
                    ),
                ]);
            }
        );

        return response()->json([
            'success' => true,
            'message' =>
                'Inventory location created successfully.',
            'location' =>
                $location,
        ], 201);
    }

    public function show(
        InventoryLocation $inventoryLocation
    ): JsonResponse {
        $inventoryLocation->loadCount([
            'inventoryLevels',
        ]);

        $inventoryLocation->loadSum(
            'inventoryLevels as on_hand_units',
            'on_hand'
        );

        return response()->json([
            'success' => true,
            'location' =>
                $inventoryLocation,
        ]);
    }

    public function update(
        Request $request,
        InventoryLocation $inventoryLocation
    ): JsonResponse {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'code' => [
                'required',
                'string',
                'max:50',

                Rule::unique(
                    'inventory_locations',
                    'code'
                )->ignore(
                    $inventoryLocation->id
                ),
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

            'is_default' => [
                'nullable',
                'boolean',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],
        ]);

        DB::transaction(
            function () use (
                $validated,
                $inventoryLocation
            ) {
                $isDefault = (bool) (
                    $validated['is_default']
                    ?? false
                );

                if ($isDefault) {
                    InventoryLocation::query()
                        ->whereKeyNot(
                            $inventoryLocation->id
                        )
                        ->update([
                            'is_default' => false,
                        ]);
                }

                $inventoryLocation->update([
                    'name' =>
                        $validated['name'],

                    'code' =>
                        strtoupper(
                            trim(
                                $validated['code']
                            )
                        ),

                    'phone' =>
                        $validated['phone']
                        ?? null,

                    'email' =>
                        $validated['email']
                        ?? null,

                    'address_line1' =>
                        $validated['address_line1']
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

                    'is_default' =>
                        $isDefault,

                    'is_active' => (bool) (
                        $validated['is_active']
                        ?? true
                    ),
                ]);
            }
        );

        return response()->json([
            'success' => true,
            'message' =>
                'Inventory location updated successfully.',
            'location' =>
                $inventoryLocation->fresh(),
        ]);
    }

    public function setDefault(
        InventoryLocation $inventoryLocation
    ): JsonResponse {
        if (!$inventoryLocation->is_active) {
            return response()->json([
                'success' => false,
                'message' =>
                    'An inactive location cannot be set as default.',
            ], 422);
        }

        DB::transaction(
            function () use (
                $inventoryLocation
            ) {
                InventoryLocation::query()
                    ->update([
                        'is_default' => false,
                    ]);

                $inventoryLocation->update([
                    'is_default' => true,
                ]);
            }
        );

        return response()->json([
            'success' => true,
            'message' =>
                'Default inventory location updated successfully.',
            'location' =>
                $inventoryLocation->fresh(),
        ]);
    }

    public function toggleStatus(
        InventoryLocation $inventoryLocation
    ): JsonResponse {
        if (
            $inventoryLocation->is_default &&
            $inventoryLocation->is_active
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'The default inventory location cannot be deactivated.',
            ], 422);
        }

        $inventoryLocation->update([
            'is_active' =>
                !$inventoryLocation->is_active,
        ]);

        return response()->json([
            'success' => true,

            'message' =>
                $inventoryLocation->is_active
                    ? 'Inventory location activated successfully.'
                    : 'Inventory location deactivated successfully.',

            'location' =>
                $inventoryLocation->fresh(),
        ]);
    }

    public function destroy(
        InventoryLocation $inventoryLocation
    ): JsonResponse {
        if ($inventoryLocation->is_default) {
            return response()->json([
                'success' => false,
                'message' =>
                    'The default inventory location cannot be deleted.',
            ], 422);
        }

        if (
            $inventoryLocation
                ->inventoryLevels()
                ->exists()
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'This location has inventory and cannot be deleted. Deactivate it instead.',
            ], 422);
        }

        $inventoryLocation->delete();

        return response()->json([
            'success' => true,
            'message' =>
                'Inventory location deleted successfully.',
        ]);
    }
}