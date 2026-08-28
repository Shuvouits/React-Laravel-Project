import {
    ArrowDownRight,
    ArrowUpRight,
    CircleDollarSign,
    HandCoins,
    LoaderCircle,
    Wallet,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import api from "../../../api/axios";

const VendorFinanceOverview = () => {
    const [summary, setSummary] = useState({
        opening_balance: 0,
        earned: 0,
        paid_out: 0,
        held_for_you: 0,
        you_owe: 0,
        currency: "USD",
    });

    const [activity, setActivity] = useState([]);
    const [range, setRange] = useState("30_days");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchOverview();
    }, [range]);

    const fetchOverview = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/vendor/finance/overview",
                {
                    params: {
                        range,
                    },
                }
            );

            const data = response.data || {};

            setSummary({
                opening_balance:
                    data.summary?.opening_balance || 0,

                earned:
                    data.summary?.earned || 0,

                paid_out:
                    data.summary?.paid_out || 0,

                held_for_you:
                    data.summary?.held_for_you || 0,

                you_owe:
                    data.summary?.you_owe || 0,

                currency:
                    data.summary?.currency || "USD",
            });

            setActivity(
                data.activity || []
            );
        } catch (error) {
            console.error(
                "Finance overview error:",
                error.response?.data ||
                error.message
            );

            setError(
                error.response?.data?.message ||
                "Finance overview load করা সম্ভব হয়নি।"
            );

            setActivity([]);
        } finally {
            setLoading(false);
        }
    };

    const cards = [
        {
            label: "Opening balance",
            value: summary.opening_balance,
            description:
                "Carried in from before this period",
            icon: Wallet,
        },
        {
            label: "Earned",
            value: summary.earned,
            description:
                "Your share of sales, after commission",
            icon: ArrowUpRight,
        },
        {
            label: "Paid out",
            value: summary.paid_out,
            description:
                "Transferred to your payout account",
            icon: HandCoins,
        },
        {
            label: "Held for you",
            value: summary.held_for_you,
            description:
                "Waiting for the next payout",
            icon: CircleDollarSign,
        },
        {
            label: "You owe",
            value: summary.you_owe,
            description:
                "Commission on orders you collected",
            icon: ArrowDownRight,
        },
    ];

    return (
        <div className="min-h-screen bg-[#f7f7f8] p-[28px]">
            <div className="mx-auto max-w-[1600px]">
                <div className="flex items-end justify-between gap-[20px]">
                    <div>
                        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#111111]">
                            Your finances
                        </h1>

                        <p className="mt-[4px] text-[14px] text-[#6f6f6f]">
                            What you earned, what was paid out, and what the marketplace is holding for you.
                        </p>
                    </div>

                    <select
                        value={range}
                        onChange={(event) =>
                            setRange(event.target.value)
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

                <section className="mt-[22px] grid grid-cols-5 gap-[12px]">
                    {cards.map((card) => (
                        <FinanceCard
                            key={card.label}
                            card={card}
                            currency={summary.currency}
                            loading={loading}
                        />
                    ))}
                </section>

                <section className="mt-[18px] overflow-hidden rounded-[16px] border border-[#dedede] bg-white shadow-sm">
                    <div className="border-b border-[#e6e6e6] px-[24px] py-[22px]">
                        <h2 className="text-[18px] font-semibold text-[#171717]">
                            Activity
                        </h2>
                    </div>

                    <div className="p-[16px]">
                        <div className="overflow-hidden rounded-[14px] border border-[#dedede]">
                            <div className="grid grid-cols-[180px_260px_minmax(220px,1fr)_220px_220px] border-b border-[#dedede] bg-[#fcfcfc] px-[18px] py-[14px] text-[13px] font-semibold text-[#222222]">
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
                            ) : activity.length === 0 ? (
                                <EmptyState />
                            ) : (
                                activity.map((entry) => (
                                    <ActivityRow
                                        key={entry.id}
                                        entry={entry}
                                        currency={
                                            entry.currency ||
                                            summary.currency
                                        }
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

const FinanceCard = ({
    card,
    currency,
    loading,
}) => {
    const Icon = card.icon;

    return (
        <div className="relative min-h-[132px] overflow-hidden rounded-[14px] border border-[#dedede] bg-white px-[22px] py-[20px]">
            <Icon
                size={20}
                strokeWidth={1.7}
                className="absolute right-[20px] top-[20px] text-[#6f6f6f]"
            />

            <p className="pr-[32px] text-[14px] text-[#696969]">
                {card.label}
            </p>

            {loading ? (
                <div className="mt-[12px] h-[29px] w-[115px] animate-pulse rounded-[6px] bg-[#eeeeee]" />
            ) : (
                <p className="mt-[10px] text-[24px] font-semibold tracking-[-0.02em] text-[#111111]">
                    {formatMoney(
                        card.value,
                        currency
                    )}
                </p>
            )}

            <p className="mt-[5px] truncate text-[12px] text-[#777777]">
                {card.description}
            </p>
        </div>
    );
};

const ActivityRow = ({
    entry,
    currency,
}) => {
    const heldAmount = Number(
        entry.held_amount || 0
    );

    const owedAmount = Number(
        entry.owed_amount || 0
    );

    return (
        <div className="grid min-h-[54px] grid-cols-[180px_260px_minmax(220px,1fr)_220px_220px] items-center border-b border-[#e7e7e7] px-[18px] text-[13px] last:border-b-0 hover:bg-[#fafafa]">
            <span className="text-[#222222]">
                {formatDate(entry.occurred_at)}
            </span>

            <div>
                <FinanceTypeBadge
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

const FinanceTypeBadge = ({
    type,
}) => {
    const styles = {
        sale:
            "bg-[#dcfce7] text-[#08783e]",

        refund:
            "bg-[#fee2e2] text-[#c92525]",

        commission:
            "bg-[#edf2f8] text-[#334155]",

        commission_refund:
            "bg-[#f3e8ff] text-[#7e22ce]",

        payout:
            "bg-[#dbeafe] text-[#1d4ed8]",

        adjustment:
            "bg-[#fff3cd] text-[#946200]",
    };

    const labels = {
        sale: "Sale",
        refund: "Refund",
        commission: "Commission",
        commission_refund:
            "Commission refund",
        payout: "Payout",
        adjustment: "Adjustment",
    };

    return (
        <span
            className={`inline-flex rounded-full px-[10px] py-[4px] text-[11px] font-medium ${
                styles[type] ||
                styles.adjustment
            }`}
        >
            {labels[type] || type}
        </span>
    );
};

const LoadingState = () => {
    return (
        <div className="flex min-h-[190px] flex-col items-center justify-center">
            <LoaderCircle
                size={28}
                className="animate-spin text-[#2467d5]"
            />

            <p className="mt-[10px] text-[13px] text-[#777777]">
                Loading finance activity...
            </p>
        </div>
    );
};

const EmptyState = () => {
    return (
        <div className="flex min-h-[190px] flex-col items-center justify-center px-[20px] text-center">
            <Wallet
                size={34}
                strokeWidth={1.5}
                className="text-[#9a9a9a]"
            />

            <p className="mt-[12px] text-[14px] font-medium text-[#555555]">
                No finance activity yet
            </p>

            <p className="mt-[4px] text-[12px] text-[#888888]">
                Paid sales, refunds, commissions and payouts will appear here.
            </p>
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

export default VendorFinanceOverview;