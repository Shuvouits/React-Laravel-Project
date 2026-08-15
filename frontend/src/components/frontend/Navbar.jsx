import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ChevronRight, Pencil } from "lucide-react";

import { useCart } from "../../context/CartContext";

import api from "../../api/axios";
import CollectionsMegaMenu from "./navbar/CollectionsMegaMenu";

const Navbar = () => {
    const navigate = useNavigate();
    const categoryTimer = useRef(null);

    const [categoryOpen, setCategoryOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [activeParent, setActiveParent] = useState(null);
    const [activeChild, setActiveChild] = useState(null);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);

    const token = localStorage.getItem("token");
    const user = getStoredUser();

    const isLoggedIn = Boolean(token && user);
    const isAdmin = user?.role === "admin";

    useEffect(() => {
        fetchCategories();

        return () => {
            if (categoryTimer.current) {
                clearTimeout(categoryTimer.current);
            }
        };
    }, []);

    // Fetch category mega menu
    const fetchCategories = async () => {
        try {
            setCategoryLoading(true);

            const response = await api.get("/category-mega-menu");
            const items = response.data?.categories || [];

            setCategories(items);

            if (!items.length) {
                setActiveParent(null);
                setActiveChild(null);
                return;
            }

            setActiveParent(items[0]);

            if (items[0].children?.length) {
                setActiveChild(items[0].children[0]);
            } else {
                setActiveChild(null);
            }
        } catch (error) {
            console.error(
                "Category mega menu error:",
                error.response?.data || error.message
            );
        } finally {
            setCategoryLoading(false);
        }
    };

    // Open category menu
    const openCategoryMenu = () => {
        if (categoryTimer.current) {
            clearTimeout(categoryTimer.current);
        }

        setCategoryOpen(true);
    };

    // Close category menu
    const closeCategoryMenu = () => {
        categoryTimer.current = setTimeout(() => {
            setCategoryOpen(false);
        }, 180);
    };

    // Toggle category menu
    const toggleCategoryMenu = () => {
        setCategoryOpen((previous) => !previous);
    };

    // Select parent category
    const selectParent = (category) => {
        setActiveParent(category);

        if (category.children?.length) {
            setActiveChild(category.children[0]);
            return;
        }

        setActiveChild(null);
    };

    // Select child category
    const selectChild = (category) => {
        setActiveChild(category);
    };

    // Dashboard path
    const getDashboardPath = () => {
        if (!user) {
            return "/login";
        }

        if (user.role === "admin") {
            return "/admin/dashboard";
        }

        if (user.role === "vendor") {
            return "/vendor/dashboard";
        }

        if (user.role === "customer") {
            return "/account";
        }

        return "/";
    };

    // Settings path
    const getSettingsPath = () => {
        if (!user) {
            return "/login";
        }

        if (user.role === "admin") {
            return "/admin/settings";
        }

        if (user.role === "vendor") {
            return "/vendor/settings";
        }

        if (user.role === "customer") {
            return "/customer/profile";
        }

        return "/";
    };

    // Logout
    const handleLogout = async () => {
        if (logoutLoading) {
            return;
        }

        try {
            setLogoutLoading(true);

            await api.post("/auth/logout");
        } catch (error) {
            console.error(
                "Logout error:",
                error.response?.data || error.message
            );
        } finally {
            localStorage.removeItem("token");
            localStorage.removeItem("user");

            setLogoutLoading(false);

            navigate("/login", {
                replace: true,
            });
        }
    };

    return (
        <header
            onMouseLeave={closeCategoryMenu}
            className="relative z-[500] w-full border-b border-[#eeeeee] bg-white font-['Inter'] shadow-[0_2px_10px_rgba(0,0,0,0.03)]"
        >
            <div className="mx-auto max-w-[1280px] px-5">

                {/* Top navbar */}
                <div className="flex h-[62px] items-center gap-8">

                    <Link to="/" className="flex shrink-0 items-center">
                        <StorifyLogo />
                    </Link>

                    <div className="flex-1">
                        <SearchBox />
                    </div>

                    <div className="flex shrink-0 items-center gap-[25px]">

                        <button
                            type="button"
                            aria-label="Dark mode"
                            className="text-[#191919] transition-colors duration-200 hover:text-[#2065D1]"
                        >
                            <MoonIcon />
                        </button>

                        <AccountMenu
                            user={user}
                            isLoggedIn={isLoggedIn}
                            logoutLoading={logoutLoading}
                            dashboardPath={getDashboardPath()}
                            settingsPath={getSettingsPath()}
                            onLogout={handleLogout}
                        />

                        <CartButton />

                    </div>

                </div>

                {/* Second navbar */}
                <div className="flex h-[58px] items-center justify-between">

                    <nav className="flex items-center gap-[28px]">

                        {/* All categories */}
                        <div
                            onMouseEnter={openCategoryMenu}
                            className="relative"
                        >
                            <button
                                type="button"
                                onClick={toggleCategoryMenu}
                                className="flex h-[42px] min-w-[214px] items-center justify-between rounded-full bg-[#f7f7f7] px-[17px] transition-colors duration-200 hover:bg-[#f1f1f1]"
                            >
                                <div className="flex items-center gap-[12px]">
                                    <MenuIcon />

                                    <span className="text-[14px] font-medium text-[#222222]">
                                        All Categories
                                    </span>
                                </div>

                                <ChevronDownIcon open={categoryOpen} />
                            </button>
                        </div>

                        {/* Collections */}
                        <CollectionsMegaMenu
                            onOpen={() => setCategoryOpen(false)}
                        />

                        <NavLink to="/brands" className={menuClass}>
                            Brands
                        </NavLink>

                        <NavLink to="/pre-order" className={menuClass}>
                            Pre-order
                        </NavLink>

                        <NavLink to="/products" className={menuClass}>
                            Products
                        </NavLink>

                    </nav>

                    <nav className="flex items-center gap-[25px]">

                        <NavLink
                            to="/track-order"
                            className={iconMenuClass}
                        >
                            <OrderIcon />
                            Track Order
                        </NavLink>

                        <NavLink
                            to="/blog"
                            className={iconMenuClass}
                        >
                            <BlogIcon />
                            Blog
                        </NavLink>

                        <NavLink
                            to="/contact-us"
                            className={menuClass}
                        >
                            Contact Us
                        </NavLink>

                        <NavLink
                            to="/become-vendor"
                            className={menuClass}
                        >
                            Become a Vendor
                        </NavLink>

                    </nav>

                </div>

            </div>

            {/* Category mega menu */}
            <CategoryMegaMenu
                open={categoryOpen}
                loading={categoryLoading}
                categories={categories}
                activeParent={activeParent}
                activeChild={activeChild}
                isAdmin={isAdmin}
                onOpen={openCategoryMenu}
                onClose={closeCategoryMenu}
                onParentChange={selectParent}
                onChildChange={selectChild}
                onRefresh={fetchCategories}
                onNavigate={() => setCategoryOpen(false)}
            />

        </header>
    );
};

// Category mega menu
const CategoryMegaMenu = ({
    open,
    loading,
    categories,
    activeParent,
    activeChild,
    isAdmin,
    onOpen,
    onClose,
    onParentChange,
    onChildChange,
    onRefresh,
    onNavigate,
}) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] = useState(false);

    if (!open) {
        return null;
    }

    // Open image picker
    const openImagePicker = () => {
        if (!isAdmin || !activeParent) {
            return;
        }

        fileInputRef.current?.click();
    };

    // Upload category image
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];

        if (!file || !activeParent) {
            return;
        }

        try {
            setUploading(true);

            const formData = new FormData();
            formData.append("image", file);

            await api.post(
                `/admin/categories/${activeParent.id}/mega-menu-image`,
                formData
            );

            await onRefresh();
        } catch (error) {
            console.error(
                "Mega menu image error:",
                error.response?.data || error.message
            );
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    return (
        <div
            onMouseEnter={onOpen}
            onMouseLeave={onClose}
            className="absolute left-0 top-full z-[1000] w-full border-t border-[#eeeeee] bg-white shadow-[0_22px_45px_rgba(0,0,0,0.12)]"
        >
            <div className="mx-auto max-w-[1280px]">

                {loading ? (
                    <MegaMenuLoader />
                ) : (
                    <div className="grid min-h-[365px] grid-cols-[255px_255px_1fr_290px]">

                        {/* Parent categories */}
                        <div className="border-r border-[#ececec] p-[14px]">

                            {categories.map((category) => (
                                <ParentCategory
                                    key={category.id}
                                    category={category}
                                    active={activeParent?.id === category.id}
                                    onMouseEnter={() => onParentChange(category)}
                                    onClick={() => onParentChange(category)}
                                />
                            ))}

                            {!categories.length && (
                                <p className="px-[13px] py-[12px] text-[12px] text-[#999999]">
                                    No categories available.
                                </p>
                            )}

                            <Link
                                to="/products"
                                onClick={onNavigate}
                                className="mt-[8px] flex items-center justify-center gap-[6px] py-[12px] text-[13px] font-medium text-[#2065D1]"
                            >
                                View All
                                <ChevronRight size={14} />
                            </Link>

                        </div>

                        {/* Child categories */}
                        <div className="border-r border-[#ececec] px-[18px] py-[20px]">

                            <p className="mb-[12px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#777777]">
                                {activeParent?.name || "Categories"}
                            </p>

                            <div className="space-y-[3px]">

                                {activeParent?.children?.map((category) => (
                                    <ChildCategory
                                        key={category.id}
                                        category={category}
                                        active={activeChild?.id === category.id}
                                        onMouseEnter={() => onChildChange(category)}
                                        onClick={() => onChildChange(category)}
                                    />
                                ))}

                                {!activeParent?.children?.length && (
                                    <p className="px-[12px] py-[10px] text-[12px] text-[#999999]">
                                        No subcategories available.
                                    </p>
                                )}

                            </div>

                        </div>

                        {/* Grandchild categories */}
                        <div className="px-[28px] py-[20px]">

                            <div className="flex items-center justify-between border-b border-[#eeeeee] pb-[13px]">

                                <h3 className="text-[14px] font-semibold text-[#222222]">
                                    {activeChild?.name || activeParent?.name || "Category"}
                                </h3>

                                {activeChild && (
                                    <Link
                                        to={`/products?category=${activeChild.slug}`}
                                        onClick={onNavigate}
                                        className="flex items-center gap-[5px] text-[12px] font-medium text-[#2065D1]"
                                    >
                                        View all
                                        <ChevronRight size={13} />
                                    </Link>
                                )}

                            </div>

                            {activeChild?.children?.length ? (
                                <div className="mt-[18px] grid grid-cols-2 gap-x-[45px] gap-y-[18px]">

                                    {activeChild.children.map((category) => (
                                        <Link
                                            key={category.id}
                                            to={`/products?category=${category.slug}`}
                                            onClick={onNavigate}
                                            className="text-[13px] text-[#555555] transition-colors hover:text-[#2065D1]"
                                        >
                                            {category.name}
                                        </Link>
                                    ))}

                                </div>
                            ) : (
                                <div className="mt-[18px]">

                                    {activeChild ? (
                                        <Link
                                            to={`/products?category=${activeChild.slug}`}
                                            onClick={onNavigate}
                                            className="text-[13px] text-[#555555] transition-colors hover:text-[#2065D1]"
                                        >
                                            Browse {activeChild.name}
                                        </Link>
                                    ) : (
                                        <p className="text-[12px] text-[#999999]">
                                            Select a category.
                                        </p>
                                    )}

                                </div>
                            )}

                        </div>

                        {/* Mega menu image */}
                        <div className="border-l border-[#ececec] p-[18px]">

                            <div className="relative h-[315px] overflow-hidden rounded-[18px] bg-[#f5f5f5]">

                                {activeParent?.mega_menu_image ? (
                                    <img
                                        src={getImageUrl(activeParent.mega_menu_image)}
                                        alt={activeParent.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <MegaMenuImagePlaceholder
                                        category={activeParent}
                                    />
                                )}

                                {isAdmin && activeParent && (
                                    <button
                                        type="button"
                                        onClick={openImagePicker}
                                        disabled={uploading}
                                        title="Edit mega menu image"
                                        className="absolute right-[12px] top-[12px] flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#2065D1] shadow-md transition hover:bg-[#2065D1] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <Pencil size={16} />
                                    </button>
                                )}

                                {uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <span className="h-[28px] w-[28px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                    </div>
                                )}

                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleImageUpload}
                                className="hidden"
                            />

                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};

// Parent category
const ParentCategory = ({
    category,
    active,
    onMouseEnter,
    onClick,
}) => {
    const activeClass = active
        ? "bg-[#edf4ff] text-[#2065D1]"
        : "text-[#555555] hover:bg-[#f6f6f6]";

    return (
        <button
            type="button"
            onMouseEnter={onMouseEnter}
            onClick={onClick}
            className={`mb-[3px] flex w-full items-center justify-between rounded-[12px] px-[13px] py-[11px] text-left text-[13px] transition ${activeClass}`}
        >
            <span className="flex min-w-0 items-center gap-[11px]">

                <CategoryIcon category={category} />

                <span className="truncate">
                    {category.name}
                </span>

            </span>

            <ChevronRight size={15} />

        </button>
    );
};

// Child category
const ChildCategory = ({
    category,
    active,
    onMouseEnter,
    onClick,
}) => {
    const activeClass = active
        ? "bg-[#edf4ff] font-medium text-[#2065D1]"
        : "text-[#555555] hover:bg-[#f7f7f7]";

    return (
        <button
            type="button"
            onMouseEnter={onMouseEnter}
            onClick={onClick}
            className={`flex w-full items-center justify-between rounded-[10px] px-[12px] py-[10px] text-left text-[13px] transition ${activeClass}`}
        >
            <span className="truncate">
                {category.name}
            </span>

            <ChevronRight size={14} />

        </button>
    );
};

// Category icon
const CategoryIcon = ({ category }) => {
    if (category.image) {
        return (
            <img
                src={getImageUrl(category.image)}
                alt=""
                className="h-[20px] w-[20px] shrink-0 object-contain"
            />
        );
    }

    return (
        <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[5px] border border-[#dddddd]">
            <span className="h-[7px] w-[7px] rounded-[2px] bg-[#777777]" />
        </span>
    );
};

// Mega menu image placeholder
const MegaMenuImagePlaceholder = ({ category }) => {
    return (
        <div className="flex h-full w-full items-center justify-center px-[20px] text-center">

            <div>
                <p className="text-[16px] font-semibold text-[#333333]">
                    {category?.name || "Category"}
                </p>

                <p className="mt-[5px] text-[12px] text-[#999999]">
                    Mega menu image
                </p>
            </div>

        </div>
    );
};

// Mega menu loader
const MegaMenuLoader = () => {
    return (
        <div className="flex min-h-[365px] items-center justify-center">
            <span className="h-[30px] w-[30px] animate-spin rounded-full border-2 border-[#2065D1]/20 border-t-[#2065D1]" />
        </div>
    );
};

// Account menu
const AccountMenu = ({
    user,
    isLoggedIn,
    logoutLoading,
    dashboardPath,
    settingsPath,
    onLogout,
}) => {
    if (!isLoggedIn) {
        return <GuestAccountMenu />;
    }

    return (
        <div className="group relative">

            <div className="flex cursor-pointer items-center gap-[9px] py-[10px]">

                <UserAvatar user={user} />

                <div className="leading-[1.15]">
                    <p className="text-[11px] font-normal text-[#777777]">
                        Welcome
                    </p>

                    <p className="max-w-[130px] truncate whitespace-nowrap text-[13px] font-medium text-[#171717] transition-colors duration-200 group-hover:text-[#2065D1]">
                        {user?.name}
                    </p>
                </div>

                <AccountArrow />

            </div>

            <div className="invisible absolute right-0 top-full h-[10px] w-[220px] group-hover:visible" />

            <div className="invisible absolute right-0 top-[52px] z-[100] w-[220px] -translate-y-[5px] overflow-hidden rounded-[16px] border border-[#ececec] bg-white opacity-0 shadow-[0_10px_30px_rgba(0,0,0,0.13)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">

                <div className="border-b border-[#eeeeee] px-[14px] py-[12px]">
                    <p className="truncate text-[14px] font-semibold text-[#222222]">
                        {user?.name}
                    </p>

                    <p className="mt-[2px] truncate text-[12px] text-[#777777]">
                        {user?.email}
                    </p>
                </div>

                <Link
                    to={dashboardPath}
                    className="flex min-h-[42px] items-center gap-[11px] px-[14px] text-[13px] text-[#3d3d3d] transition-colors hover:bg-[#f7f8fa] hover:text-[#2065D1]"
                >
                    <DashboardIcon />
                    Dashboard
                </Link>

                <Link
                    to={settingsPath}
                    className="flex min-h-[42px] items-center gap-[11px] px-[14px] text-[13px] text-[#3d3d3d] transition-colors hover:bg-[#f7f8fa] hover:text-[#2065D1]"
                >
                    <SettingsIcon />
                    Settings
                </Link>

                <div className="h-px bg-[#eeeeee]" />

                <button
                    type="button"
                    onClick={onLogout}
                    disabled={logoutLoading}
                    className="flex min-h-[42px] w-full items-center gap-[11px] px-[14px] text-[13px] text-[#ef4444] transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {logoutLoading ? (
                        <>
                            <span className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-red-200 border-t-red-500" />
                            Logging out...
                        </>
                    ) : (
                        <>
                            <LogoutIcon />
                            Logout
                        </>
                    )}
                </button>

            </div>

        </div>
    );
};

// Guest account
const GuestAccountMenu = () => {
    return (
        <div className="group relative">

            <div className="flex cursor-pointer items-center gap-[9px] py-[10px]">

                <ProfileIcon />

                <div className="leading-[1.15]">
                    <p className="text-[11px] font-normal text-[#777777]">
                        Welcome
                    </p>

                    <p className="whitespace-nowrap text-[13px] font-medium text-[#171717] transition-colors duration-200 group-hover:text-[#2065D1]">
                        Login / Register
                    </p>
                </div>

                <AccountArrow />

            </div>

            <div className="invisible absolute right-0 top-full h-[10px] w-[315px] group-hover:visible" />

            <div className="invisible absolute right-0 top-[52px] z-[100] w-[315px] -translate-y-[5px] rounded-[28px] border border-[#f0f0f0] bg-white px-[22px] pb-[20px] pt-[17px] opacity-0 shadow-[0_10px_40px_rgba(0,0,0,0.12)] transition-all duration-200 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">

                <Link
                    to="/login"
                    className="flex h-[42px] w-full items-center justify-center rounded-full bg-[#2065D1] text-[14px] font-semibold text-white transition-colors hover:bg-[#1858bb]"
                >
                    Sign in
                </Link>

                <Link
                    to="/register"
                    className="flex h-[47px] items-center justify-center text-[15px] text-[#555555] transition-colors hover:text-[#2065D1]"
                >
                    Register
                </Link>

                <div className="mb-[10px] h-px w-full bg-[#dddddd]" />

                <DropdownItem to="/customer/dashboard">
                    <DashboardIcon />
                    Dashboard
                </DropdownItem>

                <DropdownItem to="/customer/orders">
                    <OrderIcon />
                    My Orders
                </DropdownItem>

                <DropdownItem to="/customer/wishlist">
                    <WishlistIcon />
                    Wishlist
                </DropdownItem>

                <DropdownItem to="/customer/profile">
                    <ProfileIcon />
                    Profile
                </DropdownItem>

            </div>

        </div>
    );
};

// User avatar
const UserAvatar = ({ user }) => {
    if (user?.avatar) {
        return (
            <div className="h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full border border-[#e7e7e7] bg-[#eeeeee]">
                <img
                    src={user.avatar}
                    alt={user?.name || "User"}
                    className="h-full w-full object-cover"
                />
            </div>
        );
    }

    const initial = user?.name?.charAt(0)?.toUpperCase() || "U";

    return (
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[#e7e7e7] bg-[#eeeeee] text-[14px] font-semibold text-[#333333]">
            {initial}
        </div>
    );
};

// Dropdown item
const DropdownItem = ({ to, children }) => {
    return (
        <Link
            to={to}
            className="flex min-h-[43px] items-center gap-[11px] px-[4px] text-[14px] font-normal text-[#3e3e3e] transition-colors duration-200 hover:text-[#2065D1]"
        >
            {children}
        </Link>
    );
};

// Search box
const SearchBox = () => {
    return (
        <div className="flex h-[38px] w-full items-center rounded-full border border-[#dddddd] bg-white px-[15px] transition-all duration-200 focus-within:border-[#2065D1] focus-within:ring-2 focus-within:ring-[#2065D1]/10">

            <SearchIcon />

            <input
                type="text"
                placeholder="Search products..."
                className="h-full w-full border-none bg-transparent px-3 text-[14px] font-normal text-[#252525] outline-none placeholder:text-[#666666]"
            />

            <button
                type="button"
                aria-label="Search"
                className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full bg-[#6957e9] text-white transition-colors duration-200 hover:bg-[#2065D1]"
            >
                <SparkIcon />
            </button>

        </div>
    );
};

// Storify logo
const StorifyLogo = () => {
    return (
        <div className="flex items-center gap-[8px]">

            <div className="relative h-[34px] w-[31px]">

                <div className="absolute inset-0 rounded-[7px] bg-gradient-to-br from-[#27b4f5] via-[#6378f7] to-[#b54df5]" />

                <div className="absolute inset-[3px] flex items-center justify-center rounded-[5px] bg-white">
                    <span className="bg-gradient-to-r from-[#337bea] to-[#8554ee] bg-clip-text text-[18px] font-bold text-transparent">
                        S
                    </span>
                </div>

                <span className="absolute -top-[3px] left-[7px] h-[5px] w-[5px] rounded-full bg-[#ffd93d]" />

            </div>

            <span className="text-[22px] font-bold tracking-[-0.7px] text-[#3478ea]">
                Storify
            </span>

        </div>
    );
};




// Cart button

// Cart button
const CartButton = () => {
    const {
        itemCount,
        openCart,
    } = useCart();

    const displayCount = itemCount > 99
        ? "99+"
        : itemCount;

    return (
        <button
            type="button"
            onClick={openCart}
            aria-label={`Shopping cart with ${itemCount} items`}
            className="relative text-[#111111] transition-colors duration-200 hover:text-[#2065D1]"
        >
            <CartIcon />

            {itemCount > 0 && (
                <span className="absolute -right-[9px] -top-[10px] flex h-[19px] min-w-[19px] items-center justify-center rounded-full bg-[#2065D1] px-[4px] text-[10px] font-semibold leading-none text-white">
                    {displayCount}
                </span>
            )}
        </button>
    );
};

// Stored user
const getStoredUser = () => {
    try {
        const storedUser = localStorage.getItem("user");

        if (!storedUser) {
            return null;
        }

        return JSON.parse(storedUser);
    } catch {
        return null;
    }
};

// Image URL
const getImageUrl = (path) => {
    if (!path) {
        return "";
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    const apiBase = api.defaults.baseURL || "";
    const backendBase = apiBase.replace(/\/api\/?$/, "");

    return `${backendBase}/${path.replace(/^\/+/, "")}`;
};

// Main menu class
const menuClass = ({ isActive }) => {
    if (isActive) {
        return "whitespace-nowrap text-[14px] font-normal text-[#2065D1] transition-colors duration-200";
    }

    return "whitespace-nowrap text-[14px] font-normal text-[#333333] transition-colors duration-200 hover:text-[#2065D1]";
};

// Collections class
const collectionMenuClass = ({ isActive }) => {
    if (isActive) {
        return "flex items-center gap-[4px] whitespace-nowrap text-[14px] font-semibold text-[#2065D1] transition-colors duration-200";
    }

    return "flex items-center gap-[4px] whitespace-nowrap text-[14px] font-semibold text-[#222222] transition-colors duration-200 hover:text-[#2065D1]";
};

// Icon menu class
const iconMenuClass = ({ isActive }) => {
    if (isActive) {
        return "flex items-center gap-[8px] whitespace-nowrap text-[14px] text-[#2065D1] transition-colors duration-200";
    }

    return "flex items-center gap-[8px] whitespace-nowrap text-[14px] text-[#333333] transition-colors duration-200 hover:text-[#2065D1]";
};

// Account arrow
const AccountArrow = () => {
    return (
        <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-[#777777] transition-all duration-200 group-hover:rotate-180 group-hover:text-[#2065D1]"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
};

// Category arrow
const ChevronDownIcon = ({ open }) => {
    const rotateClass = open ? "rotate-180" : "";

    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform duration-200 ${rotateClass}`}
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
};

// Small arrow
const ChevronDownSmall = () => {
    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
};

// Search icon
const SearchIcon = () => {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="shrink-0 text-[#181818]"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    );
};

// Search spark
const SparkIcon = () => {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
        >
            <path
                d="M12 4V20M4 12H20"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
            />

            <path
                d="M18.5 5.5L19.5 4.5M18.5 18.5L19.5 19.5M5.5 5.5L4.5 4.5M5.5 18.5L4.5 19.5"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
            />
        </svg>
    );
};

// Menu icon
const MenuIcon = () => {
    return (
        <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            className="text-[#222222]"
        >
            <path d="M4 6h16" />
            <path d="M4 12h16" />
            <path d="M4 18h16" />
        </svg>
    );
};

// Moon icon
const MoonIcon = () => {
    return (
        <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" />
        </svg>
    );
};

// Cart icon
const CartIcon = () => {
    return (
        <svg
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="9" cy="20" r="1" />
            <circle cx="19" cy="20" r="1" />
            <path d="M3 4h2l2.5 11h11l2-8H6" />
        </svg>
    );
};

// Dashboard icon
const DashboardIcon = () => {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
        >
            <rect x="4" y="4" width="6" height="6" rx="1" />
            <rect x="14" y="4" width="6" height="6" rx="1" />
            <rect x="4" y="14" width="6" height="6" rx="1" />
            <rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
    );
};

// Order icon
const OrderIcon = () => {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
            <path d="m4 7.5 8 4.5 8-4.5" />
            <path d="M12 12v9" />
        </svg>
    );
};

// Wishlist icon
const WishlistIcon = () => {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20.8 4.6c-1.5-1.5-4-1.5-5.5 0L12 7.9 8.7 4.6c-1.5-1.5-4-1.5-5.5 0s-1.5 4 0 5.5L12 18.9l8.8-8.8c1.5-1.5 1.5-4 0-5.5Z" />
        </svg>
    );
};

// Profile icon
const ProfileIcon = () => {
    return (
        <svg
            width="21"
            height="21"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
        </svg>
    );
};

// Settings icon
const SettingsIcon = () => {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="3" />

            <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9A1.7 1.7 0 0 0 21 10h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
        </svg>
    );
};

// Logout icon
const LogoutIcon = () => {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M14 3h4a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-4" />
        </svg>
    );
};

// Blog icon
const BlogIcon = () => {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
        >
            <path d="M5 11a8 8 0 0 1 8 8" />
            <path d="M5 5a14 14 0 0 1 14 14" />
            <circle cx="5" cy="19" r="1" />
        </svg>
    );
};

export default Navbar;