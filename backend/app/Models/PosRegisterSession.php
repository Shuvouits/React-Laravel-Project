<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosRegisterSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id',
        'location_id',
        'cashier_id',
        'session_number',
        'status',
        'opening_balance',
        'cash_sales',
        'cash_refunds',
        'expected_balance',
        'closing_balance',
        'balance_difference',
        'opening_note',
        'closing_note',
        'opened_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'opening_balance' => 'decimal:2',
            'cash_sales' => 'decimal:2',
            'cash_refunds' => 'decimal:2',
            'expected_balance' => 'decimal:2',
            'closing_balance' => 'decimal:2',
            'balance_difference' => 'decimal:2',
            'opened_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function location(): BelongsTo
    {
        return $this->belongsTo(
            InventoryLocation::class,
            'location_id'
        );
    }

    public function cashier(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'cashier_id'
        );
    }

    public function sales(): HasMany
    {
        return $this->hasMany(
            PosSale::class,
            'register_session_id'
        );
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeForVendor(
        $query,
        ?int $vendorId
    ) {
        if ($vendorId === null) {
            return $query->whereNull('vendor_id');
        }

        return $query->where('vendor_id', $vendorId);
    }
}