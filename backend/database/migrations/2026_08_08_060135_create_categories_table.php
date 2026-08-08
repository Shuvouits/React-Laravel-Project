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
        Schema::create('categories', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | BASIC DETAILS
            |--------------------------------------------------------------------------
            */

            $table->string('name');

            $table->string('slug')->unique();

            $table->text('description')->nullable();


            /*
            |--------------------------------------------------------------------------
            | MEDIA
            |--------------------------------------------------------------------------
            |
            | Category icon / cover image.
            | Example:
            | uploads/categories/accessories.png
            |
            */

            $table->string('image')->nullable();


            /*
            |--------------------------------------------------------------------------
            | CATEGORY HIERARCHY
            |--------------------------------------------------------------------------
            |
            | parent_id = NULL → Parent / Root Category
            |
            | Example:
            |
            | Electronics
            |   ├── Phones
            |   ├── Laptops
            |   └── Accessories
            |
            */

            $table->foreignId('parent_id')
                ->nullable()
                ->constrained('categories')
                ->nullOnDelete()
                ->index();


            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'active',
                'inactive',
            ])
            ->default('active')
            ->index();


            /*
            |--------------------------------------------------------------------------
            | FEATURED
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_featured')
                ->default(false)
                ->index();


            /*
            |--------------------------------------------------------------------------
            | DISPLAY ORDER
            |--------------------------------------------------------------------------
            |
            | Lower numbers appear first.
            |
            */

            $table->unsignedInteger('display_order')
                ->default(0)
                ->index();


            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */

            $table->string('seo_title', 70)
                ->nullable();

            $table->string('seo_description', 160)
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | TAGS
            |--------------------------------------------------------------------------
            |
            | Example:
            |
            | [
            |   "electronics",
            |   "accessories",
            |   "cables"
            | ]
            |
            */

            $table->json('tags')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $table->timestamps();


            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index([
                'status',
                'is_featured',
            ]);

            $table->index([
                'parent_id',
                'display_order',
            ]);
        });
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
