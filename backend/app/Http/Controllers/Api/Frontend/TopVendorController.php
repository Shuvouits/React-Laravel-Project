<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\Request;

class TopVendorController extends Controller
{
    // Top vendors
    public function index(Request $request)
    {
        $limit = (int) $request->get('limit', 8);

        if ($limit < 1) {
            $limit = 1;
        }

        if ($limit > 24) {
            $limit = 24;
        }

        $vendors = Vendor::with('user')
            ->where('status', 'approved')
            ->whereHas('user', function ($query) {
                $query->where('role', 'vendor')
                    ->where('account_status', 'active');
            })
            ->latest('approved_at')
            ->limit($limit)
            ->get()
            ->map(function ($vendor) {
                return [
                    'id' => $vendor->id,
                    'store_name' => $vendor->store_name,
                    'slug' => $vendor->slug,
                    'description' => $vendor->description,
                    'logo' => $vendor->logo,
                    'banner' => $vendor->banner,
                    'commission_rate' => $vendor->commission_rate,
                    'rating' => 0,
                    'sold' => 0,
                ];
            });

        return response()->json([
            'status' => true,
            'vendors' => $vendors,
        ]);
    }
}