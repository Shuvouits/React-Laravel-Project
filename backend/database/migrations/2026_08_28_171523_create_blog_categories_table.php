<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_categories', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('slug')->unique();

            $table->text('description')->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->unsignedInteger('display_order')
                ->default(0);

            $table->timestamps();

            $table->index('is_active');
            $table->index('display_order');
            $table->index([
                'is_active',
                'display_order',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_categories');
    }
};