<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hero_slides', function (Blueprint $table) {
            $table->id();

            // Cover image path
            $table->string('image');

            // SEO / accessibility alt text
            $table->string('image_alt')->nullable();

            // Slide click destination
            $table->string('link', 2048)->nullable();

            // Drag & drop ordering
            $table->unsignedInteger('sort_order')->default(0);

            // Eye icon show / hide
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hero_slides');
    }
};
