<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SalesAiConversation extends Model
{
    protected $fillable = [
        'uuid',
        'user_id',
        'guest_token',
        'status',
        'locale',
        'page_url',
        'last_message_at',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'last_message_at' => 'datetime',
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(
            User::class
        );
    }

    public function messages(): HasMany
    {
        return $this->hasMany(
            SalesAiMessage::class
        )->orderBy('id');
    }

    public function scopeActive($query)
    {
        return $query->where(
            'status',
            'active'
        );
    }
}