<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderReturn;
use App\Models\OrderReturnItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AdminReturnController extends Controller
{
    public function index(Request $request): JsonResponse
    {
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

        if (!in_array($tab, $allowedTabs, true)) {
            $tab = 'all';
        }

        $query = OrderReturn::query()
            ->with([
                'order.user',
                'order.items',
                'items',
            ]);

        if ($tab !== 'all') {
            $query->where(
                'status',
                $tab
            );
        }

        if ($search !== '') {
            $query->where(function ($query) use ($search) {
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
                        function ($itemQuery) use ($search) {
                            $itemQuery
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
            });
        }

        $returns = $query
            ->latest('id')
            ->paginate($perPage);

        return response()->json([
            'success' => true,

            'stats' => $this->getStats(),

            'returns' => $returns,

            'filters' => [
                'tab' => $tab,
                'search' => $search,
            ],
        ]);
    }

    public function show(
        OrderReturn $orderReturn
    ): JsonResponse {
        $orderReturn->load([
            'order.user',
            'order.items',
            'order.shippingAddress',
            'order.billingAddress',
            'items',
        ]);

        return response()->json([
            'success' => true,
            'return' => $orderReturn,
        ]);
    }

    public function store(
        Request $request,
        Order $order
    ): JsonResponse {
        $validated = $request->validate([
            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.order_item_id' => [
                'required',
                'integer',
                'exists:order_items,id',
            ],

            'items.*.quantity' => [
                'required',
                'integer',
                'min:1',
            ],

            'items.*.reason' => [
                'required',
                'string',
                'max:255',
            ],

            'items.*.item_condition' => [
                'nullable',
                'string',
                'max:100',
            ],

            'customer_note' => [
                'nullable',
                'string',
                'max:2000',
            ],

            'admin_note' => [
                'nullable',
                'string',
                'max:2000',
            ],
        ]);

        if ($order->status === 'cancelled') {
            throw ValidationException::withMessages([
                'order' => [
                    'A cancelled order cannot be returned.',
                ],
            ]);
        }

        $orderReturn = DB::transaction(function () use (
            $validated,
            $order
        ) {
            $order = Order::query()
                ->lockForUpdate()
                ->findOrFail($order->id);

            $orderReturn = OrderReturn::create([
                'return_no' =>
                    $this->generateReturnNumber(),

                'order_id' =>
                    $order->id,

                'user_id' =>
                    $order->user_id,

                'status' =>
                    'requested',

                'refund_status' =>
                    'not_refunded',

                'refund_amount' =>
                    0,

                'customer_note' =>
                    $validated['customer_note'] ?? null,

                'admin_note' =>
                    $validated['admin_note'] ?? null,

                'requested_at' =>
                    now(),
            ]);

            foreach ($validated['items'] as $line) {
                $orderItem = OrderItem::query()
                    ->whereKey(
                        $line['order_item_id']
                    )
                    ->where(
                        'order_id',
                        $order->id
                    )
                    ->lockForUpdate()
                    ->first();

                if (!$orderItem) {
                    throw ValidationException::withMessages([
                        'items' => [
                            'One of the selected order items is invalid.',
                        ],
                    ]);
                }

                $alreadyReturned =
                    $this->getAlreadyReturnedQuantity(
                        $orderItem->id
                    );

                $availableToReturn = max(
                    0,
                    (int) $orderItem->quantity -
                    $alreadyReturned
                );

                $returnQuantity = (int) $line['quantity'];

                if (
                    $returnQuantity >
                    $availableToReturn
                ) {
                    throw ValidationException::withMessages([
                        'items' => [
                            'Only '
                            . $availableToReturn
                            . ' unit(s) of '
                            . $orderItem->product_name
                            . ' can still be returned.',
                        ],
                    ]);
                }

                $orderReturn->items()->create([
                    'order_item_id' =>
                        $orderItem->id,

                    'product_id' =>
                        $orderItem->product_id,

                    'variant_id' =>
                        $orderItem->variant_id,

                    'product_name' =>
                        $orderItem->product_name,

                    'variant_name' =>
                        $orderItem->variant_name,

                    'sku' =>
                        $orderItem->sku,

                    'quantity' =>
                        $returnQuantity,

                    'reason' =>
                        $line['reason'],

                    'item_condition' =>
                        $line['item_condition'] ?? null,

                    'refund_amount' =>
                        0,
                ]);
            }

            return $orderReturn;
        });

        return response()->json([
            'success' => true,

            'message' =>
                'Return created successfully.',

            'return' =>
                $orderReturn->fresh([
                    'order.user',
                    'items',
                ]),
        ], 201);
    }

    public function approve(
        OrderReturn $orderReturn
    ): JsonResponse {
        if ($orderReturn->status !== 'requested') {
            return response()->json([
                'success' => false,
                'message' =>
                    'Only requested returns can be approved.',
            ], 422);
        }

        $orderReturn->update([
            'status' => 'approved',
            'approved_at' => now(),
            'rejected_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Return approved successfully.',
            'return' =>
                $orderReturn->fresh(),
        ]);
    }

    public function reject(
        OrderReturn $orderReturn
    ): JsonResponse {
        if ($orderReturn->status !== 'requested') {
            return response()->json([
                'success' => false,
                'message' =>
                    'Only requested returns can be rejected.',
            ], 422);
        }

        $orderReturn->update([
            'status' => 'rejected',
            'rejected_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Return rejected successfully.',
            'return' =>
                $orderReturn->fresh(),
        ]);
    }

    public function markInTransit(
        OrderReturn $orderReturn
    ): JsonResponse {
        if ($orderReturn->status !== 'approved') {
            return response()->json([
                'success' => false,
                'message' =>
                    'Only approved returns can be marked in transit.',
            ], 422);
        }

        $orderReturn->update([
            'status' => 'in_transit',
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Return marked as in transit.',
            'return' =>
                $orderReturn->fresh(),
        ]);
    }

    public function markReceived(
        OrderReturn $orderReturn
    ): JsonResponse {
        if (
            !in_array(
                $orderReturn->status,
                [
                    'approved',
                    'in_transit',
                ],
                true
            )
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'This return cannot be marked as received.',
            ], 422);
        }

        $orderReturn->update([
            'status' => 'received',
            'received_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Return marked as received.',
            'return' =>
                $orderReturn->fresh(),
        ]);
    }

    public function cancel(
        OrderReturn $orderReturn
    ): JsonResponse {
        if (
            in_array(
                $orderReturn->status,
                [
                    'received',
                    'refunded',
                    'rejected',
                    'cancelled',
                ],
                true
            )
        ) {
            return response()->json([
                'success' => false,
                'message' =>
                    'This return cannot be cancelled.',
            ], 422);
        }

        $orderReturn->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Return cancelled successfully.',
            'return' =>
                $orderReturn->fresh(),
        ]);
    }

    private function getAlreadyReturnedQuantity(
        int $orderItemId
    ): int {
        return (int) OrderReturnItem::query()
            ->where(
                'order_item_id',
                $orderItemId
            )
            ->whereHas(
                'orderReturn',
                function ($query) {
                    $query->whereNotIn(
                        'status',
                        [
                            'rejected',
                            'cancelled',
                        ]
                    );
                }
            )
            ->sum('quantity');
    }

    private function getStats(): array
    {
        return [
            'total' =>
                OrderReturn::query()->count(),

            'requested' =>
                OrderReturn::query()
                    ->where(
                        'status',
                        'requested'
                    )
                    ->count(),

            'approved' =>
                OrderReturn::query()
                    ->where(
                        'status',
                        'approved'
                    )
                    ->count(),

            'in_transit' =>
                OrderReturn::query()
                    ->where(
                        'status',
                        'in_transit'
                    )
                    ->count(),

            'received' =>
                OrderReturn::query()
                    ->where(
                        'status',
                        'received'
                    )
                    ->count(),

            'refunded' =>
                OrderReturn::query()
                    ->where(
                        'status',
                        'refunded'
                    )
                    ->count(),
        ];
    }

    private function generateReturnNumber(): string
    {
        do {
            $returnNo =
                'RET-'
                . now()->format('Ymd')
                . '-'
                . strtoupper(
                    Str::random(6)
                );
        } while (
            OrderReturn::query()
                ->where(
                    'return_no',
                    $returnNo
                )
                ->exists()
        );

        return $returnNo;
    }
}