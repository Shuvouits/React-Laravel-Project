import { Outlet } from "react-router-dom";

import Navbar from "../../components/frontend/Navbar";
import CartDrawer from "../../components/frontend/cart/CartDrawer";
import FrontendFooter from "../../components/frontend/FrontendFooter";
import SalesAiWidget from "../../components/frontend/sales-ai/SalesAiWidget";
import MobileBottomNavigation from "../../components/frontend/mobile/MobileBottomNavigation";
import MobileNavbar from "../../components/frontend/mobile/MobileNavbar";

const FrontendLayout = () => {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Navbar />
            <MobileNavbar />

            <main className="flex-1">
                <Outlet />
            </main>

            <FrontendFooter />

             <SalesAiWidget />

            <CartDrawer />
            <MobileBottomNavigation />
        </div>
    );
};

export default FrontendLayout;