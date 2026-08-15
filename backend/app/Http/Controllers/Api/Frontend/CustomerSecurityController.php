<?php

namespace App\Http\Controllers\Api\Frontend;

use App\Http\Controllers\Controller;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CustomerSecurityController extends Controller
{
    // Security overview
    public function index(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'status' => true,

            'security' => [
                'two_factor_enabled' => (
                    !empty($user->two_factor_secret) &&
                    !empty($user->two_factor_confirmed_at)
                ),

                'two_factor_pending' => (
                    !empty($user->two_factor_secret) &&
                    empty($user->two_factor_confirmed_at)
                ),
            ],

            'sessions' => $this->getUserSessions($request),
        ]);
    }

    // Change password
    public function updatePassword(Request $request)
    {
        $validated = $request->validate([
            'old_password' => [
                'required',
                'string',
            ],

            'new_password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        $user = $request->user();

        if (!Hash::check($validated['old_password'], $user->password)) {
            throw ValidationException::withMessages([
                'old_password' => [
                    'The current password is incorrect.',
                ],
            ]);
        }

        if (Hash::check($validated['new_password'], $user->password)) {
            throw ValidationException::withMessages([
                'new_password' => [
                    'The new password must be different from your current password.',
                ],
            ]);
        }

        $currentSessionId = $this->currentSessionId($request);

        DB::transaction(function () use (
            $user,
            $validated,
            $currentSessionId
        ) {
            $user->forceFill([
                'password' => Hash::make(
                    $validated['new_password']
                ),
            ])->save();

            if ($currentSessionId) {
                DB::table('sessions')
                    ->where('user_id', $user->id)
                    ->where('id', '!=', $currentSessionId)
                    ->delete();
            }
        });

        if ($request->hasSession()) {
            $request->session()->regenerate();
        }

        return response()->json([
            'status' => true,
            'message' => 'Password updated successfully.',
        ]);
    }

    // Start 2FA setup
    public function setupTwoFactor(Request $request)
    {
        $validated = $request->validate([
            'password' => [
                'required',
                'string',
            ],
        ]);

        $user = $request->user();

        if (!Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => [
                    'The password is incorrect.',
                ],
            ]);
        }

        if (
            !empty($user->two_factor_secret) &&
            !empty($user->two_factor_confirmed_at)
        ) {
            return response()->json([
                'status' => false,
                'message' => 'Two-factor authentication is already enabled.',
            ], 422);
        }

        $google2fa = app('pragmarx.google2fa');

        $secret = $google2fa->generateSecretKey();

        $user->forceFill([
            'two_factor_secret' => Crypt::encryptString($secret),
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        $qrUrl = $google2fa->getQRCodeUrl(
            config('app.name', 'Storify'),
            $user->email,
            $secret
        );

        return response()->json([
            'status' => true,
            'message' => 'Two-factor authentication setup started.',

            'two_factor' => [
                'secret' => $secret,
                'qr_url' => $qrUrl,
            ],
        ]);
    }

    // Confirm 2FA
    public function confirmTwoFactor(Request $request)
    {
        $validated = $request->validate([
            'code' => [
                'required',
                'digits:6',
            ],
        ]);

        $user = $request->user();

        if (empty($user->two_factor_secret)) {
            return response()->json([
                'status' => false,
                'message' => 'Two-factor authentication setup has not been started.',
            ], 422);
        }

        if (!empty($user->two_factor_confirmed_at)) {
            return response()->json([
                'status' => false,
                'message' => 'Two-factor authentication is already enabled.',
            ], 422);
        }

        try {
            $secret = Crypt::decryptString(
                $user->two_factor_secret
            );
        } catch (\Throwable $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Unable to read the two-factor authentication secret.',
            ], 422);
        }

        $google2fa = app('pragmarx.google2fa');

        $valid = $google2fa->verifyKey(
            $secret,
            $validated['code']
        );

        if (!$valid) {
            throw ValidationException::withMessages([
                'code' => [
                    'The verification code is invalid.',
                ],
            ]);
        }

        $recoveryCodes = $this->generateRecoveryCodes();

        $user->forceFill([
            'two_factor_recovery_codes' => Crypt::encryptString(
                json_encode($recoveryCodes)
            ),

            'two_factor_confirmed_at' => now(),
        ])->save();

        return response()->json([
            'status' => true,
            'message' => 'Two-factor authentication enabled successfully.',

            'recovery_codes' => $recoveryCodes,
        ]);
    }

    // Disable 2FA
    public function disableTwoFactor(Request $request)
    {
        $validated = $request->validate([
            'password' => [
                'required',
                'string',
            ],

            'code' => [
                'required',
                'digits:6',
            ],
        ]);

        $user = $request->user();

        if (
            empty($user->two_factor_secret) ||
            empty($user->two_factor_confirmed_at)
        ) {
            return response()->json([
                'status' => false,
                'message' => 'Two-factor authentication is not enabled.',
            ], 422);
        }

        if (!Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => [
                    'The password is incorrect.',
                ],
            ]);
        }

        try {
            $secret = Crypt::decryptString(
                $user->two_factor_secret
            );
        } catch (\Throwable $exception) {
            return response()->json([
                'status' => false,
                'message' => 'Unable to read the two-factor authentication secret.',
            ], 422);
        }

        $google2fa = app('pragmarx.google2fa');

        $valid = $google2fa->verifyKey(
            $secret,
            $validated['code']
        );

        if (!$valid) {
            throw ValidationException::withMessages([
                'code' => [
                    'The verification code is invalid.',
                ],
            ]);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ])->save();

        return response()->json([
            'status' => true,
            'message' => 'Two-factor authentication disabled successfully.',
        ]);
    }

    // Regenerate recovery codes
    public function regenerateRecoveryCodes(Request $request)
    {
        $validated = $request->validate([
            'password' => [
                'required',
                'string',
            ],
        ]);

        $user = $request->user();

        if (
            empty($user->two_factor_secret) ||
            empty($user->two_factor_confirmed_at)
        ) {
            return response()->json([
                'status' => false,
                'message' => 'Two-factor authentication is not enabled.',
            ], 422);
        }

        if (!Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'password' => [
                    'The password is incorrect.',
                ],
            ]);
        }

        $recoveryCodes = $this->generateRecoveryCodes();

        $user->forceFill([
            'two_factor_recovery_codes' => Crypt::encryptString(
                json_encode($recoveryCodes)
            ),
        ])->save();

        return response()->json([
            'status' => true,
            'message' => 'Recovery codes regenerated successfully.',
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    // Sign out other sessions
    public function logoutOtherSessions(Request $request)
    {
        $currentSessionId = $this->currentSessionId($request);

        if (!$currentSessionId) {
            return response()->json([
                'status' => false,
                'message' => 'Current browser session could not be identified.',
            ], 422);
        }

        $deleted = DB::table('sessions')
            ->where('user_id', $request->user()->id)
            ->where('id', '!=', $currentSessionId)
            ->delete();

        return response()->json([
            'status' => true,
            'message' => 'All other sessions have been signed out.',
            'sessions_removed' => $deleted,
        ]);
    }

    // Get active sessions
    private function getUserSessions(Request $request): array
    {
        $currentSessionId = $this->currentSessionId($request);

        return DB::table('sessions')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('last_activity')
            ->get()
            ->map(function ($session) use ($currentSessionId) {
                return [
                    'id' => $session->id,
                    'ip_address' => $session->ip_address,
                    'user_agent' => $session->user_agent,

                    'browser' => $this->detectBrowser(
                        $session->user_agent
                    ),

                    'device' => $this->detectDevice(
                        $session->user_agent
                    ),

                    'platform' => $this->detectPlatform(
                        $session->user_agent
                    ),

                    'last_activity' => Carbon::createFromTimestamp(
                        $session->last_activity
                    )->toDateTimeString(),

                    'last_activity_human' => Carbon::createFromTimestamp(
                        $session->last_activity
                    )->diffForHumans(),

                    'is_current' => (
                        $currentSessionId &&
                        $session->id === $currentSessionId
                    ),
                ];
            })
            ->values()
            ->all();
    }

    // Current session ID
    private function currentSessionId(Request $request): ?string
    {
        if (!$request->hasSession()) {
            return null;
        }

        return $request->session()->getId();
    }

    // Recovery codes
    private function generateRecoveryCodes(): array
    {
        return collect(range(1, 8))
            ->map(function () {
                return Str::upper(
                    Str::random(5) .
                    '-' .
                    Str::random(5)
                );
            })
            ->all();
    }

    // Browser
    private function detectBrowser(?string $userAgent): string
    {
        if (!$userAgent) {
            return 'Unknown Browser';
        }

        if (str_contains($userAgent, 'Edg/')) {
            return 'Microsoft Edge';
        }

        if (
            str_contains($userAgent, 'Chrome/') &&
            !str_contains($userAgent, 'Edg/')
        ) {
            return 'Google Chrome';
        }

        if (str_contains($userAgent, 'Firefox/')) {
            return 'Mozilla Firefox';
        }

        if (
            str_contains($userAgent, 'Safari/') &&
            !str_contains($userAgent, 'Chrome/')
        ) {
            return 'Safari';
        }

        return 'Unknown Browser';
    }

    // Platform
    private function detectPlatform(?string $userAgent): string
    {
        if (!$userAgent) {
            return 'Unknown';
        }

        if (str_contains($userAgent, 'Windows')) {
            return 'Windows';
        }

        if (
            str_contains($userAgent, 'iPhone') ||
            str_contains($userAgent, 'iPad')
        ) {
            return 'iOS';
        }

        if (str_contains($userAgent, 'Android')) {
            return 'Android';
        }

        if (
            str_contains($userAgent, 'Macintosh') ||
            str_contains($userAgent, 'Mac OS')
        ) {
            return 'macOS';
        }

        if (str_contains($userAgent, 'Linux')) {
            return 'Linux';
        }

        return 'Unknown';
    }

    // Device
    private function detectDevice(?string $userAgent): string
    {
        if (!$userAgent) {
            return 'Unknown Device';
        }

        if (
            str_contains($userAgent, 'Mobile') ||
            str_contains($userAgent, 'Android') ||
            str_contains($userAgent, 'iPhone')
        ) {
            return 'Mobile';
        }

        if (
            str_contains($userAgent, 'iPad') ||
            str_contains($userAgent, 'Tablet')
        ) {
            return 'Tablet';
        }

        return 'Desktop';
    }
}