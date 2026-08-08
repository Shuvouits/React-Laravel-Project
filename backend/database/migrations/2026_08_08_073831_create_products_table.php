<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {

            $table->id();


            /*
            |--------------------------------------------------------------------------
            | BASIC DETAILS
            |--------------------------------------------------------------------------
            */

            $table->string('title');

            $table->string('slug')
                ->unique();

            $table->text('summary')
                ->nullable();

            $table->longText('description')
                ->nullable();

            $table->longText('specifications')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->enum('status', [
                'active',
                'draft',
                'archived',
            ])
                ->default('draft')
                ->index();

            $table->boolean('is_featured')
                ->default(false)
                ->index();


            /*
            |--------------------------------------------------------------------------
            | PUBLISHING
            |--------------------------------------------------------------------------
            */

            $table->boolean('online_store')
                ->default(true);

            $table->boolean('point_of_sale')
                ->default(true);


            /*
            |--------------------------------------------------------------------------
            | ORGANIZATION
            |--------------------------------------------------------------------------
            |
            | IMPORTANT:
            |
            | index() constrained()-এর আগে।
            |
            */

            $table->foreignId('category_id')
                ->nullable()
                ->index()
                ->constrained('categories')
                ->nullOnDelete();


            $table->foreignId('brand_id')
                ->nullable()
                ->index()
                ->constrained('brands')
                ->nullOnDelete();


            $table->string('type')
                ->nullable()
                ->index();

            $table->json('tags')
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | SOURCE / OWNER
            |--------------------------------------------------------------------------
            */

            $table->enum('source', [
                'admin',
                'vendor',
            ])
                ->default('admin')
                ->index();


            $table->foreignId('created_by')
                ->nullable()
                ->index()
                ->constrained('users')
                ->nullOnDelete();


            /*
            |--------------------------------------------------------------------------
            | PRODUCT FORMAT
            |--------------------------------------------------------------------------
            */

            $table->string(
                'product_format',
                30
            )
                ->default('physical');


            /*
            |--------------------------------------------------------------------------
            | PRE-ORDER
            |--------------------------------------------------------------------------
            */

            $table->boolean('preorder_enabled')
                ->default(false);


            /*
            |--------------------------------------------------------------------------
            | BASE PRICING
            |--------------------------------------------------------------------------
            |
            | Product-এর variants না থাকলে এগুলো use হবে।
            |
            */

            $table->decimal(
                'price',
                12,
                2
            )
                ->nullable();


            $table->decimal(
                'compare_at_price',
                12,
                2
            )
                ->nullable();


            $table->decimal(
                'cost_per_item',
                12,
                2
            )
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | BASE INVENTORY
            |--------------------------------------------------------------------------
            |
            | Product-এর variants না থাকলে base inventory।
            |
            */

            $table->string('sku')
                ->nullable()
                ->unique();

            $table->string('barcode')
                ->nullable()
                ->index();

            $table->integer('quantity')
                ->default(0);

            $table->boolean('track_quantity')
                ->default(true);

            $table->boolean(
                'continue_selling_when_out_of_stock'
            )
                ->default(false);


            /*
            |--------------------------------------------------------------------------
            | SHIPPING
            |--------------------------------------------------------------------------
            */

            $table->decimal(
                'weight',
                10,
                3
            )
                ->default(0);


            $table->string(
                'weight_unit',
                10
            )
                ->default('kg');


            $table->string(
                'country_of_origin',
                100
            )
                ->nullable();


            $table->string(
                'hs_code',
                50
            )
                ->nullable();


            $table->string(
                'customs_description',
                255
            )
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | SEO
            |--------------------------------------------------------------------------
            */

            $table->string(
                'seo_title',
                70
            )
                ->nullable();


            $table->string(
                'seo_description',
                160
            )
                ->nullable();


            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $table->timestamps();


            /*
            |--------------------------------------------------------------------------
            | COMPOSITE INDEX
            |--------------------------------------------------------------------------
            */

            $table->index([
                'status',
                'is_featured',
            ]);

            $table->index([
                'category_id',
                'brand_id',
            ]);
        });
    }


    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
