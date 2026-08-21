import {
    Bell,
    Globe,
    Menu,
    ShoppingCart,
    Store,
    Sun,
    User,
    Settings,
    LogOut,
    House,
} from "lucide-react";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useLocation,
    useNavigate,
} from "react-router-dom";

import api from "../../api/axios";


const VendorNavbar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const dropdownRef = useRef(null);

    const [showProfileMenu, setShowProfileMenu] =
        useState(false);

    const [profile, setProfile] = useState({
        name: "",
        email: "",
        photo_url: "",
    });


    const fetchVendorProfile = async () => {
        try {
            const response = await api.get(
                "/vendor/profile"
            );

            const profileData =
                response.data?.profile;

            if (!profileData) {
                return;
            }

            setProfile({
                name:
                    profileData.name ||
                    `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim(),

                email:
                    profileData.email || "",

                photo_url:
                    profileData.photo_url || "",
            });
        } catch (error) {
            console.error(
                "Vendor profile fetch error:",
                error.response?.data ||
                error.message
            );
        }
    };


    useEffect(() => {
        fetchVendorProfile();
    }, [location.pathname]);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(
                    event.target
                )
            ) {
                setShowProfileMenu(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);


    const handleLogout = async () => {
        try {
            await api.post(
                "/auth/logout"
            );
        } catch (error) {
            console.error(
                "Vendor logout error:",
                error.response?.data ||
                error.message
            );
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("user_name");
            localStorage.removeItem("user_email");

            navigate("/login");
        }
    };


    const userName =
        profile.name ||
        "Storify Vendor";

    const userEmail =
        profile.email ||
        "vendor@storify.com";


    return (
        <header className="relative z-50 flex h-[74px] items-center justify-between border-b border-[#e8e8ee] bg-white px-6">

            {/* LEFT */}

            <div className="flex items-center gap-4">
                <button
                    type="button"
                    className="flex h-[32px] w-[32px] items-center justify-center rounded-[9px] text-[#444444] transition hover:bg-[#f7f7f8]"
                >
                    <Menu
                        size={18}
                        strokeWidth={1.8}
                    />
                </button>

                <div className="flex items-center gap-2">
                    <Store
                        size={20}
                        strokeWidth={1.8}
                        className="text-[#2563eb]"
                    />

                    <span className="text-[18px] font-semibold text-[#222222]">
                        Storify Vendor Store
                    </span>
                </div>
            </div>


            {/* CENTER */}

            <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3">
                <button
                    type="button"
                    className="flex h-[36px] items-center gap-2 rounded-full border border-[#dbe5fb] bg-[#f4f8ff] px-4 text-[14px] font-medium text-[#2f6bdb]"
                >
                    <ShoppingCart
                        size={16}
                        strokeWidth={1.8}
                    />

                    POS
                </button>

                <button
                    type="button"
                    className="flex h-[36px] items-center gap-2 rounded-full border border-[#e6e8ef] bg-white px-4 text-[14px] font-medium text-[#222222] transition hover:bg-[#f8f8f8]"
                >
                    <Globe
                        size={16}
                        strokeWidth={1.8}
                    />

                    Browse Website
                </button>
            </div>


            {/* RIGHT */}

            <div className="flex items-center gap-4">
                <img
                    src="https://flagcdn.com/us.svg"
                    alt="US Flag"
                    className="h-[16px] w-[22px] rounded-[2px] object-cover"
                />

                <button
                    type="button"
                    className="relative text-[#666666] transition hover:text-[#111111]"
                >
                    <Bell
                        size={19}
                        strokeWidth={1.8}
                    />

                    <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff4d4f] px-1 text-[10px] font-semibold text-white">
                        9+
                    </span>
                </button>

                <button
                    type="button"
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#555555] transition hover:bg-[#f6f6f6]"
                >
                    <Sun
                        size={18}
                        strokeWidth={1.8}
                    />
                </button>


                {/* PROFILE DROPDOWN */}

                <div
                    className="relative"
                    ref={dropdownRef}
                >
                    <button
                        type="button"
                        onClick={() =>
                            setShowProfileMenu(
                                !showProfileMenu
                            )
                        }
                        className="flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-full border border-[#dfe6f7] bg-[#eef4ff] text-[#2563eb] transition hover:border-[#cdd9f3]"
                    >
                        {profile.photo_url ? (
                            <img
                                src={profile.photo_url}
                                alt={userName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <User
                                size={17}
                                strokeWidth={2}
                            />
                        )}
                    </button>


                    {showProfileMenu && (
                        <div className="absolute right-0 top-[48px] w-[232px] overflow-hidden rounded-[16px] border border-[#e6e8ef] bg-white shadow-[0_12px_35px_rgba(15,23,42,0.14)]">

                            {/* PROFILE INFO */}

                            <div className="border-b border-[#eceef3] px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eef4ff] text-[#2563eb]">
                                        {profile.photo_url ? (
                                            <img
                                                src={profile.photo_url}
                                                alt={userName}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <User
                                                size={17}
                                                strokeWidth={2}
                                            />
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <h4 className="truncate text-[14px] font-semibold leading-[19px] text-[#222222]">
                                            {userName}
                                        </h4>

                                        <p className="mt-[1px] truncate text-[12px] leading-[17px] text-[#7a7f89]">
                                            {userEmail}
                                        </p>
                                    </div>
                                </div>
                            </div>


                            {/* PROFILE */}

                            <button
                                type="button"
                                onClick={() => {
                                    setShowProfileMenu(false);
                                    navigate("/vendor/profile");
                                }}
                                className="flex w-full items-center gap-3 px-4 py-[13px] text-left text-[15px] font-medium text-[#2f2f2f] transition hover:bg-[#f8f9fb]"
                            >
                                <User
                                    size={18}
                                    strokeWidth={1.9}
                                    className="text-[#6b7280]"
                                />

                                Profile
                            </button>


                            {/* SETTINGS */}

                            <button
                                type="button"
                                className="flex w-full items-center gap-3 px-4 py-[13px] text-left text-[15px] font-medium text-[#2f2f2f] transition hover:bg-[#f8f9fb]"
                            >
                                <Settings
                                    size={18}
                                    strokeWidth={1.9}
                                    className="text-[#6b7280]"
                                />

                                Settings
                            </button>


                            {/* VIEW STORE */}

                            <button
                                type="button"
                                className="flex w-full items-center gap-3 px-4 py-[13px] text-left text-[15px] font-medium text-[#2f2f2f] transition hover:bg-[#f8f9fb]"
                            >
                                <House
                                    size={18}
                                    strokeWidth={1.9}
                                    className="text-[#6b7280]"
                                />

                                View Store
                            </button>


                            <div className="border-t border-[#eceef3]" />


                            {/* LOGOUT */}

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 px-4 py-[13px] text-left text-[15px] font-medium text-[#ff3b30] transition hover:bg-[#fff5f5]"
                            >
                                <LogOut
                                    size={18}
                                    strokeWidth={1.9}
                                    className="text-[#ff3b30]"
                                />

                                Sign out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};


export default VendorNavbar;