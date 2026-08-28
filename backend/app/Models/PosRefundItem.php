<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosRefundItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'pos_refund_id',
        'order_item_id',
        'product_id',
        'variant_id',
        'product_title',
        'variant_title',
        'sku',
        'quantity',
        'unit_price',
        'line_total',
        'restocked',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'integer',
            'unit_price' => 'decimal:2',
            'line_total' => 'decimal:2',
            'restocked' => 'boolean',
        ];
    }

    public function refund(): BelongsTo
    {
        return $this->belongsTo(
            PosRefund::class,
            'pos_refund_id'
        );
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(
            OrderItem::class,
            'order_item_id'
        );
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(
            ProductVariant::class,
            'variant_id'
        );
    }
}
