<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_content_sections', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();

            $table->string('title');
            $table->longText('content')->nullable();

            $table->unsignedInteger('sort_order')->default(0);
            $table->boolean('is_enabled')->default(true);

            $table->timestamps();

            $table->index(['product_id', 'sort_order']);
            $table->index(['product_id', 'is_enabled']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_content_sections');
    }
};