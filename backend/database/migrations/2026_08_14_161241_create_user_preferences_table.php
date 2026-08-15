<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_preferences', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained('users')
                ->cascadeOnDelete();

            $table->boolean('order_updates')->default(true);
            $table->boolean('promotions_deals')->default(true);
            $table->boolean('newsletter')->default(false);
            $table->boolean('price_drop_alerts')->default(true);
            $table->boolean('back_in_stock_alerts')->default(true);
            $table->boolean('marketing_emails')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_preferences');
    }
};