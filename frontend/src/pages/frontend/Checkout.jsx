import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    LoaderCircle,
    MapPin,
    Package,
    Phone,
    Tag,
    Trash2,
} from "lucide-react";

import api from "../../api/axios";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../components/frontend/products/productHelpers";
import CheckoutDeliveryAddress from "../../components/frontend/checkout/CheckoutDeliveryAddress";

const Checkout = () => {
    const {
        cartItems,
        removeFromCart,
    } = useCart();

    const [shippingAddress, setShippingAddress] = useState(null);

    const [cartData, setCartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [shippingMethod, setShippingMethod] = useState("standard");
    const [paymentMethod, setPaymentMethod] = useState("stripe");
    const [billingSame, setBillingSame] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(true);
    const [couponCode, setCouponCode] = useState("");

    const [submittingOrder, setSubmittingOrder] = useState(false);
    const [orderError, setOrderError] = useState("");

    useEffect(() => {
        let active = true;

        const fetchCart = async () => {
            if (!cartItems.length) {
                setCartData(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError("");

                const items = cartItems.map((item) => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id || null,
                    quantity: Number(item.quantity || 1),
                }));

                const response = await api.post(
                    "/cart/summary",
                    {
                        items,
                    }
                );

                if (active) {
                    setCartData(
                        response.data || null
                    );
                }
            } catch (error) {
                if (!active) {
                    return;
                }

                console.error(
                    "Checkout error:",
                    error.response?.data ||
                    error.message
                );

                setError(
                    error.response?.data?.message ||
                    "Unable to load checkout."
                );
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        fetchCart();

        return () => {
            active = false;
        };
    }, [cartItems]);

    const handleCompleteOrder = async () => {
        if (submittingOrder) {
            return;
        }

        setOrderError("");

        if (!shippingAddress?.id) {
            setOrderError(
                "Please select a shipping address."
            );
            return;
        }

        if (!billingSame) {
            setOrderError(
                "Please use the shipping address as the billing address for now."
            );
            return;
        }

        if (!paymentMethod) {
            setOrderError(
                "Please select a payment method."
            );
            return;
        }

        if (!cartItems.length) {
            setOrderError(
                "Your cart is empty."
            );
            return;
        }

        try {
            setSubmittingOrder(true);

            const items = cartItems.map((item) => ({
                product_id: item.product_id,
                variant_id: item.variant_id || null,
                quantity: Number(item.quantity || 1),
            }));

            const payload = {
                items,
                shipping_address_id: shippingAddress.id,
                billing_same_as_shipping: true,
                billing_address_id: null,
                shipping_method: shippingMethod,
                payment_method: paymentMethod,
                coupon_code: couponCode.trim() || null,
                marketing_emails: marketingEmails,
            };

            console.log(
                "Checkout payload:",
                payload
            );

            const response = await api.post(
                "/customer/orders",
                payload
            );

            console.log(
                "Order response:",
                response.data
            );

            const redirectUrl =
                response.data?.payment?.redirect_url;

            if (redirectUrl) {
                window.location.assign(
                    redirectUrl
                );

                return;
            }

            setOrderError(
                response.data?.message ||
                "Payment redirect URL was not returned."
            );
        } catch (error) {
            console.error(
                "Create order error:",
                error.response?.data ||
                error.message
            );

            const validationErrors =
                error.response?.data?.errors;

            if (validationErrors) {
                const firstError =
                    Object.values(validationErrors)
                        .flat()
                        .find(Boolean);

                setOrderError(
                    firstError ||
                    "Unable to create order."
                );

                return;
            }

            setOrderError(
                error.response?.data?.error ||
                error.response?.data?.message ||
                "Unable to start payment."
            );
        } finally {
            setSubmittingOrder(false);
        }
    };

    if (loading) {
        return <CheckoutLoader />;
    }

    if (error) {
        return (
            <CheckoutError
                message={error}
            />
        );
    }

    if (
        !cartItems.length ||
        !cartData?.items?.length
    ) {
        return <EmptyCheckout />;
    }

    const subtotal = Number(
        cartData.summary?.subtotal || 0
    );

    const shipping =
        shippingMethod === "express"
            ? 50
            : 30;

    const tax =
        subtotal * 0.1;

    const total =
        subtotal +
        shipping +
        tax;

    return (
        <main className="bg-white font-['Inter']">

            <div className="mx-auto grid max-w-[1200px] grid-cols-1 lg:grid-cols-[minmax(0,1fr)_1px_minmax(0,1fr)] lg:gap-[55px]">

                <div className="px-5 pb-[55px] pt-[52px] lg:px-[35px] xl:px-[55px]">

                    <ContactDetails
                        marketingEmails={marketingEmails}
                        onMarketingChange={setMarketingEmails}
                    />

                    <Divider />

                    <CheckoutDeliveryAddress
                        onAddressChange={setShippingAddress}
                    />

                    <Divider />

                    <ShippingMethods
                        selected={shippingMethod}
                        onChange={setShippingMethod}
                    />

                    <div className="mt-[34px]">

                        <PaymentMethods
                            selected={paymentMethod}
                            onChange={setPaymentMethod}
                        />

                    </div>

                    <div className="mt-[34px]">

                        <BillingAddress
                            sameAsShipping={billingSame}
                            onChange={setBillingSame}
                        />

                    </div>

                    {orderError && (
                        <div className="mt-[24px] rounded-[9px] border border-red-200 bg-red-50 px-[14px] py-[12px] text-[13px] text-red-600">
                            {orderError}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={handleCompleteOrder}
                        disabled={submittingOrder}
                        className="mt-[24px] flex h-[50px] w-full items-center justify-center gap-[8px] rounded-[8px] bg-[#2065D1] text-[15px] font-semibold text-white transition hover:bg-[#1858bb] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submittingOrder && (
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                        )}

                        {submittingOrder
                            ? "Redirecting to payment..."
                            : "Complete order"}
                    </button>

                </div>

                <div className="hidden min-h-full bg-[#eeeeee] lg:block" />

                <div className="bg-[#fafafa] px-5 pb-[55px] pt-[52px] lg:px-[35px] xl:px-[55px]">

                    <OrderSummary
                        items={cartData.items}
                        subtotal={subtotal}
                        shipping={shipping}
                        tax={tax}
                        total={total}
                        couponCode={couponCode}
                        onCouponChange={setCouponCode}
                        onRemove={removeFromCart}
                    />

                </div>

            </div>

            <CheckoutFooter />

        </main>
    );
};

const ContactDetails = ({
    marketingEmails,
    onMarketingChange,
}) => {
    return (
        <section>

            <h2 className="text-[18px] font-semibold text-[#171717]">
                Contact details
            </h2>

            <div className="mt-[18px] flex items-center justify-between">

                <div className="flex items-center gap-[12px]">

                    <div className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#292929] text-[14px] font-semibold text-white">
                        A
                    </div>

                    <span className="text-[14px] text-[#777]">
                        admin@storify.com
                    </span>

                </div>

                <button
                    type="button"
                    className="text-[14px] font-medium text-[#2065D1] underline underline-offset-2"
                >
                    Logout
                </button>

            </div>

            <label className="mt-[16px] flex cursor-pointer items-center gap-[9px]">

                <input
                    type="checkbox"
                    checked={marketingEmails}
                    onChange={(event) => {
                        onMarketingChange(
                            event.target.checked
                        );
                    }}
                    className="h-[16px] w-[16px] accent-[#2065D1]"
                />

                <span className="text-[14px] text-[#333]">
                    Email me with news and others
                </span>

            </label>

        </section>
    );
};

const ShippingMethods = ({
    selected,
    onChange,
}) => {
    return (
        <section>

            <h2 className="text-[18px] font-semibold text-[#171717]">
                Shipping method
            </h2>

            <p className="mt-[11px] text-[14px] text-[#777]">
                Electronica XR
            </p>

            <div className="mt-[10px] space-y-[10px]">

                <ShippingOption
                    value="standard"
                    title="Standard Delivery"
                    subtitle="3-5 days"
                    price={30}
                    selected={selected}
                    onChange={onChange}
                />

                <ShippingOption
                    value="express"
                    title="Express Delivery"
                    subtitle="1-2 days"
                    price={50}
                    selected={selected}
                    onChange={onChange}
                />

            </div>

        </section>
    );
};

const ShippingOption = ({
    value,
    title,
    subtitle,
    price,
    selected,
    onChange,
}) => {
    const active =
        selected === value;

    return (
        <label
            className={`flex min-h-[68px] cursor-pointer items-center justify-between rounded-[14px] border px-[16px] ${
                active
                    ? "border-[#2065D1] bg-[#f5f8ff]"
                    : "border-[#dedede] bg-white"
            }`}
        >

            <div className="flex items-center gap-[12px]">

                <input
                    type="radio"
                    name="shipping"
                    checked={active}
                    onChange={() => {
                        onChange(value);
                    }}
                    className="h-[15px] w-[15px] accent-[#2065D1]"
                />

                <div>

                    <p className="text-[14px] font-medium text-[#222]">
                        {title}
                    </p>

                    <p className="mt-[2px] text-[13px] text-[#777]">
                        {subtitle}
                    </p>

                </div>

            </div>

            <span className="text-[14px] font-semibold text-[#111]">
                {formatPrice(price)}
            </span>

        </label>
    );
};

const PaymentMethods = ({
    selected,
    onChange,
}) => {
    const methods = [
        {
            value: "stripe",
            title: "Stripe",
            description: "Pay securely with your credit or debit card",
            logo: "/images/payment/stripe.svg",
            logoClass: "max-h-[27px] max-w-[65px]",
            fallback: "stripe",
        },
        {
            value: "paypal",
            title: "PayPal",
            description: "Pay securely using your PayPal account",
            logo: "/images/payment/paypal.svg",
            logoClass: "max-h-[27px] max-w-[72px]",
            fallback: "PayPal",
        },
        {
            value: "sslcommerz",
            title: "SSLCommerz",
            description: "Cards, mobile banking and internet banking",
            logo: "/images/payment/sslcommerz.png",
            logoClass: "max-h-[30px] max-w-[92px]",
            fallback: "SSLCommerz",
        },
    ];

    return (
        <section>

            <h2 className="text-[18px] font-semibold text-[#171717]">
                Payment Method
            </h2>

            <p className="mt-[8px] text-[14px] text-[#777]">
                All transactions are secure and encrypted.
            </p>

            <div className="mt-[15px] space-y-[10px]">

                {methods.map((method) => (
                    <PaymentOption
                        key={method.value}
                        method={method}
                        selected={selected}
                        onChange={onChange}
                    />
                ))}

            </div>

        </section>
    );
};

const PaymentOption = ({
    method,
    selected,
    onChange,
}) => {
    const active =
        selected === method.value;

    return (
        <label
            className={`flex min-h-[74px] cursor-pointer items-center justify-between gap-[16px] rounded-[14px] border px-[16px] py-[13px] transition ${
                active
                    ? "border-[#2065D1] bg-[#f5f8ff]"
                    : "border-[#dedede] bg-white hover:border-[#bfc9d9]"
            }`}
        >

            <div className="flex min-w-0 items-center gap-[13px]">

                <input
                    type="radio"
                    name="payment"
                    checked={active}
                    onChange={() => {
                        onChange(method.value);
                    }}
                    className="h-[16px] w-[16px] shrink-0 accent-[#2065D1]"
                />

                <PaymentLogo
                    method={method}
                />

                <div className="min-w-0">

                    <p className="text-[14px] font-semibold text-[#222]">
                        {method.title}
                    </p>

                    <p className="mt-[3px] text-[12px] leading-[18px] text-[#777]">
                        {method.description}
                    </p>

                </div>

            </div>

            {active && (
                <span className="shrink-0 rounded-full bg-[#e7efff] px-[9px] py-[4px] text-[10px] font-semibold text-[#2065D1]">
                    Selected
                </span>
            )}

        </label>
    );
};

const PaymentLogo = ({
    method,
}) => {
    const handleError = (event) => {
        event.currentTarget.style.display =
            "none";

        const fallback =
            event.currentTarget.nextElementSibling;

        if (fallback) {
            fallback.style.display =
                "flex";
        }
    };

    return (
        <div className="flex h-[42px] w-[92px] shrink-0 items-center justify-center rounded-[9px] border border-[#ececec] bg-white px-[9px]">

            <img
                src={method.logo}
                alt={`${method.title} logo`}
                onError={handleError}
                className={`object-contain ${method.logoClass}`}
            />

            <span
                style={{
                    display: "none",
                }}
                className={`items-center justify-center font-bold ${
                    method.value === "stripe"
                        ? "text-[17px] text-[#635BFF]"
                        : method.value === "paypal"
                            ? "text-[14px] text-[#003087]"
                            : "text-[11px] text-[#169447]"
                }`}
            >
                {method.fallback}
            </span>

        </div>
    );
};

const BillingAddress = ({
    sameAsShipping,
    onChange,
}) => {
    return (
        <section>

            <h2 className="text-[18px] font-semibold text-[#171717]">
                Billing Address
            </h2>

            <div className="mt-[14px] overflow-hidden rounded-[14px] border border-[#dedede]">

                <label
                    className={`flex min-h-[52px] cursor-pointer items-center gap-[11px] border-b border-[#e5e5e5] px-[16px] ${
                        sameAsShipping
                            ? "bg-[#edf3ff]"
                            : "bg-white"
                    }`}
                >

                    <input
                        type="radio"
                        name="billing"
                        checked={sameAsShipping}
                        onChange={() => {
                            onChange(true);
                        }}
                        className="h-[15px] w-[15px] accent-[#2065D1]"
                    />

                    <span className="text-[14px] text-[#333]">
                        Same as shipping address
                    </span>

                </label>

                <label
                    className={`flex min-h-[52px] cursor-pointer items-center gap-[11px] px-[16px] ${
                        !sameAsShipping
                            ? "bg-[#edf3ff]"
                            : "bg-white"
                    }`}
                >

                    <input
                        type="radio"
                        name="billing"
                        checked={!sameAsShipping}
                        onChange={() => {
                            onChange(false);
                        }}
                        className="h-[15px] w-[15px] accent-[#2065D1]"
                    />

                    <span className="text-[14px] text-[#333]">
                        Use a different billing address
                    </span>

                </label>

            </div>

        </section>
    );
};

const OrderSummary = ({
    items,
    subtotal,
    shipping,
    tax,
    total,
    couponCode,
    onCouponChange,
    onRemove,
}) => {
    return (
        <aside>

            <div className="flex items-center justify-between">

                <h2 className="text-[18px] font-semibold text-[#171717]">
                    Order summary
                </h2>

                <Link
                    to="/cart"
                    className="text-[14px] text-[#777] underline underline-offset-3 hover:text-[#2065D1]"
                >
                    Edit cart
                </Link>

            </div>

            <div className="mt-[28px] space-y-[12px]">

                <SummaryRow
                    label="Subtotal"
                    value={formatPrice(subtotal)}
                />

                <SummaryRow
                    label="Shipping"
                    value={formatPrice(shipping)}
                />

                <SummaryRow
                    label="Estimated Tax"
                    value={formatPrice(tax)}
                />

                <SummaryRow
                    label="Promo code"
                    value="Enter code"
                />

            </div>

            <div className="mt-[13px] flex gap-[10px]">

                <div className="relative flex-1">

                    <Tag
                        size={16}
                        className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#777]"
                    />

                    <input
                        type="text"
                        value={couponCode}
                        onChange={(event) => {
                            onCouponChange(
                                event.target.value
                            );
                        }}
                        placeholder="Enter coupon code"
                        className="h-[44px] w-full rounded-[13px] border border-[#dedede] bg-white pl-[39px] pr-[12px] text-[14px] outline-none focus:border-[#2065D1]"
                    />

                </div>

                <button
                    type="button"
                    className="h-[44px] rounded-[13px] border border-[#dedede] bg-white px-[18px] text-[14px] text-[#888] hover:text-[#2065D1]"
                >
                    Apply
                </button>

            </div>

            <div className="mt-[27px] border-t border-[#dedede] pt-[27px]">

                <div className="flex items-end justify-between">

                    <span className="text-[18px] font-semibold text-[#171717]">
                        Total
                    </span>

                    <div className="flex items-end gap-[8px]">

                        <span className="pb-[3px] text-[14px] text-[#777]">
                            USD
                        </span>

                        <span className="text-[28px] font-semibold leading-none text-[#171717]">
                            {formatPrice(total)}
                        </span>

                    </div>

                </div>

            </div>

            <div className="mt-[28px] border-t border-[#e1e1e1] pt-[24px]">

                <div className="space-y-[20px]">

                    {items.map((item) => (
                        <CheckoutItem
                            key={`${item.product_id}-${item.variant_id || "base"}`}
                            item={item}
                            onRemove={() => {
                                onRemove(
                                    item.product_id,
                                    item.variant_id
                                );
                            }}
                        />
                    ))}

                </div>

            </div>

        </aside>
    );
};

const SummaryRow = ({
    label,
    value,
}) => {
    return (
        <div className="flex items-center justify-between">

            <span className="text-[14px] text-[#777]">
                {label}
            </span>

            <span className="text-[14px] text-[#444]">
                {value}
            </span>

        </div>
    );
};

const CheckoutItem = ({
    item,
    onRemove,
}) => {
    return (
        <div className="flex items-center gap-[15px]">

            <Link
                to={`/products/${item.slug}`}
                className="flex h-[78px] w-[78px] shrink-0 items-center justify-center overflow-hidden rounded-[12px] bg-[#f3f3f4] p-[9px]"
            >

                {item.image_url ? (
                    <img
                        src={item.image_url}
                        alt={item.title}
                        className="max-h-full max-w-full object-contain"
                    />
                ) : (
                    <Package
                        size={23}
                        className="text-[#aaa]"
                    />
                )}

            </Link>

            <div className="min-w-0 flex-1">

                <Link
                    to={`/products/${item.slug}`}
                    className="block truncate text-[16px] font-medium text-[#171717] hover:text-[#2065D1]"
                >
                    {item.title}
                </Link>

                <p className="mt-[4px] text-[14px] text-[#777]">
                    Qty: {item.quantity}
                </p>

                <p className="mt-[4px] text-[15px] font-semibold text-[#222]">
                    {formatPrice(item.line_total)}
                </p>

            </div>

            <button
                type="button"
                onClick={onRemove}
                className="flex h-[32px] w-[32px] items-center justify-center text-[#777] hover:text-red-500"
            >
                <Trash2 size={16} />
            </button>

        </div>
    );
};

const Divider = () => {
    return (
        <div className="my-[32px] border-t border-[#e7e7e7]" />
    );
};

const CheckoutFooter = () => {
    return (
        <footer className="border-t border-[#e4e4e4] bg-[#f7f8fa]">

            <div className="mx-auto max-w-[1330px] px-5 py-[52px] lg:px-[35px] xl:px-[55px]">

                <div className="grid grid-cols-2 gap-[40px] md:grid-cols-[2fr_1fr_1fr_1fr_1fr]">

                    <div>

                        <FooterLogo />

                        <p className="mt-[16px] max-w-[310px] text-[14px] leading-[21px] text-[#777]">
                            Storify is a modern self-hosted eCommerce platform built with Next.js
                            for online stores, retail POS businesses, and multi-vendor marketplaces.
                        </p>

                        <p className="mt-[18px] text-[14px] font-semibold text-[#222]">
                            Contact
                        </p>

                        <div className="mt-[10px] space-y-[8px]">

                            <FooterContact
                                icon={<Phone size={15} />}
                                text="+17759865200"
                            />

                            <FooterContact
                                icon="✉"
                                text="store@example.com"
                            />

                            <FooterContact
                                icon={<MapPin size={15} />}
                                text="Main street, New York, 1000"
                            />

                        </div>

                    </div>

                    <FooterColumn
                        title="Products"
                        links={[
                            "Products",
                            "Categories",
                            "Collections",
                            "New Arrivals",
                        ]}
                    />

                    <FooterColumn
                        title="Help"
                        links={[
                            "Track Order",
                            "FAQ",
                            "Returns",
                            "Contact",
                        ]}
                    />

                    <FooterColumn
                        title="Company"
                        links={[
                            "Blog",
                            "Become a Vendor",
                        ]}
                    />

                    <FooterColumn
                        title="Legal"
                        links={[
                            "Terms of Service",
                            "Privacy Policy",
                        ]}
                    />

                </div>

            </div>

            <div className="border-t border-[#e3e3e3]">

                <div className="mx-auto flex max-w-[1330px] items-center justify-between px-5 py-[22px] lg:px-[35px] xl:px-[55px]">

                    <p className="text-[14px] text-[#777]">
                        © 2026 Storify. All rights reserved.
                    </p>

                    <p className="text-[14px] tracking-[4px] text-[#777]">
                        f 𝕏 ◎ ▶ in ♪
                    </p>

                </div>

            </div>

        </footer>
    );
};

const FooterLogo = () => {
    return (
        <div className="flex items-center gap-[8px]">

            <div className="flex h-[32px] w-[27px] items-center justify-center rounded-[5px] border-2 border-[#3478ea] text-[15px] font-bold text-[#3478ea]">
                S
            </div>

            <span className="text-[22px] font-bold text-[#3478ea]">
                Storify
            </span>

        </div>
    );
};

const FooterColumn = ({
    title,
    links,
}) => {
    return (
        <div>

            <h3 className="text-[16px] font-semibold text-[#171717]">
                {title}
            </h3>

            <div className="mt-[16px] space-y-[12px]">

                {links.map((link) => (
                    <p
                        key={link}
                        className="text-[14px] text-[#777]"
                    >
                        {link}
                    </p>
                ))}

            </div>

        </div>
    );
};

const FooterContact = ({
    icon,
    text,
}) => {
    return (
        <div className="flex items-center gap-[7px] text-[14px] text-[#777]">
            <span>{icon}</span>
            <span>{text}</span>
        </div>
    );
};

const CheckoutLoader = () => {
    return (
        <div className="flex min-h-[600px] items-center justify-center bg-white">

            <LoaderCircle
                size={30}
                className="animate-spin text-[#2065D1]"
            />

        </div>
    );
};

const CheckoutError = ({
    message,
}) => {
    return (
        <div className="mx-auto max-w-[1330px] px-5 py-[80px] text-center">

            <h1 className="text-[18px] font-semibold text-[#222]">
                Unable to load checkout
            </h1>

            <p className="mt-[8px] text-[14px] text-[#777]">
                {message}
            </p>

            <Link
                to="/cart"
                className="mt-[20px] inline-flex rounded-[8px] bg-[#2065D1] px-[18px] py-[10px] text-[14px] font-semibold text-white"
            >
                Back to Cart
            </Link>

        </div>
    );
};

const EmptyCheckout = () => {
    return (
        <div className="mx-auto max-w-[1330px] px-5 py-[90px] text-center">

            <h1 className="text-[18px] font-semibold text-[#222]">
                Your cart is empty
            </h1>

            <Link
                to="/"
                className="mt-[20px] inline-flex rounded-[8px] bg-[#2065D1] px-[18px] py-[10px] text-[14px] font-semibold text-white"
            >
                Continue Shopping
            </Link>

        </div>
    );
};

export default Checkout;