<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\OrderPreorder;
use App\Models\PaymentSetting;
use App\Models\PaymentTransaction;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Stripe\StripeClient;
use Throwable;

class StripePaymentService
{
    public function createCheckout(Order $order): PaymentTransaction
    {
        $setting = PaymentSetting::query()
            ->where('gateway', 'stripe')
            ->first();

        if (!$setting) {
            throw new RuntimeException(
                'Stripe payment settings were not found.'
            );
        }

        if (!$setting->is_enabled) {
            throw new RuntimeException(
                'Stripe payment is currently disabled.'
            );
        }

        $config = $setting->config ?? [];

        $secretKey = $config['secret_key'] ?? null;

        if (!$secretKey) {
            throw new RuntimeException(
                'Stripe secret key is not configured.'
            );
        }

        $order->loadMissing([
            'user',
            'preorder',
        ]);

        $paymentType = $this->getPaymentType(
            $order
        );

        $checkoutAmount = $this->getCheckoutAmount(
            $order
        );

        if ($checkoutAmount <= 0) {
            throw new RuntimeException(
                'This order does not require an online payment at this time.'
            );
        }

        $transaction = PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => 'stripe',
            'status' => 'pending',
            'amount' => $checkoutAmount,
            'currency' => $order->currency,
        ]);

        try {
            $stripe = new StripeClient(
                $secretKey
            );

            $backendUrl = rtrim(
                config('app.url'),
                '/'
            );

            $frontendUrl = rtrim(
                config(
                    'app.frontend_url',
                    'http://localhost:5173'
                ),
                '/'
            );

            $amount = (int) round(
                $checkoutAmount * 100
            );

            $productName = $paymentType === 'deposit'
                ? 'Pre-order deposit for ' . $order->order_no
                : 'Order ' . $order->order_no;

            $session = $stripe->checkout->sessions->create([
                'mode' => 'payment',

                'payment_method_types' => [
                    'card',
                ],

                'client_reference_id' => (string) $order->id,

                'customer_email' => $order->user?->email,

                'line_items' => [
                    [
                        'quantity' => 1,

                        'price_data' => [
                            'currency' => strtolower(
                                $order->currency
                            ),

                            'unit_amount' => $amount,

                            'product_data' => [
                                'name' => $productName,
                            ],
                        ],
                    ],
                ],

                'metadata' => [
                    'order_id' => (string) $order->id,
                    'order_no' => $order->order_no,
                    'payment_transaction_id' => (string) $transaction->id,
                    'payment_type' => $paymentType,
                    'payment_amount' => number_format(
                        $checkoutAmount,
                        2,
                        '.',
                        ''
                    ),
                ],

                'success_url' =>
                    $backendUrl
                    . '/api/payments/stripe/success'
                    . '?session_id={CHECKOUT_SESSION_ID}',

                'cancel_url' =>
                    $frontendUrl
                    . '/payment/cancelled'
                    . '?provider=stripe'
                    . '&order='
                    . $order->id,
            ]);

            $transaction->update([
                'gateway_reference' => $session->id,

                'redirect_url' => $session->url,

                'gateway_response' => [
                    'session_id' => $session->id,
                    'url' => $session->url,
                    'status' => $session->status,
                    'payment_status' => $session->payment_status,
                    'payment_type' => $paymentType,
                    'checkout_amount' => $checkoutAmount,
                ],
            ]);

            return $transaction->fresh();
        } catch (Throwable $error) {
            $transaction->update([
                'status' => 'failed',
                'failure_reason' => $error->getMessage(),
                'failed_at' => now(),
            ]);

            throw $error;
        }
    }

    public function verifyCheckout(string $sessionId): Order
    {
        $setting = PaymentSetting::query()
            ->where('gateway', 'stripe')
            ->first();

        if (!$setting) {
            throw new RuntimeException(
                'Stripe payment settings were not found.'
            );
        }

        if (!$setting->is_enabled) {
            throw new RuntimeException(
                'Stripe payment is currently disabled.'
            );
        }

        $config = $setting->config ?? [];

        $secretKey = $config['secret_key'] ?? null;

        if (!$secretKey) {
            throw new RuntimeException(
                'Stripe secret key is not configured.'
            );
        }

        $stripe = new StripeClient(
            $secretKey
        );

        $session = $stripe
            ->checkout
            ->sessions
            ->retrieve($sessionId);

        if ($session->payment_status !== 'paid') {
            throw new RuntimeException(
                'Stripe payment has not been completed.'
            );
        }

        $transaction = PaymentTransaction::query()
            ->where('gateway', 'stripe')
            ->where('gateway_reference', $sessionId)
            ->first();

        if (!$transaction) {
            throw new RuntimeException(
                'Stripe payment transaction was not found.'
            );
        }

        $order = Order::query()
            ->with('preorder')
            ->find($transaction->order_id);

        if (!$order) {
            throw new RuntimeException(
                'Order was not found.'
            );
        }

        if (
            (string) $session->client_reference_id !==
            (string) $order->id
        ) {
            throw new RuntimeException(
                'Stripe order reference does not match.'
            );
        }

        $metadataOrderId =
            $session->metadata->order_id ?? null;

        if (
            $metadataOrderId &&
            (string) $metadataOrderId !==
            (string) $order->id
        ) {
            throw new RuntimeException(
                'Stripe order metadata does not match.'
            );
        }

        $metadataTransactionId =
            $session->metadata->payment_transaction_id ?? null;

        if (
            $metadataTransactionId &&
            (string) $metadataTransactionId !==
            (string) $transaction->id
        ) {
            throw new RuntimeException(
                'Stripe transaction metadata does not match.'
            );
        }

        $expectedAmount = (int) round(
            ((float) $transaction->amount) * 100
        );

        if (
            (int) $session->amount_total !==
            $expectedAmount
        ) {
            throw new RuntimeException(
                'Stripe payment amount does not match the expected payment amount.'
            );
        }

        if (
            strtolower((string) $session->currency) !==
            strtolower((string) $transaction->currency)
        ) {
            throw new RuntimeException(
                'Stripe payment currency does not match the transaction currency.'
            );
        }

        return DB::transaction(function () use (
            $order,
            $transaction,
            $session
        ) {
            $transaction = PaymentTransaction::query()
                ->lockForUpdate()
                ->findOrFail($transaction->id);

            $order = Order::query()
                ->lockForUpdate()
                ->findOrFail($order->id);

            $preorder = OrderPreorder::query()
                ->where('order_id', $order->id)
                ->lockForUpdate()
                ->first();

            $paymentIntent =
                $session->payment_intent ?: null;

            $transaction->update([
                'status' => 'paid',

                'gateway_transaction_id' =>
                    $paymentIntent,

                'failure_reason' => null,

                'paid_at' =>
                    $transaction->paid_at ?: now(),

                'failed_at' => null,

                'cancelled_at' => null,

                'gateway_response' => [
                    'session_id' => $session->id,
                    'status' => $session->status,
                    'payment_status' => $session->payment_status,
                    'payment_intent' => $paymentIntent,
                    'amount_total' => $session->amount_total,
                    'currency' => $session->currency,
                    'payment_type' =>
                        $session->metadata->payment_type ?? 'full',
                    'customer_email' =>
                        $session->customer_details?->email
                        ?? $session->customer_email,
                ],
            ]);

            $totalPaid = (float) PaymentTransaction::query()
                ->where('order_id', $order->id)
                ->where('status', 'paid')
                ->sum('amount');

            $grandTotal = (float) $order->grand_total;

            $remainingBalance = max(
                0,
                round(
                    $grandTotal - $totalPaid,
                    2
                )
            );

            $fullyPaid =
                $remainingBalance <= 0.009;

            if ($preorder) {
                $preorderData = [
                    'balance_due' => $remainingBalance,
                ];

                if (
                    !$fullyPaid &&
                    $preorder->payment_terms === 'deposit' &&
                    $preorder->status !== 'cancelled'
                ) {
                    $preorderData['status'] = 'payment_due';
                }

                if (
                    $fullyPaid &&
                    $preorder->status === 'payment_due'
                ) {
                    $preorderData['status'] = 'reserved';
                }

                $preorder->update($preorderData);
            }

            $orderData = [];

            if ($fullyPaid) {
                $orderData['payment_status'] = 'paid';

                $orderData['paid_at'] =
                    $order->paid_at ?: now();

                if ($order->status === 'pending') {
                    $orderData['status'] =
                        'processing';
                }
            } else {
                $orderData['payment_status'] =
                    'pending';
            }

            $order->update(
                $orderData
            );

            return $order->fresh([
                'user',
                'items',
                'shippingAddress',
                'billingAddress',
                'paymentTransactions',
                'preorder',
            ]);
        });
    }

    private function getCheckoutAmount(
        Order $order
    ): float {
        $grandTotal = round(
            (float) $order->grand_total,
            2
        );

        if (!$order->preorder) {
            return $grandTotal;
        }

        if (
            $order->preorder->payment_terms === 'deposit'
        ) {
            $depositAmount = round(
                (float) $order->preorder->deposit_amount,
                2
            );

            if ($depositAmount <= 0) {
                throw new RuntimeException(
                    'The pre-order deposit amount is invalid.'
                );
            }

            return min(
                $grandTotal,
                $depositAmount
            );
        }

        if (
            $order->preorder->payment_terms === 'pay_later'
        ) {
            return 0;
        }

        return $grandTotal;
    }

    private function getPaymentType(
        Order $order
    ): string {
        if (!$order->preorder) {
            return 'full';
        }

        return $order->preorder->payment_terms
            ?: 'full';
    }
}