<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminProfileController extends Controller
{
    public function show(
        Request $request
    ): JsonResponse {
        $admin = $request->user();

        return response()->json([
            'success' => true,

            'profile' => [
                'id' =>
                    $admin->getKey(),

                'first_name' =>
                    $admin->first_name,

                'last_name' =>
                    $admin->last_name,

                'name' =>
                    $admin->name,

                'email' =>
                    $admin->email,

                'phone' =>
                    $admin->phone,

                'birthdate' =>
                    $admin->birthdate,

                'gender' =>
                    $admin->gender,

                'photo' =>
                    $admin->photo,

                'photo_url' =>
                    $this->getPhotoUrl(
                        $admin->photo
                    ),

                'role' =>
                    $admin->role
                    ?? $admin->user_type
                    ?? 'admin',

                'two_factor_enabled' =>
                    !empty(
                        $admin->two_factor_secret
                    ) &&
                    !empty(
                        $admin->two_factor_confirmed_at
                    ),

                'two_factor_pending' =>
                    !empty(
                        $admin->two_factor_secret
                    ) &&
                    empty(
                        $admin->two_factor_confirmed_at
                    ),
            ],
        ]);
    }

    public function update(
        Request $request
    ): JsonResponse {
        $admin =
            $request->user();

        $table =
            $admin->getTable();

        $validated =
            $request->validate([
                'first_name' => [
                    'required',
                    'string',
                    'max:100',
                ],

                'last_name' => [
                    'required',
                    'string',
                    'max:100',
                ],

                'email' => [
                    'required',
                    'email',
                    'max:255',

                    Rule::unique(
                        $table,
                        'email'
                    )->ignore(
                        $admin->getKey(),
                        $admin->getKeyName()
                    ),
                ],

                'phone' => [
                    'nullable',
                    'string',
                    'max:50',
                ],

                'birthdate' => [
                    'nullable',
                    'date',
                    'before_or_equal:today',
                ],

                'gender' => [
                    'nullable',
                    Rule::in([
                        'male',
                        'female',
                        'other',
                        'prefer_not_to_say',
                    ]),
                ],

                'photo' => [
                    'nullable',
                    'image',
                    'mimes:jpg,jpeg,png,webp',
                    'max:5120',
                ],
            ]);

        $firstName =
            trim(
                $validated[
                    'first_name'
                ]
            );

        $lastName =
            trim(
                $validated[
                    'last_name'
                ]
            );

        $photoPath =
            $admin->photo;

        /*
        |--------------------------------------------------------------------------
        | PROFILE PHOTO
        |--------------------------------------------------------------------------
        */

        if (
            $request->hasFile(
                'photo'
            )
        ) {
            $image =
                $request->file(
                    'photo'
                );

            $uploadDirectory =
                public_path(
                    'uploads/admin/profiles'
                );

            if (
                !File::exists(
                    $uploadDirectory
                )
            ) {
                File::makeDirectory(
                    $uploadDirectory,
                    0755,
                    true
                );
            }

            $fileName =
                Str::uuid()
                . '.'
                . $image->extension();

            $image->move(
                $uploadDirectory,
                $fileName
            );

            $photoPath =
                'uploads/admin/profiles/'
                . $fileName;

            $this->deleteOldPhoto(
                $admin->photo
            );
        }

        /*
        |--------------------------------------------------------------------------
        | UPDATE PROFILE
        |--------------------------------------------------------------------------
        */

        $admin->forceFill([
            'first_name' =>
                $firstName,

            'last_name' =>
                $lastName,

            'name' =>
                trim(
                    $firstName
                    . ' '
                    . $lastName
                ),

            'email' =>
                strtolower(
                    trim(
                        $validated[
                            'email'
                        ]
                    )
                ),

            'phone' =>
                $validated[
                    'phone'
                ]
                ?? null,

            'birthdate' =>
                $validated[
                    'birthdate'
                ]
                ?? null,

            'gender' =>
                $validated[
                    'gender'
                ]
                ?? null,

            'photo' =>
                $photoPath,
        ])->save();

        $admin->refresh();

        return response()->json([
            'success' => true,

            'message' =>
                'Profile updated successfully.',

            'profile' => [
                'id' =>
                    $admin->getKey(),

                'first_name' =>
                    $admin->first_name,

                'last_name' =>
                    $admin->last_name,

                'name' =>
                    $admin->name,

                'email' =>
                    $admin->email,

                'phone' =>
                    $admin->phone,

                'birthdate' =>
                    $admin->birthdate,

                'gender' =>
                    $admin->gender,

                'photo' =>
                    $admin->photo,

                'photo_url' =>
                    $this->getPhotoUrl(
                        $admin->photo
                    ),

                'role' =>
                    $admin->role
                    ?? $admin->user_type
                    ?? 'admin',

                'two_factor_enabled' =>
                    !empty(
                        $admin->two_factor_secret
                    ) &&
                    !empty(
                        $admin->two_factor_confirmed_at
                    ),

                'two_factor_pending' =>
                    !empty(
                        $admin->two_factor_secret
                    ) &&
                    empty(
                        $admin->two_factor_confirmed_at
                    ),
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PHOTO URL
    |--------------------------------------------------------------------------
    */

    private function getPhotoUrl(
        ?string $photo
    ): ?string {
        if (!$photo) {
            return null;
        }

        if (
            str_starts_with(
                $photo,
                'http://'
            ) ||
            str_starts_with(
                $photo,
                'https://'
            )
        ) {
            return $photo;
        }

        return asset(
            ltrim(
                $photo,
                '/'
            )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | DELETE OLD PHOTO
    |--------------------------------------------------------------------------
    */

    private function deleteOldPhoto(
        ?string $photo
    ): void {
        if (!$photo) {
            return;
        }

        if (
            str_starts_with(
                $photo,
                'http://'
            ) ||
            str_starts_with(
                $photo,
                'https://'
            )
        ) {
            return;
        }

        $filePath =
            public_path(
                ltrim(
                    $photo,
                    '/'
                )
            );

        if (
            File::exists(
                $filePath
            )
        ) {
            File::delete(
                $filePath
            );
        }
    }
}