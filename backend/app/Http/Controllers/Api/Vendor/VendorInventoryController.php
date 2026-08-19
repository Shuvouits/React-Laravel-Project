<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\InventoryLevel;
use App\Models\InventoryLocation;
use App\Models\InventoryMovement;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VendorInventoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $search = trim(
            (string) $request->query('search', '')
        );

        $tab = strtolower(
            trim(
                (string) $request->query('tab', 'all')
            )
        );

        $locationId = $request->query('location_id');

        $perPage = min(
            max(
                (int) $request->query('per_page', 15),
                1
            ),
            100
        );

        $allowedTabs = [
            'all',
            'in_stock',
            'low_stock',
            'out_of_stock',
        ];

        if (!in_array($tab, $allowedTabs, true)) {
            $tab = 'all';
        }

        /*
        |--------------------------------------------------------------------------
        | VENDOR LOCATIONS
        |--------------------------------------------------------------------------
        */

        $hasVendorLocations = InventoryLocation::query()
            ->where('vendor_id', $user->id)
            ->exists();

        $vendorLocationIds = InventoryLocation::query()
            ->where('vendor_id', $user->id)
            ->where('is_active', true)
            ->pluck('id');

        /*
        |--------------------------------------------------------------------------
        | INVENTORY QUERY
        |--------------------------------------------------------------------------
        */

        $query = InventoryLevel::query()
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
            ->selectRaw(
                'COUNT(DISTINCT location_id) as locations_count'
            );

        /*
        |--------------------------------------------------------------------------
        | VENDOR PRODUCT OWNERSHIP
        |--------------------------------------------------------------------------
        */

        $query->whereHas(
            'product',
            function ($productQuery) use ($user) {
                $productQuery
                    ->where('source', 'vendor')
                    ->where('created_by', $user->id);
            }
        );

        /*
        |--------------------------------------------------------------------------
        | VENDOR LOCATION OWNERSHIP
        |--------------------------------------------------------------------------
        |
        | Before the vendor creates their first location, existing inventory
        | can continue using the previous global location temporarily.
        |
        | Once at least one vendor location exists, only active locations
        | belonging to this vendor are included.
        |
        */

        if ($hasVendorLocations) {
            $query->whereIn(
                'location_id',
                $vendorLocationIds
            );
        }

        /*
        |--------------------------------------------------------------------------
        | LOCATION FILTER
        |--------------------------------------------------------------------------
        */

        if ($locationId) {
            if (
                !$vendorLocationIds->contains(
                    (int) $locationId
                )
            ) {
                return response()->json([
                    'success' => false,
                    'message' =>
                        'The selected location does not belong to this vendor or is inactive.',
                ], 422);
            }

            $query->where(
                'location_id',
                (int) $locationId
            );
        }

        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
        */

        if ($search !== '') {
            $query->where(
                function ($query) use ($search) {
                    $query
                        ->whereHas(
                            'product',
                            function ($productQuery) use ($search) {
                                $productQuery
                                    ->where(
                                        'title',
                                        'like',
                                        '%' . $search . '%'
                                    )
                                    ->orWhere(
                                        'sku',
                                        'like',
                                        '%' . $search . '%'
                                    )
                                    ->orWhere(
                                        'barcode',
                                        'like',
                                        '%' . $search . '%'
                                    );
                            }
                        )
                        ->orWhereHas(
                            'variant',
                            function ($variantQuery) use ($search) {
                                $variantQuery
                                    ->where(
                                        'name',
                                        'like',
                                        '%' . $search . '%'
                                    )
                                    ->orWhere(
                                        'title',
                                        'like',
                                        '%' . $search . '%'
                                    )
                                    ->orWhere(
                                        'sku',
                                        'like',
                                        '%' . $search . '%'
                                    )
                                    ->orWhere(
                                        'barcode',
                                        'like',
                                        '%' . $search . '%'
                                    );
                            }
                        );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | GROUP
        |--------------------------------------------------------------------------
        */

        $query->groupBy([
            'product_id',
            'variant_id',
        ]);

        /*
        |--------------------------------------------------------------------------
        | TAB FILTER
        |--------------------------------------------------------------------------
        */

        if ($tab === 'in_stock') {
            $query->havingRaw(
                'SUM(on_hand) > SUM(committed) + SUM(unavailable)'
            );
        }

        if ($tab === 'low_stock') {
            $query
                ->havingRaw(
                    'SUM(on_hand) > SUM(committed) + SUM(unavailable)'
                )
                ->havingRaw(
                    '
                    SUM(on_hand)
                    <=
                    SUM(committed)
                    + SUM(unavailable)
                    + MAX(low_stock_threshold)
                    '
                );
        }

        if ($tab === 'out_of_stock') {
            $query->havingRaw(
                'SUM(on_hand) <= SUM(committed) + SUM(unavailable)'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PAGINATION
        |--------------------------------------------------------------------------
        */

        $inventory = $query
            ->orderBy('product_id')
            ->paginate($perPage);

        /*
        |--------------------------------------------------------------------------
        | PRODUCTS / VARIANTS
        |--------------------------------------------------------------------------
        */

        $productIds = collect(
            $inventory->items()
        )
            ->pluck('product_id')
            ->filter()
            ->unique()
            ->values();

        $variantIds = collect(
            $inventory->items()
        )
            ->pluck('variant_id')
            ->filter()
            ->unique()
            ->values();

        $products = Product::query()
            ->with('media')
            ->where('source', 'vendor')
            ->where('created_by', $user->id)
            ->whereIn('id', $productIds)
            ->get()
            ->keyBy('id');

        $variants = ProductVariant::query()
            ->with('media')
            ->whereIn('id', $variantIds)
            ->whereHas(
                'product',
                function ($productQuery) use ($user) {
                    $productQuery
                        ->where('source', 'vendor')
                        ->where('created_by', $user->id);
                }
            )
            ->get()
            ->keyBy('id');

        /*
        |--------------------------------------------------------------------------
        | FORMAT ROWS
        |--------------------------------------------------------------------------
        */

        $inventory
            ->getCollection()
            ->transform(
                function ($row) use (
                    $products,
                    $variants
                ) {
                    $product = $products->get(
                        $row->product_id
                    );

                    $variant = $row->variant_id
                        ? $variants->get(
                            $row->variant_id
                        )
                        : null;

                    $onHand = (int) $row->on_hand;
                    $committed = (int) $row->committed;
                    $unavailable = (int) $row->unavailable;

                    $available = max(
                        0,
                        $onHand
                        - $committed
                        - $unavailable
                    );

                    $threshold = (int) (
                        $row->low_stock_threshold
                        ?? 10
                    );

                    $trackQuantity = (bool) (
                        $row->track_quantity
                        ?? true
                    );

                    $status = $this->getInventoryStatus(
                        $available,
                        $threshold,
                        $trackQuantity
                    );

                    return [
                        'product_id' =>
                            $row->product_id,

                        'product_slug' =>
                            $product?->slug,

                        'variant_id' =>
                            $row->variant_id,

                        'product_name' =>
                            $product?->title
                            ?? 'Product',

                        'variant_name' =>
                            $variant?->name
                            ?? $variant?->title
                            ?? null,

                        'sku' =>
                            $variant?->sku
                            ?? $product?->sku
                            ?? null,

                        'barcode' =>
                            $variant?->barcode
                            ?? $product?->barcode
                            ?? null,

                        'image_url' =>
                            $this->getInventoryImageUrl(
                                $product,
                                $variant
                            ),

                        'on_hand' =>
                            $onHand,

                        'committed' =>
                            $committed,

                        'unavailable' =>
                            $unavailable,

                        'available' =>
                            $available,

                        'incoming' =>
                            (int) $row->incoming,

                        'low_stock_threshold' =>
                            $threshold,

                        'track_quantity' =>
                            $trackQuantity,

                        'locations_count' =>
                            (int) $row->locations_count,

                        'status' =>
                            $status,
                    ];
                }
            );

        /*
        |--------------------------------------------------------------------------
        | RESPONSE
        |--------------------------------------------------------------------------
        */

        return response()->json([
            'success' => true,

            'stats' =>
                $this->getInventoryStats(
                    $user->id
                ),

            'inventory' =>
                $inventory,

            'locations' =>
                $this->getLocations(
                    $user->id
                ),

            'filters' => [
                'tab' =>
                    $tab,

                'search' =>
                    $search,

                'location_id' =>
                    $locationId,
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | STATS
    |--------------------------------------------------------------------------
    */

    private function getInventoryStats(
        int $userId
    ): array {
        $hasVendorLocations = InventoryLocation::query()
            ->where('vendor_id', $userId)
            ->exists();

        $vendorLocationIds = InventoryLocation::query()
            ->where('vendor_id', $userId)
            ->where('is_active', true)
            ->pluck('id');

        $summaryQuery = InventoryLevel::query()
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
                'MAX(low_stock_threshold) as low_stock_threshold'
            )
            ->selectRaw(
                'MAX(track_quantity) as track_quantity'
            )
            ->selectRaw(
                '
                CASE
                    WHEN SUM(on_hand)
                        > SUM(committed) + SUM(unavailable)
                    THEN
                        SUM(on_hand)
                        - SUM(committed)
                        - SUM(unavailable)
                    ELSE 0
                END as available
                '
            )
            ->whereHas(
                'product',
                function ($productQuery) use ($userId) {
                    $productQuery
                        ->where('source', 'vendor')
                        ->where('created_by', $userId);
                }
            );

        if ($hasVendorLocations) {
            $summaryQuery->whereIn(
                'location_id',
                $vendorLocationIds
            );
        }

        $summaryQuery->groupBy([
            'product_id',
            'variant_id',
        ]);

        $summary = DB::query()
            ->fromSub(
                $summaryQuery,
                'inventory_summary'
            )
            ->selectRaw(
                '
                SUM(
                    CASE
                        WHEN track_quantity = 1
                        THEN 1
                        ELSE 0
                    END
                ) as tracked_skus
                '
            )
            ->selectRaw(
                '
                SUM(
                    CASE
                        WHEN track_quantity = 1
                            AND available > 0
                            AND available <= low_stock_threshold
                        THEN 1
                        ELSE 0
                    END
                ) as low_stock_skus
                '
            )
            ->selectRaw(
                '
                SUM(
                    CASE
                        WHEN track_quantity = 1
                            AND available <= 0
                        THEN 1
                        ELSE 0
                    END
                ) as out_of_stock_skus
                '
            )
            ->selectRaw(
                'SUM(on_hand) as on_hand_units'
            )
            ->first();

        return [
            'tracked_skus' =>
                (int) (
                    $summary->tracked_skus
                    ?? 0
                ),

            'low_stock_skus' =>
                (int) (
                    $summary->low_stock_skus
                    ?? 0
                ),

            'out_of_stock_skus' =>
                (int) (
                    $summary->out_of_stock_skus
                    ?? 0
                ),

            'on_hand_units' =>
                (int) (
                    $summary->on_hand_units
                    ?? 0
                ),

            'active_locations' =>
                InventoryLocation::query()
                    ->where(
                        'vendor_id',
                        $userId
                    )
                    ->where(
                        'is_active',
                        true
                    )
                    ->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | LOCATIONS
    |--------------------------------------------------------------------------
    */

    private function getLocations(
        int $userId
    ) {
        return InventoryLocation::query()
            ->where(
                'vendor_id',
                $userId
            )
            ->where(
                'is_active',
                true
            )
            ->orderByDesc(
                'is_default'
            )
            ->orderBy(
                'shipping_priority'
            )
            ->orderBy(
                'name'
            )
            ->get([
                'id',
                'name',
                'code',
                'is_default',
                'pickup_enabled',
                'shipping_enabled',
                'shipping_priority',
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */

    private function getInventoryStatus(
        int $available,
        int $threshold,
        bool $trackQuantity
    ): string {
        if (!$trackQuantity) {
            return 'not_tracked';
        }

        if ($available <= 0) {
            return 'out_of_stock';
        }

        if ($available <= $threshold) {
            return 'low_stock';
        }

        return 'in_stock';
    }

    /*
    |--------------------------------------------------------------------------
    | IMAGE
    |--------------------------------------------------------------------------
    */

    private function getInventoryImageUrl(
        $product,
        $variant
    ): ?string {
        if (
            $variant &&
            $variant->media
        ) {
            return asset(
                $variant->media->file_path
            );
        }

        if (
            !$product ||
            !$product->media ||
            $product->media->isEmpty()
        ) {
            return null;
        }

        $cover = $product
            ->media
            ->firstWhere(
                'is_cover',
                true
            );

        $media = $cover
            ?? $product->media->first();

        if (!$media) {
            return null;
        }

        return asset(
            $media->file_path
        );
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE ON HAND
    |--------------------------------------------------------------------------
    */

    public function updateOnHand(
        Request $request
    ): JsonResponse {
        $user = $request->user();

        $validated = $request->validate([
            'location_id' => [
                'required',
                'integer',
                'exists:inventory_locations,id',
            ],

            'product_id' => [
                'required',
                'integer',
                'exists:products,id',
            ],

            'variant_id' => [
                'nullable',
                'integer',
                'exists:product_variants,id',
            ],

            'on_hand' => [
                'required',
                'integer',
                'min:0',
            ],

            'note' => [
                'nullable',
                'string',
                'max:500',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | PRODUCT OWNERSHIP
        |--------------------------------------------------------------------------
        */

        $product = Product::query()
            ->where(
                'source',
                'vendor'
            )
            ->where(
                'created_by',
                $user->id
            )
            ->findOrFail(
                $validated['product_id']
            );

        /*
        |--------------------------------------------------------------------------
        | VARIANT OWNERSHIP
        |--------------------------------------------------------------------------
        */

        if (
            !empty(
                $validated['variant_id']
            )
        ) {
            $variantExists = ProductVariant::query()
                ->whereKey(
                    $validated['variant_id']
                )
                ->where(
                    'product_id',
                    $product->id
                )
                ->exists();

            if (!$variantExists) {
                return response()->json([
                    'success' => false,

                    'message' =>
                        'The selected variant does not belong to this product.',
                ], 422);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | LOCATION OWNERSHIP
        |--------------------------------------------------------------------------
        */

        $locationExists = InventoryLocation::query()
            ->whereKey(
                $validated['location_id']
            )
            ->where(
                'vendor_id',
                $user->id
            )
            ->where(
                'is_active',
                true
            )
            ->exists();

        if (!$locationExists) {
            return response()->json([
                'success' => false,

                'message' =>
                    'The selected inventory location does not belong to this vendor or is inactive.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE
        |--------------------------------------------------------------------------
        */

        $result = DB::transaction(
            function () use (
                $validated,
                $user
            ) {
                $inventoryLevel = InventoryLevel::query()
                    ->where(
                        'location_id',
                        $validated['location_id']
                    )
                    ->where(
                        'product_id',
                        $validated['product_id']
                    )
                    ->where(
                        'variant_id',
                        $validated['variant_id']
                        ?? null
                    )
                    ->lockForUpdate()
                    ->first();

                if (!$inventoryLevel) {
                    return null;
                }

                $before = (int) $inventoryLevel->on_hand;

                $after = (int) $validated['on_hand'];

                $change = $after - $before;

                if ($change !== 0) {
                    $inventoryLevel->update([
                        'on_hand' =>
                            $after,
                    ]);

                    InventoryMovement::create([
                        'location_id' =>
                            $inventoryLevel->location_id,

                        'product_id' =>
                            $inventoryLevel->product_id,

                        'variant_id' =>
                            $inventoryLevel->variant_id,

                        'type' =>
                            'adjustment',

                        'quantity_change' =>
                            $change,

                        'quantity_before' =>
                            $before,

                        'quantity_after' =>
                            $after,

                        'reference_type' =>
                            'manual_adjustment',

                        'reference_id' =>
                            $inventoryLevel->id,

                        'reason' =>
                            'Vendor inventory adjustment',

                        'note' =>
                            $validated['note']
                            ?? null,

                        'created_by' =>
                            $user->id,
                    ]);
                }

                $this->syncLegacyQuantity(
                    $inventoryLevel->product_id,
                    $inventoryLevel->variant_id
                );

                return $inventoryLevel->fresh();
            }
        );

        if (!$result) {
            return response()->json([
                'success' => false,

                'message' =>
                    'Inventory level was not found for this location.',
            ], 404);
        }

        return response()->json([
            'success' => true,

            'message' =>
                'On hand inventory updated successfully.',

            'inventory' => [
                'id' =>
                    $result->id,

                'location_id' =>
                    $result->location_id,

                'product_id' =>
                    $result->product_id,

                'variant_id' =>
                    $result->variant_id,

                'on_hand' =>
                    (int) $result->on_hand,

                'committed' =>
                    (int) $result->committed,

                'unavailable' =>
                    (int) $result->unavailable,

                'available' =>
                    max(
                        0,
                        (int) $result->on_hand
                        - (int) $result->committed
                        - (int) $result->unavailable
                    ),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SYNC LEGACY QUANTITY
    |--------------------------------------------------------------------------
    */

    private function syncLegacyQuantity(
        int $productId,
        ?int $variantId
    ): void {
        if ($variantId) {
            $variantQuantity = InventoryLevel::query()
                ->where(
                    'variant_id',
                    $variantId
                )
                ->sum(
                    'on_hand'
                );

            ProductVariant::query()
                ->whereKey(
                    $variantId
                )
                ->where(
                    'product_id',
                    $productId
                )
                ->update([
                    'quantity' =>
                        (int) $variantQuantity,
                ]);
        }

        $productHasVariants = ProductVariant::query()
            ->where(
                'product_id',
                $productId
            )
            ->exists();

        if ($productHasVariants) {
            $productQuantity = InventoryLevel::query()
                ->where(
                    'product_id',
                    $productId
                )
                ->whereNotNull(
                    'variant_id'
                )
                ->sum(
                    'on_hand'
                );
        } else {
            $productQuantity = InventoryLevel::query()
                ->where(
                    'product_id',
                    $productId
                )
                ->whereNull(
                    'variant_id'
                )
                ->sum(
                    'on_hand'
                );
        }

        Product::query()
            ->whereKey(
                $productId
            )
            ->update([
                'quantity' =>
                    (int) $productQuantity,
            ]);
    }
}
