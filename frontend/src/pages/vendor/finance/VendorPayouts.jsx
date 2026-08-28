import {
    ArrowDownUp,
    ChevronLeft,
    ChevronRight,
    Eye,
    LoaderCircle,
    Search,
    WalletCards,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";

import api from "../../../api/axios";

const VendorPayouts = () => {
    const navigate = useNavigate();

    const [payouts, setPayouts] = useState([]);

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
        from: 0,
        to: 0,
    });

    const [activeStatus, setActiveStatus] =
        useState("all");

    const [search, setSearch] = useState("");
    const [sortDirection, setSortDirection] =
        useState("desc");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchPayouts(1);
        }, search.trim() ? 400 : 0);

        return () => {
            clearTimeout(timer);
        };
    }, [
        activeStatus,
        search,
        sortDirection,
    ]);

    const fetchPayouts = async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/vendor/finance/payouts",
                {
                    params: {
                        status: activeStatus,
                        search: search.trim(),
                        sort_direction:
                            sortDirection,
                        page,
                        per_page: 20,
                    },
                }
            );

            const payoutResponse =
                response.data?.payouts || {};

            const rows =
                payoutResponse.data || [];

            if (sortDirection === "asc") {
                rows.sort(
                    (first, second) =>
                        new Date(
                            first.created_at
                        ) -
                        new Date(
                            second.created_at
                        )
                );
            }

            setPayouts(rows);

            setPagination({
                current_page:
                    payoutResponse.current_page || 1,

                last_page:
                    payoutResponse.last_page || 1,

                per_page:
                    payoutResponse.per_page || 20,

                total:
                    payoutResponse.total || 0,

                from:
                    payoutResponse.from || 0,

                to:
                    payoutResponse.to || 0,
            });
        } catch (error) {
            console.error(
                "Vendor payouts error:",
                error.response?.data ||
                error.message
            );

            setError(
                error.response?.data?.message ||
                "Payouts load করা সম্ভব হয়নি।"
            );

            setPayouts([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        if (
            page < 1 ||
            page > pagination.last_page
        ) {
            return;
        }

        fetchPayouts(page);
    };

    const statusTabs = [
        {
            key: "all",
            label: "All statuses",
        },
        {
            key: "pending",
            label: "Pending",
        },
        {
            key: "processing",
            label: "Processing",
        },
        {
            key: "paid",
            label: "Paid",
        },
        {
            key: "failed",
            label: "Failed",
        },
        {
            key: "cancelled",
            label: "Cancelled",
        },
    ];

    return (
        <div className="min-h-screen bg-[#f7f7f8] p-[28px]">
            <div className="mx-auto max-w-[1600px]">
                <div>
                    <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#111111]">
                        Payouts
                    </h1>

                    <p className="mt-[4px] text-[14px] text-[#6f6f6f]">
                        Track your settlement statements and payout statuses.
                    </p>
                </div>

                {error && (
                    <div className="mt-[16px] rounded-[12px] border border-red-200 bg-red-50 px-[16px] py-[12px] text-[13px] text-red-600">
                        {error}
                    </div>
                )}

                <section className="mt-[22px] rounded-[16px] border border-[#dedede] bg-white p-[24px] shadow-sm">
                    <h2 className="text-[20px] font-semibold text-[#171717]">
                        Payout Statements
                    </h2>

                    <div className="mt-[18px] overflow-hidden rounded-[14px] border border-[#dedede]">
                        <div className="flex min-h-[66px] items-end justify-between border-b border-[#dedede] px-[22px]">
                            <div className="flex h-full items-end gap-[26px]">
                                {statusTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() =>
                                            setActiveStatus(
                                                tab.key
                                            )
                                        }
                                        className={`relative h-full pb-[20px] pt-[22px] text-[14px] transition ${
                                            activeStatus ===
                                            tab.key
                                                ? "font-semibold text-[#171717]"
                                                : "font-medium text-[#666666] hover:text-[#222222]"
                                        }`}
                                    >
                                        {tab.label}

                                        {activeStatus ===
                                            tab.key && (
                                            <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#171717]" />
                                        )}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setSortDirection(
                                        (previous) =>
                                            previous ===
                                            "desc"
                                                ? "asc"
                                                : "desc"
                                    )
                                }
                                className="mb-[14px] flex h-[36px] w-[36px] items-center justify-center rounded-[9px] text-[#777777] transition hover:bg-[#f3f3f3] hover:text-[#222222]"
                                title="Change sort direction"
                            >
                                <ArrowDownUp size={17} />
                            </button>
                        </div>

                        <div className="border-b border-[#dedede] px-[18px] py-[13px]">
                            <div className="relative max-w-[585px]">
                                <Search
                                    size={17}
                                    className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[#818181]"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(
                                            event.target.value
                                        )
                                    }
                                    placeholder="Search payout number"
                                    className="h-[42px] w-full rounded-[12px] border border-[#dedede] bg-[#fafafa] pl-[42px] pr-[14px] text-[14px] text-[#222222] outline-none transition placeholder:text-[#888888] focus:border-[#2467d5] focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-[minmax(280px,1.4fr)_220px_220px_minmax(300px,1fr)_100px] border-b border-[#dedede] bg-[#fcfcfc] px-[26px] py-[14px] text-[12px] font-medium text-[#666666]">
                            <span>Payout</span>
                            <span>Status</span>
                            <span>Amount</span>
                            <span>Period</span>
                            <span className="text-right">
                                Details
                            </span>
                        </div>

                        {loading ? (
                            <LoadingState />
                        ) : payouts.length === 0 ? (
                            <EmptyState />
                        ) : (
                            payouts.map((payout) => (
                                <PayoutRow
                                    key={payout.id}
                                    payout={payout}
                                    onView={() =>
                                        navigate(
                                            `/vendor/finance/payouts/${payout.id}`
                                        )
                                    }
                                />
                            ))
                        )}
                    </div>

                    {!loading &&
                        pagination.total > 0 && (
                            <Pagination
                                pagination={
                                    pagination
                                }
                                onPageChange={
                                    handlePageChange
                                }
                            />
                        )}
                </section>
            </div>
        </div>
    );
};

const PayoutRow = ({
    payout,
    onView,
}) => {
    return (
        <div className="grid min-h-[74px] grid-cols-[minmax(280px,1.4fr)_220px_220px_minmax(300px,1fr)_100px] items-center border-b border-[#e5e5e5] px-[26px] text-[13px] last:border-b-0 hover:bg-[#fafafa]">
            <button
                type="button"
                onClick={onView}
                className="w-fit font-semibold text-[#135de5] hover:underline"
            >
                {payout.payout_no}
            </button>

            <div>
                <PayoutStatus
                    status={payout.status}
                />
            </div>

            <span className="font-semibold text-[#111111]">
                {formatMoney(
                    payout.net_payout,
                    payout.currency
                )}
            </span>

            <span className="text-[#696969]">
                {formatPeriod(
                    payout.period_start,
                    payout.period_end
                )}
            </span>

            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={onView}
                    className="flex h-[38px] w-[38px] items-center justify-center rounded-[10px] border border-[#dedede] bg-[#f8f8f8] text-[#686868] transition hover:border-[#bfcceb] hover:bg-[#eef4ff] hover:text-[#2467d5]"
                    title="View payout details"
                >
                    <Eye size={17} />
                </button>
            </div>
        </div>
    );
};

const PayoutStatus = ({
    status,
}) => {
    const styles = {
        pending:
            "border-[#f4d48a] bg-[#fff8e6] text-[#986600]",

        processing:
            "border-[#bfd5ff] bg-[#edf4ff] text-[#1d5db8]",

        paid:
            "border-[#9de8c1] bg-[#ecfff5] text-[#08783e]",

        failed:
            "border-[#ffc1bd] bg-[#fff1f0] text-[#c92525]",

        cancelled:
            "border-[#d8d8d8] bg-[#f5f5f5] text-[#666666]",
    };

    return (
        <span
            className={`inline-flex rounded-full border px-[10px] py-[4px] text-[11px] font-medium capitalize ${
                styles[status] ||
                styles.pending
            }`}
        >
            {status || "pending"}
        </span>
    );
};

const LoadingState = () => {
    return (
        <div className="flex min-h-[230px] flex-col items-center justify-center">
            <LoaderCircle
                size={28}
                className="animate-spin text-[#2467d5]"
            />

            <p className="mt-[10px] text-[13px] text-[#777777]">
                Loading payouts...
            </p>
        </div>
    );
};

const EmptyState = () => {
    return (
        <div className="flex min-h-[230px] flex-col items-center justify-center px-[20px] text-center">
            <WalletCards
                size={35}
                strokeWidth={1.5}
                className="text-[#929292]"
            />

            <p className="mt-[12px] text-[14px] font-medium text-[#555555]">
                No payouts found
            </p>

            <p className="mt-[4px] text-[12px] text-[#888888]">
                Marketplace payouts will appear here when they are created.
            </p>
        </div>
    );
};

const Pagination = ({
    pagination,
    onPageChange,
}) => {
    return (
        <div className="mt-[18px] flex items-center justify-between">
            <p className="text-[13px] text-[#686868]">
                Showing {pagination.from || 0} to{" "}
                {pagination.to || 0} of{" "}
                {pagination.total || 0} results
            </p>

            <div className="flex items-center gap-[8px]">
                <button
                    type="button"
                    disabled={
                        pagination.current_page <= 1
                    }
                    onClick={() =>
                        onPageChange(
                            pagination.current_page - 1
                        )
                    }
                    className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#dedede] bg-white text-[#696969] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={17} />
                </button>

                <span className="flex h-[36px] min-w-[36px] items-center justify-center rounded-full bg-[#2467d5] px-[10px] text-[13px] font-semibold text-white">
                    {pagination.current_page}
                </span>

                <button
                    type="button"
                    disabled={
                        pagination.current_page >=
                        pagination.last_page
                    }
                    onClick={() =>
                        onPageChange(
                            pagination.current_page + 1
                        )
                    }
                    className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#dedede] bg-white text-[#696969] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronRight size={17} />
                </button>
            </div>
        </div>
    );
};

const formatMoney = (
    value,
    currency = "USD"
) => {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: currency || "USD",
        }
    ).format(
        Number(value || 0)
    );
};

const formatPeriod = (
    startDate,
    endDate
) => {
    return `${formatDate(startDate)} - ${formatDate(
        endDate
    )}`;
};

const formatDate = (value) => {
    if (!value) {
        return "—";
    }

    const normalizedValue =
        String(value).slice(0, 10);

    return new Date(
        `${normalizedValue}T00:00:00`
    ).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
        }
    );
};

export default VendorPayouts;