<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ConversationMessage extends Model
{
    protected $fillable = [
        'conversation_id',
        'sender_user_id',
        'message',
        'message_type',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(
            Conversation::class
        );
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'sender_user_id'
        );
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(
            MessageAttachment::class
        );
    }

    public function scopeUnread($query)
    {
        return $query->whereNull(
            'read_at'
        );
    }
}
