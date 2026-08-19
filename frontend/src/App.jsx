import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Frontend Layout
import FrontendLayout from "./layouts/frontend/FrontendLayout";

// Frontend Home
import Hero from "./components/frontend/Hero";
import FeaturedCategories from "./components/frontend/FeaturedCategories";
import ProductsOnSale from "./components/frontend/products/ProductsOnSale";
import PromotionsOffers from "./components/frontend/PromotionsOffers";
import FeaturedProducts from "./components/frontend/products/FeaturedProducts";
import TopVendors from "./components/frontend/TopVendors";

// Frontend Pages
import Login from "./pages/frontend/Login";
import Register from "./pages/frontend/Register";
import BecomeVendor from "./pages/frontend/BecomeVendor";
import ProductDetails from "./pages/frontend/ProductDetails";
import Cart from "./pages/frontend/Cart";
import Checkout from "./pages/frontend/Checkout";

// Customer Account
import CustomerDashboard from "./pages/frontend/account/CustomerDashboard";
import CustomerProfile from "./pages/frontend/account/CustomerProfile";
import CustomerAddresses from "./pages/frontend/account/CustomerAddresses";
import CustomerSecurity from "./pages/frontend/account/CustomerSecurity";
import CustomerPreferences from "./pages/frontend/account/Preferences";
import CustomerWishlist from "./pages/frontend/account/CustomerWishlist";

// Auth
import TwoFactorChallenge from "./pages/auth/TwoFactorChallenge";
import RoleRoute from "./components/auth/RoleRoute";

// Context
import { CartProvider } from "./context/CartContext";

// Admin Layout
import AdminLayout from "./layouts/admin/AdminLayout";

// Admin Settings Layout
import AdminSettingsLayout from "./layouts/admin/settings/AdminSettingsLayout";

// Admin Dashboard
import AdminDashboard from "./pages/admin/AdminDashboard";

// Admin Online Store
import AdminHomePage from "./pages/admin/onlineStore/AdminHomePage";

// Admin Products
import AdminProducts from "./pages/admin/products/allProducts/AdminProducts";
import AdminProductCreate from "./pages/admin/products/allProducts/AdminProductCreate";
import AdminProductEdit from "./pages/admin/products/allProducts/AdminProductEdit";

// Admin Collections
import AdminCollections from "./pages/admin/products/collections/AdminCollections";
import AdminCollectionCreate from "./pages/admin/products/collections/AdminCollectionCreate";
import AdminCollectionEdit from "./pages/admin/products/collections/AdminCollectionEdit";

// Admin Global Variants
import AdminGlobalVariants from "./pages/admin/products/globalVariants/AdminGlobalVariants";

// Admin Categories
import AdminCategories from "./pages/admin/products/AdminCategories";
import AdminCategoryCreate from "./pages/admin/products/AdminCategoryCreate";
import AdminCategoryEdit from "./pages/admin/products/AdminCategoryEdit";

// Admin Brands
import AdminBrands from "./pages/admin/products/AdminBrands";
import AdminBrandCreate from "./pages/admin/products/AdminBrandCreate";
import AdminBrandEdit from "./pages/admin/products/AdminBrandEdit";

// Admin Vendors
import AdminVendors from "./pages/admin/vendors/AdminVendors";
import AdminVendorCreate from "./pages/admin/vendors/AdminVendorCreate";
import AdminVendorEdit from "./pages/admin/vendors/AdminVendorEdit";

// Admin Vendor Plans
import AdminVendorPlans from "./pages/admin/vendors/vendorPlan/AdminVendorPlans";
import AdminVendorPlanCreate from "./pages/admin/vendors/vendorPlan/AdminVendorPlanCreate";
import AdminVendorPlanEdit from "./pages/admin/vendors/vendorPlan/AdminVendorPlanEdit";

// Admin Vendor Configuration
import AdminVendorConfiguration from "./pages/admin/vendors/configuration/AdminVendorConfiguration";

// Admin Settings Pages
import GeneralSettings from "./pages/admin/setting/GeneralSettings";
import PaymentSettings from "./pages/admin/setting/PaymentSettings";
import PaymentSuccess from "./pages/frontend/payment/PaymentSuccess";
import PaymentCancelled from "./pages/frontend/payment/PaymentCancelled";
import PaymentError from "./pages/frontend/payment/PaymentError";
import AdminOrders from "./pages/admin/orders/AdminOrders";
import AdminOrderDetails from "./pages/admin/orders/AdminOrderDetails";
import AdminOrderCreate from "./pages/admin/orders/AdminOrderCreate";
import CustomerOrderDetails from "./pages/frontend/account/CustomerOrderDetails";
import PreOrder from "./pages/frontend/PreOrder";
import AdminPreOrders from "./pages/admin/preorders/AdminPreOrders";
import AdminReturns from "./pages/admin/returns/AdminReturns";
import AdminInventory from "./pages/admin/inventory/AdminInventory";
import AdminInventoryLocations from "./pages/admin/inventory/AdminInventoryLocations";
import AdminReviews from "./pages/admin/products/reviews/AdminReviews";
import AdminProfile from "./pages/admin/profile/AdminProfile";
import AdminCustomers from "./pages/admin/customers/AdminCustomers";
import AdminCustomerEdit from "./pages/admin/customers/AdminCustomerEdit";
import VendorLayout from "./layouts/vendor/VendorLayout";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import VendorProducts from "./pages/vendor/product/VendorProducts";
import VendorProductCreate from "./pages/vendor/product/VendorProductCreate";
import VendorEditProduct from "./pages/vendor/product/VendorEditProduct";
import VendorInventory from "./pages/vendor/inventory/VendorInventory";
import VendorLocations from "./pages/vendor/locations/VendorLocations";


const Home = () => {
    return (
        <>
            <Hero />
            <FeaturedCategories />
            <ProductsOnSale />
            <PromotionsOffers />
            <FeaturedProducts />
            <TopVendors />
        </>
    );
};

const App = () => {
    return (
        <BrowserRouter>
            <CartProvider>
                <Routes>

                    {/* Frontend */}
                    <Route element={<FrontendLayout />}>
                        <Route path="/" element={<Home />} />

                        <Route path="/pre-order" element={<PreOrder />} />
                        <Route path="/products/:slug" element={<ProductDetails />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />

                        <Route path="/account" element={<CustomerDashboard />} />
                        <Route path="/account/orders/:id" element={<CustomerOrderDetails />} />


                        <Route path="/account/profile" element={<CustomerProfile />} />
                        <Route path="/account/addresses" element={<CustomerAddresses />} />
                        <Route path="/account/security" element={<CustomerSecurity />} />
                        <Route path="/account/preferences" element={<CustomerPreferences />} />
                        <Route path="/account/wishlist" element={<CustomerWishlist />} />

                        <Route path="/payment/success" element={<PaymentSuccess />} />
                        <Route path="/payment/cancelled" element={<PaymentCancelled />} />
                        <Route path="/payment/error" element={<PaymentError />} />






                    </Route>

                    {/* Auth */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/two-factor-challenge" element={<TwoFactorChallenge />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/become-vendor" element={<BecomeVendor />} />

                    {/* Admin */}
                    <Route path="/admin"
                        element={
                            <RoleRoute allowedRole="admin">
                                <AdminLayout />
                            </RoleRoute>
                        }
                    >
                        <Route path="dashboard" element={<AdminDashboard />} />

                        <Route path="products" element={<AdminProducts />} />
                        <Route path="products/new" element={<AdminProductCreate />} />
                        <Route path="products/:id/edit" element={<AdminProductEdit />} />

                        <Route path="products/collections" element={<AdminCollections />} />
                        <Route path="products/collections/new" element={<AdminCollectionCreate />} />
                        <Route path="products/collections/:id/edit" element={<AdminCollectionEdit />} />

                        <Route path="products/global-variants" element={<AdminGlobalVariants />} />

                        <Route path="products/categories" element={<AdminCategories />} />
                        <Route path="products/categories/new" element={<AdminCategoryCreate />} />
                        <Route path="products/categories/:id/edit" element={<AdminCategoryEdit />} />

                        <Route path="products/brands" element={<AdminBrands />} />
                        <Route path="products/brands/new" element={<AdminBrandCreate />} />
                        <Route path="products/brands/:id/edit" element={<AdminBrandEdit />} />

                        <Route path="online-store/home-page" element={<AdminHomePage />} />

                        <Route path="vendors" element={<AdminVendors />} />
                        <Route path="vendors/new" element={<AdminVendorCreate />} />
                        <Route path="vendors/:id/edit" element={<AdminVendorEdit />} />

                        <Route path="vendors/plans" element={<AdminVendorPlans />} />
                        <Route path="vendors/plans/new" element={<AdminVendorPlanCreate />} />
                        <Route path="vendors/plans/:id/edit" element={<AdminVendorPlanEdit />} />

                        <Route path="vendors/configuration" element={<AdminVendorConfiguration />} />

                        <Route path="orders" element={<AdminOrders />} />

                        <Route path="orders/pre-orders" element={<AdminPreOrders />} />



                        <Route path="orders/create" element={<AdminOrderCreate />} />

                        <Route path="orders/:id" element={<AdminOrderDetails />} />


                        <Route path="orders/returns" element={<AdminReturns />} />

                        <Route path="products/inventory" element={<AdminInventory />} />

                        <Route path="products/inventory/locations" element={<AdminInventoryLocations />} />

                        <Route path="products/reviews" element={<AdminReviews />} />

                        <Route path="profile" element={<AdminProfile />} />

                        <Route path="customers" element={<AdminCustomers />} />

                        <Route path="customers/:id/edit" element={<AdminCustomerEdit />} />




                    </Route>

                    {/* Standalone Admin Settings */}
                    <Route
                        path="/admin/settings"
                        element={
                            <RoleRoute allowedRole="admin">
                                <AdminSettingsLayout />
                            </RoleRoute>
                        }
                    >
                        <Route path="general" element={<GeneralSettings />} />
                        <Route path="payments" element={<PaymentSettings />} />
                    </Route>


                    {/* Vendor */}
                    <Route path="/vendor" element={<RoleRoute allowedRole="vendor"><VendorLayout /></RoleRoute>}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<VendorDashboard />} />
                        <Route path="products" element={<VendorProducts />} />
                        <Route path="products/create" element={<VendorProductCreate />} />
                        <Route path="products/:id/edit" element={<VendorEditProduct />} />

                        <Route path="products/inventory" element={<VendorInventory />} />

                        <Route path="products/locations" element={<VendorLocations />} />


                    </Route>



                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />




                </Routes>
            </CartProvider>
        </BrowserRouter>
    );
};

export default App;