<?php

namespace Database\Seeders;

use App\Models\InventoryLevel;
use App\Models\InventoryLocation;
use App\Models\Product;
use Illuminate\Database\Seeder;

class InventoryLevelSeeder extends Seeder
{
    public function run(): void
    {
        $location = InventoryLocation::query()
            ->where('is_default', true)
            ->first();

        if (!$location) {
            $location = InventoryLocation::query()
                ->where('code', 'MAIN')
                ->first();
        }

        if (!$location) {
            $this->command?->error(
                'Default inventory location not found.'
            );

            return;
        }

        Product::query()
            ->with('variants')
            ->chunkById(100, function ($products) use ($location) {
                foreach ($products as $product) {
                    if ($product->variants->isNotEmpty()) {
                        foreach ($product->variants as $variant) {
                            InventoryLevel::firstOrCreate(
                                [
                                    'location_id' => $location->id,
                                    'product_id' => $product->id,
                                    'variant_id' => $variant->id,
                                ],
                                [
                                    'on_hand' => max(
                                        0,
                                        (int) ($variant->quantity ?? 0)
                                    ),
                                    'committed' => 0,
                                    'unavailable' => 0,
                                    'incoming' => 0,
                                    'low_stock_threshold' => 10,
                                    'track_quantity' => (bool) (
                                        $variant->track_quantity ?? true
                                    ),
                                ]
                            );
                        }

                        continue;
                    }

                    InventoryLevel::firstOrCreate(
                        [
                            'location_id' => $location->id,
                            'product_id' => $product->id,
                            'variant_id' => null,
                        ],
                        [
                            'on_hand' => max(
                                0,
                                (int) ($product->quantity ?? 0)
                            ),
                            'committed' => 0,
                            'unavailable' => 0,
                            'incoming' => 0,
                            'low_stock_threshold' => 10,
                            'track_quantity' => (bool) (
                                $product->track_quantity ?? true
                            ),
                        ]
                    );
                }
            });

        $this->command?->info(
            'Inventory levels synced successfully.'
        );
    }
}