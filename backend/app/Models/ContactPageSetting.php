<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ContactPageSetting extends Model
{
    protected $fillable = [
        'hero',
        'contact_information',
        'form_content',
        'map_content',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'hero' => 'array',
            'contact_information' => 'array',
            'form_content' => 'array',
            'map_content' => 'array',
            'is_active' => 'boolean',
        ];
    }
}
