import {
    useEffect,
    useMemo,
    useState,
} from "react";
import {
    Link,
    useNavigate,
} from "react-router-dom";
import {
    Heart,
    Minus,
    Plus,
    ShoppingCart,
    X,
    Zap,
} from "lucide-react";

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

    const [quantity, setQuantity] =
        useState(1);

    const [selections, setSelections] =
        useState({});

    const options = useMemo(() => {
        return getProductOptions(product);
    }, [product]);

    useEffect(() => {
        if (!open || !product) {
            return;
        }

        setQuantity(1);

        const variants = Array.isArray(
            product.variants
        )
            ? product.variants
            : [];

        const defaultVariant =
            variants.find(
                (variant) =>
                    variant.is_default
            ) ||
            variants.find(
                (variant) =>
                    variant.is_active &&
                    Number(
                        variant.quantity || 0
                    ) > 0
            ) ||
            variants[0] ||
            null;

        const defaults = {};

        if (
            defaultVariant &&
            Array.isArray(
                defaultVariant.options
            )
        ) {
            defaultVariant.options.forEach(
                (option) => {
                    const name =
                        option.global_variant_name ||
                        option.option_name ||
                        option.name;

                    if (
                        name &&
                        option.value !== null &&
                        option.value !== undefined
                    ) {
                        defaults[name] =
                            String(option.value);
                    }
                }
            );
        }

        options.forEach((option) => {
            if (
                defaults[option.name] ===
                    undefined &&
                option.values?.length
            ) {
                defaults[option.name] =
                    option.values[0];
            }
        });

        setSelections(defaults);
    }, [open, product, options]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const oldOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose?.();
            }
        };

        window.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.body.style.overflow =
                oldOverflow;

            window.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [open, onClose]);

    const selectedVariant = useMemo(() => {
        const variants = Array.isArray(
            product?.variants
        )
            ? product.variants
            : [];

        if (!variants.length) {
            return null;
        }

        const exactMatch = variants.find(
            (variant) => {
                const variantOptions =
                    Array.isArray(
                        variant.options
                    )
                        ? variant.options
                        : [];

                return Object.entries(
                    selections
                ).every(
                    ([
                        selectedName,
                        selectedValue,
                    ]) => {
                        return variantOptions.some(
                            (option) => {
                                const name =
                                    option.global_variant_name ||
                                    option.option_name ||
                                    option.name;

                                return (
                                    String(name) ===
                                        String(
                                            selectedName
                                        ) &&
                                    String(
                                        option.value
                                    ) ===
                                        String(
                                            selectedValue
                                        )
                                );
                            }
                        );
                    }
                );
            }
        );

        if (exactMatch) {
            return exactMatch;
        }

        return (
            variants.find(
                (variant) =>
                    variant.is_default
            ) ||
            variants.find(
                (variant) =>
                    variant.is_active &&
                    Number(
                        variant.quantity || 0
                    ) > 0
            ) ||
            variants[0]
        );
    }, [product, selections]);

    const selectedVariantPrice = Number(
        selectedVariant?.price || 0
    );

    const selectedVariantComparePrice =
        Number(
            selectedVariant
                ?.compare_at_price || 0
        );

    const price =
        selectedVariantPrice > 0
            ? selectedVariantPrice
            : getProductPrice(product);

    const productComparePrice =
        getCompareAtPrice(product);

    const comparePrice =
        selectedVariantComparePrice > price
            ? selectedVariantComparePrice
            : productComparePrice;

    const image =
        selectedVariant?.image_url ||
        getProductImage(product);

    const availableQuantity =
        selectedVariant
            ? Number(
                  selectedVariant.quantity ||
                      0
              )
            : Number(
                  product?.available_quantity ??
                      product?.quantity ??
                      0
              );

    const discount =
        comparePrice > price &&
        comparePrice > 0 &&
        price > 0
            ? Math.round(
                  (
                      (comparePrice - price) /
                      comparePrice
                  ) * 100
              )
            : 0;

    if (!open || !product) {
        return null;
    }

    const selectOption = (
        optionName,
        value
    ) => {
        setSelections((previous) => ({
            ...previous,
            [optionName]:
                String(value),
        }));
    };

    const getCartItem = () => {
        return {
            product_id: product.id,
            variant_id:
                selectedVariant?.id ||
                null,
            title: product.title,
            slug: product.slug,
            image,
            price,
            quantity,
            options: selections,
        };
    };

    const handleAddToCart = () => {
        addToCart(getCartItem());

        onClose?.();

        setTimeout(() => {
            openCart();
        }, 150);
    };

    const handleBuyNow = () => {
        const existingCart = JSON.parse(
            localStorage.getItem("cart") ||
                "[]"
        );

        existingCart.push(
            getCartItem()
        );

        localStorage.setItem(
            "cart",
            JSON.stringify(
                existingCart
            )
        );

        window.dispatchEvent(
            new Event("cart:updated")
        );

        onClose?.();

        navigate("/cart");
    };

    const outOfStock =
        selectedVariant &&
        availableQuantity <= 0;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto p-4 sm:p-6">
            <button
                type="button"
                aria-label="Close quick view"
                onClick={onClose}
                className="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[4px]"
            />

            <div className="relative z-10 grid max-h-[92vh] w-full max-w-[1150px] grid-cols-1 overflow-y-auto rounded-[25px] border border-white/70 bg-white shadow-[0_35px_100px_rgba(0,0,0,0.3)] md:grid-cols-[1.08fr_0.92fr]">
                <div className="relative flex min-h-[420px] items-center justify-center bg-[#fafafa] px-[35px] py-[55px] md:min-h-[625px] md:rounded-l-[25px] md:px-[55px] md:py-[65px]">
                    {discount > 0 && (
                        <span className="absolute left-[18px] top-[18px] z-20 flex min-h-[29px] items-center justify-center rounded-full bg-[#ec0613] px-[13px] text-[13px] font-bold text-white shadow-[0_5px_15px_rgba(236,6,19,0.22)] md:left-[20px] md:top-[20px]">
                            -{discount}%
                        </span>
                    )}

                    <button
                        type="button"
                        aria-label="Add to wishlist"
                        className="absolute right-[18px] top-[18px] z-20 flex h-[43px] w-[43px] items-center justify-center rounded-full border border-[#e7e7e7] bg-white text-[#777] shadow-[0_5px_16px_rgba(0,0,0,0.07)] transition-all duration-200 hover:-translate-y-[1px] hover:border-[#d4d4d4] hover:text-[#e2293a] hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                    >
                        <Heart
                            size={21}
                            strokeWidth={1.7}
                        />
                    </button>

                    {image ? (
                        <img
                            key={
                                selectedVariant?.id ||
                                image
                            }
                            src={image}
                            alt={product.title}
                            className="h-auto max-h-[435px] w-auto max-w-full object-contain drop-shadow-[0_18px_24px_rgba(0,0,0,0.08)] animate-[fadeIn_.2s_ease-in-out]"
                        />
                    ) : (
                        <div className="flex h-[250px] w-full items-center justify-center rounded-[18px] border border-dashed border-[#ddd] text-[13px] text-[#999]">
                            No image
                        </div>
                    )}
                </div>

                <div className="relative flex min-h-[625px] flex-col bg-white px-[28px] pb-[26px] pt-[35px] sm:px-[38px] md:rounded-r-[25px] md:px-[42px] md:pb-[30px] md:pt-[38px]">
                    <button
                        type="button"
                        aria-label="Close"
                        onClick={onClose}
                        className="absolute right-[18px] top-[18px] z-20 flex h-[39px] w-[39px] items-center justify-center rounded-full border border-[#e6e6e6] bg-white text-[#777] shadow-[0_4px_14px_rgba(0,0,0,0.06)] transition-all duration-200 hover:rotate-90 hover:bg-[#f7f7f7] hover:text-[#111]"
                    >
                        <X
                            size={18}
                            strokeWidth={1.8}
                        />
                    </button>

                    <div className="pr-[48px]">
                        <p className="text-[14px] font-medium leading-[1.4] text-[#858585]">
                            {getStoreName(
                                product
                            )}
                        </p>

                        <h2 className="mt-[5px] text-[28px] font-bold leading-[1.2] tracking-[-0.6px] text-[#1d1d1f]">
                            {product.title}
                        </h2>
                    </div>

                    <div className="mt-[23px] flex flex-wrap items-center gap-[12px]">
                        {comparePrice >
                            price && (
                            <span className="text-[16px] font-medium text-[#858585] line-through decoration-[#999]">
                                {formatPrice(
                                    comparePrice
                                )}
                            </span>
                        )}

                        <span
                            className={`text-[24px] font-bold tracking-[-0.3px] ${
                                comparePrice >
                                price
                                    ? "text-[#f25a00]"
                                    : "text-[#111]"
                            }`}
                        >
                            {formatPrice(price)}
                        </span>
                    </div>

                    {options.length > 0 && (
                        <div className="mt-[28px] space-y-[24px]">
                            {options.map(
                                (option) => {
                                    const colorOption =
                                        isColorOption(
                                            option.name
                                        );

                                    return (
                                        <div
                                            key={
                                                option.name
                                            }
                                        >
                                            <p className="mb-[12px] text-[14px] font-semibold leading-none text-[#272727]">
                                                {
                                                    option.name
                                                }
                                                :
                                            </p>

                                            {colorOption ? (
                                                <ColorOptions
                                                    option={
                                                        option
                                                    }
                                                    selections={
                                                        selections
                                                    }
                                                    onSelect={
                                                        selectOption
                                                    }
                                                />
                                            ) : (
                                                <NormalOptions
                                                    option={
                                                        option
                                                    }
                                                    selections={
                                                        selections
                                                    }
                                                    onSelect={
                                                        selectOption
                                                    }
                                                />
                                            )}
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    )}

                    {selectedVariant && (
                        <div className="mt-[18px]">
                            {availableQuantity >
                            0 ? (
                                <span className="inline-flex items-center gap-[7px] text-[12px] font-medium text-[#707070]">
                                    <span className="h-[7px] w-[7px] rounded-full bg-[#16a66a]" />
                                    {
                                        availableQuantity
                                    }{" "}
                                    available
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-[7px] text-[12px] font-medium text-[#e13535]">
                                    <span className="h-[7px] w-[7px] rounded-full bg-[#e13535]" />
                                    Out of stock
                                </span>
                            )}
                        </div>
                    )}

                    <div className="mt-[26px] border-t border-[#e7e7e7]" />

                    <div className="mt-[19px] flex items-center gap-[12px]">
                        <QuantitySelector
                            quantity={quantity}
                            onDecrease={() => {
                                setQuantity(
                                    (
                                        previous
                                    ) =>
                                        Math.max(
                                            1,
                                            previous -
                                                1
                                        )
                                );
                            }}
                            onIncrease={() => {
                                setQuantity(
                                    (
                                        previous
                                    ) =>
                                        previous +
                                        1
                                );
                            }}
                        />

                        <button
                            type="button"
                            disabled={
                                outOfStock
                            }
                            onClick={
                                handleAddToCart
                            }
                            className="flex h-[50px] flex-1 items-center justify-center gap-[9px] rounded-[15px] bg-[#171717] px-4 text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(0,0,0,0.12)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-black hover:shadow-[0_11px_24px_rgba(0,0,0,0.18)] disabled:cursor-not-allowed disabled:bg-[#aaa] disabled:shadow-none"
                        >
                            <ShoppingCart
                                size={17}
                                strokeWidth={
                                    1.9
                                }
                            />
                            Add to Cart
                        </button>
                    </div>

                    <button
                        type="button"
                        disabled={outOfStock}
                        onClick={handleBuyNow}
                        className="mt-[12px] flex h-[50px] w-full items-center justify-center gap-[9px] rounded-[15px] bg-[#2768d4] text-[14px] font-semibold text-white shadow-[0_8px_18px_rgba(39,104,212,0.2)] transition-all duration-200 hover:-translate-y-[1px] hover:bg-[#1f5fc8] hover:shadow-[0_11px_24px_rgba(39,104,212,0.28)] disabled:cursor-not-allowed disabled:bg-[#8caee2] disabled:shadow-none"
                    >
                        <Zap
                            size={17}
                            strokeWidth={2}
                        />
                        Buy Now
                    </button>

                    <div className="mt-auto pt-[28px] text-center">
                        <Link
                            to={`/products/${product.slug}`}
                            onClick={onClose}
                            className="inline-flex items-center justify-center text-[14px] font-medium text-[#1765d1] transition-colors hover:text-[#0e4fae] hover:underline"
                        >
                            View full details
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ColorOptions = ({
    option,
    selections,
    onSelect,
}) => {
    return (
        <div className="flex flex-wrap items-center gap-[12px]">
            {option.values.map(
                (value) => {
                    const active =
                        String(
                            selections[
                                option.name
                            ]
                        ) ===
                        String(value);

                    const item =
                        option.items?.find(
                            (
                                optionItem
                            ) => {
                                return (
                                    String(
                                        optionItem.value
                                    ) ===
                                    String(
                                        value
                                    )
                                );
                            }
                        );

                    const color =
                        item?.color_code ||
                        getSwatchColor(
                            value
                        );

                    return (
                        <button
                            key={value}
                            type="button"
                            title={value}
                            aria-label={`${option.name}: ${value}`}
                            aria-pressed={
                                active
                            }
                            onClick={() =>
                                onSelect(
                                    option.name,
                                    value
                                )
                            }
                            className={`relative h-[38px] w-[38px] shrink-0 rounded-full border-[3px] border-white transition-all duration-200 ${
                                active
                                    ? "scale-[1.04] ring-2 ring-[#171717] shadow-[0_4px_10px_rgba(0,0,0,0.16)]"
                                    : "ring-1 ring-[#d4d4d4] hover:scale-[1.06] hover:ring-[#888]"
                            }`}
                            style={{
                                backgroundColor:
                                    color,
                            }}
                        >
                            {active && (
                                <span className="absolute -bottom-[7px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-[#171717]" />
                            )}
                        </button>
                    );
                }
            )}
        </div>
    );
};

const NormalOptions = ({
    option,
    selections,
    onSelect,
}) => {
    return (
        <div className="flex flex-wrap gap-[9px]">
            {option.values.map(
                (value) => {
                    const active =
                        String(
                            selections[
                                option.name
                            ]
                        ) ===
                        String(value);

                    return (
                        <button
                            key={value}
                            type="button"
                            aria-pressed={
                                active
                            }
                            onClick={() =>
                                onSelect(
                                    option.name,
                                    value
                                )
                            }
                            className={`min-h-[40px] rounded-full border px-[16px] text-[13px] font-medium transition-all duration-200 ${
                                active
                                    ? "border-[#222] bg-[#222] text-white shadow-[0_5px_12px_rgba(0,0,0,0.13)]"
                                    : "border-[#dedede] bg-white text-[#3f3f3f] hover:-translate-y-[1px] hover:border-[#aaa] hover:shadow-sm"
                            }`}
                        >
                            {value}
                        </button>
                    );
                }
            )}
        </div>
    );
};

const QuantitySelector = ({
    quantity,
    onDecrease,
    onIncrease,
}) => {
    return (
        <div className="flex h-[50px] shrink-0 items-center overflow-hidden rounded-[15px] border border-[#dedede] bg-white shadow-[0_3px_10px_rgba(0,0,0,0.03)]">
            <button
                type="button"
                aria-label="Decrease quantity"
                onClick={onDecrease}
                className="flex h-full w-[38px] items-center justify-center text-[#555] transition-colors hover:bg-[#f5f5f5] hover:text-[#111]"
            >
                <Minus
                    size={14}
                    strokeWidth={2}
                />
            </button>

            <div className="flex h-full min-w-[34px] items-center justify-center border-x border-[#ededed] text-center text-[13px] font-semibold text-[#222]">
                {quantity}
            </div>

            <button
                type="button"
                aria-label="Increase quantity"
                onClick={onIncrease}
                className="flex h-full w-[38px] items-center justify-center text-[#555] transition-colors hover:bg-[#f5f5f5] hover:text-[#111]"
            >
                <Plus
                    size={14}
                    strokeWidth={2}
                />
            </button>
        </div>
    );
};

export default ProductQuickViewModal;