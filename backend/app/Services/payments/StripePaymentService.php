<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\PaymentSetting;
use App\Models\PaymentTransaction;
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

        $transaction = PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => 'stripe',
            'status' => 'pending',
            'amount' => $order->grand_total,
            'currency' => $order->currency,
        ]);

        try {
            $stripe = new StripeClient(
                $secretKey
            );

            $frontendUrl = rtrim(
                config(
                    'app.frontend_url',
                    'http://localhost:5173'
                ),
                '/'
            );

            $amount = (int) round(
                ((float) $order->grand_total) * 100
            );

            $session = $stripe
                ->checkout
                ->sessions
                ->create([
                    'mode' => 'payment',

                    'payment_method_types' => [
                        'card',
                    ],

                    'client_reference_id' =>
                        (string) $order->id,

                    'customer_email' =>
                        $order->user?->email,

                    'line_items' => [
                        [
                            'quantity' => 1,

                            'price_data' => [
                                'currency' =>
                                    strtolower(
                                        $order->currency
                                    ),

                                'unit_amount' =>
                                    $amount,

                                'product_data' => [
                                    'name' =>
                                        'Order '
                                        . $order->order_no,
                                ],
                            ],
                        ],
                    ],

                    'metadata' => [
                        'order_id' =>
                            (string) $order->id,

                        'order_no' =>
                            $order->order_no,

                        'payment_transaction_id' =>
                            (string) $transaction->id,
                    ],

                    'success_url' =>
                        $frontendUrl
                        . '/payment/success'
                        . '?provider=stripe'
                        . '&session_id={CHECKOUT_SESSION_ID}'
                        . '&order='
                        . $order->id,

                    'cancel_url' =>
                        $frontendUrl
                        . '/payment/cancelled'
                        . '?provider=stripe'
                        . '&order='
                        . $order->id,
                ]);

            $transaction->update([
                'gateway_reference' =>
                    $session->id,

                'redirect_url' =>
                    $session->url,

                'gateway_response' => [
                    'session_id' =>
                        $session->id,

                    'url' =>
                        $session->url,

                    'status' =>
                        $session->status,
                ],
            ]);

            return $transaction;
        } catch (Throwable $error) {
            $transaction->update([
                'status' => 'failed',

                'failure_reason' =>
                    $error->getMessage(),

                'failed_at' => now(),
            ]);

            throw $error;
        }
    }
}
