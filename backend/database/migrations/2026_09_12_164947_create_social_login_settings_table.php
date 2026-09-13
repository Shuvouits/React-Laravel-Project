<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create(
            'social_login_settings',
            function (Blueprint $table) {
                $table->id();

                $table
                    ->string('provider', 50)
                    ->unique();

                $table
                    ->boolean('is_enabled')
                    ->default(false);

                $table
                    ->text('client_id')
                    ->nullable();

                $table
                    ->text('client_secret')
                    ->nullable();

                $table
                    ->text('redirect_uri')
                    ->nullable();

                $table->timestamps();
            }
        );
    }

    public function down(): void
    {
        Schema::dropIfExists(
            'social_login_settings'
        );
    }
};
