<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SocialAccount;
use App\Models\SocialLoginSetting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Laravel\Socialite\Two\GoogleProvider;

class SocialAuthController extends Controller
{
    private const SUPPORTED_PROVIDERS = [
        'google',
    ];

    /*
    |--------------------------------------------------------------------------
    | REDIRECT TO PROVIDER
    |--------------------------------------------------------------------------
    */

    public function redirect(
        Request $request,
        string $provider
    ) {
        $state = Str::random(64);

        Cache::put(
            $this->stateKey($state),
            true,
            now()->addMinutes(10)
        );

        $socialite =
            $this->makeProvider(
                $request,
                $provider
            );

        return $socialite
            ->with([
                'state' => $state,
                'prompt' => 'select_account',
            ])
            ->redirect();
    }

    /*
    |--------------------------------------------------------------------------
    | PROVIDER CALLBACK
    |--------------------------------------------------------------------------
    */

    public function callback(
        Request $request,
        string $provider
    ) {
        $this->guardProvider(
            $provider
        );

        $frontendUrl =
            $this->frontendUrl();

        /*
        |--------------------------------------------------------------------------
        | VERIFY OAUTH STATE
        |--------------------------------------------------------------------------
        */

        $state = trim(
            (string) $request->query(
                'state',
                ''
            )
        );

        if (
            ! $state ||
            ! Cache::pull(
                $this->stateKey(
                    $state
                )
            )
        ) {
            return redirect()->away(
                $frontendUrl
                . '/social-auth/callback'
                . '?error=invalid_state'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | FETCH GOOGLE USER
        |--------------------------------------------------------------------------
        */

        try {
            $oauthUser =
                $this->makeProvider(
                    $request,
                    $provider
                )->user();
        } catch (\Throwable $error) {
            report($error);

            return redirect()->away(
                $frontendUrl
                . '/social-auth/callback'
                . '?error=provider_auth_failed'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | PROVIDER DATA
        |--------------------------------------------------------------------------
        */

        $providerUserId =
            trim(
                (string)
                    $oauthUser->getId()
            );

        $email =
            strtolower(
                trim(
                    (string)
                        $oauthUser->getEmail()
                )
            );

        $rawUser =
            is_array(
                $oauthUser->user ?? null
            )
                ? $oauthUser->user
                : [];

        $emailVerified =
            filter_var(
                $rawUser['email_verified']
                    ??
                $rawUser['verified_email']
                    ??
                false,
                FILTER_VALIDATE_BOOLEAN
            );

        /*
        |--------------------------------------------------------------------------
        | REQUIRE VERIFIED EMAIL
        |--------------------------------------------------------------------------
        */

        if (
            ! $providerUserId ||
            ! $email ||
            ! $emailVerified
        ) {
            return redirect()->away(
                $frontendUrl
                . '/social-auth/callback'
                . '?error=email_not_verified'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | NAME DATA
        |--------------------------------------------------------------------------
        */

        $firstName =
            trim(
                (string) (
                    $rawUser['given_name']
                    ?? ''
                )
            );

        $lastName =
            trim(
                (string) (
                    $rawUser['family_name']
                    ?? ''
                )
            );

        $name =
            trim(
                (string)
                    $oauthUser->getName()
            );

        if (! $name) {
            $name = trim(
                $firstName
                . ' '
                . $lastName
            );
        }

        if (! $name) {
            $name =
                Str::before(
                    $email,
                    '@'
                );
        }

        $avatar =
            $oauthUser->getAvatar();

        /*
        |--------------------------------------------------------------------------
        | FIND OR CREATE USER
        |--------------------------------------------------------------------------
        */

        [
            $user,
            $socialAccount,
        ] = DB::transaction(
            function () use (
                $provider,
                $providerUserId,
                $email,
                $name,
                $firstName,
                $lastName,
                $avatar
            ) {
                /*
                 * First try matching an
                 * existing social account.
                 */

                $socialAccount =
                    SocialAccount::query()
                        ->where(
                            'provider',
                            $provider
                        )
                        ->where(
                            'provider_user_id',
                            $providerUserId
                        )
                        ->lockForUpdate()
                        ->first();

                if ($socialAccount) {
                    $user =
                        User::findOrFail(
                            $socialAccount->user_id
                        );

                    $socialAccount->update([
                        'provider_email' =>
                            $email,

                        'avatar' =>
                            $avatar,
                    ]);

                    return [
                        $user,
                        $socialAccount,
                    ];
                }

                /*
                 * Match an existing Storify
                 * account using email.
                 */

                $user =
                    User::query()
                        ->whereRaw(
                            'LOWER(email) = ?',
                            [
                                strtolower(
                                    $email
                                ),
                            ]
                        )
                        ->lockForUpdate()
                        ->first();

                /*
                 * New Google users are
                 * customer accounts.
                 */

                if (! $user) {
                    $user =
                        User::create([
                            'name' =>
                                $name,

                            'first_name' =>
                                $firstName
                                    ?: null,

                            'last_name' =>
                                $lastName
                                    ?: null,

                            'email' =>
                                $email,

                            'password' =>
                                Str::random(
                                    64
                                ),

                            'role' =>
                                'customer',

                            'account_status' =>
                                'active',
                        ]);

                    $user
                        ->forceFill([
                            'email_verified_at' =>
                                now(),
                        ])
                        ->save();
                } elseif (
                    ! $user->email_verified_at
                ) {
                    /*
                     * Google has verified
                     * ownership of this email.
                     */

                    $user
                        ->forceFill([
                            'email_verified_at' =>
                                now(),
                        ])
                        ->save();
                }

                /*
                 * Link Google account.
                 */

                $socialAccount =
                    SocialAccount::create([
                        'user_id' =>
                            $user->id,

                        'provider' =>
                            $provider,

                        'provider_user_id' =>
                            $providerUserId,

                        'provider_email' =>
                            $email,

                        'avatar' =>
                            $avatar,
                    ]);

                return [
                    $user,
                    $socialAccount,
                ];
            }
        );

        /*
        |--------------------------------------------------------------------------
        | ACCOUNT STATUS
        |--------------------------------------------------------------------------
        */

        if (
            $user->account_status
            !== 'active'
        ) {
            return redirect()->away(
                $frontendUrl
                . '/social-auth/callback'
                . '?error=account_unavailable'
            );
        }

        /*
        |--------------------------------------------------------------------------
        | CREATE ONE-TIME EXCHANGE CODE
        |--------------------------------------------------------------------------
        */

        $exchangeCode =
            Str::random(64);

        Cache::put(
            $this->exchangeKey(
                $exchangeCode
            ),
            [
                'user_id' =>
                    $user->id,

                'social_account_id' =>
                    $socialAccount->id,
            ],
            now()->addMinutes(5)
        );

        return redirect()->away(
            $frontendUrl
            . '/social-auth/callback'
            . '?code='
            . urlencode(
                $exchangeCode
            )
        );
    }

    /*
    |--------------------------------------------------------------------------
    | EXCHANGE CODE FOR LOGIN
    |--------------------------------------------------------------------------
    */

    public function exchange(
        Request $request
    ) {
        $validated =
            $request->validate([
                'code' => [
                    'required',
                    'string',
                    'size:64',
                ],
            ]);

        /*
         * pull() makes the code
         * one-time use.
         */

        $payload =
            Cache::pull(
                $this->exchangeKey(
                    $validated['code']
                )
            );

        if (
            ! $payload ||
            empty(
                $payload['user_id']
            )
        ) {
            return response()->json([
                'status' => false,

                'message' =>
                    'This social login session has expired. Please try again.',
            ], 422);
        }

        $user =
            User::find(
                $payload['user_id']
            );

        if (! $user) {
            return response()->json([
                'status' => false,

                'message' =>
                    'Unable to complete social login.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | ACCOUNT STATUS
        |--------------------------------------------------------------------------
        */

        if (
            $user->account_status
            !== 'active'
        ) {
            return response()->json([
                'status' => false,

                'message' =>
                    $this->accountStatusMessage(
                        $user->account_status
                    ),
            ], 403);
        }

        /*
        |--------------------------------------------------------------------------
        | PRESERVE EXISTING 2FA
        |--------------------------------------------------------------------------
        */

        if (
            ! empty(
                $user->two_factor_secret
            ) &&
            ! empty(
                $user->two_factor_confirmed_at
            )
        ) {
            $challengeToken =
                Str::random(64);

            Cache::put(
                $this->twoFactorChallengeKey(
                    $challengeToken
                ),
                [
                    'user_id' =>
                        $user->id,
                ],
                now()->addMinutes(5)
            );

            return response()->json([
                'status' => true,

                'requires_two_factor' =>
                    true,

                'challenge_token' =>
                    $challengeToken,

                'email' =>
                    $user->email,

                'message' =>
                    'Two-factor authentication is required.',
            ]);
        }

        /*
        |--------------------------------------------------------------------------
        | SOCIAL ACCOUNT
        |--------------------------------------------------------------------------
        */

        $socialAccount =
            ! empty(
                $payload[
                    'social_account_id'
                ]
            )
                ? SocialAccount::find(
                    $payload[
                        'social_account_id'
                    ]
                )
                : null;

        /*
        |--------------------------------------------------------------------------
        | CREATE SANCTUM TOKEN
        |--------------------------------------------------------------------------
        */

        $token =
            $user
                ->createToken(
                    'auth-token'
                )
                ->plainTextToken;

        return response()->json([
            'status' => true,

            'requires_two_factor' =>
                false,

            'message' =>
                'Login successful.',

            'token' =>
                $token,

            'user' =>
                $this->userPayload(
                    $user,
                    $socialAccount
                ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PUBLIC PROVIDER STATUS
    |--------------------------------------------------------------------------
    */

    public function providers()
    {
        $google =
            SocialLoginSetting::where(
                'provider',
                'google'
            )->first();

        $googleEnabled =
            $google &&
            $google->is_enabled &&
            ! empty(
                $google->client_id
            ) &&
            ! empty(
                $google->client_secret
            ) &&
            ! empty(
                $google->redirect_uri
            );

        return response()->json([
            'status' => true,

            'providers' => [
                'google' => [
                    'enabled' =>
                        (bool)
                            $googleEnabled,
                ],
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | USER PAYLOAD
    |--------------------------------------------------------------------------
    */

    private function userPayload(
        User $user,
        ?SocialAccount $socialAccount = null
    ): array {
        $photo = null;

        if ($user->photo) {
            if (
                str_starts_with(
                    $user->photo,
                    'http://'
                ) ||
                str_starts_with(
                    $user->photo,
                    'https://'
                )
            ) {
                $photo =
                    $user->photo;
            } else {
                $photo =
                    asset(
                        $user->photo
                    );
            }
        } elseif (
            $socialAccount?->avatar
        ) {
            $photo =
                $socialAccount->avatar;
        }

        return [
            'id' =>
                $user->id,

            'name' =>
                $user->name,

            'first_name' =>
                $user->first_name,

            'last_name' =>
                $user->last_name,

            'email' =>
                $user->email,

            'phone' =>
                $user->phone,

            'role' =>
                $user->role,

            'photo' =>
                $photo,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | CREATE PROVIDER FROM DATABASE SETTINGS
    |--------------------------------------------------------------------------
    */

    private function makeProvider(
        Request $request,
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

        abort_if(
            ! $setting ||
            ! $setting->is_enabled,
            404,
            'Social login provider is not enabled.'
        );

        abort_if(
            empty(
                $setting->client_id
            ) ||
            empty(
                $setting->client_secret
            ) ||
            empty(
                $setting->redirect_uri
            ),
            503,
            'Social login provider is not configured.'
        );

        if (
            $provider === 'google'
        ) {
            return (
                new GoogleProvider(
                    $request,

                    trim(
                        $setting->client_id
                    ),

                    trim(
                        $setting->client_secret
                    ),

                    trim(
                        $setting->redirect_uri
                    )
                )
            )->stateless();
        }

        abort(404);
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

    /*
    |--------------------------------------------------------------------------
    | CACHE KEYS
    |--------------------------------------------------------------------------
    */

    private function stateKey(
        string $state
    ): string {
        return
            'social_oauth_state:'
            . hash(
                'sha256',
                $state
            );
    }

    private function exchangeKey(
        string $code
    ): string {
        return
            'social_auth_exchange:'
            . hash(
                'sha256',
                $code
            );
    }

    private function twoFactorChallengeKey(
        string $token
    ): string {
        return
            'two_factor_login:'
            . hash(
                'sha256',
                $token
            );
    }

    /*
    |--------------------------------------------------------------------------
    | FRONTEND URL
    |--------------------------------------------------------------------------
    */

    private function frontendUrl(): string
    {
        return rtrim(
            (string) config(
                'app.frontend_url',
                'http://localhost:5173'
            ),
            '/'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | ACCOUNT STATUS MESSAGE
    |--------------------------------------------------------------------------
    */

    private function accountStatusMessage(
        string $status
    ): string {
        if (
            $status === 'banned'
        ) {
            return
                'Your account has been banned.';
        }

        if (
            $status ===
            'suspended'
        ) {
            return
                'Your account has been suspended.';
        }

        if (
            $status ===
            'pending_activation'
        ) {
            return
                'Your account is pending activation.';
        }

        return
            'Your account is not available.';
    }
}