<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_expenses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('created_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->date('expense_date');

            $table->decimal('amount', 15, 2);

            $table->string('currency', 10)
                ->default('USD');

            $table->string('description');

            $table->string('category')
                ->default('other');

            $table->string('paid_from')
                ->default('bank');

            $table->string('paid_to')
                ->nullable();

            $table->string('book')
                ->default('own_store');

            $table->string('receipt_path')
                ->nullable();

            $table->boolean('repeats')
                ->default(false);

            $table->string('repeat_frequency')
                ->nullable();

            $table->date('next_repeat_date')
                ->nullable();

            $table->text('note')
                ->nullable();

            $table->timestamps();

            $table->index('expense_date');
            $table->index('category');
            $table->index('paid_from');
            $table->index('book');
            $table->index(['book', 'expense_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_expenses');
    }
};
