<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'product_variants',
            function (Blueprint $table) {

                $table->id();

                $table->foreignId('product_id')
                    ->constrained('products')
                    ->cascadeOnDelete();


                /*
                |--------------------------------------------------------------------------
                | VARIANT TITLE
                |--------------------------------------------------------------------------
                |
                | Examples:
                |
                | Blue
                | Green
                | Blue / Large
                | Black / XL
                |
                */

                $table->string('title');


                /*
                |--------------------------------------------------------------------------
                | UNIQUE COMBINATION KEY
                |--------------------------------------------------------------------------
                |
                | Example:
                |
                | product option value IDs:
                | 3-7
                |
                */

                $table->string(
                    'combination_key'
                );


                /*
                |--------------------------------------------------------------------------
                | VARIANT MEDIA
                |--------------------------------------------------------------------------
                */

                $table->foreignId(
                    'product_media_id'
                )
                ->nullable()
                ->constrained(
                    'product_media'
                )
                ->nullOnDelete();


                /*
                |--------------------------------------------------------------------------
                | PRICING
                |--------------------------------------------------------------------------
                */

                $table->decimal(
                    'price',
                    12,
                    2
                )
                ->nullable();

                $table->decimal(
                    'compare_at_price',
                    12,
                    2
                )
                ->nullable();

                $table->decimal(
                    'cost_per_item',
                    12,
                    2
                )
                ->nullable();


                /*
                |--------------------------------------------------------------------------
                | INVENTORY
                |--------------------------------------------------------------------------
                */

                $table->string('sku')
                    ->nullable()
                    ->unique();

                $table->string('barcode')
                    ->nullable()
                    ->index();

                $table->integer('quantity')
                    ->default(0);


                /*
                |--------------------------------------------------------------------------
                | STATUS
                |--------------------------------------------------------------------------
                */

                $table->boolean('is_active')
                    ->default(true);

                $table->unsignedInteger(
                    'sort_order'
                )
                ->default(0);

                $table->timestamps();


                /*
                |--------------------------------------------------------------------------
                | ONE COMBINATION PER PRODUCT
                |--------------------------------------------------------------------------
                */

                $table->unique(
                    [
                        'product_id',
                        'combination_key',
                    ],
                    'product_variant_combination_unique'
                );


                $table->index([
                    'product_id',
                    'sort_order',
                ]);
            }
        );
    }


    public function down(): void
    {
        Schema::dropIfExists(
            'product_variants'
        );
    }
};
