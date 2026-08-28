<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosPayment extends Model
{
    use HasFactory;

    protected $fillable = [
        'pos_sale_id',
        'received_by',
        'payment_method',
        'status',
        'amount',
        'currency',
        'reference',
        'card_last_four',
        'metadata',
        'paid_at',
        'refunded_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'metadata' => 'array',
            'paid_at' => 'datetime',
            'refunded_at' => 'datetime',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(
            PosSale::class,
            'pos_sale_id'
        );
    }

    public function receiver(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'received_by'
        );
    }

    public function scopeSucceeded($query)
    {
        return $query->where(
            'status',
            'succeeded'
        );
    }

    public function scopeCash($query)
    {
        return $query->whereIn(
            'payment_method',
            [
                'cash',
                'pos_cash',
            ]
        );
    }
}