<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'finance_period_closures',
            function (Blueprint $table) {
                $table->id();

                $table->string(
                    'period_month',
                    7
                );

                $table->date(
                    'period_start'
                );

                $table->date(
                    'period_end'
                );

                $table->string(
                    'book',
                    30
                )->default('both');

                $table->string(
                    'currency',
                    10
                )->default('USD');

                $table->decimal(
                    'product_sales',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'commission_income',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'shipping_income',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'refunds',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'total_income',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'total_costs',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'net_at_close',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'order_volume',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'tax_collected',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'tax_refunded',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'tax_owed_onward',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'owed_to_vendors',
                    15,
                    2
                )->default(0);

                $table->decimal(
                    'commission_owed_to_admin',
                    15,
                    2
                )->default(0);

                $table->json(
                    'snapshot'
                )->nullable();

                $table->foreignId(
                    'closed_by'
                )
                    ->nullable()
                    ->constrained('users')
                    ->nullOnDelete();

                $table->timestamp(
                    'closed_at'
                );

                $table->timestamps();

                $table->unique([
                    'period_month',
                    'book',
                ]);

                $table->index(
                    'period_month'
                );

                $table->index([
                    'period_start',
                    'period_end',
                ]);

                $table->index(
                    'closed_at'
                );
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'finance_period_closures'
        );
    }
};