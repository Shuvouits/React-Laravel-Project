<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorPermission extends Model
{
    protected $fillable = [
        'vendor_id',
        'resource',
        'can_view',
        'can_create',
        'can_edit',
        'can_delete',
    ];

    protected function casts(): array
    {
        return [
            'can_view' => 'boolean',
            'can_create' => 'boolean',
            'can_edit' => 'boolean',
            'can_delete' => 'boolean',
        ];
    }

    // Vendor
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }
}
