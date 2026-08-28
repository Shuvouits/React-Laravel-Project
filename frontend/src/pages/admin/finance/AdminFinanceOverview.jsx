import { useCallback, useEffect, useState } from "react";

import {
    ArrowDownRight,
    ArrowUpRight,
    Banknote,
    CircleDollarSign,
    Landmark,
    LoaderCircle,
    ReceiptText,
    RefreshCw,
    TrendingUp,
    WalletCards,
} from "lucide-react";

import api from "../../../api/axios";

const emptyData = {
    books: {
        own_store: {
            income: 0,
            costs: 0,
            net: 0,
        },
        marketplace: {
            income: 0,
            costs: 0,
            net: 0,
        },
    },

    summary: {
        income: 0,
        costs: 0,
        net: 0,
        order_volume: 0,
    },

    income_sources: {
        product_sales: 0,
        own_store_product_sales: 0,
        marketplace_product_sales: 0,
        commission: 0,
        shipping_charged: 0,
        refunds: 0,
        income: 0,
    },

    cost_sources: {
        own_store_expenses: 0,
        marketplace_expenses: 0,
        total_expenses: 0,
    },

    balances: {
        in_gateway: 0,
        in_bank: 0,
        cash_in_hand: 0,
        owed_to_vendors: 0,
        commission_owed_to_admin: 0,
        pending_payout_amount: 0,
        paid_payout_amount: 0,
        tax_collected: 0,
    },
};

const periodOptions = [
    {
        value: "today",
        label: "Today",
    },
    {
        value: "last_7_days",
        label: "Last 7 days",
    },
    {
        value: "last_30_days",
        label: "Last 30 days",
    },
    {
        value: "last_90_days",
        label: "Last 90 days",
    },
    {
        value: "this_month",
        label: "This month",
    },
    {
        value: "this_year",
        label: "This year",
    },
    {
        value: "all_time",
        label: "All time",
    },
];

const bookOptions = [
    {
        value: "both",
        label: "Both books",
    },
    {
        value: "own_store",
        label: "Own store",
    },
    {
        value: "marketplace",
        label: "Marketplace",
    },
];

const formatMoney = (amount) => {
    const value = Number(amount || 0);

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

const periodLabel = (period) => {
    return (
        periodOptions.find(
            (item) => item.value === period
        )?.label || "Last 30 days"
    );
};

const SummaryCard = ({
    title,
    value,
    description,
    icon: Icon,
}) => {
    return (
        <div className="rounded-[16px] border border-[#dedfe4] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[15px] font-medium text-[#6b6b72]">
                        {title}
                    </p>

                    <p className="mt-3 text-[25px] font-semibold tracking-[-0.03em] text-[#111111]">
                        {formatMoney(value)}
                    </p>

                    <p className="mt-1 truncate text-[14px] text-[#77777f]">
                        {description}
                    </p>
                </div>

                <Icon
                    size={21}
                    strokeWidth={1.8}
                    className="mt-1 shrink-0 text-[#73747a]"
                />
            </div>
        </div>
    );
};

const BookCard = ({
    title,
    description,
    income,
    costs,
    net,
}) => {
    return (
        <div className="rounded-[20px] border border-[#dcdee3] bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.05)]">
            <h2 className="text-[18px] font-semibold text-[#111111]">
                {title}
            </h2>

            <p className="mt-2 text-[14px] text-[#686970]">
                {description}
            </p>

            <div className="mt-9 space-y-3">
                <MoneyRow
                    label="Income"
                    value={income}
                />

                <MoneyRow
                    label="Costs"
                    value={costs}
                />

                <div className="border-t border-[#e5e5e8] pt-3">
                    <MoneyRow
                        label="Net"
                        value={net}
                        strong
                        green
                    />
                </div>
            </div>
        </div>
    );
};

const MoneyRow = ({
    label,
    value,
    strong = false,
    green = false,
}) => {
    return (
        <div className="flex items-center justify-between gap-4">
            <span
                className={
                    strong
                        ? "font-semibold text-[#111111]"
                        : "text-[#6c6c73]"
                }
            >
                {label}
            </span>

            <span
                className={[
                    "text-right",
                    strong ? "font-semibold" : "font-medium",
                    green ? "text-[#00a63e]" : "text-[#111111]",
                ].join(" ")}
            >
                {formatMoney(value)}
            </span>
        </div>
    );
};

const FinanceListCard = ({
    title,
    rows,
    totalLabel,
    totalValue,
}) => {
    return (
        <div className="rounded-[18px] border border-[#dedfe4] bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <h2 className="text-[18px] font-semibold text-[#111111]">
                {title}
            </h2>

            <div className="mt-8 space-y-3">
                {rows.map((row) => (
                    <MoneyRow
                        key={row.label}
                        label={row.label}
                        value={row.value}
                    />
                ))}

                <div className="border-t border-[#e5e5e8] pt-3">
                    <MoneyRow
                        label={totalLabel}
                        value={totalValue}
                        strong
                    />
                </div>
            </div>
        </div>
    );
};

const AdminFinanceOverview = () => {
    const [finance, setFinance] =
        useState(emptyData);

    const [period, setPeriod] =
        useState("last_30_days");

    const [book, setBook] =
        useState("both");

    const [loading, setLoading] =
        useState(true);

    const [refreshing, setRefreshing] =
        useState(false);

    const [error, setError] =
        useState("");

    const fetchOverview = useCallback(
        async (manualRefresh = false) => {
            try {
                if (manualRefresh) {
                    setRefreshing(true);
                } else {
                    setLoading(true);
                }

                setError("");

                const response = await api.get(
                    "/admin/finance/overview",
                    {
                        params: {
                            period,
                            book,
                        },
                    }
                );

                const data = response.data || {};

                setFinance({
                    ...emptyData,
                    ...data,

                    books: {
                        ...emptyData.books,
                        ...(data.books || {}),

                        own_store: {
                            ...emptyData.books.own_store,
                            ...(data.books?.own_store || {}),
                        },

                        marketplace: {
                            ...emptyData.books.marketplace,
                            ...(data.books?.marketplace || {}),
                        },
                    },

                    summary: {
                        ...emptyData.summary,
                        ...(data.summary || {}),
                    },

                    income_sources: {
                        ...emptyData.income_sources,
                        ...(data.income_sources || {}),
                    },

                    cost_sources: {
                        ...emptyData.cost_sources,
                        ...(data.cost_sources || {}),
                    },

                    balances: {
                        ...emptyData.balances,
                        ...(data.balances || {}),
                    },
                });
            } catch (error) {
                console.error(
                    "Admin finance overview error:",
                    error.response?.data ||
                    error.message
                );

                setError(
                    error.response?.data?.message ||
                    "Unable to load finance overview."
                );
            } finally {
                setLoading(false);
                setRefreshing(false);
            }
        },
        [period, book]
    );

    useEffect(() => {
        fetchOverview();
    }, [fetchOverview]);

    const ownStore =
        finance.books.own_store;

    const marketplace =
        finance.books.marketplace;

    const summary =
        finance.summary;

    const incomeSources =
        finance.income_sources;

    const costSources =
        finance.cost_sources;

    const balances =
        finance.balances;

    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <LoaderCircle
                    size={34}
                    className="animate-spin text-[#2563eb]"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f7f9] px-7 py-8 xl:px-10">
            <div className="mx-auto max-w-[1600px]">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h1 className="text-[30px] font-semibold tracking-[-0.035em] text-[#111111]">
                            Finance
                        </h1>

                        <p className="mt-1 text-[15px] text-[#6d6d75]">
                            What the business earned, what it spent, and what it is holding.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={book}
                            onChange={(event) => {
                                setBook(event.target.value);
                            }}
                            className="h-11 min-w-[170px] rounded-[14px] border border-[#dedfe4] bg-white px-4 text-[14px] text-[#171717] outline-none focus:border-[#2563eb]"
                        >
                            {bookOptions.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <select
                            value={period}
                            onChange={(event) => {
                                setPeriod(event.target.value);
                            }}
                            className="h-11 min-w-[170px] rounded-[14px] border border-[#dedfe4] bg-white px-4 text-[14px] text-[#171717] outline-none focus:border-[#2563eb]"
                        >
                            {periodOptions.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={() => fetchOverview(true)}
                            disabled={refreshing}
                            className="flex h-11 w-11 items-center justify-center rounded-[14px] border border-[#dedfe4] bg-white text-[#55565d] transition hover:bg-[#f1f3f6] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw
                                size={18}
                                className={
                                    refreshing
                                        ? "animate-spin"
                                        : ""
                                }
                            />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mt-5 rounded-[14px] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-[14px] text-[#b42318]">
                        {error}
                    </div>
                )}

                <div className="mt-7 grid gap-4 xl:grid-cols-2">
                    <BookCard
                        title="Own store"
                        description="You are the seller. All revenue and stock costs belong to the store."
                        income={ownStore.income}
                        costs={ownStore.costs}
                        net={ownStore.net}
                    />

                    <BookCard
                        title="Marketplace"
                        description="The store acts as an agent. Commission and marketplace fees are income."
                        income={marketplace.income}
                        costs={marketplace.costs}
                        net={marketplace.net}
                    />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="Income"
                        value={summary.income}
                        description={periodLabel(period)}
                        icon={TrendingUp}
                    />

                    <SummaryCard
                        title="Costs"
                        value={summary.costs}
                        description={periodLabel(period)}
                        icon={ArrowDownRight}
                    />

                    <SummaryCard
                        title="Net"
                        value={summary.net}
                        description="Income less costs"
                        icon={ArrowUpRight}
                    />

                    <SummaryCard
                        title="Order volume"
                        value={summary.order_volume}
                        description="Everything sold through the store"
                        icon={Banknote}
                    />
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    <FinanceListCard
                        title="Where it came from"
                        rows={[
                            {
                                label: "Product sales",
                                value: incomeSources.product_sales,
                            },
                            {
                                label: "Marketplace product sales",
                                value: incomeSources.marketplace_product_sales,
                            },
                            {
                                label: "Commission",
                                value: incomeSources.commission,
                            },
                            {
                                label: "Shipping charged",
                                value: incomeSources.shipping_charged,
                            },
                            {
                                label: "Refunds",
                                value: incomeSources.refunds,
                            },
                        ]}
                        totalLabel="Income"
                        totalValue={summary.income}
                    />

                    <FinanceListCard
                        title="Where it went"
                        rows={[
                            {
                                label: "Own store expenses",
                                value: costSources.own_store_expenses,
                            },
                            {
                                label: "Marketplace expenses",
                                value: costSources.marketplace_expenses,
                            },
                        ]}
                        totalLabel="Costs"
                        totalValue={costSources.total_expenses}
                    />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="In the gateway"
                        value={balances.in_gateway}
                        description="Online payment providers"
                        icon={WalletCards}
                    />

                    <SummaryCard
                        title="In the bank"
                        value={balances.in_bank}
                        description="Cleared payout balance"
                        icon={Landmark}
                    />

                    <SummaryCard
                        title="Cash in hand"
                        value={balances.cash_in_hand}
                        description="Registers and cash payments"
                        icon={Banknote}
                    />

                    <SummaryCard
                        title="Tax collected"
                        value={balances.tax_collected}
                        description="Charged to buyers and owed onward"
                        icon={ReceiptText}
                    />
                </div>

                <div className="mt-5 grid gap-4 xl:grid-cols-2">
                    <SummaryCard
                        title="Owed to vendors"
                        value={balances.owed_to_vendors}
                        description="Held on their behalf until a payout clears"
                        icon={ArrowUpRight}
                    />

                    <SummaryCard
                        title="Commission owed to you"
                        value={balances.commission_owed_to_admin}
                        description="On sales vendors collected themselves"
                        icon={ArrowDownRight}
                    />
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <SummaryCard
                        title="Pending payout amount"
                        value={balances.pending_payout_amount}
                        description="Waiting or currently processing"
                        icon={WalletCards}
                    />

                    <SummaryCard
                        title="Paid payout amount"
                        value={balances.paid_payout_amount}
                        description="Completed vendor payouts"
                        icon={CircleDollarSign}
                    />
                </div>

                <div className="mt-5 rounded-[14px] border border-[#fdba74] bg-[#fffaf0] px-4 py-3 text-[13px] text-[#b45309]">
                    Some figures may come from older orders placed before complete finance tracking was enabled.
                </div>
            </div>
        </div>
    );
};

export default AdminFinanceOverview;