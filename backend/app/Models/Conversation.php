<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    protected $fillable = [
        'vendor_id',
        'customer_id',
        'product_id',
        'order_id',
        'assigned_to',
        'subject',
        'channel',
        'status',
        'vendor_unread_count',
        'customer_unread_count',
        'last_message_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'vendor_unread_count' => 'integer',
            'customer_unread_count' => 'integer',
            'last_message_at' => 'datetime',
            'resolved_at' => 'datetime',
        ];
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'customer_id'
        );
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'assigned_to'
        );
    }

    public function messages(): HasMany
    {
        return $this->hasMany(
            ConversationMessage::class,
            'conversation_id'
        );
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(
            ConversationMessage::class,
            'conversation_id'
        )->latestOfMany();
    }

    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeResolved($query)
    {
        return $query->where('status', 'resolved');
    }
}