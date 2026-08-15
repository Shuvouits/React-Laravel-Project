import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Minus, Plus, ShoppingCart, X, Zap } from "lucide-react";

import { useCart } from "../../../context/CartContext";

import {
    formatPrice,
    getCompareAtPrice,
    getProductImage,
    getProductOptions,
    getProductPrice,
    getStoreName,
    getSwatchColor,
    isColorOption,
} from "./productHelpers";

const ProductQuickViewModal = ({
    product,
    open,
    onClose,
}) => {
    const navigate = useNavigate();

    const {
        addToCart,
        openCart,
    } = useCart();

    const [quantity, setQuantity] = useState(1);
    const [selections, setSelections] = useState({});

    const options = useMemo(() => {
        return getProductOptions(product);
    }, [product]);

    // Reset selected options
    useEffect(() => {
        if (!open || !product) {
            return;
        }

        setQuantity(1);

        const variants = Array.isArray(product.variants)
            ? product.variants
            : [];

        const defaultVariant =
            variants.find((variant) => variant.is_default) ||
            variants[0] ||
            null;

        const defaults = {};

        if (
            defaultVariant &&
            Array.isArray(defaultVariant.options)
        ) {
            defaultVariant.options.forEach((option) => {
                const name =
                    option.global_variant_name ||
                    option.option_name ||
                    option.name;

                if (
                    name &&
                    option.value !== null &&
                    option.value !== undefined
                ) {
                    defaults[name] = String(option.value);
                }
            });
        }

        options.forEach((option) => {
            if (
                defaults[option.name] === undefined &&
                option.values?.length
            ) {
                defaults[option.name] = option.values[0];
            }
        });

        setSelections(defaults);
    }, [open, product, options]);

    // Escape and body lock
    useEffect(() => {
        if (!open) {
            return;
        }

        const oldOverflow = document.body.style.overflow;

        document.body.style.overflow = "hidden";

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };

        window.addEventListener("keydown", handleEscape);

        return () => {
            document.body.style.overflow = oldOverflow;
            window.removeEventListener("keydown", handleEscape);
        };
    }, [open, onClose]);

    // Selected variant
    const selectedVariant = useMemo(() => {
        const variants = Array.isArray(product?.variants)
            ? product.variants
            : [];

        if (!variants.length) {
            return null;
        }

        const exactMatch = variants.find((variant) => {
            const variantOptions = Array.isArray(variant.options)
                ? variant.options
                : [];

            return Object.entries(selections).every(
                ([selectedName, selectedValue]) => {
                    return variantOptions.some((option) => {
                        const name =
                            option.global_variant_name ||
                            option.option_name ||
                            option.name;

                        return (
                            String(name) === String(selectedName) &&
                            String(option.value) === String(selectedValue)
                        );
                    });
                }
            );
        });

        if (exactMatch) {
            return exactMatch;
        }

        return (
            variants.find((variant) => variant.is_default) ||
            variants[0]
        );
    }, [product, selections]);

    const price =
        selectedVariant?.price !== undefined &&
        selectedVariant?.price !== null
            ? Number(selectedVariant.price)
            : getProductPrice(product);

    const comparePrice =
        selectedVariant?.compare_at_price !== undefined &&
        selectedVariant?.compare_at_price !== null
            ? Number(selectedVariant.compare_at_price)
            : getCompareAtPrice(product);

    const image =
        selectedVariant?.image_url ||
        getProductImage(product);

    const availableQuantity = selectedVariant
        ? Number(selectedVariant.quantity || 0)
        : Number(product?.quantity || 0);

    const discount =
        comparePrice > price &&
        comparePrice > 0 &&
        price > 0
            ? Math.round(
                ((comparePrice - price) / comparePrice) * 100
            )
            : 0;

    if (!open || !product) {
        return null;
    }

    // Select option
    const selectOption = (optionName, value) => {
        setSelections((previous) => ({
            ...previous,
            [optionName]: String(value),
        }));
    };

    // Cart item
    const getCartItem = () => {
        return {
            product_id: product.id,
            variant_id: selectedVariant?.id || null,
            title: product.title,
            slug: product.slug,
            image: image,
            price: price,
            quantity: quantity,
            options: selections,
        };
    };

    // Add to cart
    const handleAddToCart = () => {
        addToCart(
            getCartItem()
        );

        onClose?.();

        setTimeout(() => {
            openCart();
        }, 150);
    };

    // Buy now
    const handleBuyNow = () => {
        const existingCart = JSON.parse(
            localStorage.getItem("cart") || "[]"
        );

        existingCart.push({
            product_id: product.id,
            variant_id: selectedVariant?.id || null,
            title: product.title,
            slug: product.slug,
            image: image,
            price: price,
            quantity: quantity,
            options: selections,
        });

        localStorage.setItem(
            "cart",
            JSON.stringify(existingCart)
        );

        window.dispatchEvent(
            new Event("cart:updated")
        );

        onClose?.();

        navigate("/cart");
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">

            {/* Overlay */}
            <button
                type="button"
                aria-label="Close quick view"
                onClick={onClose}
                className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            />

            {/* Modal */}
            <div className="relative z-10 grid max-h-[92vh] w-full max-w-[950px] grid-cols-1 overflow-y-auto rounded-[22px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.25)] md:grid-cols-[1.05fr_1fr]">

                {/* Product image */}
                <div className="relative flex min-h-[500px] items-center justify-center rounded-t-[22px] bg-[#f7f7f7] p-[55px] md:rounded-l-[22px] md:rounded-tr-none">

                    {discount > 0 && (
                        <span className="absolute left-[20px] top-[20px] z-10 rounded-full bg-[#ed0712] px-[13px] py-[5px] text-[13px] font-bold text-white">
                            -{discount}%
                        </span>
                    )}

                    <button
                        type="button"
                        className="absolute right-[18px] top-[18px] z-10 flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#e4e4e4] bg-white text-[#777] shadow-sm hover:text-[#111]"
                    >
                        <Heart size={20} />
                    </button>

                    {image ? (
                        <img
                            key={selectedVariant?.id || image}
                            src={image}
                            alt={product.title}
                            className="max-h-[420px] max-w-full object-contain animate-[fadeIn_.18s_ease-in-out]"
                        />
                    ) : (
                        <span className="text-[13px] text-[#999]">
                            No image
                        </span>
                    )}

                </div>

                {/* Product content */}
                <div className="relative px-[30px] py-[30px]">

                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-[16px] top-[16px] flex h-[37px] w-[37px] items-center justify-center rounded-full border border-[#e5e5e5] text-[#777] hover:bg-[#f7f7f7] hover:text-[#111]"
                    >
                        <X size={18} />
                    </button>

                    <p className="pr-[45px] text-[13px] text-[#777]">
                        {getStoreName(product)}
                    </p>

                    <h2 className="mt-[6px] pr-[45px] text-[27px] font-bold leading-[1.2] tracking-[-0.4px] text-[#171717]">
                        {product.title}
                    </h2>

                    {/* Price */}
                    <div className="mt-[22px] flex items-center gap-[11px]">

                        {comparePrice > price && (
                            <span className="text-[16px] text-[#777] line-through">
                                {formatPrice(comparePrice)}
                            </span>
                        )}

                        <span className="text-[23px] font-bold text-[#f35a00]">
                            {formatPrice(price)}
                        </span>

                    </div>

                    {/* Options */}
                    {options.length > 0 && (
                        <div className="mt-[26px] space-y-[20px]">

                            {options.map((option) => {
                                const colorOption = isColorOption(option.name);

                                return (
                                    <div key={option.name}>

                                        <p className="mb-[10px] text-[14px] font-medium text-[#222]">
                                            {option.name}:
                                        </p>

                                        {colorOption ? (
                                            <ColorOptions
                                                option={option}
                                                selections={selections}
                                                onSelect={selectOption}
                                            />
                                        ) : (
                                            <NormalOptions
                                                option={option}
                                                selections={selections}
                                                onSelect={selectOption}
                                            />
                                        )}

                                    </div>
                                );
                            })}

                        </div>
                    )}

                    {/* Stock */}
                    {selectedVariant && (
                        <div className="mt-[20px] text-[12px] text-[#707070]">

                            {availableQuantity > 0 ? (
                                <span>
                                    {availableQuantity} available
                                </span>
                            ) : (
                                <span className="text-red-500">
                                    Out of stock
                                </span>
                            )}

                        </div>
                    )}

                    <div className="mt-[27px] border-t border-[#e5e5e5]" />

                    {/* Cart row */}
                    <div className="mt-[18px] flex items-center gap-[12px]">

                        <QuantitySelector
                            quantity={quantity}
                            onDecrease={() => {
                                setQuantity((previous) => {
                                    return Math.max(1, previous - 1);
                                });
                            }}
                            onIncrease={() => {
                                setQuantity((previous) => previous + 1);
                            }}
                        />

                        <button
                            type="button"
                            disabled={
                                selectedVariant &&
                                availableQuantity <= 0
                            }
                            onClick={handleAddToCart}
                            className="flex h-[45px] flex-1 items-center justify-center gap-[8px] rounded-[13px] bg-[#171717] text-[14px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-[#aaa]"
                        >
                            <ShoppingCart size={17} />
                            Add to Cart
                        </button>

                    </div>

                    {/* Buy now */}
                    <button
                        type="button"
                        disabled={
                            selectedVariant &&
                            availableQuantity <= 0
                        }
                        onClick={handleBuyNow}
                        className="mt-[12px] flex h-[45px] w-full items-center justify-center gap-[8px] rounded-[13px] bg-[#2065D1] text-[14px] font-semibold text-white hover:bg-[#1858bb] disabled:cursor-not-allowed disabled:bg-[#8caee2]"
                    >
                        <Zap size={17} />
                        Buy Now
                    </button>

                    {/* Full details */}
                    <div className="mt-[31px] text-center">

                        <Link
                            to={`/products/${product.slug}`}
                            onClick={onClose}
                            className="text-[13px] font-medium text-[#2065D1] hover:underline"
                        >
                            View full details
                        </Link>

                    </div>

                </div>

            </div>

        </div>
    );
};

// Color options
const ColorOptions = ({
    option,
    selections,
    onSelect,
}) => {
    return (
        <div className="flex flex-wrap gap-[10px]">

            {option.values.map((value) => {
                const active =
                    String(selections[option.name]) ===
                    String(value);

                const item = option.items?.find((optionItem) => {
                    return (
                        String(optionItem.value) ===
                        String(value)
                    );
                });

                const color =
                    item?.color_code ||
                    getSwatchColor(value);

                return (
                    <button
                        key={value}
                        type="button"
                        title={value}
                        onClick={() => onSelect(option.name, value)}
                        className={`relative h-[38px] w-[38px] rounded-full border-[3px] border-white transition-all ${
                            active
                                ? "ring-2 ring-[#171717]"
                                : "ring-1 ring-[#d9d9d9] hover:ring-[#999]"
                        }`}
                        style={{
                            backgroundColor: color,
                        }}
                    />
                );
            })}

        </div>
    );
};

// Normal options
const NormalOptions = ({
    option,
    selections,
    onSelect,
}) => {
    return (
        <div className="flex flex-wrap gap-[8px]">

            {option.values.map((value) => {
                const active =
                    String(selections[option.name]) ===
                    String(value);

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onSelect(option.name, value)}
                        className={`min-h-[38px] rounded-[12px] border px-[15px] text-[13px] font-medium transition-all ${
                            active
                                ? "border-[#171717] bg-[#171717] text-white"
                                : "border-[#dedede] bg-white text-[#444] hover:border-[#999]"
                        }`}
                    >
                        {value}
                    </button>
                );
            })}

        </div>
    );
};

// Quantity
const QuantitySelector = ({
    quantity,
    onDecrease,
    onIncrease,
}) => {
    return (
        <div className="flex h-[45px] items-center overflow-hidden rounded-[13px] border border-[#dedede]">

            <button
                type="button"
                onClick={onDecrease}
                className="flex h-full w-[39px] items-center justify-center hover:bg-[#f7f7f7]"
            >
                <Minus size={14} />
            </button>

            <div className="min-w-[35px] text-center text-[13px] font-medium">
                {quantity}
            </div>

            <button
                type="button"
                onClick={onIncrease}
                className="flex h-full w-[39px] items-center justify-center hover:bg-[#f7f7f7]"
            >
                <Plus size={14} />
            </button>

        </div>
    );
};

export default ProductQuickViewModal;