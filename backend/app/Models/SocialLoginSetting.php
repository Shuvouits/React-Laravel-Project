<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SocialLoginSetting extends Model
{
    protected $fillable = [
        'provider',
        'is_enabled',
        'client_id',
        'client_secret',
        'redirect_uri',
    ];

    protected $hidden = [
        'client_secret',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',

            /*
             * Laravel encrypts/decrypts this
             * automatically.
             */
            'client_secret' => 'encrypted',
        ];
    }
}
