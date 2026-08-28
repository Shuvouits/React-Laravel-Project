<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PosHeldSale extends Model
{
    use HasFactory;

    protected $fillable = [
        'vendor_id',
        'location_id',
        'cashier_id',
        'customer_id',
        'reference',
        'status',
        'currency',
        'cart_data',
        'customer_snapshot',
        'discount_data',
        'subtotal',
        'discount_total',
        'tax_rate',
        'tax_total',
        'grand_total',
        'note',
        'held_at',
        'resumed_at',
    ];

    protected function casts(): array
    {
        return [
            'cart_data' => 'array',
            'customer_snapshot' => 'array',
            'discount_data' => 'array',
            'subtotal' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'tax_rate' => 'decimal:4',
            'tax_total' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'held_at' => 'datetime',
            'resumed_at' => 'datetime',
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

    public function customer(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'customer_id'
        );
    }

    public function scopeHeld($query)
    {
        return $query->where(
            'status',
            'held'
        );
    }

    public function scopeForVendor(
        $query,
        ?int $vendorId
    ) {
        if ($vendorId === null) {
            return $query->whereNull('vendor_id');
        }

        return $query->where(
            'vendor_id',
            $vendorId
        );
    }
}
