<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CustomerProfile extends Model
{
    protected $fillable = [
        'user_id',
        'acquisition_source',
        'tags',
        'loyalty_tier',
        'loyalty_points',
        'marketing_opt_in',
        'order_updates',
        'promotions',
        'newsletter',
        'price_drops',
        'back_in_stock',
        'last_active_at',
        'internal_notes',
    ];

    protected function casts(): array
    {
        return [
            'tags' => 'array',
            'loyalty_points' => 'integer',
            'marketing_opt_in' => 'boolean',
            'order_updates' => 'boolean',
            'promotions' => 'boolean',
            'newsletter' => 'boolean',
            'price_drops' => 'boolean',
            'back_in_stock' => 'boolean',
            'last_active_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}