<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminOrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim(
            (string) $request->query('search', '')
        );

        $tab = $request->query(
            'tab',
            'all'
        );

        $perPage = (int) $request->query(
            'per_page',
            15
        );

        if ($perPage < 1) {
            $perPage = 15;
        }

        if ($perPage > 100) {
            $perPage = 100;
        }

        $allowedTabs = [
            'all',
            'unfulfilled',
            'unpaid',
            'open',
            'archived',
        ];

        if (!in_array($tab, $allowedTabs, true)) {
            $tab = 'all';
        }

        $query = Order::query()
            ->select('orders.*')
            ->leftJoin(
                'users',
                'users.id',
                '=',
                'orders.user_id'
            )
            ->with([
                'user:id,name,email',
                'items:id,order_id,product_name,variant_name,quantity',
            ]);

        if ($search !== '') {
            $like = '%' . $search . '%';

            $query->whereRaw(
                '(
                    orders.order_no LIKE ?
                    OR users.name LIKE ?
                    OR users.email LIKE ?
                )',
                [
                    $like,
                    $like,
                    $like,
                ]
            );
        }

        if ($tab === 'unfulfilled') {
            $query->where(
                'orders.fulfillment_status',
                'unfulfilled'
            );
        }

        if ($tab === 'unpaid') {
            $query->where(
                'orders.payment_status',
                '!=',
                'paid'
            );
        }

        if ($tab === 'open') {
            $query->whereIn(
                'orders.status',
                [
                    'pending',
                    'processing',
                ]
            );
        }

        if ($tab === 'archived') {
            $query->where(
                'orders.status',
                'archived'
            );
        }

        $orders = $query
            ->orderByDesc('orders.id')
            ->paginate($perPage);

        $totalOrders = Order::query()
            ->count();

        $openOrders = Order::query()
            ->whereIn(
                'status',
                [
                    'pending',
                    'processing',
                ]
            )
            ->count();

        $paidOrders = Order::query()
            ->where(
                'payment_status',
                'paid'
            )
            ->count();

        $totalRevenue = (float) Order::query()
            ->where(
                'payment_status',
                'paid'
            )
            ->sum('grand_total');

        $averageOrderValue = 0;

        if ($paidOrders > 0) {
            $averageOrderValue = round(
                $totalRevenue / $paidOrders,
                2
            );
        }

        return response()->json([
            'success' => true,

            'stats' => [
                'total_orders' => $totalOrders,
                'open_orders' => $openOrders,
                'paid_orders' => $paidOrders,
                'total_revenue' => round(
                    $totalRevenue,
                    2
                ),
                'average_order_value' => $averageOrderValue,
            ],

            'orders' => $orders,
        ]);
    }

    public function show(Order $order): JsonResponse
    {
        $order->load([
            'user',
            'items',
            'shippingAddress',
            'billingAddress',
            'paymentTransactions',
        ]);

        return response()->json([
            'success' => true,
            'order' => $order,
        ]);
    }

    public function markShipped(Order $order): JsonResponse
    {
        if ($order->status === 'cancelled') {
            return response()->json([
                'success' => false,
                'message' => 'Cancelled order cannot be shipped.',
            ], 422);
        }

        $order->update([
            'status' => 'processing',
            'fulfillment_status' => 'fulfilled',
            'delivery_status' => 'shipped',
            'fulfilled_at' => $order->fulfilled_at ?? now(),
            'shipped_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order marked as shipped.',
            'order' => $order->fresh(),
        ]);
    }

    public function cancel(Order $order): JsonResponse
    {
        if ($order->status === 'cancelled') {
            return response()->json([
                'success' => true,
                'message' => 'Order is already cancelled.',
                'order' => $order,
            ]);
        }

        $order->update([
            'status' => 'cancelled',
            'cancelled_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Order cancelled successfully.',
            'order' => $order->fresh(),
        ]);
    }

    public function destroy(Order $order): JsonResponse
    {
        $order->delete();

        return response()->json([
            'success' => true,
            'message' => 'Order deleted successfully.',
        ]);
    }
}
