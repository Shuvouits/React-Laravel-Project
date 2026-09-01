<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SalesAiSetting extends Model
{
    protected $fillable = [
        'bot_name',
        'welcome_message',
        'input_placeholder',
        'system_prompt',
        'model',
        'fallback_model',
        'temperature',
        'max_tokens',
        'product_search_limit',
        'guest_daily_limit',
        'authenticated_daily_limit',
        'starter_suggestions',
        'theme',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'temperature' => 'decimal:2',
            'max_tokens' => 'integer',
            'product_search_limit' => 'integer',
            'guest_daily_limit' => 'integer',
            'authenticated_daily_limit' => 'integer',
            'starter_suggestions' => 'array',
            'theme' => 'array',
            'is_active' => 'boolean',
        ];
    }
}