<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\CustomerAddress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerAddressController extends Controller
{
    // Address list
    public function index(Request $request)
    {
        $addresses = $request->user()
            ->addresses()
            ->orderByDesc('is_default')
            ->latest('id')
            ->get();

        return response()->json([
            'status' => true,
            'addresses' => $addresses,
        ]);
    }

    // Create address
    public function store(Request $request)
    {
        $validated = $this->validateAddress($request);

        $address = DB::transaction(function () use ($request, $validated) {
            $user = $request->user();

            $hasAddress = $user->addresses()
                ->exists();

            $makeDefault =
                !$hasAddress ||
                (bool) ($validated['is_default'] ?? false);

            if ($makeDefault) {
                $this->clearDefaultAddress($user->id);
            }

            return $user->addresses()->create([
                'type' => $validated['type'],
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'country' => $validated['country'],
                'address_line1' => $validated['address_line1'],
                'address_line2' => $validated['address_line2'] ?? null,
                'city' => $validated['city'],
                'state' => $validated['state'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'is_default' => $makeDefault,
            ]);
        });

        return response()->json([
            'status' => true,
            'message' => 'Address added successfully.',
            'address' => $address,
        ], 201);
    }

    // Update address
    public function update(Request $request, $id)
    {
        $address = $this->findCustomerAddress(
            $request,
            $id
        );

        $validated = $this->validateAddress($request);

        DB::transaction(function () use ($request, $address, $validated) {
            $makeDefault = (bool) ($validated['is_default'] ?? false);

            if ($makeDefault) {
                $this->clearDefaultAddress(
                    $request->user()->id,
                    $address->id
                );
            }

            $address->update([
                'type' => $validated['type'],
                'first_name' => $validated['first_name'],
                'last_name' => $validated['last_name'],
                'country' => $validated['country'],
                'address_line1' => $validated['address_line1'],
                'address_line2' => $validated['address_line2'] ?? null,
                'city' => $validated['city'],
                'state' => $validated['state'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'is_default' => $makeDefault
                    ? true
                    : $address->is_default,
            ]);
        });

        return response()->json([
            'status' => true,
            'message' => 'Address updated successfully.',
            'address' => $address->fresh(),
        ]);
    }

    // Delete address
    public function destroy(Request $request, $id)
    {
        $address = $this->findCustomerAddress(
            $request,
            $id
        );

        DB::transaction(function () use ($request, $address) {
            $wasDefault = $address->is_default;

            $address->delete();

            if (!$wasDefault) {
                return;
            }

            $nextAddress = $request->user()
                ->addresses()
                ->latest('id')
                ->first();

            if ($nextAddress) {
                $nextAddress->update([
                    'is_default' => true,
                ]);
            }
        });

        return response()->json([
            'status' => true,
            'message' => 'Address removed successfully.',
        ]);
    }

    // Set default address
    public function setDefault(Request $request, $id)
    {
        $address = $this->findCustomerAddress(
            $request,
            $id
        );

        DB::transaction(function () use ($request, $address) {
            $this->clearDefaultAddress(
                $request->user()->id,
                $address->id
            );

            $address->update([
                'is_default' => true,
            ]);
        });

        return response()->json([
            'status' => true,
            'message' => 'Default address updated successfully.',
            'address' => $address->fresh(),
        ]);
    }

    // Validation
    private function validateAddress(Request $request): array
    {
        return $request->validate([
            'type' => ['required', 'string', 'max:30'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'country' => ['required', 'string', 'max:100'],
            'address_line1' => ['required', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:30'],
            'phone' => ['nullable', 'string', 'max:50'],
            'is_default' => ['nullable', 'boolean'],
        ]);
    }

    // Find current customer's address
    private function findCustomerAddress(Request $request, $id): CustomerAddress
    {
        return $request->user()
            ->addresses()
            ->whereKey($id)
            ->firstOrFail();
    }

    // Remove previous default
    private function clearDefaultAddress($userId, $exceptId = null): void
    {
        $query = CustomerAddress::query()
            ->where('user_id', $userId)
            ->where('is_default', true);

        if ($exceptId) {
            $query->where('id', '!=', $exceptId);
        }

        $query->update([
            'is_default' => false,
        ]);
    }
}