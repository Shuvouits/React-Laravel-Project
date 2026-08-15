import { useState } from "react";
import { NavLink } from "react-router-dom";

import {
    Bell,
    Bot,
    Boxes,
    CreditCard,
    Grid2X2,
    KeyRound,
    Mail,
    MapPin,
    MessageSquareMore,
    Monitor,
    Palette,
    Search,
    Settings2,
    Shield,
    ShoppingBag,
    Store,
} from "lucide-react";

const SettingsSidebar = () => {
    const [search, setSearch] = useState("");

    const menuItems = [
        {
            label: "General Settings",
            icon: Store,
            path: "/admin/settings/general",
        },
        {
            label: "Branding",
            icon: Palette,
            path: "/admin/settings/branding",
        },
        {
            label: "Multi-Vendor Mode",
            icon: Boxes,
            path: "/admin/settings/multi-vendor",
        },
        {
            label: "Point of Sale (POS) Access",
            icon: Monitor,
            path: "/admin/settings/pos",
        },
        {
            label: "Inventory Locations",
            icon: MapPin,
            path: "/admin/settings/inventory-locations",
        },
        {
            label: "Two-Factor Authentication",
            icon: Shield,
            path: "/admin/settings/two-factor",
        },
        {
            label: "OAuth / Social Login",
            icon: KeyRound,
            path: "/admin/settings/social-login",
        },
        {
            label: "AI Configuration",
            icon: Bot,
            path: "/admin/settings/ai",
        },
        {
            label: "Security & Access Control",
            icon: Shield,
            path: "/admin/settings/security",
        },
        {
            label: "Payment Settings",
            icon: CreditCard,
            path: "/admin/settings/payments",
        },
        {
            label: "Email Configuration (SMTP)",
            icon: Mail,
            path: "/admin/settings/email",
        },
        {
            label: "Notification Settings",
            icon: Bell,
            path: "/admin/settings/notifications",
        },
        {
            label: "Omnichannel Messaging",
            icon: MessageSquareMore,
            path: "/admin/settings/messaging",
        },
        {
            label: "Order Settings",
            icon: ShoppingBag,
            path: "/admin/settings/orders",
        },
    ];

    const filteredItems = menuItems.filter((item) => {
        return item.label
            .toLowerCase()
            .includes(search.toLowerCase());
    });

    return (
        <aside className="sticky top-0 flex h-screen w-[310px] shrink-0 flex-col border-x border-[#e2e2e2] bg-white">

            <div className="border-b border-[#e8e8e8] px-[14px] pb-[11px] pt-[13px]">

                <div className="flex items-center gap-[10px]">

                    <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[8px] bg-[#eef3ff] text-[#2065D1]">
                        <Store
                            size={19}
                            strokeWidth={1.8}
                        />
                    </div>

                    <div className="min-w-0">

                        <p className="text-[14px] font-semibold text-[#171717]">
                            Storify
                        </p>

                        <p className="mt-[1px] truncate text-[11px] text-[#777]">
                            https://storify-demo.neurolightstudio.com
                        </p>

                    </div>

                </div>

            </div>

            <div className="px-[12px] pt-[10px]">

                <div className="relative">

                    <Search
                        size={15}
                        strokeWidth={1.7}
                        className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[#888]"
                    />

                    <input
                        type="text"
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                        }}
                        placeholder="Search settings"
                        className="h-[34px] w-full rounded-[10px] border border-[#dedede] bg-[#f8f8f8] pl-[34px] pr-[12px] text-[13px] text-[#333] outline-none transition focus:border-[#b8c9e9] focus:bg-white"
                    />

                </div>

            </div>

            <nav className="min-h-0 flex-1 overflow-y-auto px-[12px] pb-[12px] pt-[8px]">

                <div className="space-y-[2px]">

                    {filteredItems.map((item) => (
                        <SettingsItem
                            key={item.path}
                            item={item}
                        />
                    ))}

                </div>

            </nav>

            <div className="border-t border-[#e8e8e8] px-[14px] py-[9px]">

                <NavLink
                    to="/admin/dashboard"
                    className="mx-auto flex h-[34px] w-fit items-center gap-[7px] rounded-full border border-[#dedede] bg-white px-[14px] text-[12px] font-medium text-[#222] transition hover:bg-[#f6f6f6]"
                >
                    <Grid2X2
                        size={14}
                        strokeWidth={1.7}
                    />

                    Dashboard
                </NavLink>

            </div>

        </aside>
    );
};

const SettingsItem = ({
    item,
}) => {
    const Icon = item.icon;

    return (
        <NavLink
            to={item.path}
            className={({ isActive }) => {
                return `flex h-[36px] items-center gap-[10px] rounded-[9px] px-[10px] text-[13px] transition ${
                    isActive
                        ? "bg-[#e7effd] font-semibold text-[#2065D1]"
                        : "text-[#333] hover:bg-[#f5f5f5]"
                }`;
            }}
        >
            <Icon
                size={16}
                strokeWidth={1.7}
            />

            <span>
                {item.label}
            </span>

        </NavLink>
    );
};

export default SettingsSidebar;