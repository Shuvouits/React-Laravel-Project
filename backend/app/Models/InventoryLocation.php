<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryLocation extends Model
{
    protected $fillable = [
        'vendor_id',
        'name',
        'code',
        'phone',
        'email',
        'address_line1',
        'address_line2',
        'city',
        'state',
        'postal_code',
        'country',
        'pickup_enabled',
        'shipping_enabled',
        'shipping_priority',
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'pickup_enabled' => 'boolean',
        'shipping_enabled' => 'boolean',
        'shipping_priority' => 'integer',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'vendor_id'
        );
    }

    public function inventoryLevels(): HasMany
    {
        return $this->hasMany(
            InventoryLevel::class,
            'location_id'
        );
    }

    public function outgoingTransfers(): HasMany
    {
        return $this->hasMany(
            InventoryTransfer::class,
            'from_location_id'
        );
    }

    public function incomingTransfers(): HasMany
    {
        return $this->hasMany(
            InventoryTransfer::class,
            'to_location_id'
        );
    }

    public function movements(): HasMany
    {
        return $this->hasMany(
            InventoryMovement::class,
            'location_id'
        );
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(
            InventoryReview::class,
            'location_id'
        );
    }
}
