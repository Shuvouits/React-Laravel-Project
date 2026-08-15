<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentSetting extends Model
{
    protected $fillable = [
        'gateway',
        'is_enabled',
        'mode',
        'config',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'config' => 'encrypted:array',
            'sort_order' => 'integer',
        ];
    }
}