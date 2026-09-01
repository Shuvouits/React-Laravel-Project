<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contact_page_settings', function (Blueprint $table) {
            $table->id();

            $table->json('hero')
                ->nullable();

            $table->json('contact_information')
                ->nullable();

            $table->json('form_content')
                ->nullable();

            $table->json('map_content')
                ->nullable();

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });

        Schema::create('contact_messages', function (Blueprint $table) {
            $table->id();

            $table->string('name');
            $table->string('company')->nullable();
            $table->string('phone')->nullable();
            $table->string('email');
            $table->string('subject');
            $table->text('message');

            $table->string('status')
                ->default('new');

            $table->boolean('is_read')
                ->default(false);

            $table->timestamp('read_at')
                ->nullable();

            $table->timestamps();

            $table->index('email');
            $table->index('status');
            $table->index('is_read');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contact_messages');
        Schema::dropIfExists('contact_page_settings');
    }
};
