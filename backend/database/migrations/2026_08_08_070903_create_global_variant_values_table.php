<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create(
            'global_variant_values',
            function (Blueprint $table) {

                $table->id();


                /*
                |--------------------------------------------------------------------------
                | GLOBAL VARIANT
                |--------------------------------------------------------------------------
                |
                | Example:
                |
                | Size
                |   ↓
                | Small
                | Medium
                | Large
                |
                */

                $table->foreignId(
                    'global_variant_id'
                )
                ->constrained(
                    'global_variants'
                )
                ->cascadeOnDelete();


                /*
                |--------------------------------------------------------------------------
                | OPTION VALUE
                |--------------------------------------------------------------------------
                |
                | Examples:
                |
                | Small
                | Medium
                | Large
                |
                | Cotton
                | Plastic
                |
                | Red
                | Blue
                |
                */

                $table->string(
                    'value'
                );


                /*
                |--------------------------------------------------------------------------
                | COLOR CODE
                |--------------------------------------------------------------------------
                |
                | শুধুমাত্র Color variant-এর জন্য ব্যবহার হবে।
                |
                | Examples:
                |
                | #EF4444
                | #3B82F6
                | #22C55E
                |
                | Size/Material/Storage-এর ক্ষেত্রে NULL থাকবে।
                |
                */

                $table->string(
                    'color_code',
                    20
                )
                ->nullable();


                /*
                |--------------------------------------------------------------------------
                | DISPLAY ORDER
                |--------------------------------------------------------------------------
                |
                | Example:
                |
                | Small       0
                | Medium      1
                | Large       2
                | Extra-Large 3
                |
                */

                $table->unsignedInteger(
                    'sort_order'
                )
                ->default(0)
                ->index();


                /*
                |--------------------------------------------------------------------------
                | TIMESTAMPS
                |--------------------------------------------------------------------------
                */

                $table->timestamps();


                /*
                |--------------------------------------------------------------------------
                | UNIQUE OPTION VALUE PER VARIANT
                |--------------------------------------------------------------------------
                |
                | একই Size variant-এর মধ্যে দুইবার "Small" রাখা যাবে না।
                |
                */

                $table->unique(
                    [
                        'global_variant_id',
                        'value',
                    ],
                    'global_variant_value_unique'
                );


                /*
                |--------------------------------------------------------------------------
                | INDEX
                |--------------------------------------------------------------------------
                */

                $table->index(
                    [
                        'global_variant_id',
                        'sort_order',
                    ],
                    'global_variant_value_order_index'
                );
            }
        );
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(
            'global_variant_values'
        );
    }
};
