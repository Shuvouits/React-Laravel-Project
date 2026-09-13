import {
    useEffect,
    useState,
} from "react";

import {
    NavLink,
    useNavigate,
} from "react-router-dom";

import {
    Bell,
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
    const navigate =
        useNavigate();

    const [
        user,
        setUser,
    ] = useState(() => {
        try {
            return (
                JSON.parse(
                    localStorage.getItem(
                        "user"
                    )
                ) || {}
            );
        } catch {
            return {};
        }
    });

    const [
        currentWishlistCount,
        setCurrentWishlistCount,
    ] = useState(
        wishlistCount
    );

    const [
        loggingOut,
        setLoggingOut,
    ] = useState(false);

    useEffect(() => {
        const handleWishlistUpdate = (
            event
        ) => {
            const count =
                event.detail?.count;

            if (
                count !== undefined
            ) {
                setCurrentWishlistCount(
                    count
                );
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

    useEffect(() => {
        const updateUser = () => {
            try {
                const savedUser =
                    localStorage.getItem(
                        "user"
                    );

                if (savedUser) {
                    setUser(
                        JSON.parse(
                            savedUser
                        )
                    );
                }
            } catch (error) {
                console.error(
                    "Customer user parse error:",
                    error
                );
            }
        };

        updateUser();

        window.addEventListener(
            "user-updated",
            updateUser
        );

        return () => {
            window.removeEventListener(
                "user-updated",
                updateUser
            );
        };
    }, []);

    const fetchWishlistCount =
        async () => {
            try {
                const token =
                    localStorage.getItem(
                        "token"
                    );

                if (!token) {
                    return;
                }

                const response =
                    await api.get(
                        "/account/wishlist"
                    );

                setCurrentWishlistCount(
                    response.data
                        ?.wishlist_count ||
                        0
                );
            } catch (error) {
                console.error(
                    "Wishlist count error:",
                    error.response?.data ||
                        error.message
                );
            }
        };

    const handleLogout =
        async () => {
            if (loggingOut) {
                return;
            }

            try {
                setLoggingOut(
                    true
                );

                await api.post(
                    "/auth/logout"
                );
            } catch (error) {
                console.error(
                    "Logout error:",
                    error.response?.data ||
                        error.message
                );
            } finally {
                localStorage.removeItem(
                    "token"
                );

                localStorage.removeItem(
                    "user"
                );

                sessionStorage.removeItem(
                    "two_factor_challenge"
                );

                sessionStorage.removeItem(
                    "two_factor_email"
                );

                delete api.defaults
                    .headers
                    .common
                    .Authorization;

                setUser({});

                navigate(
                    "/login",
                    {
                        replace: true,
                    }
                );
            }
        };

    return (
        <aside className="w-[230px] shrink-0 self-start rounded-[8px] border border-[#dedede] bg-white p-[16px]">

            <CustomerProfile
                user={user}
                setUser={setUser}
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
                        to="/account/notifications"
                        icon={Bell}
                        label="Notifications"
                        badge={
                            notificationCount
                        }
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
                        badge={
                            currentWishlistCount
                        }
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
                        icon={
                            SlidersHorizontal
                        }
                        label="Preferences"
                    />

                    <SidebarItem
                        to="/account/addresses"
                        icon={MapPin}
                        label="Addresses"
                        badge={
                            addressCount
                        }
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
                    onClick={
                        handleLogout
                    }
                    disabled={
                        loggingOut
                    }
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
                            strokeWidth={
                                1.7
                            }
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

const CustomerProfile = ({
    user,
    setUser,
}) => {
    const [
        uploading,
        setUploading,
    ] = useState(false);

    const [
        imageError,
        setImageError,
    ] = useState(false);

    const name =
        getCustomerName(
            user
        );

    const initials =
        getInitials(
            user
        );

    /*
     * If the user photo changes,
     * try loading the new image again.
     */
    useEffect(() => {
        setImageError(
            false
        );
    }, [user?.photo]);

    const handlePhotoUpload =
        async (event) => {
            const file =
                event.target.files?.[0];

            if (!file) {
                return;
            }

            if (
                file.size >
                5 * 1024 * 1024
            ) {
                alert(
                    "Image size must be below 5MB."
                );

                event.target.value =
                    "";

                return;
            }

            const formData =
                new FormData();

            formData.append(
                "first_name",
                user.first_name || ""
            );

            formData.append(
                "last_name",
                user.last_name || ""
            );

            formData.append(
                "email",
                user.email || ""
            );

            formData.append(
                "phone",
                user.phone || ""
            );

            formData.append(
                "gender",
                user.gender || ""
            );

            formData.append(
                "photo",
                file
            );

            try {
                setUploading(
                    true
                );

                const response =
                    await api.post(
                        "/account/profile",
                        formData,
                        {
                            headers: {
                                "Content-Type":
                                    "multipart/form-data",
                            },
                        }
                    );

                const updatedUser =
                    response.data?.user;

                if (!updatedUser) {
                    throw new Error(
                        "Updated user was not returned."
                    );
                }

                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        updatedUser
                    )
                );

                setUser(
                    updatedUser
                );

                setImageError(
                    false
                );

                window.dispatchEvent(
                    new Event(
                        "user-updated"
                    )
                );
            } catch (error) {
                console.error(
                    "Profile photo upload error:",
                    error.response?.data ||
                        error.message
                );
            } finally {
                setUploading(
                    false
                );

                event.target.value =
                    "";
            }
        };

    const hasPhoto =
        Boolean(
            user?.photo
        ) &&
        !imageError;

    return (
        <div className="flex items-center gap-[11px]">

            <div className="relative shrink-0">

                <div className="flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-full border border-[#e1e5ee] bg-[#edf3ff] text-[13px] font-semibold uppercase text-[#2f6bdb]">

                    {hasPhoto ? (
                        <img
                            src={
                                user.photo
                            }
                            alt={
                                name ||
                                "Customer"
                            }
                            onError={() => {
                                setImageError(
                                    true
                                );
                            }}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span>
                            {initials}
                        </span>
                    )}

                </div>

                <label
                    title="Change profile photo"
                    className="absolute -bottom-[2px] -right-[2px] flex h-[21px] w-[21px] cursor-pointer items-center justify-center rounded-full border border-[#dedede] bg-white text-[#555] shadow-sm transition hover:border-[#bfc7d4] hover:text-[#2065D1]"
                >
                    {uploading ? (
                        <LoaderCircle
                            size={10}
                            className="animate-spin"
                        />
                    ) : (
                        <Pencil
                            size={10}
                            strokeWidth={
                                1.7
                            }
                        />
                    )}

                    <input
                        type="file"
                        accept="image/*"
                        disabled={
                            uploading
                        }
                        className="hidden"
                        onChange={
                            handlePhotoUpload
                        }
                    />

                </label>

            </div>

            <div className="min-w-0">

                <p className="truncate text-[14px] font-semibold text-[#171717]">
                    {name}
                </p>

                <p className="mt-[2px] truncate text-[12px] text-[#777]">
                    {user?.email || ""}
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
            className={({
                isActive,
            }) =>
                `flex h-[36px] w-full items-center justify-between rounded-[5px] px-[10px] text-[14px] transition ${
                    isActive
                        ? "bg-[#2065D1] text-white"
                        : "text-[#555] hover:bg-[#f5f5f5] hover:text-[#171717]"
                }`
            }
        >
            {({
                isActive,
            }) => (
                <>
                    <span className="flex items-center gap-[10px]">

                        <Icon
                            size={16}
                            strokeWidth={
                                1.7
                            }
                        />

                        {label}

                    </span>

                    {badge !== undefined &&
                        badge !== null && (
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

const getCustomerName = (
    user
) => {
    const firstLastName = [
        user?.first_name,
        user?.last_name,
    ]
        .filter(Boolean)
        .join(" ")
        .trim();

    if (firstLastName) {
        return firstLastName;
    }

    if (user?.name) {
        return user.name;
    }

    return "Customer";
};

const getInitials = (
    user
) => {
    const firstName =
        user?.first_name
            ?.trim()
            ?.charAt(0) ||
        "";

    const lastName =
        user?.last_name
            ?.trim()
            ?.charAt(0) ||
        "";

    if (
        firstName ||
        lastName
    ) {
        return (
            `${firstName}${lastName}`
                .toUpperCase()
        );
    }

    const fullName =
        String(
            user?.name || ""
        ).trim();

    if (fullName) {
        const parts =
            fullName
                .split(/\s+/)
                .filter(Boolean);

        const first =
            parts[0]
                ?.charAt(0) ||
            "";

        const last =
            parts.length > 1
                ? parts[
                      parts.length - 1
                  ]?.charAt(0) ||
                  ""
                : "";

        return (
            `${first}${last}`
                .toUpperCase()
        );
    }

    const email =
        String(
            user?.email || ""
        ).trim();

    if (email) {
        return email
            .charAt(0)
            .toUpperCase();
    }

    return "CU";
};

export default CustomerSidebar;