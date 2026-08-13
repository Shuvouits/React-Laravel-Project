<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VendorConfiguration extends Model
{
    protected $fillable = [
        'allow_vendor_registration',
        'auto_approve_applications',
        'enable_subscription_plans',
        'require_plan_at_signup',
        'free_trial_days',
        'default_commission_rate',
        'minimum_withdrawal_amount',
    ];

    protected function casts(): array
    {
        return [
            'allow_vendor_registration' => 'boolean',
            'auto_approve_applications' => 'boolean',
            'enable_subscription_plans' => 'boolean',
            'require_plan_at_signup' => 'boolean',
            'free_trial_days' => 'integer',
            'default_commission_rate' => 'decimal:2',
            'minimum_withdrawal_amount' => 'decimal:2',
        ];
    }
}
