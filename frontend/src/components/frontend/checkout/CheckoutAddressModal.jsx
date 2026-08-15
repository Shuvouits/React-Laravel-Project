import { useEffect, useState } from "react";
import {
    LoaderCircle,
    X,
} from "lucide-react";

const CheckoutAddressModal = ({
    open,
    saving,
    errors,
    defaultChecked,
    onSave,
    onClose,
}) => {
    const [form, setForm] = useState(
        getEmptyForm(false)
    );

    useEffect(() => {
        if (!open) {
            return;
        }

        setForm(
            getEmptyForm(defaultChecked)
        );
    }, [open, defaultChecked]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const oldOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        const handleEscape = (event) => {
            if (
                event.key === "Escape" &&
                !saving
            ) {
                onClose();
            }
        };

        window.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.body.style.overflow =
                oldOverflow;

            window.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [open, saving, onClose]);

    const handleChange = (event) => {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        setForm((current) => ({
            ...current,
            [name]:
                type === "checkbox"
                    ? checked
                    : value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        onSave(form);
    };

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-[25px]">

            <button
                type="button"
                aria-label="Close modal"
                onClick={onClose}
                className="absolute inset-0 bg-black/50"
            />

            <div className="relative z-10 max-h-[calc(100vh-50px)] w-full max-w-[460px] overflow-y-auto rounded-[16px] bg-white shadow-[0_25px_70px_rgba(0,0,0,0.22)]">

                <div className="flex items-start justify-between border-b border-[#eeeeee] px-[24px] py-[20px]">

                    <div>
                        <h2 className="text-[20px] font-semibold text-[#171717]">
                            Add New Address
                        </h2>

                        <p className="mt-[4px] text-[13px] text-[#777]">
                            Enter your delivery address details.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#666] hover:bg-[#f5f5f5]"
                    >
                        <X size={18} />
                    </button>

                </div>

                <form
                    onSubmit={handleSubmit}
                    className="px-[24px] pb-[24px] pt-[20px]"
                >

                    <SelectField
                        label="Address type"
                        name="type"
                        value={form.type}
                        onChange={handleChange}
                        options={[
                            "Home",
                            "Office",
                            "Other",
                        ]}
                        error={errors?.type?.[0]}
                    />

                    <div className="mt-[13px]">

                        <SelectField
                            label="Country"
                            name="country"
                            value={form.country}
                            onChange={handleChange}
                            options={[
                                "",
                                "Bangladesh",
                                "USA",
                                "United Kingdom",
                                "Canada",
                                "Australia",
                                "India",
                                "Peru",
                            ]}
                            error={errors?.country?.[0]}
                        />

                    </div>

                    <div className="mt-[13px] grid grid-cols-1 gap-[13px] sm:grid-cols-2">

                        <InputField
                            label="First name"
                            name="first_name"
                            value={form.first_name}
                            onChange={handleChange}
                            error={
                                errors?.first_name?.[0]
                            }
                        />

                        <InputField
                            label="Last name"
                            name="last_name"
                            value={form.last_name}
                            onChange={handleChange}
                            error={
                                errors?.last_name?.[0]
                            }
                        />

                    </div>

                    <div className="mt-[13px]">

                        <InputField
                            label="Street address"
                            name="address_line1"
                            value={form.address_line1}
                            onChange={handleChange}
                            error={
                                errors?.address_line1?.[0]
                            }
                        />

                    </div>

                    <div className="mt-[13px]">

                        <InputField
                            label="Apartment, suite, etc."
                            name="address_line2"
                            value={form.address_line2}
                            onChange={handleChange}
                            optional
                            error={
                                errors?.address_line2?.[0]
                            }
                        />

                    </div>

                    <div className="mt-[13px] grid grid-cols-1 gap-[13px] sm:grid-cols-2">

                        <InputField
                            label="City"
                            name="city"
                            value={form.city}
                            onChange={handleChange}
                            error={errors?.city?.[0]}
                        />

                        <InputField
                            label="Postal code"
                            name="postal_code"
                            value={form.postal_code}
                            onChange={handleChange}
                            error={
                                errors?.postal_code?.[0]
                            }
                        />

                    </div>

                    <div className="mt-[13px]">

                        <InputField
                            label="State"
                            name="state"
                            value={form.state}
                            onChange={handleChange}
                            error={errors?.state?.[0]}
                        />

                    </div>

                    <div className="mt-[13px]">

                        <InputField
                            label="Phone"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleChange}
                            error={errors?.phone?.[0]}
                        />

                    </div>

                    <label className="mt-[17px] flex cursor-pointer items-center gap-[9px]">

                        <input
                            type="checkbox"
                            name="is_default"
                            checked={form.is_default}
                            onChange={handleChange}
                            className="h-[16px] w-[16px] accent-[#2065D1]"
                        />

                        <span className="text-[14px] text-[#333]">
                            Set as my default address
                        </span>

                    </label>

                    <div className="mt-[26px] flex justify-end gap-[10px]">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="h-[40px] rounded-full border border-[#dedede] px-[18px] text-[14px] font-medium text-[#333] hover:bg-[#f7f7f7] disabled:opacity-60"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex h-[40px] min-w-[125px] items-center justify-center gap-[7px] rounded-full bg-[#2065D1] px-[20px] text-[14px] font-semibold text-white hover:bg-[#1858bb] disabled:opacity-60"
                        >
                            {saving && (
                                <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                />
                            )}

                            {saving
                                ? "Saving..."
                                : "Save Address"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
};

const InputField = ({
    label,
    name,
    type = "text",
    value,
    onChange,
    optional = false,
    error,
}) => {
    return (
        <div>

            <label className="mb-[6px] block text-[13px] font-medium text-[#333]">
                {label}

                {optional && (
                    <span className="ml-[4px] font-normal text-[#999]">
                        (optional)
                    </span>
                )}
            </label>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className={`h-[42px] w-full rounded-[8px] border px-[12px] text-[14px] text-[#333] outline-none transition ${
                    error
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#dedede] focus:border-[#2065D1]"
                }`}
            />

            {error && (
                <p className="mt-[5px] text-[11px] text-red-500">
                    {error}
                </p>
            )}

        </div>
    );
};

const SelectField = ({
    label,
    name,
    value,
    onChange,
    options,
    error,
}) => {
    return (
        <div>

            <label className="mb-[6px] block text-[13px] font-medium text-[#333]">
                {label}
            </label>

            <select
                name={name}
                value={value}
                onChange={onChange}
                className={`h-[42px] w-full rounded-[8px] border bg-white px-[12px] text-[14px] text-[#333] outline-none ${
                    error
                        ? "border-red-400"
                        : "border-[#dedede] focus:border-[#2065D1]"
                }`}
            >
                {options.map((option) => (
                    <option
                        key={option || "empty"}
                        value={option}
                    >
                        {option || "Select country"}
                    </option>
                ))}
            </select>

            {error && (
                <p className="mt-[5px] text-[11px] text-red-500">
                    {error}
                </p>
            )}

        </div>
    );
};

const getEmptyForm = (
    defaultChecked
) => {
    const user = getLocalUser();

    return {
        type: "Home",
        country: "",
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        address_line1: "",
        address_line2: "",
        city: "",
        postal_code: "",
        state: "",
        phone: user.phone || "",
        is_default: defaultChecked,
    };
};

const getLocalUser = () => {
    try {
        return JSON.parse(
            localStorage.getItem("user")
        ) || {};
    } catch {
        return {};
    }
};

export default CheckoutAddressModal;