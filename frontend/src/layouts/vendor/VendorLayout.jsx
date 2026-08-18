import { Outlet } from "react-router-dom";

import VendorNavbar from "../../components/vendor/VendorNavbar";
import VendorSidebar from "../../components/vendor/VendorSidebar";

const VendorLayout = () => {
    return (
        <div className="min-h-screen bg-[#f6f7fb] font-['Inter'] text-[#111827]">
            <div className="flex min-h-screen">
                <VendorSidebar />

                <div className="min-w-0 flex-1">
                    <VendorNavbar />

                    <main>
                        <Outlet />
                    </main>
                </div>
            </div>
        </div>
    );
};

export default VendorLayout;