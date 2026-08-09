import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";


// ============================================================
// FRONTEND
// ============================================================

import Navbar from "./components/frontend/Navbar";
import Hero from "./components/frontend/Hero";

import Login from "./pages/frontend/Login";
import Register from "./pages/frontend/Register";


// ============================================================
// ADMIN
// ============================================================

import AdminLayout from "./layouts/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";

import AdminHomePage from "./pages/admin/onlineStore/AdminHomePage";

import AdminBrands from "./pages/admin/products/AdminBrands";
import AdminBrandCreate from "./pages/admin/products/AdminBrandCreate";
import AdminBrandEdit from "./pages/admin/products/AdminBrandEdit";


// ============================================================
// AUTH
// ============================================================

import RoleRoute from "./components/auth/RoleRoute";
import AdminCategoryEdit from "./pages/admin/products/AdminCategoryEdit";
import AdminCategoryCreate from "./pages/admin/products/AdminCategoryCreate";
import AdminCategories from "./pages/admin/products/AdminCategories";
import AdminGlobalVariants from "./pages/admin/products/globalVariants/AdminGlobalVariants";
import AdminCollectionEdit from "./pages/admin/products/collections/AdminCollectionEdit";
import AdminCollectionCreate from "./pages/admin/products/collections/AdminCollectionCreate";
import AdminCollections from "./pages/admin/products/collections/AdminCollections";
import AdminProductCreate from "./pages/admin/products/allProducts/AdminProductCreate";
import AdminProducts from "./pages/admin/products/allProducts/AdminProducts";
import AdminProductEdit from "./pages/admin/products/allProducts/AdminProductEdit";
import FeaturedCategories from "./components/frontend/FeaturedCategories";
import ProductsOnSale from "./components/frontend/products/ProductsOnSale";
import PromotionsOffers from "./components/frontend/PromotionsOffers";


/* ==========================================================================
   FRONTEND HOME
============================================================================ */

const Home = () => {

  return (
    <>
      <Navbar />

      <Hero />

      <FeaturedCategories />

      <ProductsOnSale />

      <PromotionsOffers />

      {/* Homepage sections পরে এখানে add করব */}
    </>
  );

};


/* ==========================================================================
   APP
============================================================================ */

function App() {

  return (
    <BrowserRouter>

      <Routes>

        {/* =====================================================
            FRONTEND PUBLIC ROUTES
        ====================================================== */}

        <Route
          path="/"
          element={<Home />}
        />


        <Route
          path="/login"
          element={<Login />}
        />


        <Route
          path="/register"
          element={<Register />}
        />


        {/* =====================================================
            ADMIN ROUTES
        ====================================================== */}

        <Route
          path="/admin"
          element={
            <RoleRoute allowedRole="admin">
              <AdminLayout />
            </RoleRoute>
          }
        >

          {/* ===================================================
              DASHBOARD
          ==================================================== */}

          <Route
            path="dashboard"
            element={<AdminDashboard />}
          />


          {/* =====================================================
    PRODUCTS
===================================================== */}

<Route
  path="products"
  element={
    <AdminProducts />
  }
/>


<Route
  path="products/new"
  element={
    <AdminProductCreate />
  }
/>


<Route
  path="products/:id/edit"
  element={
    <AdminProductEdit />
  }
/>



          {/* ===================================================
    PRODUCTS -> COLLECTIONS
==================================================== */}

<Route
  path="products/collections"
  element={
    <AdminCollections />
  }
/>


<Route
  path="products/collections/new"
  element={
    <AdminCollectionCreate />
  }
/>


<Route
  path="products/collections/:id/edit"
  element={
    <AdminCollectionEdit />
  }
/>





          {/* ===================================================
    PRODUCTS -> GLOBAL VARIANTS
==================================================== */}

<Route
  path="products/global-variants"
  element={
    <AdminGlobalVariants />
  }
/>


          {/*  ---Category--- */}

          <Route
  path="products/categories"
  element={
    <AdminCategories />
  }
/>


<Route
  path="products/categories/new"
  element={
    <AdminCategoryCreate />
  }
/>


<Route
  path="products/categories/:id/edit"
  element={
    <AdminCategoryEdit />
  }
/>



          {/* ===================================================
              PRODUCTS -> BRANDS
          ==================================================== */}

          <Route
            path="products/brands"
            element={<AdminBrands />}
          />


          <Route
            path="products/brands/new"
            element={<AdminBrandCreate />}
          />


          <Route
            path="products/brands/:id/edit"
            element={<AdminBrandEdit />}
          />


          {/* ===================================================
              ONLINE STORE -> HOME
          ==================================================== */}

          <Route
            path="online-store/home-page"
            element={<AdminHomePage />}
          />

        </Route>


        {/* =====================================================
            FALLBACK
        ====================================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );

}


export default App;