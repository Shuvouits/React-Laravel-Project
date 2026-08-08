import { Outlet } from "react-router-dom";

import AdminNavbar from "../../components/admin/AdminNavbar";
import AdminSidebar from "../../components/admin/AdminSidebar";


const AdminLayout = () => {

  return (
    <div
      className="
        min-h-screen
        bg-[#f6f7fb]
        font-['Inter']
        text-[#111827]
      "
    >

      <div className="flex min-h-screen">

        {/* =============================
            SIDEBAR
        ============================== */}

        <AdminSidebar />


        {/* =============================
            RIGHT AREA
        ============================== */}

        <div className="flex-1 min-w-0">

          {/* Navbar */}

          <AdminNavbar />


          {/* =============================
              PAGE CONTENT
          ============================== */}

          <main>

            <Outlet />

          </main>

        </div>

      </div>

    </div>
  );
};


export default AdminLayout;