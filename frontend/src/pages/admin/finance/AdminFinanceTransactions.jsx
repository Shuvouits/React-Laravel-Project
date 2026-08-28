import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ChevronLeft,
    ChevronRight,
    Filter,
    LoaderCircle,
    RotateCcw,
    Search,
    SlidersHorizontal,
} from "lucide-react";

import api from "../../../api/axios";

const statusTabs = [
    { label: "All", value: "" },
    { label: "Succeeded", value: "succeeded" },
    { label: "Pending", value: "pending" },
    { label: "Failed", value: "failed" },
    { label: "Cancelled", value: "cancelled" },
];

const AdminFinanceTransactions = () => {
    const navigate = useNavigate();

    const [transactions, setTransactions] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
        from: 0,
        to: 0,
    });

    const [activeStatus, setActiveStatus] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const [provider, setProvider] = useState("");
    const [type, setType] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [sortDirection, setSortDirection] = useState("desc");
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(20);

    const [filterOpen, setFilterOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const searchTimer = window.setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 450);

        return () => {
            window.clearTimeout(searchTimer);
        };
    }, [searchInput]);

    useEffect(() => {
        fetchTransactions();
    }, [
        activeStatus,
        search,
        provider,
        type,
        dateFrom,
        dateTo,
        sortDirection,
        page,
        perPage,
    ]);

    const fetchTransactions = async () => {
        setLoading(true);
        setError("");

        try {
            const params = {
                page,
                per_page: perPage,
                sort_direction: sortDirection,
            };

            if (activeStatus) {
                params.status = activeStatus;
            }

            if (search) {
                params.search = search;
            }

            if (provider) {
                params.provider = provider;
            }

            if (type) {
                params.type = type;
            }

            if (dateFrom) {
                params.date_from = dateFrom;
            }

            if (dateTo) {
                params.date_to = dateTo;
            }

            const response = await api.get(
                "/admin/finance/transactions",
                { params }
            );

            const responseData = response.data?.data || response.data;

            if (Array.isArray(responseData)) {
                setTransactions(responseData);

                setPagination({
                    current_page: 1,
                    last_page: 1,
                    per_page: responseData.length || perPage,
                    total: responseData.length,
                    from: responseData.length ? 1 : 0,
                    to: responseData.length,
                });

                return;
            }

            const paginator =
                responseData?.transactions ||
                responseData;

            const transactionItems =
                paginator?.data ||
                responseData?.items ||
                [];

            setTransactions(transactionItems);

            setPagination({
                current_page:
                    paginator?.current_page ||
                    responseData?.current_page ||
                    page,

                last_page:
                    paginator?.last_page ||
                    responseData?.last_page ||
                    1,

                per_page:
                    paginator?.per_page ||
                    responseData?.per_page ||
                    perPage,

                total:
                    paginator?.total ||
                    responseData?.total ||
                    transactionItems.length,

                from:
                    paginator?.from ||
                    responseData?.from ||
                    (transactionItems.length ? 1 : 0),

                to:
                    paginator?.to ||
                    responseData?.to ||
                    transactionItems.length,
            });
        } catch (requestError) {
            setTransactions([]);

            setError(
                requestError.response?.data?.message ||
                "Unable to load payment transactions."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = (status) => {
        setActiveStatus(status);
        setPage(1);
    };

    const handleResetFilters = () => {
        setProvider("");
        setType("");
        setDateFrom("");
        setDateTo("");
        setPage(1);
    };

    const handlePerPageChange = (event) => {
        setPerPage(Number(event.target.value));
        setPage(1);
    };

    const handleViewOrder = (transaction) => {
        const orderId =
            transaction?.order?.id ||
            transaction?.order_id;

        if (!orderId) {
            setError("This transaction has no related order.");
            return;
        }

        navigate(`/admin/orders/${orderId}`);
    };

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

    const getOrderNumber = (transaction) => {
        return (
            transaction?.order?.order_no ||
            transaction?.order?.order_number ||
            transaction?.order_no ||
            transaction?.reference ||
            "—"
        );
    };

    const getType = (transaction) => {
        return (
            transaction?.type ||
            transaction?.transaction_type ||
            "charge"
        );
    };

    const getProvider = (transaction) => {
        return (
            transaction?.provider ||
            transaction?.gateway ||
            transaction?.payment_method ||
            "Unknown"
        );
    };

    const getGrossAmount = (transaction) => {
        return (
            transaction?.gross_amount ??
            transaction?.amount ??
            0
        );
    };

    const getNetAmount = (transaction) => {
        if (
            transaction?.net_amount !== null &&
            transaction?.net_amount !== undefined
        ) {
            return transaction.net_amount;
        }

        const amount = Number(
            transaction?.amount ??
            transaction?.gross_amount ??
            0
        );

        const transactionType = String(
            getType(transaction)
        ).toLowerCase();

        if (
            transactionType === "refund" ||
            transactionType === "refunded"
        ) {
            return -Math.abs(amount);
        }

        return amount;
    };

    const hasActiveFilters =
        provider ||
        type ||
        dateFrom ||
        dateTo;

    return (
        <div className="min-h-screen bg-[#f6f7f9] p-5 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px]">
                <div className="mb-7">
                    <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                        Payment Transactions
                    </h1>

                    <p className="mt-1 text-sm text-gray-600 sm:text-base">
                        Review all charge, refund and adjustment events.
                    </p>
                </div>

                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5 py-5 sm:px-6">
                        <h2 className="text-xl font-semibold text-gray-950">
                            Transactions
                        </h2>
                    </div>

                    <div className="flex items-center justify-between gap-5 overflow-x-auto border-b border-gray-200 px-5 sm:px-6">
                        <div className="flex min-w-max items-center gap-6">
                            {statusTabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    type="button"
                                    onClick={() =>
                                        handleStatusChange(tab.value)
                                    }
                                    className={`relative py-4 text-sm font-medium transition ${
                                        activeStatus === tab.value
                                            ? "text-gray-950"
                                            : "text-gray-600 hover:text-gray-900"
                                    }`}
                                >
                                    {tab.label}

                                    {activeStatus === tab.value && (
                                        <span className="absolute inset-x-0 bottom-0 h-0.5 bg-gray-950" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                setSortDirection((current) =>
                                    current === "desc"
                                        ? "asc"
                                        : "desc"
                                )
                            }
                            className="shrink-0 py-3 text-sm font-medium text-gray-600 hover:text-gray-950"
                        >
                            Date {sortDirection === "desc" ? "↓" : "↑"}
                        </button>
                    </div>

                    <div className="border-b border-gray-200 px-5 py-3 sm:px-6">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="relative w-full md:max-w-xl">
                                <Search
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                                />

                                <input
                                    type="search"
                                    value={searchInput}
                                    onChange={(event) =>
                                        setSearchInput(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search by order or external ID"
                                    className="h-11 w-full rounded-xl border border-gray-300 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setFilterOpen((current) => !current)
                                }
                                className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
                                    filterOpen || hasActiveFilters
                                        ? "border-blue-200 bg-blue-50 text-blue-700"
                                        : "border-gray-300 bg-white text-gray-800 hover:bg-gray-50"
                                }`}
                            >
                                <SlidersHorizontal size={17} />
                                Filter

                                {hasActiveFilters && (
                                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                                )}
                            </button>
                        </div>

                        {filterOpen && (
                            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Transaction type
                                        </label>

                                        <select
                                            value={type}
                                            onChange={(event) => {
                                                setType(event.target.value);
                                                setPage(1);
                                            }}
                                            className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="">
                                                All types
                                            </option>

                                            <option value="charge">
                                                Charge
                                            </option>

                                            <option value="refund">
                                                Refund
                                            </option>

                                            <option value="adjustment">
                                                Adjustment
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Provider
                                        </label>

                                        <select
                                            value={provider}
                                            onChange={(event) => {
                                                setProvider(
                                                    event.target.value
                                                );
                                                setPage(1);
                                            }}
                                            className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        >
                                            <option value="">
                                                All providers
                                            </option>

                                            <option value="stripe">
                                                Stripe
                                            </option>

                                            <option value="paypal">
                                                PayPal
                                            </option>

                                            <option value="razorpay">
                                                Razorpay
                                            </option>

                                            <option value="paystack">
                                                Paystack
                                            </option>

                                            <option value="pesapal">
                                                Pesapal
                                            </option>

                                            <option value="iotec_pay">
                                                ioTec Pay
                                            </option>

                                            <option value="cash_on_delivery">
                                                Cash on Delivery
                                            </option>

                                            <option value="pos_cash">
                                                POS Cash
                                            </option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Date from
                                        </label>

                                        <input
                                            type="date"
                                            value={dateFrom}
                                            onChange={(event) => {
                                                setDateFrom(
                                                    event.target.value
                                                );
                                                setPage(1);
                                            }}
                                            className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Date to
                                        </label>

                                        <input
                                            type="date"
                                            value={dateTo}
                                            min={dateFrom || undefined}
                                            onChange={(event) => {
                                                setDateTo(
                                                    event.target.value
                                                );
                                                setPage(1);
                                            }}
                                            className="h-11 w-full rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        disabled={!hasActiveFilters}
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <RotateCcw size={16} />
                                        Reset filters
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative overflow-x-auto">
                        {loading && (
                            <div className="absolute inset-0 z-10 flex min-h-[300px] items-center justify-center bg-white/75">
                                <LoaderCircle
                                    size={32}
                                    className="animate-spin text-blue-600"
                                />
                            </div>
                        )}

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
                                        Status
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Provider
                                    </th>

                                    <th className="px-5 py-4 text-right font-medium">
                                        Gross
                                    </th>

                                    <th className="px-5 py-4 text-right font-medium">
                                        Net
                                    </th>

                                    <th className="px-5 py-4 font-medium">
                                        Date
                                    </th>

                                    <th className="px-5 py-4 text-right font-medium sm:px-6">
                                        Details
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {!loading && transactions.length > 0 ? (
                                    transactions.map(
                                        (transaction, index) => {
                                            const currency =
                                                transaction.currency ||
                                                "USD";

                                            return (
                                                <tr
                                                    key={
                                                        transaction.id ||
                                                        transaction.external_id ||
                                                        index
                                                    }
                                                    className="border-b border-gray-100 text-sm last:border-b-0 hover:bg-gray-50/70"
                                                >
                                                    <td className="whitespace-nowrap px-5 py-4 font-medium text-blue-600 sm:px-6">
                                                        {getOrderNumber(
                                                            transaction
                                                        )}
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-gray-900">
                                                        {formatText(
                                                            getType(
                                                                transaction
                                                            )
                                                        )}
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4">
                                                        <span
                                                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                                                                transaction.status
                                                            )}`}
                                                        >
                                                            <span className="h-2 w-2 rounded-full bg-current" />

                                                            {formatText(
                                                                transaction.status
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-gray-900">
                                                        {formatText(
                                                            getProvider(
                                                                transaction
                                                            )
                                                        )}
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-right font-medium text-gray-950">
                                                        {formatMoney(
                                                            getGrossAmount(
                                                                transaction
                                                            ),
                                                            currency
                                                        )}
                                                    </td>

                                                    <td
                                                        className={`whitespace-nowrap px-5 py-4 text-right font-medium ${
                                                            Number(
                                                                getNetAmount(
                                                                    transaction
                                                                )
                                                            ) < 0
                                                                ? "text-red-600"
                                                                : "text-gray-950"
                                                        }`}
                                                    >
                                                        {formatMoney(
                                                            getNetAmount(
                                                                transaction
                                                            ),
                                                            currency
                                                        )}
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                                        {formatDateTime(
                                                            transaction.created_at ||
                                                                transaction.processed_at
                                                        )}
                                                    </td>

                                                    <td className="whitespace-nowrap px-5 py-4 text-right sm:px-6">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                handleViewOrder(
                                                                    transaction
                                                                )
                                                            }
                                                            disabled={
                                                                !transaction?.order_id &&
                                                                !transaction
                                                                    ?.order?.id
                                                            }
                                                            className="inline-flex h-9 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                                        >
                                                            View Order
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )
                                ) : !loading ? (
                                    <tr>
                                        <td
                                            colSpan="8"
                                            className="px-6 py-20 text-center"
                                        >
                                            <Filter
                                                size={38}
                                                className="mx-auto text-gray-300"
                                            />

                                            <h3 className="mt-4 font-semibold text-gray-900">
                                                No transactions found
                                            </h3>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Try changing the search or
                                                filter options.
                                            </p>
                                        </td>
                                    </tr>
                                ) : null}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-gray-200 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                        <p className="text-sm text-gray-600">
                            Showing {pagination.from || 0} to{" "}
                            {pagination.to || 0} of{" "}
                            {pagination.total || 0} results
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">
                                    Rows per page
                                </span>

                                <select
                                    value={perPage}
                                    onChange={handlePerPageChange}
                                    className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
                                >
                                    <option value="10">10</option>
                                    <option value="20">20</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setPage((current) =>
                                        Math.max(1, current - 1)
                                    )
                                }
                                disabled={pagination.current_page <= 1}
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-blue-600 px-3 text-sm font-semibold text-white">
                                {pagination.current_page}
                            </span>

                            <button
                                type="button"
                                onClick={() =>
                                    setPage((current) =>
                                        Math.min(
                                            pagination.last_page,
                                            current + 1
                                        )
                                    )
                                }
                                disabled={
                                    pagination.current_page >=
                                    pagination.last_page
                                }
                                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const getStatusClass = (status) => {
    const normalizedStatus = String(status || "").toLowerCase();

    if (
        normalizedStatus === "succeeded" ||
        normalizedStatus === "completed" ||
        normalizedStatus === "paid"
    ) {
        return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (normalizedStatus === "pending") {
        return "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (
        normalizedStatus === "failed" ||
        normalizedStatus === "cancelled"
    ) {
        return "border-red-200 bg-red-50 text-red-700";
    }

    return "border-gray-200 bg-gray-50 text-gray-700";
};

export default AdminFinanceTransactions;