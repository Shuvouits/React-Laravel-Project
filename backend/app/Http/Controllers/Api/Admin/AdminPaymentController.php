<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use App\Models\VendorPayout;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class AdminPaymentController extends Controller
{
    

public function index(Request $request): JsonResponse
{
    $request->validate([
        'recent_limit' => [
            'nullable',
            'integer',
            'min:1',
            'max:50',
        ],
    ]);

    $paidRevenue = PaymentTransaction::query()
        ->whereIn('status', [
            'paid',
            'succeeded',
        ])
        ->sum('amount');

    $refundedAmount = PaymentTransaction::query()
        ->whereIn('status', [
            'refunded',
            'partially_refunded',
        ])
        ->sum('amount');

    $pendingPayments = PaymentTransaction::query()
        ->where('status', 'pending')
        ->count();

    $refundedOrders = PaymentTransaction::query()
        ->whereIn('status', [
            'refunded',
            'partially_refunded',
        ])
        ->whereNotNull('order_id')
        ->distinct()
        ->count('order_id');

    $payoutAmountColumn =
        $this->getPayoutAmountColumn();

    $pendingPayoutAmount = 0;
    $paidPayoutAmount = 0;

    if ($payoutAmountColumn) {
        $pendingPayoutAmount =
            VendorPayout::query()
                ->whereIn('status', [
                    'pending',
                    'processing',
                ])
                ->sum($payoutAmountColumn);

        $paidPayoutAmount =
            VendorPayout::query()
                ->where('status', 'paid')
                ->sum($payoutAmountColumn);
    }

    $recentTransactions =
        $this->recentTransactions(
            $request->integer(
                'recent_limit',
                10
            )
        );

    return response()->json([
        'success' => true,

        'message' =>
            'Payment dashboard fetched successfully.',

        'currency' => 'USD',

        'summary' => [
            'paid_revenue' =>
                $this->money($paidRevenue),

            'refunded_amount' =>
                $this->money($refundedAmount),

            'pending_payments' =>
                $pendingPayments,

            'refunded_orders' =>
                $refundedOrders,

            'pending_payout_amount' =>
                $this->money(
                    $pendingPayoutAmount
                ),

            'paid_payout_amount' =>
                $this->money(
                    $paidPayoutAmount
                ),
        ],

        'gateway_health' =>
            $this->gatewayHealth(),

        'recent_transactions' =>
            $recentTransactions,
    ]);
}




    private function recentTransactions(
        int $limit
    ): array {
        $transactions = PaymentTransaction::query()
            ->with([
                'order:id,order_no,payment_status,grand_total,currency',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get();

        return $transactions
            ->map(function ($transaction) {
                $type = $this->transactionType(
                    $transaction
                );

                $amount = (float) $transaction->amount;

                return [
                    'id' => $transaction->id,

                    'order_id' =>
                        $transaction->order_id,

                    'order_no' =>
                        $transaction->order
                            ? $transaction->order->order_no
                            : null,

                    'type' => $type,

                    'provider' =>
                        $this->gatewayName(
                            $transaction->gateway
                        ),

                    'gateway' =>
                        $transaction->gateway,

                    'status' =>
                        $this->transactionStatus(
                            $transaction->status
                        ),

                    'original_status' =>
                        $transaction->status,

                    'gross_amount' =>
                        $this->money($amount),

                    'net_amount' =>
                        $this->money(
                            $type === 'refund'
                                ? -abs($amount)
                                : abs($amount)
                        ),

                    'currency' =>
                        $transaction->currency
                        ?: 'USD',

                    'gateway_reference' =>
                        $transaction->gateway_reference,

                    'gateway_transaction_id' =>
                        $transaction
                            ->gateway_transaction_id,

                    'failure_reason' =>
                        $transaction->failure_reason,

                    'paid_at' =>
                        $transaction->paid_at,

                    'failed_at' =>
                        $transaction->failed_at,

                    'cancelled_at' =>
                        $transaction->cancelled_at,

                    'created_at' =>
                        $transaction->created_at,
                ];
            })
            ->values()
            ->all();
    }

    private function gatewayHealth(): array
    {
       


    $settings = DB::table('payment_settings')
    ->select([
        'gateway',
        'is_enabled',
        'mode',
        'config',
    ])
    ->get()
    ->keyBy('gateway');

    

        $gateways = [
            [
                'key' => 'stripe',
                'name' => 'Stripe',
            ],
            [
                'key' => 'paypal',
                'name' => 'PayPal',
            ],
            [
                'key' => 'razorpay',
                'name' => 'Razorpay',
            ],
            [
                'key' => 'sslcommerz',
                'name' => 'SSLCommerz',
            ],
            [
                'key' => 'paystack',
                'name' => 'Paystack',
            ],
            [
                'key' => 'pesapal',
                'name' => 'Pesapal',
            ],
            [
                'key' => 'iotec_pay',
                'name' => 'ioTec Pay',
            ],
            [
                'key' => 'cash_on_delivery',
                'name' => 'Cash on Delivery',
            ],
        ];

        return collect($gateways)
            ->map(function ($gateway) use ($settings) {
                if (
                    $gateway['key']
                    === 'cash_on_delivery'
                ) {
                    return [
                        'gateway' =>
                            $gateway['key'],

                        'name' =>
                            $gateway['name'],

                        'status' =>
                            'connected',

                        'is_enabled' => true,

                        'mode' =>
                            'manual',
                    ];
                }

                $setting = $settings->get(
                    $gateway['key']
                );

                if (!$setting) {
                    return [
                        'gateway' =>
                            $gateway['key'],

                        'name' =>
                            $gateway['name'],

                        'status' =>
                            'needs_setup',

                        'is_enabled' => false,

                        'mode' => null,
                    ];
                }

                $isEnabled = (bool) $setting
                    ->is_enabled;

                $hasConfiguration =
                    !empty($setting->config);

                if (
                    $isEnabled
                    && $hasConfiguration
                ) {
                    $status = 'connected';
                } elseif ($isEnabled) {
                    $status = 'needs_setup';
                } else {
                    $status = 'disabled';
                }

                return [
                    'gateway' =>
                        $gateway['key'],

                    'name' =>
                        $gateway['name'],

                    'status' =>
                        $status,

                    'is_enabled' =>
                        $isEnabled,

                    'mode' =>
                        $setting->mode,
                ];
            })
            ->values()
            ->all();
    }

    private function transactionType(
        PaymentTransaction $transaction
    ): string {
        if (
            in_array(
                $transaction->status,
                [
                    'refunded',
                    'partially_refunded',
                ],
                true
            )
        ) {
            return 'refund';
        }

        $reference = strtolower(
            (string) $transaction
                ->gateway_reference
        );

        if (
            str_starts_with(
                $reference,
                'refund'
            )
            || str_starts_with(
                $reference,
                're_'
            )
        ) {
            return 'refund';
        }

        return 'charge';
    }

    private function transactionStatus(
        ?string $status
    ): string {
        return match ($status) {
            'paid',
            'succeeded',
            'refunded',
            'partially_refunded' =>
                'succeeded',

            'failed' =>
                'failed',

            'cancelled',
            'canceled' =>
                'cancelled',

            default =>
                'pending',
        };
    }

    private function gatewayName(
        ?string $gateway
    ): string {
        return match (
            strtolower((string) $gateway)
        ) {
            'stripe' =>
                'Stripe',

            'paypal' =>
                'PayPal',

            'sslcommerz' =>
                'SSLCommerz',

            'razorpay' =>
                'Razorpay',

            'paystack' =>
                'Paystack',

            'pesapal' =>
                'Pesapal',

            'iotec_pay' =>
                'ioTec Pay',

            'manual' =>
                'Manual',

            'cash',
            'cash_on_delivery',
            'cod' =>
                'Cash on Delivery',

            'pos_cash' =>
                'POS Cash',

            default =>
                ucwords(
                    str_replace(
                        '_',
                        ' ',
                        (string) $gateway
                    )
                ),
        };
    }

    private function money(
        float|int|string|null $amount
    ): float {
        return round(
            (float) $amount,
            2
        );
    }


    private function getPayoutAmountColumn(): ?string
{
    $availableColumns = [
        'net_amount',
        'net_payout',
        'amount',
    ];

    foreach ($availableColumns as $column) {
        if (
            Schema::hasColumn(
                'vendor_payouts',
                $column
            )
        ) {
            return $column;
        }
    }

    return null;
}





}
