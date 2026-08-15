<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            $table->string('order_no', 40)->unique();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('status', 30)->default('pending');

            $table->string('payment_method', 30);
            $table->string('payment_status', 30)->default('pending');

            $table->string('shipping_method', 30);
            $table->string('currency', 10)->default('USD');

            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount_total', 12, 2)->default(0);
            $table->decimal('shipping_total', 12, 2)->default(0);
            $table->decimal('tax_total', 12, 2)->default(0);
            $table->decimal('grand_total', 12, 2)->default(0);

            $table->string('coupon_code')->nullable();

            $table->boolean('billing_same_as_shipping')->default(true);
            $table->boolean('marketing_emails')->default(false);

            $table->text('customer_note')->nullable();

            $table->timestamp('placed_at')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->index('status');
            $table->index('payment_status');
            $table->index('payment_method');
            $table->index('placed_at');


            $table->string('channel', 30)->default('online_store');
$table->string('fulfillment_status', 30)->default('unfulfilled');
$table->string('delivery_status', 30)->default('not_shipped');

$table->timestamp('fulfilled_at')->nullable();
$table->timestamp('shipped_at')->nullable();
$table->timestamp('archived_at')->nullable();

            $table->timestamps();








        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();

          $table->unsignedBigInteger('store_id')->nullable();
          $table->string('store_name')->nullable();

            $table->foreignId('product_id')
                ->nullable()
                ->constrained('products')
                ->nullOnDelete();

            $table->foreignId('variant_id')
                ->nullable()
                ->constrained('product_variants')
                ->nullOnDelete();

            $table->string('product_name');
            $table->string('product_slug')->nullable();
            $table->string('variant_name')->nullable();
            $table->string('sku')->nullable();

            $table->unsignedInteger('quantity');

            $table->decimal('unit_price', 12, 2);
            $table->decimal('compare_at_price', 12, 2)->nullable();
            $table->decimal('line_total', 12, 2);

            $table->timestamps();

            $table->index('store_id');
            $table->index('product_id');
            $table->index('variant_id');
        });

        Schema::create('order_addresses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained('orders')
                ->cascadeOnDelete();

            $table->foreignId('source_address_id')
                ->nullable()
                ->constrained('customer_addresses')
                ->nullOnDelete();

            $table->string('address_type', 20);

            $table->string('label')->nullable();

            $table->string('first_name');
            $table->string('last_name')->nullable();

            $table->string('phone')->nullable();

            $table->string('address_line1');
            $table->string('address_line2')->nullable();

            $table->string('city');
            $table->string('state')->nullable();
            $table->string('postal_code')->nullable();
            $table->string('country');

            $table->timestamps();

            $table->unique([
                'order_id',
                'address_type',
            ]);
        });

        Schema::create('payment_transactions', function (Blueprint $table) {
    $table->id();

    $table->foreignId('order_id')
        ->constrained('orders')
        ->cascadeOnDelete();

    $table->string('gateway', 30);
    $table->string('status', 30)->default('pending');

    $table->string('gateway_reference')->nullable();
    $table->string('gateway_transaction_id')->nullable();

    $table->decimal('amount', 12, 2);
    $table->string('currency', 10)->default('USD');

    $table->text('redirect_url')->nullable();
    $table->text('failure_reason')->nullable();

    $table->longText('gateway_response')->nullable();

    $table->timestamp('paid_at')->nullable();
    $table->timestamp('failed_at')->nullable();
    $table->timestamp('cancelled_at')->nullable();

    $table->timestamps();

    $table->index('order_id');
    $table->index('gateway');
    $table->index('status');
    $table->index('gateway_reference');
    $table->index('gateway_transaction_id');
});



    }

    public function down(): void
    {

    Schema::dropIfExists('payment_transactions');
        Schema::dropIfExists('order_addresses');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
