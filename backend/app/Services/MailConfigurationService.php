<?php

namespace App\Services;

use App\Models\EmailSetting;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;

class MailConfigurationService
{
    public function apply(
        bool $purge = false,
        bool $force = false
    ): ?EmailSetting {
        if (
            ! Schema::hasTable(
                'email_settings'
            )
        ) {
            return null;
        }

        $setting =
            EmailSetting::query()
                ->first();

        if (! $setting) {
            return null;
        }

        if (
            ! $force &&
            ! $setting->is_enabled
        ) {
            return null;
        }

        if (
            ! $setting->host ||
            ! $setting->port ||
            ! $setting->from_address
        ) {
            return null;
        }

        /*
        |--------------------------------------------------------------------------
        | SMTP SCHEME
        |--------------------------------------------------------------------------
        |
        | TLS / STARTTLS normally uses smtp on ports such as 587.
        | SSL normally uses smtps, commonly port 465.
        |
        */

        $scheme =
            $setting->encryption === 'ssl'
                ? 'smtps'
                : null;

        config([
            'mail.default' =>
                'smtp',

            'mail.mailers.smtp.transport' =>
                'smtp',

            'mail.mailers.smtp.scheme' =>
                $scheme,

            'mail.mailers.smtp.url' =>
                null,

            'mail.mailers.smtp.host' =>
                $setting->host,

            'mail.mailers.smtp.port' =>
                (int) $setting->port,

            'mail.mailers.smtp.username' =>
                $setting->username,

            'mail.mailers.smtp.password' =>
                $setting->password,

            'mail.from.address' =>
                $setting->from_address,

            'mail.from.name' =>
                $setting->from_name
                    ?: config('app.name'),
        ]);

        /*
         * Remove an already-created SMTP transport
         * after settings are changed.
         */
        if ($purge) {
            Mail::purge('smtp');
        }

        return $setting;
    }
}
