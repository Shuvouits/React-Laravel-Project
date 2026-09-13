<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EmailSetting;
use App\Services\MailConfigurationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class EmailSettingController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | GET SETTINGS
    |--------------------------------------------------------------------------
    */

    public function show()
    {
        $setting =
            EmailSetting::firstOrCreate(
                [],
                [
                    'is_enabled' => false,
                    'mailer' => 'smtp',
                    'port' => 587,
                    'encryption' => 'tls',
                    'from_name' => config(
                        'app.name',
                        'Storify'
                    ),
                ]
            );

        return response()->json([
            'status' => true,
            'setting' =>
                $this->formatSetting(
                    $setting
                ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | UPDATE SETTINGS
    |--------------------------------------------------------------------------
    */

    public function update(
        Request $request,
        MailConfigurationService $mailConfiguration
    ) {
        $validated =
            $request->validate([
                'is_enabled' => [
                    'required',
                    'boolean',
                ],

                'mailer' => [
                    'nullable',
                    'string',
                    'in:smtp',
                ],

                'host' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'port' => [
                    'nullable',
                    'integer',
                    'min:1',
                    'max:65535',
                ],

                'username' => [
                    'nullable',
                    'string',
                    'max:255',
                ],

                'password' => [
                    'nullable',
                    'string',
                    'max:2000',
                ],

                'encryption' => [
                    'nullable',
                    'string',
                    'in:tls,ssl',
                ],

                'from_address' => [
                    'nullable',
                    'email',
                    'max:255',
                ],

                'from_name' => [
                    'nullable',
                    'string',
                    'max:255',
                ],
            ]);

        $setting =
            EmailSetting::firstOrCreate(
                [],
                [
                    'mailer' => 'smtp',
                    'port' => 587,
                    'encryption' => 'tls',
                ]
            );

        $host = trim(
            (string) (
                $validated['host']
                ?? ''
            )
        );

        $username = trim(
            (string) (
                $validated['username']
                ?? ''
            )
        );

        $password = (string) (
            $validated['password']
            ?? ''
        );

        $fromAddress = trim(
            (string) (
                $validated['from_address']
                ?? ''
            )
        );

        $fromName = trim(
            (string) (
                $validated['from_name']
                ?? ''
            )
        );

        /*
        |--------------------------------------------------------------------------
        | VALIDATE ENABLED CONFIG
        |--------------------------------------------------------------------------
        */

        if (
            $validated['is_enabled']
        ) {
            if (! $host) {
                return response()->json([
                    'status' => false,
                    'message' =>
                        'SMTP Host is required before enabling email.',
                    'errors' => [
                        'host' => [
                            'SMTP Host is required.',
                        ],
                    ],
                ], 422);
            }

            if (! $fromAddress) {
                return response()->json([
                    'status' => false,
                    'message' =>
                        'From Email is required before enabling email.',
                    'errors' => [
                        'from_address' => [
                            'From Email is required.',
                        ],
                    ],
                ], 422);
            }

            if (
                $username &&
                ! $password &&
                ! $setting->password
            ) {
                return response()->json([
                    'status' => false,
                    'message' =>
                        'SMTP Password is required for this account.',
                    'errors' => [
                        'password' => [
                            'SMTP Password is required.',
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

            'mailer' =>
                'smtp',

            'host' =>
                $host ?: null,

            'port' =>
                (int) (
                    $validated['port']
                    ?? 587
                ),

            'username' =>
                $username ?: null,

            'encryption' =>
                $validated[
                    'encryption'
                ]
                    ?? 'tls',

            'from_address' =>
                $fromAddress ?: null,

            'from_name' =>
                $fromName ?: null,
        ];

        /*
         * Empty password means keep the
         * existing encrypted password.
         */
        if ($password !== '') {
            $updateData['password'] =
                $password;
        }

        $setting->update(
            $updateData
        );

        $setting->refresh();

        /*
         * Apply new configuration immediately.
         */
        $mailConfiguration->apply(
            purge: true
        );

        return response()->json([
            'status' => true,

            'message' =>
                'Email configuration updated successfully.',

            'setting' =>
                $this->formatSetting(
                    $setting
                ),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SEND TEST EMAIL
    |--------------------------------------------------------------------------
    */

    public function test(
        Request $request,
        MailConfigurationService $mailConfiguration
    ) {
        $validated =
            $request->validate([
                'email' => [
                    'required',
                    'email',
                    'max:255',
                ],
            ]);

        $setting =
            EmailSetting::first();

        if (! $setting) {
            return response()->json([
                'status' => false,
                'message' =>
                    'Please save your SMTP configuration first.',
            ], 422);
        }

        if (
            ! $setting->host ||
            ! $setting->port ||
            ! $setting->from_address
        ) {
            return response()->json([
                'status' => false,
                'message' =>
                    'SMTP configuration is incomplete.',
            ], 422);
        }

        if (
            $setting->username &&
            ! $setting->password
        ) {
            return response()->json([
                'status' => false,
                'message' =>
                    'SMTP password is missing.',
            ], 422);
        }

        try {
            /*
             * force=true lets the admin test
             * the configuration even when the
             * global Enabled toggle is OFF.
             */
            $mailConfiguration->apply(
                purge: true,
                force: true
            );

            Mail::raw(
                "This is a test email from Storify.\n\n"
                . "Your SMTP configuration is working correctly.",
                function ($message) use (
                    $validated
                ) {
                    $message
                        ->to(
                            $validated['email']
                        )
                        ->subject(
                            'Storify SMTP Test'
                        );
                }
            );

            return response()->json([
                'status' => true,

                'message' =>
                    'Test email sent successfully to '
                    . $validated['email']
                    . '.',
            ]);
        } catch (\Throwable $error) {
            report($error);

            return response()->json([
                'status' => false,

                'message' =>
                    app()->environment('local')
                        ? $error->getMessage()
                        : 'Unable to send the test email. Please verify your SMTP settings.',
            ], 422);
        }
    }

    /*
    |--------------------------------------------------------------------------
    | FORMAT SETTING
    |--------------------------------------------------------------------------
    */

    private function formatSetting(
        EmailSetting $setting
    ): array {
        return [
            'id' =>
                $setting->id,

            'is_enabled' =>
                (bool)
                    $setting->is_enabled,

            'mailer' =>
                $setting->mailer
                    ?: 'smtp',

            'host' =>
                $setting->host
                    ?: '',

            'port' =>
                (int) (
                    $setting->port
                    ?: 587
                ),

            'username' =>
                $setting->username
                    ?: '',

            /*
             * Never return the SMTP password.
             */
            'password' =>
                '',

            'has_password' =>
                ! empty(
                    $setting->password
                ),

            'encryption' =>
                $setting->encryption
                    ?: 'tls',

            'from_address' =>
                $setting->from_address
                    ?: '',

            'from_name' =>
                $setting->from_name
                    ?: '',
        ];
    }
}
