import { useEffect, useState } from "react";

import {
    BadgePercent,
    ChevronDown,
    ChevronRight,
    CreditCard,
    LayoutDashboard,
    MessageSquare,
    Package,
    ReceiptText,
    Settings,
    ShoppingCart,
    Store,
    Users,
    WalletCards,
} from "lucide-react";

import {
    NavLink,
    useLocation,
} from "react-router-dom";

const productMenu = [
    {
        label: "All Products",
        to: "/vendor/products",
    },
    {
        label: "Inventory",
        to: "/vendor/products/inventory",
    },
    {
        label: "Locations",
        to: "/vendor/products/locations",
    },
    {
        label: "Brands",
        to: "/vendor/products/brands",
    },
];

const menuItems = [
    {
        label: "Dashboard",
        to: "/vendor/dashboard",
        icon: LayoutDashboard,
    },
    {
        label: "Orders",
        to: "/vendor/orders",
        icon: ShoppingCart,
        hasArrow: true,
    },
    {
        label: "Finances",
        to: "/vendor/finances",
        icon: WalletCards,
        hasArrow: true,
    },
    {
        label: "Inbox",
        to: "/vendor/inbox",
        icon: MessageSquare,
    },
    {
        label: "Discounts",
        to: "/vendor/discounts",
        icon: BadgePercent,
    },
    {
        label: "Plan & billing",
        to: "/vendor/plan-billing",
        icon: CreditCard,
    },
    {
        label: "Staff",
        to: "/vendor/staff",
        icon: Users,
    },
    {
        label: "Point of Sale",
        to: "/vendor/pos",
        icon: ReceiptText,
    },
];

const VendorSidebar = () => {
    const location = useLocation();

    const productRouteActive =
        location.pathname === "/vendor/products" ||
        location.pathname.startsWith("/vendor/products/");

    const [productsOpen, setProductsOpen] =
        useState(true);

    useEffect(() => {
        if (productRouteActive) {
            setProductsOpen(true);
        }
    }, [productRouteActive]);

    return (
        <aside className="sticky top-0 flex h-screen w-[246px] shrink-0 flex-col border-r border-[#e8e8ee] bg-white">
            <div className="flex h-[74px] items-center border-b border-[#eeeeee] px-7">
                <div className="flex items-center gap-2">
                    <div className="flex h-[31px] w-[31px] items-center justify-center rounded-[8px] bg-[#2563eb] text-white">
                        <Store
                            size={18}
                            strokeWidth={2}
                        />
                    </div>

                    <span className="text-[21px] font-bold tracking-[-0.03em] text-[#2563eb]">
                        Storify
                    </span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                <nav className="space-y-1">
                    <SidebarLink
                        label="Dashboard"
                        to="/vendor/dashboard"
                        icon={LayoutDashboard}
                        location={location}
                    />

                    <div>
                        <button
                            type="button"
                            onClick={() =>
                                setProductsOpen(
                                    (prev) => !prev
                                )
                            }
                            className={`flex h-[42px] w-full items-center justify-between rounded-[12px] px-3 text-[14px] transition ${
                                productRouteActive
                                    ? "bg-[#f5f7fb] font-medium text-[#2563eb]"
                                    : "text-[#292929] hover:bg-[#f8f8fa]"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Package
                                    size={18}
                                    strokeWidth={1.7}
                                />

                                <span>
                                    Products
                                </span>
                            </div>

                            <ChevronDown
                                size={17}
                                strokeWidth={1.8}
                                className={`transition-transform duration-200 ${
                                    productsOpen
                                        ? "rotate-0"
                                        : "-rotate-90"
                                }`}
                            />
                        </button>

                        {productsOpen && (
                            <div className="ml-[21px] mt-1">
                                {productMenu.map(
                                    (item) => {
                                        const childActive =
                                            item.to ===
                                            "/vendor/products"
                                                ? location.pathname ===
                                                  item.to
                                                : location.pathname ===
                                                      item.to ||
                                                  location.pathname.startsWith(
                                                      `${item.to}/`
                                                  );

                                        return (
                                            <div
                                                key={
                                                    item.to
                                                }
                                                className="relative border-l border-[#dfe2e8] pl-[16px]"
                                            >
                                                <span className="absolute left-0 top-1/2 h-px w-[12px] bg-[#dfe2e8]" />

                                                <NavLink
                                                    to={
                                                        item.to
                                                    }
                                                    className={`flex min-h-[36px] items-center rounded-[10px] px-2 text-[13px] transition ${
                                                        childActive
                                                            ? "bg-[#f1f1f2] font-semibold text-[#202020]"
                                                            : "text-[#696969] hover:bg-[#f7f7f8] hover:text-[#222222]"
                                                    }`}
                                                >
                                                    {
                                                        item.label
                                                    }
                                                </NavLink>
                                            </div>
                                        );
                                    }
                                )}
                            </div>
                        )}
                    </div>

                    {menuItems
                        .filter(
                            (item) =>
                                item.label !==
                                "Dashboard"
                        )
                        .map((item) => (
                            <SidebarLink
                                key={item.to}
                                label={
                                    item.label
                                }
                                to={item.to}
                                icon={item.icon}
                                hasArrow={
                                    item.hasArrow
                                }
                                location={
                                    location
                                }
                            />
                        ))}
                </nav>
            </div>

            <div className="border-t border-[#eeeeee] p-4">
                <NavLink
                    to="/vendor/settings"
                    className={({ isActive }) =>
                        `flex h-[42px] items-center gap-3 rounded-[12px] px-3 text-[14px] transition ${
                            isActive
                                ? "bg-[#f5f7fb] font-medium text-[#2563eb]"
                                : "text-[#4d4d4d] hover:bg-[#f8f8fa] hover:text-[#222222]"
                        }`
                    }
                >
                    <Settings
                        size={18}
                        strokeWidth={1.7}
                    />

                    <span>
                        Settings
                    </span>
                </NavLink>
            </div>
        </aside>
    );
};

const SidebarLink = ({
    label,
    to,
    icon: Icon,
    hasArrow = false,
    location,
}) => {
    const active =
        location.pathname === to ||
        location.pathname.startsWith(
            `${to}/`
        );

    return (
        <NavLink
            to={to}
            className={`flex h-[42px] items-center justify-between rounded-[12px] px-3 text-[14px] transition ${
                active
                    ? "bg-[#f5f7fb] font-medium text-[#2563eb]"
                    : "text-[#4d4d4d] hover:bg-[#f8f8fa] hover:text-[#222222]"
            }`}
        >
            <div className="flex items-center gap-3">
                <Icon
                    size={18}
                    strokeWidth={1.7}
                />

                <span>
                    {label}
                </span>
            </div>

            {hasArrow && (
                <ChevronRight
                    size={17}
                    strokeWidth={1.7}
                    className="text-[#888888]"
                />
            )}
        </NavLink>
    );
};

export default VendorSidebar;