<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_settings', function (Blueprint $table) {
            $table->id();
            $table->string('gateway', 50)->unique();
            $table->boolean('is_enabled')->default(false);
            $table->string('mode', 30)->nullable();
            $table->longText('config')->nullable();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        $now = now();

        DB::table('payment_settings')->insert([
            [
                'gateway' => 'stripe',
                'is_enabled' => false,
                'mode' => 'test',
                'config' => null,
                'sort_order' => 1,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'gateway' => 'paypal',
                'is_enabled' => false,
                'mode' => 'sandbox',
                'config' => null,
                'sort_order' => 2,
                'created_at' => $now,
                'updated_at' => $now,
            ],
            [
                'gateway' => 'razorpay',
                'is_enabled' => false,
                'mode' => 'test',
                'config' => null,
                'sort_order' => 3,
                'created_at' => $now,
                'updated_at' => $now,
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_settings');
    }
};