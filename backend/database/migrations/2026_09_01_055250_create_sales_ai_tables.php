<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sales_ai_settings', function (Blueprint $table) {
            $table->id();

            $table->string('bot_name')
                ->default('Sales AI');

            $table->string('welcome_message', 1000)
                ->default(
                    'Hi! I can help you find products, compare options, add items to your cart, and check order status.'
                );

            $table->string('input_placeholder')
                ->default('Type a message...');

            $table->text('system_prompt')
                ->nullable();

            $table->string('model')
                ->nullable();

            $table->string('fallback_model')
                ->nullable();

            $table->decimal(
                'temperature',
                3,
                2
            )->default(0.30);

            $table->unsignedInteger('max_tokens')
                ->default(1200);

            $table->unsignedInteger(
                'product_search_limit'
            )->default(6);

            $table->unsignedInteger(
                'guest_daily_limit'
            )->default(30);

            $table->unsignedInteger(
                'authenticated_daily_limit'
            )->default(100);

            $table->json('starter_suggestions')
                ->nullable();

            $table->json('theme')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });

        Schema::create(
            'sales_ai_conversations',
            function (Blueprint $table) {
                $table->id();

                $table->uuid('uuid')
                    ->unique();

                $table->foreignId('user_id')
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->string('guest_token', 100)
                    ->nullable()
                    ->index();

                $table->string('status', 30)
                    ->default('active')
                    ->index();

                $table->string('locale', 20)
                    ->default('en');

                $table->text('page_url')
                    ->nullable();

                $table->timestamp('last_message_at')
                    ->nullable()
                    ->index();

                $table->json('metadata')
                    ->nullable();

                $table->timestamps();
            }
        );

        Schema::create(
            'sales_ai_messages',
            function (Blueprint $table) {
                $table->id();

                $table->foreignId(
                    'sales_ai_conversation_id'
                )
                    ->constrained(
                        'sales_ai_conversations'
                    )
                    ->cascadeOnDelete();

                $table->string('role', 30)
                    ->index();

                $table->longText('content')
                    ->nullable();

                $table->string(
                    'content_type',
                    50
                )->default('text');

                $table->string('tool_name')
                    ->nullable();

                $table->string('tool_call_id')
                    ->nullable();

                $table->json('tool_payload')
                    ->nullable();

                $table->json('structured_data')
                    ->nullable();

                $table->string('model')
                    ->nullable();

                $table->unsignedInteger(
                    'prompt_tokens'
                )->default(0);

                $table->unsignedInteger(
                    'completion_tokens'
                )->default(0);

                $table->unsignedInteger(
                    'total_tokens'
                )->default(0);

                $table->decimal(
                    'cost',
                    14,
                    8
                )->default(0);

                $table->text('error_message')
                    ->nullable();

                $table->timestamps();

                $table->index([
                    'sales_ai_conversation_id',
                    'created_at',
                ]);
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'sales_ai_messages'
        );

        Schema::dropIfExists(
            'sales_ai_conversations'
        );

        Schema::dropIfExists(
            'sales_ai_settings'
        );
    }
};