import { useEffect, useState } from "react";
import { Heart, LoaderCircle } from "lucide-react";
import { Link } from "react-router-dom";

import api from "../../api/axios";
import { useCart } from "../../context/CartContext";
import { formatPrice } from "../../components/frontend/products/productHelpers";

const Cart = () => {
    const {
        cartItems,
        updateQuantity,
        removeFromCart,
    } = useCart();

    const [cartData, setCartData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Fetch cart summary
    useEffect(() => {
        let active = true;

        const fetchCart = async () => {
            if (!cartItems.length) {
                if (active) {
                    setCartData({
                        groups: [],
                        items: [],
                        unavailable_items: [],
                        summary: {
                            subtotal: 0,
                            shipping: null,
                            estimated_tax: null,
                            promo_discount: 0,
                            sale_savings: 0,
                            total: 0,
                        },
                    });

                    setLoading(false);
                    setError("");
                }

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

                const response = await api.post("/cart/summary", {
                    items,
                });

                if (!active) {
                    return;
                }

                setCartData(response.data || null);
            } catch (error) {
                if (!active) {
                    return;
                }

                console.error(
                    "Cart summary error:",
                    error.response?.data || error.message
                );

                setError(
                    error.response?.data?.message ||
                    "Unable to load your shopping bag."
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

    if (loading) {
        return <CartLoader />;
    }

    if (error) {
        return <CartError message={error} />;
    }

    const groups = cartData?.groups || [];
    const summary = cartData?.summary || {};
    const sellerCount = groups.length;

    if (!cartItems.length || !groups.length) {
        return <EmptyCartPage />;
    }

    return (
        <main className="min-h-screen bg-white font-['Inter']">

            <div className="mx-auto max-w-[1280px] px-5 pb-[80px] pt-[32px]">

                <CartBreadcrumb />

                <div className="mt-[28px] grid grid-cols-1 gap-[55px] lg:grid-cols-[minmax(0,1fr)_350px]">

                    <div>

                        <h1 className="text-[22px] font-semibold text-[#171717]">
                            Shopping bag
                        </h1>

                        {sellerCount > 1 && (
                            <SellerNotice sellerCount={sellerCount} />
                        )}

                        <div className="mt-[28px]">

                            {groups.map((group) => (
                                <SellerGroup
                                    key={group.seller?.key}
                                    group={group}
                                    onQuantityChange={updateQuantity}
                                    onRemove={removeFromCart}
                                />
                            ))}

                        </div>

                    </div>

                    <OrderSummary summary={summary} />

                </div>

            </div>

        </main>
    );
};

// Breadcrumb
const CartBreadcrumb = () => {
    return (
        <div className="flex items-center gap-[10px] text-[13px] text-[#777]">

            <Link to="/" className="hover:text-[#2065D1]">
                Home
            </Link>

            <span>›</span>

            <span className="font-medium text-[#171717]">
                Cart
            </span>

        </div>
    );
};

// Seller notice
const SellerNotice = ({ sellerCount }) => {
    return (
        <div className="mt-[23px] rounded-[15px] border border-[#dedede] px-[15px] py-[13px]">

            <p className="text-[12px] leading-[19px] text-[#777]">
                Your bag has items from {sellerCount} sellers, so this order will be delivered.
                In-store collection is only offered when everything comes from one seller.
            </p>

        </div>
    );
};

// Seller group
const SellerGroup = ({
    group,
    onQuantityChange,
    onRemove,
}) => {
    return (
        <section className="border-b border-[#e5e5e5] pb-[28px] last:border-b-0">

            <h2 className="mb-[17px] text-[12px] font-semibold uppercase tracking-[0.04em] text-[#666]">
                Sold by {group.seller?.name || "Storify"}
            </h2>

            <div className="space-y-[26px]">

                {(group.items || []).map((item) => (
                    <CartProduct
                        key={`${item.product_id}-${item.variant_id || "base"}`}
                        item={item}
                        onQuantityChange={onQuantityChange}
                        onRemove={onRemove}
                    />
                ))}

            </div>

        </section>
    );
};

// Cart product
const CartProduct = ({
    item,
    onQuantityChange,
    onRemove,
}) => {
    const options = item.options || [];

    const changeQuantity = (event) => {
        onQuantityChange(
            item.product_id,
            item.variant_id,
            Number(event.target.value)
        );
    };

    const removeItem = () => {
        onRemove(
            item.product_id,
            item.variant_id
        );
    };

    return (
        <div className="grid grid-cols-[125px_minmax(0,1fr)] gap-[20px]">

            <div className="relative">

                <Link
                    to={`/products/${item.slug}`}
                    className="flex h-[145px] w-[125px] items-center justify-center overflow-hidden rounded-[12px] bg-[#f3f3f4] p-[14px]"
                >
                    {item.image_url ? (
                        <img
                            src={item.image_url}
                            alt={item.title}
                            className="max-h-full max-w-full object-contain"
                        />
                    ) : (
                        <span className="text-[11px] text-[#999]">
                            No image
                        </span>
                    )}
                </Link>

                <button
                    type="button"
                    title="Add to wishlist"
                    className="absolute right-[7px] top-[7px] flex h-[28px] w-[28px] items-center justify-center rounded-full bg-white text-[#333] shadow-sm"
                >
                    <Heart
                        size={16}
                        strokeWidth={1.7}
                    />
                </button>

            </div>

            <div className="min-w-0">

                <Link
                    to={`/products/${item.slug}`}
                    className="text-[15px] font-medium text-[#171717] transition-colors hover:text-[#2065D1]"
                >
                    {item.title}
                </Link>

                <p className="mt-[5px] text-[14px] font-semibold text-[#111]">
                    {formatPrice(item.price)}
                </p>

                <div className="mt-[18px] grid grid-cols-2 gap-x-[30px] gap-y-[15px] sm:grid-cols-[1fr_1fr_120px]">

                    {options.map((option) => (
                        <ProductOption
                            key={`${option.name}-${option.value}`}
                            option={option}
                        />
                    ))}

                    <div>

                        <p className="mb-[7px] text-[12px] text-[#777]">
                            Quantity
                        </p>

                        <QuantitySelect
                            quantity={item.quantity}
                            availableQuantity={item.available_quantity}
                            onChange={changeQuantity}
                        />

                    </div>

                </div>

                {!item.in_stock && (
                    <p className="mt-[10px] text-[12px] font-medium text-red-500">
                        This item is currently out of stock.
                    </p>
                )}

                <button
                    type="button"
                    onClick={removeItem}
                    className="mt-[15px] text-[12px] font-medium text-[#171717] underline underline-offset-2 hover:text-[#2065D1]"
                >
                    Remove
                </button>

            </div>

        </div>
    );
};

// Product option
const ProductOption = ({ option }) => {
    return (
        <div>

            <p className="mb-[7px] text-[12px] text-[#777]">
                {option.name}
            </p>

            <span className="inline-flex min-h-[30px] items-center rounded-[8px] border border-[#dedede] bg-white px-[10px] text-[12px] text-[#333]">
                {option.value}
            </span>

        </div>
    );
};

// Quantity select
const QuantitySelect = ({
    quantity,
    availableQuantity,
    onChange,
}) => {
    const maxQuantity = Math.max(
        1,
        Math.min(
            Number(availableQuantity || 1),
            20
        )
    );

    const quantities = Array.from(
        { length: maxQuantity },
        (_, index) => index + 1
    );

    return (
        <select
            value={quantity}
            onChange={onChange}
            className="h-[34px] min-w-[56px] rounded-[8px] border border-[#dedede] bg-white px-[9px] text-[12px] text-[#333] outline-none focus:border-[#2065D1]"
        >
            {quantities.map((value) => (
                <option key={value} value={value}>
                    {value}
                </option>
            ))}
        </select>
    );
};

// Order summary
const OrderSummary = ({ summary }) => {
    const subtotal = Number(summary.subtotal || 0);
    const savings = Number(summary.sale_savings || 0);
    const total = Number(summary.total || subtotal);

    return (
        <aside className="lg:sticky lg:top-[25px] lg:self-start">

            <h2 className="text-[17px] font-semibold text-[#171717]">
                Order summary
            </h2>

            <div className="mt-[24px] space-y-[17px]">

                <SummaryRow
                    label="Subtotal"
                    value={formatPrice(subtotal)}
                    strong
                />

                <SummaryRow
                    label="Shipping"
                    action="Estimate shipping"
                />

                <SummaryRow
                    label="Estimated Tax"
                    action="Calculate"
                />

                <SummaryRow
                    label="Promo code"
                    action="Enter code"
                />

                <SummaryRow
                    label="Sale"
                    value={
                        savings > 0
                            ? `-${formatPrice(savings)}`
                            : "—"
                    }
                />

            </div>

            <div className="mt-[24px] flex items-center justify-between">

                <span className="text-[14px] font-semibold text-[#171717]">
                    Total
                </span>

                <div className="flex items-end gap-[7px]">

                    <span className="pb-[2px] text-[9px] uppercase text-[#777]">
                        USD
                    </span>

                    <span className="text-[21px] font-semibold text-[#171717]">
                        {formatPrice(total)}
                    </span>

                </div>

            </div>

            <Link
                to="/checkout"
                className="mt-[27px] flex h-[46px] w-full items-center justify-center rounded-[6px] bg-[#2065D1] text-[13px] font-semibold text-white transition-colors hover:bg-[#1858bb]"
            >
                Checkout
            </Link>

            <Link
                to="/"
                className="mt-[10px] flex h-[46px] w-full items-center justify-center rounded-[6px] border border-[#dedede] bg-white text-[13px] font-medium text-[#222] transition-colors hover:bg-[#f7f7f7]"
            >
                Continue Shopping
            </Link>

        </aside>
    );
};

// Summary row
const SummaryRow = ({
    label,
    value,
    action,
    strong = false,
}) => {
    return (
        <div className="flex items-center justify-between gap-[20px]">

            <span
                className={`text-[13px] ${
                    strong
                        ? "font-medium text-[#222]"
                        : "text-[#444]"
                }`}
            >
                {label}
            </span>

            {action ? (
                <button
                    type="button"
                    className="text-[12px] text-[#777] underline underline-offset-2 hover:text-[#2065D1]"
                >
                    {action}
                </button>
            ) : (
                <span
                    className={`text-[13px] ${
                        strong
                            ? "font-semibold text-[#111]"
                            : "text-[#777]"
                    }`}
                >
                    {value}
                </span>
            )}

        </div>
    );
};

// Empty cart
const EmptyCartPage = () => {
    return (
        <main className="min-h-[600px] bg-white">

            <div className="mx-auto max-w-[1280px] px-5 py-[70px] text-center">

                <h1 className="text-[24px] font-semibold text-[#171717]">
                    Your shopping bag is empty
                </h1>

                <p className="mt-[9px] text-[13px] text-[#777]">
                    Add products to your cart to continue shopping.
                </p>

                <Link
                    to="/"
                    className="mt-[24px] inline-flex h-[43px] items-center justify-center rounded-[8px] bg-[#2065D1] px-[22px] text-[13px] font-semibold text-white"
                >
                    Continue Shopping
                </Link>

            </div>

        </main>
    );
};

// Loader
const CartLoader = () => {
    return (
        <div className="flex min-h-[600px] items-center justify-center bg-white">
            <LoaderCircle
                size={30}
                className="animate-spin text-[#2065D1]"
            />
        </div>
    );
};

// Error
const CartError = ({ message }) => {
    return (
        <div className="mx-auto max-w-[1280px] px-5 py-[80px] text-center">

            <h1 className="text-[21px] font-semibold text-[#222]">
                Unable to load cart
            </h1>

            <p className="mt-[8px] text-[13px] text-[#777]">
                {message}
            </p>

            <Link
                to="/"
                className="mt-[20px] inline-flex rounded-[8px] bg-[#2065D1] px-[18px] py-[10px] text-[13px] font-semibold text-white"
            >
                Back to Home
            </Link>

        </div>
    );
};

export default Cart;