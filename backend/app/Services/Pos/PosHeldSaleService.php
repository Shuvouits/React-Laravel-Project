<?php

namespace App\Services\Pos;

use App\Models\PosHeldSale;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class PosHeldSaleService
{
    public function list(
        array $context,
        array $filters = []
    ): LengthAwarePaginator {
        $query = PosHeldSale::query()
            ->with([
                'customer:id,name,email,phone',
                'cashier:id,name,email',
                'location:id,name,code',
            ])
            ->where(
                'location_id',
                $context['location_id']
            )
            ->where('status', 'held');

        $this->applyOwnerScope(
            $query,
            $context
        );

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);

            $query->where(function ($subQuery) use ($search) {
                $subQuery
                    ->where(
                        'reference',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhere(
                        'note',
                        'like',
                        "%{$search}%"
                    )
                    ->orWhereHas(
                        'customer',
                        function ($customerQuery) use ($search) {
                            $customerQuery
                                ->where(
                                    'name',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'email',
                                    'like',
                                    "%{$search}%"
                                )
                                ->orWhere(
                                    'phone',
                                    'like',
                                    "%{$search}%"
                                );
                        }
                    );
            });
        }

        return $query
            ->latest('held_at')
            ->latest('id')
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

    public function hold(
        array $context,
        array $data
    ): PosHeldSale {
        return DB::transaction(function () use ($context, $data) {
            $cart = $this->prepareCart(
                $context,
                $data['items']
            );

            if (empty($cart)) {
                throw ValidationException::withMessages([
                    'items' => [
                        'খালি cart hold করা যাবে না।',
                    ],
                ]);
            }

            $subtotal = round(
                collect($cart)->sum('line_total'),
                2
            );

            $discount = $this->calculateDiscount(
                $subtotal,
                $data['discount'] ?? null
            );

            $taxRate = round(
                (float) ($data['tax_rate'] ?? 0),
                4
            );

            if ($taxRate < 0 || $taxRate > 100) {
                throw ValidationException::withMessages([
                    'tax_rate' => [
                        'Tax rate 0 থেকে 100-এর মধ্যে হতে হবে।',
                    ],
                ]);
            }

            $taxableAmount = max(
                0,
                $subtotal - $discount['amount']
            );

            $taxTotal = round(
                ($taxableAmount * $taxRate) / 100,
                2
            );

            $grandTotal = round(
                $taxableAmount + $taxTotal,
                2
            );

            return PosHeldSale::query()->create([
                'vendor_id' => $context['vendor_id'],
                'location_id' => $context['location_id'],
                'cashier_id' => $context['user_id'],
                'customer_id' => $data['customer_id'] ?? null,
                'reference' => $this->generateReference(),
                'status' => 'held',
                'currency' => strtoupper(
                    $data['currency'] ?? 'USD'
                ),
                'cart_data' => $cart,
                'customer_snapshot' => $data['customer_snapshot'] ?? null,
                'discount_data' => $discount,
                'subtotal' => $subtotal,
                'discount_total' => $discount['amount'],
                'tax_rate' => $taxRate,
                'tax_total' => $taxTotal,
                'grand_total' => $grandTotal,
                'note' => $data['note'] ?? null,
                'held_at' => now(),
                'resumed_at' => null,
            ]);
        });
    }

    public function resume(
        array $context,
        int $heldSaleId
    ): array {
        return DB::transaction(function () use ($context, $heldSaleId) {
            $heldSale = $this->findHeldSale(
                $context,
                $heldSaleId,
                true
            );

            $heldSale->update([
                'resumed_at' => now(),
            ]);

            $heldSale->refresh();

            return $this->formatHeldSale(
                $heldSale
            );
        });
    }

    public function remove(
        array $context,
        int $heldSaleId
    ): void {
        DB::transaction(function () use ($context, $heldSaleId) {
            $heldSale = $this->findHeldSale(
                $context,
                $heldSaleId,
                true
            );

            $heldSale->update([
                'status' => 'cancelled',
            ]);
        });
    }

    public function complete(
        array $context,
        int $heldSaleId
    ): void {
        DB::transaction(function () use ($context, $heldSaleId) {
            $heldSale = $this->findHeldSale(
                $context,
                $heldSaleId,
                true
            );

            $heldSale->update([
                'status' => 'completed',
                'resumed_at' => $heldSale->resumed_at ?? now(),
            ]);
        });
    }

    private function prepareCart(
        array $context,
        array $items
    ): array {
        $preparedCart = [];

        foreach ($items as $index => $item) {
            $quantity = (int) ($item['quantity'] ?? 0);

            if ($quantity < 1) {
                throw ValidationException::withMessages([
                    "items.$index.quantity" => [
                        'Quantity কমপক্ষে 1 হতে হবে।',
                    ],
                ]);
            }

            $product = Product::query()
                ->whereKey($item['product_id'])
                ->where('status', 'active')
                ->where('point_of_sale', true)
                ->first();

            if (!$product) {
                throw ValidationException::withMessages([
                    "items.$index.product_id" => [
                        'Product পাওয়া যায়নি অথবা POS-এর জন্য active নয়।',
                    ],
                ]);
            }

            $this->validateProductOwnership(
                $context,
                $product,
                $index
            );

            $variant = $this->resolveVariant(
                $product,
                $item['variant_id'] ?? null,
                $index
            );

            $unitPrice = round(
                (float) ($variant?->price ?? $product->price),
                2
            );

            if ($unitPrice < 0) {
                throw ValidationException::withMessages([
                    "items.$index.product_id" => [
                        'Product price সঠিক নয়।',
                    ],
                ]);
            }

            $preparedCart[] = [
                'product_id' => $product->id,
                'variant_id' => $variant?->id,
                'product_title' => $product->title,
                'variant_title' => $variant?->title,
                'sku' => $variant?->sku ?? $product->sku,
                'barcode' => $variant?->barcode ?? $product->barcode,
                'quantity' => $quantity,
                'unit_price' => $unitPrice,

                'compare_at_price' => round(
                    (float) (
                        $variant?->compare_at_price
                        ?? $product->compare_at_price
                        ?? 0
                    ),
                    2
                ),

                'line_total' => round(
                    $unitPrice * $quantity,
                    2
                ),

                'note' => $item['note'] ?? null,
            ];
        }

        return $preparedCart;
    }

    private function resolveVariant(
        Product $product,
        ?int $variantId,
        int $index
    ): ?ProductVariant {
        if ($variantId) {
            $variant = ProductVariant::query()
                ->whereKey($variantId)
                ->where(
                    'product_id',
                    $product->id
                )
                ->where('is_active', true)
                ->first();

            if (!$variant) {
                throw ValidationException::withMessages([
                    "items.$index.variant_id" => [
                        'নির্বাচিত product variant পাওয়া যায়নি।',
                    ],
                ]);
            }

            return $variant;
        }

        $hasVariants = ProductVariant::query()
            ->where(
                'product_id',
                $product->id
            )
            ->where('is_active', true)
            ->exists();

        if ($hasVariants) {
            throw ValidationException::withMessages([
                "items.$index.variant_id" => [
                    'এই product-এর একটি variant নির্বাচন করুন।',
                ],
            ]);
        }

        return null;
    }

    private function validateProductOwnership(
        array $context,
        Product $product,
        int $index
    ): void {
        if ($context['role'] === 'vendor') {
            if (
                $product->source !== 'vendor'
                || (int) $product->created_by
                    !== (int) $context['vendor_user_id']
            ) {
                throw ValidationException::withMessages([
                    "items.$index.product_id" => [
                        'এই product বর্তমান vendor-এর নয়।',
                    ],
                ]);
            }

            return;
        }

        if ($product->source !== 'admin') {
            throw ValidationException::withMessages([
                "items.$index.product_id" => [
                    'Admin POS থেকে vendor product hold করা যাবে না।',
                ],
            ]);
        }
    }

    private function calculateDiscount(
        float $subtotal,
        ?array $discount
    ): array {
        if (
            !$discount
            || empty($discount['type'])
            || (float) ($discount['value'] ?? 0) <= 0
        ) {
            return [
                'type' => null,
                'value' => 0,
                'amount' => 0,
                'reason' => null,
            ];
        }

        $type = $discount['type'];

        $value = round(
            (float) $discount['value'],
            2
        );

        if (!in_array(
            $type,
            [
                'fixed',
                'percentage',
            ],
            true
        )) {
            throw ValidationException::withMessages([
                'discount.type' => [
                    'Discount type fixed অথবা percentage হতে হবে।',
                ],
            ]);
        }

        if ($value < 0) {
            throw ValidationException::withMessages([
                'discount.value' => [
                    'Discount value negative হতে পারবে না।',
                ],
            ]);
        }

        if (
            $type === 'percentage'
            && $value > 100
        ) {
            throw ValidationException::withMessages([
                'discount.value' => [
                    'Percentage discount 100-এর বেশি হতে পারবে না।',
                ],
            ]);
        }

        $amount = $type === 'percentage'
            ? round(
                ($subtotal * $value) / 100,
                2
            )
            : round($value, 2);

        return [
            'type' => $type,
            'value' => $value,
            'amount' => min(
                $amount,
                $subtotal
            ),
            'reason' => $discount['reason'] ?? null,
        ];
    }

    private function findHeldSale(
        array $context,
        int $heldSaleId,
        bool $lock = false
    ): PosHeldSale {
        $query = PosHeldSale::query()
            ->whereKey($heldSaleId)
            ->where(
                'location_id',
                $context['location_id']
            )
            ->where('status', 'held');

        $this->applyOwnerScope(
            $query,
            $context
        );

        if ($lock) {
            $query->lockForUpdate();
        }

        $heldSale = $query->first();

        if (!$heldSale) {
            throw ValidationException::withMessages([
                'held_sale_id' => [
                    'Held sale পাওয়া যায়নি অথবা এটি আর active নেই।',
                ],
            ]);
        }

        return $heldSale;
    }

    private function applyOwnerScope(
        Builder $query,
        array $context
    ): void {
        if ($context['role'] === 'vendor') {
            $query->where(
                'vendor_id',
                $context['vendor_id']
            );

            return;
        }

        $query->whereNull('vendor_id');
    }

    private function formatHeldSale(
        PosHeldSale $heldSale
    ): array {
        return [
            'id' => $heldSale->id,
            'reference' => $heldSale->reference,
            'status' => $heldSale->status,
            'vendor_id' => $heldSale->vendor_id,
            'location_id' => $heldSale->location_id,
            'cashier_id' => $heldSale->cashier_id,
            'customer_id' => $heldSale->customer_id,
            'customer_snapshot' => $heldSale->customer_snapshot,
            'currency' => $heldSale->currency,
            'items' => $heldSale->cart_data,
            'discount' => $heldSale->discount_data,
            'subtotal' => (float) $heldSale->subtotal,
            'discount_total' => (float) $heldSale->discount_total,
            'tax_rate' => (float) $heldSale->tax_rate,
            'tax_total' => (float) $heldSale->tax_total,
            'grand_total' => (float) $heldSale->grand_total,
            'note' => $heldSale->note,
            'held_at' => $heldSale->held_at,
            'resumed_at' => $heldSale->resumed_at,
            'created_at' => $heldSale->created_at,
        ];
    }

    private function generateReference(): string
    {
        do {
            $reference = 'HOLD-'
                . now()->format('Ymd')
                . '-'
                . Str::upper(
                    Str::random(6)
                );
        } while (
            PosHeldSale::query()
                ->where(
                    'reference',
                    $reference
                )
                ->exists()
        );

        return $reference;
    }
}
