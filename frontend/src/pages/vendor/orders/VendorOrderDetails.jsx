import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    CreditCard,
    LoaderCircle,
    Mail,
    MapPin,
    Package,
    Phone,
    ReceiptText,
    UserRound,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    useNavigate,
    useParams,
} from "react-router-dom";

import api from "../../../api/axios";


const VendorOrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");


    useEffect(() => {
        fetchOrder();
    }, [id]);


    const fetchOrder = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                `/vendor/orders/${id}`
            );

            const orderData =
                response.data?.order || null;

            if (!orderData) {
                throw new Error(
                    "Order data not found."
                );
            }

            setOrder(orderData);
        } catch (error) {
            console.error(
                "Vendor order details error:",
                error.response?.data ||
                error.message
            );

            setError(
                error.response?.data?.message ||
                error.message ||
                "Unable to load order details."
            );

            setOrder(null);
        } finally {
            setLoading(false);
        }
    };


    const handleBack = () => {
        navigate(
            "/vendor/orders"
        );
    };


    if (loading) {
        return <PageLoader />;
    }


    if (
        error ||
        !order
    ) {
        return (
            <OrderError
                message={
                    error ||
                    "Order not found."
                }
                onBack={handleBack}
            />
        );
    }


    return (
        <VendorOrderDetailsContent
            order={order}
            onBack={handleBack}
        />
    );
};


const VendorOrderDetailsContent = ({
    order,
    onBack,
}) => {
    const items =
        Array.isArray(order.items)
            ? order.items
            : [];

    const transactions =
        Array.isArray(
            order.payment_transactions
        )
            ? order.payment_transactions
            : Array.isArray(
                order.paymentTransactions
            )
            ? order.paymentTransactions
            : [];

    const shippingAddress =
        order.shipping_address ||
        order.shippingAddress ||
        null;

    const billingAddress =
        order.billing_address ||
        order.billingAddress ||
        null;

    const itemCount =
        items.reduce(
            (total, item) =>
                total +
                Number(
                    item.quantity || 0
                ),
            0
        );

    const vendorNetSales =
        Number(
            order.net_sales ??
            items.reduce(
                (total, item) =>
                    total +
                    Number(
                        item.line_total || 0
                    ),
                0
            )
        );

    const paymentAmount = useMemo(() => {
        const paidTransaction =
            transactions.find(
                (transaction) =>
                    String(
                        transaction.status || ""
                    ).toLowerCase() ===
                    "paid"
            );

        return Number(
            paidTransaction?.amount ??
            vendorNetSales
        );
    }, [
        transactions,
        vendorNetSales,
    ]);


    return (
        <div className="min-h-screen bg-[#f6f6f7] px-[24px] py-[24px] font-['Inter']">

            <div className="mx-auto max-w-[1500px]">

                <div className="flex flex-col gap-[16px] sm:flex-row sm:items-start sm:justify-between">

                    <div>

                        <div className="flex flex-wrap items-center gap-[9px]">

                            <h1 className="text-[22px] font-semibold text-[#171717]">
                                {order.order_no}
                            </h1>

                            <PaymentBadge
                                status={
                                    order.payment_status
                                }
                            />

                            <FulfillmentBadge
                                status={
                                    order.delivery_status ||
                                    order.fulfillment_status
                                }
                            />

                        </div>

                        <div className="mt-[6px] flex flex-wrap items-center gap-x-[16px] gap-y-[6px] text-[12px] text-[#777]">

                            <span className="inline-flex items-center gap-[6px]">
                                <CalendarDays
                                    size={14}
                                />

                                {formatDateTime(
                                    order.placed_at ||
                                    order.created_at
                                )}
                            </span>

                            <span>
                                {itemCount}{" "}
                                {itemCount === 1
                                    ? "item"
                                    : "items"}
                            </span>

                            <span>
                                {formatChannel(
                                    order.channel
                                )}
                            </span>

                        </div>

                    </div>


                    <button
                        type="button"
                        onClick={onBack}
                        className="flex h-[38px] items-center gap-[7px] self-start rounded-full border border-[#dedede] bg-white px-[14px] text-[13px] font-medium text-[#222] transition hover:bg-[#f7f7f7]"
                    >
                        <ArrowLeft
                            size={15}
                        />

                        Back
                    </button>

                </div>


                <div className="mt-[24px] grid grid-cols-1 gap-[22px] xl:grid-cols-[minmax(0,1fr)_420px]">

                    <div className="space-y-[22px]">

                        <OrderItemsCard
                            items={items}
                        />


                        <PaymentSummaryCard
                            order={order}
                            vendorNetSales={
                                vendorNetSales
                            }
                            paymentAmount={
                                paymentAmount
                            }
                        />


                        <TimelineCard
                            order={order}
                            transactions={
                                transactions
                            }
                        />

                    </div>


                    <div className="space-y-[18px]">

                        <CustomerCard
                            customer={
                                order.user
                            }
                        />


                        <AddressCard
                            title="Shipping address"
                            address={
                                shippingAddress
                            }
                        />


                        <AddressCard
                            title="Billing address"
                            address={
                                billingAddress
                            }
                        />


                        <OrderInfoCard
                            order={order}
                        />

                    </div>

                </div>

            </div>

        </div>
    );
};


const OrderItemsCard = ({
    items,
}) => {
    return (
        <section className="overflow-hidden rounded-[17px] border border-[#dedede] bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-[#eeeeee] px-[24px] py-[20px]">

                <div>

                    <h2 className="text-[17px] font-semibold text-[#171717]">
                        Products
                    </h2>

                    <p className="mt-[3px] text-[12px] text-[#888]">
                        Items from your store included in this order.
                    </p>

                </div>


                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#edf3ff] text-[#2467d5]">
                    <Package
                        size={18}
                    />
                </div>

            </div>


            {!items.length && (
                <div className="px-[24px] py-[34px] text-center text-[13px] text-[#888]">
                    No vendor items found in this order.
                </div>
            )}


            {items.map((item) => (
                <div
                    key={item.id}
                    className="flex flex-col gap-[14px] border-b border-[#eeeeee] px-[24px] py-[18px] last:border-b-0 sm:flex-row sm:items-center"
                >

                    <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] border border-[#e3e3e3] bg-[#f7f7f7]">

                        {item.image_url ? (
                            <img
                                src={
                                    item.image_url
                                }
                                alt={
                                    item.product_name ||
                                    "Product"
                                }
                                className="h-full w-full object-contain p-[4px]"
                            />
                        ) : (
                            <Package
                                size={22}
                                className="text-[#aaa]"
                            />
                        )}

                    </div>


                    <div className="min-w-0 flex-1">

                        <p className="truncate text-[14px] font-semibold text-[#222]">
                            {item.product_name ||
                                "Product"}
                        </p>

                        <div className="mt-[4px] flex flex-wrap items-center gap-[7px]">

                            {item.variant_name && (
                                <span className="rounded-full bg-[#f0ebff] px-[8px] py-[3px] text-[11px] font-medium text-[#6843bf]">
                                    {item.variant_name}
                                </span>
                            )}

                            {item.sku && (
                                <span className="text-[11px] text-[#777]">
                                    {item.sku}
                                </span>
                            )}

                        </div>

                    </div>


                    <div className="flex items-center justify-between gap-[28px] sm:justify-end">

                        <div className="text-right">

                            <p className="text-[11px] text-[#888]">
                                Qty
                            </p>

                            <p className="mt-[3px] text-[13px] font-semibold text-[#333]">
                                {Number(
                                    item.quantity || 0
                                )}
                            </p>

                        </div>


                        <div className="min-w-[110px] text-right">

                            <p className="text-[14px] font-semibold text-[#222]">
                                {formatMoney(
                                    item.line_total
                                )}
                            </p>

                            <p className="mt-[3px] text-[11px] text-[#888]">
                                {formatMoney(
                                    item.unit_price
                                )}{" "}
                                each
                            </p>

                        </div>

                    </div>

                </div>
            ))}

        </section>
    );
};


const PaymentSummaryCard = ({
    order,
    vendorNetSales,
    paymentAmount,
}) => {
    return (
        <section className="overflow-hidden rounded-[17px] border border-[#dedede] bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-[#eeeeee] px-[24px] py-[20px]">

                <div>

                    <h2 className="text-[17px] font-semibold text-[#171717]">
                        Payment
                    </h2>

                    <p className="mt-[3px] text-[12px] text-[#888]">
                        Payment summary for your items in this order.
                    </p>

                </div>


                <div className="flex h-[38px] w-[38px] items-center justify-center rounded-full bg-[#eef7f2] text-[#188254]">
                    <CreditCard
                        size={18}
                    />
                </div>

            </div>


            <div className="px-[24px] py-[18px]">

                <SummaryRow
                    label="Vendor net sales"
                    value={
                        formatMoney(
                            vendorNetSales
                        )
                    }
                />

                <SummaryRow
                    label="Payment status"
                    value={
                        formatStatus(
                            order.payment_status
                        )
                    }
                />

                <SummaryRow
                    label="Payment method"
                    value={
                        formatPaymentMethod(
                            order.payment_method
                        )
                    }
                />

                <div className="mt-[13px] border-t border-[#eeeeee] pt-[13px]">

                    <SummaryRow
                        label="Recorded payment"
                        value={
                            formatMoney(
                                paymentAmount
                            )
                        }
                        strong
                    />

                </div>

            </div>

        </section>
    );
};


const TimelineCard = ({
    order,
    transactions,
}) => {
    const timeline =
        buildTimeline(
            order,
            transactions
        );


    return (
        <section className="overflow-hidden rounded-[17px] border border-[#dedede] bg-white shadow-sm">

            <div className="border-b border-[#eeeeee] px-[24px] py-[20px]">

                <h2 className="text-[17px] font-semibold text-[#171717]">
                    Timeline
                </h2>

                <p className="mt-[3px] text-[12px] text-[#888]">
                    Key events recorded for this order.
                </p>

            </div>


            <div className="px-[24px] py-[20px]">

                {timeline.map(
                    (event, index) => (
                        <div
                            key={`${event.type}-${index}`}
                            className="relative flex gap-[14px] pb-[22px] last:pb-0"
                        >

                            {index <
                                timeline.length -
                                    1 && (
                                <div className="absolute left-[7px] top-[17px] h-[calc(100%-4px)] w-px bg-[#e4e4e4]" />
                            )}


                            <div className="relative z-10 mt-[4px] h-[15px] w-[15px] shrink-0 rounded-full border-[3px] border-white bg-[#2467d5] shadow-[0_0_0_1px_#cddbf4]" />


                            <div>

                                <p className="text-[13px] font-medium text-[#333]">
                                    {event.text}
                                </p>

                                <p className="mt-[4px] text-[11px] text-[#888]">
                                    {formatDateTime(
                                        event.date
                                    )}
                                </p>

                            </div>

                        </div>
                    )
                )}

            </div>

        </section>
    );
};


const CustomerCard = ({
    customer,
}) => {
    return (
        <SideCard
            title="Customer"
            icon={
                <UserRound
                    size={17}
                />
            }
        >

            {!customer ? (
                <p className="text-[13px] text-[#888]">
                    Customer information unavailable.
                </p>
            ) : (
                <div>

                    <p className="text-[14px] font-semibold text-[#222]">
                        {customer.name ||
                            "Customer"}
                    </p>


                    {customer.email && (
                        <p className="mt-[10px] flex items-center gap-[8px] text-[12px] text-[#666]">

                            <Mail
                                size={14}
                            />

                            {customer.email}
                        </p>
                    )}


                    {customer.phone && (
                        <p className="mt-[8px] flex items-center gap-[8px] text-[12px] text-[#666]">

                            <Phone
                                size={14}
                            />

                            {customer.phone}
                        </p>
                    )}

                </div>
            )}

        </SideCard>
    );
};


const AddressCard = ({
    title,
    address,
}) => {
    return (
        <SideCard
            title={title}
            icon={
                <MapPin
                    size={17}
                />
            }
        >

            {!address ? (
                <p className="text-[13px] text-[#888]">
                    No address available.
                </p>
            ) : (
                <div className="space-y-[4px] text-[12px] leading-5 text-[#666]">

                    {address.name && (
                        <p className="font-semibold text-[#333]">
                            {address.name}
                        </p>
                    )}

                    {address.address_line1 && (
                        <p>
                            {address.address_line1}
                        </p>
                    )}

                    {address.address_line2 && (
                        <p>
                            {address.address_line2}
                        </p>
                    )}

                    <p>
                        {[
                            address.city,
                            address.state,
                            address.postal_code,
                        ]
                            .filter(Boolean)
                            .join(", ")}
                    </p>

                    {address.country && (
                        <p>
                            {address.country}
                        </p>
                    )}

                </div>
            )}

        </SideCard>
    );
};


const OrderInfoCard = ({
    order,
}) => {
    return (
        <SideCard
            title="Order information"
            icon={
                <ReceiptText
                    size={17}
                />
            }
        >

            <InfoRow
                label="Order number"
                value={
                    order.order_no
                }
            />

            <InfoRow
                label="Order status"
                value={
                    formatStatus(
                        order.status
                    )
                }
            />

            <InfoRow
                label="Fulfillment"
                value={
                    formatStatus(
                        order.fulfillment_status
                    )
                }
            />

            <InfoRow
                label="Delivery"
                value={
                    formatStatus(
                        order.delivery_status
                    )
                }
            />

            <InfoRow
                label="Channel"
                value={
                    formatChannel(
                        order.channel
                    )
                }
            />

        </SideCard>
    );
};


const SideCard = ({
    title,
    icon,
    children,
}) => {
    return (
        <section className="rounded-[17px] border border-[#dedede] bg-white px-[22px] py-[20px] shadow-sm">

            <div className="mb-[18px] flex items-center justify-between">

                <h2 className="text-[15px] font-semibold text-[#171717]">
                    {title}
                </h2>

                <span className="text-[#666]">
                    {icon}
                </span>

            </div>

            {children}

        </section>
    );
};


const SummaryRow = ({
    label,
    value,
    strong = false,
}) => {
    return (
        <div className="flex items-center justify-between gap-[20px] py-[7px]">

            <span
                className={
                    strong
                        ? "text-[14px] font-semibold text-[#222]"
                        : "text-[13px] text-[#666]"
                }
            >
                {label}
            </span>

            <span
                className={
                    strong
                        ? "text-[15px] font-semibold text-[#171717]"
                        : "text-[13px] font-medium text-[#333]"
                }
            >
                {value}
            </span>

        </div>
    );
};


const InfoRow = ({
    label,
    value,
}) => {
    return (
        <div className="flex items-center justify-between gap-[18px] border-b border-[#eeeeee] py-[10px] first:pt-0 last:border-b-0 last:pb-0">

            <span className="text-[12px] text-[#777]">
                {label}
            </span>

            <span className="max-w-[210px] text-right text-[12px] font-medium text-[#333]">
                {value || "-"}
            </span>

        </div>
    );
};


const PaymentBadge = ({
    status,
}) => {
    const normalized =
        String(
            status || "pending"
        ).toLowerCase();


    if (normalized === "paid") {
        return (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-[#edf7f1] px-[9px] py-[4px] text-[10px] font-semibold text-[#158457]">
                <CheckCircle2
                    size={12}
                />
                Paid
            </span>
        );
    }


    if (
        normalized === "refunded" ||
        normalized ===
            "partially_refunded"
    ) {
        return (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-[#e8f1ff] px-[9px] py-[4px] text-[10px] font-semibold text-[#2467d5]">
                <Clock3
                    size={12}
                />
                {formatStatus(
                    normalized
                )}
            </span>
        );
    }


    return (
        <span className="inline-flex items-center gap-[5px] rounded-full bg-[#fff1c9] px-[9px] py-[4px] text-[10px] font-semibold text-[#a96600]">
            <Clock3
                size={12}
            />
            {formatStatus(
                normalized
            )}
        </span>
    );
};


const FulfillmentBadge = ({
    status,
}) => {
    const normalized =
        String(
            status || "unfulfilled"
        ).toLowerCase();


    if (
        normalized === "delivered" ||
        normalized === "fulfilled"
    ) {
        return (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-[#dcfaea] px-[9px] py-[4px] text-[10px] font-semibold text-[#158457]">
                <CheckCircle2
                    size={12}
                />
                {formatStatus(
                    normalized
                )}
            </span>
        );
    }


    if (
        normalized === "shipped" ||
        normalized === "in_transit"
    ) {
        return (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-[#e8f1ff] px-[9px] py-[4px] text-[10px] font-semibold text-[#2467d5]">
                <Clock3
                    size={12}
                />
                {formatStatus(
                    normalized
                )}
            </span>
        );
    }


    if (normalized === "cancelled") {
        return (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-red-50 px-[9px] py-[4px] text-[10px] font-semibold text-red-600">
                <Clock3
                    size={12}
                />
                Cancelled
            </span>
        );
    }


    return (
        <span className="inline-flex items-center gap-[5px] rounded-full bg-[#f1f2f4] px-[9px] py-[4px] text-[10px] font-semibold text-[#606a78]">
            <Clock3
                size={12}
            />
            {formatStatus(
                normalized
            )}
        </span>
    );
};


const PageLoader = () => {
    return (
        <div className="flex min-h-[calc(100vh-74px)] items-center justify-center bg-[#f6f6f7]">

            <div className="flex flex-col items-center gap-[10px]">

                <LoaderCircle
                    size={30}
                    className="animate-spin text-[#2467d5]"
                />

                <p className="text-[13px] text-[#777]">
                    Loading order...
                </p>

            </div>

        </div>
    );
};


const OrderError = ({
    message,
    onBack,
}) => {
    return (
        <div className="flex min-h-[calc(100vh-74px)] items-center justify-center bg-[#f6f6f7] px-[20px]">

            <div className="w-full max-w-[430px] rounded-[16px] border border-[#dedede] bg-white p-[28px] text-center shadow-sm">

                <ReceiptText
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
            `Order placed via ${formatChannel(
                order.channel
            ).toLowerCase()}`,
        date:
            order.placed_at ||
            order.created_at,
    });


    transactions.forEach(
        (transaction) => {
            const status =
                String(
                    transaction.status || ""
                ).toLowerCase();

            if (status === "paid") {
                events.push({
                    type: "payment",
                    text:
                        `${formatMoney(
                            transaction.amount
                        )} payment received`,
                    date:
                        transaction.paid_at ||
                        transaction.updated_at ||
                        transaction.created_at,
                });
            }

            if (
                status === "refunded" ||
                status ===
                    "partially_refunded"
            ) {
                events.push({
                    type: "payment",
                    text:
                        `${formatMoney(
                            transaction.refund_amount ||
                            transaction.amount
                        )} refunded`,
                    date:
                        transaction.refunded_at ||
                        transaction.updated_at ||
                        transaction.created_at,
                });
            }
        }
    );


    if (order.shipped_at) {
        events.push({
            type: "shipping",
            text:
                "Order marked as shipped",
            date:
                order.shipped_at,
        });
    }


    if (
        order.delivery_status ===
        "delivered"
    ) {
        events.push({
            type: "delivery",
            text:
                "Order delivered",
            date:
                order.delivered_at ||
                order.updated_at,
        });
    }


    if (
        order.status === "cancelled"
    ) {
        events.push({
            type: "cancelled",
            text:
                "Order cancelled",
            date:
                order.cancelled_at ||
                order.updated_at,
        });
    }


    return events
        .filter(
            (event) =>
                event.date
        )
        .sort(
            (a, b) =>
                new Date(a.date) -
                new Date(b.date)
        );
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

    return new Date(value)
        .toLocaleString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
            }
        );
};


const formatStatus = (value) => {
    if (!value) {
        return "-";
    }

    return String(value)
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            (letter) =>
                letter.toUpperCase()
        );
};


const formatPaymentMethod = (
    value
) => {
    if (!value) {
        return "-";
    }

    if (value === "cod") {
        return "Cash on Delivery";
    }

    return formatStatus(value);
};


const formatChannel = (value) => {
    if (
        value === "point_of_sale"
    ) {
        return "Point of Sale";
    }

    if (value === "manual") {
        return "Manual";
    }

    return "Online Store";
};


export default VendorOrderDetails;