<?php

namespace App\Providers;

use App\Services\MailConfigurationService;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(
        MailConfigurationService $mailConfiguration
    ): void {
        try {
            $mailConfiguration->apply();
        } catch (\Throwable $error) {
            /*
             * Never prevent Laravel from booting
             * because SMTP settings are unavailable.
             *
             * In that situation Laravel simply falls
             * back to config/mail.php and .env.
             */
            report($error);
        }
    }
}
