<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendors', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            $table->foreignId('vendor_application_id')->nullable()->unique()->constrained('vendor_applications')->nullOnDelete();

            $table->foreignId('vendor_plan_id')->nullable()->constrained('vendor_plans')->nullOnDelete();

            $table->string('store_name');
            $table->string('slug')->unique();

            $table->text('description')->nullable();

            $table->string('logo')->nullable();
            $table->string('banner')->nullable();

            $table->enum('status', [
                'pending',
                'payment_required',
                'approved',
                'suspended',
                'rejected',
            ])->default('pending')->index();

            $table->enum('billing_cycle', [
                'monthly',
                'yearly',
            ])->nullable();

            $table->decimal('commission_rate', 5, 2)->default(10);

            $table->timestamp('approved_at')->nullable();
            $table->timestamp('suspended_at')->nullable();
            $table->timestamp('rejected_at')->nullable();

            $table->text('admin_note')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendors');
    }
};