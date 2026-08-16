<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryLevel extends Model
{
    protected $fillable = [
        'location_id',
        'product_id',
        'variant_id',
        'on_hand',
        'committed',
        'unavailable',
        'incoming',
        'low_stock_threshold',
        'track_quantity',
    ];

    protected $casts = [
        'on_hand' => 'integer',
        'committed' => 'integer',
        'unavailable' => 'integer',
        'incoming' => 'integer',
        'low_stock_threshold' => 'integer',
        'track_quantity' => 'boolean',
    ];

    protected $appends = [
        'available',
    ];

    public function location(): BelongsTo
    {
        return $this->belongsTo(
            InventoryLocation::class,
            'location_id'
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

    public function getAvailableAttribute(): int
    {
        return max(
            0,
            (int) $this->on_hand
            - (int) $this->committed
            - (int) $this->unavailable
        );
    }
}