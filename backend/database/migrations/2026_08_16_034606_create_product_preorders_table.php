<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_preorders', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')->unique()->constrained('products')->cascadeOnDelete();

            // RELEASE WINDOW
            $table->timestamp('preorder_start_at')->nullable()->index();
            $table->timestamp('preorder_end_at')->nullable()->index();

            // EXPECTED SHIPPING WINDOW
            $table->date('expected_ship_from')->nullable()->index();
            $table->date('expected_ship_to')->nullable();

            // PAYMENT
            $table->enum('payment_type', [
                'full',
                'deposit',
                'pay_later',
            ])->default('full')->index();

            $table->enum('deposit_type', [
                'fixed',
                'percentage',
            ])->nullable();

            $table->decimal('deposit_value', 12, 2)->nullable();
            $table->timestamp('balance_due_at')->nullable();

            // RESERVATION LIMITS
            $table->unsignedInteger('max_preorder_quantity')->nullable();
            $table->unsignedInteger('max_quantity_per_customer')->nullable();
            $table->unsignedInteger('reserved_quantity')->default(0)->index();

            // OPTIONS
            $table->boolean('allow_full_payment')->default(true);
            $table->boolean('show_remaining_quantity')->default(false);

            // CUSTOMER INFORMATION
            $table->string('badge_text', 100)->nullable();
            $table->text('preorder_message')->nullable();
            $table->text('terms')->nullable();

            $table->timestamps();

            $table->index([
                'expected_ship_from',
                'reserved_quantity',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_preorders');
    }
};