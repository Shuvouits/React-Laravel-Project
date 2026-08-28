import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    LoaderCircle,
    Save,
    ShoppingCart,
} from "lucide-react";

import api from "../../../api/axios";

const statusOptions = [
    "pending",
    "processing",
    "paid",
    "failed",
    "cancelled",
];

const AdminFinancePayoutDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [payout, setPayout] = useState(null);
    const [status, setStatus] = useState("");
    const [note, setNote] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const fetchPayout = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get(
                `/admin/finance/payouts/${id}`
            );

            const payoutData =
                response.data?.data || response.data?.payout || response.data;

            setPayout(payoutData);
            setStatus(payoutData?.status || "pending");
            setNote(
                payoutData?.note ||
                payoutData?.failure_reason ||
                ""
            );
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Payout details load করা যায়নি।"
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayout();
    }, [id]);

    const handleStatusUpdate = async (event) => {
        event.preventDefault();

        if (!status) {
            setError("একটি payout status নির্বাচন করুন।");
            return;
        }

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            const response = await api.patch(
                `/admin/finance/payouts/${id}/status`,
                {
                    status,
                    note: note.trim() || null,
                }
            );

            const updatedPayout =
                response.data?.data ||
                response.data?.payout ||
                response.data;

            setPayout((previousPayout) => ({
                ...previousPayout,
                ...updatedPayout,
            }));

            setStatus(updatedPayout?.status || status);

            setSuccess(
                response.data?.message ||
                "Payout status সফলভাবে update হয়েছে।"
            );
        } catch (requestError) {
            const validationErrors =
                requestError.response?.data?.errors;

            if (validationErrors) {
                const firstError = Object.values(validationErrors)
                    .flat()
                    .find(Boolean);

                setError(firstError || "Validation failed.");
            } else {
                setError(
                    requestError.response?.data?.message ||
                    "Payout status update করা যায়নি।"
                );
            }
        } finally {
            setSaving(false);
        }
    };

    const formatMoney = (amount, currency = "USD") => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency,
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
        }).format(new Date(date));
    };

    const formatDateTime = (date) => {
        if (!date) {
            return "—";
        }

        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date(date));
    };

    const formatStatus = (value) => {
        if (!value) {
            return "Unknown";
        }

        return value
            .replaceAll("_", " ")
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    const getStatusClass = (value) => {
        switch (value) {
            case "paid":
                return "border-emerald-200 bg-emerald-50 text-emerald-700";

            case "processing":
                return "border-blue-200 bg-blue-50 text-blue-700";

            case "failed":
                return "border-red-200 bg-red-50 text-red-700";

            case "cancelled":
                return "border-gray-200 bg-gray-100 text-gray-600";

            default:
                return "border-amber-200 bg-amber-50 text-amber-700";
        }
    };

    const getOrderNumber = (item) => {
        return (
            item?.order?.order_no ||
            item?.order?.order_number ||
            item?.order?.id ||
            item?.order_id ||
            "—"
        );
    };

    const orders = payout?.orders || [];
    const currency = payout?.currency || "USD";
    const isPaid = payout?.status === "paid";

    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <LoaderCircle
                    size={34}
                    className="animate-spin text-blue-600"
                />
            </div>
        );
    }

    if (!payout) {
        return (
            <div className="p-6 lg:p-8">
                <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                    <p className="text-sm text-red-700">
                        {error || "Payout পাওয়া যায়নি।"}
                    </p>

                    <button
                        type="button"
                        onClick={() => navigate("/admin/finance/payouts")}
                        className="mt-4 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white"
                    >
                        <ArrowLeft size={17} />
                        Payout list
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f7f9] p-5 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px]">
                <button
                    type="button"
                    onClick={() => navigate("/admin/finance/payouts")}
                    className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-gray-900"
                >
                    <ArrowLeft size={18} />
                    Back to payouts
                </button>

                <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                            {payout.payout_number || `PAYOUT-${payout.id}`}
                        </h1>

                        <p className="mt-1 text-gray-600">
                            Vendor:{" "}
                            <span className="font-medium text-gray-800">
                                {payout.vendor?.store_name ||
                                    payout.vendor?.name ||
                                    payout.vendor?.user?.name ||
                                    "Unknown vendor"}
                            </span>
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                            Period: {formatDate(payout.period_start)}
                            {" - "}
                            {formatDate(payout.period_end)}
                        </p>
                    </div>

                    <span
                        className={`inline-flex w-fit rounded-full border px-3 py-1 text-sm font-medium ${getStatusClass(
                            payout.status
                        )}`}
                    >
                        {formatStatus(payout.status)}
                    </span>
                </div>

                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {success}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <SummaryCard
                        label="Gross Sales"
                        value={formatMoney(
                            payout.gross_sales,
                            currency
                        )}
                    />

                    <SummaryCard
                        label="Commission"
                        value={formatMoney(
                            payout.commission_amount,
                            currency
                        )}
                    />

                    <SummaryCard
                        label="Net Payout"
                        value={formatMoney(
                            payout.net_amount,
                            currency
                        )}
                    />
                </div>

                <form
                    onSubmit={handleStatusUpdate}
                    className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
                >
                    <h2 className="text-lg font-semibold text-gray-950">
                        Update Status
                    </h2>

                    <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Status
                            </label>

                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                disabled={isPaid}
                                className="h-11 w-full rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                            >
                                {statusOptions.map((statusOption) => (
                                    <option
                                        key={statusOption}
                                        value={statusOption}
                                    >
                                        {formatStatus(statusOption)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="lg:col-span-2">
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Note
                            </label>

                            <input
                                type="text"
                                value={note}
                                onChange={(event) =>
                                    setNote(event.target.value)
                                }
                                disabled={isPaid}
                                placeholder="Optional payout note"
                                className="h-11 w-full rounded-xl border border-gray-300 px-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                            />
                        </div>
                    </div>

                    {isPaid ? (
                        <p className="mt-4 text-sm text-gray-500">
                            Paid payout-এর status আর পরিবর্তন করা যাবে না।
                        </p>
                    ) : (
                        <button
                            type="submit"
                            disabled={saving}
                            className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                            ) : (
                                <Save size={17} />
                            )}

                            Save
                        </button>
                    )}
                </form>

                <div className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-5 sm:px-6">
                        <ShoppingCart size={20} />

                        <h2 className="text-lg font-semibold text-gray-950">
                            Orders in This Payout
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                                    <th className="px-5 py-4 font-medium sm:px-6">
                                        Order
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Order Status
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Payment Status
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Gross
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Commission
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Net
                                    </th>

                                    <th className="px-5 py-4 font-medium sm:px-6">
                                        Created
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {orders.length > 0 ? (
                                    orders.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-gray-100 text-sm last:border-b-0"
                                        >
                                            <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-950 sm:px-6">
                                                {getOrderNumber(item)}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-gray-700">
                                                {formatStatus(
                                                    item.order?.status
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-gray-700">
                                                {formatStatus(
                                                    item.order?.payment_status
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-gray-700">
                                                {formatMoney(
                                                    item.gross_amount,
                                                    currency
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-gray-700">
                                                {formatMoney(
                                                    item.commission_amount,
                                                    currency
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-950">
                                                {formatMoney(
                                                    item.net_amount,
                                                    currency
                                                )}
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-gray-600 sm:px-6">
                                                {formatDateTime(
                                                    item.order?.created_at ||
                                                        item.created_at
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="7"
                                            className="px-6 py-16 text-center text-sm text-gray-500"
                                        >
                                            এই payout-এ কোনো order পাওয়া যায়নি।
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SummaryCard = ({ label, value }) => {
    return (
        <div className="flex min-h-40 flex-col justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-600">
                {label}
            </p>

            <h3 className="mt-8 text-2xl font-semibold text-gray-950 sm:text-3xl">
                {value}
            </h3>
        </div>
    );
};

export default AdminFinancePayoutDetails;