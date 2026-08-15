<?php

namespace App\Http\Controllers\Api\Account;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'email' => $user->email,
                'phone' => $user->phone,
                'birthdate' => $user->birthdate,
                'gender' => $user->gender,
            ],
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],

            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],

            'phone' => ['nullable', 'string', 'max:30'],
            'birthdate' => ['nullable', 'date', 'before:today'],
            'gender' => ['nullable', Rule::in([
                'male',
                'female',
                'other',
            ])],
        ]);

        $user->update([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'name' => trim(
                $validated['first_name'] . ' ' . $validated['last_name']
            ),
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'birthdate' => $validated['birthdate'] ?? null,
            'gender' => $validated['gender'] ?? null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Profile updated successfully.',
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'birthdate' => $user->birthdate,
                'gender' => $user->gender,
            ],
        ]);
    }
}