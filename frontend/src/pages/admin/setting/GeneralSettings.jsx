import { useState } from "react";

import {
    Globe2,
    LockKeyhole,
    Save,
    Store,
} from "lucide-react";

const GeneralSettings = () => {
    const [form, setForm] = useState({
        store_name: "Storify",
        store_email: "store@example.com",
        phone: "+17759865200",
        store_domain: "https://storify-demo.neurolightstudio.com",
        store_description:
            "Storify is a modern self-hosted eCommerce platform built with Next.js for online stores, retail POS businesses, and multi-vendor marketplaces.",
        address: "Main street, New York, 1000",
        timezone: "America/New_York",
        language: "English",
        currency: "USD",
    });

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm((current) => {
            return {
                ...current,
                [name]: value,
            };
        });
    };

    const handleSave = () => {
        console.log(
            "Static settings:",
            form
        );
    };

    return (
        <div className="w-full">

            <DemoNotice />

            <div className="mt-[15px] rounded-[14px] border border-[#e2e2e2] bg-white px-[22px] py-[18px]">

                <h1 className="text-[17px] font-semibold text-[#333]">
                    General Settings
                </h1>

                <p className="mt-[3px] text-[13px] text-[#999]">
                    Configure your store&apos;s basic information
                </p>

            </div>

            <div className="mt-[20px]">

                <SettingsCard
                    icon={Store}
                    title="Store Information"
                    description="Basic details about your store"
                >

                    <div className="grid grid-cols-1 gap-[15px] lg:grid-cols-3">

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

                    <div className="mt-[15px]">

                        <InputField
                            label="Store Domain"
                            name="store_domain"
                            value={form.store_domain}
                            onChange={handleChange}
                        />

                    </div>

                    <div className="mt-[15px]">

                        <TextAreaField
                            label="Store Description"
                            name="store_description"
                            value={form.store_description}
                            onChange={handleChange}
                            rows={2}
                        />

                    </div>

                    <div className="mt-[15px]">

                        <TextAreaField
                            label="Address"
                            name="address"
                            value={form.address}
                            onChange={handleChange}
                            rows={2}
                        />

                    </div>

                </SettingsCard>

            </div>

            <div className="mt-[20px]">

                <SettingsCard
                    icon={Globe2}
                    title="Regional Defaults"
                    description="Timezone, language, and currency preferences"
                    action={
                        <button
                            type="button"
                            onClick={handleSave}
                            className="flex h-[36px] items-center gap-[7px] rounded-[11px] bg-[#9fc0f4] px-[15px] text-[13px] font-semibold text-white transition hover:bg-[#88afea]"
                        >
                            <Save
                                size={14}
                                strokeWidth={1.8}
                            />

                            Save Changes
                        </button>
                    }
                >

                    <div className="grid grid-cols-1 gap-[15px] lg:grid-cols-3">

                        <SelectField
                            label="Timezone"
                            name="timezone"
                            value={form.timezone}
                            onChange={handleChange}
                            options={[
                                {
                                    value: "America/New_York",
                                    label: "Eastern Time",
                                },
                                {
                                    value: "UTC",
                                    label: "UTC",
                                },
                                {
                                    value: "Asia/Dhaka",
                                    label: "Dhaka",
                                },
                            ]}
                        />

                        <SelectField
                            label="Language"
                            name="language"
                            value={form.language}
                            onChange={handleChange}
                            options={[
                                {
                                    value: "English",
                                    label: "English",
                                },
                                {
                                    value: "Bangla",
                                    label: "Bangla",
                                },
                            ]}
                        />

                        <SelectField
                            label="Currency"
                            name="currency"
                            value={form.currency}
                            onChange={handleChange}
                            options={[
                                {
                                    value: "USD",
                                    label: "USD",
                                },
                                {
                                    value: "BDT",
                                    label: "BDT",
                                },
                                {
                                    value: "EUR",
                                    label: "EUR",
                                },
                            ]}
                        />

                    </div>

                </SettingsCard>

            </div>

        </div>
    );
};

const DemoNotice = () => {
    return (
        <div className="flex items-start gap-[11px] rounded-[14px] border border-[#edc861] bg-[#fff9e7] px-[16px] py-[12px]">

            <LockKeyhole
                size={16}
                strokeWidth={1.8}
                className="mt-[1px] shrink-0 text-[#a65d00]"
            />

            <div>

                <p className="text-[13px] font-semibold text-[#995300]">
                    Demo mode
                </p>

                <p className="mt-[2px] text-[12px] leading-[18px] text-[#a65d00]">
                    Demo mode is enabled. Deletes, settings edits, and test actions are disabled on this demo site — everything else, including creating products and uploading images, works normally.
                </p>

            </div>

        </div>
    );
};

const SettingsCard = ({
    icon: Icon,
    title,
    description,
    action,
    children,
}) => {
    return (
        <section className="overflow-hidden rounded-[14px] border border-[#e2e2e2] bg-white">

            <div className="flex min-h-[66px] items-center justify-between gap-[20px] border-b border-[#e8e8e8] px-[22px]">

                <div className="flex items-center gap-[11px]">

                    <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#edf3ff] text-[#4b83e6]">
                        <Icon
                            size={16}
                            strokeWidth={1.8}
                        />
                    </div>

                    <div>

                        <h2 className="text-[14px] font-semibold text-[#555]">
                            {title}
                        </h2>

                        <p className="mt-[1px] text-[12px] text-[#aaa]">
                            {description}
                        </p>

                    </div>

                </div>

                {action}

            </div>

            <div className="px-[22px] pb-[20px] pt-[16px]">
                {children}
            </div>

        </section>
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

            <label className="mb-[6px] block text-[12px] font-medium text-[#555]">
                {label}
            </label>

            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                className="h-[36px] w-full rounded-[10px] border border-[#e3e3e3] bg-white px-[11px] text-[12px] text-[#555] outline-none transition focus:border-[#9db9e6]"
            />

        </div>
    );
};

const TextAreaField = ({
    label,
    name,
    value,
    onChange,
    rows,
}) => {
    return (
        <div>

            <label className="mb-[6px] block text-[12px] font-medium text-[#555]">
                {label}
            </label>

            <textarea
                name={name}
                value={value}
                rows={rows}
                onChange={onChange}
                className="w-full resize-none rounded-[10px] border border-[#e3e3e3] bg-white px-[11px] py-[9px] text-[12px] leading-[18px] text-[#777] outline-none transition focus:border-[#9db9e6]"
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

            <label className="mb-[6px] block text-[12px] font-medium text-[#555]">
                {label}
            </label>

            <select
                name={name}
                value={value}
                onChange={onChange}
                className="h-[36px] w-full rounded-[10px] border border-[#e3e3e3] bg-white px-[11px] text-[12px] text-[#555] outline-none transition focus:border-[#9db9e6]"
            >
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))}
            </select>

        </div>
    );
};

export default GeneralSettings;