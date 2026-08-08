<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('collections', function (Blueprint $table) {

            $table->id();


            /*
            |--------------------------------------------------------------------------
            | BASIC DETAILS
            |--------------------------------------------------------------------------
            */

            $table->string('title');

            $table->string('slug')
                ->unique();

            $table->text('description')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | COLLECTION IMAGE
            |--------------------------------------------------------------------------
            |
            | Example:
            |
            | uploads/collections/kids-joy.webp
            |
            */

            $table->string('image')
                ->nullable();


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
            | PUBLISHING
            |--------------------------------------------------------------------------
            */

            $table->boolean('online_store')
                ->default(true);

            $table->boolean('point_of_sale')
                ->default(false);


            /*
            |--------------------------------------------------------------------------
            | COLLECTION TYPE
            |--------------------------------------------------------------------------
            |
            | manual:
            | Admin selects products individually.
            |
            | automated:
            | Products will later be selected by conditions.
            |
            */

            $table->enum('collection_type', [
                'manual',
                'automated',
            ])
            ->default('manual')
            ->index();


            /*
            |--------------------------------------------------------------------------
            | PRODUCT SORTING
            |--------------------------------------------------------------------------
            |
            | Screenshot:
            |
            | Sort Order
            | Manual
            |
            | Future options are already allowed without another migration.
            |
            */

            $table->string(
                'sort_order',
                50
            )
            ->default('manual');


            /*
            |--------------------------------------------------------------------------
            | DISPLAY POSITION
            |--------------------------------------------------------------------------
            |
            | Lower numbers appear first.
            |
            | This controls where the collection itself appears.
            |
            */

            $table->unsignedInteger(
                'display_position'
            )
            ->default(0)
            ->index();


            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */

            $table->string(
                'seo_title',
                70
            )
            ->nullable();

            $table->string(
                'seo_description',
                160
            )
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
                'collection_type',
            ]);

            $table->index([
                'online_store',
                'point_of_sale',
            ]);
        });
    }


    public function down(): void
    {
        Schema::dropIfExists(
            'collections'
        );
    }
};
