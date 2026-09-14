<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ResetPasswordMail;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class PasswordResetController extends Controller
{
    private const TOKEN_EXPIRY_MINUTES = 60;

    /*
    |--------------------------------------------------------------------------
    | FORGOT PASSWORD
    |--------------------------------------------------------------------------
    */

    public function forgotPassword(
        Request $request
    ) {
        $validated =
            $request->validate([
                'email' => [
                    'required',
                    'email',
                    'max:255',
                ],
            ]);

        $email =
            strtolower(
                trim(
                    $validated['email']
                )
            );

        /*
         * Always return the same response.
         * This prevents account enumeration.
         */
        $genericResponse = [
            'status' => true,
            'message' =>
                'If an account exists with this email, a password reset link has been sent.',
        ];

        $user =
            User::query()
                ->whereRaw(
                    'LOWER(email) = ?',
                    [
                        $email,
                    ]
                )
                ->first();

        if (! $user) {
            return response()->json(
                $genericResponse
            );
        }

        /*
         * Do not send reset email for unavailable accounts.
         * Still return the same public response.
         */
        if (
            $user->account_status
            !== 'active'
        ) {
            return response()->json(
                $genericResponse
            );
        }

        $plainToken =
            Str::random(64);

        $hashedToken =
            hash(
                'sha256',
                $plainToken
            );

        /*
         * Only one active reset token per email.
         */
        DB::table(
            'password_reset_tokens'
        )->updateOrInsert(
            [
                'email' =>
                    $email,
            ],
            [
                'token' =>
                    $hashedToken,

                'created_at' =>
                    now(),
            ]
        );

        $frontendUrl =
            rtrim(
                (string) config(
                    'app.frontend_url',
                    'http://localhost:5173'
                ),
                '/'
            );

        $resetUrl =
            $frontendUrl
            . '/reset-password'
            . '?token='
            . urlencode(
                $plainToken
            )
            . '&email='
            . urlencode(
                $email
            );

        try {
            Mail::to(
                $user->email
            )->send(
                new ResetPasswordMail(
                    user: $user,
                    resetUrl: $resetUrl,
                    expiresInMinutes:
                        self::TOKEN_EXPIRY_MINUTES
                )
            );
        } catch (\Throwable $error) {
            report($error);

            /*
             * Remove unusable token if email
             * could not be delivered.
             */
            DB::table(
                'password_reset_tokens'
            )
                ->where(
                    'email',
                    $email
                )
                ->delete();

            if (
                app()->environment(
                    'local'
                )
            ) {
                return response()->json([
                    'status' => false,
                    'message' =>
                        $error->getMessage(),
                ], 422);
            }

            return response()->json([
                'status' => false,
                'message' =>
                    'Unable to send the password reset email. Please try again.',
            ], 422);
        }

        return response()->json(
            $genericResponse
        );
    }

    /*
    |--------------------------------------------------------------------------
    | VALIDATE RESET TOKEN
    |--------------------------------------------------------------------------
    */

    public function validateToken(
        Request $request
    ) {
        $validated =
            $request->validate([
                'email' => [
                    'required',
                    'email',
                ],

                'token' => [
                    'required',
                    'string',
                ],
            ]);

        $email =
            strtolower(
                trim(
                    $validated['email']
                )
            );

        $valid =
            $this->tokenIsValid(
                $email,
                $validated['token']
            );

        if (! $valid) {
            return response()->json([
                'status' => false,
                'message' =>
                    'This password reset link is invalid or has expired.',
            ], 422);
        }

        return response()->json([
            'status' => true,
            'message' =>
                'Password reset link is valid.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | RESET PASSWORD
    |--------------------------------------------------------------------------
    */

    public function resetPassword(
        Request $request
    ) {
        $validated =
            $request->validate([
                'email' => [
                    'required',
                    'email',
                ],

                'token' => [
                    'required',
                    'string',
                ],

                'password' => [
                    'required',
                    'confirmed',

                    Password::min(8)
                        ->letters()
                        ->mixedCase()
                        ->numbers(),
                ],
            ]);

        $email =
            strtolower(
                trim(
                    $validated['email']
                )
            );

        if (
            ! $this->tokenIsValid(
                $email,
                $validated['token']
            )
        ) {
            return response()->json([
                'status' => false,

                'message' =>
                    'This password reset link is invalid or has expired.',
            ], 422);
        }

        $user =
            User::query()
                ->whereRaw(
                    'LOWER(email) = ?',
                    [
                        $email,
                    ]
                )
                ->first();

        if (! $user) {
            return response()->json([
                'status' => false,

                'message' =>
                    'This password reset link is invalid or has expired.',
            ], 422);
        }

        if (
            $user->account_status
            !== 'active'
        ) {
            return response()->json([
                'status' => false,

                'message' =>
                    'This account is currently unavailable.',
            ], 403);
        }

        DB::transaction(
            function () use (
                $user,
                $email,
                $validated
            ) {
                $user->forceFill([
                    'password' =>
                        Hash::make(
                            $validated[
                                'password'
                            ]
                        ),

                    'remember_token' =>
                        Str::random(60),
                ])->save();

                /*
                 * Reset link becomes unusable
                 * immediately after success.
                 */
                DB::table(
                    'password_reset_tokens'
                )
                    ->where(
                        'email',
                        $email
                    )
                    ->delete();

                /*
                 * Security:
                 * logout all existing Sanctum sessions.
                 */
                $user
                    ->tokens()
                    ->delete();
            }
        );

        return response()->json([
            'status' => true,

            'message' =>
                'Your password has been reset successfully. You can now sign in with your new password.',
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | TOKEN VALIDATION
    |--------------------------------------------------------------------------
    */

    private function tokenIsValid(
        string $email,
        string $plainToken
    ): bool {
        $record =
            DB::table(
                'password_reset_tokens'
            )
                ->where(
                    'email',
                    $email
                )
                ->first();

        if (
            ! $record ||
            ! $record->token ||
            ! $record->created_at
        ) {
            return false;
        }

        $createdAt =
            now()->parse(
                $record->created_at
            );

        if (
            $createdAt->lt(
                now()->subMinutes(
                    self::TOKEN_EXPIRY_MINUTES
                )
            )
        ) {
            DB::table(
                'password_reset_tokens'
            )
                ->where(
                    'email',
                    $email
                )
                ->delete();

            return false;
        }

        $submittedHash =
            hash(
                'sha256',
                $plainToken
            );

        return hash_equals(
            (string)
                $record->token,
            $submittedHash
        );
    }
}
