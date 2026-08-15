import { Outlet } from "react-router-dom";

import Navbar from "../../components/frontend/Navbar";
import CartDrawer from "../../components/frontend/cart/CartDrawer";

const FrontendLayout = () => {
    return (
        <div className="min-h-screen bg-white">

            <Navbar />

            <main>
                <Outlet />
            </main>

            <CartDrawer />

        </div>
    );
};

export default FrontendLayout;