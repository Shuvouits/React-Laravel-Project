<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VendorPlan extends Model
{
    protected $fillable = [
        'name',
        'slug',
        'description',
        'monthly_price',
        'yearly_price',
        'commission_rate',
        'trial_days',
        'features',
        'product_limit',
        'staff_limit',
        'ai_authoring',
        'stripe_product_id',
        'stripe_price_id',
        'is_active',
        'is_default',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'monthly_price' => 'decimal:2',
            'yearly_price' => 'decimal:2',
            'commission_rate' => 'decimal:2',
            'trial_days' => 'integer',
            'features' => 'array',
            'product_limit' => 'integer',
            'staff_limit' => 'integer',
            'ai_authoring' => 'boolean',
            'is_active' => 'boolean',
            'is_default' => 'boolean',
            'sort_order' => 'integer',
        ];
    }

    // Vendor applications
    public function applications(): HasMany
    {
        return $this->hasMany(VendorApplication::class);
    }

    // Vendors using this plan
    public function vendors(): HasMany
    {
        return $this->hasMany(Vendor::class);
    }
}