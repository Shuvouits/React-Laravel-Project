<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MessageAttachment extends Model
{
    protected $fillable = [
        'conversation_message_id',
        'file_name',
        'file_path',
        'file_type',
        'file_size',
    ];

    protected $appends = [
    'file_url',
];

    protected function casts(): array
    {
        return [
            'file_size' => 'integer',
        ];
    }

    public function message(): BelongsTo
    {
        return $this->belongsTo(
            ConversationMessage::class,
            'conversation_message_id'
        );
    }

    public function getFileUrlAttribute(): ?string
    {
        if (!$this->file_path) {
            return null;
        }

        if (
            str_starts_with(
                $this->file_path,
                'http://'
            ) ||
            str_starts_with(
                $this->file_path,
                'https://'
            )
        ) {
            return $this->file_path;
        }

        return asset(
            ltrim(
                $this->file_path,
                '/'
            )
        );
    }
}
