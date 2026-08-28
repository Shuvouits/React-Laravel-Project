<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorFinanceEntry extends Model
{
    use HasFactory;

    protected $fillable = [
      
      'vendor_id',
    'order_id',
    'vendor_payout_id',
    'type',
    'event_key',
    'reference',
    'held_amount',
    'owed_amount',
    'currency',
    'description',
    'metadata',
    'occurred_at',
    
    ];

    protected $casts = [
        'held_amount' => 'decimal:2',
        'owed_amount' => 'decimal:2',
        'metadata' => 'array',
        'occurred_at' => 'datetime',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function payout(): BelongsTo
    {
        return $this->belongsTo(
            VendorPayout::class,
            'vendor_payout_id'
        );
    }

    public function scopeOwnedBy(
        Builder $query,
        int $vendorId
    ): Builder {
        return $query->where(
            'vendor_id',
            $vendorId
        );
    }
}
