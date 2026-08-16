<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_levels', function (Blueprint $table) {
            $table->id();

            $table->foreignId('location_id')
                ->constrained('inventory_locations')
                ->cascadeOnDelete();

            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();

            $table->foreignId('variant_id')
                ->nullable()
                ->constrained('product_variants')
                ->cascadeOnDelete();

            $table->unsignedInteger('on_hand')->default(0);

            $table->unsignedInteger('committed')->default(0);

            $table->unsignedInteger('unavailable')->default(0);

            $table->unsignedInteger('incoming')->default(0);

            $table->unsignedInteger('low_stock_threshold')->default(10);

            $table->boolean('track_quantity')->default(true);

            $table->timestamps();

            $table->index('location_id');
            $table->index('product_id');
            $table->index('variant_id');
            $table->index('on_hand');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_levels');
    }
};