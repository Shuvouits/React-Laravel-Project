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

    const [returns, setReturns] = useState([]);
    const [returnsLoading, setReturnsLoading] = useState(false);
    const [returnsError, setReturnsError] = useState("");

    const [returnModalOpen, setReturnModalOpen] = useState(false);
    const [returnItems, setReturnItems] = useState([]);
    const [returnNote, setReturnNote] = useState("");
    const [returnLoading, setReturnLoading] = useState(false);
    const [returnError, setReturnError] = useState("");

    const [returnActionModal, setReturnActionModal] = useState({
        open: false,
        type: null,
        item: null,
    });
    const [returnActionLoading, setReturnActionLoading] = useState(false);

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

    const fetchOrderReturns = async (orderData) => {
        if (!orderData?.order_no) {
            setReturns([]);
            return;
        }

        try {
            setReturnsLoading(true);
            setReturnsError("");
            setReturns([]);

            const response = await api.get("/admin/returns", {
                params: {
                    tab: "all",
                    search: orderData.order_no,
                    per_page: 100,
                },
            });

            const rows =
                response.data?.returns?.data || [];

            setReturns(
                rows.filter((item) => {
                    return (
                        Number(item.order_id) ===
                        Number(orderData.id)
                    );
                })
            );
        } catch (error) {
            console.error(
                "Order returns error:",
                error.response?.data || error.message
            );

            setReturnsError(
                error.response?.data?.message ||
                "Unable to load returns for this order."
            );
        } finally {
            setReturnsLoading(false);
        }
    };

    const fetchOrder = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(`/admin/orders/${id}`);

            const orderData =
                response.data?.order || null;

            setOrder(orderData);

            if (orderData) {
                fetchOrderReturns(orderData);
            } else {
                setReturns([]);
            }
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

    const openReturnModal = () => {
        if (!order) {
            return;
        }

        setMenuOpen(false);
        setReturnError("");
        setReturnNote("");

        const rows = (order.items || [])
            .map((item) => {
                const maxQuantity =
                    getAvailableReturnQuantity(
                        item,
                        returns
                    );

                return {
                    order_item_id: item.id,
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    product_name: item.product_name,
                    variant_name: item.variant_name,
                    sku: item.sku,
                    image_url: item.image_url,
                    ordered_quantity: Number(
                        item.quantity || 0
                    ),
                    max_quantity: maxQuantity,
                    selected: false,
                    quantity: maxQuantity > 0 ? 1 : 0,
                    reason: "",
                    item_condition: "",
                };
            })
            .filter((item) => {
                return item.max_quantity > 0;
            });

        setReturnItems(rows);
        setReturnModalOpen(true);
    };

    const closeReturnModal = () => {
        if (returnLoading) {
            return;
        }

        setReturnModalOpen(false);
        setReturnItems([]);
        setReturnNote("");
        setReturnError("");
    };

    const updateReturnItem = (
        orderItemId,
        field,
        value
    ) => {
        setReturnItems((currentItems) => {
            return currentItems.map((item) => {
                if (
                    Number(item.order_item_id) !==
                    Number(orderItemId)
                ) {
                    return item;
                }

                return {
                    ...item,
                    [field]: value,
                };
            });
        });
    };

    const handleCreateReturn = async () => {
        if (!order || returnLoading) {
            return;
        }

        const selectedItems =
            returnItems.filter((item) => {
                return item.selected;
            });

        if (!selectedItems.length) {
            setReturnError(
                "Select at least one item to return."
            );
            return;
        }

        for (const item of selectedItems) {
            const quantity =
                Number(item.quantity || 0);

            if (
                quantity < 1 ||
                quantity > item.max_quantity
            ) {
                setReturnError(
                    `Return quantity for ${item.product_name} must be between 1 and ${item.max_quantity}.`
                );
                return;
            }

            if (!String(item.reason || "").trim()) {
                setReturnError(
                    `Select a return reason for ${item.product_name}.`
                );
                return;
            }
        }

        try {
            setReturnLoading(true);
            setReturnError("");
            setSuccessMessage("");

            const payload = {
                items: selectedItems.map((item) => ({
                    order_item_id:
                        item.order_item_id,
                    quantity:
                        Number(item.quantity),
                    reason:
                        item.reason,
                    item_condition:
                        item.item_condition || null,
                })),
                admin_note:
                    returnNote.trim() || null,
            };

            const response = await api.post(
                `/admin/orders/${order.id}/returns`,
                payload
            );

            setReturnModalOpen(false);
            setReturnItems([]);
            setReturnNote("");

            setSuccessMessage(
                response.data?.message ||
                "Return created successfully."
            );

            await fetchOrderReturns(order);

            setTimeout(() => {
                setSuccessMessage("");
            }, 5000);
        } catch (error) {
            console.error(
                "Create return error:",
                error.response?.data || error.message
            );

            const validationErrors =
                error.response?.data?.errors;

            const firstValidationError =
                validationErrors &&
                Object.values(validationErrors)
                    .flat()
                    .find(Boolean);

            setReturnError(
                firstValidationError ||
                error.response?.data?.message ||
                "Unable to create return."
            );
        } finally {
            setReturnLoading(false);
        }
    };

    const openReturnAction = (
        type,
        returnItem
    ) => {
        setReturnActionModal({
            open: true,
            type,
            item: returnItem,
        });
    };

    const closeReturnAction = () => {
        if (returnActionLoading) {
            return;
        }

        setReturnActionModal({
            open: false,
            type: null,
            item: null,
        });
    };

    const handleReturnAction = async () => {
        const type =
            returnActionModal.type;

        const returnItem =
            returnActionModal.item;

        if (
            !type ||
            !returnItem ||
            returnActionLoading
        ) {
            return;
        }

        const endpointMap = {
            approve:
                `/admin/returns/${returnItem.id}/approve`,
            reject:
                `/admin/returns/${returnItem.id}/reject`,
            in_transit:
                `/admin/returns/${returnItem.id}/in-transit`,
            received:
                `/admin/returns/${returnItem.id}/received`,
            cancel:
                `/admin/returns/${returnItem.id}/cancel`,
        };

        const endpoint =
            endpointMap[type];

        if (!endpoint) {
            return;
        }

        try {
            setReturnActionLoading(true);
            setSuccessMessage("");

            const response =
                await api.post(endpoint);

            setReturnActionModal({
                open: false,
                type: null,
                item: null,
            });

            setSuccessMessage(
                response.data?.message ||
                "Return updated successfully."
            );

            await fetchOrderReturns(order);

            setTimeout(() => {
                setSuccessMessage("");
            }, 5000);
        } catch (error) {
            console.error(
                "Return action error:",
                error.response?.data || error.message
            );

            setReturnActionModal((current) => ({
                ...current,
                error:
                    error.response?.data?.message ||
                    "Unable to update return.",
            }));
        } finally {
            setReturnActionLoading(false);
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

    const canCreateReturn =
        !returnsLoading &&
        String(order.status || "").toLowerCase() !==
            "cancelled" &&
        items.some((item) => {
            return (
                getAvailableReturnQuantity(
                    item,
                    returns
                ) > 0
            );
        });

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

                                        {canCreateReturn && (
                                            <button
                                                type="button"
                                                onClick={openReturnModal}
                                                className="flex w-full items-center gap-[10px] px-[14px] py-[10px] text-left text-[13px] text-[#333] transition hover:bg-[#f6f6f6]"
                                            >
                                                <RefreshCcw
                                                    size={15}
                                                    className="text-[#666]"
                                                />
                                                Create return
                                            </button>
                                        )}

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

                            <ReturnsCard
                                returns={returns}
                                loading={returnsLoading}
                                error={returnsError}
                                canCreateReturn={canCreateReturn}
                                onCreate={openReturnModal}
                                onAction={openReturnAction}
                            />

                            <TimelineCard
                                order={order}
                                transactions={transactions}
                                returns={returns}
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

            <CreateReturnModal
                open={returnModalOpen}
                order={order}
                items={returnItems}
                note={returnNote}
                loading={returnLoading}
                error={returnError}
                onItemChange={updateReturnItem}
                onNoteChange={setReturnNote}
                onClose={closeReturnModal}
                onConfirm={handleCreateReturn}
            />

            <ReturnActionModal
                modal={returnActionModal}
                loading={returnActionLoading}
                onClose={closeReturnAction}
                onConfirm={handleReturnAction}
            />
        </>
    );
};


const CreateReturnModal = ({
    open,
    order,
    items,
    note,
    loading,
    error,
    onItemChange,
    onNoteChange,
    onClose,
    onConfirm,
}) => {
    if (!open || !order) {
        return null;
    }

    const selectedCount =
        items.filter((item) => {
            return item.selected;
        }).length;

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/45 px-[20px] py-[30px]">
            <div className="relative flex max-h-[90vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[22px] bg-white shadow-[0_25px_70px_rgba(0,0,0,0.24)]">

                <div className="h-[3px] shrink-0 bg-[#2467d5]" />

                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="absolute right-[20px] top-[20px] z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#888] transition hover:bg-[#f5f5f5] disabled:opacity-50"
                >
                    <X size={19} />
                </button>

                <div className="shrink-0 px-[30px] pb-[20px] pt-[28px]">

                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#edf3ff]">
                        <RefreshCcw
                            size={23}
                            className="text-[#2467d5]"
                        />
                    </div>

                    <h2 className="mt-[18px] text-[22px] font-semibold text-[#222]">
                        Create Return
                    </h2>

                    <p className="mt-[6px] text-[13px] text-[#777]">
                        Select the items being returned from{" "}
                        <span className="font-semibold text-[#333]">
                            {order.order_no}
                        </span>
                        .
                    </p>

                </div>

                <div className="flex-1 overflow-y-auto border-y border-[#eeeeee]">

                    {items.length === 0 && (
                        <div className="px-[30px] py-[45px] text-center">
                            <Package
                                size={32}
                                className="mx-auto text-[#aaa]"
                            />

                            <p className="mt-[12px] text-[14px] font-medium text-[#333]">
                                No items are available to return
                            </p>

                            <p className="mt-[5px] text-[12px] text-[#888]">
                                All quantities in this order are already part of an active or completed return.
                            </p>
                        </div>
                    )}

                    {items.map((item) => (
                        <div
                            key={item.order_item_id}
                            className="border-b border-[#eeeeee] px-[30px] py-[18px] last:border-b-0"
                        >
                            <div className="flex items-start gap-[14px]">

                                <label className="mt-[20px] flex cursor-pointer items-center">
                                    <input
                                        type="checkbox"
                                        checked={item.selected}
                                        onChange={(event) => {
                                            onItemChange(
                                                item.order_item_id,
                                                "selected",
                                                event.target.checked
                                            );
                                        }}
                                        className="h-[17px] w-[17px] cursor-pointer rounded border-[#cfcfcf] accent-[#2467d5]"
                                    />
                                </label>

                                <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[#e4e4e4] bg-[#f7f7f7]">
                                    {item.image_url ? (
                                        <img
                                            src={item.image_url}
                                            alt={item.product_name || "Product"}
                                            className="h-full w-full object-contain p-[5px]"
                                        />
                                    ) : (
                                        <Package
                                            size={22}
                                            className="text-[#999]"
                                        />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">

                                    <div className="flex flex-wrap items-start justify-between gap-[10px]">

                                        <div className="min-w-0">
                                            <p className="truncate text-[14px] font-medium text-[#171717]">
                                                {item.product_name}
                                            </p>

                                            {item.variant_name && (
                                                <p className="mt-[2px] text-[12px] text-[#777]">
                                                    {item.variant_name}
                                                </p>
                                            )}

                                            {item.sku && (
                                                <p className="mt-[2px] text-[11px] text-[#999]">
                                                    SKU: {item.sku}
                                                </p>
                                            )}
                                        </div>

                                        <div className="text-right">
                                            <p className="text-[11px] text-[#888]">
                                                Available to return
                                            </p>

                                            <p className="mt-[2px] text-[13px] font-semibold text-[#333]">
                                                {item.max_quantity} of {item.ordered_quantity}
                                            </p>
                                        </div>

                                    </div>

                                    {item.selected && (
                                        <div className="mt-[16px] grid grid-cols-1 gap-[12px] md:grid-cols-3">

                                            <div>
                                                <label className="text-[11px] font-medium text-[#555]">
                                                    Quantity
                                                </label>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    max={item.max_quantity}
                                                    value={item.quantity}
                                                    onChange={(event) => {
                                                        onItemChange(
                                                            item.order_item_id,
                                                            "quantity",
                                                            event.target.value
                                                        );
                                                    }}
                                                    className="mt-[6px] h-[40px] w-full rounded-[9px] border border-[#dedede] bg-white px-[11px] text-[13px] text-[#222] outline-none focus:border-[#2467d5]"
                                                />
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-medium text-[#555]">
                                                    Return reason
                                                </label>

                                                <select
                                                    value={item.reason}
                                                    onChange={(event) => {
                                                        onItemChange(
                                                            item.order_item_id,
                                                            "reason",
                                                            event.target.value
                                                        );
                                                    }}
                                                    className="mt-[6px] h-[40px] w-full rounded-[9px] border border-[#dedede] bg-white px-[10px] text-[13px] text-[#222] outline-none focus:border-[#2467d5]"
                                                >
                                                    <option value="">
                                                        Select reason
                                                    </option>
                                                    <option value="Damaged">
                                                        Damaged
                                                    </option>
                                                    <option value="Defective">
                                                        Defective
                                                    </option>
                                                    <option value="Wrong item">
                                                        Wrong item
                                                    </option>
                                                    <option value="Not as described">
                                                        Not as described
                                                    </option>
                                                    <option value="Changed mind">
                                                        Changed mind
                                                    </option>
                                                    <option value="Other">
                                                        Other
                                                    </option>
                                                </select>
                                            </div>

                                            <div>
                                                <label className="text-[11px] font-medium text-[#555]">
                                                    Item condition
                                                </label>

                                                <select
                                                    value={item.item_condition}
                                                    onChange={(event) => {
                                                        onItemChange(
                                                            item.order_item_id,
                                                            "item_condition",
                                                            event.target.value
                                                        );
                                                    }}
                                                    className="mt-[6px] h-[40px] w-full rounded-[9px] border border-[#dedede] bg-white px-[10px] text-[13px] text-[#222] outline-none focus:border-[#2467d5]"
                                                >
                                                    <option value="">
                                                        Not specified
                                                    </option>
                                                    <option value="Unopened">
                                                        Unopened
                                                    </option>
                                                    <option value="Opened">
                                                        Opened
                                                    </option>
                                                    <option value="Used">
                                                        Used
                                                    </option>
                                                    <option value="Damaged">
                                                        Damaged
                                                    </option>
                                                    <option value="Defective">
                                                        Defective
                                                    </option>
                                                </select>
                                            </div>

                                        </div>
                                    )}

                                </div>

                            </div>
                        </div>
                    ))}

                    {items.length > 0 && (
                        <div className="bg-[#fafafa] px-[30px] py-[18px]">

                            <label className="text-[12px] font-medium text-[#444]">
                                Internal note
                            </label>

                            <textarea
                                rows="3"
                                value={note}
                                onChange={(event) => {
                                    onNoteChange(event.target.value);
                                }}
                                placeholder="Add an optional note about this return..."
                                className="mt-[7px] w-full resize-none rounded-[10px] border border-[#dedede] bg-white px-[13px] py-[10px] text-[13px] text-[#222] outline-none focus:border-[#2467d5]"
                            />

                        </div>
                    )}

                </div>

                <div className="shrink-0 px-[30px] py-[20px]">

                    {error && (
                        <div className="mb-[14px] rounded-[9px] border border-red-200 bg-red-50 px-[13px] py-[10px] text-[12px] text-red-600">
                            {error}
                        </div>
                    )}

                    <div className="flex items-center justify-between gap-[14px]">

                        <p className="text-[12px] text-[#777]">
                            {selectedCount} item
                            {selectedCount === 1 ? "" : "s"} selected
                        </p>

                        <div className="flex gap-[10px]">

                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="h-[42px] rounded-[10px] border border-[#dedede] bg-white px-[18px] text-[13px] font-semibold text-[#333] transition hover:bg-[#f8f8f8] disabled:opacity-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={onConfirm}
                                disabled={
                                    loading ||
                                    selectedCount === 0 ||
                                    items.length === 0
                                }
                                className="flex h-[42px] items-center gap-[7px] rounded-[10px] bg-[#2467d5] px-[18px] text-[13px] font-semibold text-white transition hover:bg-[#1f59ba] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {loading && (
                                    <LoaderCircle
                                        size={15}
                                        className="animate-spin"
                                    />
                                )}

                                {loading
                                    ? "Creating..."
                                    : "Create Return"}
                            </button>

                        </div>

                    </div>

                </div>

            </div>
        </div>
    );
};

const ReturnActionModal = ({
    modal,
    loading,
    onClose,
    onConfirm,
}) => {
    if (!modal?.open || !modal?.item) {
        return null;
    }

    const configs = {
        approve: {
            title: "Approve Return",
            message:
                "Approve this return request and allow the return process to continue?",
            button: "Approve Return",
            destructive: false,
        },
        reject: {
            title: "Reject Return",
            message:
                "Reject this return request? The returned quantity will become available for a new return request.",
            button: "Reject Return",
            destructive: true,
        },
        in_transit: {
            title: "Mark In Transit",
            message:
                "Confirm that the customer has sent the returned items and the return is now in transit.",
            button: "Mark In Transit",
            destructive: false,
        },
        received: {
            title: "Mark Return Received",
            message:
                "Confirm that the returned items have been received.",
            button: "Mark Received",
            destructive: false,
        },
        cancel: {
            title: "Cancel Return",
            message:
                "Cancel this return? The returned quantity will become available again. This action cannot be undone.",
            button: "Cancel Return",
            destructive: true,
        },
    };

    const config =
        configs[modal.type] ||
        configs.cancel;

    return (
        <div className="fixed inset-0 z-[450] flex items-center justify-center bg-black/45 px-[20px]">
            <div className="relative w-full max-w-[470px] overflow-hidden rounded-[20px] bg-white shadow-[0_25px_70px_rgba(0,0,0,0.24)]">

                <div
                    className={`h-[3px] ${
                        config.destructive
                            ? "bg-red-500"
                            : "bg-[#2467d5]"
                    }`}
                />

                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="absolute right-[18px] top-[18px] flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#888] transition hover:bg-[#f5f5f5] disabled:opacity-50"
                >
                    <X size={18} />
                </button>

                <div className="px-[28px] pb-[26px] pt-[30px]">

                    <div
                        className={`flex h-[54px] w-[54px] items-center justify-center rounded-full ${
                            config.destructive
                                ? "bg-red-50 text-red-600"
                                : "bg-[#edf3ff] text-[#2467d5]"
                        }`}
                    >
                        {config.destructive ? (
                            <XCircle size={23} />
                        ) : (
                            <RefreshCcw size={23} />
                        )}
                    </div>

                    <h2 className="mt-[18px] text-[21px] font-semibold text-[#222]">
                        {config.title}
                    </h2>

                    <p className="mt-[8px] text-[13px] leading-[21px] text-[#666]">
                        {config.message}
                    </p>

                    <div className="mt-[15px] rounded-[10px] bg-[#f7f8fa] px-[13px] py-[11px]">
                        <p className="text-[12px] text-[#777]">
                            Return
                        </p>

                        <p className="mt-[2px] text-[13px] font-semibold text-[#222]">
                            {modal.item.return_no}
                        </p>
                    </div>

                    {modal.error && (
                        <div className="mt-[14px] rounded-[9px] border border-red-200 bg-red-50 px-[13px] py-[10px] text-[12px] text-red-600">
                            {modal.error}
                        </div>
                    )}

                    <div className="mt-[24px] grid grid-cols-2 gap-[10px]">

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="h-[44px] rounded-[10px] border border-[#dedede] bg-white text-[13px] font-semibold text-[#333] transition hover:bg-[#f8f8f8] disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex h-[44px] items-center justify-center gap-[7px] rounded-[10px] text-[13px] font-semibold text-white transition disabled:opacity-50 ${
                                config.destructive
                                    ? "bg-red-600 hover:bg-red-700"
                                    : "bg-[#2467d5] hover:bg-[#1f59ba]"
                            }`}
                        >
                            {loading && (
                                <LoaderCircle
                                    size={15}
                                    className="animate-spin"
                                />
                            )}

                            {loading
                                ? "Processing..."
                                : config.button}
                        </button>

                    </div>

                </div>

            </div>
        </div>
    );
};

const ReturnsCard = ({
    returns,
    loading,
    error,
    canCreateReturn,
    onCreate,
    onAction,
}) => {
    return (
        <section className="order-print-card overflow-hidden rounded-[17px] border border-[#dedede] bg-white shadow-sm">

            <div className="flex items-center justify-between gap-[15px] px-[24px] py-[20px]">

                <div>
                    <h2 className="text-[17px] font-semibold text-[#171717]">
                        Returns
                    </h2>

                    <p className="mt-[3px] text-[12px] text-[#888]">
                        Track returned items and their current status.
                    </p>
                </div>

                {canCreateReturn && (
                    <button
                        type="button"
                        onClick={onCreate}
                        className="order-print-hide flex h-[36px] items-center gap-[7px] rounded-[9px] border border-[#dedede] bg-white px-[12px] text-[12px] font-semibold text-[#333] transition hover:bg-[#f7f7f7]"
                    >
                        <RefreshCcw size={14} />
                        Create Return
                    </button>
                )}

            </div>

            {loading && (
                <div className="border-t border-[#eeeeee] px-[24px] py-[24px]">
                    <div className="flex items-center gap-[8px] text-[13px] text-[#777]">
                        <LoaderCircle
                            size={16}
                            className="animate-spin"
                        />
                        Loading returns...
                    </div>
                </div>
            )}

            {!loading && error && (
                <div className="border-t border-[#eeeeee] px-[24px] py-[20px]">
                    <div className="rounded-[9px] border border-red-200 bg-red-50 px-[13px] py-[10px] text-[12px] text-red-600">
                        {error}
                    </div>
                </div>
            )}

            {!loading &&
                !error &&
                returns.length === 0 && (
                    <div className="border-t border-[#eeeeee] px-[24px] py-[30px] text-center">

                        <RefreshCcw
                            size={27}
                            className="mx-auto text-[#aaa]"
                        />

                        <p className="mt-[10px] text-[13px] font-medium text-[#444]">
                            No returns for this order
                        </p>

                        <p className="mt-[4px] text-[12px] text-[#888]">
                            Create a return when one or more order items are being sent back.
                        </p>

                    </div>
                )}

            {!loading &&
                !error &&
                returns.length > 0 && (
                    <div className="border-t border-[#eeeeee]">

                        {returns.map((returnItem) => {
                            const status =
                                String(
                                    returnItem.status || ""
                                ).toLowerCase();

                            const returnItems =
                                Array.isArray(returnItem.items)
                                    ? returnItem.items
                                    : [];

                            const totalQuantity =
                                returnItems.reduce(
                                    (total, item) => {
                                        return (
                                            total +
                                            Number(
                                                item.quantity || 0
                                            )
                                        );
                                    },
                                    0
                                );

                            return (
                                <div
                                    key={returnItem.id}
                                    className="border-b border-[#eeeeee] px-[24px] py-[18px] last:border-b-0"
                                >
                                    <div className="flex flex-col justify-between gap-[12px] md:flex-row md:items-start">

                                        <div>
                                            <div className="flex flex-wrap items-center gap-[7px]">

                                                <p className="text-[14px] font-semibold text-[#222]">
                                                    {returnItem.return_no}
                                                </p>

                                                <ReturnStatusBadge
                                                    status={returnItem.status}
                                                />

                                                <RefundStatusBadge
                                                    status={returnItem.refund_status}
                                                />

                                            </div>

                                            <p className="mt-[6px] text-[12px] text-[#777]">
                                                Requested{" "}
                                                {formatDateTime(
                                                    returnItem.requested_at ||
                                                    returnItem.created_at
                                                )}
                                                {" · "}
                                                {totalQuantity} item
                                                {totalQuantity === 1
                                                    ? ""
                                                    : "s"}
                                            </p>
                                        </div>

                                        <div className="order-print-hide flex flex-wrap gap-[7px]">

                                            {status === "requested" && (
                                                <>
                                                    <ReturnActionButton
                                                        label="Approve"
                                                        onClick={() => {
                                                            onAction(
                                                                "approve",
                                                                returnItem
                                                            );
                                                        }}
                                                    />

                                                    <ReturnActionButton
                                                        label="Reject"
                                                        danger
                                                        onClick={() => {
                                                            onAction(
                                                                "reject",
                                                                returnItem
                                                            );
                                                        }}
                                                    />
                                                </>
                                            )}

                                            {status === "approved" && (
                                                <>
                                                    <ReturnActionButton
                                                        label="In Transit"
                                                        onClick={() => {
                                                            onAction(
                                                                "in_transit",
                                                                returnItem
                                                            );
                                                        }}
                                                    />

                                                    <ReturnActionButton
                                                        label="Received"
                                                        onClick={() => {
                                                            onAction(
                                                                "received",
                                                                returnItem
                                                            );
                                                        }}
                                                    />
                                                </>
                                            )}

                                            {status === "in_transit" && (
                                                <ReturnActionButton
                                                    label="Received"
                                                    onClick={() => {
                                                        onAction(
                                                            "received",
                                                            returnItem
                                                        );
                                                    }}
                                                />
                                            )}

                                            {[
                                                "requested",
                                                "approved",
                                                "in_transit",
                                            ].includes(status) && (
                                                <ReturnActionButton
                                                    label="Cancel"
                                                    danger
                                                    onClick={() => {
                                                        onAction(
                                                            "cancel",
                                                            returnItem
                                                        );
                                                    }}
                                                />
                                            )}

                                        </div>

                                    </div>

                                    <div className="mt-[14px] overflow-hidden rounded-[10px] border border-[#ececec]">

                                        {returnItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex flex-col justify-between gap-[8px] border-b border-[#eeeeee] bg-[#fcfcfc] px-[13px] py-[11px] last:border-b-0 sm:flex-row sm:items-center"
                                            >
                                                <div className="min-w-0">
                                                    <p className="truncate text-[12px] font-medium text-[#333]">
                                                        {item.product_name}
                                                        {item.variant_name
                                                            ? ` · ${item.variant_name}`
                                                            : ""}
                                                    </p>

                                                    <p className="mt-[2px] text-[11px] text-[#888]">
                                                        Qty {item.quantity}
                                                        {" · "}
                                                        {item.reason}
                                                        {item.item_condition
                                                            ? ` · ${item.item_condition}`
                                                            : ""}
                                                    </p>
                                                </div>

                                                {Number(
                                                    item.refund_amount || 0
                                                ) > 0 && (
                                                    <p className="shrink-0 text-[12px] font-semibold text-[#333]">
                                                        {formatMoney(
                                                            item.refund_amount
                                                        )}
                                                    </p>
                                                )}
                                            </div>
                                        ))}

                                    </div>

                                    {returnItem.admin_note && (
                                        <div className="mt-[10px] rounded-[9px] bg-[#f7f8fa] px-[12px] py-[9px]">
                                            <span className="text-[11px] font-medium text-[#666]">
                                                Internal note:
                                            </span>{" "}
                                            <span className="text-[11px] text-[#777]">
                                                {returnItem.admin_note}
                                            </span>
                                        </div>
                                    )}

                                    {Number(
                                        returnItem.refund_amount || 0
                                    ) > 0 && (
                                        <div className="mt-[10px] text-[12px] text-[#666]">
                                            Refund amount:{" "}
                                            <span className="font-semibold text-[#222]">
                                                {formatMoney(
                                                    returnItem.refund_amount
                                                )}
                                            </span>
                                        </div>
                                    )}

                                </div>
                            );
                        })}

                    </div>
                )}

        </section>
    );
};

const ReturnActionButton = ({
    label,
    onClick,
    danger = false,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`h-[32px] rounded-[8px] border px-[10px] text-[11px] font-semibold transition ${
                danger
                    ? "border-red-200 bg-white text-red-600 hover:bg-red-50"
                    : "border-[#dcdcdc] bg-white text-[#333] hover:bg-[#f7f7f7]"
            }`}
        >
            {label}
        </button>
    );
};

const ReturnStatusBadge = ({ status }) => {
    const value =
        String(status || "requested")
            .toLowerCase();

    let className =
        "bg-amber-50 text-amber-700";

    if (value === "approved") {
        className =
            "bg-blue-50 text-blue-700";
    }

    if (value === "in_transit") {
        className =
            "bg-purple-50 text-purple-700";
    }

    if (value === "received") {
        className =
            "bg-green-50 text-green-700";
    }

    if (value === "refunded") {
        className =
            "bg-cyan-50 text-cyan-700";
    }

    if (
        value === "rejected" ||
        value === "cancelled"
    ) {
        className =
            "bg-red-50 text-red-600";
    }

    return (
        <span
            className={`inline-flex rounded-full px-[8px] py-[4px] text-[10px] font-semibold ${className}`}
        >
            {formatStatus(status)}
        </span>
    );
};

const RefundStatusBadge = ({ status }) => {
    const value =
        String(status || "not_refunded")
            .toLowerCase();

    let className =
        "bg-[#f3f3f3] text-[#666]";

    if (value === "partially_refunded") {
        className =
            "bg-amber-50 text-amber-700";
    }

    if (value === "refunded") {
        className =
            "bg-green-50 text-green-700";
    }

    return (
        <span
            className={`inline-flex rounded-full px-[8px] py-[4px] text-[10px] font-semibold ${className}`}
        >
            {formatStatus(status)}
        </span>
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
    returns,
}) => {
    const events =
        buildTimeline(
            order,
            transactions,
            returns
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

    if (event.type === "return") {
        icon = <RefreshCcw size={14} />;

        iconClass =
            "border-orange-200 bg-orange-50 text-orange-600";
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
    transactions,
    returns = []
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

    if (Array.isArray(returns)) {
        returns.forEach((returnItem) => {
            if (returnItem.requested_at) {
                events.push({
                    type: "return",
                    text:
                        `Return ${returnItem.return_no} requested`,
                    date:
                        returnItem.requested_at,
                });
            }

            if (returnItem.approved_at) {
                events.push({
                    type: "return",
                    text:
                        `Return ${returnItem.return_no} approved`,
                    date:
                        returnItem.approved_at,
                });
            }

            if (returnItem.received_at) {
                events.push({
                    type: "return",
                    text:
                        `Return ${returnItem.return_no} received`,
                    date:
                        returnItem.received_at,
                });
            }

            if (returnItem.rejected_at) {
                events.push({
                    type: "return",
                    text:
                        `Return ${returnItem.return_no} rejected`,
                    date:
                        returnItem.rejected_at,
                });
            }

            if (returnItem.refunded_at) {
                events.push({
                    type: "return",
                    text:
                        `Return ${returnItem.return_no} refunded`,
                    date:
                        returnItem.refunded_at,
                });
            }

            if (returnItem.cancelled_at) {
                events.push({
                    type: "return",
                    text:
                        `Return ${returnItem.return_no} cancelled`,
                    date:
                        returnItem.cancelled_at,
                });
            }
        });
    }

    return events.sort((first, second) => {
        return (
            new Date(second.date) -
            new Date(first.date)
        );
    });
};


const getReturnedQuantity = (
    orderItemId,
    returns
) => {
    if (!Array.isArray(returns)) {
        return 0;
    }

    return returns.reduce(
        (total, returnItem) => {
            const status =
                String(
                    returnItem.status || ""
                ).toLowerCase();

            if (
                status === "rejected" ||
                status === "cancelled"
            ) {
                return total;
            }

            const returnItems =
                Array.isArray(returnItem.items)
                    ? returnItem.items
                    : [];

            const returnedQuantity =
                returnItems
                    .filter((item) => {
                        return (
                            Number(
                                item.order_item_id
                            ) ===
                            Number(orderItemId)
                        );
                    })
                    .reduce(
                        (quantity, item) => {
                            return (
                                quantity +
                                Number(
                                    item.quantity || 0
                                )
                            );
                        },
                        0
                    );

            return (
                total +
                returnedQuantity
            );
        },
        0
    );
};

const getAvailableReturnQuantity = (
    orderItem,
    returns
) => {
    const orderedQuantity =
        Number(
            orderItem?.quantity || 0
        );

    const returnedQuantity =
        getReturnedQuantity(
            orderItem?.id,
            returns
        );

    return Math.max(
        0,
        orderedQuantity -
        returnedQuantity
    );
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