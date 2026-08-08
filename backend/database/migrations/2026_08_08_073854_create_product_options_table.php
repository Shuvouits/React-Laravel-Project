<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'product_options',
            function (Blueprint $table) {

                $table->id();

                $table->foreignId('product_id')
                    ->constrained('products')
                    ->cascadeOnDelete();


                /*
                |--------------------------------------------------------------------------
                | GLOBAL VARIANT
                |--------------------------------------------------------------------------
                */

                $table->foreignId(
                    'global_variant_id'
                )
                ->nullable()
                ->constrained(
                    'global_variants'
                )
                ->nullOnDelete();


                /*
                |--------------------------------------------------------------------------
                | SNAPSHOT NAME
                |--------------------------------------------------------------------------
                |
                | Example:
                |
                | Color
                | Size
                | Material
                |
                */

                $table->string('name');

                $table->unsignedInteger(
                    'sort_order'
                )
                ->default(0);

                $table->timestamps();


                $table->unique([
                    'product_id',
                    'global_variant_id',
                ]);
            }
        );
    }


    public function down(): void
    {
        Schema::dropIfExists(
            'product_options'
        );
    }
};
