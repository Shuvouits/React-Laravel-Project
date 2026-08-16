<?php

namespace Database\Seeders;

use App\Models\InventoryLocation;
use Illuminate\Database\Seeder;

class InventoryLocationSeeder extends Seeder
{
    public function run(): void
    {
        InventoryLocation::updateOrCreate(
            [
                'code' => 'MAIN',
            ],
            [
                'name' => 'Main Location',
                'phone' => null,
                'email' => null,
                'address_line1' => null,
                'address_line2' => null,
                'city' => null,
                'state' => null,
                'postal_code' => null,
                'country' => null,
                'is_default' => true,
                'is_active' => true,
            ]
        );
    }
}
