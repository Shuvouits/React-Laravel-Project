
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_reviews', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')
                ->constrained('products')
                ->cascadeOnDelete();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->unsignedTinyInteger('rating');

            $table->string('title')
                ->nullable();

            $table->text('review');

            $table->enum('status', [
                'pending',
                'approved',
                'rejected',
            ])->default('approved');

            $table->boolean('is_verified_purchase')
                ->default(false);

            $table->unsignedInteger('helpful_count')
                ->default(0);

            $table->timestamp('approved_at')
                ->nullable();

            $table->timestamps();

            $table->unique([
                'product_id',
                'user_id',
            ]);

            $table->index([
                'product_id',
                'status',
            ]);

            $table->index('rating');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_reviews');
    }
};
