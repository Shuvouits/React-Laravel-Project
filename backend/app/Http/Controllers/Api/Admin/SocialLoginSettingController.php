<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SocialLoginSetting;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;

class SocialLoginSettingController extends Controller
{
    private const SUPPORTED_PROVIDERS = [
        'google',
    ];

    /*
    |--------------------------------------------------------------------------
    | GET SETTINGS
    |--------------------------------------------------------------------------
    */

    public function index()
    {
        $settings = collect(
            self::SUPPORTED_PROVIDERS
        )->map(function ($provider) {
            $setting =
                SocialLoginSetting::firstOrCreate(
                    [
                        'provider' =>
                            $provider,
                    ],
                    [
                        'is_enabled' =>
                            false,
                    ]
                );

            return $this->formatSetting(
                $setting
            );
        });

        return response()->json([
            'status' => true,
            'settings' => $settings,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE PROVIDER
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        string $provider
    ) {
        $this->guardProvider(
            $provider
        );

        $validated =
            $request->validate([
                'is_enabled' => [
                    'required',
                    'boolean',
                ],

                'client_id' => [
                    'nullable',
                    'string',
                    'max:500',
                ],

                'client_secret' => [
                    'nullable',
                    'string',
                    'max:1000',
                ],

                'redirect_uri' => [
                    'nullable',
                    'url',
                    'max:1000',
                ],
            ]);

        $setting =
            SocialLoginSetting::firstOrCreate([
                'provider' => $provider,
            ]);

        /*
        |--------------------------------------------------------------------------
        | KEEP EXISTING SECRET WHEN FIELD IS EMPTY
        |--------------------------------------------------------------------------
        */

        $clientSecret =
            trim(
                (string) (
                    $validated[
                        'client_secret'
                    ] ?? ''
                )
            );

        $clientId =
            trim(
                (string) (
                    $validated[
                        'client_id'
                    ] ?? ''
                )
            );

        $redirectUri =
            trim(
                (string) (
                    $validated[
                        'redirect_uri'
                    ] ?? ''
                )
            );

        /*
        |--------------------------------------------------------------------------
        | REQUIRE COMPLETE CONFIG WHEN ENABLED
        |--------------------------------------------------------------------------
        */

        if (
            $validated[
                'is_enabled'
            ]
        ) {
            if (! $clientId) {
                return response()->json([
                    'status' => false,
                    'message' =>
                        'Client ID is required before enabling this provider.',
                    'errors' => [
                        'client_id' => [
                            'Client ID is required.',
                        ],
                    ],
                ], 422);
            }

            if (
                ! $clientSecret &&
                ! $setting->client_secret
            ) {
                return response()->json([
                    'status' => false,
                    'message' =>
                        'Client Secret is required before enabling this provider.',
                    'errors' => [
                        'client_secret' => [
                            'Client Secret is required.',
                        ],
                    ],
                ], 422);
            }

            if (! $redirectUri) {
                return response()->json([
                    'status' => false,
                    'message' =>
                        'Redirect URI is required before enabling this provider.',
                    'errors' => [
                        'redirect_uri' => [
                            'Redirect URI is required.',
                        ],
                    ],
                ], 422);
            }
        }

        $updateData = [
            'is_enabled' =>
                (bool)
                    $validated[
                        'is_enabled'
                    ],

            'client_id' =>
                $clientId ?: null,

            'redirect_uri' =>
                $redirectUri ?: null,
        ];

        /*
         * Blank secret means:
         * keep the existing stored secret.
         */
        if ($clientSecret) {
            $updateData[
                'client_secret'
            ] = $clientSecret;
        }

        $setting->update(
            $updateData
        );

        $setting->refresh();

        return response()->json([
            'status' => true,
            'message' =>
                ucfirst($provider)
                . ' settings updated successfully.',

            'setting' =>
                $this->formatSetting(
                    $setting
                ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TEST CONFIGURATION
    |--------------------------------------------------------------------------
    */

    public function test(
        string $provider
    ) {
        $this->guardProvider(
            $provider
        );

        $setting =
            SocialLoginSetting::where(
                'provider',
                $provider
            )->first();

        if (
            ! $setting ||
            ! $setting->client_id ||
            ! $setting->client_secret ||
            ! $setting->redirect_uri
        ) {
            return response()->json([
                'status' => false,
                'message' =>
                    'Please save the provider credentials first.',
            ], 422);
        }

        try {
            $this->applyProviderConfig(
                $setting
            );

            /*
             * This confirms Laravel/Socialite
             * can build the authorization request.
             */
            $response =
                Socialite::driver(
                    $provider
                )
                    ->stateless()
                    ->redirect();

            return response()->json([
                'status' => true,

                'message' =>
                    ucfirst($provider)
                    . ' configuration is ready.',

                'authorization_url' =>
                    $response
                        ->getTargetUrl(),
            ]);
        } catch (\Throwable $error) {
            report($error);

            return response()->json([
                'status' => false,
                'message' =>
                    'Unable to initialize '
                    . ucfirst($provider)
                    . ' authentication.',
            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT RESPONSE
    |--------------------------------------------------------------------------
    */

    private function formatSetting(
        SocialLoginSetting $setting
    ): array {
        return [
            'id' =>
                $setting->id,

            'provider' =>
                $setting->provider,

            'is_enabled' =>
                (bool)
                    $setting
                        ->is_enabled,

            'client_id' =>
                $setting->client_id
                ?? '',

            /*
             * Never return the actual secret.
             */
            'client_secret' =>
                '',

            'has_client_secret' =>
                ! empty(
                    $setting
                        ->client_secret
                ),

            'redirect_uri' =>
                $setting
                    ->redirect_uri
                ?? '',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | APPLY RUNTIME CONFIG
    |--------------------------------------------------------------------------
    */

    private function applyProviderConfig(
        SocialLoginSetting $setting
    ): void {
        config([
            "services.{$setting->provider}.client_id" =>
                $setting->client_id,

            "services.{$setting->provider}.client_secret" =>
                $setting->client_secret,

            "services.{$setting->provider}.redirect" =>
                $setting->redirect_uri,
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PROVIDER GUARD
    |--------------------------------------------------------------------------
    */

    private function guardProvider(
        string $provider
    ): void {
        abort_unless(
            in_array(
                $provider,
                self::SUPPORTED_PROVIDERS,
                true
            ),
            404
        );
    }
}
