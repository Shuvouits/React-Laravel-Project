<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversation_messages', function (Blueprint $table) {
            $table->id();

            $table->foreignId('conversation_id')
                ->constrained('conversations')
                ->cascadeOnDelete();

            $table->foreignId('sender_user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->text('message')
                ->nullable();

            $table->string('message_type', 30)
                ->default('text');

            $table->timestamp('read_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'conversation_id',
                'created_at',
            ]);

            $table->index([
                'sender_user_id',
                'created_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversation_messages');
    }
};