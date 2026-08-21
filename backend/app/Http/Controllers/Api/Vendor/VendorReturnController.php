<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\OrderReturn;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorReturnController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $vendor = $this->vendor($request);

        $tab = strtolower(
            trim(
                (string) $request->query(
                    'tab',
                    'all'
                )
            )
        );

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

        $allowedTabs = [
            'all',
            'requested',
            'approved',
            'in_transit',
            'received',
            'refunded',
            'rejected',
            'cancelled',
        ];

        if (! in_array($tab, $allowedTabs, true)) {
            $tab = 'all';
        }

        $vendorProductIds = $this->vendorProductIds(
            $vendor->id
        );

        $query = $this->vendorReturnQuery(
            $vendorProductIds
        );

        if ($tab !== 'all') {
            $query->where(
                'status',
                $tab
            );
        }

        if ($search !== '') {
            $query->where(
                function ($query) use (
                    $search,
                    $vendorProductIds
                ) {
                    $query
                        ->where(
                            'return_no',
                            'like',
                            '%' . $search . '%'
                        )
                        ->orWhereHas(
                            'order',
                            function ($orderQuery) use ($search) {
                                $orderQuery
                                    ->where(
                                        'order_no',
                                        'like',
                                        '%' . $search . '%'
                                    )
                                    ->orWhereHas(
                                        'user',
                                        function ($userQuery) use ($search) {
                                            $userQuery
                                                ->where(
                                                    'name',
                                                    'like',
                                                    '%' . $search . '%'
                                                )
                                                ->orWhere(
                                                    'first_name',
                                                    'like',
                                                    '%' . $search . '%'
                                                )
                                                ->orWhere(
                                                    'last_name',
                                                    'like',
                                                    '%' . $search . '%'
                                                )
                                                ->orWhere(
                                                    'email',
                                                    'like',
                                                    '%' . $search . '%'
                                                );
                                        }
                                    );
                            }
                        )
                        ->orWhereHas(
                            'items',
                            function ($itemQuery) use (
                                $search,
                                $vendorProductIds
                            ) {
                                $itemQuery
                                    ->whereIn(
                                        'product_id',
                                        $vendorProductIds
                                    )
                                    ->where(
                                        function ($query) use ($search) {
                                            $query
                                                ->where(
                                                    'product_name',
                                                    'like',
                                                    '%' . $search . '%'
                                                )
                                                ->orWhere(
                                                    'variant_name',
                                                    'like',
                                                    '%' . $search . '%'
                                                )
                                                ->orWhere(
                                                    'sku',
                                                    'like',
                                                    '%' . $search . '%'
                                                );
                                        }
                                    );
                            }
                        );
                }
            );
        }

        $returns = $query
            ->latest('id')
            ->paginate($perPage);

        $items = collect(
            $returns->items()
        )
            ->map(
                function ($orderReturn) use (
                    $vendorProductIds
                ) {
                    return $this->formatReturn(
                        $orderReturn,
                        $vendorProductIds
                    );
                }
            )
            ->values();

        return response()->json([
            'success' => true,

            'stats' => $this->getStats(
                $vendorProductIds
            ),

            'returns' => [
                'data' => $items,

                'current_page' =>
                    $returns->currentPage(),

                'last_page' =>
                    $returns->lastPage(),

                'per_page' =>
                    $returns->perPage(),

                'total' =>
                    $returns->total(),

                'from' =>
                    $returns->firstItem(),

                'to' =>
                    $returns->lastItem(),
            ],

            'filters' => [
                'tab' => $tab,
                'search' => $search,
            ],
        ]);
    }


    public function show(
        Request $request,
        $id
    ): JsonResponse {
        $vendor = $this->vendor($request);

        $vendorProductIds = $this->vendorProductIds(
            $vendor->id
        );

        $orderReturn = $this->vendorReturnQuery(
            $vendorProductIds
        )
            ->whereKey($id)
            ->firstOrFail();

        return response()->json([
            'success' => true,

            'return' => $this->formatReturn(
                $orderReturn,
                $vendorProductIds
            ),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | VENDOR RETURN QUERY
    |--------------------------------------------------------------------------
    */

    private function vendorReturnQuery(
        $vendorProductIds
    ) {
        return OrderReturn::query()
            ->whereHas(
                'items',
                function ($itemQuery) use (
                    $vendorProductIds
                ) {
                    $itemQuery->whereIn(
                        'product_id',
                        $vendorProductIds
                    );
                }
            )
            ->with([
                'order.user',

                'order.items' =>
                    function ($itemQuery) use (
                        $vendorProductIds
                    ) {
                        $itemQuery->whereIn(
                            'product_id',
                            $vendorProductIds
                        );
                    },

                'items',
            ]);
    }


    /*
    |--------------------------------------------------------------------------
    | VENDOR PRODUCTS
    |--------------------------------------------------------------------------
    */

    private function vendorProductIds(
        int $vendorId
    ) {
        return Product::query()
            ->where(
                'source',
                'vendor'
            )
            ->where(
                'created_by',
                $vendorId
            )
            ->pluck('id');
    }


    /*
    |--------------------------------------------------------------------------
    | STATS
    |--------------------------------------------------------------------------
    */

    private function getStats(
        $vendorProductIds
    ): array {
        $baseQuery = fn () =>
            $this->vendorReturnQuery(
                $vendorProductIds
            );

        return [
            'total' =>
                $baseQuery()
                    ->count(),

            'requested' =>
                $baseQuery()
                    ->where(
                        'status',
                        'requested'
                    )
                    ->count(),

            'approved' =>
                $baseQuery()
                    ->where(
                        'status',
                        'approved'
                    )
                    ->count(),

            'in_transit' =>
                $baseQuery()
                    ->where(
                        'status',
                        'in_transit'
                    )
                    ->count(),

            'received' =>
                $baseQuery()
                    ->where(
                        'status',
                        'received'
                    )
                    ->count(),

            'refunded' =>
                $baseQuery()
                    ->where(
                        'status',
                        'refunded'
                    )
                    ->count(),
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT RETURN
    |--------------------------------------------------------------------------
    */

    private function formatReturn(
        OrderReturn $orderReturn,
        $vendorProductIds
    ): array {
        $order = $orderReturn->order;

        $vendorProductIdMap = collect(
            $vendorProductIds
        )
            ->mapWithKeys(
                fn ($id) => [
                    (int) $id => true,
                ]
            );

        $allReturnItems = collect(
            $orderReturn->items
        );

        $vendorReturnItems = $allReturnItems
            ->filter(
                function ($item) use (
                    $vendorProductIdMap
                ) {
                    return isset(
                        $vendorProductIdMap[
                            (int) $item->product_id
                        ]
                    );
                }
            )
            ->values();

        $vendorOrderItems = $order
            ? collect($order->items)
            : collect();

        $orderItemMap = $vendorOrderItems
            ->keyBy(
                fn ($item) =>
                    (int) $item->id
            );

        $returnValue = round(
            (float) $vendorReturnItems
                ->sum(
                    function ($returnItem) use (
                        $orderItemMap
                    ) {
                        $orderItem = $orderItemMap->get(
                            (int) $returnItem->order_item_id
                        );

                        if (! $orderItem) {
                            return 0;
                        }

                        return
                            (float) $orderItem->unit_price *
                            (int) $returnItem->quantity;
                    }
                ),
            2
        );

        $isMixedVendorReturn =
            $allReturnItems->count() !==
            $vendorReturnItems->count();

        $customer = $order?->user;

        return [
            'id' =>
                $orderReturn->id,

            'return_no' =>
                $orderReturn->return_no,

            'status' =>
                $orderReturn->status,

            'refund_status' =>
                $orderReturn->refund_status,

            /*
            |--------------------------------------------------------------------------
            | VENDOR-SCOPED VALUE
            |--------------------------------------------------------------------------
            */

            'refund_amount' =>
                $returnValue,

            'return_value' =>
                $returnValue,

            'customer_note' =>
                $orderReturn->customer_note,

            'requested_at' =>
                $orderReturn->requested_at,

            'approved_at' =>
                $orderReturn->approved_at,

            'rejected_at' =>
                $orderReturn->rejected_at,

            'received_at' =>
                $orderReturn->received_at,

            'cancelled_at' =>
                $orderReturn->cancelled_at,

            'created_at' =>
                $orderReturn->created_at,

            'updated_at' =>
                $orderReturn->updated_at,

            /*
            |--------------------------------------------------------------------------
            | MULTIVENDOR SAFETY
            |--------------------------------------------------------------------------
            */

            'is_mixed_vendor_return' =>
                $isMixedVendorReturn,

            'can_manage' =>
                ! $isMixedVendorReturn,

            /*
            |--------------------------------------------------------------------------
            | ORDER
            |--------------------------------------------------------------------------
            */

            'order' => $order
                ? [
                    'id' =>
                        $order->id,

                    'order_no' =>
                        $order->order_no,

                    'currency' =>
                        $order->currency
                        ?? 'USD',

                    'status' =>
                        $order->status,

                    'payment_status' =>
                        $order->payment_status,

                    'fulfillment_status' =>
                        $order->fulfillment_status,

                    'delivery_status' =>
                        $order->delivery_status,

                    'placed_at' =>
                        $order->placed_at,

                    'user' => [
                        'id' =>
                            $customer?->id,

                        'name' =>
                            $this->getCustomerName(
                                $customer
                            ),

                        'email' =>
                            $customer?->email,

                        'phone' =>
                            $customer?->phone,
                    ],

                    /*
                    |--------------------------------------------------------------------------
                    | ONLY THIS VENDOR'S ORDER ITEMS
                    |--------------------------------------------------------------------------
                    */

                    'items' =>
                        $vendorOrderItems
                            ->map(
                                function ($item) {
                                    return [
                                        'id' =>
                                            $item->id,

                                        'product_id' =>
                                            $item->product_id,

                                        'variant_id' =>
                                            $item->variant_id,

                                        'product_name' =>
                                            $item->product_name,

                                        'variant_name' =>
                                            $item->variant_name,

                                        'sku' =>
                                            $item->sku,

                                        'quantity' =>
                                            (int) $item->quantity,

                                        'unit_price' =>
                                            (float) $item->unit_price,

                                        'line_total' =>
                                            (float) $item->line_total,
                                    ];
                                }
                            )
                            ->values(),
                ]
                : null,

            /*
            |--------------------------------------------------------------------------
            | ONLY THIS VENDOR'S RETURN ITEMS
            |--------------------------------------------------------------------------
            */

            'items' =>
                $vendorReturnItems
                    ->map(
                        function ($item) {
                            return [
                                'id' =>
                                    $item->id,

                                'order_item_id' =>
                                    $item->order_item_id,

                                'product_id' =>
                                    $item->product_id,

                                'variant_id' =>
                                    $item->variant_id,

                                'product_name' =>
                                    $item->product_name,

                                'variant_name' =>
                                    $item->variant_name,

                                'sku' =>
                                    $item->sku,

                                'quantity' =>
                                    (int) $item->quantity,

                                'reason' =>
                                    $item->reason,

                                'item_condition' =>
                                    $item->item_condition,

                                'refund_amount' =>
                                    (float) (
                                        $item->refund_amount
                                        ?? 0
                                    ),
                            ];
                        }
                    )
                    ->values(),
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER NAME
    |--------------------------------------------------------------------------
    */

    private function getCustomerName(
        $customer
    ): string {
        if (! $customer) {
            return 'Customer';
        }

        if (! empty($customer->name)) {
            return $customer->name;
        }

        $name = trim(
            implode(
                ' ',
                array_filter([
                    $customer->first_name
                    ?? null,

                    $customer->middle_name
                    ?? null,

                    $customer->last_name
                    ?? null,
                ])
            )
        );

        return $name !== ''
            ? $name
            : 'Customer';
    }


    /*
    |--------------------------------------------------------------------------
    | AUTH VENDOR
    |--------------------------------------------------------------------------
    */

    private function vendor(
        Request $request
    ) {
        $user = $request->user();

        if (
            ! $user ||
            $user->role !== 'vendor'
        ) {
            abort(403);
        }

        return $user;
    }
}