<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_posts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('author_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('title');
            $table->string('slug')->unique();

            $table->text('excerpt')->nullable();
            $table->longText('content');

            $table->string('featured_image')->nullable();
            $table->string('featured_image_alt')->nullable();

            $table->enum('status', [
                'draft',
                'published',
                'scheduled',
                'archived',
            ])->default('draft');

            $table->enum('visibility', [
                'public',
                'private',
            ])->default('public');

            $table->boolean('is_featured')
                ->default(false);

            $table->boolean('allow_comments')
                ->default(true);

            $table->json('tags')->nullable();

            $table->string('seo_title', 70)->nullable();
            $table->text('meta_description')->nullable();

            $table->unsignedBigInteger('views_count')
                ->default(0);

            $table->unsignedInteger('comments_count')
                ->default(0);

            $table->timestamp('published_at')->nullable();
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('archived_at')->nullable();

            $table->timestamps();

            $table->index('author_id');
            $table->index('status');
            $table->index('visibility');
            $table->index('is_featured');
            $table->index('published_at');
            $table->index('scheduled_at');

            $table->index([
                'status',
                'visibility',
                'published_at',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
    }
};