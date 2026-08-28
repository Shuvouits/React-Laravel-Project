import { useMemo, useState } from "react";
import {
    Bookmark,
    CreditCard,
    Tag,
} from "lucide-react";

import PosHoldModal from "./PosHoldModal";

const PosCartSummary = ({
    cart,
    cartTotals,
    discount,
    onDiscount,
    formatMoney,
    onContinue,
    onHold,
    heldOrders = [],
    onResume,
}) => {
    const [holdModal, setHoldModal] = useState(false);

    const subtotal = Number(
        cartTotals?.subtotal || 0
    );

    const total = Number(
        cartTotals?.grandTotal ??
        cartTotals?.total ??
        subtotal
    );

    const discountAmount = Number(
        cartTotals?.discountAmount || 0
    );

    const itemCount = Number(
        cartTotals?.itemCount ??
        cart.length ??
        0
    );

    const unitCount = useMemo(() => {
        return cart.reduce(
            (sum, item) =>
                sum + Number(item.quantity || 0),
            0
        );
    }, [cart]);

    const hasDiscount =
        cart.length > 0 &&
        discountAmount > 0 &&
        Number(discount?.value || 0) > 0;

    const handleResume = () => {
        if (!heldOrders.length) {
            return;
        }

        if (heldOrders.length === 1) {
            onResume?.(heldOrders[0].id);
        }
    };

    return (
        <div className="shrink-0 border-t border-[#e7e8eb] bg-white">
            <PosHoldModal
                open={holdModal}
                onClose={() => setHoldModal(false)}
                onConfirm={(label) => {
                    setHoldModal(false);
                    onHold?.(label);
                }}
            />

            {/* ITEM TOTAL */}

            <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                    <span className="text-[13px] text-[#777a82]">
                        {itemCount}{" "}
                        {itemCount === 1 ? "item" : "items"} ·{" "}
                        {unitCount}{" "}
                        {unitCount === 1 ? "unit" : "units"}
                    </span>

                    <span className="text-[14px] font-semibold text-[#111214]">
                        {formatMoney(subtotal)}
                    </span>
                </div>

                {/* APPLIED DISCOUNT */}

                {hasDiscount && (
                    <button
                        type="button"
                        onClick={onDiscount}
                        className="
                            mt-4
                            flex
                            w-full
                            items-center
                            justify-between
                            border-t
                            border-[#eef0f2]
                            pt-4
                            text-left
                        "
                    >
                        <span className="flex items-center gap-2 text-[14px] font-medium text-[#1764df]">
                            <Tag size={16} strokeWidth={1.9} />
                            Discount · {formatMoney(discountAmount)}
                        </span>

                        <span className="rounded-[5px] border border-[#e3e6ea] bg-[#fafafa] px-1.5 py-0.5 text-[10px] text-[#8b8e95]">
                            F3
                        </span>
                    </button>
                )}
            </div>

            {/* TOTAL DUE */}

            <div className="border-t border-[#e7e8eb] px-6 py-4">
                <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#777a82]">
                        Total Due
                    </span>

                    <span className="text-[25px] font-semibold leading-none tracking-[-0.03em] text-[#111214]">
                        {formatMoney(total)}
                    </span>
                </div>
            </div>

            {/* ACTION BUTTONS */}

            <div className="grid grid-cols-[1fr_1fr_1.08fr] gap-2 px-6 pb-5">
                <button
                    type="button"
                    onClick={
                        cart.length
                            ? () => setHoldModal(true)
                            : handleResume
                    }
                    disabled={
                        cart.length === 0 &&
                        heldOrders.length === 0
                    }
                    className={`
                        relative
                        flex
                        h-[48px]
                        items-center
                        justify-center
                        gap-2
                        rounded-full
                        border
                        text-[13px]
                        font-medium
                        transition
                        disabled:cursor-not-allowed
                        disabled:border-[#e5e6e8]
                        disabled:bg-white
                        disabled:text-[#a8abb1]
                        ${
                            !cart.length && heldOrders.length
                                ? "border-[#ffb25b] bg-[#fff8ef] text-[#d96b00] hover:bg-[#fff2e1]"
                                : "border-[#e5e6e8] bg-white text-[#6f7279] hover:bg-[#fafafa]"
                        }
                    `}
                >
                    <Bookmark size={15} strokeWidth={1.8} />

                    {cart.length ? "Hold" : "Resume"}

                    {!cart.length && heldOrders.length > 0 && (
                        <span className="flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#f79009] px-1 text-[9px] font-semibold text-white">
                            {heldOrders.length}
                        </span>
                    )}

                    <span className="absolute right-2.5 top-1 rounded-[4px] bg-[#f4f4f5] px-1 text-[9px] text-[#a0a2a8]">
                        F4
                    </span>
                </button>

                <button
                    type="button"
                    onClick={onDiscount}
                    disabled={!cart.length}
                    className={`
                        relative
                        flex
                        h-[48px]
                        items-center
                        justify-center
                        gap-2
                        rounded-full
                        border
                        text-[13px]
                        font-medium
                        transition
                        disabled:cursor-not-allowed
                        disabled:border-[#e5e6e8]
                        disabled:bg-white
                        disabled:text-[#a8abb1]
                        ${
                            hasDiscount
                                ? "border-[#76a9fa] bg-[#edf4ff] text-[#1764df] hover:bg-[#e3efff]"
                                : "border-[#e5e6e8] bg-white text-[#6f7279] hover:bg-[#fafafa]"
                        }
                    `}
                >
                    <Tag size={15} strokeWidth={1.8} />
                    Discount

                    <span
                        className={`
                            absolute
                            right-2.5
                            top-1
                            rounded-[4px]
                            px-1
                            text-[9px]
                            ${
                                hasDiscount
                                    ? "bg-white/70 text-[#1764df]"
                                    : "bg-[#f4f4f5] text-[#a0a2a8]"
                            }
                        `}
                    >
                        F3
                    </span>
                </button>

                <button
                    type="button"
                    onClick={onContinue}
                    disabled={!cart.length}
                    className="
                        relative
                        flex
                        h-[48px]
                        items-center
                        justify-center
                        gap-2
                        rounded-full
                        bg-[#2468d8]
                        text-[13px]
                        font-semibold
                        text-white
                        transition
                        hover:bg-[#1d5fc9]
                        disabled:cursor-not-allowed
                        disabled:bg-[#f1f1f2]
                        disabled:text-[#73767d]
                    "
                >
                    <CreditCard size={15} strokeWidth={1.8} />
                    Checkout

                    <span className="absolute right-2.5 top-1 rounded-[4px] bg-white/10 px-1 text-[9px] text-current opacity-70">
                        F9
                    </span>
                </button>
            </div>
        </div>
    );
};

export default PosCartSummary;