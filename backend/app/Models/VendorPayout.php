<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendorPayout extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id',
        'payout_no',
        'status',
        'period_start',
        'period_end',
        'gross_sales',
        'refund_total',
        'commission_total',
        'adjustment_total',
        'net_payout',
        'currency',
        'payment_method',
        'payment_reference',
        'failure_reason',
        'note',
        'processing_at',
        'paid_at',
        'failed_at',
        'cancelled_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'gross_sales' => 'decimal:2',
        'refund_total' => 'decimal:2',
        'commission_total' => 'decimal:2',
        'adjustment_total' => 'decimal:2',
        'net_payout' => 'decimal:2',
        'processing_at' => 'datetime',
        'paid_at' => 'datetime',
        'failed_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function orders(): BelongsToMany
    {
        return $this->belongsToMany(
            Order::class,
            'vendor_payout_orders'
        )
            ->withPivot([
                'gross_amount',
                'refund_amount',
                'commission_amount',
                'net_amount',
            ])
            ->withTimestamps();
    }

    public function financeEntries(): HasMany
    {
        return $this->hasMany(
            VendorFinanceEntry::class,
            'vendor_payout_id'
        );
    }


    
}
