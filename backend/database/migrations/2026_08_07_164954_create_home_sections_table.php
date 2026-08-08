<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('home_sections', function (Blueprint $table) {
            $table->id();

            $table->string('section_key')->unique();

            $table->string('title');

            $table->boolean('is_active')
                ->default(true);

            $table->unsignedInteger('sort_order')
                ->default(0);

            $table->timestamps();
        });


        /*
        |--------------------------------------------------------------------------
        | DEFAULT HOME PAGE SECTIONS
        |--------------------------------------------------------------------------
        */

        DB::table('home_sections')->insert([

            [
                'section_key' => 'hero',
                'title' => 'Hero',
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'section_key' => 'featured_categories',
                'title' => 'Featured Categories',
                'is_active' => true,
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'section_key' => 'products_on_sale',
                'title' => 'Products on Sale',
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'section_key' => 'promotions',
                'title' => 'Promotions & Offers',
                'is_active' => true,
                'sort_order' => 4,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'section_key' => 'featured_products',
                'title' => 'Featured Products',
                'is_active' => true,
                'sort_order' => 5,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'section_key' => 'top_vendors',
                'title' => 'Top Vendors',
                'is_active' => true,
                'sort_order' => 6,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'section_key' => 'become_a_vendor',
                'title' => 'Become a Vendor',
                'is_active' => true,
                'sort_order' => 7,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'section_key' => 'top_articles',
                'title' => 'Top Articles',
                'is_active' => true,
                'sort_order' => 8,
                'created_at' => now(),
                'updated_at' => now(),
            ],

            [
                'section_key' => 'from_instagram',
                'title' => 'From Instagram',
                'is_active' => true,
                'sort_order' => 9,
                'created_at' => now(),
                'updated_at' => now(),
            ],

        ]);
    }


    public function down(): void
    {
        Schema::dropIfExists('home_sections');
    }
};
