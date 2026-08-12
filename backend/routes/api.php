<?php

use App\Http\Controllers\Api\Admin\BrandAIController;
use App\Http\Controllers\Api\Admin\BrandController;
use App\Http\Controllers\Api\Admin\CategoryAIController;
use App\Http\Controllers\Api\Admin\CategoryController;
use App\Http\Controllers\Api\Admin\CollectionAIController;
use App\Http\Controllers\Api\Admin\CollectionController;
use App\Http\Controllers\Api\Admin\GlobalVariantController;
use App\Http\Controllers\Api\Admin\HeroSlideController;
use App\Http\Controllers\Api\Admin\HomeSectionController;
use App\Http\Controllers\Api\Admin\ProductAIController;
use App\Http\Controllers\Api\Admin\ProductController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Frontend\HomeController;
use Illuminate\Support\Facades\Route;




/*
|--------------------------------------------------------------------------
| STOREFRONT HOME
|--------------------------------------------------------------------------
*/

Route::get(
    '/home/featured-categories',
    [HomeController::class, 'featuredCategories']
);


Route::get(
    '/home/products-on-sale',
    [HomeController::class, 'productsOnSale']
);

Route::get('/home/promotions', [HomeController::class, 'promotions']);

// Frontend Home
Route::get('/home/featured-products', [HomeController::class, 'featuredProducts']);


/*
|--------------------------------------------------------------------------
| Public Authentication Routes
|--------------------------------------------------------------------------
*/

Route::prefix('auth')->group(function () {

    Route::post('/register', [
        AuthController::class,
        'register'
    ]);

    Route::post('/vendor/register', [
        AuthController::class,
        'vendorRegister'
    ]);

    Route::post('/login', [
        AuthController::class,
        'login'
    ]);
});


/*
|--------------------------------------------------------------------------
| Protected Authentication Routes
|--------------------------------------------------------------------------
*/



Route::middleware('auth:sanctum')
    ->prefix('auth')
    ->group(function () {

        Route::get('/me', [
            AuthController::class,
            'me'
        ]);

        Route::post('/logout', [
            AuthController::class,
            'logout'
        ]);

        Route::post('/logout-all', [
            AuthController::class,
            'logoutAll'
        ]);
    });


Route::prefix('admin')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | HERO SLIDER
    |--------------------------------------------------------------------------
    */

    Route::get('/hero-slides', [
        HeroSlideController::class,
        'index'
    ]);


    Route::post('/hero-slides', [
        HeroSlideController::class,
        'store'
    ]);


    Route::post('/hero-slides/reorder', [
        HeroSlideController::class,
        'reorder'
    ]);


    Route::get('/hero-slides/{id}', [
        HeroSlideController::class,
        'show'
    ]);


    Route::post('/hero-slides/{id}/update', [
        HeroSlideController::class,
        'update'
    ]);


    Route::post('/hero-slides/{id}/toggle', [
        HeroSlideController::class,
        'toggle'
    ]);


    Route::delete('/hero-slides/{id}', [
        HeroSlideController::class,
        'destroy'
    ]);


    /*
    |--------------------------------------------------------------------------
    | HOME PAGE SECTIONS
    |--------------------------------------------------------------------------
    */

    Route::get('/home-sections', [
        HomeSectionController::class,
        'index'
    ]);


    Route::post('/home-sections/{section_key}/toggle', [
        HomeSectionController::class,
        'toggle'
    ]);

    Route::post(
        '/home-sections/{sectionKey}/update',
        [HomeSectionController::class, 'update']
    );


    Route::post(
        '/home-sections/promotions/cards/{index}/image',
        [HomeSectionController::class, 'uploadPromotionImage']
    );



    /*
|--------------------------------------------------------------------------
| BRANDS
|--------------------------------------------------------------------------
*/

    Route::get('/brands', [
        BrandController::class,
        'index'
    ]);

    Route::post('/brands', [
        BrandController::class,
        'store'
    ]);

    Route::post('/brands/{id}/toggle-featured', [
        BrandController::class,
        'toggleFeatured'
    ]);

    Route::post('/brands/{id}/archive', [
        BrandController::class,
        'archive'
    ]);

    Route::get('/brands/{id}', [
        BrandController::class,
        'show'
    ]);

    Route::post('/brands/{id}/update', [
        BrandController::class,
        'update'
    ]);

    Route::delete('/brands/{id}', [
        BrandController::class,
        'destroy'
    ]);


    /*
|--------------------------------------------------------------------------
| BRAND AI
|--------------------------------------------------------------------------
*/

    Route::post(
        '/ai/brand-content',
        [
            BrandAIController::class,
            'generate'
        ]
    );


    Route::post(
        '/brands/{id}/toggle-featured',
        [BrandController::class, 'toggleFeatured']
    );




    /*
|--------------------------------------------------------------------------
| CATEGORY MANAGEMENT
|--------------------------------------------------------------------------
*/

    Route::get(
        '/categories',
        [CategoryController::class, 'index']
    );


    /*
|--------------------------------------------------------------------------
| PARENT CATEGORIES
|--------------------------------------------------------------------------
|
| IMPORTANT:
| এই route অবশ্যই /categories/{id} route-এর আগে থাকবে।
|
*/

    Route::get(
        '/categories/parents',
        [CategoryController::class, 'parents']
    );


    /*
|--------------------------------------------------------------------------
| CREATE CATEGORY
|--------------------------------------------------------------------------
*/

    Route::post(
        '/categories',
        [CategoryController::class, 'store']
    );


    /*
|--------------------------------------------------------------------------
| SHOW CATEGORY
|--------------------------------------------------------------------------
*/

    Route::get(
        '/categories/{id}',
        [CategoryController::class, 'show']
    );


    /*
|--------------------------------------------------------------------------
| UPDATE CATEGORY
|--------------------------------------------------------------------------
|
| FormData + image upload সহজ রাখতে POST update ব্যবহার করছি।
|
*/

    Route::post(
        '/categories/{id}/update',
        [CategoryController::class, 'update']
    );


    /*
|--------------------------------------------------------------------------
| TOGGLE FEATURED
|--------------------------------------------------------------------------
*/

    Route::post(
        '/categories/{id}/toggle-featured',
        [CategoryController::class, 'toggleFeatured']
    );


    /*
|--------------------------------------------------------------------------
| DELETE CATEGORY
|--------------------------------------------------------------------------
*/

    Route::delete(
        '/categories/{id}',
        [CategoryController::class, 'destroy']
    );


    /*
|--------------------------------------------------------------------------
| CATEGORY AI
|--------------------------------------------------------------------------
*/

    Route::post(
        '/ai/category-content',
        [CategoryAIController::class, 'generate']
    );



    /*
|--------------------------------------------------------------------------
| GLOBAL VARIANTS
|--------------------------------------------------------------------------
*/

    /*
|--------------------------------------------------------------------------
| LIST
|--------------------------------------------------------------------------
*/

    Route::get(
        '/global-variants',
        [GlobalVariantController::class, 'index']
    );


    /*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/

    Route::post(
        '/global-variants',
        [GlobalVariantController::class, 'store']
    );


    /*
|--------------------------------------------------------------------------
| REORDER
|--------------------------------------------------------------------------
|
| IMPORTANT:
| /{id} route-এর আগে থাকবে।
|
*/

    Route::post(
        '/global-variants/reorder',
        [GlobalVariantController::class, 'reorder']
    );


    /*
|--------------------------------------------------------------------------
| SHOW
|--------------------------------------------------------------------------
*/

    Route::get(
        '/global-variants/{id}',
        [GlobalVariantController::class, 'show']
    );


    /*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
*/

    Route::post(
        '/global-variants/{id}/update',
        [GlobalVariantController::class, 'update']
    );


    /*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/

    Route::delete(
        '/global-variants/{id}',
        [GlobalVariantController::class, 'destroy']
    );


    /*
|--------------------------------------------------------------------------
| COLLECTIONS
|--------------------------------------------------------------------------
*/

    /*
|--------------------------------------------------------------------------
| LIST
|--------------------------------------------------------------------------
|
| GET /api/admin/collections
|
| Supports:
|
| ?tab=all
| ?tab=active
| ?tab=inactive
| ?tab=manual
| ?tab=automated
| ?search=kids
| ?page=1
|
*/

    Route::get(
        '/collections',
        [CollectionController::class, 'index']
    );


    /*
|--------------------------------------------------------------------------
| SEARCH PRODUCTS FOR COLLECTION
|--------------------------------------------------------------------------
|
| GET /api/admin/collections/products/search
|
| Example:
| ?search=iphone
|
| Collection Create/Edit page-এর product search field এটি use করবে।
|
*/

    Route::get(
        '/collections/products/search',
        [CollectionController::class, 'searchProducts']
    );


    /*
|--------------------------------------------------------------------------
| CREATE COLLECTION
|--------------------------------------------------------------------------
|
| POST /api/admin/collections
|
*/

    Route::post(
        '/collections',
        [CollectionController::class, 'store']
    );


    /*
|--------------------------------------------------------------------------
| SHOW COLLECTION
|--------------------------------------------------------------------------
|
| GET /api/admin/collections/{id}
|
*/

    Route::get(
        '/collections/{id}',
        [CollectionController::class, 'show']
    );


    /*
|--------------------------------------------------------------------------
| UPDATE COLLECTION
|--------------------------------------------------------------------------
|
| POST ব্যবহার করছি কারণ image upload + FormData থাকবে।
|
| POST /api/admin/collections/{id}/update
|
*/

    Route::post(
        '/collections/{id}/update',
        [CollectionController::class, 'update']
    );


    /*
|--------------------------------------------------------------------------
| REORDER PRODUCTS INSIDE COLLECTION
|--------------------------------------------------------------------------
|
| POST /api/admin/collections/{id}/products/reorder
|
*/

    Route::post(
        '/collections/{id}/products/reorder',
        [CollectionController::class, 'reorderProducts']
    );


    /*
|--------------------------------------------------------------------------
| DELETE COLLECTION
|--------------------------------------------------------------------------
|
| DELETE /api/admin/collections/{id}
|
*/

    Route::delete(
        '/collections/{id}',
        [CollectionController::class, 'destroy']
    );


    /*
|--------------------------------------------------------------------------
| COLLECTION AI
|--------------------------------------------------------------------------
|
| POST /api/admin/ai/collection-content
|
| target:
|
| description
| seo
| all
|
*/

    Route::post(
        '/ai/collection-content',
        [CollectionAIController::class, 'generate']
    );



    /*
|--------------------------------------------------------------------------
| PRODUCTS
|--------------------------------------------------------------------------
*/

    /*
|--------------------------------------------------------------------------
| PRODUCT LIST
|--------------------------------------------------------------------------
|
| GET /api/admin/products
|
| Supports:
|
| ?tab=all
| ?tab=active
| ?tab=draft
| ?tab=archived
| ?search=nike
| ?category_id=1
| ?brand_id=1
| ?source=admin
|
*/

    Route::get(
        '/products',
        [ProductController::class, 'index']
    );


    /*
|--------------------------------------------------------------------------
| PRODUCT FORM OPTIONS
|--------------------------------------------------------------------------
|
| GET /api/admin/products/form-options
|
| Returns:
| - categories
| - brands
| - collections
| - global variants
|
| IMPORTANT:
| This route MUST stay before /products/{id}
|
*/

    Route::get(
        '/products/form-options',
        [ProductController::class, 'formOptions']
    );


    /*
|--------------------------------------------------------------------------
| CREATE PRODUCT
|--------------------------------------------------------------------------
|
| POST /api/admin/products
|
| FormData supported for media upload.
|
*/

    Route::post(
        '/products',
        [ProductController::class, 'store']
    );


    /*
|--------------------------------------------------------------------------
| PRODUCT MEDIA REORDER
|--------------------------------------------------------------------------
|
| POST /api/admin/products/{id}/media/reorder
|
*/

    Route::post(
        '/products/{id}/media/reorder',
        [ProductController::class, 'reorderMedia']
    );


    /*
|--------------------------------------------------------------------------
| SET PRODUCT COVER IMAGE
|--------------------------------------------------------------------------
|
| POST /api/admin/products/{productId}/media/{mediaId}/cover
|
*/

    Route::post(
        '/products/{productId}/media/{mediaId}/cover',
        [ProductController::class, 'setCover']
    );


    /*
|--------------------------------------------------------------------------
| DELETE SINGLE PRODUCT MEDIA
|--------------------------------------------------------------------------
|
| DELETE /api/admin/products/{productId}/media/{mediaId}
|
*/

    Route::delete(
        '/products/{productId}/media/{mediaId}',
        [ProductController::class, 'destroyMedia']
    );


    Route::post(
        '/products/{product}/variants/{variant}/image',
        [ProductController::class, 'uploadVariantImage']
    );


    /*
|--------------------------------------------------------------------------
| TOGGLE FEATURED
|--------------------------------------------------------------------------
|
| POST /api/admin/products/{id}/toggle-featured
|
*/

    Route::post(
        '/products/{id}/toggle-featured',
        [ProductController::class, 'toggleFeatured']
    );


    /*
|--------------------------------------------------------------------------
| SHOW PRODUCT
|--------------------------------------------------------------------------
|
| GET /api/admin/products/{id}
|
*/

    Route::get(
        '/products/{id}',
        [ProductController::class, 'show']
    );


    /*
|--------------------------------------------------------------------------
| UPDATE PRODUCT
|--------------------------------------------------------------------------
|
| POST /api/admin/products/{id}/update
|
| POST intentionally used because product edit uses FormData + media files.
|
*/

    Route::post(
        '/products/{id}/update',
        [ProductController::class, 'update']
    );


    /*
|--------------------------------------------------------------------------
| DELETE PRODUCT
|--------------------------------------------------------------------------
|
| DELETE /api/admin/products/{id}
|
*/

    Route::delete(
        '/products/{id}',
        [ProductController::class, 'destroy']
    );


    /*
|--------------------------------------------------------------------------
| PRODUCT AI
|--------------------------------------------------------------------------
|
| POST /api/admin/ai/product-content
|
| target:
|
| summary
| description
| specifications
| seo
| all
|
*/

    Route::post(
        '/ai/product-content',
        [ProductAIController::class, 'generate']
    );
});
