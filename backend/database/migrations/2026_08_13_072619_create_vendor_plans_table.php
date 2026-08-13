<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vendor_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('slug')->unique();
             $table->text('description')->nullable();
            $table->decimal('monthly_price', 12, 2)->nullable();
            $table->decimal('yearly_price', 12, 2)->nullable();
            $table->decimal('commission_rate', 5, 2)->default(0);
             $table->unsignedInteger('trial_days')->default(0);
            $table->json('features')->nullable();
            $table->unsignedInteger('product_limit')->nullable();
            $table->unsignedInteger('staff_limit')->nullable();
            $table->boolean('is_active')->default(true);
             $table->boolean('is_default')->default(false);
            $table->unsignedInteger('sort_order')->default(0);
             $table->boolean('ai_authoring')->default(false);

               $table->string('stripe_product_id')->nullable();
            $table->string('stripe_price_id')->nullable();


            $table->timestamps();
        });

        DB::table('vendor_plans')->insert([
            [
                'name' => 'Pro Plan',
                'slug' => 'pro',
                'monthly_price' => null,
                'yearly_price' => 1000,
                'commission_rate' => 5,
                'features' => json_encode([
                    'Unlimited Service',
                    'Priority Support',
                    'Installation Support',
                    'Unlimited product upload limit',
                    'Unlimited staff limit',
                ]),
                'product_limit' => null,
                'staff_limit' => null,
                'is_active' => true,
                'sort_order' => 1,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Team Plan',
                'slug' => 'team',
                'monthly_price' => null,
                'yearly_price' => 300,
                'commission_rate' => 8,
                'features' => json_encode([
                    'Unlimited product upload limit',
                    '100 staff limit',
                ]),
                'product_limit' => null,
                'staff_limit' => 100,
                'is_active' => true,
                'sort_order' => 2,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'name' => 'Free',
                'slug' => 'free',
                'monthly_price' => 0,
                'yearly_price' => 0,
                'commission_rate' => 10,
                'features' => json_encode([
                    '20 product upload limit',
                    '2 staff limit',
                ]),
                'product_limit' => 20,
                'staff_limit' => 2,
                'is_active' => true,
                'sort_order' => 3,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('vendor_plans');
    }
};
