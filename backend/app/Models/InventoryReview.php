<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryReview extends Model
{
    protected $fillable = [
        'review_no',
        'location_id',
        'status',
        'note',
        'created_by',
        'started_at',
        'completed_at',
        'cancelled_at',
    ];

    protected $casts = [
        'created_by' => 'integer',
        'started_at' => 'datetime',
        'completed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function location(): BelongsTo
    {
        return $this->belongsTo(
            InventoryLocation::class,
            'location_id'
        );
    }

    public function items(): HasMany
    {
        return $this->hasMany(
            InventoryReviewItem::class,
            'inventory_review_id'
        );
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'created_by'
        );
    }
}