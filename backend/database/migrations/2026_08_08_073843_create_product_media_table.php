<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'product_media',
            function (Blueprint $table) {

                $table->id();

                $table->foreignId('product_id')
                    ->constrained('products')
                    ->cascadeOnDelete();


                /*
                |--------------------------------------------------------------------------
                | MEDIA
                |--------------------------------------------------------------------------
                */

                $table->string('file_path');

                $table->enum('media_type', [
                    'image',
                    'video',
                ])
                ->default('image');

                $table->string('alt_text')
                    ->nullable();

                $table->boolean('is_cover')
                    ->default(false);

                $table->unsignedInteger('sort_order')
                    ->default(0);

                $table->timestamps();


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
            'product_media'
        );
    }
};
