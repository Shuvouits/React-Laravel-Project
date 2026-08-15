<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_addresses', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->string('type', 30)
                ->default('Home');

            $table->string('first_name', 100);
            $table->string('last_name', 100);

            $table->string('country', 100);

            $table->string('address_line1', 255);

            $table->string('address_line2', 255)
                ->nullable();

            $table->string('city', 100);

            $table->string('state', 100)
                ->nullable();

            $table->string('postal_code', 30)
                ->nullable();

            $table->string('phone', 50)
                ->nullable();

            $table->boolean('is_default')
                ->default(false);

            $table->timestamps();

            $table->index([
                'user_id',
                'is_default',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_addresses');
    }
};
