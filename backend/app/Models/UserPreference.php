<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserPreference extends Model
{
    protected $fillable = [
        'user_id',
        'order_updates',
        'promotions_deals',
        'newsletter',
        'price_drop_alerts',
        'back_in_stock_alerts',
        'marketing_emails',
    ];

    protected $casts = [
        'order_updates' => 'boolean',
        'promotions_deals' => 'boolean',
        'newsletter' => 'boolean',
        'price_drop_alerts' => 'boolean',
        'back_in_stock_alerts' => 'boolean',
        'marketing_emails' => 'boolean',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}