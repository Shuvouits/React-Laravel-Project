import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { useCart } from "../../../context/CartContext";

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();

    const {
        cartItems,
        removeFromCart,
    } = useCart();

    const clearedRef = useRef(false);

    const provider =
        searchParams.get("provider");

    const sessionId =
        searchParams.get("session_id");

    const orderId =
        searchParams.get("order");

    useEffect(() => {
        if (clearedRef.current) {
            return;
        }

        if (
            provider !== "stripe" ||
            !sessionId
        ) {
            return;
        }

        clearedRef.current = true;

        cartItems.forEach((item) => {
            removeFromCart(
                item.product_id,
                item.variant_id || null
            );
        });
    }, [
        provider,
        sessionId,
        cartItems,
        removeFromCart,
    ]);

    return (
        <main className="flex min-h-[650px] items-center justify-center bg-[#f7f8fa] px-5 py-[70px]">

            <div className="w-full max-w-[560px] rounded-[18px] border border-[#e7e7e7] bg-white px-[32px] py-[45px] text-center shadow-sm">

                <div className="mx-auto flex h-[70px] w-[70px] items-center justify-center rounded-full bg-green-50">
                    <CheckCircle2
                        size={38}
                        className="text-green-600"
                    />
                </div>

                <h1 className="mt-[24px] text-[28px] font-bold text-[#171717]">
                    Payment Successful
                </h1>

                <p className="mx-auto mt-[10px] max-w-[420px] text-[14px] leading-[22px] text-[#777]">
                    Thank you. Your payment was completed successfully and your order has been received.
                </p>

                {orderId && (
                    <div className="mt-[24px] rounded-[12px] bg-[#f7f8fa] px-[18px] py-[14px]">

                        <p className="text-[12px] text-[#888]">
                            Order ID
                        </p>

                        <p className="mt-[3px] text-[15px] font-semibold text-[#222]">
                            #{orderId}
                        </p>

                    </div>
                )}

                <div className="mt-[30px] flex flex-col justify-center gap-[10px] sm:flex-row">

                    <Link
                        to="/account"
                        className="flex h-[44px] items-center justify-center rounded-[9px] bg-[#2065D1] px-[22px] text-[14px] font-semibold text-white hover:bg-[#1858bb]"
                    >
                        View My Account
                    </Link>

                    <Link
                        to="/"
                        className="flex h-[44px] items-center justify-center rounded-[9px] border border-[#dedede] bg-white px-[22px] text-[14px] font-semibold text-[#333] hover:bg-[#f7f7f7]"
                    >
                        Continue Shopping
                    </Link>

                </div>

            </div>

        </main>
    );
};

export default PaymentSuccess;