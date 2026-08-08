<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'collection_product',
            function (Blueprint $table) {

                $table->id();


                /*
                |--------------------------------------------------------------------------
                | COLLECTION
                |--------------------------------------------------------------------------
                */

                $table->foreignId(
                    'collection_id'
                )
                ->constrained(
                    'collections'
                )
                ->cascadeOnDelete();


                /*
                |--------------------------------------------------------------------------
                | PRODUCT
                |--------------------------------------------------------------------------
                */

                $table->foreignId(
                    'product_id'
                )
                ->constrained(
                    'products'
                )
                ->cascadeOnDelete();


                /*
                |--------------------------------------------------------------------------
                | MANUAL PRODUCT ORDER
                |--------------------------------------------------------------------------
                |
                | Product drag/drop order inside collection.
                |
                */

                $table->unsignedInteger(
                    'sort_order'
                )
                ->default(0);


                /*
                |--------------------------------------------------------------------------
                | TIMESTAMPS
                |--------------------------------------------------------------------------
                */

                $table->timestamps();


                /*
                |--------------------------------------------------------------------------
                | PREVENT DUPLICATES
                |--------------------------------------------------------------------------
                |
                | একই product একই collection-এ দুইবার থাকবে না।
                |
                */

                $table->unique(
                    [
                        'collection_id',
                        'product_id',
                    ],
                    'collection_product_unique'
                );


                /*
                |--------------------------------------------------------------------------
                | INDEX
                |--------------------------------------------------------------------------
                */

                $table->index(
                    [
                        'collection_id',
                        'sort_order',
                    ],
                    'collection_product_order_index'
                );
            }
        );
    }


    public function down(): void
    {
        Schema::dropIfExists(
            'collection_product'
        );
    }
};
