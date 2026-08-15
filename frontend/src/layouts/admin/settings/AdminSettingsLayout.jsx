import { Outlet, useNavigate } from "react-router-dom";
import { X } from "lucide-react";

import SettingsSidebar from "../../../components/admin/settings/SettingsSidebar";

const AdminSettingsLayout = () => {
    const navigate = useNavigate();

    const handleClose = () => {
        navigate("/admin/dashboard");
    };

    return (
        <main className="min-h-screen bg-[#f5f6f7] font-['Inter']">

            <button
                type="button"
                onClick={handleClose}
                className="fixed right-[14px] top-[14px] z-30 flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#dedede] bg-white text-[#777] shadow-sm transition hover:bg-[#f5f5f5] hover:text-[#171717]"
            >
                <X
                    size={18}
                    strokeWidth={1.7}
                />
            </button>

            <div className="mx-auto flex min-h-screen w-full max-w-[1170px]">

                <SettingsSidebar />

                <div className="min-w-0 flex-1 px-[22px] pb-[28px] pt-[14px]">
                    <Outlet />
                </div>

            </div>

        </main>
    );
};

export default AdminSettingsLayout;