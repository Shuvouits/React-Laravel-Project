<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_configurations', function (Blueprint $table) {
            $table->id();

            $table->boolean('allow_vendor_registration')->default(true);
            $table->boolean('auto_approve_applications')->default(false);

            $table->boolean('enable_subscription_plans')->default(true);
            $table->boolean('require_plan_at_signup')->default(true);
            $table->unsignedInteger('free_trial_days')->default(0);

            $table->decimal('default_commission_rate', 5, 2)->default(10);
            $table->decimal('minimum_withdrawal_amount', 12, 2)->default(1000);

            $table->timestamps();
        });

        DB::table('vendor_configurations')->insert([
            'allow_vendor_registration' => true,
            'auto_approve_applications' => false,
            'enable_subscription_plans' => true,
            'require_plan_at_signup' => true,
            'free_trial_days' => 0,
            'default_commission_rate' => 10,
            'minimum_withdrawal_amount' => 1000,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_configurations');
    }
};
