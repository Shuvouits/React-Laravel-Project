<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_applications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            $table->enum('status', [
                'draft',
                'pending',
                'approved',
                'rejected',
            ])->default('draft')->index();

            $table->string('store_name')->nullable();
            $table->text('store_description')->nullable();

            $table->string('country', 100)->nullable();
            $table->string('state', 100)->nullable();

            $table->string('phone_country_code', 10)->nullable();
            $table->string('phone', 50)->nullable();

            $table->json('documents')->nullable();

            $table->foreignId('vendor_plan_id')->nullable()->constrained('vendor_plans')->nullOnDelete();

            $table->enum('billing_cycle', [
                'monthly',
                'yearly',
            ])->nullable();

            $table->json('plan_snapshot')->nullable();

            $table->timestamp('terms_accepted_at')->nullable();
            $table->timestamp('submitted_at')->nullable();

            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('rejection_reason')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_applications');
    }
};
