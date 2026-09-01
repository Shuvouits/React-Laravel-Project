import { Outlet } from "react-router-dom";

import Navbar from "../../components/frontend/Navbar";
import CartDrawer from "../../components/frontend/cart/CartDrawer";
import FrontendFooter from "../../components/frontend/FrontendFooter";
import SalesAiWidget from "../../components/frontend/sales-ai/SalesAiWidget";

const FrontendLayout = () => {
    return (
        <div className="flex min-h-screen flex-col bg-white">
            <Navbar />

            <main className="flex-1">
                <Outlet />
            </main>

            <FrontendFooter />

             <SalesAiWidget />

            <CartDrawer />
        </div>
    );
};

export default FrontendLayout;