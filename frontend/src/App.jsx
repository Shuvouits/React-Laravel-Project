import {BrowserRouter,Routes,Route,Navigate,} from "react-router-dom";

// Frontend
import Navbar from "./components/frontend/Navbar";
import Hero from "./components/frontend/Hero";
import FeaturedCategories from "./components/frontend/FeaturedCategories";
import ProductsOnSale from "./components/frontend/products/ProductsOnSale";
import PromotionsOffers from "./components/frontend/PromotionsOffers";
import FeaturedProducts from "./components/frontend/products/FeaturedProducts";

import Login from "./pages/frontend/Login";
import Register from "./pages/frontend/Register";
import BecomeVendor from "./pages/frontend/BecomeVendor";

// Admin
import AdminLayout from "./layouts/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
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

// Auth
import RoleRoute from "./components/auth/RoleRoute";
import AdminVendors from "./pages/admin/vendors/AdminVendors";
import AdminVendorCreate from "./pages/admin/vendors/AdminVendorCreate";
import AdminVendorEdit from "./pages/admin/vendors/AdminVendorEdit";
import AdminVendorPlans from "./pages/admin/vendors/vendorPlan/AdminVendorPlans";
import AdminVendorPlanEdit from "./pages/admin/vendors/vendorPlan/AdminVendorPlanEdit";
import AdminVendorPlanCreate from "./pages/admin/vendors/vendorPlan/AdminVendorPlanCreate";
import AdminVendorConfiguration from "./pages/admin/vendors/configuration/AdminVendorConfiguration";
import TopVendors from "./components/frontend/TopVendors";


// Frontend Home
const Home = () => {
    return (
        <>
            <Navbar />
            <Hero />
            <FeaturedCategories />
            <ProductsOnSale />
            <PromotionsOffers />
            <FeaturedProducts />
            <TopVendors />
        </>
    );
};


function App() {
    return (
        <BrowserRouter>
            <Routes>

                {/* Frontend Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/become-vendor" element={<BecomeVendor />} />

                {/* Admin Routes */}
                <Route
                    path="/admin"
                    element={
                        <RoleRoute allowedRole="admin">
                            <AdminLayout />
                        </RoleRoute>
                    }
                >

                    {/* Admin Dashboard */}
                    <Route path="dashboard" element={<AdminDashboard />} />

                    {/* Products */}
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="products/new" element={<AdminProductCreate />} />
                    <Route path="products/:id/edit" element={<AdminProductEdit />} />

                    {/* Collections */}
                    <Route path="products/collections" element={<AdminCollections />} />
                    <Route path="products/collections/new" element={<AdminCollectionCreate />} />
                    <Route path="products/collections/:id/edit" element={<AdminCollectionEdit />} />

                    {/* Global Variants */}
                    <Route path="products/global-variants" element={<AdminGlobalVariants />} />

                    {/* Categories */}
                    <Route path="products/categories" element={<AdminCategories />} />
                    <Route path="products/categories/new" element={<AdminCategoryCreate />} />
                    <Route path="products/categories/:id/edit" element={<AdminCategoryEdit />} />

                    {/* Brands */}
                    <Route path="products/brands" element={<AdminBrands />} />
                    <Route path="products/brands/new" element={<AdminBrandCreate />} />
                    <Route path="products/brands/:id/edit" element={<AdminBrandEdit />} />

                    {/* Online Store */}
                    <Route path="online-store/home-page" element={<AdminHomePage />} />

                    {/* Vendors */}
                    <Route path="vendors" element={<AdminVendors />} />

                    <Route path="vendors/new" element={<AdminVendorCreate />} />

                    <Route path="vendors/:id/edit" element={<AdminVendorEdit />} />

                    {/* Vendor Plans */}
                    <Route path="vendors/plans" element={<AdminVendorPlans />} />

                    <Route path="vendors/plans/new" element={<AdminVendorPlanCreate />} />

                    <Route path="vendors/plans/:id/edit" element={<AdminVendorPlanEdit />} />

                    {/* Vendor Configuration */}
                    <Route path="vendors/configuration" element={<AdminVendorConfiguration />} />

                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />

            </Routes>
        </BrowserRouter>
    );
}

export default App;