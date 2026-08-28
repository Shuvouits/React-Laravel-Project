<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\Pos\BasePosController;
use App\Models\User;
use App\Services\Pos\PosContextService;

class AdminPosController extends BasePosController
{
    protected function resolveContext(
        User $user,
        ?int $locationId = null
    ): array {
        return app(PosContextService::class)->forAdmin(
            $user,
            $locationId
        );
    }

    protected function locationsForContext(
        array $context
    ): array {
        return app(PosContextService::class)
            ->adminLocations();
    }
}
