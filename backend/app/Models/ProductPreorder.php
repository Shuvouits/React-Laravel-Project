<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPreorder extends Model
{
    protected $fillable = [
        'product_id',
        'preorder_start_at',
        'preorder_end_at',
        'expected_ship_from',
        'expected_ship_to',
        'payment_type',
        'deposit_type',
        'deposit_value',
        'balance_due_at',
        'max_preorder_quantity',
        'max_quantity_per_customer',
        'reserved_quantity',
        'allow_full_payment',
        'show_remaining_quantity',
        'badge_text',
        'preorder_message',
        'terms',
    ];

    protected function casts(): array
    {
        return [
            'preorder_start_at' => 'datetime',
            'preorder_end_at' => 'datetime',
            'expected_ship_from' => 'date',
            'expected_ship_to' => 'date',
            'balance_due_at' => 'datetime',
            'deposit_value' => 'decimal:2',
            'max_preorder_quantity' => 'integer',
            'max_quantity_per_customer' => 'integer',
            'reserved_quantity' => 'integer',
            'allow_full_payment' => 'boolean',
            'show_remaining_quantity' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}