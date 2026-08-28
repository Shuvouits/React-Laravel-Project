import {
    ArrowDownRight,
    LoaderCircle,
    ReceiptText,
    ShoppingBag,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import api from "../../../api/axios";

const VendorOwedToPlatform = () => {
    const [summary, setSummary] = useState({
        you_owe: 0,
        orders: 0,
        currency: "USD",
    });

    const [entries, setEntries] = useState([]);

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
        from: 0,
        to: 0,
    });

    const [range, setRange] = useState("30_days");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchOwedEntries(1);
    }, [range]);

    const fetchOwedEntries = async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/vendor/finance/owed",
                {
                    params: {
                        range,
                        page,
                        per_page: 20,
                    },
                }
            );

            const data = response.data || {};
            const entryResponse =
                data.entries || {};

            setSummary({
                you_owe:
                    data.summary?.you_owe || 0,

                orders:
                    data.summary?.orders || 0,

                currency:
                    data.summary?.currency || "USD",
            });

            setEntries(
                entryResponse.data || []
            );

            setPagination({
                current_page:
                    entryResponse.current_page || 1,

                last_page:
                    entryResponse.last_page || 1,

                per_page:
                    entryResponse.per_page || 20,

                total:
                    entryResponse.total || 0,

                from:
                    entryResponse.from || 0,

                to:
                    entryResponse.to || 0,
            });
        } catch (error) {
            console.error(
                "Owed to platform error:",
                error.response?.data ||
                error.message
            );

            setError(
                error.response?.data?.message ||
                "Owed balance load করা সম্ভব হয়নি।"
            );

            setEntries([]);
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

        fetchOwedEntries(page);
    };

    return (
        <div className="min-h-screen bg-[#f7f7f8] p-[28px]">
            <div className="mx-auto max-w-[1600px]">
                <div className="flex items-end justify-between gap-[20px]">
                    <div>
                        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#111111]">
                            Owed to the marketplace
                        </h1>

                        <p className="mt-[4px] text-[14px] text-[#6f6f6f]">
                            Commission on orders you collected yourself. The money is already yours; this is what you owe on it.
                        </p>
                    </div>

                    <select
                        value={range}
                        onChange={(event) =>
                            setRange(
                                event.target.value
                            )
                        }
                        className="h-[42px] min-w-[178px] rounded-[12px] border border-[#dedede] bg-white px-[15px] text-[14px] text-[#222222] outline-none focus:border-[#2563eb]"
                    >
                        <option value="7_days">
                            Last 7 days
                        </option>

                        <option value="30_days">
                            Last 30 days
                        </option>

                        <option value="90_days">
                            Last 90 days
                        </option>

                        <option value="year">
                            This year
                        </option>

                        <option value="all">
                            All time
                        </option>
                    </select>
                </div>

                {error && (
                    <div className="mt-[16px] rounded-[12px] border border-red-200 bg-red-50 px-[16px] py-[12px] text-[13px] text-red-600">
                        {error}
                    </div>
                )}

                <section className="mt-[22px] grid grid-cols-2 gap-[14px]">
                    <SummaryCard
                        label="You owe"
                        value={formatMoney(
                            summary.you_owe,
                            summary.currency
                        )}
                        description="Commission on orders you collected yourself"
                        icon={ArrowDownRight}
                        loading={loading}
                    />

                    <SummaryCard
                        label="Orders"
                        value={formatNumber(
                            summary.orders
                        )}
                        description="Vendor-collected paid orders in this period"
                        icon={ShoppingBag}
                        loading={loading}
                    />
                </section>

                <section className="mt-[16px] rounded-[16px] border border-[#dedede] bg-white p-[16px] shadow-sm">
                    <div className="overflow-hidden rounded-[14px] border border-[#dedede]">
                        <div className="grid grid-cols-[220px_260px_minmax(260px,1fr)_230px_230px] border-b border-[#dedede] bg-[#fcfcfc] px-[18px] py-[14px] text-[13px] font-semibold text-[#222222]">
                            <span>Date</span>
                            <span>Type</span>
                            <span>Reference</span>
                            <span className="text-right">
                                Held for you
                            </span>
                            <span className="text-right">
                                You owe
                            </span>
                        </div>

                        {loading ? (
                            <LoadingState />
                        ) : entries.length === 0 ? (
                            <EmptyState />
                        ) : (
                            entries.map((entry) => (
                                <OwedEntryRow
                                    key={entry.id}
                                    entry={entry}
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

const SummaryCard = ({
    label,
    value,
    description,
    icon: Icon,
    loading,
}) => {
    return (
        <div className="relative min-h-[132px] rounded-[14px] border border-[#dedede] bg-white px-[22px] py-[20px]">
            <Icon
                size={20}
                strokeWidth={1.7}
                className="absolute right-[21px] top-[21px] text-[#696969]"
            />

            <p className="text-[14px] text-[#696969]">
                {label}
            </p>

            {loading ? (
                <div className="mt-[12px] h-[29px] w-[105px] animate-pulse rounded-[6px] bg-[#eeeeee]" />
            ) : (
                <p className="mt-[9px] text-[24px] font-semibold tracking-[-0.02em] text-[#111111]">
                    {value}
                </p>
            )}

            <p className="mt-[5px] text-[12px] text-[#777777]">
                {description}
            </p>
        </div>
    );
};

const OwedEntryRow = ({
    entry,
}) => {
    const heldAmount = Number(
        entry.held_amount || 0
    );

    const owedAmount = Number(
        entry.owed_amount || 0
    );

    const currency =
        entry.currency || "USD";

    return (
        <div className="grid min-h-[55px] grid-cols-[220px_260px_minmax(260px,1fr)_230px_230px] items-center border-b border-[#e7e7e7] px-[18px] text-[13px] last:border-b-0 hover:bg-[#fafafa]">
            <span className="text-[#222222]">
                {formatDate(
                    entry.occurred_at
                )}
            </span>

            <div>
                <TypeBadge
                    type={entry.type}
                />
            </div>

            <span className="truncate pr-[15px] text-[#696969]">
                {entry.reference || "—"}
            </span>

            <span
                className={`text-right font-medium ${
                    heldAmount < 0
                        ? "text-red-600"
                        : heldAmount > 0
                            ? "text-[#111111]"
                            : "text-[#777777]"
                }`}
            >
                {heldAmount !== 0
                    ? formatSignedMoney(
                          heldAmount,
                          currency
                      )
                    : "—"}
            </span>

            <span
                className={`text-right font-medium ${
                    owedAmount < 0
                        ? "text-green-600"
                        : owedAmount > 0
                            ? "text-[#e66d00]"
                            : "text-[#777777]"
                }`}
            >
                {owedAmount !== 0
                    ? formatSignedMoney(
                          owedAmount,
                          currency
                      )
                    : "—"}
            </span>
        </div>
    );
};

const TypeBadge = ({
    type,
}) => {
    const commissionRefund =
        type === "commission_refund";

    return (
        <span
            className={`inline-flex rounded-full px-[10px] py-[4px] text-[11px] font-medium ${
                commissionRefund
                    ? "bg-[#f3e8ff] text-[#7e22ce]"
                    : "bg-[#edf2f8] text-[#334155]"
            }`}
        >
            {commissionRefund
                ? "Commission refund"
                : "Commission"}
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
                Loading commission entries...
            </p>
        </div>
    );
};

const EmptyState = () => {
    return (
        <div className="flex min-h-[230px] flex-col items-center justify-center px-[20px] text-center">
            <ReceiptText
                size={34}
                strokeWidth={1.5}
                className="text-[#929292]"
            />

            <p className="mt-[12px] text-[14px] font-medium text-[#555555]">
                Nothing owed for this period
            </p>

            <p className="mt-[4px] text-[12px] text-[#888888]">
                Commission from vendor-collected orders will appear here.
            </p>
        </div>
    );
};

const Pagination = ({
    pagination,
    onPageChange,
}) => {
    return (
        <div className="mt-[18px] flex items-center justify-between px-[4px]">
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
                    className="h-[36px] rounded-[9px] border border-[#dedede] bg-white px-[14px] text-[13px] text-[#555555] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Previous
                </button>

                <span className="flex h-[36px] min-w-[36px] items-center justify-center rounded-[9px] bg-[#2467d5] px-[10px] text-[13px] font-semibold text-white">
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
                    className="h-[36px] rounded-[9px] border border-[#dedede] bg-white px-[14px] text-[13px] text-[#555555] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
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

const formatSignedMoney = (
    value,
    currency
) => {
    const amount = Number(value || 0);

    if (amount < 0) {
        return `-${formatMoney(
            Math.abs(amount),
            currency
        )}`;
    }

    return formatMoney(
        amount,
        currency
    );
};

const formatNumber = (value) => {
    return new Intl.NumberFormat(
        "en-US"
    ).format(
        Number(value || 0)
    );
};

const formatDate = (value) => {
    if (!value) {
        return "—";
    }

    return new Date(value)
        .toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric",
            }
        );
};

export default VendorOwedToPlatform;