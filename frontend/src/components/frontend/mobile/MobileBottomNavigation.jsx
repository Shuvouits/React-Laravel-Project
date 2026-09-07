import { useEffect, useState } from "react";
import {
    ChevronDown,
    Eye,
    EyeOff,
    Grid2X2,
    Home,
    Layers3,
    LockKeyhole,
    LogIn,
    Mail,
    Menu,
    Package,
    ShoppingBag,
    Tags,
    UserRound,
    X,
} from "lucide-react";
import {
    Link,
    useLocation,
    useNavigate,
} from "react-router-dom";
import Swal from "sweetalert2";

import api from "../../../api/axios";

const MobileBottomNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [collections, setCollections] = useState([]);
    const [collectionsLoading, setCollectionsLoading] = useState(false);

    const [categories, setCategories] = useState([]);
    const [categoriesLoading, setCategoriesLoading] = useState(false);

    const [activePanel, setActivePanel] =
        useState(null);

    const user = getStoredUser();
    const token = localStorage.getItem("token");
    const isLoggedIn = Boolean(token && user);

    useEffect(() => {
        closePanel();
    }, [location.pathname]);

    useEffect(() => {
        if (!activePanel) {
            document.body.style.overflow = "";
            return;
        }

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow = "hidden";

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                closePanel();
            }
        };

        window.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.body.style.overflow =
                previousOverflow;

            window.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [activePanel]);

    const closePanel = () => {
        setActivePanel(null);
    };

    const handleAccountClick = () => {
        if (!isLoggedIn) {
            setActivePanel("account");
            return;
        }

        navigate(getDashboardPath(user));
    };

    const fetchCategories = async () => {
        try {
            setCategoriesLoading(true);

            const response = await api.get(
                "/category-mega-menu"
            );

            setCategories(
                response.data?.categories || []
            );
        } catch (error) {
            console.error(
                "Mobile categories error:",
                error.response?.data ||
                error.message
            );

            setCategories([]);
        } finally {
            setCategoriesLoading(false);
        }
    };


    const fetchCollections = async () => {
        try {
            setCollectionsLoading(true);

            const response = await api.get(
                "/collection-menu"
            );

            setCollections(
                response.data?.collections || []
            );
        } catch (error) {
            console.error(
                "Mobile collection menu error:",
                error.response?.data ||
                error.message
            );

            setCollections([]);
        } finally {
            setCollectionsLoading(false);
        }
    };


    useEffect(() => {
        fetchCategories();
        fetchCollections();
    }, []);

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-[1300] flex h-[64px] items-center justify-around border-t border-[#e8e8e8] bg-white px-3 shadow-[0_-5px_20px_rgba(0,0,0,0.06)] lg:hidden">
                <BottomButton
                    label="Home"
                    active={location.pathname === "/"}
                    onClick={() => navigate("/")}
                >
                    <Home size={20} strokeWidth={1.8} />
                </BottomButton>

                <BottomButton
                    label="Menu"
                    active={activePanel === "menu"}
                    onClick={() => {
                        setActivePanel(
                            activePanel === "menu"
                                ? null
                                : "menu"
                        );
                    }}
                >
                    <Menu size={21} strokeWidth={1.8} />
                </BottomButton>

                <BottomButton
                    label={
                        isLoggedIn
                            ? "Dashboard"
                            : "Account"
                    }
                    active={
                        activePanel === "account" ||
                        location.pathname.startsWith(
                            "/account"
                        )
                    }
                    onClick={handleAccountClick}
                >
                    <Grid2X2
                        size={20}
                        strokeWidth={1.8}
                    />
                </BottomButton>
            </nav>

            {activePanel && (
                <button
                    type="button"
                    aria-label="Close mobile panel"
                    onClick={closePanel}
                    className="fixed inset-0 z-[1400] bg-black/45 backdrop-blur-[1px] lg:hidden"
                />
            )}

            <aside
                className={`fixed bottom-0 right-0 top-0 z-[1500] w-[min(88vw,360px)] bg-white shadow-[-15px_0_45px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out lg:hidden ${activePanel
                    ? "translate-x-0"
                    : "translate-x-full"
                    }`}
            >
                {activePanel === "menu" && (


                    <MobileMenuPanel
                         user={user}
    isLoggedIn={isLoggedIn}
    categories={categories}
    categoriesLoading={categoriesLoading}
    collections={collections}
    collectionsLoading={collectionsLoading}
    onClose={closePanel}
    onAccount={() =>
        setActivePanel("account")
    }
                    />
                )}

                {activePanel === "account" && (
                    <MobileAccountPanel
                        onClose={closePanel}
                    />
                )}
            </aside>
        </>
    );
};

const BottomButton = ({
    label,
    active,
    onClick,
    children,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex min-w-[72px] flex-col items-center justify-center gap-1 text-[10px] transition ${active
                ? "font-semibold text-[#2065D1]"
                : "font-medium text-[#777777]"
                }`}
        >
            {children}
            <span>{label}</span>
        </button>
    );
};

const MobileMenuPanel = ({
      user,
    isLoggedIn,
    categories,
    categoriesLoading,
    collections,
    collectionsLoading,
    onClose,
    onAccount,
}) => {
   
     const [moreOpen, setMoreOpen] =
        useState(false);

    const [categoriesOpen, setCategoriesOpen] =
        useState(false);


    return (
        <div className="flex h-full flex-col overflow-hidden bg-[#fafafa] font-['Inter']">
            <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-[#eeeeee] bg-white px-5">
                <Link
                    to="/"
                    onClick={onClose}
                    className="flex items-center gap-2 text-[19px] font-bold text-[#3478ea]"
                >
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#27b4f5] via-[#6378f7] to-[#b54df5] text-base font-bold text-white">
                        S
                    </span>

                    Storify
                </Link>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        aria-label="Close menu"
                        onClick={onClose}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#444444]"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                <nav className="border-b border-[#e7e7e7] bg-white px-4 py-4">
                    <MobileMenuLink
                        to="/"
                        icon={Home}
                        onClick={onClose}
                    >
                        Home
                    </MobileMenuLink>

                    <MobileMenuLink
                        to="/products"
                        icon={Package}
                        onClick={onClose}
                    >
                        Products
                    </MobileMenuLink>

                    <MobileMenuLink
                        to="/collections"
                        icon={Layers3}
                        onClick={onClose}
                    >
                        Collections
                    </MobileMenuLink>

                    <MobileMenuLink
                        to="/brands"
                        icon={Tags}
                        onClick={onClose}
                    >
                        Brands
                    </MobileMenuLink>

                    <MobileMenuLink
                        to="/pre-order"
                        icon={ShoppingBag}
                        onClick={onClose}
                    >
                        Pre-order
                    </MobileMenuLink>

                    <button
                        type="button"
                        onClick={() =>
                            setMoreOpen(
                                (previous) => !previous
                            )
                        }
                        className="flex min-h-[46px] w-full items-center gap-3 rounded-xl px-3 text-left text-[13px] font-medium text-[#292929] transition hover:bg-[#f5f5f5]"
                    >
                        <span className="flex h-5 w-5 items-center justify-center text-[#777777]">
                            •••
                        </span>

                        <span className="flex-1">
                            More
                        </span>

                        <ChevronDown
                            size={15}
                            className={`transition ${moreOpen
                                ? "rotate-180"
                                : ""
                                }`}
                        />
                    </button>

                    {moreOpen && (
                        <div className="ml-8 border-l border-[#e5e5e5] pl-3">
                            <MobileTextLink
                                to="/blog"
                                onClick={onClose}
                            >
                                Blog
                            </MobileTextLink>

                            <MobileTextLink
                                to="/contact-us"
                                onClick={onClose}
                            >
                                Contact Us
                            </MobileTextLink>

                            <MobileTextLink
                                to="/track-order"
                                onClick={onClose}
                            >
                                Track Order
                            </MobileTextLink>

                            <MobileTextLink
                                to="/become-vendor"
                                onClick={onClose}
                            >
                                Become a Vendor
                            </MobileTextLink>
                        </div>
                    )}
                </nav>

               

               <section className="border-b border-[#e7e7e7] bg-[#fafafa]">
    <div className="flex min-h-[56px] items-center justify-between px-5">
        <button
            type="button"
            onClick={() =>
                setCategoriesOpen(
                    (previous) => !previous
                )
            }
            className="flex flex-1 items-center gap-3 text-left"
        >
            <Grid2X2
                size={16}
                strokeWidth={1.7}
                className="text-[#6d6d6d]"
            />

            <span className="text-[12px] font-semibold text-[#292929]">
                All Categories
            </span>

            <ChevronDown
                size={14}
                strokeWidth={1.8}
                className={`ml-1 text-[#777777] transition-transform duration-200 ${
                    categoriesOpen
                        ? "rotate-180"
                        : ""
                }`}
            />
        </button>

        <Link
            to="/products"
            onClick={onClose}
            className="shrink-0 text-[10px] font-medium text-[#2065D1]"
        >
            View All
        </Link>
    </div>

    <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
            categoriesOpen
                ? "max-h-[700px] opacity-100"
                : "max-h-0 opacity-0"
        }`}
    >
        <div className="border-t border-[#eeeeee] px-5 pb-4 pt-1">
            {categoriesLoading ? (
                <MobileCategoryListSkeleton />
            ) : categories.length > 0 ? (
                <div>
                    {categories.map((category) => (
                        <MobileCategoryItem
                            key={category.id}
                            category={category}
                            onClose={onClose}
                        />
                    ))}
                </div>
            ) : (
                <p className="py-5 text-center text-[11px] text-[#888888]">
                    No categories available.
                </p>
            )}
        </div>
    </div>
</section>




                <section className="border-b border-[#e7e7e7] bg-[#fafafa] px-5 py-5">
                    <div className="flex items-center justify-between">
                        <h3 className="text-[11px] font-semibold text-[#333333]">
                            Collections
                        </h3>

                        <Link
                            to="/products"
                            onClick={onClose}
                            className="text-[10px] font-medium text-[#2065D1]"
                        >
                            View All
                        </Link>
                    </div>

                    <div className="mt-3">
                        {collectionsLoading ? (
                            <MobileCollectionSkeleton />
                        ) : collections.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3">
                                {collections
                                    .slice(0, 3)
                                    .map((collection) => (
                                        <MobileCollectionCard
                                            key={collection.id}
                                            collection={collection}
                                            onClose={onClose}
                                        />
                                    ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-[#dddddd] px-4 py-6 text-center">
                                <p className="text-[11px] text-[#888888]">
                                    No collections available.
                                </p>
                            </div>
                        )}
                    </div>
                </section>




                <section className="bg-white px-5 py-6">
                    <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#999999]">
                        Account
                    </p>

                    {!isLoggedIn ? (
                        <>
                            <button
                                type="button"
                                onClick={onAccount}
                                className="flex min-h-[45px] w-full items-center gap-3 rounded-xl px-2 text-[13px] font-medium text-[#2065D1] transition hover:bg-blue-50"
                            >
                                <LogIn size={17} />
                                Sign in
                            </button>

                            <Link
                                to="/register"
                                onClick={onClose}
                                className="flex min-h-[45px] items-center gap-3 rounded-xl px-2 text-[13px] font-medium text-[#333333] transition hover:bg-[#f5f5f5]"
                            >
                                <UserRound size={17} />
                                Register
                            </Link>
                        </>
                    ) : (
                        <Link
                            to={getDashboardPath(user)}
                            onClick={onClose}
                            className="flex min-h-[48px] items-center gap-3 rounded-xl bg-[#f5f7fb] px-3"
                        >
                            <UserAvatar user={user} />

                            <div className="min-w-0">
                                <p className="truncate text-[13px] font-semibold text-[#202020]">
                                    {user?.name}
                                </p>

                                <p className="truncate text-[11px] text-[#777777]">
                                    {user?.email}
                                </p>
                            </div>
                        </Link>
                    )}
                </section>
            </div>
        </div>
    );
};

const MobileAccountPanel = ({ onClose }) => {
    const navigate = useNavigate();

    const [activeTab, setActiveTab] =
        useState("signin");

    const [showPassword, setShowPassword] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const [errors, setErrors] =
        useState({});

    const [generalError, setGeneralError] =
        useState("");

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setErrors((current) => ({
            ...current,
            [name]: null,
        }));

        setGeneralError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setLoading(true);
            setErrors({});
            setGeneralError("");

            const response = await api.post(
                "/auth/login",
                {
                    email: form.email,
                    password: form.password,
                }
            );

            const data = response.data;

            if (data.requires_two_factor) {
                sessionStorage.setItem(
                    "two_factor_challenge",
                    data.challenge_token
                );

                sessionStorage.setItem(
                    "two_factor_email",
                    data.email || form.email
                );

                onClose();

                navigate(
                    "/two-factor-challenge",
                    {
                        replace: true,
                    }
                );

                return;
            }

            if (!data?.token || !data?.user) {
                throw new Error(
                    data?.message ||
                    "Authentication data is missing."
                );
            }

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            api.defaults.headers.common.Authorization =
                `Bearer ${data.token}`;

            await Swal.fire({
                toast: true,
                position: "top-end",
                icon: "success",
                title: "Signed in successfully",
                showConfirmButton: false,
                timer: 1800,
                timerProgressBar: true,
            });

            window.location.replace(
                getDashboardPath(data.user)
            );
        } catch (error) {
            if (error.response?.status === 422) {
                const validationErrors =
                    error.response?.data?.errors || {};

                setErrors(validationErrors);

                setGeneralError(
                    validationErrors.email?.[0] ||
                    error.response?.data?.message ||
                    "Please check your information."
                );

                return;
            }

            setGeneralError(
                error.response?.data?.message ||
                error.message ||
                "Unable to sign in."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        if (tab === "signup") {
            onClose();
            navigate("/register");
            return;
        }

        setActiveTab(tab);
    };

    const handleGoogleLogin = () => {
        const apiBase =
            api.defaults.baseURL || "";

        const backendUrl = apiBase.replace(
            /\/api\/?$/,
            ""
        );

        window.location.href =
            `${backendUrl}/api/auth/google/redirect`;
    };

    return (
        <div className="flex h-full flex-col bg-white font-['Inter']">
            <div className="flex h-[64px] shrink-0 items-center justify-between border-b border-[#eeeeee] px-5">
                <h2 className="text-[15px] font-semibold text-[#222222]">
                    Account
                </h2>

                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close account panel"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e7e7e7] text-[#333333] transition hover:bg-[#f5f5f5]"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-24 pt-4">
                <div className="grid grid-cols-2 rounded-full bg-[#f5f5f5] p-1">
                    <button
                        type="button"
                        onClick={() =>
                            handleTabChange("signin")
                        }
                        className={`h-[38px] rounded-full text-[13px] font-medium transition ${activeTab === "signin"
                            ? "bg-white text-[#222222] shadow-sm"
                            : "text-[#666666]"
                            }`}
                    >
                        Sign in
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            handleTabChange("signup")
                        }
                        className="h-[38px] rounded-full text-[13px] font-medium text-[#555555]"
                    >
                        Sign up
                    </button>
                </div>

                <button
                    type="button"
                    onClick={handleGoogleLogin}
                    className="mt-5 flex h-[40px] w-full items-center justify-center gap-2 rounded-full border border-[#dedede] bg-white text-[13px] font-medium text-[#282828] transition hover:border-[#2065D1]"
                >
                    <GoogleIcon />
                    Continue with Google
                </button>

                <div className="my-5 flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#e5e5e5]" />

                    <span className="text-[9px] font-medium uppercase text-[#888888]">
                        Or continue with
                    </span>

                    <div className="h-px flex-1 bg-[#e5e5e5]" />
                </div>

                {generalError && (
                    <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
                        {generalError}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <MobileFormField
                        label="Email"
                        name="email"
                        type="email"
                        placeholder="name@example.com"
                        value={form.email}
                        error={errors.email?.[0]}
                        onChange={handleChange}
                        icon={<Mail size={15} />}
                    />

                    <div className="mt-4">
                        <label
                            htmlFor="mobile-password"
                            className="mb-2 block text-[12px] font-medium text-[#222222]"
                        >
                            Password
                        </label>

                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]">
                                <LockKeyhole size={15} />
                            </span>

                            <input
                                id="mobile-password"
                                name="password"
                                type={
                                    showPassword
                                        ? "text"
                                        : "password"
                                }
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                className={`h-[40px] w-full rounded-full border bg-white pl-10 pr-11 text-[13px] outline-none transition focus:ring-2 ${errors.password
                                    ? "border-red-400 focus:ring-red-100"
                                    : "border-[#dedede] focus:border-[#2065D1] focus:ring-blue-100"
                                    }`}
                            />

                            <button
                                type="button"
                                onClick={() =>
                                    setShowPassword(
                                        (previous) =>
                                            !previous
                                    )
                                }
                                aria-label="Toggle password visibility"
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888888]"
                            >
                                {showPassword ? (
                                    <EyeOff size={16} />
                                ) : (
                                    <Eye size={16} />
                                )}
                            </button>
                        </div>

                        {errors.password?.[0] && (
                            <p className="mt-1 text-[11px] text-red-500">
                                {errors.password[0]}
                            </p>
                        )}
                    </div>

                    <div className="mt-3 flex justify-end">
                        <Link
                            to="/forgot-password"
                            onClick={onClose}
                            className="text-[12px] font-medium text-[#2065D1]"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="mt-4 flex h-[42px] w-full items-center justify-center rounded-full bg-[#286bd6] text-[13px] font-semibold text-white transition hover:bg-[#1e5dbd] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                        ) : (
                            "Sign in"
                        )}
                    </button>
                </form>

                <p className="mt-7 text-center text-[12px] text-[#777777]">
                    Don&apos;t have an account?{" "}
                    <button
                        type="button"
                        onClick={() =>
                            handleTabChange("signup")
                        }
                        className="font-semibold text-[#2065D1]"
                    >
                        Create account
                    </button>
                </p>
            </div>
        </div>
    );
};

const MobileFormField = ({
    label,
    name,
    type,
    placeholder,
    value,
    error,
    onChange,
    icon,
}) => {
    return (
        <div>
            <label
                htmlFor={`mobile-${name}`}
                className="mb-2 block text-[12px] font-medium text-[#222222]"
            >
                {label}
            </label>

            <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]">
                    {icon}
                </span>

                <input
                    id={`mobile-${name}`}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    autoComplete="email"
                    className={`h-[40px] w-full rounded-full border bg-white pl-10 pr-4 text-[13px] outline-none transition focus:ring-2 ${error
                        ? "border-red-400 focus:ring-red-100"
                        : "border-[#dedede] focus:border-[#2065D1] focus:ring-blue-100"
                        }`}
                />
            </div>

            {error && (
                <p className="mt-1 text-[11px] text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
};

const MobileMenuLink = ({
    to,
    icon: Icon,
    onClick,
    children,
}) => {
    return (
        <Link
            to={to}
            onClick={onClick}
            className="flex min-h-[46px] items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-[#292929] transition hover:bg-[#f5f5f5] hover:text-[#2065D1]"
        >
            <Icon
                size={17}
                strokeWidth={1.7}
                className="text-[#777777]"
            />

            {children}
        </Link>
    );
};

const MobileTextLink = ({
    to,
    onClick,
    children,
}) => {
    return (
        <Link
            to={to}
            onClick={onClick}
            className="block rounded-lg px-3 py-2.5 text-[12px] text-[#555555] transition hover:bg-[#f5f5f5] hover:text-[#2065D1]"
        >
            {children}
        </Link>
    );
};

const CategoryShortcut = ({
    title,
    emoji,
    to,
    onClose,
}) => {
    return (
        <Link
            to={to}
            onClick={onClose}
            className="min-w-0"
        >
            <div className="flex aspect-square items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                {emoji}
            </div>

            <p className="mt-2 truncate text-center text-[10px] font-medium text-[#333333]">
                {title}
            </p>
        </Link>
    );
};

const UserAvatar = ({ user }) => {
    const photo =
        user?.photo_url ||
        user?.profile_photo_url ||
        user?.photo;

    if (photo) {
        return (
            <img
                src={photo}
                alt={user?.name || "User"}
                className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
        );
    }

    return (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff] text-sm font-semibold text-[#2065D1]">
            {user?.name
                ?.charAt(0)
                ?.toUpperCase() || "U"}
        </span>
    );
};

const GoogleIcon = () => {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
        >
            <path
                fill="#4285F4"
                d="M21.35 12.18c0-.69-.06-1.2-.19-1.73H12v3.33h5.38a4.6 4.6 0 0 1-2 3.02l-.02.11 2.91 2.26.2.02c1.84-1.7 2.88-4.2 2.88-7.01Z"
            />
            <path
                fill="#34A853"
                d="M12 21.5c2.63 0 4.84-.87 6.45-2.31l-3.07-2.39c-.82.55-1.91.94-3.38.94a5.87 5.87 0 0 1-5.56-4.05l-.1.01-3.03 2.35-.04.1A9.74 9.74 0 0 0 12 21.5Z"
            />
            <path
                fill="#FBBC05"
                d="M6.44 13.69A6.02 6.02 0 0 1 6.12 12c0-.59.11-1.16.31-1.69l-.01-.11-3.07-2.39-.1.05A9.53 9.53 0 0 0 2.25 12c0 1.49.36 2.89 1.02 4.14l3.17-2.45Z"
            />
            <path
                fill="#EA4335"
                d="M12 6.26c1.83 0 3.06.79 3.77 1.44l2.75-2.69C16.83 3.44 14.63 2.5 12 2.5a9.74 9.74 0 0 0-8.75 5.36l3.18 2.45A5.9 5.9 0 0 1 12 6.26Z"
            />
        </svg>
    );
};

const getStoredUser = () => {
    try {
        const storedUser =
            localStorage.getItem("user") ||
            localStorage.getItem(
                "storyfy_auth_user"
            );

        return storedUser
            ? JSON.parse(storedUser)
            : null;
    } catch {
        return null;
    }
};

const getDashboardPath = (user) => {
    const role =
        user?.role ||
        user?.user_role;

    if (role === "admin") {
        return "/admin/dashboard";
    }

    if (role === "vendor") {
        return "/vendor/dashboard";
    }

    return "/account";
};



const MobileCollectionCard = ({
    collection,
    onClose,
}) => {
    const imageUrl = getCollectionImageUrl(
        collection.image
    );

    return (
        <Link
            to={`/products?collection=${encodeURIComponent(
                collection.slug
            )}`}
            onClick={onClose}
            className="group min-w-0"
        >
            <div className="aspect-[1/1] overflow-hidden rounded-[15px] border border-[#e8e8e8] bg-white shadow-[0_3px_8px_rgba(0,0,0,0.05)]">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={collection.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                    />
                ) : (
                    <CollectionImagePlaceholder />
                )}
            </div>

            <p className="mt-2 line-clamp-2 min-h-[26px] text-[9px] font-medium leading-[13px] text-[#292929]">
                {collection.title}
            </p>
        </Link>
    );
};




const MobileCollectionSkeleton = () => {
    return (
        <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="animate-pulse"
                >
                    <div className="aspect-square rounded-[15px] bg-[#e9e9e9]" />

                    <div className="mt-2 h-[9px] w-4/5 rounded bg-[#e5e5e5]" />

                    <div className="mt-1 h-[9px] w-1/2 rounded bg-[#eeeeee]" />
                </div>
            ))}
        </div>
    );
};



const CollectionImagePlaceholder = () => {
    return (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#edf4ff] to-[#f4edff]">
            <Layers3
                size={25}
                strokeWidth={1.5}
                className="text-[#6957e9]"
            />
        </div>
    );
};


const getCollectionImageUrl = (path) => {
    if (!path) {
        return "";
    }

    if (
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {
        return path;
    }

    const apiBase =
        api.defaults.baseURL || "";

    const backendBase = apiBase.replace(
        /\/api\/?$/,
        ""
    );

    return `${backendBase}/${path.replace(
        /^\/+/,
        ""
    )}`;
};


const MobileCategoryItem = ({
    category,
    onClose,
}) => {
    const imageUrl = getMobileMediaUrl(
        category.image
    );

    return (
        <Link
            to={`/products?category=${encodeURIComponent(
                category.slug
            )}`}
            onClick={onClose}
            className="flex min-h-[40px] items-center gap-3 rounded-[10px] px-3 text-[12px] text-[#3d3d3d] transition hover:bg-white hover:text-[#2065D1]"
        >
            <span className="flex h-[20px] w-[20px] shrink-0 items-center justify-center">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt=""
                        className="h-[18px] w-[18px] object-contain"
                    />
                ) : (
                    <CategoryListIcon />
                )}
            </span>

            <span className="truncate">
                {category.name}
            </span>
        </Link>
    );
};



const CategoryListIcon = () => {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-[#777777]"
        >
            <path d="M4 6.5L12 3L20 6.5L12 10L4 6.5Z" />
            <path d="M4 11L12 14.5L20 11" />
            <path d="M4 15.5L12 19L20 15.5" />
        </svg>
    );
};



const MobileCategoryListSkeleton = () => {
    return (
        <div className="space-y-1 py-2">
            {[1, 2, 3, 4, 5].map((item) => (
                <div
                    key={item}
                    className="flex min-h-[40px] animate-pulse items-center gap-3 px-3"
                >
                    <div className="h-[18px] w-[18px] rounded bg-[#e4e4e4]" />

                    <div className="h-[10px] w-[120px] rounded bg-[#e8e8e8]" />
                </div>
            ))}
        </div>
    );
};


const getMobileMediaUrl = (path) => {
    if (!path) {
        return "";
    }

    if (
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {
        return path;
    }

    const apiBase =
        api.defaults.baseURL || "";

    const backendBase = apiBase.replace(
        /\/api\/?$/,
        ""
    );

    return `${backendBase}/${path.replace(
        /^\/+/,
        ""
    )}`;
};

export default MobileBottomNavigation;