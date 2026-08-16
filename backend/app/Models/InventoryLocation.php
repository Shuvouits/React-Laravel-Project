<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryLocation extends Model
{
    protected $fillable = [
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
        'is_default',
        'is_active',
    ];

    protected $casts = [
        'is_default' => 'boolean',
        'is_active' => 'boolean',
    ];

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