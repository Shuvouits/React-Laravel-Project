<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => [
                'required',
                'email',
            ],

            'password' => [
                'required',
                'string',
            ],
        ]);

        $user = User::where(
            'email',
            strtolower($validated['email'])
        )->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => [
                    'The provided credentials are incorrect.'
                ],
            ]);
        }

        /*
         * Optional:
         * Delete old tokens if you want only one active login.
         *
         * $user->tokens()->delete();
         */

        $token = $user
            ->createToken($user->role . '-token')
            ->plainTextToken;

        return response()->json([
            'status' => true,
            'message' => 'Login successful.',
            'user' => $user,
            'token' => $token,
        ]);
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
