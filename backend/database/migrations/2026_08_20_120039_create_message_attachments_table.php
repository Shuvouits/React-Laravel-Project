<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('message_attachments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('conversation_message_id')
                ->constrained('conversation_messages')
                ->cascadeOnDelete();

            $table->string('file_name');

            $table->string('file_path');

            $table->string('file_type', 150)
                ->nullable();

            $table->unsignedBigInteger('file_size')
                ->nullable();

            $table->timestamps();

            $table->index('conversation_message_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('message_attachments');
    }
};