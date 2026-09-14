<?php

namespace App\Services\Payments;

use App\Models\Order;
use App\Models\OrderPreorder;
use App\Models\PaymentSetting;
use App\Models\PaymentTransaction;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use RuntimeException;
use Throwable;

class PayPalPaymentService
{
    public function createCheckout(Order $order): PaymentTransaction
    {
        $setting = $this->getSetting();

        $order->loadMissing([
            'user',
            'preorder',
        ]);

        $paymentType = $this->getPaymentType($order);

        $checkoutAmount = $this->getCheckoutAmount($order);

        if ($checkoutAmount <= 0) {
            throw new RuntimeException(
                'This order does not require an online payment at this time.'
            );
        }

        $transaction = PaymentTransaction::create([
            'order_id' => $order->id,
            'gateway' => 'paypal',
            'status' => 'pending',
            'amount' => $checkoutAmount,
            'currency' => $order->currency,
        ]);

        try {
            $accessToken = $this->getAccessToken($setting);

            $baseUrl = $this->baseUrl($setting);

            $returnUrl = route(
                'payments.paypal.success'
            );

            $cancelUrl = URL::temporarySignedRoute(
                'payments.paypal.cancel',
                now()->addHours(2),
                [
                    'transaction' => $transaction->id,
                ]
            );

            $description = $paymentType === 'deposit'
                ? 'Pre-order deposit for ' . $order->order_no
                : 'Order ' . $order->order_no;

            $response = Http::timeout(30)
                ->withToken($accessToken)
                ->acceptJson()
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Prefer' => 'return=representation',
                    'PayPal-Request-Id' =>
                        'storify-create-' . $transaction->id,
                ])
                ->post(
                    $baseUrl . '/v2/checkout/orders',
                    [
                        'intent' => 'CAPTURE',

                        'purchase_units' => [
                            [
                                'reference_id' =>
                                    (string) $transaction->id,

                                'custom_id' =>
                                    (string) $order->id,

                                'invoice_id' =>
                                    $order->order_no
                                    . '-'
                                    . $transaction->id,

                                'description' =>
                                    $description,

                                'amount' => [
                                    'currency_code' =>
                                        strtoupper(
                                            $order->currency
                                        ),

                                    'value' =>
                                        number_format(
                                            $checkoutAmount,
                                            2,
                                            '.',
                                            ''
                                        ),
                                ],
                            ],
                        ],

                        'application_context' => [
                            'brand_name' =>
                                config(
                                    'app.name',
                                    'Storify'
                                ),

                            'landing_page' =>
                                'LOGIN',

                            'shipping_preference' =>
                                'NO_SHIPPING',

                            'user_action' =>
                                'PAY_NOW',

                            'return_url' =>
                                $returnUrl,

                            'cancel_url' =>
                                $cancelUrl,
                        ],
                    ]
                );

            if (!$response->successful()) {
                Log::error(
                    'PayPal create order failed',
                    [
                        'status' =>
                            $response->status(),

                        'response' =>
                            $response->json(),

                        'raw' =>
                            $response->body(),

                        'order_id' =>
                            $order->id,

                        'transaction_id' =>
                            $transaction->id,
                    ]
                );

                throw new RuntimeException(
                    $this->paypalError(
                        $response->json(),
                        'Unable to create PayPal order.'
                    )
                );
            }

            $paypalOrder = $response->json();

            $paypalOrderId =
                $paypalOrder['id'] ?? null;

            if (!$paypalOrderId) {
                throw new RuntimeException(
                    'PayPal did not return an order ID.'
                );
            }

            $approvalUrl =
                $this->findApprovalUrl(
                    $paypalOrder
                );

            if (!$approvalUrl) {
                throw new RuntimeException(
                    'PayPal approval URL was not returned.'
                );
            }

            $transaction->update([
                'gateway_reference' =>
                    $paypalOrderId,

                'redirect_url' =>
                    $approvalUrl,

                'gateway_response' => [
                    'paypal_order_id' =>
                        $paypalOrderId,

                    'status' =>
                        $paypalOrder['status'] ?? null,

                    'approval_url' =>
                        $approvalUrl,

                    'payment_type' =>
                        $paymentType,

                    'checkout_amount' =>
                        $checkoutAmount,
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

    public function captureCheckout(
        string $paypalOrderId
    ): Order {
        $setting = $this->getSetting();

        $transaction = PaymentTransaction::query()
            ->where(
                'gateway',
                'paypal'
            )
            ->where(
                'gateway_reference',
                $paypalOrderId
            )
            ->first();

        if (!$transaction) {
            throw new RuntimeException(
                'PayPal payment transaction was not found.'
            );
        }

        /*
         * Already completed.
         * Makes callback refresh safe.
         */
        if ($transaction->status === 'paid') {
            $order = Order::query()
                ->with([
                    'user',
                    'items',
                    'shippingAddress',
                    'billingAddress',
                    'paymentTransactions',
                    'preorder',
                ])
                ->find(
                    $transaction->order_id
                );

            if (!$order) {
                throw new RuntimeException(
                    'Order was not found.'
                );
            }

            return $order;
        }

        $order = Order::query()
            ->with('preorder')
            ->find(
                $transaction->order_id
            );

        if (!$order) {
            throw new RuntimeException(
                'Order was not found.'
            );
        }

        $accessToken =
            $this->getAccessToken(
                $setting
            );

        $baseUrl =
            $this->baseUrl(
                $setting
            );

        /*
         * IMPORTANT:
         *
         * PayPal expects an empty JSON OBJECT:
         *
         * {}
         *
         * Sending [] causes:
         *
         * "The request JSON is not well formed."
         */
        $response = Http::timeout(30)
            ->withToken(
                $accessToken
            )
            ->acceptJson()
            ->withHeaders([
                'Prefer' =>
                    'return=representation',

                'PayPal-Request-Id' =>
                    'storify-capture-'
                    . $transaction->id,
            ])
            ->withBody(
                '{}',
                'application/json'
            )
            ->send(
                'POST',
                $baseUrl
                . '/v2/checkout/orders/'
                . urlencode(
                    $paypalOrderId
                )
                . '/capture'
            );

        $paypalOrder =
            $response->json();

        if (!$response->successful()) {
            Log::error(
                'PayPal capture failed',
                [
                    'status' =>
                        $response->status(),

                    'response' =>
                        $paypalOrder,

                    'raw' =>
                        $response->body(),

                    'paypal_order_id' =>
                        $paypalOrderId,

                    'transaction_id' =>
                        $transaction->id,

                    'order_id' =>
                        $order->id,
                ]
            );

            /*
             * PayPal might already have
             * captured the payment.
             */
            $alreadyCaptured =
                collect(
                    $paypalOrder[
                        'details'
                    ] ?? []
                )->contains(
                    function ($detail) {
                        return (
                            $detail['issue']
                            ?? ''
                        ) ===
                            'ORDER_ALREADY_CAPTURED';
                    }
                );

            if (!$alreadyCaptured) {
                throw new RuntimeException(
                    $this->paypalError(
                        $paypalOrder,
                        'Unable to capture PayPal payment.'
                    )
                );
            }

            /*
             * Payment already captured.
             * Retrieve PayPal order and verify.
             */
            $lookup = Http::timeout(30)
                ->withToken(
                    $accessToken
                )
                ->acceptJson()
                ->get(
                    $baseUrl
                    . '/v2/checkout/orders/'
                    . urlencode(
                        $paypalOrderId
                    )
                );

            if (!$lookup->successful()) {
                Log::error(
                    'PayPal captured order lookup failed',
                    [
                        'status' =>
                            $lookup->status(),

                        'response' =>
                            $lookup->json(),

                        'raw' =>
                            $lookup->body(),

                        'paypal_order_id' =>
                            $paypalOrderId,
                    ]
                );

                throw new RuntimeException(
                    'PayPal payment was already captured, but verification failed.'
                );
            }

            $paypalOrder =
                $lookup->json();
        }

        if (
            (
                $paypalOrder['status']
                ?? null
            ) !== 'COMPLETED'
        ) {
            throw new RuntimeException(
                'PayPal payment has not been completed.'
            );
        }

        $purchaseUnit =
            $paypalOrder[
                'purchase_units'
            ][0] ?? [];

        $capture =
            $purchaseUnit[
                'payments'
            ]['captures'][0] ?? null;

        if (!$capture) {
            throw new RuntimeException(
                'PayPal capture information was not returned.'
            );
        }

        $captureId =
            $capture['id'] ?? null;

        if (!$captureId) {
            throw new RuntimeException(
                'PayPal capture ID is missing.'
            );
        }

        /*
         * Verify Storify order reference.
         */
        $customOrderId =
            $purchaseUnit[
                'custom_id'
            ] ?? null;

        if (
            $customOrderId &&
            (string) $customOrderId !==
            (string) $order->id
        ) {
            throw new RuntimeException(
                'PayPal order reference does not match.'
            );
        }

        /*
         * Verify local payment
         * transaction reference.
         */
        $referenceId =
            $purchaseUnit[
                'reference_id'
            ] ?? null;

        if (
            $referenceId &&
            (string) $referenceId !==
            (string) $transaction->id
        ) {
            throw new RuntimeException(
                'PayPal transaction reference does not match.'
            );
        }

        /*
         * Verify amount.
         */
        $paidAmount =
            (float) (
                $capture[
                    'amount'
                ]['value']
                ?? 0
            );

        $expectedAmount =
            round(
                (float)
                    $transaction->amount,
                2
            );

        if (
            abs(
                $paidAmount
                - $expectedAmount
            ) > 0.009
        ) {
            throw new RuntimeException(
                'PayPal payment amount does not match the expected payment amount.'
            );
        }

        /*
         * Verify currency.
         */
        $paidCurrency =
            strtoupper(
                (string) (
                    $capture[
                        'amount'
                    ]['currency_code']
                    ?? ''
                )
            );

        $expectedCurrency =
            strtoupper(
                (string)
                    $transaction->currency
            );

        if (
            $paidCurrency !==
            $expectedCurrency
        ) {
            throw new RuntimeException(
                'PayPal payment currency does not match the transaction currency.'
            );
        }

        /*
         * Save successful payment.
         */
        return DB::transaction(
            function () use (
                $order,
                $transaction,
                $paypalOrder,
                $capture,
                $captureId
            ) {
                $transaction =
                    PaymentTransaction::query()
                        ->lockForUpdate()
                        ->findOrFail(
                            $transaction->id
                        );

                $order =
                    Order::query()
                        ->lockForUpdate()
                        ->findOrFail(
                            $order->id
                        );

                /*
                 * Idempotency protection.
                 */
                if (
                    $transaction->status
                    === 'paid'
                ) {
                    return $order->fresh([
                        'user',
                        'items',
                        'shippingAddress',
                        'billingAddress',
                        'paymentTransactions',
                        'preorder',
                    ]);
                }

                $preorder =
                    OrderPreorder::query()
                        ->where(
                            'order_id',
                            $order->id
                        )
                        ->lockForUpdate()
                        ->first();

                $transaction->update([
                    'status' =>
                        'paid',

                    'gateway_transaction_id' =>
                        $captureId,

                    'failure_reason' =>
                        null,

                    'paid_at' =>
                        $transaction->paid_at
                            ?: now(),

                    'failed_at' =>
                        null,

                    'cancelled_at' =>
                        null,

                    'gateway_response' => [
                        'paypal_order_id' =>
                            $paypalOrder[
                                'id'
                            ] ?? null,

                        'order_status' =>
                            $paypalOrder[
                                'status'
                            ] ?? null,

                        'capture_id' =>
                            $captureId,

                        'capture_status' =>
                            $capture[
                                'status'
                            ] ?? null,

                        'amount' =>
                            $capture[
                                'amount'
                            ] ?? null,

                        'payer' =>
                            $paypalOrder[
                                'payer'
                            ] ?? null,
                    ],
                ]);

                /*
                 * Calculate total successfully
                 * paid amount for this order.
                 */
                $totalPaid =
                    (float)
                        PaymentTransaction::query()
                            ->where(
                                'order_id',
                                $order->id
                            )
                            ->where(
                                'status',
                                'paid'
                            )
                            ->sum(
                                'amount'
                            );

                $grandTotal =
                    (float)
                        $order->grand_total;

                $remainingBalance =
                    max(
                        0,
                        round(
                            $grandTotal
                            - $totalPaid,
                            2
                        )
                    );

                $fullyPaid =
                    $remainingBalance
                    <= 0.009;

                /*
                 * Update pre-order balance
                 * if this is a pre-order.
                 */
                if ($preorder) {
                    $preorderData = [
                        'balance_due' =>
                            $remainingBalance,
                    ];

                    if (
                        !$fullyPaid &&
                        $preorder->payment_terms
                            === 'deposit' &&
                        $preorder->status
                            !== 'cancelled'
                    ) {
                        $preorderData[
                            'status'
                        ] = 'payment_due';
                    }

                    if (
                        $fullyPaid &&
                        $preorder->status
                            === 'payment_due'
                    ) {
                        $preorderData[
                            'status'
                        ] = 'reserved';
                    }

                    $preorder->update(
                        $preorderData
                    );
                }

                /*
                 * Update order payment state.
                 */
                $orderData = [];

                if ($fullyPaid) {
                    $orderData[
                        'payment_status'
                    ] = 'paid';

                    $orderData[
                        'paid_at'
                    ] =
                        $order->paid_at
                            ?: now();

                    if (
                        $order->status
                        === 'pending'
                    ) {
                        $orderData[
                            'status'
                        ] = 'processing';
                    }
                } else {
                    $orderData[
                        'payment_status'
                    ] = 'pending';
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
            }
        );
    }

    public function cancelTransaction(
        int $transactionId
    ): ?Order {
        return DB::transaction(
            function () use (
                $transactionId
            ) {
                $transaction =
                    PaymentTransaction::query()
                        ->where(
                            'gateway',
                            'paypal'
                        )
                        ->where(
                            'id',
                            $transactionId
                        )
                        ->lockForUpdate()
                        ->first();

                if (!$transaction) {
                    return null;
                }

                $order =
                    Order::query()
                        ->lockForUpdate()
                        ->find(
                            $transaction->order_id
                        );

                if (!$order) {
                    return null;
                }

                if (
                    $transaction->status
                    === 'pending'
                ) {
                    $transaction->update([
                        'status' =>
                            'cancelled',

                        'cancelled_at' =>
                            now(),

                        'failure_reason' =>
                            'Customer cancelled the PayPal checkout.',
                    ]);
                }

                return $order;
            }
        );
    }

    private function getSetting(): PaymentSetting
    {
        $setting =
            PaymentSetting::query()
                ->where(
                    'gateway',
                    'paypal'
                )
                ->first();

        if (!$setting) {
            throw new RuntimeException(
                'PayPal payment settings were not found.'
            );
        }

        if (!$setting->is_enabled) {
            throw new RuntimeException(
                'PayPal payment is currently disabled.'
            );
        }

        $config =
            $setting->config ?? [];

        if (
            empty(
                $config[
                    'client_id'
                ]
            )
        ) {
            throw new RuntimeException(
                'PayPal Client ID is not configured.'
            );
        }

        if (
            empty(
                $config[
                    'client_secret'
                ]
            )
        ) {
            throw new RuntimeException(
                'PayPal Client Secret is not configured.'
            );
        }

        return $setting;
    }

    private function getAccessToken(
        PaymentSetting $setting
    ): string {
        $config =
            $setting->config ?? [];

        $clientId =
            $config[
                'client_id'
            ];

        $clientSecret =
            $config[
                'client_secret'
            ];

        $response =
            Http::timeout(30)
                ->withBasicAuth(
                    $clientId,
                    $clientSecret
                )
                ->asForm()
                ->acceptJson()
                ->post(
                    $this->baseUrl(
                        $setting
                    )
                    . '/v1/oauth2/token',
                    [
                        'grant_type' =>
                            'client_credentials',
                    ]
                );

        if (!$response->successful()) {
            Log::error(
                'PayPal authentication failed',
                [
                    'status' =>
                        $response->status(),

                    'response' =>
                        $response->json(),

                    'raw' =>
                        $response->body(),
                ]
            );

            throw new RuntimeException(
                $this->paypalError(
                    $response->json(),
                    'Unable to authenticate with PayPal.'
                )
            );
        }

        $accessToken =
            $response->json(
                'access_token'
            );

        if (!$accessToken) {
            throw new RuntimeException(
                'PayPal access token was not returned.'
            );
        }

        return $accessToken;
    }

    private function baseUrl(
        PaymentSetting $setting
    ): string {
        return $setting->mode === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';
    }

    private function findApprovalUrl(
        array $paypalOrder
    ): ?string {
        foreach (
            $paypalOrder['links'] ?? []
            as $link
        ) {
            $relation =
                $link['rel'] ?? '';

            if (
                in_array(
                    $relation,
                    [
                        'payer-action',
                        'approve',
                    ],
                    true
                )
            ) {
                return $link[
                    'href'
                ] ?? null;
            }
        }

        return null;
    }

    private function paypalError(
        array $payload,
        string $fallback
    ): string {
        $message =
            $payload[
                'message'
            ] ?? null;

        $detail =
            $payload[
                'details'
            ][0][
                'description'
            ] ?? null;

        return $detail
            ?: $message
            ?: $fallback;
    }

    private function getCheckoutAmount(
        Order $order
    ): float {
        $grandTotal =
            round(
                (float)
                    $order->grand_total,
                2
            );

        if (!$order->preorder) {
            return $grandTotal;
        }

        if (
            $order->preorder
                ->payment_terms
            === 'deposit'
        ) {
            $depositAmount =
                round(
                    (float)
                        $order->preorder
                            ->deposit_amount,
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
            $order->preorder
                ->payment_terms
            === 'pay_later'
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

        return $order->preorder
            ->payment_terms
            ?: 'full';
    }
}