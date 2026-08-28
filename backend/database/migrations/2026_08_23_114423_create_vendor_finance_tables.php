<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_expenses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_id')
                ->constrained('vendors')
                ->cascadeOnDelete();

            $table->date('expense_date');
            $table->decimal('amount', 12, 2);
            $table->string('currency', 10)->default('USD');
            $table->string('description');
            $table->string('category', 100)->default('other');
            $table->string('paid_to')->nullable();
            $table->timestamps();

            $table->index(['vendor_id', 'expense_date']);
            $table->index(['vendor_id', 'category']);
        });

        Schema::create('vendor_payouts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_id')
                ->constrained('vendors')
                ->cascadeOnDelete();

            $table->string('payout_no')->unique();

            $table->enum('status', [
                'pending',
                'processing',
                'paid',
                'failed',
                'cancelled',
            ])->default('pending');

            $table->date('period_start');
            $table->date('period_end');

            $table->decimal('gross_sales', 12, 2)->default(0);
            $table->decimal('refund_total', 12, 2)->default(0);
            $table->decimal('commission_total', 12, 2)->default(0);
            $table->decimal('adjustment_total', 12, 2)->default(0);
            $table->decimal('net_payout', 12, 2)->default(0);

            $table->string('currency', 10)->default('USD');
            $table->string('payment_method')->nullable();
            $table->string('payment_reference')->nullable();
            $table->text('failure_reason')->nullable();
            $table->text('note')->nullable();

            $table->timestamp('processing_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('failed_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->timestamps();

            $table->index(['vendor_id', 'status']);
            $table->index(['vendor_id', 'period_start', 'period_end']);
        });

        Schema::create('vendor_payout_orders', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_payout_id')
                ->constrained('vendor_payouts')
                ->cascadeOnDelete();

            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();

            $table->decimal('gross_amount', 12, 2)->default(0);
            $table->decimal('refund_amount', 12, 2)->default(0);
            $table->decimal('commission_amount', 12, 2)->default(0);
            $table->decimal('net_amount', 12, 2)->default(0);

            $table->timestamps();

            $table->unique([
                'vendor_payout_id',
                'order_id',
            ]);
        });

        Schema::create('vendor_finance_entries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_id')
                ->constrained('vendors')
                ->cascadeOnDelete();

            $table->foreignId('order_id')
                ->nullable()
                ->constrained('orders')
                ->nullOnDelete();

            $table->foreignId('vendor_payout_id')
                ->nullable()
                ->constrained('vendor_payouts')
                ->nullOnDelete();

            $table->enum('type', [
                'sale',
                'refund',
                'commission',
                'commission_refund',
                'payout',
                'adjustment',
            ]);
            $table->string('event_key')->unique();

            $table->string('reference', 100)->nullable();

            $table->decimal('held_amount', 12, 2)->default(0);
            $table->decimal('owed_amount', 12, 2)->default(0);

            $table->string('currency', 10)->default('USD');
            $table->text('description')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('occurred_at');
            $table->timestamps();

            $table->index(['vendor_id', 'occurred_at']);
            $table->index(['vendor_id', 'type']);
            $table->index(['vendor_id', 'reference']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_finance_entries');
        Schema::dropIfExists('vendor_payout_orders');
        Schema::dropIfExists('vendor_payouts');
        Schema::dropIfExists('vendor_expenses');
    }
};
