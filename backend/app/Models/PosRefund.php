<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosRefund extends Model
{
    use HasFactory;

    protected $fillable = [
        'pos_sale_id',
        'order_id',
        'vendor_id',
        'location_id',
        'register_session_id',
        'processed_by',
        'refund_number',
        'status',
        'reason',
        'notes',
        'subtotal',
        'tax_total',
        'total',
        'currency',
        'payment_method',
        'payment_reference',
        'restock_items',
        'metadata',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'total' => 'decimal:2',
            'restock_items' => 'boolean',
            'metadata' => 'array',
            'completed_at' => 'datetime',
        ];
    }

    public function sale(): BelongsTo
    {
        return $this->belongsTo(
            PosSale::class,
            'pos_sale_id'
        );
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
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

    public function registerSession(): BelongsTo
    {
        return $this->belongsTo(
            PosRegisterSession::class,
            'register_session_id'
        );
    }

    public function processedBy(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'processed_by'
        );
    }

    public function items(): HasMany
    {
        return $this->hasMany(
            PosRefundItem::class,
            'pos_refund_id'
        );
    }

    public function scopeCompleted($query)
    {
        return $query->where(
            'status',
            'completed'
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
