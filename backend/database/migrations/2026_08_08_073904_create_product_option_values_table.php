<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'product_option_values',
            function (Blueprint $table) {

                $table->id();

                $table->foreignId(
                    'product_option_id'
                )
                ->constrained(
                    'product_options'
                )
                ->cascadeOnDelete();


                /*
                |--------------------------------------------------------------------------
                | ORIGINAL GLOBAL VALUE
                |--------------------------------------------------------------------------
                */

                $table->foreignId(
                    'global_variant_value_id'
                )
                ->nullable()
                ->constrained(
                    'global_variant_values'
                )
                ->nullOnDelete();


                /*
                |--------------------------------------------------------------------------
                | SNAPSHOT
                |--------------------------------------------------------------------------
                */

                $table->string('value');

                $table->string(
                    'color_code',
                    20
                )
                ->nullable();

                $table->unsignedInteger(
                    'sort_order'
                )
                ->default(0);

                $table->timestamps();


                $table->unique(
                    [
                        'product_option_id',
                        'global_variant_value_id',
                    ],
                    'product_option_global_value_unique'
                );
            }
        );
    }


    public function down(): void
    {
        Schema::dropIfExists(
            'product_option_values'
        );
    }
};
