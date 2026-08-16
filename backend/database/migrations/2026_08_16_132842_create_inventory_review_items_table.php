<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_review_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('inventory_review_id')
                ->constrained('inventory_reviews')
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();

            $table->foreignId('variant_id')
                ->nullable()
                ->constrained('product_variants')
                ->cascadeOnDelete();

            $table->unsignedInteger('expected_quantity')->default(0);

            $table->unsignedInteger('counted_quantity')->default(0);

            $table->integer('difference')->default(0);

            $table->string('reason')->nullable();

            $table->text('note')->nullable();

            $table->timestamps();

            $table->index('inventory_review_id');
            $table->index('product_id');
            $table->index('variant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_review_items');
    }
};