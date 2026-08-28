<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Discount extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id',
        'code',
        'label',
        'description',
        'status',
        'type',
        'value',
        'minimum_order_amount',
        'maximum_discount_cap',
        'total_usage_limit',
        'per_customer_usage_limit',
        'used_count',
        'starts_at',
        'ends_at',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'minimum_order_amount' => 'decimal:2',
        'maximum_discount_cap' => 'decimal:2',
        'total_usage_limit' => 'integer',
        'per_customer_usage_limit' => 'integer',
        'used_count' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    protected $appends = [
        'effective_status',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'vendor_id');
    }

    public function scopeOwnedBy(Builder $query, int $vendorId): Builder
    {
        return $query->where('vendor_id', $vendorId);
    }

    public function getEffectiveStatusAttribute(): string
    {
        if ($this->status === 'inactive') {
            return 'inactive';
        }

        if ($this->starts_at && $this->starts_at->isFuture()) {
            return 'scheduled';
        }

        if ($this->ends_at && $this->ends_at->isPast()) {
            return 'expired';
        }

        if (
            $this->total_usage_limit !== null &&
            $this->used_count >= $this->total_usage_limit
        ) {
            return 'limit_reached';
        }

        return 'active';
    }
}
