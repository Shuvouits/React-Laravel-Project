import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Minus, Plus, X } from "lucide-react";

import { useCart } from "../../../context/CartContext";
import { formatPrice } from "../products/productHelpers";

const CartDrawer = () => {
    const {
        cartOpen,
        cartItems,
        cartTotal,
        closeCart,
        updateQuantity,
        removeFromCart,
    } = useCart();

    useEffect(() => {
        if (!cartOpen) {
            return;
        }

        const oldOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                closeCart();
            }
        };

        window.addEventListener("keydown", handleEscape);

        return () => {
            document.body.style.overflow = oldOverflow;

            window.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [cartOpen, closeCart]);

    return (
        <div
            className={`fixed inset-0 z-[9999] ${
                cartOpen
                    ? "pointer-events-auto"
                    : "pointer-events-none"
            }`}
        >

            {/* Overlay */}
            <button
                type="button"
                aria-label="Close shopping cart"
                onClick={closeCart}
                className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${
                    cartOpen
                        ? "opacity-100"
                        : "opacity-0"
                }`}
            />

            {/* Drawer */}
            <aside
                className={`absolute right-0 top-0 flex h-full w-full max-w-[390px] flex-col bg-white shadow-[-12px_0_35px_rgba(0,0,0,0.12)] transition-transform duration-300 ease-out ${
                    cartOpen
                        ? "translate-x-0"
                        : "translate-x-full"
                }`}
            >

                {/* Header */}
                <div className="flex h-[66px] shrink-0 items-center justify-between border-b border-[#e9e9e9] px-[22px]">

                    <h2 className="text-[20px] font-semibold text-[#171717]">
                        Shopping Cart
                    </h2>

                    <button
                        type="button"
                        onClick={closeCart}
                        className="flex h-[35px] w-[35px] items-center justify-center rounded-full text-[#222] transition hover:bg-[#f5f5f5]"
                    >
                        <X size={20} />
                    </button>

                </div>

                {/* Products */}
                <div className="flex-1 overflow-y-auto">

                    {cartItems.length > 0 ? (
                        <div className="divide-y divide-[#eeeeee]">

                            {cartItems.map((item) => (
                                <CartItem
                                    key={`${item.product_id}-${item.variant_id || "base"}`}
                                    item={item}
                                    onUpdate={updateQuantity}
                                    onRemove={removeFromCart}
                                    onNavigate={closeCart}
                                />
                            ))}

                        </div>
                    ) : (
                        <EmptyCart onClose={closeCart} />
                    )}

                </div>

                {/* Footer */}
                {cartItems.length > 0 && (
                    <CartFooter
                        subtotal={cartTotal}
                        onClose={closeCart}
                    />
                )}

            </aside>

        </div>
    );
};

// Cart item
const CartItem = ({
    item,
    onUpdate,
    onRemove,
    onNavigate,
}) => {
    const quantity = Number(item.quantity || 1);

    const decreaseQuantity = () => {
        if (quantity <= 1) {
            return;
        }

        onUpdate(
            item.product_id,
            item.variant_id,
            quantity - 1
        );
    };

    const increaseQuantity = () => {
        onUpdate(
            item.product_id,
            item.variant_id,
            quantity + 1
        );
    };

    const removeItem = () => {
        onRemove(
            item.product_id,
            item.variant_id
        );
    };

    return (
        <div className="px-[22px] py-[18px]">

            <div className="flex gap-[14px]">

                <Link
                    to={`/products/${item.slug}`}
                    onClick={onNavigate}
                    className="flex h-[70px] w-[70px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#f4f4f4] p-[8px]"
                >
                    {item.image ? (
                        <img
                            src={item.image}
                            alt={item.title}
                            className="max-h-full max-w-full object-contain"
                        />
                    ) : (
                        <span className="text-[10px] text-[#999]">
                            No image
                        </span>
                    )}
                </Link>

                <div className="min-w-0 flex-1">

                    <div className="flex items-start justify-between gap-[10px]">

                        <Link
                            to={`/products/${item.slug}`}
                            onClick={onNavigate}
                            className="line-clamp-2 text-[14px] font-medium leading-[19px] text-[#222] hover:text-[#2065D1]"
                        >
                            {item.title}
                        </Link>

                        <span className="shrink-0 rounded-full border border-[#00b777] px-[9px] py-[3px] text-[13px] font-semibold text-[#009d66]">
                            {formatPrice(item.price)}
                        </span>

                    </div>

                    <CartItemOptions options={item.options} />

                    <div className="mt-[10px] flex items-center justify-between">

                        <QuantityControl
                            quantity={quantity}
                            onDecrease={decreaseQuantity}
                            onIncrease={increaseQuantity}
                        />

                        <button
                            type="button"
                            onClick={removeItem}
                            className="text-[12px] font-medium text-[#2065D1] hover:underline"
                        >
                            Remove
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};

// Selected options
const CartItemOptions = ({ options }) => {
    if (
        !options ||
        !Object.keys(options).length
    ) {
        return null;
    }

    const values = Object.values(options)
        .filter(Boolean)
        .join(" / ");

    return (
        <p className="mt-[4px] truncate text-[11px] text-[#777]">
            {values}
        </p>
    );
};

// Quantity
const QuantityControl = ({
    quantity,
    onDecrease,
    onIncrease,
}) => {
    return (
        <div className="flex h-[36px] overflow-hidden rounded-[12px] border border-[#e2e2e2]">

            <button
                type="button"
                onClick={onDecrease}
                disabled={quantity <= 1}
                className="flex w-[35px] items-center justify-center text-[#777] hover:bg-[#f7f7f7] disabled:opacity-40"
            >
                <Minus size={13} />
            </button>

            <div className="flex min-w-[35px] items-center justify-center border-x border-[#e7e7e7] text-[13px] font-medium">
                {quantity}
            </div>

            <button
                type="button"
                onClick={onIncrease}
                className="flex w-[35px] items-center justify-center text-[#333] hover:bg-[#f7f7f7]"
            >
                <Plus size={13} />
            </button>

        </div>
    );
};

// Cart footer
const CartFooter = ({
    subtotal,
    onClose,
}) => {
    return (
        <div className="shrink-0 border-t border-[#e6e6e6] bg-white px-[22px] pb-[24px] pt-[20px]">

            <div className="flex items-center justify-between">

                <span className="text-[14px] font-medium text-[#222]">
                    Subtotal
                </span>

                <span className="text-[20px] font-semibold text-[#171717]">
                    {formatPrice(subtotal)}
                </span>

            </div>

            <p className="mt-[12px] text-[12px] text-[#777]">
                Shipping and taxes calculated at checkout.
            </p>

            <div className="mt-[18px] grid grid-cols-2 gap-[10px]">

                <Link
                    to="/cart"
                    onClick={onClose}
                    className="flex h-[42px] items-center justify-center rounded-full border border-[#dedede] bg-white text-[13px] font-medium text-[#222] transition hover:bg-[#f7f7f7]"
                >
                    View cart
                </Link>

                <Link
                    to="/checkout"
                    onClick={onClose}
                    className="flex h-[42px] items-center justify-center rounded-full bg-[#2065D1] text-[13px] font-semibold text-white transition hover:bg-[#1858bb]"
                >
                    Check out
                </Link>

            </div>

            <button
                type="button"
                onClick={onClose}
                className="mt-[17px] flex w-full items-center justify-center gap-[6px] text-[12px] font-medium uppercase tracking-[0.04em] text-[#666] hover:text-[#2065D1]"
            >
                Continue shopping
                <span>→</span>
            </button>

        </div>
    );
};

// Empty cart
const EmptyCart = ({ onClose }) => {
    return (
        <div className="flex h-full flex-col items-center justify-center px-[30px] text-center">

            <div className="flex h-[70px] w-[70px] items-center justify-center rounded-full bg-[#f5f5f5]">
                <span className="text-[28px]">
                    🛒
                </span>
            </div>

            <h3 className="mt-[18px] text-[18px] font-semibold text-[#222]">
                Your cart is empty
            </h3>

            <p className="mt-[7px] text-[13px] text-[#777]">
                Add something to your cart to see it here.
            </p>

            <button
                type="button"
                onClick={onClose}
                className="mt-[20px] rounded-full bg-[#2065D1] px-[22px] py-[10px] text-[13px] font-semibold text-white"
            >
                Continue shopping
            </button>

        </div>
    );
};

export default CartDrawer;