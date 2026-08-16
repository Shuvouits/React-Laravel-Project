<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryReviewItem extends Model
{
    protected $fillable = [
        'inventory_review_id',
        'product_id',
        'variant_id',
        'expected_quantity',
        'counted_quantity',
        'difference',
        'reason',
        'note',
    ];

    protected $casts = [
        'expected_quantity' => 'integer',
        'counted_quantity' => 'integer',
        'difference' => 'integer',
    ];

    public function review(): BelongsTo
    {
        return $this->belongsTo(
            InventoryReview::class,
            'inventory_review_id'
        );
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(
            Product::class,
            'product_id'
        );
    }

    public function variant(): BelongsTo
    {
        return $this->belongsTo(
            ProductVariant::class,
            'variant_id'
        );
    }
}