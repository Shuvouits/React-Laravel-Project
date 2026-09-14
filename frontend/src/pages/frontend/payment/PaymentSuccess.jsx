import { useEffect } from "react";

import {
    CheckCircle2,
} from "lucide-react";

import {
    Link,
    useSearchParams,
} from "react-router-dom";

import {
    useCart,
} from "../../../context/CartContext";

const PaymentSuccess = () => {
    const [
        searchParams,
    ] = useSearchParams();

    const {
        clearCart,
    } = useCart();

    const provider =
        searchParams.get(
            "provider"
        );

    const verified =
        searchParams.get(
            "verified"
        );

    const sessionId =
        searchParams.get(
            "session_id"
        );

    const paypalOrderId =
        searchParams.get(
            "paypal_order_id"
        );

    const orderId =
        searchParams.get(
            "order"
        );

    useEffect(() => {
        if (
            verified !== "1"
        ) {
            return;
        }

        let paymentReference = "";

        if (
            provider === "stripe"
        ) {
            paymentReference =
                sessionId || "";
        }

        if (
            provider === "paypal"
        ) {
            paymentReference =
                paypalOrderId || "";
        }

        if (
            !paymentReference
        ) {
            return;
        }

        const storageKey =
            `payment_cart_cleared_${provider}`;

        const processedPayment =
            localStorage.getItem(
                storageKey
            );

        if (
            processedPayment ===
            paymentReference
        ) {
            return;
        }

        clearCart();

        localStorage.setItem(
            storageKey,
            paymentReference
        );
    }, [
        provider,
        verified,
        sessionId,
        paypalOrderId,
        clearCart,
    ]);

    const providerName =
        getProviderName(
            provider
        );

    return (
        <div className="flex min-h-[70vh] items-center justify-center bg-[#f7f7f8] px-[20px] py-[50px]">

            <div className="w-full max-w-[520px] rounded-[20px] border border-[#e5e5e5] bg-white px-[35px] py-[45px] text-center shadow-sm">

                <div className="mx-auto flex h-[72px] w-[72px] items-center justify-center rounded-full bg-green-50">

                    <CheckCircle2
                        size={38}
                        className="text-green-600"
                    />

                </div>

                <h1 className="mt-[24px] text-[28px] font-semibold text-[#171717]">
                    Payment Successful
                </h1>

                <p className="mt-[10px] text-[14px] leading-[22px] text-[#777]">
                    Your payment has been confirmed and your order has been placed successfully.
                </p>

                {providerName && (
                    <p className="mt-[8px] text-[13px] text-[#999]">
                        Paid securely with{" "}
                        <span className="font-medium text-[#555]">
                            {providerName}
                        </span>
                    </p>
                )}

                {orderId && (
                    <div className="mt-[24px] rounded-[12px] bg-[#f7f8fa] px-[16px] py-[14px]">

                        <p className="text-[12px] text-[#888]">
                            Order Reference
                        </p>

                        <p className="mt-[4px] text-[15px] font-semibold text-[#222]">
                            #{orderId}
                        </p>

                    </div>
                )}

                <div className="mt-[30px] flex items-center justify-center gap-[10px]">

                    <Link
                        to="/account"
                        className="flex h-[44px] items-center justify-center rounded-[10px] bg-[#2467d5] px-[20px] text-[14px] font-semibold text-white transition hover:bg-[#1e59ba]"
                    >
                        View My Account
                    </Link>

                    <Link
                        to="/"
                        className="flex h-[44px] items-center justify-center rounded-[10px] border border-[#dedede] bg-white px-[20px] text-[14px] font-semibold text-[#333] transition hover:bg-[#f7f7f7]"
                    >
                        Continue Shopping
                    </Link>

                </div>

            </div>

        </div>
    );
};

const getProviderName = (
    provider
) => {
    if (
        provider === "stripe"
    ) {
        return "Stripe";
    }

    if (
        provider === "paypal"
    ) {
        return "PayPal";
    }

    if (
        provider === "sslcommerz"
    ) {
        return "SSLCommerz";
    }

    return "";
};

export default PaymentSuccess;