<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pos_refunds', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pos_sale_id')
                ->constrained('pos_sales')
                ->cascadeOnDelete();

            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();

            $table->foreignId('vendor_id')
                ->nullable()
                ->constrained('vendors')
                ->nullOnDelete();

            $table->foreignId('location_id')
                ->constrained('inventory_locations')
                ->restrictOnDelete();

            $table->foreignId('register_session_id')
                ->nullable()
                ->constrained('pos_register_sessions')
                ->nullOnDelete();

            $table->foreignId('processed_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->string('refund_number', 60)
                ->unique();

            $table->string('status', 30)
                ->default('completed')
                ->index();

            $table->string('reason', 255)
                ->nullable();

            $table->text('notes')
                ->nullable();

            $table->decimal('subtotal', 14, 2)
                ->default(0);

            $table->decimal('tax_total', 14, 2)
                ->default(0);

            $table->decimal('total', 14, 2)
                ->default(0);

            $table->string('currency', 3)
                ->default('USD');

            $table->string('payment_method', 50)
                ->nullable();

            $table->string('payment_reference', 255)
                ->nullable();

            $table->boolean('restock_items')
                ->default(true);

            $table->json('metadata')
                ->nullable();

            $table->timestamp('completed_at')
                ->nullable();

            $table->timestamps();

            $table->index([
                'vendor_id',
                'location_id',
                'status',
            ]);

            $table->index([
                'order_id',
                'status',
            ]);
        });

        Schema::create('pos_refund_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('pos_refund_id')
                ->constrained('pos_refunds')
                ->cascadeOnDelete();

            $table->foreignId('order_item_id')
                ->constrained('order_items')
                ->restrictOnDelete();

            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            $table->foreignId('variant_id')
                ->nullable()
                ->constrained('product_variants')
                ->nullOnDelete();

            $table->string('product_title', 255);

            $table->string('variant_title', 255)
                ->nullable();

            $table->string('sku', 191)
                ->nullable();

            $table->unsignedInteger('quantity');

            $table->decimal('unit_price', 14, 2)
                ->default(0);

            $table->decimal('line_total', 14, 2)
                ->default(0);

            $table->boolean('restocked')
                ->default(false);

            $table->timestamps();

            $table->index([
                'order_item_id',
                'product_id',
                'variant_id',
            ]);
        });

        Schema::table('pos_sales', function (Blueprint $table) {
            $table->decimal('refunded_total', 14, 2)
                ->default(0)
                ->after('change_amount');

            $table->timestamp('refunded_at')
                ->nullable()
                ->after('completed_at');
        });
    }

    public function down(): void
    {
        Schema::table('pos_sales', function (Blueprint $table) {
            $table->dropColumn([
                'refunded_total',
                'refunded_at',
            ]);
        });

        Schema::dropIfExists('pos_refund_items');
        Schema::dropIfExists('pos_refunds');
    }
};
