<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brands', function (Blueprint $table) {

            $table->id();

            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('name');

            $table->string('slug')
                ->unique();

            $table->text('description')
                ->nullable();

            $table->string('website', 2048)
                ->nullable();

            $table->string('logo')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | SOURCE
            |--------------------------------------------------------------------------
            |
            | official = created by admin
            | vendor   = submitted by vendor
            |
            */

            $table->enum('source', [
                'official',
                'vendor',
            ])->default('official');


            /*
            |--------------------------------------------------------------------------
            | VENDOR
            |--------------------------------------------------------------------------
            */

            $table->foreignId('vendor_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();


            /*
            |--------------------------------------------------------------------------
            | APPROVAL
            |--------------------------------------------------------------------------
            */

            $table->enum('approval_status', [
                'pending',
                'approved',
                'rejected',
            ])->default('approved');


            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'active',
                'inactive',
                'archived',
            ])->default('active');


            /*
            |--------------------------------------------------------------------------
            | FEATURED
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_featured')
                ->default(false);


            /*
            |--------------------------------------------------------------------------
            | ORDER
            |--------------------------------------------------------------------------
            */

            $table->unsignedInteger('display_order')
                ->default(0);


            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */

            $table->string('seo_title', 70)
                ->nullable();

            $table->string('seo_description', 160)
                ->nullable();


            $table->timestamps();


            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index('status');
            $table->index('approval_status');
            $table->index('source');
            $table->index('is_featured');
            $table->index('display_order');
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('brands');
    }
};
