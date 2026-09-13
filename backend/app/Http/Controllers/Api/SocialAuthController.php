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

        $socialite = $this->makeProvider(
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

    public function callback(
        Request $request,
        string $provider
    ) {
        $this->guardProvider(
            $provider
        );

        $frontendUrl =
            $this->frontendUrl();

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

        $providerUserId = trim(
            (string)
                $oauthUser->getId()
        );

        $email = strtolower(
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

        $firstName = trim(
            (string) (
                $rawUser['given_name']
                ?? ''
            )
        );

        $lastName = trim(
            (string) (
                $rawUser['family_name']
                ?? ''
            )
        );

        $name = trim(
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

        /*
         * Some Google responses may contain
         * the full name but not given_name /
         * family_name. Use the full name as
         * a fallback in that situation.
         */
        if (
            ! $firstName &&
            $name
        ) {
            $nameParts =
                preg_split(
                    '/\s+/',
                    trim($name)
                );

            $nameParts =
                array_values(
                    array_filter(
                        $nameParts
                    )
                );

            if (
                ! empty(
                    $nameParts
                )
            ) {
                $firstName =
                    array_shift(
                        $nameParts
                    );

                if (
                    ! $lastName &&
                    ! empty(
                        $nameParts
                    )
                ) {
                    $lastName =
                        implode(
                            ' ',
                            $nameParts
                        );
                }
            }
        }

        $avatar =
            $oauthUser->getAvatar();

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

                /*
                 * Existing Google-linked account.
                 */
                if ($socialAccount) {
                    $user =
                        User::findOrFail(
                            $socialAccount->user_id
                        );

                    $user =
                        $this->syncSocialProfile(
                            $user,
                            $name,
                            $firstName,
                            $lastName,
                            $avatar
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
                 * Try matching an existing Storify
                 * account by verified email.
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
                 * Create a new customer when the
                 * email does not already exist.
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

                    $user =
                        $user->fresh();
                } else {
                    /*
                     * Existing normal account:
                     * fill missing Google profile
                     * information without replacing
                     * manually edited values.
                     */
                    $user =
                        $this->syncSocialProfile(
                            $user,
                            $name,
                            $firstName,
                            $lastName,
                            $avatar
                        );
                }

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


    private function syncSocialProfile(
    User $user,
    string $name,
    string $firstName,
    string $lastName,
    ?string $avatar
): User {
    $updates = [];

    if (
        empty(
            $user->first_name
        ) &&
        $firstName
    ) {
        $updates['first_name'] =
            $firstName;
    }

    if (
        empty(
            $user->last_name
        ) &&
        $lastName
    ) {
        $updates['last_name'] =
            $lastName;
    }

    if (
        empty(
            $user->name
        ) &&
        $name
    ) {
        $updates['name'] =
            $name;
    }

    if (
        empty(
            $user->email_verified_at
        )
    ) {
        $updates[
            'email_verified_at'
        ] = now();
    }

    if (
        ! empty(
            $updates
        )
    ) {
        $user
            ->forceFill(
                $updates
            )
            ->save();
    }

    return $user->fresh();
}





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
            $status === 'suspended'
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
