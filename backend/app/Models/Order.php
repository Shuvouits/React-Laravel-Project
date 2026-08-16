<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'order_no',
        'user_id',
        'status',
        'payment_method',
        'payment_status',
        'shipping_method',
        'currency',
        'subtotal',
        'discount_total',
        'shipping_total',
        'tax_total',
        'grand_total',
        'coupon_code',
        'billing_same_as_shipping',
        'marketing_emails',
        'customer_note',
        'placed_at',
        'paid_at',
        'cancelled_at',

        'channel',
'fulfillment_status',
'delivery_status',
'fulfilled_at',
'shipped_at',
'archived_at',


    ];

    protected function casts(): array
    {
        return [
            'subtotal' => 'decimal:2',
            'discount_total' => 'decimal:2',
            'shipping_total' => 'decimal:2',
            'tax_total' => 'decimal:2',
            'grand_total' => 'decimal:2',
            'billing_same_as_shipping' => 'boolean',
            'marketing_emails' => 'boolean',
            'placed_at' => 'datetime',
            'paid_at' => 'datetime',
            'cancelled_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(OrderAddress::class);
    }

    public function shippingAddress()
    {
        return $this->hasOne(OrderAddress::class)
            ->where('address_type', 'shipping');
    }

    public function billingAddress()
    {
        return $this->hasOne(OrderAddress::class)
            ->where('address_type', 'billing');
    }

    public function paymentTransactions(): HasMany
{
    return $this->hasMany(PaymentTransaction::class);
}


public function preorder()
{
    return $this->hasOne(OrderPreorder::class);
}





}
