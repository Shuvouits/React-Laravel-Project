<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PosSale extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'register_session_id',
        'vendor_id',
        'location_id',
        'cashier_id',
        'customer_id',
        'sale_number',
        'status',
        'currency',
        'subtotal',
        'discount_type',
        'discount_value',
        'discount_total',
        'tax_rate',
        'tax_total',
        'grand_total',
        'amount_paid',
        'change_amount',
        'refunded_total',
        'payment_status',
        'primary_payment_method',
        'discount_data',
        'cart_snapshot',
        'customer_note',
        'internal_note',
        'completed_at',
        'refunded_at',
        'cancelled_at',
    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'tax_rate' => 'decimal:4',
            'tax_total' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'change_amount' => 'decimal:2',
            'refunded_total' => 'decimal:2',
            'discount_data' => 'array',
            'cart_snapshot' => 'array',
            'completed_at' => 'datetime',
            'refunded_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function registerSession(): BelongsTo
    {
        return $this->belongsTo(
            PosRegisterSession::class,
            'register_session_id'
        );
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

    public function payments(): HasMany
    {
        return $this->hasMany(
            PosPayment::class,
            'pos_sale_id'
        );
    }

    public function refunds(): HasMany
    {
        return $this->hasMany(
            PosRefund::class,
            'pos_sale_id'
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
