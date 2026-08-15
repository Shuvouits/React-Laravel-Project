<?php

use App\Http\Controllers\Api\Account\PreferenceController;
use App\Http\Controllers\Api\Account\ProfileController;
use App\Http\Controllers\Api\Account\WishlistController;
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
use App\Http\Controllers\Api\Admin\VendorConfigurationController;
use App\Http\Controllers\Api\Admin\VendorController;
use App\Http\Controllers\Api\Admin\VendorPlanController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Frontend\CartController;
use App\Http\Controllers\Api\Frontend\HomeController;
use App\Http\Controllers\Api\Frontend\VendorRegistrationController;
use App\Http\Controllers\Api\Frontend\VendorActivationController;
use App\Http\Controllers\Api\Frontend\TopVendorController;
use App\Http\Controllers\Api\Frontend\CategoryMegaMenuController;
use App\Http\Controllers\Api\Frontend\CollectionMenuController;
use App\Http\Controllers\Api\Frontend\CustomerAddressController;
use App\Http\Controllers\Api\Frontend\CustomerSecurityController;
use App\Http\Controllers\Api\Admin\PaymentSettingController;
use App\Http\Controllers\Api\Customer\OrderController;
use App\Http\Controllers\Api\Admin\AdminOrderController;
use Illuminate\Support\Facades\Route;


// Storefront Home
Route::get('/home/featured-categories', [HomeController::class, 'featuredCategories']);
Route::get('/home/products-on-sale', [HomeController::class, 'productsOnSale']);
Route::get('/home/promotions', [HomeController::class, 'promotions']);
Route::get('/home/featured-products', [HomeController::class, 'featuredProducts']);
// Top Vendors
Route::get('/top-vendors', [TopVendorController::class, 'index']);
// Category Mega Menu
Route::get('/category-mega-menu', [CategoryMegaMenuController::class, 'index']);

// Collection Menu
Route::get('/collection-menu', [CollectionMenuController::class, 'index']);

// Single Product
Route::get('/products/{slug}', [ProductController::class, 'showBySlug']);

// Cart
Route::post('/cart/summary', [CartController::class, 'summary']);




// Customer
Route::prefix('customer')->middleware(['auth:sanctum', 'customer'])->group(function () {

    // Customer Addresses
    Route::get('/addresses', [CustomerAddressController::class, 'index']);
    Route::post('/addresses', [CustomerAddressController::class, 'store']);
    Route::put('/addresses/{id}', [CustomerAddressController::class, 'update']);
    Route::delete('/addresses/{id}', [CustomerAddressController::class, 'destroy']);
    Route::post('/addresses/{id}/default', [CustomerAddressController::class, 'setDefault']);

     // Customer Security
    Route::get('/security', [CustomerSecurityController::class, 'index']);

    // Password
    Route::post('/security/password', [CustomerSecurityController::class, 'updatePassword']);

    // Two-Factor Authentication
    Route::post('/security/two-factor/setup', [CustomerSecurityController::class, 'setupTwoFactor']);
    Route::post('/security/two-factor/confirm', [CustomerSecurityController::class, 'confirmTwoFactor']);
    Route::post('/security/two-factor/disable', [CustomerSecurityController::class, 'disableTwoFactor']);
    Route::post('/security/two-factor/recovery-codes', [CustomerSecurityController::class, 'regenerateRecoveryCodes']);

    // Active Sessions
    Route::post('/security/sessions/logout-others', [CustomerSecurityController::class, 'logoutOtherSessions']);

     // Orders
        Route::get('/orders', [OrderController::class, 'index']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::get('/orders/{order}', [OrderController::class, 'show']);


});

Route::middleware(['auth:sanctum', 'customer'])->prefix('account')->group(function () {

        Route::get('/preferences',[PreferenceController::class, 'show']);

        Route::put('/preferences',[PreferenceController::class, 'update']);

        Route::get('/profile', [ProfileController::class, 'show']);
        Route::put('/profile', [ProfileController::class, 'update']);

         Route::get('/wishlist', [WishlistController::class, 'index']);

    Route::post('/wishlist/{product}', [WishlistController::class, 'store']);

    Route::delete('/wishlist/{product}', [WishlistController::class, 'destroy']);

    Route::get('/wishlist/{product}/check', [WishlistController::class, 'check']);



});


// Vendor Registration
Route::prefix('vendor-registration')->group(function () {
    Route::post('/start', [VendorRegistrationController::class, 'start']);
    Route::get('/plans', [VendorRegistrationController::class, 'plans']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/application', [VendorRegistrationController::class, 'application']);
        Route::put('/store', [VendorRegistrationController::class, 'saveStore']);
        Route::put('/plan', [VendorRegistrationController::class, 'selectPlan']);
        Route::post('/submit', [VendorRegistrationController::class, 'submit']);
    });
});




// Authentication
Route::prefix('auth')->group(function () {

    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/vendor/register', [AuthController::class, 'vendorRegister']);

    Route::post('/login', [AuthController::class, 'login'])
        ->middleware('throttle:10,1');

    Route::post('/two-factor/challenge', [AuthController::class, 'twoFactorChallenge'])
        ->middleware('throttle:6,1');

});


// Protected Authentication Routes
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);
});


// Admin Routes
Route::prefix('admin')->middleware(['auth:sanctum', 'admin'])->group(function () {

 // Hero Slider
    Route::get('/hero-slides', [HeroSlideController::class, 'index']);
    Route::post('/hero-slides', [HeroSlideController::class, 'store']);
    Route::post('/hero-slides/reorder', [HeroSlideController::class, 'reorder']);
    Route::get('/hero-slides/{id}', [HeroSlideController::class, 'show']);
    Route::post('/hero-slides/{id}/update', [HeroSlideController::class, 'update']);
    Route::post('/hero-slides/{id}/toggle', [HeroSlideController::class, 'toggle']);
    Route::delete('/hero-slides/{id}', [HeroSlideController::class, 'destroy']);


    // Home Page Sections
    Route::get('/home-sections', [HomeSectionController::class, 'index']);
    Route::post('/home-sections/{section_key}/toggle', [HomeSectionController::class, 'toggle']);
    Route::post('/home-sections/{sectionKey}/update', [HomeSectionController::class, 'update']);
    Route::post('/home-sections/promotions/cards/{index}/image', [HomeSectionController::class, 'uploadPromotionImage']);


    // Brands
    Route::get('/brands', [BrandController::class, 'index']);
    Route::post('/brands', [BrandController::class, 'store']);
    Route::post('/brands/{id}/toggle-featured', [BrandController::class, 'toggleFeatured']);
    Route::post('/brands/{id}/archive', [BrandController::class, 'archive']);
    Route::get('/brands/{id}', [BrandController::class, 'show']);
    Route::post('/brands/{id}/update', [BrandController::class, 'update']);
    Route::delete('/brands/{id}', [BrandController::class, 'destroy']);


    // Brand AI
    Route::post('/ai/brand-content', [BrandAIController::class, 'generate']);
    Route::post('/brands/{id}/toggle-featured', [BrandController::class, 'toggleFeatured']);


    // Category Management
    Route::get('/categories', [CategoryController::class, 'index']);

    // Parent Categories - must stay before /categories/{id}
    Route::get('/categories/parents', [CategoryController::class, 'parents']);

    // Create Category
    Route::post('/categories', [CategoryController::class, 'store']);

    // Show Category
    Route::get('/categories/{id}', [CategoryController::class, 'show']);

    // Update Category - POST used for FormData and image upload
    Route::post('/categories/{id}/update', [CategoryController::class, 'update']);

    // Toggle Featured
    Route::post('/categories/{id}/toggle-featured', [CategoryController::class, 'toggleFeatured']);

    // Delete Category
    Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

    // Category AI
    Route::post('/ai/category-content', [CategoryAIController::class, 'generate']);

    // Category Mega Menu Image
    Route::post('/categories/{id}/mega-menu-image', [CategoryMegaMenuController::class, 'updateImage']);


    // Global Variants
    Route::get('/global-variants', [GlobalVariantController::class, 'index']);
    Route::post('/global-variants', [GlobalVariantController::class, 'store']);

    // Reorder - must stay before /global-variants/{id}
    Route::post('/global-variants/reorder', [GlobalVariantController::class, 'reorder']);

    Route::get('/global-variants/{id}', [GlobalVariantController::class, 'show']);
    Route::post('/global-variants/{id}/update', [GlobalVariantController::class, 'update']);
    Route::delete('/global-variants/{id}', [GlobalVariantController::class, 'destroy']);


    // Collections
    Route::get('/collections', [CollectionController::class, 'index']);

    // Collection Product Search
    Route::get('/collections/products/search', [CollectionController::class, 'searchProducts']);

    // Create Collection
    Route::post('/collections', [CollectionController::class, 'store']);

    // Show Collection
    Route::get('/collections/{id}', [CollectionController::class, 'show']);

    // Update Collection - POST used for FormData and image upload
    Route::post('/collections/{id}/update', [CollectionController::class, 'update']);

    // Reorder Collection Products
    Route::post('/collections/{id}/products/reorder', [CollectionController::class, 'reorderProducts']);

    // Delete Collection
    Route::delete('/collections/{id}', [CollectionController::class, 'destroy']);

    // Collection AI
    Route::post('/ai/collection-content', [CollectionAIController::class, 'generate']);


    // Products
    Route::get('/products', [ProductController::class, 'index']);

    // Product Form Options - must stay before /products/{id}
    Route::get('/products/form-options', [ProductController::class, 'formOptions']);

    // Create Product
    Route::post('/products', [ProductController::class, 'store']);

    // Product Media Reorder
    Route::post('/products/{id}/media/reorder', [ProductController::class, 'reorderMedia']);

    // Set Product Cover
    Route::post('/products/{productId}/media/{mediaId}/cover', [ProductController::class, 'setCover']);

    // Delete Product Media
    Route::delete('/products/{productId}/media/{mediaId}', [ProductController::class, 'destroyMedia']);

    // Product Variant Image
    Route::post('/products/{product}/variants/{variant}/image', [ProductController::class, 'uploadVariantImage']);

    // Toggle Product Featured
    Route::post('/products/{id}/toggle-featured', [ProductController::class, 'toggleFeatured']);

    // Show Product
    Route::get('/products/{id}', [ProductController::class, 'show']);

    // Update Product - POST used for FormData and media files
    Route::post('/products/{id}/update', [ProductController::class, 'update']);

    // Delete Product
    Route::delete('/products/{id}', [ProductController::class, 'destroy']);

    // Product AI
    Route::post('/ai/product-content', [ProductAIController::class, 'generate']);

    // Admin Vendors
    Route::get('/vendors', [VendorController::class, 'index']);
    Route::post('/vendors', [VendorController::class, 'store']);
    Route::get('/vendors/{id}', [VendorController::class, 'show']);
    Route::post('/vendors/{id}/update', [VendorController::class, 'update']);
    Route::post('/vendors/{id}/suspend', [VendorController::class, 'suspend']);
    Route::post('/vendors/{id}/restore', [VendorController::class, 'restore']);
    Route::delete('/vendors/{id}', [VendorController::class, 'destroy']);

    // Admin Vendor Applications
    Route::post('/vendor-applications/{applicationId}/approve', [VendorController::class, 'approve']);
    Route::post('/vendor-applications/{applicationId}/reject', [VendorController::class, 'reject']);

    // Vendor Account Activation
    Route::get('/vendor/activate/{user}', [VendorActivationController::class, 'activate'])
        ->middleware('signed')
        ->name('vendor.activate');

    // Vendor Plans
    Route::get('/vendor-plans', [VendorPlanController::class, 'index']);
    Route::post('/vendor-plans', [VendorPlanController::class, 'store']);
    Route::get('/vendor-plans/{id}', [VendorPlanController::class, 'show']);
    Route::post('/vendor-plans/{id}/update', [VendorPlanController::class, 'update']);
    Route::delete('/vendor-plans/{id}', [VendorPlanController::class, 'destroy']);

    // Vendor Configuration
    Route::get('/vendor-configuration', [VendorConfigurationController::class, 'show']);
    Route::post('/vendor-configuration', [VendorConfigurationController::class, 'update']);

     Route::get('/settings/payments', [PaymentSettingController::class, 'index']);

     Route::put('/settings/payments/{gateway}', [PaymentSettingController::class, 'update']);


     // Orders
Route::get('/orders', [AdminOrderController::class, 'index']);
Route::get('/orders/{order}', [AdminOrderController::class, 'show']);

Route::post('/orders/{order}/mark-shipped', [ AdminOrderController::class, 'markShipped',]);

Route::post('/orders/{order}/cancel', [ AdminOrderController::class, 'cancel']);

Route::delete('/orders/{order}', [AdminOrderController::class,'destroy']);


});



