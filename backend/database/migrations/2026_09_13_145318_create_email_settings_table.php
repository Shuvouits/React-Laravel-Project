<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('email_settings', function (Blueprint $table) {
            $table->id();

            $table->boolean('is_enabled')
                ->default(false);

            $table->string('mailer', 50)
                ->default('smtp');

            $table->string('host')
                ->nullable();

            $table->unsignedInteger('port')
                ->default(587);

            $table->string('username')
                ->nullable();

            $table->text('password')
                ->nullable();

            $table->enum('encryption', [
                'tls',
                'ssl',
            ])->default('tls');

            $table->string('from_address')
                ->nullable();

            $table->string('from_name')
                ->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_settings');
    }
};
