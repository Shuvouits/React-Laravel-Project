import { useEffect, useState } from "react";
import {
    ReceiptText,
    UserRound,
    UserRoundPlus,
    X,
} from "lucide-react";

import PosCartItem from "./PosCartItem";
import PosCartSummary from "./PosCartSummary";

const PosCart = ({
    cart,
    cartTotals,
    discount,
    onDiscount,
    onIncrease,
    onDecrease,
    onRemove,
    formatMoney,
    onAddCustomer,
    onRemoveCustomer,
    selectedCustomer,
    onContinuePayment,
    onHold,
    heldOrders = [],
    onResume,
}) => {
    const [photoFailed, setPhotoFailed] = useState(false);

    const customerName = selectedCustomer
        ? selectedCustomer.name ||
          [
              selectedCustomer.first_name,
              selectedCustomer.last_name,
          ]
              .filter(Boolean)
              .join(" ") ||
          "Customer"
        : "";

    const customerEmail = selectedCustomer?.email || null;

    const customerPhotoUrl =
        selectedCustomer?.photo_url ||
        selectedCustomer?.photo ||
        selectedCustomer?.avatar ||
        selectedCustomer?.image ||
        null;

    useEffect(() => {
        setPhotoFailed(false);
    }, [selectedCustomer?.id, customerPhotoUrl]);

    return (
        <aside className="flex h-full min-h-0 flex-col border-l border-[#e4e5e7] bg-white">
            <div className="shrink-0 px-6 pb-4 pt-5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-[#62656d]">
                    Order
                </p>

                <h2 className="mt-0.5 text-[16px] font-semibold leading-5 text-[#161719]">
                    Current Sale
                </h2>

                <p className="mt-0.5 text-[12px] leading-4 text-[#858890]">
                    {cartTotals?.itemCount || 0}{" "}
                    {Number(cartTotals?.itemCount || 0) === 1
                        ? "item"
                        : "items"}
                </p>
            </div>

            <div className="shrink-0 px-6 pb-4">
                {selectedCustomer ? (
                    <div className="flex min-h-[66px] items-center gap-3 rounded-[16px] border border-[#c9dcff] bg-[#f7faff] px-4 py-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#eaf2ff] text-[#2563eb]">
                            {customerPhotoUrl && !photoFailed ? (
                                <img
                                    src={customerPhotoUrl}
                                    alt={customerName}
                                    className="h-full w-full object-cover"
                                    onError={() => setPhotoFailed(true)}
                                />
                            ) : (
                                <UserRound size={18} strokeWidth={1.8} />
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={onAddCustomer}
                            className="min-w-0 flex-1 text-left"
                        >
                            <span className="block truncate text-[13px] font-semibold text-[#202126]">
                                {customerName}
                            </span>

                            <span className="mt-0.5 block truncate text-[11px] text-[#858890]">
                                {customerEmail || "Customer attached"}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={onRemoveCustomer}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#777a82] transition hover:bg-white hover:text-[#e5484d]"
                            aria-label="Remove customer"
                        >
                            <X size={15} />
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        onClick={onAddCustomer}
                        className="flex min-h-[66px] w-full items-center gap-3 rounded-[16px] border border-dashed border-[#b9d8ff] bg-[#fbfdff] px-4 text-left transition hover:border-[#8fbdff] hover:bg-[#f7faff]"
                    >
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c9ddff] bg-white text-[#1769e0]">
                            <UserRoundPlus size={19} strokeWidth={1.8} />
                        </span>

                        <span className="min-w-0 flex-1">
                            <span className="block text-[14px] font-medium leading-5 text-[#1769e0]">
                                Add customer
                            </span>

                            <span className="mt-0.5 block text-[12px] leading-4 text-[#858890]">
                                Earn loyalty, attach to order
                            </span>
                        </span>

                        <span className="rounded-[4px] border border-[#bfd5ff] bg-[#eef5ff] px-1.5 py-0.5 text-[10px] font-medium text-[#2563eb]">
                            F2
                        </span>
                    </button>
                )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto border-t border-[#f0f0f1] scrollbar-thin scrollbar-track-transparent scrollbar-thumb-[#d1d5db]">
                {cart.length === 0 ? (
                    <div className="flex h-full min-h-[280px] flex-col items-center justify-center px-6 pb-10 text-center">
                        <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#fafafa] text-[#dfe1e5]">
                            <ReceiptText size={31} strokeWidth={1.5} />
                        </div>

                        <p className="mt-5 text-[14px] font-normal text-[#a0a2a8]">
                            No items in cart
                        </p>

                        {heldOrders.length > 0 && (
                            <div className="mt-5 flex w-full max-w-[280px] flex-col gap-2">
                                {heldOrders.map((order) => (
                                    <button
                                        key={order.id}
                                        type="button"
                                        onClick={() => onResume?.(order.id)}
                                        className="rounded-full border border-[#c8dcff] bg-white px-4 py-2 text-[12px] font-medium text-[#2563eb] transition hover:bg-[#f5f9ff]"
                                    >
                                        {order.label || "Held order"} · Resume
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="divide-y divide-[#eeeeef]">
                        {cart.map((item) => (
                            <PosCartItem
                                key={item.cartKey}
                                item={item}
                                onIncrease={onIncrease}
                                onDecrease={onDecrease}
                                onRemove={onRemove}
                                formatMoney={formatMoney}
                            />
                        ))}
                    </div>
                )}
            </div>

            <PosCartSummary
                cart={cart}
                cartTotals={cartTotals}
                discount={discount}
                onDiscount={onDiscount}
                formatMoney={formatMoney}
                onContinue={onContinuePayment}
                onHold={onHold}
                heldOrders={heldOrders}
                onResume={onResume}
            />
        </aside>
    );
};

export default PosCart;