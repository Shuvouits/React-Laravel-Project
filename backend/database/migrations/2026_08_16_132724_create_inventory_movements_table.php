<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
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

            $table->enum('type', [
                'initial',
                'restock',
                'sale',
                'return',
                'transfer_out',
                'transfer_in',
                'adjustment',
                'damaged',
                'reserved',
                'released',
            ]);

            $table->integer('quantity_change');

            $table->unsignedInteger('quantity_before')->default(0);

            $table->unsignedInteger('quantity_after')->default(0);

            $table->string('reference_type')->nullable();

            $table->unsignedBigInteger('reference_id')->nullable();

            $table->string('reason')->nullable();

            $table->text('note')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();

            $table->timestamps();

            $table->index('location_id');
            $table->index('product_id');
            $table->index('variant_id');
            $table->index('type');

            $table->index([
                'reference_type',
                'reference_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};