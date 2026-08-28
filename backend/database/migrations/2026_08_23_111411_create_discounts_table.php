<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discounts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('code', 100);
            $table->string('label')->nullable();
            $table->text('description')->nullable();

            $table->enum('status', [
                'active',
                'inactive',
            ])->default('active');

            $table->enum('type', [
                'percentage',
                'fixed',
            ]);

            $table->decimal('value', 12, 2);
            $table->decimal('minimum_order_amount', 12, 2)->default(0);
            $table->decimal('maximum_discount_cap', 12, 2)->nullable();

            $table->unsignedInteger('total_usage_limit')->nullable();
            $table->unsignedInteger('per_customer_usage_limit')->nullable();
            $table->unsignedInteger('used_count')->default(0);

            $table->dateTime('starts_at');
            $table->dateTime('ends_at')->nullable();

            $table->timestamps();

            $table->unique(['vendor_id', 'code']);
            $table->index(['vendor_id', 'status']);
            $table->index(['starts_at', 'ends_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('discounts');
    }
};
