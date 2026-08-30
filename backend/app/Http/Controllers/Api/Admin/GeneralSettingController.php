<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\GeneralSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;

class GeneralSettingController extends Controller
{
    public function show(): JsonResponse
    {
        $settings = GeneralSetting::query()->firstOrCreate(
            [],
            [
                'navbar_logo' => null,
                'navbar_logo_alt' => 'Storify',
            ]
        );

        return response()->json([
            'success' => true,
            'settings' => $this->settingsData($settings),
        ]);
    }

    public function updateNavbarLogo(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'navbar_logo' => [
                'required',
                'file',
                'mimes:jpg,jpeg,png,webp',
                'max:5120',
            ],
            'navbar_logo_alt' => [
                'nullable',
                'string',
                'max:255',
            ],
        ]);

        $settings = GeneralSetting::query()->firstOrCreate(
            [],
            [
                'navbar_logo' => null,
                'navbar_logo_alt' => 'Storify',
            ]
        );

        $uploadPath = public_path(
            'uploads/settings/navbar'
        );

        if (!File::isDirectory($uploadPath)) {
            File::makeDirectory(
                $uploadPath,
                0755,
                true
            );
        }

        if ($settings->navbar_logo) {
            $oldLogoPath = public_path(
                $settings->navbar_logo
            );

            if (
                File::exists($oldLogoPath) &&
                File::isFile($oldLogoPath)
            ) {
                File::delete($oldLogoPath);
            }
        }

        $logo = $validated['navbar_logo'];

        $fileName =
            'navbar-logo-' .
            time() .
            '-' .
            uniqid() .
            '.' .
            $logo->getClientOriginalExtension();

        $logo->move(
            $uploadPath,
            $fileName
        );

        $settings->update([
            'navbar_logo' =>
                'uploads/settings/navbar/' .
                $fileName,

            'navbar_logo_alt' =>
                trim(
                    $validated['navbar_logo_alt'] ??
                    'Storify'
                ) ?: 'Storify',
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Navbar logo updated successfully.',
            'settings' => $this->settingsData(
                $settings->fresh()
            ),
        ]);
    }

    public function removeNavbarLogo(): JsonResponse
    {
        $settings = GeneralSetting::query()->first();

        if (!$settings) {
            return response()->json([
                'success' => true,
                'message' =>
                    'Navbar logo is already using the default logo.',
                'settings' => [
                    'navbar_logo' => null,
                    'navbar_logo_url' => null,
                    'navbar_logo_alt' => 'Storify',
                ],
            ]);
        }

        if ($settings->navbar_logo) {
            $logoPath = public_path(
                $settings->navbar_logo
            );

            if (
                File::exists($logoPath) &&
                File::isFile($logoPath)
            ) {
                File::delete($logoPath);
            }
        }

        $settings->update([
            'navbar_logo' => null,
            'navbar_logo_alt' => 'Storify',
        ]);

        return response()->json([
            'success' => true,
            'message' =>
                'Default navbar logo restored successfully.',
            'settings' => $this->settingsData(
                $settings->fresh()
            ),
        ]);
    }

    private function settingsData(
        GeneralSetting $settings
    ): array {
        return [
            'id' => $settings->id,

            'navbar_logo' =>
                $settings->navbar_logo,

            'navbar_logo_url' =>
                $settings->navbar_logo
                    ? asset($settings->navbar_logo)
                    : null,

            'navbar_logo_alt' =>
                $settings->navbar_logo_alt
                    ?: 'Storify',

            'created_at' =>
                $settings->created_at,

            'updated_at' =>
                $settings->updated_at,
        ];
    }
}