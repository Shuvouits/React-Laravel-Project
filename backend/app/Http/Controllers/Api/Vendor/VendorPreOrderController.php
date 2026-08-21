<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\OrderPreorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorPreOrderController extends Controller
{
    public function index(
        Request $request
    ): JsonResponse {
        $vendor =
            $this->vendor(
                $request
            );

        $tab = strtolower(
            trim(
                (string) $request->query(
                    'tab',
                    'all'
                )
            )
        );

        $allowedTabs = [
            'all',
            'reserved',
            'payment_due',
            'delayed',
            'ready',
            'due_soon',
            'overdue',
            'cancelled',
        ];

        if (
            ! in_array(
                $tab,
                $allowedTabs,
                true
            )
        ) {
            $tab = 'all';
        }


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
                    10
                ),
                1
            ),
            100
        );


        $query =
            $this->vendorPreorderQuery(
                $vendor->id
            );


        $this->applyTabFilter(
            $query,
            $tab
        );


        if ($search !== '') {
            $query->whereHas(
                'order',
                function ($orderQuery) use (
                    $search,
                    $vendor
                ) {
                    $orderQuery->where(
                        function ($query) use (
                            $search,
                            $vendor
                        ) {
                            $query
                                ->where(
                                    'order_no',
                                    'like',
                                    '%' . $search . '%'
                                )
                                ->orWhereHas(
                                    'user',
                                    function ($userQuery) use (
                                        $search
                                    ) {
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
                                )
                                ->orWhereHas(
                                    'items',
                                    function ($itemQuery) use (
                                        $search,
                                        $vendor
                                    ) {
                                        $itemQuery
                                            ->whereHas(
                                                'product',
                                                function ($productQuery) use (
                                                    $vendor
                                                ) {
                                                    $this
                                                        ->applyVendorProductScope(
                                                            $productQuery,
                                                            $vendor->id
                                                        );
                                                }
                                            )
                                            ->where(
                                                function ($query) use (
                                                    $search
                                                ) {
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
            );
        }


        $preorders = $query
            ->latest('id')
            ->paginate(
                $perPage
            );


        $items = collect(
            $preorders->items()
        )
            ->map(
                function ($preorder) {
                    return $this
                        ->formatPreorder(
                            $preorder
                        );
                }
            )
            ->values();


        return response()->json([
            'success' => true,

            'stats' =>
                $this->getStats(
                    $vendor->id
                ),

            'preorders' =>
                $items,

            'pagination' => [
                'current_page' =>
                    $preorders->currentPage(),

                'last_page' =>
                    $preorders->lastPage(),

                'per_page' =>
                    $preorders->perPage(),

                'total' =>
                    $preorders->total(),

                'from' =>
                    $preorders->firstItem(),

                'to' =>
                    $preorders->lastItem(),
            ],

            'filters' => [
                'tab' =>
                    $tab,

                'search' =>
                    $search,
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | VENDOR PREORDER QUERY
    |--------------------------------------------------------------------------
    */

    private function vendorPreorderQuery(
        int $vendorId
    ) {
        return OrderPreorder::query()
            ->whereHas(
                'order.items.product',
                function ($productQuery) use (
                    $vendorId
                ) {
                    $this
                        ->applyVendorProductScope(
                            $productQuery,
                            $vendorId
                        );
                }
            )
            ->with([
                'order.user',

                'order.items' =>
                    function ($itemQuery) use (
                        $vendorId
                    ) {
                        $itemQuery
                            ->whereHas(
                                'product',
                                function ($productQuery) use (
                                    $vendorId
                                ) {
                                    $this
                                        ->applyVendorProductScope(
                                            $productQuery,
                                            $vendorId
                                        );
                                }
                            )
                            ->with(
                                'product.preorder'
                            );
                    },
            ]);
    }


    /*
    |--------------------------------------------------------------------------
    | VENDOR PRODUCT SCOPE
    |--------------------------------------------------------------------------
    */

    private function applyVendorProductScope(
        $query,
        int $vendorId
    ): void {
        $query
            ->where(
                'source',
                'vendor'
            )
            ->where(
                'created_by',
                $vendorId
            )
            ->where(
                'preorder_enabled',
                true
            );
    }


    /*
    |--------------------------------------------------------------------------
    | TAB FILTERS
    |--------------------------------------------------------------------------
    */

    private function applyTabFilter(
        $query,
        string $tab
    ): void {
        if ($tab === 'reserved') {
            $query->where(
                'status',
                'reserved'
            );

            return;
        }


        if ($tab === 'payment_due') {
            $query->where(
                'status',
                'payment_due'
            );

            return;
        }


        if ($tab === 'delayed') {
            $query->where(
                'status',
                'delayed'
            );

            return;
        }


        if ($tab === 'ready') {
            $query->where(
                'status',
                'ready'
            );

            return;
        }


        if ($tab === 'cancelled') {
            $query->where(
                'status',
                'cancelled'
            );

            return;
        }


        if ($tab === 'due_soon') {
            $query
                ->whereNotIn(
                    'status',
                    [
                        'ready',
                        'cancelled',
                    ]
                )
                ->whereNotNull(
                    'expected_at'
                )
                ->whereDate(
                    'expected_at',
                    '>=',
                    today()
                )
                ->whereDate(
                    'expected_at',
                    '<=',
                    today()
                        ->copy()
                        ->addDays(14)
                );

            return;
        }


        if ($tab === 'overdue') {
            $query
                ->whereNotIn(
                    'status',
                    [
                        'ready',
                        'cancelled',
                    ]
                )
                ->whereNotNull(
                    'expected_at'
                )
                ->whereDate(
                    'expected_at',
                    '<',
                    today()
                );
        }
    }


    /*
    |--------------------------------------------------------------------------
    | VENDOR STATS
    |--------------------------------------------------------------------------
    */

    private function getStats(
        int $vendorId
    ): array {
        $activePreorders =
            $this->vendorPreorderQuery(
                $vendorId
            )
                ->where(
                    'status',
                    '!=',
                    'cancelled'
                );


        $reservedPreorders =
            $this->vendorPreorderQuery(
                $vendorId
            )
                ->where(
                    'status',
                    'reserved'
                )
                ->get();


        $reservedQuantity =
            $reservedPreorders->sum(
                function ($preorder) {
                    return $preorder
                        ->order
                        ?->items
                        ?->sum(
                            function ($item) {
                                return (int) (
                                    $item->quantity
                                    ?? 0
                                );
                            }
                        )
                        ?? 0;
                }
            );


        return [
            'preorders' =>
                (clone $activePreorders)
                    ->count(),

            'reserved' =>
                (int) $reservedQuantity,

            'payment_due' =>
                $this
                    ->vendorPreorderQuery(
                        $vendorId
                    )
                    ->where(
                        'status',
                        'payment_due'
                    )
                    ->count(),

            'ready' =>
                $this
                    ->vendorPreorderQuery(
                        $vendorId
                    )
                    ->where(
                        'status',
                        'ready'
                    )
                    ->count(),

            'due_soon' =>
                $this
                    ->vendorPreorderQuery(
                        $vendorId
                    )
                    ->whereNotIn(
                        'status',
                        [
                            'ready',
                            'cancelled',
                        ]
                    )
                    ->whereNotNull(
                        'expected_at'
                    )
                    ->whereDate(
                        'expected_at',
                        '>=',
                        today()
                    )
                    ->whereDate(
                        'expected_at',
                        '<=',
                        today()
                            ->copy()
                            ->addDays(14)
                    )
                    ->count(),
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | FORMAT PREORDER
    |--------------------------------------------------------------------------
    */

    private function formatPreorder(
        OrderPreorder $preorder
    ): array {
        $order =
            $preorder->order;


        if (! $order) {
            return [
                'id' =>
                    $preorder->id,

                'order_id' =>
                    null,

                'order_no' =>
                    null,
            ];
        }


        /*
        |--------------------------------------------------------------------------
        | ITEMS HERE ARE ALREADY VENDOR-SCOPED
        |--------------------------------------------------------------------------
        */

        $vendorItems =
            $order->items;


        $customer =
            $order->user;


        $customerName =
            $customer
                ? $this
                    ->getCustomerName(
                        $customer
                    )
                : 'Guest Customer';


        $orderItems =
            $vendorItems
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
                                (int) $item
                                    ->quantity,

                            'unit_price' =>
                                (float) $item
                                    ->unit_price,

                            'line_total' =>
                                (float) $item
                                    ->line_total,
                        ];
                    }
                )
                ->values();


        $reservedQuantity =
            (int) $vendorItems
                ->sum(
                    'quantity'
                );


        $vendorSubtotal =
            round(
                (float) $vendorItems
                    ->sum(
                        'line_total'
                    ),
                2
            );


        $paymentTerms =
            $this
                ->getPaymentTerms(
                    $vendorItems
                );


        $depositAmount =
            $this
                ->getDepositAmount(
                    $vendorItems
                );


        $balanceDue =
            match ($paymentTerms) {
                'deposit' =>
                    max(
                        0,
                        round(
                            $vendorSubtotal -
                            $depositAmount,
                            2
                        )
                    ),

                'pay_later' =>
                    $vendorSubtotal,

                default =>
                    0,
            };


        return [
            'id' =>
                $preorder->id,

            'order_id' =>
                $order->id,

            'order_no' =>
                $order->order_no,

            'placed_at' =>
                $order->placed_at,

            'created_at' =>
                $order->created_at,

            'customer' => [
                'id' =>
                    $customer?->id,

                'name' =>
                    $customerName,

                'email' =>
                    $customer?->email,

                'phone' =>
                    $customer?->phone,
            ],

            'items' =>
                $orderItems,

            'items_summary' =>
                $this
                    ->getItemsSummary(
                        $vendorItems
                    ),

            'reserved_quantity' =>
                $reservedQuantity,

            'expected_at' =>
                $this
                    ->getExpectedDate(
                        $vendorItems
                    )
                ??
                $preorder
                    ->expected_at,

            'preorder_status' =>
                $preorder->status,

            'fulfillment_status' =>
                $order
                    ->fulfillment_status
                ?? 'unfulfilled',

            'delivery_status' =>
                $order
                    ->delivery_status
                ?? 'not_shipped',

            'payment_status' =>
                $order
                    ->payment_status,

            'payment_terms' =>
                $paymentTerms,

            'deposit_amount' =>
                $paymentTerms ===
                'deposit'
                    ? $depositAmount
                    : null,

            'balance_due' =>
                $balanceDue,

            'balance_due_at' =>
                $this
                    ->getBalanceDueDate(
                        $vendorItems
                    )
                ??
                $preorder
                    ->balance_due_at,

            'currency' =>
                $order->currency
                ?? 'USD',

            /*
            |--------------------------------------------------------------------------
            | VENDOR-SCOPED TOTALS
            |--------------------------------------------------------------------------
            */

            'subtotal' =>
                $vendorSubtotal,

            'grand_total' =>
                $vendorSubtotal,

            'cancelled_at' =>
                $preorder
                    ->cancelled_at,

            /*
            |--------------------------------------------------------------------------
            | CANCEL WILL BE HANDLED SEPARATELY
            |--------------------------------------------------------------------------
            */

            'can_cancel' =>
                false,
        ];
    }


    /*
    |--------------------------------------------------------------------------
    | PAYMENT TERMS
    |--------------------------------------------------------------------------
    */

    private function getPaymentTerms(
        $items
    ): string {
        $paymentTypes =
            $items
                ->map(
                    function ($item) {
                        return $item
                            ->product
                            ?->preorder
                            ?->payment_type;
                    }
                )
                ->filter()
                ->values();


        if (
            $paymentTypes
                ->contains(
                    'deposit'
                )
        ) {
            return 'deposit';
        }


        if (
            $paymentTypes
                ->contains(
                    'pay_later'
                )
        ) {
            return 'pay_later';
        }


        return 'full';
    }


    /*
    |--------------------------------------------------------------------------
    | DEPOSIT
    |--------------------------------------------------------------------------
    */

    private function getDepositAmount(
        $items
    ): float {
        $deposit =
            $items->sum(
                function ($item) {
                    $preorder =
                        $item
                            ->product
                            ?->preorder;


                    if (
                        ! $preorder ||
                        $preorder
                            ->payment_type !==
                            'deposit' ||
                        $preorder
                            ->deposit_value ===
                            null
                    ) {
                        return 0;
                    }


                    $quantity =
                        max(
                            1,
                            (int) $item
                                ->quantity
                        );


                    $unitPrice =
                        (float) $item
                            ->unit_price;


                    if (
                        $preorder
                            ->deposit_type ===
                        'percentage'
                    ) {
                        $unitDeposit =
                            $unitPrice *
                            (
                                (float) $preorder
                                    ->deposit_value /
                                100
                            );


                        return
                            $unitDeposit *
                            $quantity;
                    }


                    if (
                        $preorder
                            ->deposit_type ===
                        'fixed'
                    ) {
                        $unitDeposit =
                            min(
                                $unitPrice,
                                (float) $preorder
                                    ->deposit_value
                            );


                        return
                            $unitDeposit *
                            $quantity;
                    }


                    return 0;
                }
            );


        return round(
            (float) $deposit,
            2
        );
    }


    /*
    |--------------------------------------------------------------------------
    | EXPECTED DATE
    |--------------------------------------------------------------------------
    */

    private function getExpectedDate(
        $items
    ): ?string {
        $dates =
            $items
                ->map(
                    function ($item) {
                        $preorder =
                            $item
                                ->product
                                ?->preorder;


                        if (
                            $preorder
                                ?->expected_ship_to
                        ) {
                            return $preorder
                                ->expected_ship_to;
                        }


                        return $preorder
                            ?->expected_ship_from;
                    }
                )
                ->filter()
                ->sortBy(
                    function ($date) {
                        return $date
                            ->timestamp;
                    }
                );


        $latest =
            $dates->last();


        return $latest
            ? $latest->format(
                'Y-m-d'
            )
            : null;
    }


    /*
    |--------------------------------------------------------------------------
    | BALANCE DUE DATE
    |--------------------------------------------------------------------------
    */

    private function getBalanceDueDate(
        $items
    ) {
        return $items
            ->map(
                function ($item) {
                    return $item
                        ->product
                        ?->preorder
                        ?->balance_due_at;
                }
            )
            ->filter()
            ->sortBy(
                function ($date) {
                    return $date
                        ->timestamp;
                }
            )
            ->first();
    }


    /*
    |--------------------------------------------------------------------------
    | ITEM SUMMARY
    |--------------------------------------------------------------------------
    */

    private function getItemsSummary(
        $items
    ): string {
        if ($items->isEmpty()) {
            return 'No items';
        }


        $firstItem =
            $items->first();


        $summary =
            $firstItem
                ->product_name
            .
            ' x'
            .
            $firstItem
                ->quantity;


        if (
            $items->count() > 1
        ) {
            $summary .=
                ' +' .
                (
                    $items->count() -
                    1
                ) .
                ' more';
        }


        return $summary;
    }


    /*
    |--------------------------------------------------------------------------
    | CUSTOMER NAME
    |--------------------------------------------------------------------------
    */

    private function getCustomerName(
        $customer
    ): string {
        if (
            ! empty(
                $customer->name
            )
        ) {
            return $customer
                ->name;
        }


        $name = trim(
            implode(
                ' ',
                array_filter([
                    $customer
                        ->first_name
                    ?? null,

                    $customer
                        ->middle_name
                    ?? null,

                    $customer
                        ->last_name
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
}
