<?php

use App\Http\Controllers\Api\Account\CustomerDashboardController;
use App\Http\Controllers\Api\Account\CustomerOrderController;
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
use App\Http\Controllers\Api\Customer\StripePaymentController;
use App\Http\Controllers\Api\Frontend\PreOrderController;

use App\Http\Controllers\Api\Frontend\ProductContentSectionController as FrontendProductContentSectionController;
use App\Http\Controllers\Api\Admin\ProductContentSectionController as AdminProductContentSectionController;

use App\Http\Controllers\Api\Admin\AdminPreOrderController;
use App\Http\Controllers\Api\Admin\AdminReturnController;
use App\Http\Controllers\Api\Admin\AdminInventoryController;
use App\Http\Controllers\Api\Admin\AdminInventoryLocationController;
use App\Http\Controllers\Api\ProductReviewController;
use App\Http\Controllers\Api\Admin\AdminReviewController;
use App\Http\Controllers\Api\Admin\AdminProfileController;
use App\Http\Controllers\Api\Admin\AdminCustomerController;
use App\Http\Controllers\Api\Vendor\VendorProductController;

use App\Http\Controllers\Api\Vendor\VendorInventoryLocationController;

use App\Http\Controllers\Api\Vendor\VendorInventoryController;
use App\Http\Controllers\Api\Vendor\VendorBrandController;
use App\Http\Controllers\Api\Vendor\VendorInboxController;
use App\Http\Controllers\Api\Vendor\VendorOrderController;
use App\Http\Controllers\Api\Vendor\VendorPreOrderController;
use App\Http\Controllers\Api\Vendor\VendorReturnController;
use App\Http\Controllers\Api\Vendor\VendorProfileController;

use App\Http\Controllers\Api\Customer\CustomerMessageController;
use App\Http\Controllers\Api\Vendor\VendorDiscountController;
use App\Http\Controllers\Api\Vendor\VendorFinanceController;

use App\Http\Controllers\Api\Vendor\VendorExpenseController;
use App\Http\Controllers\Api\Vendor\VendorPayoutController;
use App\Http\Controllers\Api\Admin\AdminExpenseController;

use App\Http\Controllers\Api\Admin\AdminFinanceController;
use App\Http\Controllers\Api\Admin\AdminReceivableController;
use App\Http\Controllers\Api\Admin\AdminPaymentController;
use App\Http\Controllers\Api\Admin\AdminPaymentTransactionController;
use App\Http\Controllers\Api\Admin\AdminFinanceReportController;
use App\Http\Controllers\Api\Admin\BlogCategoryController;

use App\Http\Controllers\Api\Admin\BlogPostController;

use App\Http\Controllers\Api\Admin\AdminPosController;
use App\Http\Controllers\Api\Vendor\VendorPosController;
use App\Http\Controllers\Api\Admin\BlogPostAIController;
use App\Http\Controllers\Api\Frontend\TopArticlesController;
use App\Http\Controllers\Api\Frontend\InstagramGalleryController;

use App\Http\Controllers\Api\Admin\FooterSettingController;
use App\Http\Controllers\Api\Frontend\FooterController;

use App\Http\Controllers\Api\Admin\GeneralSettingController as AdminGeneralSettingController;
use App\Http\Controllers\Api\Frontend\GeneralSettingController as FrontendGeneralSettingController;
use App\Http\Controllers\Api\Frontend\ProductCatalogController;
use App\Http\Controllers\Api\Frontend\BrandController as FrontendBrandController;

use App\Http\Controllers\Api\Frontend\ContactController;
use App\Http\Controllers\Api\Admin\ContactPageSettingController;

use App\Http\Controllers\Api\Admin\ContactMessageController;
use App\Http\Controllers\Api\Frontend\SalesAiController;
use App\Http\Controllers\Api\Frontend\BlogController;
use App\Http\Controllers\Api\SocialAuthController;
use App\Http\Controllers\Api\Admin\SocialLoginSettingController;

use Illuminate\Support\Facades\Route;

Route::get('/payments/stripe/success', [StripePaymentController::class, 'success']);

// Storefront Home
Route::get('/home/hero-slides', [HeroSlideController::class, 'index']);
Route::get('/home/sections', [HomeSectionController::class, 'index']);

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

// Pre-orders
Route::get('/pre-orders', [PreOrderController::class, 'index']);
Route::get('/pre-orders/{slug}', [PreOrderController::class, 'show']);

// Product Content Sections
Route::get('/products/{slug}/content-sections', [FrontendProductContentSectionController::class, 'index']);

Route::get('/brands', [FrontendBrandController::class, 'index']);

Route::get('/products/{product:slug}/reviews', [ProductReviewController::class, 'index']);

Route::get('/home/top-articles', [TopArticlesController::class, 'index']);

Route::get('/home/instagram-gallery', [InstagramGalleryController::class, 'index']);

Route::get('/footer', [FooterController::class, 'show']);
Route::get('/general-settings', [FrontendGeneralSettingController::class, 'show']);

Route::get('/products', [ProductCatalogController::class, 'index']);

Route::get('/products/{slug}', [ProductController::class, 'showBySlug']);

Route::get('/product-catalog/filters', [ProductCatalogController::class, 'filters']);

Route::get('/contact-page', [ContactController::class, 'show']);

Route::post('/contact-messages', [ContactController::class, 'storeMessage'])->middleware('throttle:5,1');

Route::get('/social/providers', [SocialAuthController::class, 'providers']);


Route::prefix('sales-ai')->group(function () {
    Route::get('/config', [SalesAiController::class, 'config']);

    Route::post('/conversations', [SalesAiController::class, 'startConversation'])
        ->middleware('throttle:20,1');

    Route::post('/chat', [SalesAiController::class, 'chat'])
        ->middleware('throttle:20,1');

    Route::get(
        '/conversations/{conversationUuid}/messages',
        [SalesAiController::class, 'messages']
    );

    Route::post(
        '/conversations/{conversationUuid}/close',
        [SalesAiController::class, 'closeConversation']
    );
});


Route::prefix('blog')->group(function () {
    Route::get('/posts', [BlogController::class, 'index']);
    Route::get('/categories', [BlogController::class, 'categories']);
    Route::get('/posts/{slug}', [BlogController::class, 'show']);
});



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

    // Customer Messages
    Route::get('/messages/vendors', [CustomerMessageController::class, 'vendors']);
    Route::get('/messages', [CustomerMessageController::class, 'index']);
    Route::post('/messages', [CustomerMessageController::class, 'start']);
    Route::get('/messages/{id}', [CustomerMessageController::class, 'show'])->whereNumber('id');
    Route::post('/messages/{id}/send', [CustomerMessageController::class, 'send'])->whereNumber('id');
    Route::post('/messages/{id}/messages', [CustomerMessageController::class, 'sendMessage'])->whereNumber('id');
});

Route::middleware(['auth:sanctum', 'customer'])->prefix('account')->group(function () {

    Route::get('/preferences', [PreferenceController::class, 'show']);

    Route::put('/preferences', [PreferenceController::class, 'update']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    Route::post('/profile', [ProfileController::class, 'update']);

    Route::get('/wishlist', [WishlistController::class, 'index']);

    Route::post('/wishlist/{product}', [WishlistController::class, 'store']);

    Route::delete('/wishlist/{product}', [WishlistController::class, 'destroy']);

    Route::get('/wishlist/{product}/check', [WishlistController::class, 'check']);

    Route::get('/overview', [CustomerDashboardController::class, 'overview']);

    Route::get('/orders/{id}', [CustomerOrderController::class, 'show']);
    Route::get('/orders', [CustomerOrderController::class, 'index']);

    Route::post('/orders/{id}/cancel', [CustomerOrderController::class, 'cancel']);

    Route::get('/orders/{id}/invoice', [CustomerOrderController::class, 'invoice']);
});

Route::prefix('vendor')->middleware(['auth:sanctum', 'vendor'])->group(function () {

    Route::get('/products/form-options', [ProductController::class, 'formOptions']);

    Route::post('/products', [ProductController::class, 'store']);

    Route::post('/ai/product-content', [ProductAIController::class, 'generate']);

    Route::get('/products', [VendorProductController::class, 'index']);

    Route::get('/products/{id}', [VendorProductController::class, 'show']);

    Route::post('/products/{id}/update', [ProductController::class, 'update']);

    Route::delete('/products/{id}', [VendorProductController::class, 'destroy']);

    Route::post('/products/{productId}/variants/{variantId}/image', [VendorProductController::class, 'uploadVariantImage']);

    // Inventory
    Route::get('/inventory', [VendorInventoryController::class, 'index']);

    Route::post('/inventory/on-hand', [VendorInventoryController::class, 'updateOnHand']);

    // Inventory Locations
    Route::get('/inventory/locations', [VendorInventoryLocationController::class, 'index']);
    Route::post('/inventory/locations', [VendorInventoryLocationController::class, 'store']);
    Route::get('/inventory/locations/{id}', [VendorInventoryLocationController::class, 'show']);
    Route::put('/inventory/locations/{id}', [VendorInventoryLocationController::class, 'update']);
    Route::post('/inventory/locations/{id}/default', [VendorInventoryLocationController::class, 'setDefault']);
    Route::post('/inventory/locations/{id}/toggle-status', [VendorInventoryLocationController::class, 'toggleStatus']);
    Route::post('/inventory/locations/{id}/ship-sooner', [VendorInventoryLocationController::class, 'shipSooner']);
    Route::delete('/inventory/locations/{id}', [VendorInventoryLocationController::class, 'destroy']);

    // Brands
    Route::get('/brands', [VendorBrandController::class, 'index']);
    Route::post('/brands', [VendorBrandController::class, 'store']);
    Route::get('/brands/{id}', [VendorBrandController::class, 'show']);
    Route::post('/brands/{id}/update', [VendorBrandController::class, 'update']);

    // Brand AI
    Route::post('/ai/brand-content', [BrandAIController::class, 'generate']);

    // Orders
    Route::get('/orders', [VendorOrderController::class, 'index']);
    Route::get('/orders/create/products', [VendorOrderController::class, 'createProducts']);
    Route::get('/orders/create/customers', [VendorOrderController::class, 'createCustomers']);
    Route::post('/orders/manual', [VendorOrderController::class, 'storeManual']);
    Route::get('/orders/{id}', [VendorOrderController::class, 'show']);
    Route::post('/orders/create/customer', [VendorOrderController::class, 'storeCustomer']);

    // Pre-orders
    Route::get('/preorders', [VendorPreOrderController::class, 'index']);

    // Returns
    Route::get('/returns', [VendorReturnController::class, 'index']);
    Route::get('/returns/{id}', [VendorReturnController::class, 'show']);

    // Vendor Profile
    Route::get('/profile', [VendorProfileController::class, 'show']);
    Route::post('/profile', [VendorProfileController::class, 'update']);

    // Vendor Security
    Route::get('/security', [CustomerSecurityController::class, 'index']);
    Route::put('/security/password', [CustomerSecurityController::class, 'updatePassword']);

    // Two-Factor Authentication
    Route::post('/security/two-factor/setup', [CustomerSecurityController::class, 'setupTwoFactor']);
    Route::post('/security/two-factor/confirm', [CustomerSecurityController::class, 'confirmTwoFactor']);
    Route::post('/security/two-factor/disable', [CustomerSecurityController::class, 'disableTwoFactor']);
    Route::post('/security/two-factor/recovery-codes', [CustomerSecurityController::class, 'regenerateRecoveryCodes']);

    // Logout Other Sessions
    Route::post('/security/logout-other-sessions', [CustomerSecurityController::class, 'logoutOtherSessions']);

    // Inbox
    Route::get('/inbox', [VendorInboxController::class, 'index']);
    Route::get('/inbox/{id}', [VendorInboxController::class, 'show']);
    Route::post('/inbox/{id}/messages', [VendorInboxController::class, 'sendMessage']);
    Route::post('/inbox/{id}/status', [VendorInboxController::class, 'updateStatus']);

    // Discounts
    Route::get('/discounts', [VendorDiscountController::class, 'index']);
    Route::post('/discounts', [VendorDiscountController::class, 'store']);
    Route::get('/discounts/{id}', [VendorDiscountController::class, 'show'])->whereNumber('id');
    Route::put('/discounts/{id}', [VendorDiscountController::class, 'update'])->whereNumber('id');
    Route::delete('/discounts/{id}', [VendorDiscountController::class, 'destroy'])->whereNumber('id');

    // Finance Overview
    Route::get('/finance/overview', [VendorFinanceController::class, 'overview']);

    // Finance Statements
    Route::get('/finance/statements', [VendorFinanceController::class, 'statements']);

    // Owed to Platform
    Route::get('/finance/owed', [VendorFinanceController::class, 'owedToPlatform']);

    // Expenses
    Route::get('/finance/expenses/download', [VendorExpenseController::class, 'download']);

    Route::get('/finance/expenses', [VendorExpenseController::class, 'index']);

    Route::post('/finance/expenses', [VendorExpenseController::class, 'store']);

    Route::get('/finance/expenses/{id}', [VendorExpenseController::class, 'show'])->whereNumber('id');

    Route::put('/finance/expenses/{id}', [VendorExpenseController::class, 'update'])->whereNumber('id');

    Route::delete('/finance/expenses/{id}', [VendorExpenseController::class, 'destroy'])->whereNumber('id');

    // Payouts
    Route::get('/finance/payouts', [VendorPayoutController::class, 'index']);

    Route::get('/finance/payouts/{id}', [VendorPayoutController::class, 'show'])->whereNumber('id');



    // Vendor POS
    Route::prefix('pos')->group(function () {
        // Context and locations
        Route::get('/context', [VendorPosController::class, 'context']);
        Route::get('/locations', [VendorPosController::class, 'locations']);

        // Product catalog
        Route::get('/categories', [VendorPosController::class, 'categories']);
        Route::get('/products', [VendorPosController::class, 'products']);
        Route::get('/barcode-lookup', [VendorPosController::class, 'barcodeLookup']);

        // Customers
        Route::get('/customers', [VendorPosController::class, 'customers']);
        Route::post('/customers', [VendorPosController::class, 'storeCustomer']);

        // Register
        Route::get('/register/current', [VendorPosController::class, 'currentRegister']);
        Route::post('/register/open', [VendorPosController::class, 'openRegister']);
        Route::post('/register/{registerSessionId}/close', [VendorPosController::class, 'closeRegister'])
            ->whereNumber('registerSessionId');

        // Checkout
        Route::post('/checkout', [VendorPosController::class, 'checkout']);

        // Held sales
        Route::get('/held-sales', [VendorPosController::class, 'heldSales']);
        Route::post('/held-sales', [VendorPosController::class, 'holdSale']);
        Route::get('/held-sales/{heldSaleId}/resume', [VendorPosController::class, 'resumeHeldSale'])
            ->whereNumber('heldSaleId');
        Route::patch('/held-sales/{heldSaleId}/complete', [VendorPosController::class, 'completeHeldSale'])
            ->whereNumber('heldSaleId');
        Route::delete('/held-sales/{heldSaleId}', [VendorPosController::class, 'cancelHeldSale'])
            ->whereNumber('heldSaleId');

        // Sales and refunds
        Route::get('/sales', [VendorPosController::class, 'sales']);
        Route::get('/sales/{saleId}/receipt', [VendorPosController::class, 'saleReceipt'])
            ->whereNumber('saleId');
        Route::post('/sales/{saleId}/refund', [VendorPosController::class, 'refundSale'])
            ->whereNumber('saleId');
        Route::get('/sales/{saleId}', [VendorPosController::class, 'saleDetails'])
            ->whereNumber('saleId');
    });
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

    Route::get('/social/{provider}/redirect', [SocialAuthController::class, 'redirect'])->middleware('throttle:20,1');

    Route::get('/social/{provider}/callback', [SocialAuthController::class, 'callback'])->middleware('throttle:30,1');

    Route::post('/social/exchange', [SocialAuthController::class, 'exchange'])->middleware('throttle:10,1');
});

// Protected Authentication Routes
Route::middleware('auth:sanctum')->prefix('auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/logout-all', [AuthController::class, 'logoutAll']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/products/{product:slug}/reviews', [ProductReviewController::class, 'store']);
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

    Route::post('/home-sections/become-a-vendor/image', [HomeSectionController::class, 'uploadBecomeVendorImage']);

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


    // OAuth / Social Login Settings

Route::get('/settings/social-login', [SocialLoginSettingController::class, 'index']);

Route::put('/settings/social-login/{provider}', [SocialLoginSettingController::class, 'update']);

Route::post('/settings/social-login/{provider}/test', [SocialLoginSettingController::class, 'test']);

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

    Route::get('/orders/create/products', [AdminOrderController::class, 'createProducts']);

    Route::get('/orders/create/customers', [AdminOrderController::class, 'createCustomers']);

    Route::post('/orders/{order}/refund/full', [AdminOrderController::class, 'refundFull']);

    Route::post('/orders/{order}/refund/partial', [AdminOrderController::class, 'refundPartial']);

    Route::post('/orders/manual', [AdminOrderController::class, 'storeManual']);

    Route::get('/orders/{order}', [AdminOrderController::class, 'show']);

    Route::post('/orders/{order}/mark-shipped', [AdminOrderController::class, 'markShipped']);

    Route::post('/orders/{order}/cancel', [AdminOrderController::class, 'cancel']);

    Route::post('/orders/{order}/mark-paid', [AdminOrderController::class, 'markPaid']);

    Route::get('/orders/{order}/invoice', [AdminOrderController::class, 'invoice']);

    Route::delete('/orders/{order}', [AdminOrderController::class, 'destroy']);

    // Product Content Sections
    Route::get('/products/{product}/content-sections', [AdminProductContentSectionController::class, 'index']);

    Route::post('/products/{product}/content-sections', [AdminProductContentSectionController::class, 'store']);

    Route::post('/products/{product}/content-sections/reorder', [AdminProductContentSectionController::class, 'reorder']);

    Route::put('/products/{product}/content-sections/{section}', [AdminProductContentSectionController::class, 'update']);

    Route::delete('/products/{product}/content-sections/{section}', [AdminProductContentSectionController::class, 'destroy']);

    // Pre-orders
    Route::get('/preorders', [AdminPreOrderController::class, 'index']);
    Route::delete('/preorders/{preorder}', [AdminPreOrderController::class, 'destroy']);

    // Returns
    Route::get('/returns', [AdminReturnController::class, 'index']);
    Route::get('/returns/{orderReturn}', [AdminReturnController::class, 'show']);
    Route::post('/orders/{order}/returns', [AdminReturnController::class, 'store']);
    Route::post('/returns/{orderReturn}/approve', [AdminReturnController::class, 'approve']);
    Route::post('/returns/{orderReturn}/reject', [AdminReturnController::class, 'reject']);
    Route::post('/returns/{orderReturn}/in-transit', [AdminReturnController::class, 'markInTransit']);
    Route::post('/returns/{orderReturn}/received', [AdminReturnController::class, 'markReceived']);
    Route::post('/returns/{orderReturn}/cancel', [AdminReturnController::class, 'cancel']);
    Route::post('/returns/{orderReturn}/refund', [AdminOrderController::class, 'refundReturn']);

    // Inventory
    Route::get('/inventory', [AdminInventoryController::class, 'index']);
    Route::post('/inventory/on-hand', [AdminInventoryController::class, 'updateOnHand']);

    // Inventory Locations
    Route::get('/inventory/locations', [AdminInventoryLocationController::class, 'index']);
    Route::post('/inventory/locations', [AdminInventoryLocationController::class, 'store']);
    Route::get('/inventory/locations/{inventoryLocation}', [AdminInventoryLocationController::class, 'show']);
    Route::put('/inventory/locations/{inventoryLocation}', [AdminInventoryLocationController::class, 'update']);
    Route::post('/inventory/locations/{inventoryLocation}/default', [AdminInventoryLocationController::class, 'setDefault']);
    Route::post('/inventory/locations/{inventoryLocation}/toggle-status', [AdminInventoryLocationController::class, 'toggleStatus']);
    Route::delete('/inventory/locations/{inventoryLocation}', [AdminInventoryLocationController::class, 'destroy']);

    // Reviews
    Route::get('/reviews', [AdminReviewController::class, 'index']);
    Route::get('/reviews/{productReview}', [AdminReviewController::class, 'show']);
    Route::post('/reviews/{productReview}/publish', [AdminReviewController::class, 'publish']);
    Route::post('/reviews/{productReview}/hold', [AdminReviewController::class, 'hold']);
    Route::post('/reviews/{productReview}/release-hold', [AdminReviewController::class, 'releaseHold']);
    Route::post('/reviews/{productReview}/reply', [AdminReviewController::class, 'reply']);
    Route::delete('/reviews/{productReview}/reply', [AdminReviewController::class, 'deleteReply']);
    Route::post('/reviews/{productReview}/reject', [AdminReviewController::class, 'reject']);
    Route::delete('/reviews/{productReview}', [AdminReviewController::class, 'destroy']);

    // Admin Profile
    Route::get('/profile', [AdminProfileController::class, 'show']);
    Route::post('/profile', [AdminProfileController::class, 'update']);

    // Admin Security
    Route::get('/security', [CustomerSecurityController::class, 'index']);
    Route::put('/security/password', [CustomerSecurityController::class, 'updatePassword']);
    Route::post('/security/two-factor/setup', [CustomerSecurityController::class, 'setupTwoFactor']);
    Route::post('/security/two-factor/confirm', [CustomerSecurityController::class, 'confirmTwoFactor']);
    Route::post('/security/two-factor/disable', [CustomerSecurityController::class, 'disableTwoFactor']);
    Route::post('/security/two-factor/recovery-codes', [CustomerSecurityController::class, 'regenerateRecoveryCodes']);
    Route::post('/security/logout-other-sessions', [CustomerSecurityController::class, 'logoutOtherSessions']);

    Route::get('/customers', [AdminCustomerController::class, 'index']);
    Route::post('/customers', [AdminCustomerController::class, 'store']);
    Route::get('/customers/{customer}/edit', [AdminCustomerController::class, 'edit']);
    Route::put('/customers/{customer}', [AdminCustomerController::class, 'update']);
    Route::delete('/customers/{customer}', [AdminCustomerController::class, 'destroy']);

    Route::get('/expenses/download', [AdminExpenseController::class, 'download']);

    Route::delete('/expenses/{adminExpense}/receipt', [AdminExpenseController::class, 'deleteReceipt']);

    Route::apiResource('expenses', AdminExpenseController::class);

    Route::get('/finance/overview', [AdminFinanceController::class, 'overview']);

    Route::get('/finance/receivables', [AdminReceivableController::class, 'index']);
    Route::get('/finance/receivables/{vendor}', [AdminReceivableController::class, 'show']);

    Route::get('/finance/payments', [AdminPaymentController::class, 'index']);

    Route::get('/finance/transactions', [AdminPaymentTransactionController::class, 'index']);
    Route::get('/finance/transactions/{paymentTransaction}', [AdminPaymentTransactionController::class, 'show']);

    // Finance Reports
    Route::get('/finance/reports', [AdminFinanceReportController::class, 'index']);
    Route::post('/finance/reports/close-month', [AdminFinanceReportController::class, 'closeMonth']);
    Route::get('/finance/reports/ledger-csv', [AdminFinanceReportController::class, 'ledgerCsv']);
    Route::get('/finance/reports/expenses-csv', [AdminFinanceReportController::class, 'expensesCsv']);


    Route::prefix('pos')->group(function () {
        Route::get('/context', [AdminPosController::class, 'context']);
        Route::get('/locations', [AdminPosController::class, 'locations']);
        Route::get('/categories', [AdminPosController::class, 'categories']);
        Route::get('/products', [AdminPosController::class, 'products']);
        Route::get('/barcode-lookup', [AdminPosController::class, 'barcodeLookup']);

        Route::get('/customers', [AdminPosController::class, 'customers']);
        Route::post('/customers', [AdminPosController::class, 'storeCustomer']);

        Route::get('/register/current', [AdminPosController::class, 'currentRegister']);
        Route::post('/register/open', [AdminPosController::class, 'openRegister']);
        Route::post('/register/{registerSessionId}/close', [AdminPosController::class, 'closeRegister'])
            ->whereNumber('registerSessionId');

        Route::post('/checkout', [AdminPosController::class, 'checkout']);

        Route::get('/held-sales', [AdminPosController::class, 'heldSales']);
        Route::post('/held-sales', [AdminPosController::class, 'holdSale']);
        Route::get('/held-sales/{heldSaleId}/resume', [AdminPosController::class, 'resumeHeldSale'])
            ->whereNumber('heldSaleId');
        Route::patch('/held-sales/{heldSaleId}/complete', [AdminPosController::class, 'completeHeldSale'])
            ->whereNumber('heldSaleId');
        Route::delete('/held-sales/{heldSaleId}', [AdminPosController::class, 'cancelHeldSale'])
            ->whereNumber('heldSaleId');

        Route::get('/sales', [AdminPosController::class, 'sales']);

        Route::get('/sales/{saleId}/receipt', [AdminPosController::class, 'saleReceipt'])->whereNumber('saleId');

        Route::post('/sales/{saleId}/refund', [AdminPosController::class, 'refundSale'])->whereNumber('saleId');

        Route::get('/sales/{saleId}', [AdminPosController::class, 'saleDetails'])->whereNumber('saleId');
    });


    // Blog Posts
    Route::get('/blog-posts', [BlogPostController::class, 'index']);
    Route::get('/blog-posts/form-options', [BlogPostController::class, 'formOptions']);
    Route::post('/blog-posts', [BlogPostController::class, 'store']);
    Route::get('/blog-posts/{blogPost}', [BlogPostController::class, 'show']);
    Route::post('/blog-posts/{blogPost}/update', [BlogPostController::class, 'update']);
    Route::delete('/blog-posts/{blogPost}', [BlogPostController::class, 'destroy']);

    // Blog Categories
    Route::get('/blog-categories', [BlogCategoryController::class, 'index']);
    Route::post('/blog-categories', [BlogCategoryController::class, 'store']);
    Route::get('/blog-categories/{blogCategory}', [BlogCategoryController::class, 'show']);
    Route::post('/blog-categories/{blogCategory}/update', [BlogCategoryController::class, 'update']);
    Route::delete('/blog-categories/{blogCategory}', [BlogCategoryController::class, 'destroy']);

    // Blog AI
    Route::post('/ai/blog-post-content', [BlogPostAIController::class, 'generate']);

    Route::get('/footer-settings', [FooterSettingController::class, 'show']);
    Route::put('/footer-settings/{sectionKey}', [FooterSettingController::class, 'update']);

    Route::get('/general-settings', [AdminGeneralSettingController::class, 'show']);
    Route::post('/general-settings/navbar-logo', [AdminGeneralSettingController::class, 'updateNavbarLogo']);
    Route::delete('/general-settings/navbar-logo', [AdminGeneralSettingController::class, 'removeNavbarLogo']);

    Route::get('/contact-page-settings', [ContactPageSettingController::class, 'show']);

    Route::put('/contact-page-settings/status', [ContactPageSettingController::class, 'updateStatus']);

    Route::post('/contact-page-settings/hero-image', [ContactPageSettingController::class, 'updateHeroImage']);

    Route::delete('/contact-page-settings/hero-image', [ContactPageSettingController::class, 'removeHeroImage']);

    Route::put('/contact-page-settings/{sectionKey}', [ContactPageSettingController::class, 'update']);

    Route::get('/contact-messages', [ContactMessageController::class, 'index']);

    Route::get('/contact-messages/unread-count', [ContactMessageController::class, 'unreadCount']);

    Route::get('/contact-messages/{contactMessage}', [ContactMessageController::class, 'show']);

    Route::put('/contact-messages/{contactMessage}/read', [ContactMessageController::class, 'markAsRead']);

    Route::put('/contact-messages/{contactMessage}/unread', [ContactMessageController::class, 'markAsUnread']);

    Route::put('/contact-messages/{contactMessage}/status', [ContactMessageController::class, 'updateStatus']);

    Route::delete('/contact-messages/{contactMessage}', [ContactMessageController::class, 'destroy']);
});
