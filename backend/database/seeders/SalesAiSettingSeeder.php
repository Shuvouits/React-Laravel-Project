<?php

namespace Database\Seeders;

use App\Models\SalesAiSetting;
use Illuminate\Database\Seeder;

class SalesAiSettingSeeder extends Seeder
{
    public function run(): void
    {
        SalesAiSetting::query()->firstOrCreate(
            [],
            [
                'bot_name' => 'Sales AI',

                'welcome_message' =>
                    'Hi! I can help you find products, compare options, add items to your cart, and check order status.',

                'input_placeholder' =>
                    'Type a message...',

                'temperature' => 0.30,

                'max_tokens' => 1200,

                'product_search_limit' => 6,

                'guest_daily_limit' => 30,

                'authenticated_daily_limit' => 100,

                'starter_suggestions' => [
                    'Show me products on sale',
                    'Help me find a product',
                    'Compare products',
                    'Check my order status',
                ],

                'theme' => [
                    'primary_color' => '#3424F4',
                    'secondary_color' => '#A34CF4',
                    'text_color' => '#171717',
                    'panel_background' => '#FFFFFF',
                    'launcher_position' => 'right',
                ],

                'is_active' => true,
            ]
        );
    }
}