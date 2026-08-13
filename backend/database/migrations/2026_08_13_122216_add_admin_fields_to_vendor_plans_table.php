<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vendor_plans', function (Blueprint $table) {
            $table->text('description')->nullable()->after('slug');

            $table->unsignedInteger('trial_days')->default(0)->after('commission_rate');

            $table->boolean('is_default')->default(false)->after('is_active');

            $table->boolean('ai_authoring')->default(false)->after('staff_limit');

            $table->string('stripe_product_id')->nullable()->after('ai_authoring');
            $table->string('stripe_price_id')->nullable()->after('stripe_product_id');
        });
    }

    public function down(): void
    {
        Schema::table('vendor_plans', function (Blueprint $table) {
            $table->dropColumn([
                'description',
                'trial_days',
                'is_default',
                'ai_authoring',
                'stripe_product_id',
                'stripe_price_id',
            ]);
        });
    }
};