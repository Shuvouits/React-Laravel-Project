<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("
            ALTER TABLE users
            MODIFY account_status ENUM(
                'active',
                'pending_activation',
                'banned',
                'suspended'
            ) NOT NULL DEFAULT 'active'
        ");
    }

    public function down(): void
    {
        DB::table('users')
            ->where('account_status', 'pending_activation')
            ->update(['account_status' => 'suspended']);

        DB::statement("
            ALTER TABLE users
            MODIFY account_status ENUM(
                'active',
                'banned',
                'suspended'
            ) NOT NULL DEFAULT 'active'
        ");
    }
};
