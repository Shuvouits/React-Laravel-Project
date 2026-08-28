<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FinancePeriodClosure extends Model
{
    use HasFactory;

    protected $fillable = [
        'period_month',
        'period_start',
        'period_end',
        'book',
        'currency',
        'product_sales',
        'commission_income',
        'shipping_income',
        'refunds',
        'total_income',
        'total_costs',
        'net_at_close',
        'order_volume',
        'tax_collected',
        'tax_refunded',
        'tax_owed_onward',
        'owed_to_vendors',
        'commission_owed_to_admin',
        'snapshot',
        'closed_by',
        'closed_at',
    ];

    protected $casts = [
        'period_start' => 'date',
        'period_end' => 'date',
        'closed_at' => 'datetime',
        'snapshot' => 'array',

        'product_sales' => 'decimal:2',
        'commission_income' => 'decimal:2',
        'shipping_income' => 'decimal:2',
        'refunds' => 'decimal:2',
        'total_income' => 'decimal:2',
        'total_costs' => 'decimal:2',
        'net_at_close' => 'decimal:2',
        'order_volume' => 'decimal:2',
        'tax_collected' => 'decimal:2',
        'tax_refunded' => 'decimal:2',
        'tax_owed_onward' => 'decimal:2',
        'owed_to_vendors' => 'decimal:2',
        'commission_owed_to_admin' => 'decimal:2',
    ];

    public function closedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'closed_by'
        );
    }
}