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
        Schema::create('global_variants', function (Blueprint $table) {

            $table->id();


            /*
            |--------------------------------------------------------------------------
            | VARIANT NAME
            |--------------------------------------------------------------------------
            |
            | Examples:
            |
            | Size
            | Material
            | Color
            | Storage
            |
            */

            $table->string('name')
                ->unique();


            /*
            |--------------------------------------------------------------------------
            | VISUAL TYPE
            |--------------------------------------------------------------------------
            |
            | Screenshot অনুযায়ী default:
            |
            | rectangle
            |
            | পরে আমরা support করতে পারি:
            |
            | rectangle
            | circle
            | pill
            | color
            |
            | string রাখছি যাতে future-এ migration change না লাগে।
            |
            */

            $table->string(
                'visual_type',
                50
            )
            ->default('rectangle');


            /*
            |--------------------------------------------------------------------------
            | DISPLAY ORDER
            |--------------------------------------------------------------------------
            |
            | Global Variants page এবং Product page-এ
            | কোন variant আগে দেখাবে।
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
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists(
            'global_variants'
        );
    }
};
