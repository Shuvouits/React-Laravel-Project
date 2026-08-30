<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FooterSetting extends Model
{
    protected $fillable = [
        'store_information',
        'menus',
        'social_links',
        'copyright_text',
        'is_active',
    ];

    protected $casts = [
        'store_information' =>
            'array',

        'menus' =>
            'array',

        'social_links' =>
            'array',

        'is_active' =>
            'boolean',
    ];
}