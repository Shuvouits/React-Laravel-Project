<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_id')
                ->constrained('vendors')
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            $table->foreignId('order_id')
                ->nullable()
                ->constrained('orders')
                ->nullOnDelete();

            $table->foreignId('assigned_to')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('subject')
                ->nullable();

            $table->string('channel', 50)
                ->default('live_chat');

            $table->string('status', 30)
                ->default('open');

            $table->unsignedInteger('vendor_unread_count')
                ->default(0);

            $table->unsignedInteger('customer_unread_count')
                ->default(0);

            $table->timestamp('last_message_at')
                ->nullable();

            $table->timestamp('resolved_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'vendor_id',
                'status',
            ]);

            $table->index([
                'customer_id',
                'status',
            ]);

            $table->index('last_message_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};