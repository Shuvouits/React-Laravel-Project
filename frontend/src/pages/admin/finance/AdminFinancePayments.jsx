import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowRight,
    CreditCard,
    LoaderCircle,
    RefreshCw,
    RotateCcw,
    WalletCards,
} from "lucide-react";

import api from "../../../api/axios";

const AdminFinancePayments = () => {
    const navigate = useNavigate();

    const [summary, setSummary] = useState({
        paid_revenue: 0,
        refunded_amount: 0,
        pending_payments: 0,
        refunded_orders: 0,
        pending_payout_amount: 0,
        paid_payout_amount: 0,
        currency: "USD",
    });

    const [gateways, setGateways] = useState([]);
    const [transactions, setTransactions] = useState([]);

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const fetchPayments = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const response = await api.get(
                "/admin/finance/payments"
            );

            const data = response.data?.data || response.data;

            setSummary({
                paid_revenue:
                    data?.summary?.paid_revenue ??
                    data?.paid_revenue ??
                    0,

                refunded_amount:
                    data?.summary?.refunded_amount ??
                    data?.refunded_amount ??
                    0,

                pending_payments:
                    data?.summary?.pending_payments ??
                    data?.pending_payments ??
                    0,

                refunded_orders:
                    data?.summary?.refunded_orders ??
                    data?.refunded_orders ??
                    0,

                pending_payout_amount:
                    data?.summary?.pending_payout_amount ??
                    data?.pending_payout_amount ??
                    0,

                paid_payout_amount:
                    data?.summary?.paid_payout_amount ??
                    data?.paid_payout_amount ??
                    0,

                currency:
                    data?.summary?.currency ??
                    data?.currency ??
                    "USD",
            });

            setGateways(
                data?.gateways ||
                data?.gateway_health ||
                []
            );

            setTransactions(
                data?.recent_transactions ||
                data?.transactions ||
                []
            );
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Unable to load payment information."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchPayments();
    }, []);

    const formatMoney = (amount, currency = "USD") => {
        const numericAmount = Number(amount || 0);

        try {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(numericAmount);
        } catch {
            return `$${numericAmount.toFixed(2)}`;
        }
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
            second: "2-digit",
        }).format(new Date(date));
    };

    const formatText = (value) => {
        if (!value) {
            return "Unknown";
        }

        return String(value)
            .replaceAll("_", " ")
            .replace(/\b\w/g, (letter) =>
                letter.toUpperCase()
            );
    };

    const getTransactionOrder = (transaction) => {
        return (
            transaction?.order?.order_no ||
            transaction?.order_no ||
            transaction?.reference ||
            transaction?.external_id ||
            "—"
        );
    };

    const getTransactionProvider = (transaction) => {
        return (
            transaction?.provider ||
            transaction?.gateway ||
            transaction?.payment_method ||
            "Unknown"
        );
    };

    const getTransactionType = (transaction) => {
        return (
            transaction?.type ||
            transaction?.transaction_type ||
            "charge"
        );
    };

    const getTransactionAmount = (transaction) => {
        return (
            transaction?.amount ??
            transaction?.gross_amount ??
            0
        );
    };

    const getGatewayName = (gateway) => {
        return (
            gateway?.name ||
            gateway?.label ||
            gateway?.gateway ||
            gateway?.provider ||
            "Unknown"
        );
    };

    const getGatewayStatus = (gateway) => {
        if (typeof gateway === "string") {
            return "connected";
        }

        return (
            gateway?.status ||
            gateway?.health ||
            "disabled"
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-[520px] items-center justify-center bg-[#f6f7f9]">
                <LoaderCircle
                    size={36}
                    className="animate-spin text-blue-600"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f7f9] p-5 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px]">
                <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                            Payments
                        </h1>

                        <p className="mt-1 text-sm text-gray-600 sm:text-base">
                            Monitor transactions, refunds and payout health.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() =>
                                navigate("/admin/finance/transactions")
                            }
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50"
                        >
                            Transactions
                            <ArrowRight size={17} />
                        </button>

                        <button
                            type="button"
                            onClick={() => fetchPayments(true)}
                            disabled={refreshing}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw
                                size={17}
                                className={
                                    refreshing ? "animate-spin" : ""
                                }
                            />

                            Refresh
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
                    <SummaryCard
                        label="Paid Revenue"
                        value={formatMoney(
                            summary.paid_revenue,
                            summary.currency
                        )}
                        icon={CreditCard}
                    />

                    <SummaryCard
                        label="Refunded Amount"
                        value={formatMoney(
                            summary.refunded_amount,
                            summary.currency
                        )}
                        icon={RotateCcw}
                    />

                    <SummaryCard
                        label="Pending Payments"
                        value={Number(
                            summary.pending_payments || 0
                        ).toLocaleString()}
                        icon={WalletCards}
                    />

                    <SummaryCard
                        label="Refunded Orders"
                        value={Number(
                            summary.refunded_orders || 0
                        ).toLocaleString()}
                        icon={RotateCcw}
                    />

                    <SummaryCard
                        label="Pending Payout Amount"
                        value={formatMoney(
                            summary.pending_payout_amount,
                            summary.currency
                        )}
                        icon={WalletCards}
                    />

                    <SummaryCard
                        label="Paid Payout Amount"
                        value={formatMoney(
                            summary.paid_payout_amount,
                            summary.currency
                        )}
                        icon={WalletCards}
                    />
                </div>

                <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                    <h2 className="text-lg font-semibold text-gray-950">
                        Gateway Health
                    </h2>

                    <div className="mt-5 flex flex-wrap gap-2">
                        {gateways.length > 0 ? (
                            gateways.map((gateway, index) => {
                                const status =
                                    getGatewayStatus(gateway);

                                return (
                                    <span
                                        key={
                                            gateway?.key ||
                                            gateway?.id ||
                                            index
                                        }
                                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getGatewayClass(
                                            status
                                        )}`}
                                    >
                                        {getGatewayName(gateway)}:{" "}
                                        {formatText(status).toLowerCase()}
                                    </span>
                                );
                            })
                        ) : (
                            <p className="text-sm text-gray-500">
                                No payment gateway information found.
                            </p>
                        )}
                    </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-gray-200 px-5 py-5 sm:px-6">
                        <h2 className="text-xl font-semibold text-gray-950">
                            Recent Transactions
                        </h2>

                        <button
                            type="button"
                            onClick={() =>
                                navigate("/admin/finance/transactions")
                            }
                            className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                            View all
                            <ArrowRight size={16} />
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200 text-left text-sm text-gray-600">
                                    <th className="px-5 py-4 font-medium sm:px-6">
                                        Order
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Type
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Provider
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Status
                                    </th>

                                    <th className="px-5 py-4 text-right font-medium">
                                        Amount
                                    </th>

                                    <th className="px-5 py-4 font-medium sm:px-6">
                                        Date
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {transactions.length > 0 ? (
                                    transactions.map(
                                        (transaction, index) => (
                                            <tr
                                                key={
                                                    transaction.id ||
                                                    transaction.external_id ||
                                                    index
                                                }
                                                className="border-b border-gray-100 text-sm last:border-b-0 hover:bg-gray-50/70"
                                            >
                                                <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-950 sm:px-6">
                                                    {getTransactionOrder(
                                                        transaction
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-gray-800">
                                                    {formatText(
                                                        getTransactionType(
                                                            transaction
                                                        )
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-gray-800">
                                                    {formatText(
                                                        getTransactionProvider(
                                                            transaction
                                                        )
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getTransactionStatusClass(
                                                            transaction.status
                                                        )}`}
                                                    >
                                                        {formatText(
                                                            transaction.status
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-gray-950">
                                                    {formatMoney(
                                                        getTransactionAmount(
                                                            transaction
                                                        ),
                                                        transaction.currency ||
                                                            summary.currency
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-gray-600 sm:px-6">
                                                    {formatDateTime(
                                                        transaction.created_at ||
                                                            transaction.processed_at
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    )
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="6"
                                            className="px-6 py-16 text-center"
                                        >
                                            <CreditCard
                                                size={36}
                                                className="mx-auto text-gray-300"
                                            />

                                            <h3 className="mt-4 font-semibold text-gray-900">
                                                No transactions found
                                            </h3>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Payment transactions will
                                                appear here.
                                            </p>
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

const SummaryCard = ({ label, value, icon: Icon }) => {
    return (
        <div className="min-h-[130px] rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <p
                    title={label}
                    className="truncate text-sm text-gray-600"
                >
                    {label}
                </p>

                <Icon
                    size={19}
                    className="shrink-0 text-gray-500"
                />
            </div>

            <h2 className="mt-4 break-words text-xl font-semibold text-gray-950">
                {value}
            </h2>
        </div>
    );
};

const getGatewayClass = (status) => {
    const normalizedStatus = String(status || "").toLowerCase();

    if (
        normalizedStatus === "connected" ||
        normalizedStatus === "active" ||
        normalizedStatus === "enabled"
    ) {
        return "border-blue-600 bg-blue-600 text-white";
    }

    if (
        normalizedStatus === "needs_setup" ||
        normalizedStatus === "needs setup" ||
        normalizedStatus === "error"
    ) {
        return "border-red-600 bg-red-600 text-white";
    }

    return "border-gray-300 bg-white text-gray-700";
};

const getTransactionStatusClass = (status) => {
    const normalizedStatus = String(status || "").toLowerCase();

    if (
        normalizedStatus === "succeeded" ||
        normalizedStatus === "paid" ||
        normalizedStatus === "completed"
    ) {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (
        normalizedStatus === "failed" ||
        normalizedStatus === "cancelled"
    ) {
        return "border-red-200 bg-red-50 text-red-700";
    }

    return "border-amber-200 bg-amber-50 text-amber-700";
};

export default AdminFinancePayments;