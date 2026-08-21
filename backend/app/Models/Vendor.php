<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    protected $fillable = [
        'user_id',
        'vendor_application_id',
        'vendor_plan_id',
        'store_name',
        'slug',
        'description',
        'logo',
        'banner',
        'status',
        'billing_cycle',
        'commission_rate',
        'approved_at',
        'suspended_at',
        'rejected_at',
        'admin_note',
    ];

    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
            'approved_at' => 'datetime',
            'suspended_at' => 'datetime',
            'rejected_at' => 'datetime',
        ];
    }

    // Vendor owner
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Original vendor application
    public function application(): BelongsTo
    {
        return $this->belongsTo(VendorApplication::class, 'vendor_application_id');
    }

    // Subscription plan
    public function plan(): BelongsTo
    {
        return $this->belongsTo(VendorPlan::class, 'vendor_plan_id');
    }

    // Vendor permissions
    public function permissions(): HasMany
    {
        return $this->hasMany(VendorPermission::class);
    }

    // Approved vendors
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    // Pending vendors
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    // Suspended vendors
    public function scopeSuspended($query)
    {
        return $query->where('status', 'suspended');
    }

    public function conversations(): HasMany
{
    return $this->hasMany(
        Conversation::class
    );
}


}
