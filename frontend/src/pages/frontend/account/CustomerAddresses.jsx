import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ChevronDown,
    ChevronRight,
    LoaderCircle,
    Plus,
    Trash2,
    X,
} from "lucide-react";

import api from "../../../api/axios";
import CustomerSidebar from "../../../components/frontend/account/CustomerSidebar";

const emptyForm = {
    type: "Home",
    country: "",
    first_name: "",
    last_name: "",
    address_line1: "",
    address_line2: "",
    city: "",
    postal_code: "",
    state: "",
    phone: "",
    is_default: false,
};

const CustomerAddresses = () => {
    const navigate = useNavigate();

    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const [deleteAddress, setDeleteAddress] = useState(null);
    const [removingId, setRemovingId] = useState(null);
    const [deleteError, setDeleteError] = useState("");

    const [defaultingId, setDefaultingId] = useState(null);

    // Load addresses
    const fetchAddresses = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) {
                setLoading(true);
            }

            setPageError("");

            const response = await api.get("/customer/addresses");

            setAddresses(
                Array.isArray(response.data?.addresses)
                    ? response.data.addresses
                    : []
            );
        } catch (error) {
            console.error(
                "Customer addresses error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {
                navigate("/login");
                return;
            }

            setPageError(
                error.response?.data?.message ||
                "Unable to load your addresses."
            );
        } finally {
            if (showLoading) {
                setLoading(false);
            }
        }
    }, [navigate]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    // Open create modal
    const openCreateModal = () => {
        setEditingId(null);
        setForm(emptyForm);
        setErrors({});
        setModalOpen(true);
    };

    // Open edit modal
    const openEditModal = (address) => {
        setEditingId(address.id);

        setForm({
            type: address.type || "Home",
            country: address.country || "",
            first_name: address.first_name || "",
            last_name: address.last_name || "",
            address_line1: address.address_line1 || "",
            address_line2: address.address_line2 || "",
            city: address.city || "",
            postal_code: address.postal_code || "",
            state: address.state || "",
            phone: address.phone || "",
            is_default: Boolean(address.is_default),
        });

        setErrors({});
        setModalOpen(true);
    };

    // Close address modal
    const closeModal = () => {
        if (saving) {
            return;
        }

        setModalOpen(false);
        setEditingId(null);
        setForm(emptyForm);
        setErrors({});
    };

    // Form change
    const handleFormChange = (event) => {
        const {
            name,
            value,
            type,
            checked,
        } = event.target;

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox"
                ? checked
                : value,
        }));

        if (errors[name]) {
            setErrors((current) => ({
                ...current,
                [name]: null,
            }));
        }
    };

    // Save address
    const handleSave = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setErrors({});

            const payload = {
                type: form.type,
                first_name: form.first_name,
                last_name: form.last_name,
                country: form.country,
                address_line1: form.address_line1,
                address_line2: form.address_line2 || null,
                city: form.city,
                state: form.state || null,
                postal_code: form.postal_code || null,
                phone: form.phone || null,
                is_default: Boolean(form.is_default),
            };

            if (editingId) {
                await api.put(
                    `/customer/addresses/${editingId}`,
                    payload
                );
            } else {
                await api.post(
                    "/customer/addresses",
                    payload
                );
            }

            setModalOpen(false);
            setEditingId(null);
            setForm(emptyForm);
            setErrors({});

            await fetchAddresses(false);
        } catch (error) {
            console.error(
                "Save address error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 422) {
                setErrors(
                    error.response?.data?.errors || {}
                );

                return;
            }

            if (error.response?.status === 401) {
                setModalOpen(false);
                navigate("/login");
                return;
            }

            setErrors({
                general:
                    error.response?.data?.message ||
                    "Unable to save address.",
            });
        } finally {
            setSaving(false);
        }
    };

    // Open delete modal
    const openDeleteModal = (address) => {
        setDeleteError("");
        setDeleteAddress(address);
    };

    // Close delete modal
    const closeDeleteModal = () => {
        if (removingId) {
            return;
        }

        setDeleteAddress(null);
        setDeleteError("");
    };

    // Delete address
    const removeAddress = async () => {
        if (!deleteAddress?.id) {
            return;
        }

        try {
            setRemovingId(deleteAddress.id);
            setDeleteError("");
            setPageError("");

            await api.delete(
                `/customer/addresses/${deleteAddress.id}`
            );

            setDeleteAddress(null);

            await fetchAddresses(false);
        } catch (error) {
            console.error(
                "Remove address error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {
                setDeleteAddress(null);
                navigate("/login");
                return;
            }

            setDeleteError(
                error.response?.data?.message ||
                "Unable to remove this address."
            );
        } finally {
            setRemovingId(null);
        }
    };

    // Set default address
    const setDefaultAddress = async (id) => {
        try {
            setDefaultingId(id);
            setPageError("");

            await api.post(
                `/customer/addresses/${id}/default`
            );

            await fetchAddresses(false);
        } catch (error) {
            console.error(
                "Set default address error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {
                navigate("/login");
                return;
            }

            setPageError(
                error.response?.data?.message ||
                "Unable to update default address."
            );
        } finally {
            setDefaultingId(null);
        }
    };

    return (
        <main className="min-h-screen bg-white font-['Inter']">

            <div className="mx-auto max-w-[1330px] px-5 pb-[70px] pt-[32px]">

                <Breadcrumb />

                <div className="mt-[28px] grid grid-cols-1 gap-[32px] lg:grid-cols-[250px_minmax(0,1fr)]">

                    <CustomerSidebar
                        addressCount={addresses.length}
                    />

                    <section className="min-w-0">

                        <h1 className="text-[26px] font-semibold text-[#171717]">
                            My Addresses
                        </h1>

                        {pageError && (
                            <div className="mt-[20px] rounded-[10px] border border-red-200 bg-red-50 px-[15px] py-[12px] text-[14px] text-red-600">
                                {pageError}
                            </div>
                        )}

                        {loading ? (
                            <AddressesLoader />
                        ) : (
                            <div className="mt-[26px] grid grid-cols-1 gap-[16px] md:grid-cols-2 xl:grid-cols-3">

                                {addresses.map((address) => (
                                    <AddressCard
                                        key={address.id}
                                        address={address}
                                        defaulting={defaultingId === address.id}
                                        onEdit={openEditModal}
                                        onRemove={openDeleteModal}
                                        onSetDefault={setDefaultAddress}
                                    />
                                ))}

                                <AddAddressCard
                                    onClick={openCreateModal}
                                />

                            </div>
                        )}

                    </section>

                </div>

            </div>

            <AddressModal
                open={modalOpen}
                editing={Boolean(editingId)}
                form={form}
                errors={errors}
                saving={saving}
                onChange={handleFormChange}
                onClose={closeModal}
                onSave={handleSave}
            />

            <DeleteAddressModal
                address={deleteAddress}
                deleting={Boolean(removingId)}
                error={deleteError}
                onClose={closeDeleteModal}
                onConfirm={removeAddress}
            />

        </main>
    );
};

// Breadcrumb
const Breadcrumb = () => {
    return (
        <div className="flex items-center gap-[10px] text-[14px] text-[#777]">

            <Link
                to="/"
                className="hover:text-[#2065D1]"
            >
                Home
            </Link>

            <ChevronRight size={15} />

            <Link
                to="/account"
                className="hover:text-[#2065D1]"
            >
                Account
            </Link>

            <ChevronRight size={15} />

            <span className="font-medium text-[#171717]">
                Addresses
            </span>

        </div>
    );
};

// Address card
const AddressCard = ({
    address,
    defaulting,
    onEdit,
    onRemove,
    onSetDefault,
}) => {
    const fullName = [
        address.first_name,
        address.last_name,
    ].filter(Boolean).join(" ");

    const location = [
        address.city,
        address.state,
        address.postal_code,
        address.country,
    ].filter(Boolean).join(", ");

    return (
        <div className="flex min-h-[214px] flex-col rounded-[12px] border border-[#dedede] bg-white px-[20px] py-[19px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">

            <div className="flex items-center justify-between gap-4">

                <h2 className="text-[17px] font-semibold text-[#171717]">
                    {address.type}
                </h2>

                {address.is_default && (
                    <span className="rounded-full bg-[#e9f2ff] px-[10px] py-[3px] text-[12px] font-medium text-[#2065D1]">
                        Default
                    </span>
                )}

            </div>

            <div className="mt-[14px] flex-1">

                <p className="text-[14px] font-medium text-[#222]">
                    {fullName}
                </p>

                <p className="mt-[5px] text-[14px] leading-[22px] text-[#666]">
                    {address.address_line1}
                </p>

                {address.address_line2 && (
                    <p className="text-[14px] leading-[22px] text-[#666]">
                        {address.address_line2}
                    </p>
                )}

                {location && (
                    <p className="text-[14px] leading-[22px] text-[#666]">
                        {location}
                    </p>
                )}

                {address.phone && (
                    <p className="mt-[8px] text-[14px] text-[#666]">
                        {address.phone}
                    </p>
                )}

            </div>

            <div className="mt-[14px] flex flex-wrap items-center gap-[11px] border-t border-[#eeeeee] pt-[14px] text-[14px]">

                <button
                    type="button"
                    disabled={defaulting}
                    onClick={() => onEdit(address)}
                    className="font-medium text-[#171717] underline underline-offset-2 hover:text-[#2065D1] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Edit
                </button>

                <span className="text-[#cccccc]">
                    |
                </span>

                <button
                    type="button"
                    disabled={defaulting}
                    onClick={() => onRemove(address)}
                    className="text-[#666] hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Remove
                </button>

                <span className="text-[#cccccc]">
                    |
                </span>

                <button
                    type="button"
                    disabled={address.is_default || defaulting}
                    onClick={() => onSetDefault(address.id)}
                    className={`flex items-center gap-[5px] underline underline-offset-2 ${
                        address.is_default
                            ? "cursor-not-allowed text-[#bbbbbb]"
                            : "text-[#444] hover:text-[#2065D1] disabled:cursor-not-allowed disabled:opacity-50"
                    }`}
                >
                    {defaulting && (
                        <LoaderCircle
                            size={13}
                            className="animate-spin"
                        />
                    )}

                    {defaulting
                        ? "Updating"
                        : "Set as Default"}
                </button>

            </div>

        </div>
    );
};

// Add address card
const AddAddressCard = ({ onClick }) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex min-h-[214px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#bfc3c9] bg-white text-[#777] transition hover:border-[#2065D1] hover:text-[#2065D1]"
        >

            <Plus
                size={30}
                strokeWidth={1.4}
            />

            <span className="mt-[13px] text-[14px] font-medium">
                Add New Address
            </span>

        </button>
    );
};

// Address modal
const AddressModal = ({
    open,
    editing,
    form,
    errors,
    saving,
    onChange,
    onClose,
    onSave,
}) => {
    useEffect(() => {
        if (!open) {
            return;
        }

        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

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
            document.body.style.overflow = oldOverflow;

            window.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [open, onClose, saving]);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-[30px]">

            <button
                type="button"
                aria-label="Close address modal"
                disabled={saving}
                onClick={onClose}
                className="absolute inset-0 bg-black/50"
            />

            <div className="relative z-10 max-h-[calc(100vh-50px)] w-full max-w-[440px] overflow-y-auto rounded-[16px] bg-white shadow-[0_25px_70px_rgba(0,0,0,0.22)]">

                <div className="flex items-start justify-between px-[24px] pb-[12px] pt-[22px]">

                    <div>

                        <h2 className="text-[20px] font-semibold text-[#171717]">
                            {editing
                                ? "Edit Address"
                                : "Add New Address"}
                        </h2>

                        <p className="mt-[5px] text-[14px] text-[#777]">
                            Enter the delivery address details
                        </p>

                    </div>

                    <button
                        type="button"
                        disabled={saving}
                        onClick={onClose}
                        className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#666] hover:bg-[#f5f5f5] hover:text-[#111] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>

                </div>

                <form
                    onSubmit={onSave}
                    className="px-[24px] pb-[24px] pt-[16px]"
                >

                    {errors.general && (
                        <div className="mb-[14px] rounded-[9px] border border-red-200 bg-red-50 px-[12px] py-[10px] text-[13px] text-red-600">
                            {errors.general}
                        </div>
                    )}

                    <SelectField
                        label="Address type"
                        name="type"
                        value={form.type}
                        error={errors.type}
                        onChange={onChange}
                        options={[
                            "Home",
                            "Office",
                            "Other",
                        ]}
                    />

                    <div className="mt-[12px]">

                        <SelectField
                            label="Country"
                            name="country"
                            value={form.country}
                            error={errors.country}
                            onChange={onChange}
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
                        />

                    </div>

                    <div className="mt-[12px] grid grid-cols-2 gap-[12px]">

                        <InputField
                            name="first_name"
                            value={form.first_name}
                            placeholder="First Name"
                            error={errors.first_name}
                            onChange={onChange}
                        />

                        <InputField
                            name="last_name"
                            value={form.last_name}
                            placeholder="Last Name"
                            error={errors.last_name}
                            onChange={onChange}
                        />

                    </div>

                    <div className="mt-[12px]">

                        <InputField
                            name="address_line1"
                            value={form.address_line1}
                            placeholder="Street Address"
                            error={errors.address_line1}
                            onChange={onChange}
                        />

                    </div>

                    <div className="mt-[12px]">

                        <InputField
                            name="address_line2"
                            value={form.address_line2}
                            placeholder="Apartment, suite, etc. (optional)"
                            error={errors.address_line2}
                            onChange={onChange}
                        />

                    </div>

                    <div className="mt-[12px] grid grid-cols-2 gap-[12px]">

                        <InputField
                            name="city"
                            value={form.city}
                            placeholder="City"
                            error={errors.city}
                            onChange={onChange}
                        />

                        <InputField
                            name="postal_code"
                            value={form.postal_code}
                            placeholder="Postal Code"
                            error={errors.postal_code}
                            onChange={onChange}
                        />

                    </div>

                    <div className="mt-[12px]">

                        <InputField
                            name="state"
                            value={form.state}
                            placeholder="State"
                            error={errors.state}
                            onChange={onChange}
                        />

                    </div>

                    <div className="mt-[12px]">

                        <InputField
                            name="phone"
                            value={form.phone}
                            placeholder="Phone"
                            error={errors.phone}
                            onChange={onChange}
                        />

                    </div>

                    <label className="mt-[15px] flex cursor-pointer items-center gap-[9px]">

                        <input
                            type="checkbox"
                            name="is_default"
                            checked={form.is_default}
                            onChange={onChange}
                            className="h-[16px] w-[16px] rounded accent-[#2065D1]"
                        />

                        <span className="text-[14px] text-[#333]">
                            This is my default address
                        </span>

                    </label>

                    <div className="mt-[28px] flex justify-end gap-[10px]">

                        <button
                            type="button"
                            disabled={saving}
                            onClick={onClose}
                            className="h-[40px] rounded-full border border-[#dedede] bg-white px-[18px] text-[14px] font-medium text-[#333] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex h-[40px] min-w-[86px] items-center justify-center gap-[7px] rounded-full bg-[#2065D1] px-[20px] text-[14px] font-semibold text-white transition hover:bg-[#1858bb] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {saving && (
                                <LoaderCircle
                                    size={15}
                                    className="animate-spin"
                                />
                            )}

                            {saving
                                ? "Saving"
                                : "Save"}
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
};

// Delete confirmation modal
const DeleteAddressModal = ({
    address,
    deleting,
    error,
    onClose,
    onConfirm,
}) => {
    useEffect(() => {
        if (!address) {
            return;
        }

        const oldOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        const handleEscape = (event) => {
            if (
                event.key === "Escape" &&
                !deleting
            ) {
                onClose();
            }
        };

        window.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.body.style.overflow = oldOverflow;

            window.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [address, deleting, onClose]);

    if (!address) {
        return null;
    }

    const addressName = [
        address.first_name,
        address.last_name,
    ].filter(Boolean).join(" ");

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center px-4">

            <button
                type="button"
                aria-label="Close delete confirmation"
                disabled={deleting}
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
            />

            <div className="relative z-10 w-full max-w-[575px] overflow-hidden rounded-[24px] border-t-[2px] border-[#ff3038] bg-white px-[32px] pb-[30px] pt-[30px] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">

                <button
                    type="button"
                    disabled={deleting}
                    onClick={onClose}
                    className="absolute right-[22px] top-[20px] flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#888] transition hover:bg-[#f5f5f5] hover:text-[#222] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <X
                        size={20}
                        strokeWidth={2}
                    />
                </button>

                <div className="flex flex-col items-center text-center">

                    <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#ffe7e8] text-[#ff1f28]">

                        <Trash2
                            size={29}
                            strokeWidth={2}
                        />

                    </div>

                    <h2 className="mt-[25px] text-[26px] font-semibold text-[#292929]">
                        Delete Address
                    </h2>

                    <p className="mt-[14px] max-w-[450px] text-[18px] leading-[28px] text-[#808080]">
                        Are you sure you want to delete
                        {addressName && (
                            <>
                                {" "}
                                <span className="font-medium text-[#666]">
                                    "{addressName}"
                                </span>
                            </>
                        )}
                        ?
                        <br />
                        This action cannot be undone.
                    </p>

                </div>

                {error && (
                    <div className="mt-[20px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[11px] text-center text-[14px] text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-[32px] grid grid-cols-2 gap-[16px]">

                    <button
                        type="button"
                        disabled={deleting}
                        onClick={onClose}
                        className="flex h-[52px] items-center justify-center rounded-[14px] border border-[#dedede] bg-white text-[18px] font-medium text-[#292929] shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition hover:bg-[#f8f8f8] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={deleting}
                        onClick={onConfirm}
                        className="flex h-[52px] items-center justify-center gap-[8px] rounded-[14px] bg-[#ff0712] text-[18px] font-semibold text-white transition hover:bg-[#e9000b] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {deleting && (
                            <LoaderCircle
                                size={19}
                                className="animate-spin"
                            />
                        )}

                        {deleting
                            ? "Deleting..."
                            : "Delete"}
                    </button>

                </div>

            </div>

        </div>
    );
};

// Input field
const InputField = ({
    name,
    value,
    placeholder,
    error,
    onChange,
}) => {
    const message = Array.isArray(error)
        ? error[0]
        : error;

    return (
        <div>

            <input
                type="text"
                name={name}
                value={value}
                placeholder={placeholder}
                onChange={onChange}
                className={`h-[55px] w-full rounded-[14px] border bg-white px-[14px] text-[14px] text-[#222] outline-none transition placeholder:text-[#777] ${
                    message
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#dedede] focus:border-[#2065D1]"
                }`}
            />

            {message && (
                <p className="mt-[5px] px-[2px] text-[12px] text-red-500">
                    {message}
                </p>
            )}

        </div>
    );
};

// Select field
const SelectField = ({
    label,
    name,
    value,
    options,
    error,
    onChange,
}) => {
    const message = Array.isArray(error)
        ? error[0]
        : error;

    return (
        <div>

            <div className="relative">

                <label className="pointer-events-none absolute left-[13px] top-[7px] z-10 text-[11px] text-[#777]">
                    {label}
                </label>

                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`h-[55px] w-full appearance-none rounded-[14px] border bg-white px-[13px] pb-[5px] pt-[20px] text-[14px] text-[#222] outline-none ${
                        message
                            ? "border-red-400 focus:border-red-500"
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

                <ChevronDown
                    size={16}
                    className="pointer-events-none absolute right-[13px] top-1/2 -translate-y-1/2 text-[#999]"
                />

            </div>

            {message && (
                <p className="mt-[5px] px-[2px] text-[12px] text-red-500">
                    {message}
                </p>
            )}

        </div>
    );
};

// Loading
const AddressesLoader = () => {
    return (
        <div className="mt-[26px] grid grid-cols-1 gap-[16px] md:grid-cols-2 xl:grid-cols-3">

            {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="min-h-[214px] animate-pulse rounded-[12px] border border-[#e5e5e5] bg-white p-[20px]"
                >
                    <div className="h-[18px] w-[90px] rounded bg-[#eeeeee]" />
                    <div className="mt-[20px] h-[14px] w-[140px] rounded bg-[#eeeeee]" />
                    <div className="mt-[10px] h-[14px] w-full rounded bg-[#eeeeee]" />
                    <div className="mt-[8px] h-[14px] w-[75%] rounded bg-[#eeeeee]" />
                    <div className="mt-[28px] h-[1px] w-full bg-[#eeeeee]" />
                    <div className="mt-[15px] h-[14px] w-[170px] rounded bg-[#eeeeee]" />
                </div>
            ))}

        </div>
    );
};

export default CustomerAddresses;