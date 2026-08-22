<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /**
     * Customer Registration
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'password' => $validated['password'],

            // Public registration is always customer
            'role' => 'customer',
        ]);

        $token = $user->createToken('customer-token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Registration successful.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }


    /**
     * Vendor Registration
     */
    public function vendorRegister(Request $request)
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
            ],

            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
            ],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'password' => $validated['password'],
            'role' => 'vendor',
        ]);

        $token = $user->createToken('vendor-token')->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Vendor registration successful.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }


    /**
     * Login
     */

    // Login
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::query()
            ->where('email', $validated['email'])
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => [
                    'The provided credentials are incorrect.',
                ],
            ]);
        }

        if ($user->account_status !== 'active') {
            return response()->json([
                'status' => false,
                'message' => $this->accountStatusMessage($user->account_status),
            ], 403);
        }

        // 2FA required
        if (
            !empty($user->two_factor_secret) &&
            !empty($user->two_factor_confirmed_at)
        ) {
            $challengeToken = Str::random(64);

            Cache::put(
                $this->twoFactorChallengeKey($challengeToken),
                [
                    'user_id' => $user->id,
                ],
                now()->addMinutes(5)
            );

            return response()->json([
                'status' => true,
                'requires_two_factor' => true,
                'challenge_token' => $challengeToken,
                'email' => $user->email,
                'message' => 'Two-factor authentication is required.',
            ]);
        }

        return $this->completeLogin($user);
    }



    // Verify login 2FA
    public function twoFactorChallenge(Request $request)
    {
        $validated = $request->validate([
            'challenge_token' => [
                'required',
                'string',
                'max:100',
            ],
            'code' => [
                'nullable',
                'digits:6',
                'required_without:recovery_code',
            ],
            'recovery_code' => [
                'nullable',
                'string',
                'required_without:code',
            ],
        ]);

        $challengeKey = $this->twoFactorChallengeKey(
            $validated['challenge_token']
        );

        $challenge = Cache::get($challengeKey);

        if (!$challenge || empty($challenge['user_id'])) {
            return response()->json([
                'status' => false,
                'message' => 'Your verification session has expired. Please sign in again.',
            ], 422);
        }

        $user = User::find($challenge['user_id']);

        if (!$user) {
            Cache::forget($challengeKey);

            return response()->json([
                'status' => false,
                'message' => 'Unable to verify this login.',
            ], 422);
        }

        if ($user->account_status !== 'active') {
            Cache::forget($challengeKey);

            return response()->json([
                'status' => false,
                'message' => $this->accountStatusMessage($user->account_status),
            ], 403);
        }

        if (
            empty($user->two_factor_secret) ||
            empty($user->two_factor_confirmed_at)
        ) {
            Cache::forget($challengeKey);

            return response()->json([
                'status' => false,
                'message' => 'Two-factor authentication is not enabled.',
            ], 422);
        }

        if (!empty($validated['code'])) {
            $this->verifyAuthenticatorCode(
                $user,
                $validated['code']
            );
        } else {
            $this->verifyRecoveryCode(
                $user,
                $validated['recovery_code']
            );
        }

        // One-time login challenge
        Cache::forget($challengeKey);

        return $this->completeLogin($user);
    }

    // Verify authenticator code
    private function verifyAuthenticatorCode(User $user, string $code): void
    {
        try {
            $secret = Crypt::decryptString(
                $user->two_factor_secret
            );
        } catch (\Throwable $exception) {
            throw ValidationException::withMessages([
                'code' => [
                    'Unable to verify two-factor authentication.',
                ],
            ]);
        }

        $google2fa = app('pragmarx.google2fa');

        $valid = $google2fa->verifyKey(
            $secret,
            $code
        );

        if (!$valid) {
            throw ValidationException::withMessages([
                'code' => [
                    'The authentication code is invalid.',
                ],
            ]);
        }
    }

    // Verify recovery code
    private function verifyRecoveryCode(User $user, string $recoveryCode): void
    {
        if (empty($user->two_factor_recovery_codes)) {
            throw ValidationException::withMessages([
                'recovery_code' => [
                    'No recovery codes are available.',
                ],
            ]);
        }

        try {
            $codes = json_decode(
                Crypt::decryptString(
                    $user->two_factor_recovery_codes
                ),
                true
            );
        } catch (\Throwable $exception) {
            $codes = [];
        }

        if (!is_array($codes)) {
            $codes = [];
        }

        $submittedCode = Str::upper(
            trim($recoveryCode)
        );

        $matchedIndex = null;

        foreach ($codes as $index => $code) {
            if (
                hash_equals(
                    Str::upper(trim($code)),
                    $submittedCode
                )
            ) {
                $matchedIndex = $index;
                break;
            }
        }

        if ($matchedIndex === null) {
            throw ValidationException::withMessages([
                'recovery_code' => [
                    'The recovery code is invalid.',
                ],
            ]);
        }

        // Recovery code can only be used once
        unset($codes[$matchedIndex]);

        $user->forceFill([
            'two_factor_recovery_codes' => Crypt::encryptString(
                json_encode(array_values($codes))
            ),
        ])->save();
    }

    // Complete login
    // Complete login
private function completeLogin(User $user)
{
    $token = $user
        ->createToken('auth-token')
        ->plainTextToken;


    return response()->json([
        'status' => true,
        'requires_two_factor' => false,
        'message' => 'Login successful.',
        'token' => $token,

        'user' => [
            'id' => $user->id,
            'name' => $user->name,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,

            'photo' => $user->photo
                ? asset($user->photo)
                : null,
        ],
    ]);
}

    // Challenge cache key
    private function twoFactorChallengeKey(string $token): string
    {
        return 'two_factor_login:' . hash(
            'sha256',
            $token
        );
    }

    // Account status message
    private function accountStatusMessage(string $status): string
    {
        if ($status === 'banned') {
            return 'Your account has been banned.';
        }

        if ($status === 'suspended') {
            return 'Your account has been suspended.';
        }

        if ($status === 'pending_activation') {
            return 'Your account is pending activation.';
        }

        return 'Your account is not available.';
    }
    /**
     * Logged-in User
     */
    public function me(Request $request)
    {
        return response()->json([
            'status' => true,
            'user' => $request->user(),
        ]);
    }


    /**
     * Logout Current Device
     */
    public function logout(Request $request)
    {
        $request->user()
            ->currentAccessToken()
            ->delete();

        return response()->json([
            'status' => true,
            'message' => 'Logged out successfully.',
        ]);
    }


    /**
     * Logout From All Devices
     */
    public function logoutAll(Request $request)
    {
        $request->user()
            ->tokens()
            ->delete();

        return response()->json([
            'status' => true,
            'message' => 'Logged out from all devices.',
        ]);
    }
}
