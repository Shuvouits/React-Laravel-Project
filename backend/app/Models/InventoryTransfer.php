<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryTransfer extends Model
{
    protected $fillable = [
        'transfer_no',
        'from_location_id',
        'to_location_id',
        'status',
        'note',
        'submitted_at',
        'shipped_at',
        'received_at',
        'cancelled_at',
    ];

    protected $casts = [
        'submitted_at' => 'datetime',
        'shipped_at' => 'datetime',
        'received_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    public function fromLocation(): BelongsTo
    {
        return $this->belongsTo(
            InventoryLocation::class,
            'from_location_id'
        );
    }

    public function toLocation(): BelongsTo
    {
        return $this->belongsTo(
            InventoryLocation::class,
            'to_location_id'
        );
    }

    public function items(): HasMany
    {
        return $this->hasMany(
            InventoryTransferItem::class,
            'inventory_transfer_id'
        );
    }
}