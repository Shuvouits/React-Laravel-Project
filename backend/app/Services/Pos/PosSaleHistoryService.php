<?php

namespace App\Services\Pos;

use App\Models\PosSale;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PosSaleHistoryService
{
    public function list(
        array $context,
        array $filters = []
    ): LengthAwarePaginator {
        $query = PosSale::query()
            ->leftJoin(
                'orders',
                'orders.id',
                '=',
                'pos_sales.order_id'
            )
            ->leftJoin(
                'users as customers',
                'customers.id',
                '=',
                'pos_sales.customer_id'
            )
            ->leftJoin(
                'users as cashiers',
                'cashiers.id',
                '=',
                'pos_sales.cashier_id'
            )
            ->where(
                'pos_sales.location_id',
                $context['location_id']
            )
            ->select([
                'pos_sales.*',
                'orders.order_no',
                'customers.name as customer_name',
                'cashiers.name as cashier_name',
            ]);

        $this->applyOwnerScope(
            $query,
            $context
        );

        $this->applyFilters(
            $query,
            $filters
        );

        $sortDirection = ($filters['sort'] ?? 'desc') === 'asc'
            ? 'asc'
            : 'desc';

        return $query
            ->orderBy(
                'pos_sales.completed_at',
                $sortDirection
            )
            ->orderBy(
                'pos_sales.id',
                $sortDirection
            )
            ->paginate(
                min(
                    max(
                        (int) ($filters['per_page'] ?? 20),
                        1
                    ),
                    100
                )
            );
    }

    public function details(
        array $context,
        int $saleId
    ): array {
        $sale = $this->findSale(
            $context,
            $saleId
        );

        $order = DB::table('orders')
            ->where('id', $sale->order_id)
            ->first();

      $items = DB::table('order_items')
    ->where('order_id', $sale->order_id)
    ->orderBy('id')
    ->get()
    ->map(function ($item) {
        return [
            'id' => $item->id,
            'product_id' => $item->product_id,
            'variant_id' => $item->variant_id,
            'store_id' => $item->store_id,
            'store_name' => $item->store_name,
            'product_title' => $item->product_name,
            'variant_title' => $item->variant_name,
            'sku' => $item->sku,
            'quantity' => (int) $item->quantity,
            'unit_price' => (float) $item->unit_price,
            'compare_at_price' => (float) (
                $item->compare_at_price ?? 0
            ),
            'line_total' => (float) $item->line_total,
        ];
    })
    ->values()
    ->all();

        $payments = DB::table('pos_payments')
            ->where('pos_sale_id', $sale->id)
            ->orderBy('id')
            ->get()
            ->map(function ($payment) {
                return [
                    'id' => $payment->id,
                    'method' => $payment->payment_method,
                    'status' => $payment->status,
                    'amount' => (float) $payment->amount,
                    'currency' => $payment->currency,
                    'reference' => $payment->reference,
                    'last_four' => $payment->card_last_four,
                    'metadata' => $this->decodeJson(
                        $payment->metadata
                    ),
                    'paid_at' => $payment->paid_at,
                    'refunded_at' => $payment->refunded_at,
                    'created_at' => $payment->created_at,
                ];
            })
            ->values()
            ->all();

        $refunds = DB::table('pos_refunds')
            ->where('pos_sale_id', $sale->id)
            ->orderByDesc('id')
            ->get()
            ->map(function ($refund) {
                return [
                    'id' => $refund->id,
                    'refund_number' => $refund->refund_number,
                    'status' => $refund->status,
                    'reason' => $refund->reason,
                    'subtotal' => (float) $refund->subtotal,
                    'tax_total' => (float) $refund->tax_total,
                    'total' => (float) $refund->total,
                    'currency' => $refund->currency,
                    'payment_method' => $refund->payment_method,
                    'restock_items' => (bool) $refund->restock_items,
                    'completed_at' => $refund->completed_at,
                ];
            })
            ->values()
            ->all();

        $location = DB::table('inventory_locations')
            ->where('id', $sale->location_id)
            ->first();

        $cashier = DB::table('users')
            ->where('id', $sale->cashier_id)
            ->first([
                'id',
                'name',
                'email',
            ]);

        $customer = null;

        if ($sale->customer_id) {
            $customer = DB::table('users')
                ->where('id', $sale->customer_id)
                ->first([
                    'id',
                    'name',
                    'email',
                    'phone',
                ]);
        }

        return [
            'id' => $sale->id,
            'sale_number' => $sale->sale_number,
            'status' => $sale->status,
            'currency' => $sale->currency,
            'payment_status' => $sale->payment_status,
            'payment_method' => $sale->primary_payment_method,

            'order' => $this->formatOrder($order),

            'location' => $this->formatLocation($location),

            'cashier' => $cashier
                ? [
                    'id' => $cashier->id,
                    'name' => $cashier->name,
                    'email' => $cashier->email,
                ]
                : null,

            'customer' => $customer
                ? [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'email' => $customer->email,
                    'phone' => $customer->phone,
                ]
                : null,

            'items' => $items,
            'payments' => $payments,
            'refunds' => $refunds,

            'totals' => [
                'subtotal' => (float) $sale->subtotal,
                'discount_type' => $sale->discount_type,
                'discount_value' => (float) $sale->discount_value,
                'discount_total' => (float) $sale->discount_total,
                'tax_rate' => (float) $sale->tax_rate,
                'tax_total' => (float) $sale->tax_total,
                'grand_total' => (float) $sale->grand_total,
                'amount_paid' => (float) $sale->amount_paid,
                'change_amount' => (float) $sale->change_amount,
                'refunded_total' => (float) $sale->refunded_total,
                'refundable_total' => max(
                    0,
                    round(
                        (float) $sale->grand_total
                        - (float) $sale->refunded_total,
                        2
                    )
                ),
            ],

            'discount' => $this->decodeJson(
                $sale->discount_data
            ),

            'cart_snapshot' => $this->decodeJson(
                $sale->cart_snapshot
            ),

            'customer_note' => $sale->customer_note,
            'internal_note' => $sale->internal_note,

            'completed_at' => $sale->completed_at,
            'refunded_at' => $sale->refunded_at,
            'cancelled_at' => $sale->cancelled_at,
            'created_at' => $sale->created_at,
            'updated_at' => $sale->updated_at,
        ];
    }

    public function receipt(
        array $context,
        int $saleId
    ): array {
        $details = $this->details(
            $context,
            $saleId
        );

        return [
            'receipt_number' => $details['sale_number'],
            'order_number' => $details['order']['order_no'] ?? null,
            'date' => $details['completed_at'],
            'currency' => $details['currency'],
            'status' => $details['status'],

            'store' => [
                'name' => $context['vendor']['store_name']
                    ?? 'Storify',
                'location' => $details['location']['name']
                    ?? null,
                'address' => $details['location']['address']
                    ?? null,
                'phone' => $details['location']['phone']
                    ?? null,
                'email' => $details['location']['email']
                    ?? null,
            ],

            'cashier' => $details['cashier'],
            'customer' => $details['customer'],

            'items' => $details['items'],
            'payments' => $details['payments'],
            'totals' => $details['totals'],
            'discount' => $details['discount'],

            'customer_note' => $details['customer_note'],

            'footer' => [
                'title' => 'Thank you for your purchase!',
                'message' => 'Please keep this receipt for your records.',
            ],
        ];
    }

    private function applyFilters(
        Builder $query,
        array $filters
    ): void {
        if (!empty($filters['search'])) {
            $search = trim($filters['search']);

            $query->where(function (Builder $subQuery) use ($search) {
                $subQuery
                    ->where(
                        'pos_sales.sale_number',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'orders.order_no',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'customers.name',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'customers.email',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        if (!empty($filters['status'])) {
            $query->where(
                'pos_sales.status',
                $filters['status']
            );
        }

        if (!empty($filters['payment_status'])) {
            $query->where(
                'pos_sales.payment_status',
                $filters['payment_status']
            );
        }

        if (!empty($filters['payment_method'])) {
            $query->where(
                'pos_sales.primary_payment_method',
                $filters['payment_method']
            );
        }

        if (!empty($filters['cashier_id'])) {
            $query->where(
                'pos_sales.cashier_id',
                (int) $filters['cashier_id']
            );
        }

        if (!empty($filters['customer_id'])) {
            $query->where(
                'pos_sales.customer_id',
                (int) $filters['customer_id']
            );
        }

        if (!empty($filters['date_from'])) {
            $query->whereDate(
                'pos_sales.completed_at',
                '>=',
                $filters['date_from']
            );
        }

        if (!empty($filters['date_to'])) {
            $query->whereDate(
                'pos_sales.completed_at',
                '<=',
                $filters['date_to']
            );
        }
    }

    private function findSale(
        array $context,
        int $saleId
    ): PosSale {
        $query = PosSale::query()
            ->whereKey($saleId)
            ->where(
                'location_id',
                $context['location_id']
            );

        if (($context['role'] ?? null) === 'vendor') {
            $query->where(
                'vendor_id',
                $context['vendor_id']
            );
        } else {
            $query->whereNull('vendor_id');
        }

        $sale = $query->first();

        if (!$sale) {
            throw ValidationException::withMessages([
                'sale_id' => [
                    'POS sale পাওয়া যায়নি অথবা এটি দেখার অনুমতি নেই।',
                ],
            ]);
        }

        return $sale;
    }

    private function applyOwnerScope(
        Builder $query,
        array $context
    ): void {
        if (($context['role'] ?? null) === 'vendor') {
            $query->where(
                'pos_sales.vendor_id',
                $context['vendor_id']
            );

            return;
        }

        $query->whereNull(
            'pos_sales.vendor_id'
        );
    }

    private function formatOrder(
        ?object $order
    ): ?array {
        if (!$order) {
            return null;
        }

        return [
            'id' => $order->id,
            'order_no' => $order->order_no,
            'status' => $order->status,
            'payment_status' => $order->payment_status,
            'payment_method' => $order->payment_method,
            'fulfillment_status' => $order->fulfillment_status,
            'delivery_status' => $order->delivery_status,
            'channel' => $order->channel,
            'placed_at' => $order->placed_at,
            'paid_at' => $order->paid_at,
            'fulfilled_at' => $order->fulfilled_at,
        ];
    }

    private function formatLocation(
        ?object $location
    ): ?array {
        if (!$location) {
            return null;
        }

        return [
            'id' => $location->id,
            'name' => $location->name,
            'code' => $location->code,
            'phone' => $location->phone,
            'email' => $location->email,
            'address' => $this->formatLocationAddress(
                $location
            ),
        ];
    }

    private function decodeJson(
        mixed $value
    ): mixed {
        if ($value === null || is_array($value)) {
            return $value;
        }

        $decoded = json_decode(
            $value,
            true
        );

        return json_last_error() === JSON_ERROR_NONE
            ? $decoded
            : null;
    }

    private function formatLocationAddress(
        object $location
    ): ?string {
        $addressParts = array_filter([
            $location->address_line1 ?? null,
            $location->address_line2 ?? null,
            $location->city ?? null,
            $location->state ?? null,
            $location->postal_code ?? null,
            $location->country ?? null,
        ]);

        return count($addressParts)
            ? implode(', ', $addressParts)
            : null;
    }
}
