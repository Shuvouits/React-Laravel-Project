<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminPaymentTransactionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'status' => [
                'nullable',
                Rule::in([
                    'all',
                    'succeeded',
                    'pending',
                    'failed',
                    'cancelled',
                ]),
            ],

            'type' => [
                'nullable',
                Rule::in([
                    'all',
                    'charge',
                    'refund',
                ]),
            ],

            'provider' => [
                'nullable',
                'string',
                'max:50',
            ],

            'search' => [
                'nullable',
                'string',
                'max:255',
            ],

            'date_from' => [
                'nullable',
                'date',
            ],

            'date_to' => [
                'nullable',
                'date',
                'after_or_equal:date_from',
            ],

            'sort' => [
                'nullable',
                Rule::in([
                    'newest',
                    'oldest',
                    'amount_high',
                    'amount_low',
                ]),
            ],

            'per_page' => [
                'nullable',
                'integer',
                'min:1',
                'max:100',
            ],
        ]);

        $query = PaymentTransaction::query()
            ->with([
                'order:id,order_no,status,payment_status,grand_total,currency,created_at',
            ]);

        $this->applyStatusFilter(
            $query,
            $request->input('status', 'all')
        );

        $this->applyTypeFilter(
            $query,
            $request->input('type', 'all')
        );

        if (
            $request->filled('provider')
            && $request->provider !== 'all'
        ) {
            $query->where(
                'gateway',
                $request->provider
            );
        }

        if ($request->filled('search')) {
            $search = trim(
                $request->search
            );

            $query->where(function ($builder) use ($search) {
                $builder
                    ->where(
                        'gateway_reference',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'gateway_transaction_id',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'gateway',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereHas(
                        'order',
                        function ($orderQuery) use ($search) {
                            $orderQuery->where(
                                'order_no',
                                'like',
                                "%{$search}%"
                            );
                        }
                    );
            });
        }

        if ($request->filled('date_from')) {
            $query->whereDate(
                'created_at',
                '>=',
                $request->date_from
            );
        }

        if ($request->filled('date_to')) {
            $query->whereDate(
                'created_at',
                '<=',
                $request->date_to
            );
        }

        $this->applySorting(
            $query,
            $request->input('sort', 'newest')
        );

        $transactions = $query->paginate(
            $request->integer(
                'per_page',
                20
            )
        );

        $transactions
            ->getCollection()
            ->transform(function ($transaction) {
                return $this->formatTransaction(
                    $transaction
                );
            });

        return response()->json([
            'success' => true,

            'message' =>
                'Payment transactions fetched successfully.',

            'stats' => $this->transactionStats(),

            'providers' => $this->providers(),

            'data' => $transactions,
        ]);
    }

    public function show(
        PaymentTransaction $paymentTransaction
    ): JsonResponse {
        $paymentTransaction->load([
            'order:id,order_no,user_id,status,payment_status,payment_method,grand_total,currency,paid_at,created_at',

            'order.user:id,name,email',
        ]);

        $data = $this->formatTransaction(
            $paymentTransaction
        );

        $data['redirect_url'] =
            $paymentTransaction->redirect_url;

        $data['failure_reason'] =
            $paymentTransaction->failure_reason;

        $data['paid_at'] =
            $paymentTransaction->paid_at;

        $data['failed_at'] =
            $paymentTransaction->failed_at;

        $data['cancelled_at'] =
            $paymentTransaction->cancelled_at;

        $data['gateway_response'] =
            $this->parseGatewayResponse(
                $paymentTransaction->gateway_response
            );

        return response()->json([
            'success' => true,

            'message' =>
                'Payment transaction details fetched successfully.',

            'data' => $data,
        ]);
    }

    private function formatTransaction(
        PaymentTransaction $transaction
    ): array {
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

            'order' =>
                $transaction->relationLoaded('order')
                    ? $transaction->order
                    : null,

            'type' => $type,

            'status' =>
                $this->normalizedStatus(
                    $transaction->status
                ),

            'original_status' =>
                $transaction->status,

            'provider' =>
                $this->gatewayName(
                    $transaction->gateway
                ),

            'gateway' =>
                $transaction->gateway,

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

            'created_at' =>
                $transaction->created_at,

            'updated_at' =>
                $transaction->updated_at,
        ];
    }

    private function applyStatusFilter(
        $query,
        string $status
    ): void {
        switch ($status) {
            case 'succeeded':
                $query->whereIn('status', [
                    'paid',
                    'succeeded',
                    'refunded',
                    'partially_refunded',
                ]);

                break;

            case 'pending':
                $query->whereIn('status', [
                    'pending',
                    'processing',
                ]);

                break;

            case 'failed':
                $query->where(
                    'status',
                    'failed'
                );

                break;

            case 'cancelled':
                $query->whereIn('status', [
                    'cancelled',
                    'canceled',
                ]);

                break;
        }
    }

    private function applyTypeFilter(
        $query,
        string $type
    ): void {
        if ($type === 'refund') {
            $query->where(function ($builder) {
                $builder
                    ->whereIn('status', [
                        'refunded',
                        'partially_refunded',
                    ])
                    ->orWhere(
                        'gateway_reference',
                        'like',
                        'REFUND%'
                    )
                    ->orWhere(
                        'gateway_reference',
                        'like',
                        're\_%'
                    );
            });

            return;
        }

        if ($type === 'charge') {
            $query->whereNotIn('status', [
                'refunded',
                'partially_refunded',
            ]);

            $query->where(function ($builder) {
                $builder
                    ->whereNull(
                        'gateway_reference'
                    )
                    ->orWhere(function ($referenceQuery) {
                        $referenceQuery
                            ->where(
                                'gateway_reference',
                                'not like',
                                'REFUND%'
                            )
                            ->where(
                                'gateway_reference',
                                'not like',
                                're\_%'
                            );
                    });
            });
        }
    }

    private function applySorting(
        $query,
        string $sort
    ): void {
        switch ($sort) {
            case 'oldest':
                $query
                    ->orderBy('created_at')
                    ->orderBy('id');

                break;

            case 'amount_high':
                $query
                    ->orderByDesc('amount')
                    ->orderByDesc('created_at');

                break;

            case 'amount_low':
                $query
                    ->orderBy('amount')
                    ->orderByDesc('created_at');

                break;

            default:
                $query
                    ->orderByDesc('created_at')
                    ->orderByDesc('id');

                break;
        }
    }

    private function transactionStats(): array
    {
        $succeededStatuses = [
            'paid',
            'succeeded',
            'refunded',
            'partially_refunded',
        ];

        return [
            'all' =>
                PaymentTransaction::count(),

            'succeeded' =>
                PaymentTransaction::whereIn(
                    'status',
                    $succeededStatuses
                )->count(),

            'pending' =>
                PaymentTransaction::whereIn(
                    'status',
                    [
                        'pending',
                        'processing',
                    ]
                )->count(),

            'failed' =>
                PaymentTransaction::where(
                    'status',
                    'failed'
                )->count(),

            'cancelled' =>
                PaymentTransaction::whereIn(
                    'status',
                    [
                        'cancelled',
                        'canceled',
                    ]
                )->count(),
        ];
    }

    private function providers(): array
    {
        return PaymentTransaction::query()
            ->whereNotNull('gateway')
            ->distinct()
            ->orderBy('gateway')
            ->pluck('gateway')
            ->map(function ($gateway) {
                return [
                    'value' => $gateway,

                    'label' =>
                        $this->gatewayName(
                            $gateway
                        ),
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

    private function normalizedStatus(
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

    private function parseGatewayResponse(
        mixed $response
    ): mixed {
        if (!$response) {
            return null;
        }

        if (is_array($response)) {
            return $response;
        }

        $decoded = json_decode(
            $response,
            true
        );

        if (
            json_last_error()
            === JSON_ERROR_NONE
        ) {
            return $decoded;
        }

        return $response;
    }

    private function money(
        float|int|string|null $amount
    ): float {
        return round(
            (float) $amount,
            2
        );
    }
}