import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ChevronRight, Pencil } from "lucide-react";

import { useCart } from "../../context/CartContext";

import api from "../../api/axios";
import CollectionsMegaMenu from "./navbar/CollectionsMegaMenu";
import NavbarLogoEditor from "./navbar/NavbarLogoEditor";

const Navbar = () => {
    const navigate = useNavigate();
    const categoryTimer = useRef(null);

    const [categoryOpen, setCategoryOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [activeParent, setActiveParent] = useState(null);
    const [activeChild, setActiveChild] = useState(null);
    const [categoryLoading, setCategoryLoading] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);


    const [navbarLogo, setNavbarLogo] = useState("");
    const [navbarLogoAlt, setNavbarLogoAlt] = useState("Storify");
    const [logoEditorOpen, setLogoEditorOpen] = useState(false);
    const [logoSaving, setLogoSaving] = useState(false);



    const token = localStorage.getItem("token");
    const user = getStoredUser();

    const isLoggedIn = Boolean(token && user);
    const isAdmin = user?.role === "admin";


    useEffect(() => {
        fetchCategories();
        fetchNavbarLogo();

        return () => {
            if (categoryTimer.current) {
                clearTimeout(categoryTimer.current);
            }
        };
    }, []);



    const fetchNavbarLogo = async () => {
        try {
            const response = await api.get(
                "/general-settings"
            );

            const settings =
                response.data?.settings ||
                response.settings ||
                {};

            const logoUrl =
                settings.navbar_logo_url ||
                getImageUrl(settings.navbar_logo) ||
                "";

            console.log(
                "Loaded navbar logo:",
                logoUrl
            );

            setNavbarLogo(logoUrl);

            setNavbarLogoAlt(
                settings.navbar_logo_alt ||
                "Storify"
            );
        } catch (error) {
            console.error(
                "Navbar logo fetch error:",
                error.response?.data ||
                error.message
            );
        }
    };

    const handleNavbarLogoSave = async ({
        file,
        alt,
    }) => {
        if (!file || logoSaving) {
            return;
        }

        try {
            setLogoSaving(true);

            const formData = new FormData();

            formData.append(
                "navbar_logo",
                file
            );

            formData.append(
                "navbar_logo_alt",
                alt || "Storify"
            );

            const response = await api.post(
                "/admin/general-settings/navbar-logo",
                formData
            );

            const settings =
                response.data?.settings || {};

            setNavbarLogo(
                settings.navbar_logo_url ||
                getImageUrl(settings.navbar_logo) ||
                ""
            );

            setNavbarLogoAlt(
                settings.navbar_logo_alt ||
                "Storify"
            );

            setLogoEditorOpen(false);
        } catch (error) {
            console.error(
                "Navbar logo upload error:",
                error.response?.data ||
                error.message
            );
        } finally {
            setLogoSaving(false);
        }
    };


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

        if (
            user?.role === "admin" ||
            user?.user_role === "admin"
        ) {
            return "/admin";
        }


        if (
            user?.role === "vendor" ||
            user?.user_role === "vendor"
        ) {
            return "/vendor";
        }


        if (
            user?.role === "customer" ||
            user?.user_role === "customer" ||
            user?.account_status
        ) {
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
    className="relative z-[500] hidden w-full border-b border-[#eeeeee] bg-white font-['Inter'] shadow-[0_2px_10px_rgba(0,0,0,0.03)] lg:block"
        >
            <div className="mx-auto max-w-[1500px] px-5">

                {/* Top navbar */}
                <div className="flex h-[62px] items-center gap-8">



                    <div className="relative flex shrink-0 items-center">
                        <Link
                            to="/"
                            className="flex items-center"
                        >
                            <StorifyLogo
                                logo={navbarLogo}
                                alt={navbarLogoAlt}
                            />
                        </Link>

                        {isAdmin && (
                            <button
                                type="button"
                                onClick={() => setLogoEditorOpen(true)}
                                title="Change navbar logo"
                                aria-label="Change navbar logo"
                                className="absolute -right-[13px] -top-[10px] z-10 flex h-[26px] w-[26px] items-center justify-center rounded-full border border-[#d8e3fa] bg-white text-[#246be0] shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition hover:border-[#aac3f4] hover:bg-[#edf4ff]"
                            >
                                <Pencil
                                    size={12}
                                    strokeWidth={2}
                                />
                            </button>
                        )}
                    </div>


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


            <NavbarLogoEditor
                open={logoEditorOpen}
                currentLogo={navbarLogo}
                currentAlt={navbarLogoAlt}
                saving={logoSaving}
                onClose={() => {
                    if (!logoSaving) {
                        setLogoEditorOpen(false);
                    }
                }}
                onSave={handleNavbarLogoSave}
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
    isAdmin,
    onOpen,
    onClose,
    onParentChange,
    onRefresh,
    onNavigate,
}) => {
    const fileInputRef = useRef(null);
    const [uploading, setUploading] =
        useState(false);

    if (!open) {
        return null;
    }

    const openImagePicker = () => {
        if (
            !isAdmin ||
            !activeParent
        ) {
            return;
        }

        fileInputRef.current?.click();
    };

    const handleImageUpload = async (
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (
            !file ||
            !activeParent
        ) {
            return;
        }

        try {
            setUploading(true);

            const formData =
                new FormData();

            formData.append(
                "image",
                file
            );

            await api.post(
                `/admin/categories/${activeParent.id}/mega-menu-image`,
                formData
            );

            await onRefresh();
        } catch (error) {
            console.error(
                "Mega menu image error:",
                error.response?.data ||
                error.message
            );
        } finally {
            setUploading(false);
            event.target.value = "";
        }
    };

    const childCategories =
        activeParent?.children || [];

    return (
        <div
            onMouseEnter={onOpen}
            onMouseLeave={onClose}
            className="absolute left-0 top-full z-[1000] w-full"
        >
            <div className="mx-auto max-w-[1500px] px-5">
                <div className="w-[1070px] max-w-full overflow-hidden rounded-b-[18px] border border-t-0 border-[#e7e7e7] bg-white shadow-[0_20px_45px_rgba(0,0,0,0.13)]">
                    {loading ? (
                        <MegaMenuLoader />
                    ) : (
                        <div className="grid min-h-[460px] grid-cols-[260px_minmax(0,1fr)_265px]">
                            <div className="flex flex-col border-r border-[#ececec] bg-white">
                                <div className="flex-1 px-[6px] py-[8px]">
                                    {categories.map(
                                        (
                                            category
                                        ) => (
                                            <ParentCategory
                                                key={
                                                    category.id
                                                }
                                                category={
                                                    category
                                                }
                                                active={
                                                    activeParent?.id ===
                                                    category.id
                                                }
                                                onMouseEnter={() =>
                                                    onParentChange(
                                                        category
                                                    )
                                                }
                                                onNavigate={
                                                    onNavigate
                                                }
                                            />
                                        )
                                    )}

                                    {!categories.length && (
                                        <p className="px-[14px] py-[15px] text-[12px] text-[#999]">
                                            No categories available.
                                        </p>
                                    )}
                                </div>

                                <Link
                                    to="/products"
                                    onClick={
                                        onNavigate
                                    }
                                    className="flex min-h-[51px] items-center border-t border-[#ececec] px-[18px] text-[13px] font-semibold text-[#292929] transition hover:bg-[#f8f8f8] hover:text-[#2065D1]"
                                >
                                    View All Categories
                                </Link>
                            </div>

                            <div className="px-[32px] py-[30px]">
                                {childCategories.length >
                                0 ? (
                                    <div className="grid grid-cols-2 gap-x-[32px] gap-y-[33px]">
                                        {childCategories.map(
                                            (
                                                child
                                            ) => (
                                                <CategoryLinkGroup
                                                    key={
                                                        child.id
                                                    }
                                                    category={
                                                        child
                                                    }
                                                    onNavigate={
                                                        onNavigate
                                                    }
                                                />
                                            )
                                        )}
                                    </div>
                                ) : (
                                    <EmptyCategoryChildren
                                        category={
                                            activeParent
                                        }
                                        onNavigate={
                                            onNavigate
                                        }
                                    />
                                )}
                            </div>

                            <div className="border-l border-[#ececec] p-[27px]">
                                <div className="relative h-full min-h-[405px] overflow-hidden rounded-[18px] bg-[#f3f3f4]">
                                    {activeParent?.mega_menu_image ? (
                                        <Link
                                            to={`/products?category=${activeParent.slug}`}
                                            onClick={
                                                onNavigate
                                            }
                                            className="block h-full w-full"
                                        >
                                            <img
                                                src={getImageUrl(
                                                    activeParent.mega_menu_image
                                                )}
                                                alt={
                                                    activeParent.name
                                                }
                                                className="h-full w-full object-cover"
                                            />
                                        </Link>
                                    ) : (
                                        <Link
                                            to={
                                                activeParent?.slug
                                                    ? `/products?category=${activeParent.slug}`
                                                    : "/products"
                                            }
                                            onClick={
                                                onNavigate
                                            }
                                            className="block h-full w-full"
                                        >
                                            <MegaMenuImagePlaceholder
                                                category={
                                                    activeParent
                                                }
                                            />
                                        </Link>
                                    )}

                                    {isAdmin &&
                                        activeParent && (
                                            <button
                                                type="button"
                                                onClick={
                                                    openImagePicker
                                                }
                                                disabled={
                                                    uploading
                                                }
                                                title="Edit mega menu image"
                                                className="absolute right-[13px] top-[13px] z-20 flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#e3e3e3] bg-white text-[#2065D1] shadow-[0_5px_15px_rgba(0,0,0,0.13)] transition hover:bg-[#2065D1] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                <Pencil
                                                    size={
                                                        16
                                                    }
                                                />
                                            </button>
                                        )}

                                    {uploading && (
                                        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/40">
                                            <span className="h-[30px] w-[30px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                        </div>
                                    )}
                                </div>

                                <input
                                    ref={
                                        fileInputRef
                                    }
                                    type="file"
                                    accept="image/png,image/jpeg,image/webp"
                                    onChange={
                                        handleImageUpload
                                    }
                                    className="hidden"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Parent category
const ParentCategory = ({
    category,
    active,
    onMouseEnter,
    onNavigate,
}) => {
    const hasChildren =
        category.children?.length > 0;

    return (
        <Link
            to={`/products?category=${category.slug}`}
            onMouseEnter={
                onMouseEnter
            }
            onClick={onNavigate}
            className={`mb-[2px] flex min-h-[45px] w-full items-center justify-between rounded-[12px] px-[14px] text-[13px] transition ${
                active
                    ? "bg-[#eaf2ff] font-medium text-[#1769e8]"
                    : "text-[#555] hover:bg-[#f6f6f6] hover:text-[#2065D1]"
            }`}
        >
            <span className="truncate">
                {category.name}
            </span>

            {hasChildren && (
                <ChevronRight
                    size={15}
                    strokeWidth={1.8}
                    className={
                        active
                            ? "text-[#1769e8]"
                            : "text-[#888]"
                    }
                />
            )}
        </Link>
    );
};


const CategoryLinkGroup = ({
    category,
    onNavigate,
}) => {
    const children =
        category.children || [];

    const visibleChildren =
        children.slice(0, 4);

    return (
        <section>
            <Link
                to={`/products?category=${category.slug}`}
                onClick={onNavigate}
                className="block text-[12px] font-bold uppercase tracking-[0.06em] text-[#252525] transition hover:text-[#2065D1]"
            >
                {category.name}
            </Link>

            <div className="relative mt-[10px] h-px bg-[#dddddd]">
                <span className="absolute left-0 top-0 h-[2px] w-[50px] -translate-y-[1px] bg-[#2065D1]" />
            </div>

            {visibleChildren.length >
            0 ? (
                <div className="mt-[13px] space-y-[11px]">
                    {visibleChildren.map(
                        (child) => (
                            <Link
                                key={
                                    child.id
                                }
                                to={`/products?category=${child.slug}`}
                                onClick={
                                    onNavigate
                                }
                                className="block truncate text-[13px] text-[#606060] transition hover:text-[#2065D1]"
                            >
                                {
                                    child.name
                                }
                            </Link>
                        )
                    )}

                    <Link
                        to={`/products?category=${category.slug}`}
                        onClick={
                            onNavigate
                        }
                        className="flex items-center gap-[5px] pt-[1px] text-[12px] font-medium text-[#1769e8] hover:text-[#0d54bf]"
                    >
                        View All (
                        {children.length})
                        <ChevronRight
                            size={13}
                        />
                    </Link>
                </div>
            ) : (
                <Link
                    to={`/products?category=${category.slug}`}
                    onClick={onNavigate}
                    className="mt-[13px] flex items-center gap-[5px] text-[12px] font-medium text-[#1769e8] hover:text-[#0d54bf]"
                >
                    Browse products
                    <ChevronRight
                        size={13}
                    />
                </Link>
            )}
        </section>
    );
};



const EmptyCategoryChildren = ({
    category,
    onNavigate,
}) => {
    if (!category) {
        return (
            <div className="flex h-full min-h-[350px] items-center justify-center">
                <p className="text-[13px] text-[#999]">
                    Select a category.
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-[350px] flex-col items-center justify-center text-center">
            <h3 className="text-[17px] font-semibold text-[#252525]">
                {category.name}
            </h3>

            <p className="mt-[7px] max-w-[280px] text-[13px] leading-[20px] text-[#888]">
                Browse all available products from this category.
            </p>

            <Link
                to={`/products?category=${category.slug}`}
                onClick={onNavigate}
                className="mt-[18px] flex h-[39px] items-center gap-[7px] rounded-full bg-[#2065D1] px-[18px] text-[12px] font-semibold text-white transition hover:bg-[#1757b8]"
            >
                View products
                <ChevronRight
                    size={14}
                />
            </Link>
        </div>
    );
};

// Child category
const ChildCategory = ({
    category,
    active,
    onMouseEnter,
    onNavigate,
}) => {
    const activeClass = active
        ? "bg-[#edf4ff] font-medium text-[#2065D1]"
        : "text-[#555555] hover:bg-[#f7f7f7]";

    return (
        <Link
            to={`/products?category=${category.slug}`}
            onMouseEnter={onMouseEnter}
            onClick={onNavigate}
            className={`flex w-full items-center justify-between rounded-[10px] px-[12px] py-[10px] text-left text-[13px] transition ${activeClass}`}
        >
            <span className="truncate">
                {category.name}
            </span>

            <ChevronRight size={14} />
        </Link>
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
    const [imageError, setImageError] = useState(false);

    const image = getUserAvatar(user);

    useEffect(() => {
        setImageError(false);
    }, [image]);

    const initial =
        user?.name?.charAt(0)?.toUpperCase() ||
        user?.first_name?.charAt(0)?.toUpperCase() ||
        "U";

    if (image && !imageError) {
        return (
            <div className="h-[34px] w-[34px] shrink-0 overflow-hidden rounded-full border border-[#e7e7e7] bg-[#eeeeee]">
                <img
                    src={image}
                    alt={user?.name || "User"}
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover"
                />
            </div>
        );
    }

    return (
        <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[#e7e7e7] bg-[#eeeeee] text-[14px] font-semibold text-[#333333]">
            {initial}
        </div>
    );
};


const getUserAvatar = (user) => {
    if (!user) {
        return "";
    }

    const image =
        user.photo_url ||
        user.avatar_url ||
        user.profile_photo_url ||
        user.photo ||
        user.avatar ||
        user.profile_photo ||
        "";

    if (!image) {
        return "";
    }

    return getImageUrl(image);
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




const SearchBox = () => {
    const navigate = useNavigate();
    const searchRef = useRef(null);

    const [query, setQuery] = useState("");
    const [products, setProducts] = useState([]);
    const [searching, setSearching] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [searchError, setSearchError] = useState("");

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(event.target)
            ) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);

    useEffect(() => {
        const searchText = query.trim();

        if (searchText.length < 2) {
            setProducts([]);
            setSearching(false);
            setSearchError("");
            return;
        }

        const controller = new AbortController();

        const timer = setTimeout(async () => {
            try {
                setSearching(true);
                setSearchError("");

                const response = await api.get(
                    "/products",
                    {
                        params: {
                            search: searchText,
                            per_page: 6,
                        },
                        signal: controller.signal,
                    }
                );

                const productItems =
                    response.data?.products || [];

                setProducts(productItems);
                setDropdownOpen(true);
            } catch (error) {
                if (
                    error.code === "ERR_CANCELED" ||
                    error.name === "CanceledError"
                ) {
                    return;
                }

                console.error(
                    "Navbar product search error:",
                    error.response?.data ||
                    error.message
                );

                setProducts([]);
                setSearchError(
                    "Search results could not be loaded."
                );
                setDropdownOpen(true);
            } finally {
                setSearching(false);
            }
        }, 350);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    const openSalesAi = () => {
        window.dispatchEvent(
            new CustomEvent(
                "storify:sales-ai-open"
            )
        );
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const searchText = query.trim();

        if (!searchText) {
            return;
        }

        setDropdownOpen(false);

        navigate(
            `/products?search=${encodeURIComponent(
                searchText
            )}`
        );
    };

    const handleProductClick = (product) => {
        setDropdownOpen(false);
        setQuery("");

        navigate(`/products/${product.slug}`);
    };

    const clearSearch = () => {
        setQuery("");
        setProducts([]);
        setSearchError("");
        setDropdownOpen(false);
    };

    const showDropdown =
        dropdownOpen &&
        query.trim().length >= 2;

    return (
        <div
            ref={searchRef}
            className="relative w-full"
        >
            <form
                onSubmit={handleSubmit}
                className="flex h-[38px] w-full items-center rounded-full border border-[#dddddd] bg-white px-[15px] transition-all duration-200 focus-within:border-[#2065D1] focus-within:ring-2 focus-within:ring-[#2065D1]/10"
            >
                <SearchIcon />

                <input
                    type="text"
                    value={query}
                    onChange={(event) => {
                        setQuery(event.target.value);

                        if (
                            event.target.value
                                .trim()
                                .length >= 2
                        ) {
                            setDropdownOpen(true);
                        }
                    }}
                    onFocus={() => {
                        if (query.trim().length >= 2) {
                            setDropdownOpen(true);
                        }
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Escape") {
                            setDropdownOpen(false);
                        }
                    }}
                    placeholder="Search products..."
                    autoComplete="off"
                    className="h-full w-full border-none bg-transparent px-3 text-[14px] font-normal text-[#252525] outline-none placeholder:text-[#666666]"
                />

                {searching && (
                    <span className="mr-3 h-[16px] w-[16px] shrink-0 animate-spin rounded-full border-2 border-[#2065D1]/20 border-t-[#2065D1]" />
                )}

                {!searching && query && (
                    <button
                        type="button"
                        onClick={clearSearch}
                        aria-label="Clear search"
                        className="mr-3 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[20px] leading-none text-[#777777] transition hover:bg-[#f1f1f1] hover:text-[#2065D1]"
                    >
                        ×
                    </button>
                )}

                <button
                    type="button"
                    onClick={openSalesAi}
                    aria-label="Open Sales AI"
                    title="Ask Sales AI"
                    className="flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full bg-[#6957e9] text-white transition-all duration-200 hover:scale-105 hover:bg-[#4f3edc] focus:outline-none focus:ring-2 focus:ring-[#6957e9]/30"
                >
                    <SparkIcon />
                </button>
            </form>

            {showDropdown && (
                <div className="absolute left-0 top-[48px] z-[1200] w-full overflow-hidden rounded-[22px] border border-[#e2e2e2] bg-white shadow-[0_16px_40px_rgba(0,0,0,0.15)]">
                    <div className="max-h-[410px] overflow-y-auto px-[14px] py-[12px]">
                        {searching &&
                            products.length === 0 && (
                                <SearchLoading />
                            )}

                        {!searching &&
                            searchError && (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-[13px] text-red-500">
                                        {searchError}
                                    </p>
                                </div>
                            )}

                        {!searching &&
                            !searchError &&
                            products.length === 0 && (
                                <div className="px-4 py-8 text-center">
                                    <p className="text-[14px] font-medium text-[#333333]">
                                        No products found
                                    </p>

                                    <p className="mt-1 text-[12px] text-[#888888]">
                                        Try another product name,
                                        brand, category or SKU.
                                    </p>
                                </div>
                            )}

                        {products.map((product) => (
                            <SearchProductItem
                                key={product.id}
                                product={product}
                                onClick={() =>
                                    handleProductClick(
                                        product
                                    )
                                }
                            />
                        ))}
                    </div>

                    {!searchError &&
                        products.length > 0 && (
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="flex min-h-[43px] w-full items-center justify-between border-t border-[#eeeeee] bg-white px-[18px] text-left text-[12px] text-[#444444] transition hover:bg-[#f8f9fb] hover:text-[#2065D1]"
                            >
                                <span>
                                    View all results for{" "}
                                    <strong>
                                        "{query.trim()}"
                                    </strong>
                                </span>

                                <span className="font-semibold">
                                    Press Enter
                                </span>
                            </button>
                        )}
                </div>
            )}
        </div>
    );
};



const SearchProductItem = ({
    product,
    onClick,
}) => {
    const regularPrice = Number(
        product.price || 0
    );

    const comparePrice = Number(
        product.compare_at_price || 0
    );

    return (
        <button
            type="button"
            onClick={onClick}
            className="group flex min-h-[70px] w-full items-center gap-[13px] rounded-[14px] px-[10px] py-[8px] text-left transition hover:bg-[#f6f8fc]"
        >
            <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-[#f3f3f3]">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.title}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <ProductSearchPlaceholder />
                )}
            </div>

            <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="truncate text-[14px] font-semibold text-[#252525] transition group-hover:text-[#2065D1]">
                            {product.title}
                        </p>

                        <p className="mt-[3px] truncate text-[11px] text-[#888888]">
                            {[
                                product.brand?.name,
                                product.category?.name,
                            ]
                                .filter(Boolean)
                                .join(" · ") ||
                                "Store product"}
                        </p>
                    </div>

                    <div className="shrink-0 text-right">
                        <p className="text-[13px] font-semibold text-[#00a86b]">
                            ${regularPrice.toFixed(2)}
                        </p>

                        {comparePrice >
                            regularPrice && (
                            <p className="text-[10px] text-[#999999] line-through">
                                ${comparePrice.toFixed(2)}
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-[5px] flex items-center gap-2">
                    <span
                        className={`h-[6px] w-[6px] rounded-full ${
                            product.in_stock
                                ? "bg-[#10b981]"
                                : "bg-[#ef4444]"
                        }`}
                    />

                    <span className="text-[10px] text-[#777777]">
                        {product.in_stock
                            ? "In stock"
                            : "Out of stock"}
                    </span>
                </div>
            </div>
        </button>
    );
};

const SearchLoading = () => {
    return (
        <div className="space-y-2">
            {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="flex animate-pulse items-center gap-3 rounded-[14px] px-[10px] py-[8px]"
                >
                    <div className="h-[52px] w-[52px] rounded-[11px] bg-gray-200" />

                    <div className="flex-1">
                        <div className="h-[13px] w-1/3 rounded bg-gray-200" />
                        <div className="mt-2 h-[10px] w-1/4 rounded bg-gray-100" />
                    </div>
                </div>
            ))}
        </div>
    );
};

const ProductSearchPlaceholder = () => {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-[22px] w-[22px] text-[#aaaaaa]"
        >
            <path
                d="M4 7.5L12 3L20 7.5V16.5L12 21L4 16.5V7.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
            />

            <path
                d="M4.5 7.5L12 12L19.5 7.5M12 12V20.5"
                stroke="currentColor"
                strokeWidth="1.5"
            />
        </svg>
    );
};




// Storify logo
const StorifyLogo = ({
    logo = "",
    alt = "Storify",
}) => {
    if (logo) {
        return (
            <img
                src={logo}
                alt={alt}
                onError={(event) => {
                    console.error(
                        "Navbar logo failed to load:",
                        event.currentTarget.src
                    );
                }}
                className="h-[38px] w-auto max-w-[180px] object-contain"
            />
        );
    }

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

    const user = localStorage.getItem("user");

    if (user) {
        return JSON.parse(user);
    }

    const authUser = localStorage.getItem("storyfy_auth_user");

    if (authUser) {
        return JSON.parse(authUser);
    }

    return null;

};

// Image URL
const getImageUrl = (path) => {
    if (!path) {
        return "";
    }

    const imagePath = String(path).trim();

    if (
        imagePath.startsWith("http://") ||
        imagePath.startsWith("https://") ||
        imagePath.startsWith("data:")
    ) {
        return imagePath;
    }

    const apiBase = api.defaults.baseURL || "";
    const backendBase = apiBase.replace(/\/api\/?$/, "");

    return `${backendBase}/${imagePath.replace(/^\/+/, "")}`;
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