<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Api\Pos\BasePosController;
use App\Models\User;
use App\Services\Pos\PosContextService;

class VendorPosController extends BasePosController
{
    protected function resolveContext(
        User $user,
        ?int $locationId = null
    ): array {
        return app(PosContextService::class)->forVendor(
            $user,
            $locationId
        );
    }

    protected function locationsForContext(
        array $context
    ): array {
        return app(PosContextService::class)
            ->vendorLocations(
                (int) $context['vendor_id']
            );
    }
}