import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Navbar from "./components/frontend/Navbar";
import RoleRoute from "./components/auth/RoleRoute";

import Login from "./pages/frontend/Login";
import Register from "./pages/frontend/Register";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";


const Home = () => {
  return (
    <>
      <Navbar />
    </>
  );
};


function App() {
  return (
    <BrowserRouter>

      <Routes>

        {/* =====================
            PUBLIC
        ====================== */}

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


        {/* =====================
            CUSTOMER
        ====================== */}

        <Route
          path="/customer/dashboard"
          element={
            <RoleRoute allowedRole="customer">
              <CustomerDashboard />
            </RoleRoute>
          }
        />


        {/* =====================
            VENDOR
        ====================== */}

        <Route
          path="/vendor/dashboard"
          element={
            <RoleRoute allowedRole="vendor">
              <VendorDashboard />
            </RoleRoute>
          }
        />


        {/* =====================
            ADMIN
        ====================== */}

        <Route
          path="/admin/dashboard"
          element={
            <RoleRoute allowedRole="admin">
              <AdminDashboard />
            </RoleRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;