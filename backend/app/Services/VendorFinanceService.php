<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Vendor;
use App\Models\VendorFinanceEntry;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class VendorFinanceService
{
    public function recordPaidOrder(Order $order): void
    {
        DB::transaction(function () use ($order) {
            $order = Order::query()
                ->with([
                    'items.product',
                ])
                ->lockForUpdate()
                ->findOrFail($order->id);

            if ($order->payment_status !== 'paid') {
                return;
            }

            $vendorGroups = $this->vendorGroups($order);

            if ($vendorGroups->isEmpty()) {
                return;
            }

            $orderItemSubtotal = $vendorGroups->sum(
                'gross_amount'
            );

            foreach ($vendorGroups as $vendorUserId => $group) {
                $vendor = $this->findVendor(
                    (int) $vendorUserId
                );

                if (!$vendor) {
                    continue;
                }

                $grossAmount = round(
                    (float) $group['gross_amount'],
                    2
                );

                $discountShare = $this->proportionalAmount(
                    $grossAmount,
                    $orderItemSubtotal,
                    (float) $order->discount_total
                );

                $vendorSaleAmount = max(
                    0,
                    round(
                        $grossAmount - $discountShare,
                        2
                    )
                );

                $commissionRate = (float) (
                    $vendor->commission_rate ?? 0
                );

                $commissionAmount = round(
                    $vendorSaleAmount *
                    ($commissionRate / 100),
                    2
                );

                $netVendorAmount = round(
                    $vendorSaleAmount - $commissionAmount,
                    2
                );

                if ($this->marketplaceCollected($order)) {
                    $this->createEntry([
                        'vendor_id' => $vendor->id,
                        'order_id' => $order->id,
                        'type' => 'sale',
                        'event_key' =>
                            "order:{$order->id}:vendor:{$vendor->id}:sale",
                        'reference' => $order->order_no,
                        'held_amount' => $netVendorAmount,
                        'owed_amount' => 0,
                        'currency' => $order->currency ?? 'USD',
                        'description' =>
                            'Marketplace-collected sale after commission.',
                        'metadata' => [
                            'gross_amount' => $grossAmount,
                            'discount_share' => $discountShare,
                            'sale_amount' => $vendorSaleAmount,
                            'commission_rate' => $commissionRate,
                            'commission_amount' => $commissionAmount,
                            'net_vendor_amount' => $netVendorAmount,
                            'collection_type' => 'marketplace',
                        ],
                        'occurred_at' =>
                            $order->paid_at ?? now(),
                    ]);

                    continue;
                }

                $this->createEntry([
                    'vendor_id' => $vendor->id,
                    'order_id' => $order->id,
                    'type' => 'commission',
                    'event_key' =>
                        "order:{$order->id}:vendor:{$vendor->id}:commission",
                    'reference' => $order->order_no,
                    'held_amount' => 0,
                    'owed_amount' => $commissionAmount,
                    'currency' => $order->currency ?? 'USD',
                    'description' =>
                        'Commission owed on vendor-collected order.',
                    'metadata' => [
                        'gross_amount' => $grossAmount,
                        'discount_share' => $discountShare,
                        'sale_amount' => $vendorSaleAmount,
                        'commission_rate' => $commissionRate,
                        'commission_amount' => $commissionAmount,
                        'collection_type' => 'vendor',
                    ],
                    'occurred_at' =>
                        $order->paid_at ?? now(),
                ]);
            }
        });
    }

    public function recordRefund(
        Order $order,
        float $refundAmount,
        string $refundReference
    ): void {
        DB::transaction(function () use (
            $order,
            $refundAmount,
            $refundReference
        ) {
            $order = Order::query()
                ->with([
                    'items.product',
                ])
                ->lockForUpdate()
                ->findOrFail($order->id);

            $vendorGroups = $this->vendorGroups($order);

            if ($vendorGroups->isEmpty()) {
                return;
            }

            $orderItemSubtotal = $vendorGroups->sum(
                'gross_amount'
            );

            if ($orderItemSubtotal <= 0) {
                return;
            }

            $remainingRefundAmount = round(
                $refundAmount,
                2
            );

            $groupCount = $vendorGroups->count();
            $currentGroup = 0;

            foreach ($vendorGroups as $vendorUserId => $group) {
                $currentGroup++;

                $vendor = $this->findVendor(
                    (int) $vendorUserId
                );

                if (!$vendor) {
                    continue;
                }

                $grossAmount = round(
                    (float) $group['gross_amount'],
                    2
                );

                if ($currentGroup === $groupCount) {
                    $vendorRefundAmount =
                        $remainingRefundAmount;
                } else {
                    $vendorRefundAmount =
                        $this->proportionalAmount(
                            $grossAmount,
                            $orderItemSubtotal,
                            $refundAmount
                        );

                    $remainingRefundAmount = round(
                        $remainingRefundAmount -
                        $vendorRefundAmount,
                        2
                    );
                }

                $vendorRefundAmount = min(
                    $vendorRefundAmount,
                    $grossAmount
                );

                $commissionRate = (float) (
                    $vendor->commission_rate ?? 0
                );

                $commissionRefund = round(
                    $vendorRefundAmount *
                    ($commissionRate / 100),
                    2
                );

                $netRefundAmount = round(
                    $vendorRefundAmount -
                    $commissionRefund,
                    2
                );

                $cleanReference = preg_replace(
                    '/[^A-Za-z0-9_-]/',
                    '',
                    $refundReference
                );

                if ($this->marketplaceCollected($order)) {
                    $this->createEntry([
                        'vendor_id' => $vendor->id,
                        'order_id' => $order->id,
                        'type' => 'refund',
                        'event_key' =>
                            "refund:{$cleanReference}:vendor:{$vendor->id}",
                        'reference' => $order->order_no,
                        'held_amount' => -$netRefundAmount,
                        'owed_amount' => 0,
                        'currency' => $order->currency ?? 'USD',
                        'description' =>
                            'Refund deducted from vendor-held balance.',
                        'metadata' => [
                            'refund_reference' =>
                                $refundReference,
                            'refund_amount' =>
                                $vendorRefundAmount,
                            'commission_rate' =>
                                $commissionRate,
                            'commission_refund' =>
                                $commissionRefund,
                            'net_refund_amount' =>
                                $netRefundAmount,
                            'collection_type' =>
                                'marketplace',
                        ],
                        'occurred_at' => now(),
                    ]);

                    continue;
                }

                $this->createEntry([
                    'vendor_id' => $vendor->id,
                    'order_id' => $order->id,
                    'type' => 'commission_refund',
                    'event_key' =>
                        "commission-refund:{$cleanReference}:vendor:{$vendor->id}",
                    'reference' => $order->order_no,
                    'held_amount' => 0,
                    'owed_amount' => -$commissionRefund,
                    'currency' => $order->currency ?? 'USD',
                    'description' =>
                        'Commission reversed after vendor-collected refund.',
                    'metadata' => [
                        'refund_reference' =>
                            $refundReference,
                        'refund_amount' =>
                            $vendorRefundAmount,
                        'commission_rate' =>
                            $commissionRate,
                        'commission_refund' =>
                            $commissionRefund,
                        'collection_type' =>
                            'vendor',
                    ],
                    'occurred_at' => now(),
                ]);
            }
        });
    }

    private function vendorGroups(
        Order $order
    ): Collection {
        return $order->items
            ->filter(function ($item) {
                return $item->product &&
                    $item->product->source === 'vendor' &&
                    $item->product->created_by;
            })
            ->groupBy(function ($item) {
                return (int) $item->product->created_by;
            })
            ->map(function (Collection $items) {
                return [
                    'gross_amount' => round(
                        (float) $items->sum('line_total'),
                        2
                    ),
                    'items' => $items->pluck('id')->values(),
                ];
            });
    }

    private function findVendor(
        int $vendorUserId
    ): ?Vendor {
        return Vendor::query()
            ->where('user_id', $vendorUserId)
            ->where('status', 'approved')
            ->first();
    }

    private function marketplaceCollected(
        Order $order
    ): bool {
        return in_array(
            strtolower(
                (string) $order->payment_method
            ),
            [
                'stripe',
                'paypal',
                'sslcommerz',
            ],
            true
        );
    }

    private function proportionalAmount(
        float $vendorAmount,
        float $totalAmount,
        float $amountToAllocate
    ): float {
        if (
            $totalAmount <= 0 ||
            $amountToAllocate <= 0
        ) {
            return 0;
        }

        return round(
            ($vendorAmount / $totalAmount) *
            $amountToAllocate,
            2
        );
    }

    private function createEntry(
        array $data
    ): VendorFinanceEntry {
        return VendorFinanceEntry::query()
            ->firstOrCreate(
                [
                    'event_key' =>
                        $data['event_key'],
                ],
                $data
            );
    }
}