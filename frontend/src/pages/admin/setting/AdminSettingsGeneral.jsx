import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Bell,
    Bot,
    Building2,
    Globe,
    House,
    Laptop,
    Lock,
    Mail,
    MapPin,
    Monitor,
    Shield,
    Store,
    Tv,
    UserCog,
    Wallet,
    Wand2,
    X,
} from "lucide-react";

const AdminSettingsGeneral = () => {
    const navigate = useNavigate();

    const menuItems = useMemo(() => {
        return [
            {
                label: "General Settings",
                icon: House,
                to: "/admin/settings/general",
                active: true,
            },
            {
                label: "Branding",
                icon: Wand2,
                to: "#",
            },
            {
                label: "Multi-Vendor Mode",
                icon: Store,
                to: "#",
            },
            {
                label: "Point of Sale (POS) Access",
                icon: Monitor,
                to: "#",
            },
            {
                label: "Inventory Locations",
                icon: MapPin,
                to: "#",
            },
            {
                label: "Two-Factor Authentication",
                icon: Lock,
                to: "#",
            },
            {
                label: "OAuth / Social Login",
                icon: UserCog,
                to: "#",
            },
            {
                label: "AI Configuration",
                icon: Bot,
                to: "#",
            },
            {
                label: "Security & Access Control",
                icon: Shield,
                to: "#",
            },
            {
                label: "Payment Settings",
                icon: Wallet,
                to: "#",
            },
            {
                label: "Email Configuration (SMTP)",
                icon: Mail,
                to: "#",
            },
            {
                label: "Notification Settings",
                icon: Bell,
                to: "#",
            },
            {
                label: "Omnichannel Messaging",
                icon: Tv,
                to: "#",
            },
            {
                label: "Order Settings",
                icon: Building2,
                to: "#",
            },
        ];
    }, []);

    const [form, setForm] = useState({
        store_name: "Storify",
        store_email: "store@example.com",
        phone: "+17759865200",
        store_domain: "https://storify-demo.neurolightstudio.com",
        store_description:
            "Storify is a modern self-hosted eCommerce platform built with Next.js for online stores, retail POS businesses, and multi-vendor marketplaces",
        address: "Main street, New York, 1000",
        timezone: "UTC-05:00 Eastern Time",
        language: "English",
        currency: "USD",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((previous) => {
            return {
                ...previous,
                [name]: value,
            };
        });
    };

    const handleClose = () => {
        navigate("/admin/dashboard");
    };

    const handleSave = () => {
        // static version
        console.log("Static settings save:", form);
    };

    return (
        <div className="fixed inset-0 z-[9999] bg-black/20 p-[18px]">
            <div className="relative flex h-full w-full overflow-hidden rounded-[22px] bg-white shadow-[0_20px_80px_rgba(0,0,0,0.18)]">

                {/* Left settings sidebar */}
                <div className="flex w-[320px] shrink-0 flex-col border-r border-[#e7e7e7] bg-[#fbfbfb]">
                    <div className="border-b border-[#ececec] px-[18px] py-[16px]">
                        <div className="flex items-center gap-[12px]">
                            <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#eef3ff]">
                                <img
                                    src="/favicon.ico"
                                    alt="Storify"
                                    className="h-[28px] w-[28px] object-contain"
                                />
                            </div>

                            <div className="min-w-0">
                                <p className="truncate text-[18px] font-semibold text-[#171717]">
                                    Storify
                                </p>

                                <p className="truncate text-[13px] text-[#777]">
                                    https://storify-demo.neurolightstudio.com
                                </p>
                            </div>
                        </div>

                        <div className="mt-[14px]">
                            <input
                                type="text"
                                placeholder="Search settings"
                                className="h-[44px] w-full rounded-[14px] border border-[#e2e2e2] bg-white px-[16px] text-[14px] text-[#333] outline-none focus:border-[#2065D1]"
                            />
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto px-[14px] py-[14px]">
                        <nav className="space-y-[5px]">
                            {menuItems.map((item) => (
                                <SettingsNavItem
                                    key={item.label}
                                    item={item}
                                />
                            ))}
                        </nav>
                    </div>

                    <div className="border-t border-[#ececec] px-[18px] py-[16px]">
                        <Link
                            to="/admin/dashboard"
                            className="flex h-[42px] items-center justify-center rounded-full border border-[#dcdcdc] bg-white text-[14px] font-medium text-[#171717] transition hover:bg-[#f6f6f6]"
                        >
                            Dashboard
                        </Link>
                    </div>
                </div>

                {/* Right content */}
                <div className="min-w-0 flex-1 bg-[#f8f9fb]">
                    <div className="flex h-full flex-col">

                        {/* Top bar */}
                        <div className="flex items-center justify-end border-b border-[#ebebeb] bg-[#f8f9fb] px-[22px] py-[18px]">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#dfdfdf] bg-white text-[#666] transition hover:bg-[#f3f3f3]"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Scrollable content */}
                        <div className="min-h-0 flex-1 overflow-y-auto px-[22px] py-[18px]">

                            <DemoBanner />

                            <PageHeader />

                            <SectionCard
                                icon={Store}
                                title="Store Information"
                                subtitle="Basic details about your store"
                            >
                                <div className="grid grid-cols-1 gap-[14px] xl:grid-cols-3">
                                    <InputField
                                        label="Store Name"
                                        name="store_name"
                                        value={form.store_name}
                                        onChange={handleChange}
                                    />

                                    <InputField
                                        label="Store Email"
                                        name="store_email"
                                        value={form.store_email}
                                        onChange={handleChange}
                                    />

                                    <InputField
                                        label="Phone Number"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="mt-[16px]">
                                    <InputField
                                        label="Store Domain"
                                        name="store_domain"
                                        value={form.store_domain}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="mt-[16px]">
                                    <TextAreaField
                                        label="Store Description"
                                        name="store_description"
                                        value={form.store_description}
                                        onChange={handleChange}
                                        rows={3}
                                    />
                                </div>

                                <div className="mt-[16px]">
                                    <TextAreaField
                                        label="Address"
                                        name="address"
                                        value={form.address}
                                        onChange={handleChange}
                                        rows={2}
                                    />
                                </div>
                            </SectionCard>

                            <div className="mt-[22px]">
                                <SectionCard
                                    icon={Globe}
                                    title="Regional Defaults"
                                    subtitle="Timezone, language, and currency preferences"
                                >
                                    <div className="grid grid-cols-1 gap-[14px] xl:grid-cols-3">
                                        <SelectField
                                            label="Timezone"
                                            name="timezone"
                                            value={form.timezone}
                                            onChange={handleChange}
                                            options={[
                                                "UTC-05:00 Eastern Time",
                                                "UTC+00:00 UTC",
                                                "UTC+06:00 Dhaka",
                                            ]}
                                        />

                                        <SelectField
                                            label="Language"
                                            name="language"
                                            value={form.language}
                                            onChange={handleChange}
                                            options={[
                                                "English",
                                                "Bangla",
                                                "Spanish",
                                            ]}
                                        />

                                        <SelectField
                                            label="Currency"
                                            name="currency"
                                            value={form.currency}
                                            onChange={handleChange}
                                            options={[
                                                "USD",
                                                "BDT",
                                                "EUR",
                                            ]}
                                        />
                                    </div>
                                </SectionCard>
                            </div>

                        </div>

                        {/* Sticky footer */}
                        <div className="border-t border-[#ebebeb] bg-white px-[22px] py-[16px]">
                            <div className="flex items-center justify-end">
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    className="flex h-[46px] items-center justify-center rounded-[14px] bg-[#8db6ff] px-[20px] text-[15px] font-semibold text-white transition hover:bg-[#77a7ff]"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

            </div>
        </div>
    );
};

const DemoBanner = () => {
    return (
        <div className="rounded-[18px] border border-[#efcf83] bg-[#fff8e8] px-[18px] py-[15px]">
            <p className="text-[15px] font-semibold text-[#9b5b00]">
                Demo mode
            </p>

            <p className="mt-[6px] text-[14px] leading-[22px] text-[#a26108]">
                Demo mode is enabled. Deletes, settings edits, and test actions are disabled
                on this demo site — everything else, including creating products and uploading
                images, works normally.
            </p>
        </div>
    );
};

const PageHeader = () => {
    return (
        <div className="mt-[16px] rounded-[20px] border border-[#ececec] bg-white px-[24px] py-[22px]">
            <h1 className="text-[32px] font-semibold tracking-[-0.6px] text-[#171717]">
                General Settings
            </h1>

            <p className="mt-[6px] text-[16px] text-[#777]">
                Configure your store&apos;s basic information
            </p>
        </div>
    );
};

const SectionCard = ({
    icon: Icon,
    title,
    subtitle,
    children,
}) => {
    return (
        <div className="rounded-[22px] border border-[#ececec] bg-white">
            <div className="flex items-start gap-[14px] border-b border-[#f0f0f0] px-[24px] py-[18px]">
                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#eef3ff] text-[#2065D1]">
                    <Icon size={18} />
                </div>

                <div>
                    <h2 className="text-[15px] font-semibold text-[#171717]">
                        {title}
                    </h2>

                    <p className="mt-[2px] text-[14px] text-[#777]">
                        {subtitle}
                    </p>
                </div>
            </div>

            <div className="px-[24px] py-[20px]">
                {children}
            </div>
        </div>
    );
};

const InputField = ({
    label,
    name,
    value,
    onChange,
}) => {
    return (
        <div>
            <label className="mb-[8px] block text-[14px] font-medium text-[#333]">
                {label}
            </label>

            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                className="h-[48px] w-full rounded-[14px] border border-[#e2e2e2] bg-white px-[14px] text-[14px] text-[#222] outline-none focus:border-[#2065D1]"
            />
        </div>
    );
};

const TextAreaField = ({
    label,
    name,
    value,
    onChange,
    rows = 3,
}) => {
    return (
        <div>
            <label className="mb-[8px] block text-[14px] font-medium text-[#333]">
                {label}
            </label>

            <textarea
                name={name}
                rows={rows}
                value={value}
                onChange={onChange}
                className="w-full rounded-[14px] border border-[#e2e2e2] bg-white px-[14px] py-[12px] text-[14px] leading-[22px] text-[#222] outline-none focus:border-[#2065D1]"
            />
        </div>
    );
};

const SelectField = ({
    label,
    name,
    value,
    onChange,
    options,
}) => {
    return (
        <div>
            <label className="mb-[8px] block text-[14px] font-medium text-[#333]">
                {label}
            </label>

            <select
                name={name}
                value={value}
                onChange={onChange}
                className="h-[48px] w-full rounded-[14px] border border-[#e2e2e2] bg-white px-[14px] text-[14px] text-[#222] outline-none focus:border-[#2065D1]"
            >
                {options.map((option) => (
                    <option
                        key={option}
                        value={option}
                    >
                        {option}
                    </option>
                ))}
            </select>
        </div>
    );
};

const SettingsNavItem = ({
    item,
}) => {
    const Icon = item.icon;

    if (item.to === "#") {
        return (
            <button
                type="button"
                className={`flex h-[44px] w-full items-center gap-[12px] rounded-[14px] px-[12px] text-left text-[15px] transition ${
                    item.active
                        ? "bg-[#e9f0ff] font-medium text-[#2065D1]"
                        : "text-[#333] hover:bg-[#f0f2f5]"
                }`}
            >
                <Icon size={18} />
                <span>{item.label}</span>
            </button>
        );
    }

    return (
        <Link
            to={item.to}
            className={`flex h-[44px] w-full items-center gap-[12px] rounded-[14px] px-[12px] text-[15px] transition ${
                item.active
                    ? "bg-[#e9f0ff] font-medium text-[#2065D1]"
                    : "text-[#333] hover:bg-[#f0f2f5]"
            }`}
        >
            <Icon size={18} />
            <span>{item.label}</span>
        </Link>
    );
};

export default AdminSettingsGeneral;