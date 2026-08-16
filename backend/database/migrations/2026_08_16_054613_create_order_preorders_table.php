<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_preorders', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->unique()
                ->constrained('orders')
                ->cascadeOnDelete();

            $table->enum('status', [
                'reserved',
                'payment_due',
                'delayed',
                'ready',
                'cancelled',
            ])->default('reserved')->index();

            $table->date('expected_at')->nullable()->index();

            $table->enum('payment_terms', [
                'full',
                'deposit',
                'pay_later',
            ])->default('full')->index();

            $table->decimal('deposit_amount', 12, 2)->nullable();
            $table->decimal('balance_due', 12, 2)->default(0);
            $table->timestamp('balance_due_at')->nullable()->index();

            $table->unsignedInteger('reserved_quantity')->default(0);

            $table->timestamp('released_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->text('cancellation_reason')->nullable();

            $table->timestamps();

            $table->index([
                'status',
                'expected_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_preorders');
    }
};