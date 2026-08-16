<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\PaymentTransaction;
use App\Models\Wishlist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerDashboardController extends Controller
{
    public function overview(Request $request): JsonResponse
    {
        $user = $request->user();

        $ordersQuery = Order::query()
            ->where('user_id', $user->id);

        $totalOrders = (clone $ordersQuery)->count();

        $pendingOrders = (clone $ordersQuery)
            ->where('status', 'pending')
            ->count();

        $paidOrders = (clone $ordersQuery)
            ->whereNotNull('paid_at')
            ->get([
                'id',
                'grand_total',
            ]);

        $paidOrderIds = $paidOrders->pluck('id');

        $grossSpent = (float) $paidOrders->sum('grand_total');

        $refundedAmount = 0;

        if ($paidOrderIds->isNotEmpty()) {
            $refundedAmount = (float) PaymentTransaction::query()
                ->whereIn('order_id', $paidOrderIds)
                ->whereIn('status', [
                    'refunded',
                    'partially_refunded',
                ])
                ->sum('amount');
        }

        $totalSpent = max(
            0,
            round(
                $grossSpent - $refundedAmount,
                2
            )
        );

        $wishlistItems = Wishlist::query()
            ->where('user_id', $user->id)
            ->count();

        $recentOrders = Order::query()
            ->where('user_id', $user->id)
            ->latest('placed_at')
            ->latest('id')
            ->limit(5)
            ->get([
                'id',
                'order_no',
                'status',
                'payment_status',
                'grand_total',
                'currency',
                'placed_at',
                'created_at',
            ])
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'order_no' => $order->order_no,
                    'status' => $order->status,
                    'payment_status' => $order->payment_status,
                    'total' => (float) $order->grand_total,
                    'currency' => $order->currency,
                    'placed_at' => $order->placed_at,
                    'created_at' => $order->created_at,
                ];
            });

        return response()->json([
            'success' => true,

            'customer' => [
                'id' => $user->id,
                'name' => $user->name,
                'first_name' => $user->first_name,
                'middle_name' => $user->middle_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'photo' => $user->photo,
            ],

            'stats' => [
                'total_orders' => $totalOrders,
                'total_spent' => $totalSpent,
                'pending_orders' => $pendingOrders,
                'wishlist_items' => $wishlistItems,
            ],

            'sidebar' => [
                'orders_count' => $totalOrders,
                'wishlist_count' => $wishlistItems,
            ],

            'recent_orders' => $recentOrders,
        ]);
    }
}