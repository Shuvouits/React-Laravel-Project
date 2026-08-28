import {
    ArrowLeft,
    LoaderCircle,
    ReceiptText,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import api from "../../../api/axios";

const VendorPayoutDetails = () => {
    const {
        id,
    } = useParams();

    const navigate = useNavigate();

    const [payout, setPayout] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchPayout();
    }, [id]);

    const fetchPayout = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                `/vendor/finance/payouts/${id}`
            );

            setPayout(
                response.data?.payout || null
            );
        } catch (error) {
            console.error(
                "Payout details error:",
                error.response?.data ||
                error.message
            );

            setError(
                error.response?.data?.message ||
                "Payout details load করা সম্ভব হয়নি।"
            );

            setPayout(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <PageLoading />
        );
    }

    if (error || !payout) {
        return (
            <PageError
                message={
                    error ||
                    "Payout পাওয়া যায়নি।"
                }
                onBack={() =>
                    navigate(
                        "/vendor/finance/payouts"
                    )
                }
            />
        );
    }

    const orders = Array.isArray(
        payout.orders
    )
        ? payout.orders
        : [];

    const summaryCards = [
        {
            label: "Gross Sales",
            value: payout.gross_sales,
        },
        {
            label: "Commission",
            value: payout.commission_total,
        },
        {
            label: "Net Payout",
            value: payout.net_payout,
        },
    ];

    return (
        <div className="min-h-screen bg-[#f7f7f8] p-[28px]">
            <div className="mx-auto max-w-[1600px]">
                <button
                    type="button"
                    onClick={() =>
                        navigate(
                            "/vendor/finance/payouts"
                        )
                    }
                    className="mb-[16px] flex h-[38px] items-center gap-[7px] rounded-[10px] border border-[#dedede] bg-white px-[13px] text-[13px] font-medium text-[#555555] transition hover:bg-[#f3f3f3] hover:text-[#222222]"
                >
                    <ArrowLeft size={16} />
                    Back to payouts
                </button>

                <div className="flex items-start justify-between gap-[20px]">
                    <div>
                        <h1 className="text-[31px] font-semibold tracking-[-0.03em] text-[#111111]">
                            {payout.payout_no}
                        </h1>

                        <p className="mt-[3px] text-[14px] text-[#6f6f6f]">
                            Period:{" "}
                            {formatPeriod(
                                payout.period_start,
                                payout.period_end
                            )}
                        </p>
                    </div>

                    <PayoutStatus
                        status={payout.status}
                    />
                </div>

                <section className="mt-[26px] grid grid-cols-3 gap-[16px]">
                    {summaryCards.map((card) => (
                        <div
                            key={card.label}
                            className="min-h-[158px] rounded-[17px] border border-[#dedede] bg-white px-[27px] py-[25px] shadow-sm"
                        >
                            <p className="text-[14px] font-medium text-[#666666]">
                                {card.label}
                            </p>

                            <p className="mt-[46px] text-[29px] font-semibold tracking-[-0.03em] text-[#111111]">
                                {formatMoney(
                                    card.value,
                                    payout.currency
                                )}
                            </p>
                        </div>
                    ))}
                </section>

                {(Number(payout.refund_total) !== 0 ||
                    Number(
                        payout.adjustment_total
                    ) !== 0) && (
                    <section className="mt-[16px] grid grid-cols-2 gap-[16px]">
                        <SummaryItem
                            label="Refunds"
                            value={
                                payout.refund_total
                            }
                            currency={
                                payout.currency
                            }
                        />

                        <SummaryItem
                            label="Adjustments"
                            value={
                                payout.adjustment_total
                            }
                            currency={
                                payout.currency
                            }
                        />
                    </section>
                )}

                <section className="mt-[26px] rounded-[17px] border border-[#dedede] bg-white p-[26px] shadow-sm">
                    <h2 className="text-[19px] font-semibold text-[#171717]">
                        Orders Included
                    </h2>

                    <div className="mt-[24px] overflow-hidden rounded-[13px] border border-[#dedede]">
                        <div className="grid grid-cols-[240px_240px_240px_220px_minmax(250px,1fr)] border-b border-[#dedede] bg-[#fcfcfc] px-[20px] py-[14px] text-[12px] font-semibold text-[#666666]">
                            <span>Order</span>
                            <span>Order Status</span>
                            <span>Payment Status</span>
                            <span>Total</span>
                            <span>Created</span>
                        </div>

                        {orders.length === 0 ? (
                            <OrdersEmptyState />
                        ) : (
                            orders.map((order) => (
                                <OrderRow
                                    key={order.id}
                                    order={order}
                                    currency={
                                        payout.currency
                                    }
                                />
                            ))
                        )}
                    </div>
                </section>

                <PayoutInformation
                    payout={payout}
                />
            </div>
        </div>
    );
};

const OrderRow = ({
    order,
    currency,
}) => {
    const orderTotal =
        order.pivot?.gross_amount ??
        order.grand_total ??
        0;

    return (
        <div className="grid min-h-[55px] grid-cols-[240px_240px_240px_220px_minmax(250px,1fr)] items-center border-b border-[#e7e7e7] px-[20px] text-[13px] last:border-b-0 hover:bg-[#fafafa]">
            <span className="font-medium text-[#202020]">
                {order.order_no}
            </span>

            <span className="capitalize text-[#333333]">
                {formatStatus(
                    order.status
                )}
            </span>

            <span className="capitalize text-[#333333]">
                {formatStatus(
                    order.payment_status
                )}
            </span>

            <span className="font-medium text-[#171717]">
                {formatMoney(
                    orderTotal,
                    currency
                )}
            </span>

            <span className="text-[#666666]">
                {formatDateTime(
                    order.created_at
                )}
            </span>
        </div>
    );
};

const SummaryItem = ({
    label,
    value,
    currency,
}) => {
    return (
        <div className="rounded-[14px] border border-[#dedede] bg-white px-[22px] py-[18px]">
            <p className="text-[13px] text-[#696969]">
                {label}
            </p>

            <p className="mt-[6px] text-[20px] font-semibold text-[#171717]">
                {formatMoney(
                    value,
                    currency
                )}
            </p>
        </div>
    );
};

const PayoutInformation = ({
    payout,
}) => {
    const hasInformation =
        payout.payment_method ||
        payout.payment_reference ||
        payout.paid_at ||
        payout.failure_reason ||
        payout.note;

    if (!hasInformation) {
        return null;
    }

    return (
        <section className="mt-[20px] rounded-[17px] border border-[#dedede] bg-white p-[26px] shadow-sm">
            <h2 className="text-[19px] font-semibold text-[#171717]">
                Payout Information
            </h2>

            <div className="mt-[20px] grid grid-cols-3 gap-x-[30px] gap-y-[20px]">
                <InformationItem
                    label="Payment method"
                    value={
                        payout.payment_method ||
                        "Not specified"
                    }
                />

                <InformationItem
                    label="Payment reference"
                    value={
                        payout.payment_reference ||
                        "Not available"
                    }
                />

                <InformationItem
                    label="Paid at"
                    value={
                        payout.paid_at
                            ? formatDateTime(
                                  payout.paid_at
                              )
                            : "Not paid yet"
                    }
                />

                {payout.failure_reason && (
                    <div className="col-span-3">
                        <InformationItem
                            label="Failure reason"
                            value={
                                payout.failure_reason
                            }
                        />
                    </div>
                )}

                {payout.note && (
                    <div className="col-span-3">
                        <InformationItem
                            label="Note"
                            value={payout.note}
                        />
                    </div>
                )}
            </div>
        </section>
    );
};

const InformationItem = ({
    label,
    value,
}) => {
    return (
        <div>
            <p className="text-[12px] font-medium text-[#777777]">
                {label}
            </p>

            <p className="mt-[5px] text-[14px] text-[#222222]">
                {value}
            </p>
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
            className={`inline-flex rounded-full border px-[12px] py-[5px] text-[12px] font-medium capitalize ${
                styles[status] ||
                styles.pending
            }`}
        >
            {status || "pending"}
        </span>
    );
};

const OrdersEmptyState = () => {
    return (
        <div className="flex min-h-[180px] flex-col items-center justify-center px-[20px] text-center">
            <ReceiptText
                size={34}
                strokeWidth={1.5}
                className="text-[#929292]"
            />

            <p className="mt-[11px] text-[14px] font-medium text-[#555555]">
                No orders included
            </p>

            <p className="mt-[4px] text-[12px] text-[#888888]">
                This payout does not have any linked orders.
            </p>
        </div>
    );
};

const PageLoading = () => {
    return (
        <div className="flex min-h-[calc(100vh-74px)] items-center justify-center bg-[#f7f7f8]">
            <div className="text-center">
                <LoaderCircle
                    size={32}
                    className="mx-auto animate-spin text-[#2467d5]"
                />

                <p className="mt-[11px] text-[13px] text-[#777777]">
                    Loading payout details...
                </p>
            </div>
        </div>
    );
};

const PageError = ({
    message,
    onBack,
}) => {
    return (
        <div className="flex min-h-[calc(100vh-74px)] items-center justify-center bg-[#f7f7f8] p-[28px]">
            <div className="w-full max-w-[500px] rounded-[16px] border border-red-200 bg-white p-[28px] text-center">
                <p className="text-[14px] text-red-600">
                    {message}
                </p>

                <button
                    type="button"
                    onClick={onBack}
                    className="mt-[18px] h-[40px] rounded-[10px] bg-[#2467d5] px-[18px] text-[13px] font-semibold text-white"
                >
                    Back to payouts
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
            month: "numeric",
            day: "numeric",
            year: "numeric",
        }
    );
};

const formatDateTime = (value) => {
    if (!value) {
        return "—";
    }

    return new Date(value)
        .toLocaleString(
            "en-US",
            {
                month: "numeric",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
            }
        );
};

const formatStatus = (value) => {
    if (!value) {
        return "Unknown";
    }

    return String(value)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
};

export default VendorPayoutDetails;