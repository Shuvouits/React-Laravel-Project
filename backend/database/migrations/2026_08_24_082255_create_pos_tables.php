<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement(
            'ALTER TABLE orders
            DROP FOREIGN KEY orders_user_id_foreign'
        );

        DB::statement(
            'ALTER TABLE orders
            MODIFY user_id BIGINT UNSIGNED NULL'
        );

        DB::statement(
            'ALTER TABLE orders
            ADD CONSTRAINT orders_user_id_foreign
            FOREIGN KEY (user_id)
            REFERENCES users(id)
            ON DELETE SET NULL'
        );

        Schema::create('pos_register_sessions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_id')
                ->nullable()
                ->constrained('vendors')
                ->nullOnDelete();

            $table->foreignId('location_id')
                ->constrained('inventory_locations')
                ->restrictOnDelete();

            $table->foreignId('cashier_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('session_number', 60)
                ->unique();

            $table->string('status', 30)
                ->default('open');

            $table->decimal('opening_balance', 12, 2)
                ->default(0);

            $table->decimal('cash_sales', 12, 2)
                ->default(0);

            $table->decimal('cash_refunds', 12, 2)
                ->default(0);

            $table->decimal('expected_balance', 12, 2)
                ->nullable();

            $table->decimal('closing_balance', 12, 2)
                ->nullable();

            $table->decimal('balance_difference', 12, 2)
                ->nullable();

            $table->text('opening_note')
                ->nullable();

            $table->text('closing_note')
                ->nullable();

            $table->timestamp('opened_at')
                ->nullable();

            $table->timestamp('closed_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'vendor_id',
                'location_id',
                'status',
            ]);

            $table->index([
                'cashier_id',
                'status',
            ]);
        });

        Schema::create('pos_sales', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->unique()
                ->constrained('orders')
                ->cascadeOnDelete();

            $table->foreignId('register_session_id')
                ->nullable()
                ->constrained('pos_register_sessions')
                ->nullOnDelete();

            $table->foreignId('vendor_id')
                ->nullable()
                ->constrained('vendors')
                ->nullOnDelete();

            $table->foreignId('location_id')
                ->constrained('inventory_locations')
                ->restrictOnDelete();

            $table->foreignId('cashier_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('customer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('sale_number', 60)
                ->unique();

            $table->string('status', 30)
                ->default('completed');

            $table->string('currency', 10)
                ->default('USD');

            $table->decimal('subtotal', 12, 2)
                ->default(0);

            $table->string('discount_type', 30)
                ->nullable();

            $table->decimal('discount_value', 12, 2)
                ->default(0);

            $table->decimal('discount_total', 12, 2)
                ->default(0);

            $table->decimal('tax_rate', 8, 4)
                ->default(0);

            $table->decimal('tax_total', 12, 2)
                ->default(0);

            $table->decimal('grand_total', 12, 2)
                ->default(0);

            $table->decimal('amount_paid', 12, 2)
                ->default(0);

            $table->decimal('change_amount', 12, 2)
                ->default(0);

            $table->decimal('refunded_total', 14, 2)
                ->default(0);

            $table->string('payment_status', 30)
                ->default('paid');

            $table->string('primary_payment_method', 40)
                ->nullable();

            $table->json('discount_data')
                ->nullable();

            $table->json('cart_snapshot')
                ->nullable();

            $table->text('customer_note')
                ->nullable();

            $table->text('internal_note')
                ->nullable();

            $table->timestamp('completed_at')
                ->nullable();

            $table->timestamp('refunded_at')
                ->nullable();

            $table->timestamp('cancelled_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'vendor_id',
                'location_id',
                'status',
            ]);

            $table->index([
                'customer_id',
                'completed_at',
            ]);

            $table->index([
                'cashier_id',
                'completed_at',
            ]);
        });

        Schema::create('pos_payments', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pos_sale_id')
                ->constrained('pos_sales')
                ->cascadeOnDelete();

            $table->foreignId('received_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('payment_method', 40);

            $table->string('status', 30)
                ->default('succeeded');

            $table->decimal('amount', 12, 2);

            $table->string('currency', 10)
                ->default('USD');

            $table->string('reference', 191)
                ->nullable();

            $table->string('card_last_four', 4)
                ->nullable();

            $table->json('metadata')
                ->nullable();

            $table->timestamp('paid_at')
                ->nullable();

            $table->timestamp('refunded_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'payment_method',
                'status',
            ]);

            $table->index('reference');
        });

        Schema::create('pos_held_sales', function (Blueprint $table) {
            $table->id();

            $table->foreignId('vendor_id')
                ->nullable()
                ->constrained('vendors')
                ->nullOnDelete();

            $table->foreignId('location_id')
                ->constrained('inventory_locations')
                ->cascadeOnDelete();

            $table->foreignId('cashier_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('customer_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->string('reference', 60)
                ->unique();

            $table->string('status', 30)
                ->default('held');

            $table->string('currency', 10)
                ->default('USD');

            $table->json('cart_data');

            $table->json('customer_snapshot')
                ->nullable();

            $table->json('discount_data')
                ->nullable();

            $table->decimal('subtotal', 12, 2)
                ->default(0);

            $table->decimal('discount_total', 12, 2)
                ->default(0);

            $table->decimal('tax_rate', 8, 4)
                ->default(0);

            $table->decimal('tax_total', 12, 2)
                ->default(0);

            $table->decimal('grand_total', 12, 2)
                ->default(0);

            $table->text('note')
                ->nullable();

            $table->timestamp('held_at')
                ->nullable();

            $table->timestamp('resumed_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'vendor_id',
                'location_id',
                'status',
            ]);

            $table->index([
                'cashier_id',
                'status',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pos_held_sales');
        Schema::dropIfExists('pos_payments');
        Schema::dropIfExists('pos_sales');
        Schema::dropIfExists('pos_register_sessions');
    }
};
