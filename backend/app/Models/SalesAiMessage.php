<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SalesAiMessage extends Model
{
    protected $fillable = [
        'sales_ai_conversation_id',
        'role',
        'content',
        'content_type',
        'tool_name',
        'tool_call_id',
        'tool_payload',
        'structured_data',
        'model',
        'prompt_tokens',
        'completion_tokens',
        'total_tokens',
        'cost',
        'error_message',
    ];

    protected function casts(): array
    {
        return [
            'sales_ai_conversation_id' =>
                'integer',

            'tool_payload' =>
                'array',

            'structured_data' =>
                'array',

            'prompt_tokens' =>
                'integer',

            'completion_tokens' =>
                'integer',

            'total_tokens' =>
                'integer',

            'cost' =>
                'decimal:8',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(
            SalesAiConversation::class,
            'sales_ai_conversation_id'
        );
    }
}