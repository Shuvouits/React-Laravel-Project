<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_reviews', function (Blueprint $table) {
            $table->id();

            $table->string('review_no')->unique();

            $table->foreignId('location_id')
                ->constrained('inventory_locations');

            $table->enum('status', [
                'draft',
                'in_progress',
                'completed',
                'cancelled',
            ])->default('draft');

            $table->text('note')->nullable();

            $table->unsignedBigInteger('created_by')->nullable();

            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->timestamps();

            $table->index('location_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_reviews');
    }
};