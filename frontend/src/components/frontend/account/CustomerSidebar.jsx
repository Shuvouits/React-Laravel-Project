import { useEffect, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import {
    Bell,
    Box,
    Grid2X2,
    Heart,
    Inbox,
    LoaderCircle,
    LogOut,
    MapPin,
    Pencil,
    Shield,
    SlidersHorizontal,
    Star,
    UserRound,
} from "lucide-react";

import api from "../../../api/axios";

const CustomerSidebar = ({
    notificationCount = 109,
    wishlistCount = 0,
    addressCount = 4,
}) => {
    const navigate = useNavigate();

    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(
                localStorage.getItem("user")
            ) || {};
        } catch {
            return {};
        }
    });

    const [currentWishlistCount, setCurrentWishlistCount] = useState(
        wishlistCount
    );

    const [loggingOut, setLoggingOut] = useState(false);

    useEffect(() => {
        const handleWishlistUpdate = (event) => {
            const count = event.detail?.count;

            if (count !== undefined) {
                setCurrentWishlistCount(count);
            }
        };

        window.addEventListener(
            "wishlist-updated",
            handleWishlistUpdate
        );

        return () => {
            window.removeEventListener(
                "wishlist-updated",
                handleWishlistUpdate
            );
        };
    }, []);

    useEffect(() => {
        fetchWishlistCount();
    }, []);

    const fetchWishlistCount = async () => {
        try {
            const token = localStorage.getItem("token");

            if (!token) {
                return;
            }

            const response = await api.get(
                "/account/wishlist"
            );

            setCurrentWishlistCount(
                response.data?.wishlist_count || 0
            );
        } catch (error) {
            console.error(
                "Wishlist count error:",
                error.response?.data || error.message
            );
        }
    };

    const handleLogout = async () => {
        if (loggingOut) {
            return;
        }

        try {
            setLoggingOut(true);

            await api.post(
                "/auth/logout"
            );
        } catch (error) {
            console.error(
                "Logout error:",
                error.response?.data || error.message
            );
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            sessionStorage.removeItem(
                "two_factor_challenge"
            );

            sessionStorage.removeItem(
                "two_factor_email"
            );

            delete api.defaults.headers.common.Authorization;

            setUser({});

            navigate("/login", {
                replace: true,
            });
        }
    };

    return (
        <aside className="w-[230px] shrink-0 self-start rounded-[8px] border border-[#dedede] bg-white p-[16px]">

            <CustomerProfile
                user={user}
            />

            <div className="mt-[17px] border-t border-[#dedede] pt-[14px]">

                <p className="px-[7px] text-[12px] font-medium uppercase tracking-[0.04em] text-[#777]">
                    Dashboard
                </p>

                <nav className="mt-[8px] space-y-[3px]">

                    <SidebarItem
                        to="/account"
                        icon={Grid2X2}
                        label="Overview"
                        end
                    />

                    <SidebarItem
                        to="/account/orders"
                        icon={Box}
                        label="My Orders"
                    />

                    <SidebarItem
                        to="/account/notifications"
                        icon={Bell}
                        label="Notifications"
                        badge={notificationCount}
                    />

                    <SidebarItem
                        to="/account/inbox"
                        icon={Inbox}
                        label="Inbox"
                    />

                    <SidebarItem
                        to="/account/wishlist"
                        icon={Heart}
                        label="Wishlist"
                        badge={currentWishlistCount}
                    />

                </nav>

            </div>

            <div className="mt-[17px]">

                <p className="px-[7px] text-[12px] font-medium uppercase tracking-[0.04em] text-[#777]">
                    Settings
                </p>

                <nav className="mt-[8px] space-y-[3px]">

                    <SidebarItem
                        to="/account/profile"
                        icon={UserRound}
                        label="Profile"
                    />

                    <SidebarItem
                        to="/account/preferences"
                        icon={SlidersHorizontal}
                        label="Preferences"
                    />

                    <SidebarItem
                        to="/account/addresses"
                        icon={MapPin}
                        label="Addresses"
                        badge={addressCount}
                    />

                    <SidebarItem
                        to="/account/security"
                        icon={Shield}
                        label="Security"
                    />

                </nav>

            </div>

            <div className="mt-[17px] border-t border-[#dedede] pt-[13px]">

                <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex h-[38px] w-full items-center justify-center gap-[9px] rounded-[6px] border border-[#dedede] px-[11px] text-[14px] text-[#555] transition hover:border-[#cfcfcf] hover:bg-[#f7f7f7] hover:text-[#171717] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loggingOut ? (
                        <LoaderCircle
                            size={16}
                            className="animate-spin"
                        />
                    ) : (
                        <LogOut
                            size={16}
                            strokeWidth={1.7}
                        />
                    )}

                    {loggingOut
                        ? "Signing out..."
                        : "Sign out"}
                </button>

            </div>

        </aside>
    );
};

// Customer profile
const CustomerProfile = ({
    user,
}) => {
    const name = getCustomerName(user);
    const initials = getInitials(user);

    return (
        <div className="flex items-center gap-[11px]">

            <div className="relative shrink-0">

                <div className="flex h-[50px] w-[50px] items-center justify-center rounded-full bg-[#f0d8d0] text-[14px] font-semibold text-[#553528]">
                    {initials}
                </div>

                <NavLink
                    to="/account/profile"
                    title="Edit profile"
                    className="absolute -bottom-[2px] -right-[2px] flex h-[21px] w-[21px] items-center justify-center rounded-full border border-[#dedede] bg-white text-[#555] transition hover:bg-[#f5f5f5]"
                >
                    <Pencil
                        size={10}
                        strokeWidth={1.7}
                    />
                </NavLink>

            </div>

            <div className="min-w-0">

                <p className="truncate text-[14px] font-semibold text-[#171717]">
                    {name}
                </p>

                <p className="mt-[2px] truncate text-[12px] text-[#777]">
                    {user.email || ""}
                </p>

                <span className="mt-[6px] inline-flex items-center gap-[4px] rounded-full border border-[#f59e0b] bg-[#fff8ed] px-[7px] py-[2px] text-[10px] font-medium text-[#b35b00]">
                    <Star
                        size={10}
                        fill="currentColor"
                    />
                    Bronze
                </span>

            </div>

        </div>
    );
};

// Sidebar item
const SidebarItem = ({
    to,
    icon: Icon,
    label,
    badge,
    end = false,
}) => {
    return (
        <NavLink
            to={to}
            end={end}
            className={({ isActive }) => {
                return `flex h-[36px] w-full items-center justify-between rounded-[5px] px-[10px] text-[14px] transition ${
                    isActive
                        ? "bg-[#2065D1] text-white"
                        : "text-[#555] hover:bg-[#f5f5f5] hover:text-[#171717]"
                }`;
            }}
        >
            {({ isActive }) => (
                <>
                    <span className="flex items-center gap-[10px]">

                        <Icon
                            size={16}
                            strokeWidth={1.7}
                        />

                        {label}

                    </span>

                    {badge !== undefined && badge !== null && (
                        <span
                            className={`flex min-w-[25px] items-center justify-center rounded-full px-[6px] py-[2px] text-[11px] ${
                                isActive
                                    ? "bg-[#8d5ce8] text-white"
                                    : "border border-[#dedede] bg-white text-[#333]"
                            }`}
                        >
                            {badge}
                        </span>
                    )}
                </>
            )}
        </NavLink>
    );
};

// Customer name
const getCustomerName = (user) => {
    if (user.name) {
        return user.name;
    }

    const name = [
        user.first_name,
        user.last_name,
    ]
        .filter(Boolean)
        .join(" ");

    return name || "Customer";
};

// Customer initials
const getInitials = (user) => {
    const firstName =
        user.first_name?.charAt(0) || "";

    const lastName =
        user.last_name?.charAt(0) || "";

    if (firstName || lastName) {
        return `${firstName}${lastName}`.toUpperCase();
    }

    if (user.name) {
        const parts = user.name
            .trim()
            .split(" ");

        const first =
            parts[0]?.charAt(0) || "";

        const last =
            parts.length > 1
                ? parts[parts.length - 1]?.charAt(0)
                : "";

        return `${first}${last}`.toUpperCase();
    }

    return "CU";
};

export default CustomerSidebar;