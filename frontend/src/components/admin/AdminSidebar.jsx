import {
    useEffect,
    useState,
} from "react";

import {
    NavLink,
    useLocation,
} from "react-router-dom";

import {
    LayoutGrid,
    BarChart3,
    ClipboardList,
    Box,
    Sparkles,
    Bot,
    Users,
    Store,
    UserCog,
    WalletCards,
    Percent,
    FileText,
    MessageSquare,
    ShoppingBag,
    Monitor,
    Settings,
    ChevronDown,
    ChevronRight,
} from "lucide-react";

const orderItems = [
    {
        to: "/admin/orders",
        label: "All Orders",
        end: true,
    },
    {
        to: "/admin/orders/pre-orders",
        label: "Pre-orders",
    },
    {
        to: "/admin/orders/returns",
        label: "Returns",
    },
];

const productItems = [
    {
        to: "/admin/products",
        label: "All Products",
        end: true,
    },
    {
        to: "/admin/products/global-variants",
        label: "Global Variants",
    },
    {
        to: "/admin/products/collections",
        label: "Collections",
    },
    {
        to: "/admin/products/categories",
        label: "Categories",
    },
    {
        to: "/admin/products/brands",
        label: "Brands",
    },
    {
        to: "/admin/products/inventory",
        label: "Inventory",
        end: true,
    },
    {
        to: "/admin/products/inventory/locations",
        label: "Location",
    },
    {
        to: "/admin/products/transfers",
        label: "Transfers",
    },
    {
        to: "/admin/products/reviews",
        label: "Reviews",
    },
];

const vendorItems = [
    {
        to: "/admin/vendors",
        label: "Vendors",
        end: true,
    },
    {
        to: "/admin/vendors/plans",
        label: "Vendor Plans",
    },
    {
        to: "/admin/vendors/configuration",
        label: "Configuration",
    },
    {
        to: "/admin/vendors/onboarding-flow",
        label: "Onboarding Flow",
    },
];

const onlineStoreItems = [
    {
        to: "/admin/online-store/themes",
        label: "Themes",
    },
    {
        to: "/admin/online-store/home-page",
        label: "Home",
    },
    {
        to: "/admin/online-store/pages",
        label: "Pages",
    },
    {
        to: "/admin/online-store/menus",
        label: "Menus",
    },
];

const AdminSidebar = () => {
    const location = useLocation();

    const isOrdersRoute =
        location.pathname.startsWith(
            "/admin/orders"
        );

    const isProductsRoute =
        location.pathname.startsWith(
            "/admin/products"
        );

    const isVendorsRoute =
        location.pathname.startsWith(
            "/admin/vendors"
        );

    const isOnlineStoreRoute =
        location.pathname.startsWith(
            "/admin/online-store"
        );

    const [ordersOpen, setOrdersOpen] =
        useState(isOrdersRoute);

    const [productsOpen, setProductsOpen] =
        useState(isProductsRoute);

    const [vendorsOpen, setVendorsOpen] =
        useState(isVendorsRoute);

    const [onlineStoreOpen, setOnlineStoreOpen] =
        useState(isOnlineStoreRoute);

    useEffect(() => {
        if (isOrdersRoute) {
            setOrdersOpen(true);
        }
    }, [isOrdersRoute]);

    useEffect(() => {
        if (isProductsRoute) {
            setProductsOpen(true);
        }
    }, [isProductsRoute]);

    useEffect(() => {
        if (isVendorsRoute) {
            setVendorsOpen(true);
        }
    }, [isVendorsRoute]);

    useEffect(() => {
        if (isOnlineStoreRoute) {
            setOnlineStoreOpen(true);
        }
    }, [isOnlineStoreRoute]);

    const navItemClass = ({
        isActive,
    }) => {
        const base =
            "flex min-h-[42px] items-center gap-[11px] rounded-[10px] px-[14px] text-[14px] font-medium transition-all duration-150";

        if (isActive) {
            return `${base} bg-[#edf3ff] text-[#2065D1]`;
        }

        return `${base} text-[#4d5562] hover:bg-[#f5f6f8] hover:text-[#111827]`;
    };

    const subMenuClass = ({
        isActive,
    }) => {
        const base =
            "relative flex min-h-[35px] items-center rounded-[9px] px-[12px] text-[13px] font-medium transition-all duration-150";

        if (isActive) {
            return `${base} bg-[#eeeeef] text-[#222]`;
        }

        return `${base} text-[#74777d] hover:bg-[#f5f5f6] hover:text-[#222]`;
    };

    return (
        <aside className="sticky top-0 flex h-screen w-[230px] min-w-[230px] flex-col border-r border-[#e7e8eb] bg-white font-['Inter']">
            <SidebarLogo />

            <div className="scrollbar-thin scrollbar-thumb-[#b6b7ba] scrollbar-track-transparent flex-1 overflow-y-auto px-[12px] py-[14px]">
                <nav className="space-y-[3px]">
                    <SidebarNavItem
                        to="/admin/dashboard"
                        icon={LayoutGrid}
                        label="Overview"
                        className={navItemClass}
                    />

                    <SidebarNavItem
                        to="/admin/analytics"
                        icon={BarChart3}
                        label="Analytics"
                        className={navItemClass}
                    />

                    <SidebarDropdown
                        label="Orders"
                        icon={ClipboardList}
                        open={ordersOpen}
                        active={isOrdersRoute}
                        onToggle={() => {
                            setOrdersOpen(
                                !ordersOpen
                            );
                        }}
                        items={orderItems}
                        subMenuClass={
                            subMenuClass
                        }
                        activeClass="bg-[#edf3ff] text-[#2065D1]"
                    />

                    <SidebarDropdown
                        label="Products"
                        icon={Box}
                        open={productsOpen}
                        active={
                            isProductsRoute
                        }
                        onToggle={() => {
                            setProductsOpen(
                                !productsOpen
                            );
                        }}
                        items={productItems}
                        subMenuClass={
                            subMenuClass
                        }
                        activeClass="bg-[#f5f5f5] text-[#111]"
                    />

                    <SidebarNavItem
                        to="/admin/ai-studio"
                        icon={Sparkles}
                        label="AI Studio"
                        className={
                            navItemClass
                        }
                    />

                    <SidebarNavItem
                        to="/admin/sales-agent"
                        icon={Bot}
                        label="Sales Agent"
                        className={
                            navItemClass
                        }
                    />

                    <SidebarNavItem
                        to="/admin/customers"
                        icon={Users}
                        label="Customers"
                        className={
                            navItemClass
                        }
                    />

                    <SidebarDropdown
                        label="Vendors"
                        icon={Store}
                        open={vendorsOpen}
                        active={
                            isVendorsRoute
                        }
                        onToggle={() => {
                            setVendorsOpen(
                                !vendorsOpen
                            );
                        }}
                        items={vendorItems}
                        subMenuClass={
                            subMenuClass
                        }
                        activeClass="bg-[#eaf1ff] text-[#2065D1]"
                    />

                    <SidebarNavItem
                        to="/admin/staff"
                        icon={UserCog}
                        label="Staff"
                        className={
                            navItemClass
                        }
                    />

                    <SidebarNavItem
                        to="/admin/payments"
                        icon={WalletCards}
                        label="Payments"
                        className={
                            navItemClass
                        }
                        arrow
                    />

                    <SidebarNavItem
                        to="/admin/discounts"
                        icon={Percent}
                        label="Discounts"
                        className={
                            navItemClass
                        }
                    />

                    <SidebarNavItem
                        to="/admin/content"
                        icon={FileText}
                        label="Content"
                        className={
                            navItemClass
                        }
                        arrow
                    />

                    <SidebarNavItem
                        to="/admin/inbox"
                        icon={MessageSquare}
                        label="Inbox"
                        className={
                            navItemClass
                        }
                    />
                </nav>

                <div className="mb-[8px] mt-[28px] px-[10px] text-[10px] font-semibold tracking-[0.12em] text-[#a1a4aa]">
                    SALES CHANNELS
                </div>

                <SidebarDropdown
                    label="Online Store"
                    icon={ShoppingBag}
                    open={
                        onlineStoreOpen
                    }
                    active={
                        isOnlineStoreRoute
                    }
                    onToggle={() => {
                        setOnlineStoreOpen(
                            !onlineStoreOpen
                        );
                    }}
                    items={
                        onlineStoreItems
                    }
                    subMenuClass={
                        subMenuClass
                    }
                    activeClass="bg-[#eaf1ff] text-[#2065D1]"
                />

                <SidebarNavItem
                    to="/admin/point-of-sale"
                    icon={Monitor}
                    label="Point of Sale"
                    className={
                        navItemClass
                    }
                />
            </div>

            <div className="shrink-0 border-t border-[#eeeeef] bg-white px-[12px] py-[12px]">
                <NavLink
                    to="/admin/settings/general"
                    className="flex items-center gap-[12px] rounded-[9px] px-[14px] py-[11px] text-[14px] font-medium text-[#4b5563] transition hover:bg-[#f3f4f6]"
                >
                    <Settings
                        size={18}
                    />

                    <span>
                        Settings
                    </span>
                </NavLink>
            </div>
        </aside>
    );
};

const SidebarLogo = () => {
    return (
        <div className="flex h-[74px] shrink-0 items-center border-b border-[#eeeeef] px-[20px]">
            <NavLink
                to="/admin/dashboard"
                className="flex items-center gap-[9px]"
            >
                <div className="flex h-[33px] w-[29px] items-center justify-center rounded-[7px] border-2 border-[#4d83ed] text-[17px] font-semibold text-[#2065D1]">
                    S
                </div>

                <span className="text-[21px] font-bold tracking-[-0.7px] text-[#2065D1]">
                    Storify
                </span>
            </NavLink>
        </div>
    );
};

const SidebarNavItem = ({
    to,
    icon: Icon,
    label,
    className,
    arrow = false,
}) => {
    return (
        <NavLink
            to={to}
            className={className}
        >
            <Icon size={18} />

            <span className="flex-1">
                {label}
            </span>

            {arrow && (
                <ChevronRight
                    size={16}
                />
            )}
        </NavLink>
    );
};

const SidebarDropdown = ({
    label,
    icon: Icon,
    open,
    active,
    onToggle,
    items,
    subMenuClass,
    activeClass,
}) => {
    return (
        <div>
            <button
                type="button"
                onClick={onToggle}
                className={`flex min-h-[42px] w-full items-center gap-[11px] rounded-[10px] px-[14px] text-[14px] font-medium transition-all duration-150 ${
                    active
                        ? activeClass
                        : "text-[#4d5562] hover:bg-[#f5f6f8] hover:text-[#111827]"
                }`}
            >
                <Icon size={18} />

                <span className="flex-1 text-left">
                    {label}
                </span>

                <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${
                        open
                            ? "rotate-0"
                            : "-rotate-90"
                    }`}
                />
            </button>

            <div
                className={`grid transition-all duration-200 ease-in-out ${
                    open
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                }`}
            >
                <div className="overflow-hidden">
                    <div className="relative ml-[31px] mt-[5px] space-y-[1px] border-l border-[#dedfe2] pb-[4px] pl-[12px]">
                        {items.map(
                            (item) => (
                                <SidebarSubItem
                                    key={
                                        item.to
                                    }
                                    to={
                                        item.to
                                    }
                                    label={
                                        item.label
                                    }
                                    end={
                                        item.end
                                    }
                                    className={
                                        subMenuClass
                                    }
                                />
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

const SidebarSubItem = ({
    to,
    label,
    className,
    end = false,
}) => {
    return (
        <NavLink
            to={to}
            end={end}
            className={className}
        >
            {label}
        </NavLink>
    );
};

export default AdminSidebar;