import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    Box,
    CheckCircle2,
    ChevronRight,
    CreditCard,
    Download,
    LoaderCircle,
    MapPin,
    Package,
    Truck,
    XCircle,
} from "lucide-react";

import api from "../../../api/axios";
import CustomerSidebar from "../../../components/frontend/account/CustomerSidebar";

const CustomerOrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [invoiceLoading, setInvoiceLoading] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                `/customer/orders/${id}`
            );

            setOrder(
                response.data?.order || null
            );
        } catch (error) {
            console.error(
                "Customer order details error:",
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
        navigate("/account/orders");
    };

    const handleDownloadInvoice = async () => {
        if (!order || invoiceLoading) {
            return;
        }

        try {
            setInvoiceLoading(true);

            const response = await api.get(
                `/customer/orders/${order.id}/invoice`,
                {
                    responseType: "blob",
                }
            );

            const blob = new Blob(
                [response.data],
                {
                    type: "application/pdf",
                }
            );

            const url =
                window.URL.createObjectURL(blob);

            const link =
                document.createElement("a");

            link.href = url;
            link.download =
                `invoice-${order.order_no}.pdf`;

            document.body.appendChild(link);

            link.click();

            document.body.removeChild(link);

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(
                "Invoice download error:",
                error.response?.data || error.message
            );

            alert(
                error.response?.data?.message ||
                "Unable to download invoice."
            );
        } finally {
            setInvoiceLoading(false);
        }
    };

    if (loading) {
        return <OrderLoader />;
    }

    if (error) {
        return (
            <OrderError
                message={error}
                onBack={() => navigate("/account")}
            />
        );
    }

    if (!order) {
        return (
            <OrderError
                message="Order not found."
                onBack={() => navigate("/account")}
            />
        );
    }

    const items =
        Array.isArray(order.items)
            ? order.items
            : [];

    const shippingAddress =
        order.shipping_address ||
        order.shippingAddress ||
        null;

    const billingAddress =
        order.billing_address ||
        order.billingAddress ||
        null;

    return (
        <main className="min-h-screen bg-white font-['Inter']">

            <div className="mx-auto max-w-[1330px] px-5 pb-[70px] pt-[32px]">

                <Breadcrumb
                    order={order}
                />

                <div className="mt-[28px] grid grid-cols-1 gap-[32px] lg:grid-cols-[250px_minmax(0,1fr)]">

                    <CustomerSidebar />

                    <div className="min-w-0">

                        <button
                            type="button"
                            onClick={handleBack}
                            className="flex items-center gap-[8px] text-[14px] font-medium text-[#171717] transition hover:text-[#2065D1]"
                        >
                            <ArrowLeft
                                size={16}
                                strokeWidth={1.8}
                            />

                            Back to Orders
                        </button>

                        <div className="mt-[28px] flex flex-wrap items-start justify-between gap-[20px]">

                            <div>

                                <h1 className="text-[27px] font-semibold leading-[1.2] text-[#171717]">
                                    {order.order_no}
                                </h1>

                                <p className="mt-[7px] text-[15px] text-[#777]">
                                    Placed on{" "}
                                    {formatDateTime(
                                        order.placed_at ||
                                        order.created_at
                                    )}
                                </p>

                            </div>

                            <div className="flex items-center gap-[10px]">

                                <OrderStatus
                                    status={order.status}
                                />

                                <button
                                    type="button"
                                    onClick={handleDownloadInvoice}
                                    disabled={invoiceLoading}
                                    className="flex h-[38px] items-center gap-[7px] rounded-[9px] border border-[#dedede] bg-white px-[14px] text-[13px] font-medium text-[#171717] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {invoiceLoading ? (
                                        <LoaderCircle
                                            size={15}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <Download
                                            size={15}
                                        />
                                    )}

                                    {invoiceLoading
                                        ? "Downloading..."
                                        : "Invoice"}
                                </button>

                            </div>

                        </div>

                        <div className="mt-[26px] grid grid-cols-1 gap-[20px] md:grid-cols-3">

                            <AddressCard
                                title="Shipping Address"
                                address={shippingAddress}
                            />

                            <AddressCard
                                title="Billing Address"
                                address={billingAddress}
                            />

                            <PaymentCard
                                order={order}
                            />

                        </div>

                        <OrderItemsCard
                            order={order}
                            items={items}
                        />

                    </div>

                </div>

            </div>

        </main>
    );
};

const Breadcrumb = ({ order }) => {
    return (
        <div className="flex flex-wrap items-center gap-[9px] text-[14px] text-[#777]">

            <Link
                to="/"
                className="hover:text-[#2065D1]"
            >
                Home
            </Link>

            <ChevronRight
                size={14}
                strokeWidth={1.7}
            />

            <Link
                to="/account"
                className="hover:text-[#2065D1]"
            >
                Account
            </Link>

            <ChevronRight
                size={14}
                strokeWidth={1.7}
            />

            <Link
                to="/account/orders"
                className="hover:text-[#2065D1]"
            >
                My Orders
            </Link>

            <ChevronRight
                size={14}
                strokeWidth={1.7}
            />

            <span className="font-medium text-[#171717]">
                {order?.order_no || "Order Details"}
            </span>

        </div>
    );
};

const AddressCard = ({
    title,
    address,
}) => {
    return (
        <section className="min-h-[200px] rounded-[12px] border border-[#dedede] bg-white px-[22px] py-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">

            <div className="flex items-center gap-[8px]">

                <MapPin
                    size={17}
                    strokeWidth={1.8}
                    className="text-[#333]"
                />

                <h2 className="text-[16px] font-semibold text-[#171717]">
                    {title}
                </h2>

            </div>

            {!address && (
                <p className="mt-[17px] text-[14px] text-[#999]">
                    No address available.
                </p>
            )}

            {address && (
                <div className="mt-[15px] text-[14px] leading-[24px] text-[#555]">

                    <p className="font-medium text-[#171717]">
                        {getAddressName(address)}
                    </p>

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
                        {formatCityLine(address)}
                    </p>

                    {address.country && (
                        <p>
                            {address.country}
                        </p>
                    )}

                    {address.phone && (
                        <p className="mt-[4px]">
                            {address.phone}
                        </p>
                    )}

                </div>
            )}

        </section>
    );
};

const PaymentCard = ({ order }) => {
    return (
        <section className="min-h-[200px] rounded-[12px] border border-[#dedede] bg-white px-[22px] py-[20px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">

            <div className="flex items-center gap-[8px]">

                <CreditCard
                    size={17}
                    strokeWidth={1.8}
                    className="text-[#333]"
                />

                <h2 className="text-[16px] font-semibold text-[#171717]">
                    Payment Method
                </h2>

            </div>

            <div className="mt-[20px] space-y-[14px]">

                <div className="flex items-center justify-between gap-[15px]">

                    <span className="text-[14px] text-[#777]">
                        Method
                    </span>

                    <span className="text-[14px] font-medium text-[#171717]">
                        {formatPaymentMethod(
                            order.payment_method
                        )}
                    </span>

                </div>

                <div className="flex items-center justify-between gap-[15px]">

                    <span className="text-[14px] text-[#777]">
                        Status
                    </span>

                    <PaymentStatus
                        status={order.payment_status}
                    />

                </div>

            </div>

        </section>
    );
};

const OrderItemsCard = ({
    order,
    items,
}) => {
    const totalQuantity =
        items.reduce((total, item) => {
            return total + Number(
                item.quantity || 0
            );
        }, 0);

    return (
        <section className="mt-[22px] rounded-[12px] border border-[#dedede] bg-white px-[24px] py-[22px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">

            <h2 className="text-[17px] font-semibold text-[#171717]">
                Order Items
            </h2>

            <p className="mt-[5px] text-[13px] text-[#777]">
                {totalQuantity}{" "}
                {totalQuantity === 1
                    ? "item"
                    : "items"}
            </p>

            <div className="mt-[20px]">

                {items.map((item) => (
                    <OrderItem
                        key={item.id}
                        item={item}
                    />
                ))}

            </div>

            <div className="border-t border-[#e5e5e5] pt-[15px]">

                <SummaryRow
                    label="Subtotal"
                    value={formatMoney(
                        order.subtotal,
                        order.currency
                    )}
                />

                <SummaryRow
                    label="Shipping"
                    value={formatMoney(
                        order.shipping_total,
                        order.currency
                    )}
                />

                {Number(order.discount_total || 0) > 0 && (
                    <SummaryRow
                        label="Discount"
                        value={`-${formatMoney(
                            order.discount_total,
                            order.currency
                        )}`}
                    />
                )}

                <SummaryRow
                    label="Tax"
                    value={formatMoney(
                        order.tax_total,
                        order.currency
                    )}
                />

                <div className="mt-[13px] border-t border-[#e5e5e5] pt-[15px]">

                    <div className="flex items-center justify-between gap-[20px]">

                        <span className="text-[17px] font-semibold text-[#171717]">
                            Total
                        </span>

                        <span className="text-[18px] font-semibold text-[#171717]">
                            {formatMoney(
                                order.grand_total,
                                order.currency
                            )}
                        </span>

                    </div>

                </div>

            </div>

        </section>
    );
};

const OrderItem = ({ item }) => {
    return (
        <div className="flex items-center gap-[15px] border-b border-[#eeeeee] py-[15px] first:pt-0 last:border-b-0">

            <div className="flex h-[62px] w-[62px] shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-[#f5f5f5]">

                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={
                            item.product_name ||
                            "Product"
                        }
                        className="h-full w-full object-contain p-[5px]"
                    />
                ) : (
                    <Box
                        size={23}
                        strokeWidth={1.6}
                        className="text-[#777]"
                    />
                )}

            </div>

            <div className="min-w-0 flex-1">

                <p className="truncate text-[15px] font-medium text-[#171717]">
                    {item.product_name}
                </p>

                {item.variant_name && (
                    <p className="mt-[3px] truncate text-[13px] text-[#777]">
                        {item.variant_name}
                    </p>
                )}

                <p className="mt-[3px] text-[13px] text-[#777]">
                    Qty: {item.quantity}
                </p>

            </div>

            <div className="text-right">

                <p className="text-[15px] font-semibold text-[#171717]">
                    {formatMoney(
                        item.line_total,
                        item.currency || "USD"
                    )}
                </p>

                <p className="mt-[3px] text-[13px] text-[#777]">
                    {formatMoney(
                        item.unit_price,
                        item.currency || "USD"
                    )} each
                </p>

            </div>

        </div>
    );
};

const SummaryRow = ({
    label,
    value,
}) => {
    return (
        <div className="mb-[10px] flex items-center justify-between gap-[20px] last:mb-0">

            <span className="text-[14px] text-[#666]">
                {label}
            </span>

            <span className="text-[14px] font-medium text-[#171717]">
                {value}
            </span>

        </div>
    );
};

const OrderStatus = ({
    status,
}) => {
    const value =
        String(status || "pending")
            .toLowerCase();

    if (value === "processing") {
        return (
            <span className="inline-flex items-center gap-[6px] rounded-full bg-[#8455ec] px-[14px] py-[7px] text-[13px] font-medium text-white">

                <Package size={14} />

                Processing

            </span>
        );
    }

    if (value === "shipped") {
        return (
            <span className="inline-flex items-center gap-[6px] rounded-full bg-[#ede8ff] px-[14px] py-[7px] text-[13px] font-medium text-[#6940cb]">

                <Truck size={14} />

                Shipped

            </span>
        );
    }

    if (value === "cancelled") {
        return (
            <span className="inline-flex items-center gap-[6px] rounded-full bg-[#ffe7e7] px-[14px] py-[7px] text-[13px] font-medium text-[#d52a2a]">

                <XCircle size={14} />

                Cancelled

            </span>
        );
    }

    if (value === "completed") {
        return (
            <span className="inline-flex items-center gap-[6px] rounded-full bg-[#e9f7ee] px-[14px] py-[7px] text-[13px] font-medium text-[#198754]">

                <CheckCircle2 size={14} />

                Completed

            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-[6px] rounded-full bg-[#fff1c9] px-[14px] py-[7px] text-[13px] font-medium text-[#9a6400]">

            <Package size={14} />

            {formatStatus(value)}

        </span>
    );
};

const PaymentStatus = ({
    status,
}) => {
    const value =
        String(status || "pending")
            .toLowerCase();

    if (value === "paid") {
        return (
            <span className="rounded-full bg-[#2065D1] px-[9px] py-[4px] text-[11px] font-semibold text-white">
                paid
            </span>
        );
    }

    if (value === "refunded") {
        return (
            <span className="rounded-full bg-[#e8e4ff] px-[9px] py-[4px] text-[11px] font-semibold text-[#6743c6]">
                refunded
            </span>
        );
    }

    if (value === "partially_refunded") {
        return (
            <span className="rounded-full bg-[#e8e4ff] px-[9px] py-[4px] text-[11px] font-semibold text-[#6743c6]">
                partially refunded
            </span>
        );
    }

    return (
        <span className="rounded-full bg-[#fff1c9] px-[9px] py-[4px] text-[11px] font-semibold text-[#986400]">
            {formatStatus(value)}
        </span>
    );
};

const OrderLoader = () => {
    return (
        <main className="flex min-h-[600px] items-center justify-center bg-white">

            <LoaderCircle
                size={30}
                className="animate-spin text-[#2065D1]"
            />

        </main>
    );
};

const OrderError = ({
    message,
    onBack,
}) => {
    return (
        <main className="flex min-h-[600px] items-center justify-center bg-white px-[20px]">

            <div className="w-full max-w-[430px] rounded-[14px] border border-[#dedede] bg-white px-[30px] py-[32px] text-center">

                <h2 className="text-[19px] font-semibold text-[#171717]">
                    Unable to load order
                </h2>

                <p className="mt-[8px] text-[14px] leading-[22px] text-[#777]">
                    {message}
                </p>

                <button
                    type="button"
                    onClick={onBack}
                    className="mt-[20px] h-[40px] rounded-[9px] bg-[#2065D1] px-[18px] text-[14px] font-semibold text-white"
                >
                    Back to Account
                </button>

            </div>

        </main>
    );
};

const getAddressName = (address) => {
    if (!address) {
        return "";
    }

    return [
        address.first_name,
        address.last_name,
    ]
        .filter(Boolean)
        .join(" ");
};

const formatCityLine = (address) => {
    const city = address?.city || "";
    const state = address?.state || "";
    const postalCode =
        address?.postal_code || "";

    let line = city;

    if (state) {
        line += city
            ? `, ${state}`
            : state;
    }

    if (postalCode) {
        line += line
            ? ` ${postalCode}`
            : postalCode;
    }

    return line;
};

const formatPaymentMethod = (value) => {
    const method =
        String(value || "")
            .toLowerCase();

    if (method === "stripe") {
        return "Card";
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

const formatMoney = (
    value,
    currency = "USD"
) => {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency:
                currency || "USD",
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
                month: "long",
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
        .replace(/\b\w/g, (letter) => {
            return letter.toUpperCase();
        });
};

export default CustomerOrderDetails;