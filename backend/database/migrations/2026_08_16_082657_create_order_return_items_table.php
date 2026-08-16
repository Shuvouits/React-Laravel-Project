<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_return_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_return_id')
                ->constrained('order_returns')
                ->cascadeOnDelete();

            $table->foreignId('order_item_id')
                ->constrained('order_items')
                ->cascadeOnDelete();

            $table->unsignedBigInteger('product_id')->nullable();
            $table->unsignedBigInteger('variant_id')->nullable();

            $table->string('product_name');
            $table->string('variant_name')->nullable();
            $table->string('sku')->nullable();

            $table->unsignedInteger('quantity');

            $table->string('reason');
            $table->string('item_condition')->nullable();

            $table->decimal('refund_amount', 10, 2)
                ->default(0);

            $table->timestamps();

            $table->unique([
                'order_return_id',
                'order_item_id',
            ]);

            $table->index('product_id');
            $table->index('variant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_return_items');
    }
};