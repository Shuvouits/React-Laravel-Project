<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class VendorProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $this->vendorUser($request);
        $vendor = $user->vendor;

        return response()->json([
            'success' => true,

            'profile' => [
                'id' => $user->getKey(),

                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,

                'email' => $user->email,
                'phone' => $user->phone,

                'birthdate' => $user->birthdate,
                'gender' => $user->gender,

                'photo' => $user->photo,

                'photo_url' => $this->getPhotoUrl(
                    $user->photo
                ),

                'role' => $user->role ?? 'vendor',

                'two_factor_enabled' =>
                    !empty($user->two_factor_secret) &&
                    !empty($user->two_factor_confirmed_at),

                'two_factor_pending' =>
                    !empty($user->two_factor_secret) &&
                    empty($user->two_factor_confirmed_at),

                'vendor' => $vendor
                    ? [
                        'id' => $vendor->id,
                        'store_name' => $vendor->store_name,
                        'slug' => $vendor->slug,
                        'status' => $vendor->status,
                        'logo' => $vendor->logo,
                        'banner' => $vendor->banner,
                    ]
                    : null,
            ],
        ]);
    }


    public function update(Request $request): JsonResponse
    {
        $user = $this->vendorUser($request);

        $table = $user->getTable();

        $validated = $request->validate([
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
                    $user->getKey(),
                    $user->getKeyName()
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


        $firstName = trim(
            $validated['first_name']
        );

        $lastName = trim(
            $validated['last_name']
        );


        $photoPath = $user->photo;


        /*
        |--------------------------------------------------------------------------
        | PROFILE PHOTO
        |--------------------------------------------------------------------------
        */

        if ($request->hasFile('photo')) {
            $image = $request->file('photo');

            $uploadDirectory = public_path(
                'uploads/vendor/profiles'
            );


            if (!File::exists($uploadDirectory)) {
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
                'uploads/vendor/profiles/'
                . $fileName;


            $this->deleteOldPhoto(
                $user->photo
            );
        }


        /*
        |--------------------------------------------------------------------------
        | UPDATE VENDOR USER PROFILE
        |--------------------------------------------------------------------------
        */

        $user->forceFill([
            'first_name' => $firstName,

            'last_name' => $lastName,

            'name' => trim(
                $firstName
                . ' '
                . $lastName
            ),

            'email' => strtolower(
                trim(
                    $validated['email']
                )
            ),

            'phone' =>
                $validated['phone']
                ?? null,

            'birthdate' =>
                $validated['birthdate']
                ?? null,

            'gender' =>
                $validated['gender']
                ?? null,

            'photo' => $photoPath,
        ])->save();


        $user->refresh();

        $vendor = $user->vendor;


        return response()->json([
            'success' => true,

            'message' =>
                'Profile updated successfully.',

            'profile' => [
                'id' => $user->getKey(),

                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,

                'email' => $user->email,
                'phone' => $user->phone,

                'birthdate' => $user->birthdate,
                'gender' => $user->gender,

                'photo' => $user->photo,

                'photo_url' => $this->getPhotoUrl(
                    $user->photo
                ),

                'role' => $user->role ?? 'vendor',

                'two_factor_enabled' =>
                    !empty($user->two_factor_secret) &&
                    !empty($user->two_factor_confirmed_at),

                'two_factor_pending' =>
                    !empty($user->two_factor_secret) &&
                    empty($user->two_factor_confirmed_at),

                'vendor' => $vendor
                    ? [
                        'id' => $vendor->id,
                        'store_name' => $vendor->store_name,
                        'slug' => $vendor->slug,
                        'status' => $vendor->status,
                        'logo' => $vendor->logo,
                        'banner' => $vendor->banner,
                    ]
                    : null,
            ],
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | AUTHENTICATED VENDOR USER
    |--------------------------------------------------------------------------
    */

    private function vendorUser(Request $request)
    {
        $user = $request->user();

        if (
            !$user ||
            $user->role !== 'vendor'
        ) {
            abort(403);
        }

        return $user;
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

        /*
        |--------------------------------------------------------------------------
        | ONLY DELETE VENDOR PROFILE PHOTOS
        |--------------------------------------------------------------------------
        */

        if (
            !str_starts_with(
                $photo,
                'uploads/vendor/profiles/'
            )
        ) {
            return;
        }

        $filePath = public_path(
            ltrim(
                $photo,
                '/'
            )
        );

        if (File::exists($filePath)) {
            File::delete(
                $filePath
            );
        }
    }
}