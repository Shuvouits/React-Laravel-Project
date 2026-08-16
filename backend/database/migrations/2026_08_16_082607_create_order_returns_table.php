<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_returns', function (Blueprint $table) {
            $table->id();

            $table->string('return_no')->unique();

            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->enum('status', [
                'requested',
                'approved',
                'rejected',
                'in_transit',
                'received',
                'refunded',
                'cancelled',
            ])->default('requested');

            $table->enum('refund_status', [
                'not_refunded',
                'partially_refunded',
                'refunded',
            ])->default('not_refunded');

            $table->decimal('refund_amount', 10, 2)
                ->default(0);

            $table->text('customer_note')->nullable();
            $table->text('admin_note')->nullable();

            $table->timestamp('requested_at')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->timestamp('received_at')->nullable();
            $table->timestamp('refunded_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->timestamps();

            $table->index('status');
            $table->index('refund_status');
            $table->index('requested_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_returns');
    }
};