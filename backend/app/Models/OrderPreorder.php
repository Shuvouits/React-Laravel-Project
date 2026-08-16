<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderPreorder extends Model
{
    protected $fillable = [
        'order_id',
        'status',
        'expected_at',
        'payment_terms',
        'deposit_amount',
        'balance_due',
        'balance_due_at',
        'reserved_quantity',
        'released_at',
        'cancelled_at',
        'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'expected_at' => 'date',
            'deposit_amount' => 'decimal:2',
            'balance_due' => 'decimal:2',
            'balance_due_at' => 'datetime',
            'reserved_quantity' => 'integer',
            'released_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }
}