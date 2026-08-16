<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderPreorder;
use App\Models\PaymentTransaction;
use App\Models\ProductPreorder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminPreOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $tab = strtolower(
            trim((string) $request->query('tab', 'all'))
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

        if (!in_array($tab, $allowedTabs, true)) {
            $tab = 'all';
        }

        $search = trim(
            (string) $request->query('search', '')
        );

        $perPage = min(
            max(
                (int) $request->query('per_page', 10),
                1
            ),
            100
        );

        $query = OrderPreorder::query()
            ->with([
                'order.user',
                'order.items',
            ]);

        $this->applyTabFilter(
            $query,
            $tab
        );

        if ($search !== '') {
            $query->whereHas('order', function ($orderQuery) use ($search) {
                $orderQuery
                    ->where('order_no', 'like', '%' . $search . '%')
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery
                            ->where('name', 'like', '%' . $search . '%')
                            ->orWhere('first_name', 'like', '%' . $search . '%')
                            ->orWhere('last_name', 'like', '%' . $search . '%')
                            ->orWhere('email', 'like', '%' . $search . '%');
                    })
                    ->orWhereHas('items', function ($itemQuery) use ($search) {
                        $itemQuery
                            ->where('product_name', 'like', '%' . $search . '%')
                            ->orWhere('variant_name', 'like', '%' . $search . '%')
                            ->orWhere('sku', 'like', '%' . $search . '%');
                    });
            });
        }

        $preorders = $query
            ->latest('id')
            ->paginate($perPage);

        $items = collect(
            $preorders->items()
        )->map(function ($preorder) {
            return $this->formatPreorder(
                $preorder
            );
        });

        return response()->json([
            'success' => true,

            'stats' => $this->getStats(),

            'preorders' => $items,

            'pagination' => [
                'current_page' => $preorders->currentPage(),
                'last_page' => $preorders->lastPage(),
                'per_page' => $preorders->perPage(),
                'total' => $preorders->total(),
                'from' => $preorders->firstItem(),
                'to' => $preorders->lastItem(),
            ],

            'filters' => [
                'tab' => $tab,
                'search' => $search,
            ],
        ]);
    }

    public function destroy(
        OrderPreorder $preorder
    ): JsonResponse {
        if ($preorder->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'This pre-order is already cancelled.',
            ], 422);
        }

        $result = DB::transaction(function () use ($preorder) {
            $lockedPreorder = OrderPreorder::query()
                ->whereKey($preorder->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($lockedPreorder->status === 'cancelled') {
                return [
                    'already_cancelled' => true,
                    'requires_refund' => false,
                    'refundable_amount' => 0,
                ];
            }

            $order = Order::query()
                ->with('items')
                ->whereKey($lockedPreorder->order_id)
                ->lockForUpdate()
                ->firstOrFail();

            foreach ($order->items as $item) {
                if (!$item->product_id) {
                    continue;
                }

                $productPreorder = ProductPreorder::query()
                    ->where('product_id', $item->product_id)
                    ->lockForUpdate()
                    ->first();

                if (!$productPreorder) {
                    continue;
                }

                $currentReserved = max(
                    0,
                    (int) $productPreorder->reserved_quantity
                );

                $quantity = max(
                    0,
                    (int) $item->quantity
                );

                $productPreorder->update([
                    'reserved_quantity' => max(
                        0,
                        $currentReserved - $quantity
                    ),
                ]);
            }

            PaymentTransaction::query()
                ->where('order_id', $order->id)
                ->where('status', 'pending')
                ->update([
                    'status' => 'cancelled',
                    'cancelled_at' => now(),
                ]);

            $paidAmount = (float) PaymentTransaction::query()
                ->where('order_id', $order->id)
                ->where('status', 'paid')
                ->sum('amount');

            $refundedAmount = (float) PaymentTransaction::query()
                ->where('order_id', $order->id)
                ->whereIn('status', [
                    'refunded',
                    'partially_refunded',
                ])
                ->sum('amount');

            $refundableAmount = max(
                0,
                round(
                    $paidAmount - $refundedAmount,
                    2
                )
            );

            $lockedPreorder->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);

            $order->update([
                'status' => 'cancelled',
                'cancelled_at' => now(),
            ]);

            return [
                'already_cancelled' => false,
                'requires_refund' => $refundableAmount > 0,
                'refundable_amount' => $refundableAmount,
            ];
        });

        if ($result['already_cancelled']) {
            return response()->json([
                'success' => false,
                'message' => 'This pre-order is already cancelled.',
            ], 422);
        }

        return response()->json([
            'success' => true,

            'message' => $result['requires_refund']
                ? 'Pre-order cancelled. A paid amount remains eligible for refund.'
                : 'Pre-order cancelled successfully.',

            'requires_refund' => $result['requires_refund'],
            'refundable_amount' => $result['refundable_amount'],
        ]);
    }

    private function applyTabFilter(
        $query,
        string $tab
    ): void {
        if ($tab === 'reserved') {
            $query->where('status', 'reserved');

            return;
        }

        if ($tab === 'payment_due') {
            $query->where('status', 'payment_due');

            return;
        }

        if ($tab === 'delayed') {
            $query->where('status', 'delayed');

            return;
        }

        if ($tab === 'ready') {
            $query->where('status', 'ready');

            return;
        }

        if ($tab === 'cancelled') {
            $query->where('status', 'cancelled');

            return;
        }

        if ($tab === 'due_soon') {
            $query
                ->whereNotIn('status', [
                    'ready',
                    'cancelled',
                ])
                ->whereNotNull('expected_at')
                ->whereDate(
                    'expected_at',
                    '>=',
                    today()
                )
                ->whereDate(
                    'expected_at',
                    '<=',
                    today()->copy()->addDays(14)
                );

            return;
        }

        if ($tab === 'overdue') {
            $query
                ->whereNotIn('status', [
                    'ready',
                    'cancelled',
                ])
                ->whereNotNull('expected_at')
                ->whereDate(
                    'expected_at',
                    '<',
                    today()
                );
        }
    }

    private function getStats(): array
    {
        $activePreorders = OrderPreorder::query()
            ->where('status', '!=', 'cancelled');

        return [
            'preorders' => (clone $activePreorders)
                ->count(),

            'reserved' => OrderPreorder::query()
                ->where('status', 'reserved')
                ->sum('reserved_quantity'),

            'payment_due' => OrderPreorder::query()
                ->where('status', 'payment_due')
                ->count(),

            'ready' => OrderPreorder::query()
                ->where('status', 'ready')
                ->count(),

            'due_soon' => OrderPreorder::query()
                ->whereNotIn('status', [
                    'ready',
                    'cancelled',
                ])
                ->whereNotNull('expected_at')
                ->whereDate(
                    'expected_at',
                    '>=',
                    today()
                )
                ->whereDate(
                    'expected_at',
                    '<=',
                    today()->copy()->addDays(14)
                )
                ->count(),
        ];
    }

    private function formatPreorder(
        OrderPreorder $preorder
    ): array {
        $order = $preorder->order;

        if (!$order) {
            return [
                'id' => $preorder->id,
                'order_id' => null,
                'order_no' => null,
            ];
        }

        $customer = $order->user;

        $customerName = $customer
            ? $this->getCustomerName($customer)
            : 'Guest Customer';

        $orderItems = $order->items
            ->map(function ($item) {
                return [
                    'id' => $item->id,

                    'product_id' => $item->product_id,
                    'variant_id' => $item->variant_id,

                    'product_name' => $item->product_name,
                    'variant_name' => $item->variant_name,
                    'sku' => $item->sku,

                    'quantity' => (int) $item->quantity,

                    'unit_price' => (float) $item->unit_price,
                    'line_total' => (float) $item->line_total,
                ];
            })
            ->values();

        return [
            'id' => $preorder->id,

            'order_id' => $order->id,
            'order_no' => $order->order_no,

            'placed_at' => $order->placed_at,
            'created_at' => $order->created_at,

            'customer' => [
                'id' => $customer?->id,
                'name' => $customerName,
                'email' => $customer?->email,
                'phone' => $customer?->phone,
            ],

            'items' => $orderItems,

            'items_summary' => $this->getItemsSummary(
                $order->items
            ),

            'reserved_quantity' => (int) $preorder->reserved_quantity,

            'expected_at' => $preorder->expected_at,

            'preorder_status' => $preorder->status,

            'fulfillment_status' => $order->fulfillment_status
                ?? 'unfulfilled',

            'delivery_status' => $order->delivery_status
                ?? 'not_shipped',

            'payment_status' => $order->payment_status,

            'payment_terms' => $preorder->payment_terms,

            'deposit_amount' => $preorder->deposit_amount !== null
                ? (float) $preorder->deposit_amount
                : null,

            'balance_due' => (float) $preorder->balance_due,

            'balance_due_at' => $preorder->balance_due_at,

            'currency' => $order->currency,

            'subtotal' => (float) $order->subtotal,
            'grand_total' => (float) $order->grand_total,

            'cancelled_at' => $preorder->cancelled_at,

            'can_cancel' => $preorder->status !== 'cancelled',
        ];
    }

    private function getItemsSummary(
        $items
    ): string {
        if ($items->isEmpty()) {
            return 'No items';
        }

        $firstItem = $items->first();

        $summary =
            $firstItem->product_name .
            ' x' .
            $firstItem->quantity;

        if ($items->count() > 1) {
            $summary .= ' +' . (
                $items->count() - 1
            ) . ' more';
        }

        return $summary;
    }

    private function getCustomerName(
        $customer
    ): string {
        if (!empty($customer->name)) {
            return $customer->name;
        }

        $name = trim(
            implode(' ', array_filter([
                $customer->first_name ?? null,
                $customer->middle_name ?? null,
                $customer->last_name ?? null,
            ]))
        );

        return $name !== ''
            ? $name
            : 'Customer';
    }
}
