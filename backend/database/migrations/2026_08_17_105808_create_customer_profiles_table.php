<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_profiles', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | SEGMENTATION
            |--------------------------------------------------------------------------
            */

            $table->string('acquisition_source', 100)
                ->nullable();

            $table->json('tags')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | LOYALTY
            |--------------------------------------------------------------------------
            */

            $table->enum('loyalty_tier', [
                'bronze',
                'silver',
                'gold',
                'platinum',
            ])->default('bronze');

            $table->unsignedInteger('loyalty_points')
                ->default(0);

            /*
            |--------------------------------------------------------------------------
            | COMMUNICATION PREFERENCES
            |--------------------------------------------------------------------------
            */

            $table->boolean('marketing_opt_in')
                ->default(false);

            $table->boolean('order_updates')
                ->default(true);

            $table->boolean('promotions')
                ->default(false);

            $table->boolean('newsletter')
                ->default(false);

            $table->boolean('price_drops')
                ->default(false);

            $table->boolean('back_in_stock')
                ->default(false);

            /*
            |--------------------------------------------------------------------------
            | CUSTOMER ACTIVITY
            |--------------------------------------------------------------------------
            */

            $table->timestamp('last_active_at')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | INTERNAL NOTES
            |--------------------------------------------------------------------------
            */

            $table->text('internal_notes')
                ->nullable();

            $table->timestamps();

            $table->index('loyalty_tier');
            $table->index('last_active_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_profiles');
    }
};