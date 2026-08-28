<?php

namespace App\Services\Pos;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PosContextService
{
    public function forAdmin(
        User $user,
        ?int $locationId = null
    ): array {
        if ($user->role !== 'admin') {
            throw ValidationException::withMessages([
                'user' => [
                    'Only an administrator can access the Admin POS.',
                ],
            ]);
        }

        $location = $this->resolveAdminLocation(
            $locationId
        );

        return [
            'role' => 'admin',
            'user_id' => $user->id,
            'vendor_id' => null,
            'location_id' => $location->id,
            'location' => $this->formatLocation(
                $location
            ),
        ];
    }

    public function forVendor(
        User $user,
        ?int $locationId = null
    ): array {
        if ($user->role !== 'vendor') {
            throw ValidationException::withMessages([
                'user' => [
                    'Only a vendor can access the Vendor POS.',
                ],
            ]);
        }

        $vendor = Vendor::query()
            ->where('user_id', $user->id)
            ->where('status', 'approved')
            ->first();

        if (!$vendor) {
            throw ValidationException::withMessages([
                'vendor' => [
                    'An approved vendor account was not found.',
                ],
            ]);
        }

        $location = $this->resolveVendorLocation(
            $vendor->id,
            $locationId
        );

        return [
            'role' => 'vendor',
            'user_id' => $user->id,
            'vendor_id' => $vendor->id,
            'vendor_user_id' => $vendor->user_id,
            'location_id' => $location->id,

            'vendor' => [
                'id' => $vendor->id,
                'store_name' => $vendor->store_name,
                'slug' => $vendor->slug,
                'commission_rate' => (float) $vendor->commission_rate,
            ],

            'location' => $this->formatLocation(
                $location
            ),
        ];
    }

    public function adminLocations(): array
    {
        return DB::table('inventory_locations')
            ->whereNull('vendor_id')
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get()
            ->map(
                fn ($location) =>
                    $this->formatLocation($location)
            )
            ->values()
            ->all();
    }

    public function vendorLocations(
        int $vendorId
    ): array {
        return DB::table('inventory_locations')
            ->where('vendor_id', $vendorId)
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('name')
            ->get()
            ->map(
                fn ($location) =>
                    $this->formatLocation($location)
            )
            ->values()
            ->all();
    }

    private function resolveAdminLocation(
        ?int $locationId
    ): object {
        $query = DB::table('inventory_locations')
            ->whereNull('vendor_id')
            ->where('is_active', true);

        if ($locationId) {
            $query->where('id', $locationId);
        } else {
            $query
                ->orderByDesc('is_default')
                ->orderBy('id');
        }

        $location = $query->first();

        if (!$location) {
            throw ValidationException::withMessages([
                'location_id' => [
                    'An active Admin inventory location was not found.',
                ],
            ]);
        }

        return $location;
    }

    private function resolveVendorLocation(
        int $vendorId,
        ?int $locationId
    ): object {
        $query = DB::table('inventory_locations')
            ->where('vendor_id', $vendorId)
            ->where('is_active', true);

        if ($locationId) {
            $query->where('id', $locationId);
        } else {
            $query
                ->orderByDesc('is_default')
                ->orderBy('id');
        }

        $location = $query->first();

        if (!$location) {
            throw ValidationException::withMessages([
                'location_id' => [
                    'An active vendor inventory location was not found.',
                ],
            ]);
        }

        return $location;
    }

    private function formatLocation(
        object $location
    ): array {
        $addressParts = array_filter([
            $location->address_line1 ?? null,
            $location->address_line2 ?? null,
            $location->city ?? null,
            $location->state ?? null,
            $location->postal_code ?? null,
            $location->country ?? null,
        ]);

        return [
            'id' => $location->id,
            'vendor_id' => $location->vendor_id,
            'name' => $location->name,
            'code' => $location->code,
            'phone' => $location->phone,
            'email' => $location->email,
            'address' => implode(
                ', ',
                $addressParts
            ),
            'pickup_enabled' => (bool) $location->pickup_enabled,
            'shipping_enabled' => (bool) $location->shipping_enabled,
            'is_default' => (bool) $location->is_default,
            'is_active' => (bool) $location->is_active,
        ];
    }
}