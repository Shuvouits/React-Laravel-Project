import { createPortal } from "react-dom";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
    ArrowDownUp,
    ChevronLeft,
    ChevronRight,
    Eye,
    LoaderCircle,
    Plus,
    Search,
    WalletCards,
    X,
} from "lucide-react";

import api from "../../../api/axios";

const tabs = [
    { value: "all", label: "All statuses" },
    { value: "pending", label: "Pending" },
    { value: "processing", label: "Processing" },
    { value: "paid", label: "Paid" },
    { value: "failed", label: "Failed" },
    { value: "cancelled", label: "Cancelled" },
];

const initialForm = {
    vendor_id: "",
    period_start: "",
    period_end: "",
    note: "",
};

const formatMoney = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD",
        minimumFractionDigits: 2,
    }).format(Number(amount || 0));
};

const formatDate = (date) => {
    if (!date) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
};

const statusClass = (status) => {
    switch (status) {
        case "paid":
            return "border-[#86efac] bg-[#ecfdf3] text-[#15803d]";

        case "failed":
            return "border-[#fecaca] bg-[#fff1f2] text-[#dc2626]";

        case "processing":
            return "border-[#bfdbfe] bg-[#eff6ff] text-[#2563eb]";

        case "cancelled":
            return "border-[#d4d4d8] bg-[#f4f4f5] text-[#52525b]";

        default:
            return "border-[#fde68a] bg-[#fffbeb] text-[#b45309]";
    }
};

const formatStatus = (status) => {
    if (!status) {
        return "Pending";
    }

    return (
        status.charAt(0).toUpperCase() +
        status.slice(1)
    );
};

const FieldError = ({ message }) => {
    if (!message) {
        return null;
    }

    return (
        <p className="mt-1 text-[12px] text-[#dc2626]">
            {message}
        </p>
    );
};

const CreatePayoutModal = ({
    open,
    onClose,
    onCreated,
}) => {
    const [vendors, setVendors] =
        useState([]);

    const [form, setForm] =
        useState(initialForm);

    const [loadingVendors, setLoadingVendors] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [errors, setErrors] =
        useState({});

    const [generalError, setGeneralError] =
        useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        setForm(initialForm);
        setErrors({});
        setGeneralError("");

        const fetchVendors = async () => {
            try {
                setLoadingVendors(true);

                const response = await api.get(
                    "/admin/finance/payouts/vendors"
                );

                setVendors(
                    response.data?.data || []
                );
            } catch (error) {
                console.error(
                    "Eligible vendors error:",
                    error.response?.data ||
                    error.message
                );

                setVendors([]);
            } finally {
                setLoadingVendors(false);
            }
        };

        fetchVendors();
    }, [open]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener(
            "keydown",
            handleEscape
        );

        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );

            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    const updateField = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setErrors((current) => ({
            ...current,
            [name]: "",
        }));

        setGeneralError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setErrors({});
            setGeneralError("");

            const response = await api.post(
                "/admin/finance/payouts",
                {
                    vendor_id: Number(
                        form.vendor_id
                    ),
                    period_start:
                        form.period_start,
                    period_end:
                        form.period_end,
                    note:
                        form.note.trim() || null,
                }
            );

            onCreated(
                response.data?.data
            );

            onClose();
        } catch (error) {
            const validationErrors =
                error.response?.data?.errors || {};

            const normalized = {};

            Object.entries(validationErrors).forEach(
                ([key, value]) => {
                    normalized[key] =
                        Array.isArray(value)
                            ? value[0]
                            : value;
                }
            );

            setErrors(normalized);

            setGeneralError(
                error.response?.data?.message ||
                Object.values(normalized)[0] ||
                "Unable to create payout."
            );
        } finally {
            setSaving(false);
        }
    };

    const selectedVendor = vendors.find(
        (vendor) =>
            String(vendor.id) ===
            String(form.vendor_id)
    );

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            <form
                onSubmit={handleSubmit}
                className="relative z-10 w-full max-w-[755px] rounded-[18px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
            >
                <div className="flex items-start justify-between px-7 pb-4 pt-6">
                    <div>
                        <h2 className="text-[21px] font-semibold text-[#18181b]">
                            Create Payout
                        </h2>

                        <p className="mt-1 text-[14px] text-[#73737b]">
                            Create a vendor settlement run for an unpaid period.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-[#68686f] hover:bg-[#f1f2f4]"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 px-7 pb-7">
                    {generalError && (
                        <div className="rounded-[12px] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-[13px] text-[#b42318]">
                            {generalError}
                        </div>
                    )}

                    <label>
                        <span className="mb-1.5 block text-[14px] font-medium text-[#29292d]">
                            Vendor
                        </span>

                        <select
                            name="vendor_id"
                            value={form.vendor_id}
                            onChange={updateField}
                            disabled={loadingVendors}
                            className="h-12 w-full rounded-[13px] border border-[#dedfe4] bg-white px-4 text-[14px] outline-none focus:border-[#2563eb]"
                        >
                            <option value="">
                                {loadingVendors
                                    ? "Loading vendors..."
                                    : "Select vendor"}
                            </option>

                            {vendors.map((vendor) => (
                                <option
                                    key={vendor.id}
                                    value={vendor.id}
                                >
                                    {vendor.store_name} ·{" "}
                                    {formatMoney(
                                        vendor.available_balance,
                                        vendor.currency
                                    )}{" "}
                                    available
                                </option>
                            ))}
                        </select>

                        <FieldError
                            message={errors.vendor_id}
                        />
                    </label>

                    {selectedVendor && (
                        <div className="grid gap-3 rounded-[13px] border border-[#dbeafe] bg-[#f5f9ff] p-4 sm:grid-cols-2">
                            <div>
                                <p className="text-[12px] text-[#6b7280]">
                                    Available balance
                                </p>

                                <p className="mt-1 text-[18px] font-semibold text-[#1d4ed8]">
                                    {formatMoney(
                                        selectedVendor.available_balance,
                                        selectedVendor.currency
                                    )}
                                </p>
                            </div>

                            <div>
                                <p className="text-[12px] text-[#6b7280]">
                                    Commission rate
                                </p>

                                <p className="mt-1 text-[18px] font-semibold text-[#111827]">
                                    {Number(
                                        selectedVendor.commission_rate || 0
                                    ).toFixed(2)}
                                    %
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label>
                            <span className="mb-1.5 block text-[14px] font-medium text-[#29292d]">
                                Period start
                            </span>

                            <input
                                type="date"
                                name="period_start"
                                value={form.period_start}
                                onChange={updateField}
                                className="h-12 w-full rounded-[13px] border border-[#dedfe4] px-4 text-[14px] outline-none focus:border-[#2563eb]"
                            />

                            <FieldError
                                message={errors.period_start}
                            />
                        </label>

                        <label>
                            <span className="mb-1.5 block text-[14px] font-medium text-[#29292d]">
                                Period end
                            </span>

                            <input
                                type="date"
                                name="period_end"
                                value={form.period_end}
                                onChange={updateField}
                                min={form.period_start}
                                className="h-12 w-full rounded-[13px] border border-[#dedfe4] px-4 text-[14px] outline-none focus:border-[#2563eb]"
                            />

                            <FieldError
                                message={errors.period_end}
                            />
                        </label>
                    </div>

                    <label>
                        <span className="mb-1.5 block text-[14px] font-medium text-[#29292d]">
                            Optional note
                        </span>

                        <input
                            type="text"
                            name="note"
                            value={form.note}
                            onChange={updateField}
                            placeholder="Optional payout note"
                            className="h-12 w-full rounded-[13px] border border-[#dedfe4] px-4 text-[14px] outline-none focus:border-[#2563eb]"
                        />

                        <FieldError
                            message={errors.note}
                        />
                    </label>

                    {vendors.length === 0 &&
                        !loadingVendors && (
                            <div className="rounded-[12px] border border-[#fde68a] bg-[#fffbeb] px-4 py-3 text-[13px] text-[#92400e]">
                                No vendor currently has an eligible unpaid marketplace balance.
                            </div>
                        )}

                    <div className="flex justify-end gap-3 border-t border-[#ececef] pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-11 rounded-[12px] border border-[#dedfe4] bg-white px-5 text-[14px] font-medium hover:bg-[#f7f7f8]"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                saving ||
                                vendors.length === 0
                            }
                            className="flex h-11 items-center gap-2 rounded-[12px] bg-[#2563eb] px-5 text-[14px] font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving && (
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                            )}

                            Create
                        </button>
                    </div>
                </div>
            </form>
        </div>,
        document.body
    );
};

const AdminFinancePayouts = () => {
    const navigate = useNavigate();

    const [payouts, setPayouts] =
        useState([]);

    const [activeTab, setActiveTab] =
        useState("all");

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [modalOpen, setModalOpen] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [pagination, setPagination] =
        useState({
            current_page: 1,
            last_page: 1,
            total: 0,
        });

    const fetchPayouts = useCallback(
        async (page = 1) => {
            try {
                setLoading(true);

                const response = await api.get(
                    "/admin/finance/payouts",
                    {
                        params: {
                            page,
                            per_page: 20,
                            status: activeTab,
                            search: search.trim(),
                        },
                    }
                );

                const result =
                    response.data?.data || {};

                setPayouts(
                    result.data || []
                );

                setPagination({
                    current_page:
                        result.current_page || 1,

                    last_page:
                        result.last_page || 1,

                    total:
                        result.total || 0,
                });
            } catch (error) {
                console.error(
                    "Admin payouts error:",
                    error.response?.data ||
                    error.message
                );

                setPayouts([]);
            } finally {
                setLoading(false);
            }
        },
        [activeTab, search]
    );

    useEffect(() => {
        const timer = setTimeout(
            () => fetchPayouts(1),
            search.trim() ? 350 : 0
        );

        return () => clearTimeout(timer);
    }, [fetchPayouts, search]);

    const handleCreated = (payout) => {
        setMessage(
            "Payout created successfully."
        );

        fetchPayouts(1);

        setTimeout(() => {
            setMessage("");
        }, 3000);

        if (payout?.id) {
            navigate(
                `/admin/finance/payouts/${payout.id}`
            );
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f7f9] px-7 py-8 xl:px-10">
            <div className="mx-auto max-w-[1600px]">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-[30px] font-semibold tracking-[-0.035em] text-[#111111]">
                            Payouts
                        </h1>

                        <p className="mt-1 text-[15px] text-[#6f7077]">
                            Create vendor settlement runs and track payout lifecycle.
                        </p>
                    </div>
                </div>

                {message && (
                    <div className="mt-5 rounded-[13px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[14px] text-[#15803d]">
                        {message}
                    </div>
                )}

                <div className="mt-7 rounded-[18px] border border-[#dedfe4] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-[22px] font-semibold text-[#151519]">
                            Payout Runs
                        </h2>

                        <button
                            type="button"
                            onClick={() => {
                                setModalOpen(true);
                            }}
                            className="flex h-11 items-center gap-2 rounded-[13px] bg-[#2563eb] px-5 text-[14px] font-semibold text-white hover:bg-[#1d4ed8]"
                        >
                            <Plus size={18} />
                            Create Payout
                        </button>
                    </div>

                    <div className="mt-6 overflow-hidden rounded-[15px] border border-[#dedfe4]">
                        <div className="flex items-center justify-between overflow-x-auto border-b border-[#e5e6e9] px-5">
                            <div className="flex min-w-max">
                                {tabs.map((tab) => (
                                    <button
                                        key={tab.value}
                                        type="button"
                                        onClick={() => {
                                            setActiveTab(
                                                tab.value
                                            );
                                        }}
                                        className={[
                                            "relative h-[66px] px-3 text-[14px] transition",
                                            activeTab === tab.value
                                                ? "font-medium text-[#111111]"
                                                : "text-[#64656c] hover:text-[#111111]",
                                        ].join(" ")}
                                    >
                                        {tab.label}

                                        {activeTab === tab.value && (
                                            <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-[#111111]" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <ArrowDownUp
                                size={18}
                                className="shrink-0 text-[#66676d]"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-4 border-b border-[#e5e6e9] p-4">
                            <div className="relative w-full max-w-[585px]">
                                <Search
                                    size={17}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8a8b91]"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) => {
                                        setSearch(
                                            event.target.value
                                        );
                                    }}
                                    placeholder="Search payout number or vendor"
                                    className="h-11 w-full rounded-[13px] border border-[#dedfe4] pl-10 pr-4 text-[14px] outline-none focus:border-[#2563eb]"
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1000px]">
                                <thead>
                                    <tr className="border-b border-[#e5e6e9] text-left text-[13px] font-medium text-[#62636a]">
                                        <th className="px-7 py-4">
                                            Payout
                                        </th>

                                        <th className="px-5 py-4">
                                            Vendor
                                        </th>

                                        <th className="px-5 py-4">
                                            Status
                                        </th>

                                        <th className="px-5 py-4">
                                            Amount
                                        </th>

                                        <th className="px-5 py-4">
                                            Period
                                        </th>

                                        <th className="px-5 py-4 text-right">
                                            Details
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="h-[260px]"
                                            >
                                                <div className="flex justify-center">
                                                    <LoaderCircle
                                                        size={30}
                                                        className="animate-spin text-[#2563eb]"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : payouts.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="h-[270px]"
                                            >
                                                <div className="flex flex-col items-center justify-center text-center">
                                                    <WalletCards
                                                        size={40}
                                                        strokeWidth={1.5}
                                                        className="text-[#777880]"
                                                    />

                                                    <p className="mt-4 text-[15px] text-[#696a71]">
                                                        No payouts found.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        payouts.map((payout) => (
                                            <tr
                                                key={payout.id}
                                                className="border-b border-[#e8e9ec] text-[14px] last:border-b-0"
                                            >
                                                <td className="px-7 py-5">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            navigate(
                                                                `/admin/finance/payouts/${payout.id}`
                                                            );
                                                        }}
                                                        className="font-medium text-[#155eef] hover:underline"
                                                    >
                                                        {payout.payout_number}
                                                    </button>
                                                </td>

                                                <td className="px-5 py-5 font-medium text-[#252529]">
                                                    {payout.vendor?.store_name ||
                                                        "Unknown vendor"}
                                                </td>

                                                <td className="px-5 py-5">
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-[12px] font-medium ${statusClass(
                                                            payout.status
                                                        )}`}
                                                    >
                                                        {formatStatus(
                                                            payout.status
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-5 font-semibold text-[#17171a]">
                                                    {formatMoney(
                                                        payout.net_amount,
                                                        payout.currency
                                                    )}
                                                </td>

                                                <td className="px-5 py-5 text-[#66676d]">
                                                    {formatDate(
                                                        payout.period_start
                                                    )}{" "}
                                                    -{" "}
                                                    {formatDate(
                                                        payout.period_end
                                                    )}
                                                </td>

                                                <td className="px-5 py-5">
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                navigate(
                                                                    `/admin/finance/payouts/${payout.id}`
                                                                );
                                                            }}
                                                            className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-[#dedfe4] text-[#686970] hover:bg-[#f5f6f8]"
                                                        >
                                                            <Eye size={17} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[13px] text-[#696a71]">
                            Showing {payouts.length} of{" "}
                            {pagination.total} results
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={
                                    pagination.current_page <= 1
                                }
                                onClick={() => {
                                    fetchPayouts(
                                        pagination.current_page - 1
                                    );
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dedfe4] disabled:opacity-40"
                            >
                                <ChevronLeft size={17} />
                            </button>

                            <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#2563eb] px-3 text-[13px] font-medium text-white">
                                {pagination.current_page}
                            </span>

                            <button
                                type="button"
                                disabled={
                                    pagination.current_page >=
                                    pagination.last_page
                                }
                                onClick={() => {
                                    fetchPayouts(
                                        pagination.current_page + 1
                                    );
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dedfe4] disabled:opacity-40"
                            >
                                <ChevronRight size={17} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <CreatePayoutModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                }}
                onCreated={handleCreated}
            />
        </div>
    );
};

export default AdminFinancePayouts;