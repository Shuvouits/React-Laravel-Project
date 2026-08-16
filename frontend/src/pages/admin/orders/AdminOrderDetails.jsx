import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    CreditCard,
    Download,
    LoaderCircle,
    Mail,
    MoreHorizontal,
    Package,
    Phone,
    Printer,
    RefreshCcw,
    Store,
    Truck,
    X,
    XCircle,
} from "lucide-react";

import api from "../../../api/axios";

const AdminOrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [actionLoading, setActionLoading] = useState(false);
    const [invoiceLoading, setInvoiceLoading] = useState(false);

    const [menuOpen, setMenuOpen] = useState(false);

    const [refundType, setRefundType] = useState(null);
    const [refundAmount, setRefundAmount] = useState("");
    const [refundLoading, setRefundLoading] = useState(false);
    const [refundError, setRefundError] = useState("");

    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        fetchOrder();
    }, [id]);

    useEffect(() => {
        const closeMenu = () => {
            setMenuOpen(false);
        };

        document.addEventListener("click", closeMenu);

        return () => {
            document.removeEventListener("click", closeMenu);
        };
    }, []);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(`/admin/orders/${id}`);

            setOrder(response.data?.order || null);
        } catch (error) {
            console.error(
                "Order details error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to load order details."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleBack = () => {
        navigate("/admin/orders");
    };

    const handlePrint = () => {
        setMenuOpen(false);

        setTimeout(() => {
            window.print();
        }, 100);
    };

    const handleDownloadInvoice = async () => {
        if (invoiceLoading || !order) {
            return;
        }

        try {
            setInvoiceLoading(true);
            setMenuOpen(false);

            const response = await api.get(
                `/admin/orders/${order.id}/invoice`,
                {
                    responseType: "blob",
                }
            );

            const contentType =
                response.headers?.["content-type"] ||
                "application/pdf";

            if (!contentType.includes("application/pdf")) {
                const text = await response.data.text();

                let message = "Unable to download invoice.";

                try {
                    const data = JSON.parse(text);
                    message = data.message || message;
                } catch {
                    if (text) {
                        message = text;
                    }
                }

                throw new Error(message);
            }

            const blob = new Blob([response.data], {
                type: "application/pdf",
            });

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");

            link.href = url;
            link.download = `invoice-${order.order_no}.pdf`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(
                "Invoice download error:",
                error
            );

            let message =
                error.message ||
                "Unable to download invoice.";

            if (error.response?.data instanceof Blob) {
                try {
                    const text =
                        await error.response.data.text();

                    const data =
                        JSON.parse(text);

                    message =
                        data.message ||
                        message;
                } catch {
                    //
                }
            } else if (
                error.response?.data?.message
            ) {
                message =
                    error.response.data.message;
            }

            alert(message);
        } finally {
            setInvoiceLoading(false);
        }
    };

    const handleMarkPaid = async () => {
        if (actionLoading || !order) {
            return;
        }

        try {
            setActionLoading(true);
            setMenuOpen(false);

            await api.post(
                `/admin/orders/${order.id}/mark-paid`
            );

            setSuccessMessage(
                "Order marked as paid successfully."
            );

            await fetchOrder();

            setTimeout(() => {
                setSuccessMessage("");
            }, 4000);
        } catch (error) {
            console.error(
                "Mark paid error:",
                error.response?.data ||
                error.message
            );

            alert(
                error.response?.data?.message ||
                "Unable to mark order as paid."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkShipped = async () => {
        if (actionLoading || !order) {
            return;
        }

        const confirmed = window.confirm(
            `Mark ${order.order_no} as shipped?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);
            setMenuOpen(false);

            await api.post(
                `/admin/orders/${order.id}/mark-shipped`
            );

            setSuccessMessage(
                "Order marked as shipped successfully."
            );

            await fetchOrder();

            setTimeout(() => {
                setSuccessMessage("");
            }, 4000);
        } catch (error) {
            console.error(
                "Mark shipped error:",
                error.response?.data ||
                error.message
            );

            alert(
                error.response?.data?.message ||
                "Unable to mark order as shipped."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelOrder = async () => {
        if (actionLoading || !order) {
            return;
        }

        const confirmed = window.confirm(
            `Cancel ${order.order_no}?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setActionLoading(true);
            setMenuOpen(false);

            await api.post(
                `/admin/orders/${order.id}/cancel`
            );

            setSuccessMessage(
                "Order cancelled successfully."
            );

            await fetchOrder();

            setTimeout(() => {
                setSuccessMessage("");
            }, 4000);
        } catch (error) {
            console.error(
                "Cancel order error:",
                error.response?.data ||
                error.message
            );

            alert(
                error.response?.data?.message ||
                "Unable to cancel order."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const openFullRefund = () => {
        setMenuOpen(false);
        setRefundError("");
        setRefundAmount("");
        setRefundType("full");
    };

    const openPartialRefund = () => {
        setMenuOpen(false);
        setRefundError("");
        setRefundAmount("");
        setRefundType("partial");
    };

    const closeRefundModal = () => {
        if (refundLoading) {
            return;
        }

        setRefundType(null);
        setRefundAmount("");
        setRefundError("");
    };

    const handleRefund = async () => {
        if (!refundType || refundLoading || !order) {
            return;
        }

        const refundableAmount =
            getRefundableAmount(order);

        if (refundType === "partial") {
            const amount =
                Number(refundAmount);

            if (!amount || amount <= 0) {
                setRefundError(
                    "Enter a valid refund amount."
                );

                return;
            }

            if (amount > refundableAmount) {
                setRefundError(
                    `Refund cannot exceed ${formatMoney(refundableAmount)}.`
                );

                return;
            }
        }

        try {
            setRefundLoading(true);
            setRefundError("");
            setSuccessMessage("");

            if (refundType === "full") {
                await api.post(
                    `/admin/orders/${order.id}/refund/full`
                );
            }

            if (refundType === "partial") {
                await api.post(
                    `/admin/orders/${order.id}/refund/partial`,
                    {
                        amount: Number(refundAmount),
                    }
                );
            }

            const message =
                refundType === "full"
                    ? "Full refund processed successfully."
                    : "Partial refund processed successfully.";

            setRefundType(null);
            setRefundAmount("");

            setSuccessMessage(message);

            await fetchOrder();

            setTimeout(() => {
                setSuccessMessage("");
            }, 5000);
        } catch (error) {
            console.error(
                "Refund error:",
                error.response?.data ||
                error.message
            );

            setRefundError(
                error.response?.data?.message ||
                "Unable to process refund."
            );
        } finally {
            setRefundLoading(false);
        }
    };

    if (loading) {
        return <PageLoader />;
    }

    if (error) {
        return (
            <OrderError
                message={error}
                onBack={handleBack}
            />
        );
    }

    if (!order) {
        return (
            <OrderError
                message="Order not found."
                onBack={handleBack}
            />
        );
    }

    const shippingAddress =
        order.shipping_address ||
        order.shippingAddress ||
        null;

    const billingAddress =
        order.billing_address ||
        order.billingAddress ||
        null;

    const items =
        Array.isArray(order.items)
            ? order.items
            : [];

    const transactions =
        Array.isArray(order.payment_transactions)
            ? order.payment_transactions
            : order.paymentTransactions || [];

    const paymentStatus =
        String(
            order.payment_status || ""
        ).toLowerCase();

    const paymentPaid =
        paymentStatus === "paid";

    const canMarkPaid =
        paymentStatus === "pending";

    const refundableAmount =
        getRefundableAmount(order);

    const canRefund =
        [
            "paid",
            "partially_refunded",
        ].includes(paymentStatus) &&
        refundableAmount > 0;

    return (
        <>
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden !important;
                        }

                        #order-print-area,
                        #order-print-area * {
                            visibility: visible !important;
                        }

                        #order-print-area {
                            position: absolute !important;
                            top: 0 !important;
                            left: 0 !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 20px !important;
                            background: white !important;
                        }

                        .order-print-hide {
                            display: none !important;
                        }

                        .order-print-card {
                            box-shadow: none !important;
                        }
                    }
                `}
            </style>

            <div
                id="order-print-area"
                className="min-h-screen bg-[#f6f6f7] px-[24px] py-[26px] font-['Inter']"
            >
                <div className="mx-auto max-w-[1500px]">

                    {successMessage && (
                        <div className="order-print-hide mb-[18px] rounded-[10px] border border-green-200 bg-green-50 px-[15px] py-[12px] text-[13px] font-medium text-green-700">
                            {successMessage}
                        </div>
                    )}

                    <div className="flex flex-col justify-between gap-[20px] lg:flex-row lg:items-start">

                        <div>
                            <div className="flex flex-wrap items-center gap-[8px]">

                                <h1 className="text-[26px] font-semibold tracking-[-0.5px] text-[#171717]">
                                    Order #{order.order_no}
                                </h1>

                                <PaymentStatusBadge
                                    status={order.payment_status}
                                />

                                <OrderStatusBadge
                                    status={order.status}
                                />

                                <ChannelBadge
                                    channel={order.channel}
                                />

                            </div>

                            <p className="mt-[8px] text-[14px] text-[#777]">
                                Placed on{" "}
                                {formatDateTime(
                                    order.placed_at ||
                                    order.created_at
                                )}
                            </p>
                        </div>

                        <div className="order-print-hide flex flex-wrap items-center gap-[8px]">

                            <button
                                type="button"
                                onClick={handlePrint}
                                className="flex h-[38px] items-center gap-[7px] rounded-full border border-[#dedede] bg-white px-[14px] text-[13px] font-medium text-[#222] transition hover:bg-[#f7f7f7]"
                            >
                                <Printer size={15} />
                                Print
                            </button>

                            <button
                                type="button"
                                onClick={handleDownloadInvoice}
                                disabled={invoiceLoading}
                                className="flex h-[38px] items-center gap-[7px] rounded-full border border-[#dedede] bg-white px-[14px] text-[13px] font-medium text-[#222] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {invoiceLoading ? (
                                    <LoaderCircle
                                        size={15}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Download size={15} />
                                )}

                                {invoiceLoading
                                    ? "Downloading..."
                                    : "Download Invoice"}
                            </button>

                            <button
                                type="button"
                                onClick={handleMarkShipped}
                                disabled={actionLoading}
                                className="flex h-[38px] items-center gap-[7px] rounded-full border border-[#dedede] bg-white px-[14px] text-[13px] font-medium text-[#222] transition hover:bg-[#f7f7f7] disabled:opacity-50"
                            >
                                <Truck size={15} />
                                Shipping Label
                            </button>

                            <div className="relative">

                                <button
                                    type="button"
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        setMenuOpen(!menuOpen);
                                    }}
                                    disabled={actionLoading}
                                    className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#dedede] bg-white text-[#333] transition hover:bg-[#f7f7f7] disabled:opacity-50"
                                >
                                    {actionLoading ? (
                                        <LoaderCircle
                                            size={16}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <MoreHorizontal size={17} />
                                    )}
                                </button>

                                {menuOpen && (
                                    <div
                                        onClick={(event) => {
                                            event.stopPropagation();
                                        }}
                                        className="absolute right-0 top-[45px] z-[100] w-[210px] overflow-hidden rounded-[12px] border border-[#dedede] bg-white py-[6px] shadow-[0_12px_35px_rgba(0,0,0,0.14)]"
                                    >

                                        {canMarkPaid && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={handleMarkPaid}
                                                    className="flex w-full items-center gap-[10px] px-[14px] py-[10px] text-left text-[13px] text-[#333] transition hover:bg-[#f6f6f6]"
                                                >
                                                    <CheckCircle2
                                                        size={15}
                                                        className="text-green-600"
                                                    />
                                                    Mark as paid
                                                </button>

                                                <div className="my-[5px] border-t border-[#eeeeee]" />
                                            </>
                                        )}

                                        <button
                                            type="button"
                                            onClick={handleMarkShipped}
                                            className="flex w-full items-center gap-[10px] px-[14px] py-[10px] text-left text-[13px] text-[#333] transition hover:bg-[#f6f6f6]"
                                        >
                                            <Truck
                                                size={15}
                                                className="text-[#666]"
                                            />
                                            Mark as shipped
                                        </button>

                                        <button
                                            type="button"
                                            onClick={handleCancelOrder}
                                            className="flex w-full items-center gap-[10px] px-[14px] py-[10px] text-left text-[13px] text-red-500 transition hover:bg-red-50"
                                        >
                                            <XCircle size={15} />
                                            Cancel order
                                        </button>

                                        {canRefund && (
                                            <>
                                                <div className="my-[5px] border-t border-[#eeeeee]" />

                                                <button
                                                    type="button"
                                                    onClick={openFullRefund}
                                                    className="flex w-full items-center gap-[10px] px-[14px] py-[10px] text-left text-[13px] text-[#333] transition hover:bg-[#f6f6f6]"
                                                >
                                                    <RefreshCcw
                                                        size={15}
                                                        className="text-[#666]"
                                                    />
                                                    Refund Full Amount
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={openPartialRefund}
                                                    className="flex w-full items-center gap-[10px] px-[14px] py-[10px] text-left text-[13px] text-[#333] transition hover:bg-[#f6f6f6]"
                                                >
                                                    <RefreshCcw
                                                        size={15}
                                                        className="text-[#666]"
                                                    />
                                                    Refund Partial Amount
                                                </button>
                                            </>
                                        )}

                                    </div>
                                )}

                            </div>

                            <button
                                type="button"
                                onClick={handleBack}
                                className="flex h-[38px] items-center gap-[7px] rounded-full border border-[#dedede] bg-white px-[14px] text-[13px] font-medium text-[#222] transition hover:bg-[#f7f7f7]"
                            >
                                <ArrowLeft size={15} />
                                Back
                            </button>

                        </div>

                    </div>

                    <div className="mt-[24px] grid grid-cols-1 gap-[22px] xl:grid-cols-[minmax(0,1fr)_420px]">

                        <div className="space-y-[22px]">

                            <OrderItemsCard
                                order={order}
                                items={items}
                            />

                            <TimelineCard
                                order={order}
                                transactions={transactions}
                            />

                        </div>

                        <CustomerCard
                            order={order}
                            shippingAddress={shippingAddress}
                            billingAddress={billingAddress}
                        />

                    </div>

                </div>
            </div>

            <RefundModal
                type={refundType}
                order={order}
                amount={refundAmount}
                refundableAmount={refundableAmount}
                loading={refundLoading}
                error={refundError}
                onAmountChange={setRefundAmount}
                onClose={closeRefundModal}
                onConfirm={handleRefund}
            />
        </>
    );
};

const RefundModal = ({
    type,
    order,
    amount,
    refundableAmount,
    loading,
    error,
    onAmountChange,
    onClose,
    onConfirm,
}) => {
    if (!type || !order) {
        return null;
    }

    const fullRefund =
        type === "full";

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/45 px-[20px]">

            <div className="relative w-full max-w-[520px] overflow-hidden rounded-[22px] bg-white shadow-[0_25px_70px_rgba(0,0,0,0.24)]">

                <div className="h-[3px] bg-[#2467d5]" />

                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="absolute right-[20px] top-[20px] flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#888] transition hover:bg-[#f5f5f5] disabled:opacity-50"
                >
                    <X size={19} />
                </button>

                <div className="px-[30px] pb-[30px] pt-[32px]">

                    <div className="mx-auto flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#edf3ff]">

                        <RefreshCcw
                            size={27}
                            className="text-[#2467d5]"
                        />

                    </div>

                    <h2 className="mt-[22px] text-center text-[23px] font-semibold text-[#222]">
                        {fullRefund
                            ? "Refund Full Amount"
                            : "Refund Partial Amount"}
                    </h2>

                    <p className="mx-auto mt-[10px] max-w-[410px] text-center text-[14px] leading-[22px] text-[#777]">
                        Order{" "}
                        <span className="font-semibold text-[#333]">
                            {order.order_no}
                        </span>
                    </p>

                    <div className="mt-[22px] rounded-[12px] bg-[#f7f8fa] px-[16px] py-[14px]">

                        <div className="flex items-center justify-between">

                            <span className="text-[13px] text-[#777]">
                                Available to refund
                            </span>

                            <span className="text-[15px] font-semibold text-[#222]">
                                {formatMoney(refundableAmount)}
                            </span>

                        </div>

                    </div>

                    {fullRefund && (
                        <p className="mt-[18px] text-center text-[14px] leading-[22px] text-[#666]">
                            {String(order.payment_method || "").toLowerCase() === "manual" ? (
                                <>
                                    The full refundable amount of{" "}
                                    <span className="font-semibold text-[#222]">
                                        {formatMoney(refundableAmount)}
                                    </span>{" "}
                                    will be recorded as a manual refund.
                                </>
                            ) : (
                                <>
                                    The full refundable amount of{" "}
                                    <span className="font-semibold text-[#222]">
                                        {formatMoney(refundableAmount)}
                                    </span>{" "}
                                    will be returned to the customer's original payment method.
                                </>
                            )}
                        </p>
                    )}

                    {!fullRefund && (
                        <div className="mt-[20px]">

                            <label className="text-[13px] font-medium text-[#333]">
                                Refund Amount
                            </label>

                            <div className="relative mt-[7px]">

                                <span className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[14px] text-[#777]">
                                    $
                                </span>

                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    max={refundableAmount}
                                    value={amount}
                                    onChange={(event) => {
                                        onAmountChange(event.target.value);
                                    }}
                                    placeholder="0.00"
                                    className="h-[46px] w-full rounded-[10px] border border-[#dedede] bg-white pl-[30px] pr-[14px] text-[14px] text-[#222] outline-none transition focus:border-[#2467d5]"
                                />

                            </div>

                        </div>
                    )}

                    {error && (
                        <div className="mt-[15px] rounded-[9px] border border-red-200 bg-red-50 px-[13px] py-[10px] text-[12px] text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="mt-[26px] grid grid-cols-2 gap-[12px]">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="flex h-[48px] items-center justify-center rounded-[12px] border border-[#dedede] bg-white text-[14px] font-semibold text-[#333] transition hover:bg-[#f8f8f8] disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className="flex h-[48px] items-center justify-center gap-[8px] rounded-[12px] bg-[#2467d5] text-[14px] font-semibold text-white transition hover:bg-[#1f59ba] disabled:opacity-60"
                        >
                            {loading && (
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                            )}

                            {loading
                                ? "Processing..."
                                : "Confirm Refund"}
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};

const OrderItemsCard = ({
    order,
    items,
}) => {
    return (
        <section className="order-print-card overflow-hidden rounded-[17px] border border-[#dedede] bg-white shadow-sm">

            <div className="px-[24px] py-[20px]">

                <h2 className="text-[17px] font-semibold text-[#171717]">
                    Order Items
                </h2>

            </div>

            <div className="grid grid-cols-[minmax(0,1fr)_130px_120px_130px] border-b border-[#e8e8e8] px-[20px] py-[12px] text-[12px] font-medium text-[#333]">

                <span>Item</span>
                <span>Price</span>
                <span>Quantity</span>
                <span className="text-right">
                    Total
                </span>

            </div>

            <div>

                {items.map((item) => (
                    <OrderItemRow
                        key={item.id}
                        item={item}
                    />
                ))}

            </div>

            <div className="border-t border-[#e8e8e8] bg-[#fcfcfc] px-[24px] py-[20px]">

                <TotalRow
                    label="Subtotal"
                    value={formatMoney(order.subtotal)}
                />

                <TotalRow
                    label={`Shipping · ${formatShippingMethod(order.shipping_method)}`}
                    value={formatMoney(order.shipping_total)}
                />

                {Number(order.discount_total || 0) > 0 && (
                    <TotalRow
                        label="Discount"
                        value={`-${formatMoney(order.discount_total)}`}
                    />
                )}

                <TotalRow
                    label="Tax"
                    value={formatMoney(order.tax_total)}
                />

                <div className="my-[12px] border-t border-[#e4e4e4]" />

                <div className="flex items-center justify-between">

                    <span className="text-[17px] font-semibold text-[#111]">
                        Total
                    </span>

                    <span className="text-[18px] font-bold text-[#111]">
                        {formatMoney(order.grand_total)}
                    </span>

                </div>

            </div>

        </section>
    );
};

const OrderItemRow = ({ item }) => {
    return (
        <div className="grid grid-cols-[minmax(0,1fr)_130px_120px_130px] items-center border-b border-[#eeeeee] px-[20px] py-[13px] last:border-b-0">

            <div className="flex min-w-0 items-center gap-[14px]">

                <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[#e4e4e4] bg-[#f7f7f7]">

                    {item.image_url ? (
                        <img
                            src={item.image_url}
                            alt={item.product_name || "Product"}
                            className="h-full w-full object-contain p-[5px]"
                        />
                    ) : (
                        <Package
                            size={23}
                            className="text-[#999]"
                        />
                    )}

                </div>

                <div className="min-w-0">

                    <p className="truncate text-[14px] font-medium text-[#171717]">
                        {item.product_name}
                    </p>

                    {item.variant_name && (
                        <p className="mt-[3px] truncate text-[12px] text-[#777]">
                            {item.variant_name}
                        </p>
                    )}

                    {item.sku && (
                        <p className="mt-[3px] text-[12px] text-[#777]">
                            SKU: {item.sku}
                        </p>
                    )}

                </div>

            </div>

            <div className="text-[13px] text-[#222]">
                {formatMoney(item.unit_price)}
            </div>

            <div className="text-[13px] text-[#222]">
                {item.quantity}
            </div>

            <div className="text-right text-[13px] font-medium text-[#111]">
                {formatMoney(item.line_total)}
            </div>

        </div>
    );
};

const TotalRow = ({
    label,
    value,
}) => {
    return (
        <div className="mb-[10px] flex items-center justify-between last:mb-0">

            <span className="text-[13px] text-[#666]">
                {label}
            </span>

            <span className="text-[13px] font-medium text-[#222]">
                {value}
            </span>

        </div>
    );
};

const TimelineCard = ({
    order,
    transactions,
}) => {
    const events =
        buildTimeline(
            order,
            transactions
        );

    return (
        <section className="order-print-card rounded-[17px] border border-[#dedede] bg-white px-[24px] py-[22px] shadow-sm">

            <h2 className="text-[17px] font-semibold text-[#171717]">
                Timeline
            </h2>

            <div className="order-print-hide mt-[22px]">

                <textarea
                    rows="3"
                    placeholder="Add a message, if you'd like..."
                    className="w-full resize-none rounded-[12px] border border-[#dedede] px-[14px] py-[12px] text-[13px] outline-none focus:border-[#2065D1]"
                />

                <div className="mt-[8px] flex items-center justify-between">

                    <span className="text-[11px] text-[#888]">
                        Only visible to your team
                    </span>

                    <button
                        type="button"
                        disabled
                        className="rounded-[9px] bg-[#a9c5ee] px-[16px] py-[8px] text-[13px] font-semibold text-white"
                    >
                        Post
                    </button>

                </div>

            </div>

            <div className="mt-[26px] space-y-[18px]">

                {events.map((event, index) => (
                    <TimelineEvent
                        key={`${event.type}-${index}`}
                        event={event}
                    />
                ))}

            </div>

        </section>
    );
};

const TimelineEvent = ({ event }) => {
    let icon = <Clock3 size={14} />;

    let iconClass =
        "border-blue-200 bg-blue-50 text-blue-600";

    if (event.type === "payment") {
        icon = <CreditCard size={14} />;

        iconClass =
            "border-green-200 bg-green-50 text-green-600";
    }

    if (event.type === "shipping") {
        icon = <Truck size={14} />;

        iconClass =
            "border-purple-200 bg-purple-50 text-purple-600";
    }

    if (event.type === "cancelled") {
        icon = <XCircle size={14} />;

        iconClass =
            "border-red-200 bg-red-50 text-red-500";
    }

    return (
        <div className="flex gap-[12px]">

            <div className={`mt-[1px] flex h-[24px] w-[24px] shrink-0 items-center justify-center rounded-full border ${iconClass}`}>
                {icon}
            </div>

            <div>

                <p className="text-[13px] text-[#222]">
                    {event.text}
                </p>

                <p className="mt-[3px] text-[11px] text-[#888]">
                    by System · {formatDateTime(event.date)}
                </p>

            </div>

        </div>
    );
};

const CustomerCard = ({
    order,
    shippingAddress,
    billingAddress,
}) => {
    const customerName =
        order.user?.name ||
        getAddressName(shippingAddress) ||
        "Guest Customer";

    const customerEmail =
        order.user?.email ||
        "-";

    const customerPhone =
        shippingAddress?.phone ||
        order.user?.phone ||
        "-";

    return (
        <aside className="order-print-card self-start rounded-[17px] border border-[#dedede] bg-white px-[24px] py-[22px] shadow-sm">

            <h2 className="text-[17px] font-semibold text-[#171717]">
                Customer
            </h2>

            <div className="mt-[20px] flex items-center gap-[13px]">

                <div className="flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#edf3ff] text-[16px] font-semibold text-[#2065D1]">
                    {getInitials(customerName)}
                </div>

                <div>

                    <p className="text-[15px] font-medium text-[#171717]">
                        {customerName}
                    </p>

                    <p className="mt-[2px] text-[12px] text-[#777]">
                        Customer
                    </p>

                </div>

            </div>

            <div className="my-[18px] border-t border-[#e5e5e5]" />

            <p className="text-[13px] font-medium text-[#666]">
                Contact info
            </p>

            <div className="mt-[12px] space-y-[10px]">

                <ContactLine
                    icon={Mail}
                    value={customerEmail}
                />

                <ContactLine
                    icon={Phone}
                    value={customerPhone}
                />

            </div>

            <div className="my-[18px] border-t border-[#e5e5e5]" />

            <AddressBlock
                title="Shipping address"
                address={shippingAddress}
            />

            <div className="my-[18px] border-t border-[#e5e5e5]" />

            <AddressBlock
                title="Billing address"
                address={billingAddress}
            />

            <div className="my-[18px] border-t border-[#e5e5e5]" />

            <div>

                <p className="text-[13px] font-medium text-[#666]">
                    Payment
                </p>

                <div className="mt-[12px] flex items-center gap-[8px] text-[13px] text-[#222]">

                    <CreditCard
                        size={15}
                        className="text-[#777]"
                    />

                    <span>
                        {formatPaymentMethod(order.payment_method)}
                    </span>

                </div>

            </div>

        </aside>
    );
};

const ContactLine = ({
    icon: Icon,
    value,
}) => {
    return (
        <div className="flex items-center gap-[9px]">

            <Icon
                size={15}
                className="shrink-0 text-[#777]"
            />

            <span className="break-all text-[13px] text-[#222]">
                {value}
            </span>

        </div>
    );
};

const AddressBlock = ({
    title,
    address,
}) => {
    return (
        <div>

            <p className="text-[13px] font-medium text-[#666]">
                {title}
            </p>

            {!address && (
                <p className="mt-[11px] text-[13px] text-[#999]">
                    No address available.
                </p>
            )}

            {address && (
                <div className="mt-[11px] text-[13px] leading-[20px] text-[#222]">

                    <p>
                        {address.first_name}{" "}
                        {address.last_name}
                    </p>

                    <p>
                        {address.address_line1}
                    </p>

                    {address.address_line2 && (
                        <p>
                            {address.address_line2}
                        </p>
                    )}

                    <p>
                        {address.city}
                        {address.state
                            ? `, ${address.state}`
                            : ""}
                        {address.postal_code
                            ? ` ${address.postal_code}`
                            : ""}
                    </p>

                    <p>
                        {address.country}
                    </p>

                </div>
            )}

        </div>
    );
};

const PaymentStatusBadge = ({
    status,
}) => {
    const value =
        String(status || "pending")
            .toLowerCase();

    if (value === "paid") {
        return (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-[#14b866] px-[10px] py-[5px] text-[11px] font-semibold text-white">
                <CheckCircle2 size={12} />
                Paid
            </span>
        );
    }

    if (value === "refunded") {
        return (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-[#e7edff] px-[10px] py-[5px] text-[11px] font-semibold text-[#3159b7]">
                <RefreshCcw size={12} />
                Refunded
            </span>
        );
    }

    if (value === "partially_refunded") {
        return (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-[#e7edff] px-[10px] py-[5px] text-[11px] font-semibold text-[#3159b7]">
                <RefreshCcw size={12} />
                Partially Refunded
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-[5px] rounded-full bg-[#f5c451] px-[10px] py-[5px] text-[11px] font-semibold text-[#6f4b00]">
            <Clock3 size={12} />
            {formatStatus(status)}
        </span>
    );
};

const OrderStatusBadge = ({
    status,
}) => {
    const value =
        String(status || "pending")
            .toLowerCase();

    if (value === "cancelled") {
        return (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-red-500 px-[10px] py-[5px] text-[11px] font-semibold text-white">
                <XCircle size={12} />
                Cancelled
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-[5px] rounded-full bg-[#2467d5] px-[10px] py-[5px] text-[11px] font-semibold text-white">
            <Package size={12} />
            {formatStatus(status)}
        </span>
    );
};

const ChannelBadge = ({
    channel,
}) => {
    return (
        <span className="inline-flex items-center gap-[5px] rounded-full border border-[#dedede] bg-white px-[10px] py-[5px] text-[11px] font-medium text-[#444]">
            <Store size={12} />
            {formatChannel(channel)}
        </span>
    );
};

const PageLoader = () => {
    return (
        <div className="flex min-h-[650px] items-center justify-center bg-[#f6f6f7]">

            <LoaderCircle
                size={30}
                className="animate-spin text-[#2065D1]"
            />

        </div>
    );
};

const OrderError = ({
    message,
    onBack,
}) => {
    return (
        <div className="flex min-h-[650px] items-center justify-center bg-[#f6f6f7] px-[20px]">

            <div className="rounded-[16px] border border-[#dedede] bg-white px-[35px] py-[35px] text-center">

                <XCircle
                    size={38}
                    className="mx-auto text-red-500"
                />

                <h2 className="mt-[15px] text-[18px] font-semibold text-[#222]">
                    Unable to load order
                </h2>

                <p className="mt-[7px] text-[13px] text-[#777]">
                    {message}
                </p>

                <button
                    type="button"
                    onClick={onBack}
                    className="mt-[20px] rounded-[9px] bg-[#2065D1] px-[18px] py-[9px] text-[13px] font-semibold text-white"
                >
                    Back to Orders
                </button>

            </div>

        </div>
    );
};

const buildTimeline = (
    order,
    transactions
) => {
    const events = [];

    events.push({
        type: "order",
        text:
            `Order placed via ${formatChannel(order.channel).toLowerCase()} · ` +
            `${getTotalQuantity(order.items)} ${getTotalQuantity(order.items) === 1 ? "item" : "items"}, ` +
            `${formatMoney(order.grand_total)}`,
        date:
            order.placed_at ||
            order.created_at,
    });

    transactions.forEach((transaction) => {
        const status =
            String(
                transaction.status || ""
            ).toLowerCase();

        if (status === "paid") {
            events.push({
                type: "payment",
                text:
                    `Payment of ${formatMoney(transaction.amount)} received via ` +
                    `${formatPaymentMethod(transaction.gateway)}`,
                date:
                    transaction.paid_at ||
                    transaction.updated_at ||
                    transaction.created_at,
            });
        }

        if (
            status === "refunded" ||
            status === "partially_refunded"
        ) {
            events.push({
                type: "payment",
                text:
                    `${formatMoney(transaction.refund_amount || transaction.amount)} refunded via ` +
                    `${formatPaymentMethod(transaction.gateway)}`,
                date:
                    transaction.refunded_at ||
                    transaction.updated_at ||
                    transaction.created_at,
            });
        }
    });

    if (
        order.payment_status === "paid" &&
        !transactions.some((transaction) => {
            return (
                String(
                    transaction.status
                ).toLowerCase() === "paid"
            );
        })
    ) {
        events.push({
            type: "payment",
            text:
                `Payment of ${formatMoney(order.grand_total)} received via ` +
                `${formatPaymentMethod(order.payment_method)}`,
            date:
                order.paid_at ||
                order.updated_at,
        });
    }

    if (order.shipped_at) {
        events.push({
            type: "shipping",
            text: "Order marked as shipped",
            date: order.shipped_at,
        });
    }

    if (order.cancelled_at) {
        events.push({
            type: "cancelled",
            text: "Order cancelled",
            date: order.cancelled_at,
        });
    }

    return events.sort((first, second) => {
        return (
            new Date(second.date) -
            new Date(first.date)
        );
    });
};

const getRefundableAmount = (order) => {
    if (
        order.refundable_amount !== null &&
        order.refundable_amount !== undefined
    ) {
        return Math.max(
            0,
            Number(order.refundable_amount || 0)
        );
    }

    return Math.max(
        0,
        Number(order.grand_total || 0)
    );
};

const getTotalQuantity = (items) => {
    if (!Array.isArray(items)) {
        return 0;
    }

    return items.reduce((total, item) => {
        return (
            total +
            Number(item.quantity || 0)
        );
    }, 0);
};

const getAddressName = (address) => {
    if (!address) {
        return "";
    }

    return `${address.first_name || ""} ${address.last_name || ""}`.trim();
};

const getInitials = (name) => {
    if (!name) {
        return "C";
    }

    const words =
        name
            .trim()
            .split(" ")
            .filter(Boolean);

    if (!words.length) {
        return "C";
    }

    if (words.length === 1) {
        return words[0]
            .charAt(0)
            .toUpperCase();
    }

    return (
        words[0].charAt(0) +
        words[words.length - 1].charAt(0)
    ).toUpperCase();
};

const formatMoney = (value) => {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
        }
    ).format(
        Number(value || 0)
    );
};

const formatDateTime = (value) => {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleString(
        "en-US",
        {
            month: "long",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }
    );
};

const formatShippingMethod = (value) => {
    if (value === "express") {
        return "Express Delivery";
    }

    return "Standard Delivery";
};

const formatPaymentMethod = (value) => {
    const method =
        String(value || "")
            .toLowerCase();

    if (method === "stripe") {
        return "Stripe";
    }

    if (method === "paypal") {
        return "PayPal";
    }

    if (method === "sslcommerz") {
        return "SSLCommerz";
    }

    if (method === "manual") {
        return "Manual";
    }

    return formatStatus(value);
};

const formatChannel = (value) => {
    if (value === "point_of_sale") {
        return "Point of Sale";
    }

    return "Online Store";
};

const formatStatus = (value) => {
    if (!value) {
        return "-";
    }

    return String(value)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => {
            return letter.toUpperCase();
        });
};

export default AdminOrderDetails;