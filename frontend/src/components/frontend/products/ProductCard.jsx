import { useEffect, useState } from "react";
import {
    Heart,
    LoaderCircle,
    Maximize2,
    ShoppingBag,
    Star,
} from "lucide-react";
import {
    Link,
    useNavigate,
} from "react-router-dom";

import api from "../../../api/axios";

import {
    formatPrice,
    getCompareAtPrice,
    getDiscountPercent,
    getProductImage,
    getProductOptions,
    getProductPrice,
    getProductSubtitle,
    getSwatchColor,
    isColorOption,
    isProductFeatured,
} from "./productHelpers";

const ProductCard = ({
    product,
    onQuickView,
    onChooseOptions,
    onWishlistToggle,
    isWishlisted = false,
    wishlistLoading = false,
}) => {
    const navigate = useNavigate();

    const [wishlisted, setWishlisted] =
        useState(isWishlisted);

    const [wishlistBusy, setWishlistBusy] =
        useState(false);

    const image = getProductImage(product);
    const price = getProductPrice(product);
    const comparePrice = getCompareAtPrice(product);
    const discount = getDiscountPercent(product);
    const featured = isProductFeatured(product);

    const colors = getProductColors(product);
    const visibleColors = colors.slice(0, 4);

    const remainingColors = Math.max(
        0,
        colors.length - visibleColors.length
    );

    const selectedColorName =
        product?.selected_color?.value ||
        visibleColors[0]?.value ||
        getProductSubtitle(product) ||
        "";

    const storeName =
        product?.store_name ||
        product?.brand_name ||
        product?.brand?.name ||
        "";

    const categoryName =
        product?.category_name ||
        product?.category?.name ||
        "";

    const rating = Number(
        product?.rating || 0
    );

    const reviewCount = Number(
        product?.review_count || 0
    );

    const inStock =
        product?.in_stock !== undefined
            ? Boolean(product.in_stock)
            : Number(
                  product?.available_quantity ??
                  product?.quantity ??
                  0
              ) > 0;

    const productUrl = product?.slug
        ? `/products/${product.slug}`
        : "/products";

    useEffect(() => {
        setWishlisted(isWishlisted);
    }, [isWishlisted]);

    const handleWishlist = async () => {
        const token =
            localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        if (
            !product?.id ||
            wishlistBusy ||
            wishlistLoading
        ) {
            return;
        }

        if (onWishlistToggle) {
            await onWishlistToggle(product);
            return;
        }

        try {
            setWishlistBusy(true);

            let response;

            if (wishlisted) {
                response = await api.delete(
                    `/account/wishlist/${product.id}`
                );

                setWishlisted(false);
            } else {
                response = await api.post(
                    `/account/wishlist/${product.id}`
                );

                setWishlisted(true);
            }

            window.dispatchEvent(
                new CustomEvent(
                    "wishlist-updated",
                    {
                        detail: {
                            count:
                                response.data
                                    ?.wishlist_count,
                        },
                    }
                )
            );
        } catch (error) {
            console.error(
                "Wishlist error:",
                error.response?.data ||
                error.message
            );
        } finally {
            setWishlistBusy(false);
        }
    };

    return (
        <article className="group/card min-w-0">
            <div className="relative aspect-square w-full overflow-hidden rounded-[12px] bg-[#f3f3f4]">
                {discount > 0 && (
                    <DiscountBadge
                        discount={discount}
                    />
                )}

                {featured && (
                    <FeaturedBadge
                        hasDiscount={discount > 0}
                    />
                )}

                <WishlistButton
                    isWishlisted={wishlisted}
                    loading={
                        wishlistBusy ||
                        wishlistLoading
                    }
                    onClick={handleWishlist}
                />

                <Link
                    to={productUrl}
                    aria-label={`View ${product.title}`}
                    className="absolute inset-0 flex items-center justify-center p-[28px]"
                >
                    {image ? (
                        <img
                            src={image}
                            alt={product.title}
                            loading="lazy"
                            className="h-auto max-h-full w-auto max-w-full object-contain transition-transform duration-300 group-hover/card:scale-[1.035]"
                        />
                    ) : (
                        <span className="text-[12px] text-[#999]">
                            No image
                        </span>
                    )}
                </Link>

                <ProductActions
                    product={product}
                    onQuickView={onQuickView}
                    onChooseOptions={
                        onChooseOptions
                    }
                />
            </div>

            <ProductSwatches
                colors={visibleColors}
                remainingColors={
                    remainingColors
                }
            />

            {storeName && (
                <p className="mt-[10px] truncate text-[12px] font-semibold leading-[1.3] text-[#222]">
                    {storeName}
                </p>
            )}

            <Link
                to={productUrl}
                className="mt-[12px] block min-h-[19px] text-[14px] font-semibold leading-[1.35] text-[#171717] transition-colors hover:text-[#2065D1]"
            >
                <span className="line-clamp-2">
                    {product.title}
                </span>
            </Link>

            {selectedColorName && (
                <p className="mt-[6px] truncate text-[13px] leading-[1.3] text-[#777]">
                    {selectedColorName}
                </p>
            )}

            {categoryName && (
                <Link
                    to={`/products?category=${product?.category?.slug || ""}`}
                    className="mt-[14px] block truncate text-[13px] leading-[1.3] text-[#777] transition-colors hover:text-[#2065D1]"
                >
                    {categoryName}
                </Link>
            )}

            <div className="mt-[14px] flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-[9px]">
                    <span className="flex h-[30px] items-center rounded-[4px] border border-[#00b777] px-[10px] text-[14px] font-bold text-[#009d66]">
                        {formatPrice(price)}
                    </span>

                    {comparePrice > price && (
                        <span className="truncate whitespace-nowrap text-[13px] text-[#777] line-through">
                            {formatPrice(
                                comparePrice
                            )}
                        </span>
                    )}
                </div>

                {rating > 0 && (
                    <ProductRating
                        rating={rating}
                        reviewCount={
                            reviewCount
                        }
                    />
                )}
            </div>

            {!inStock && (
                <div className="mt-[10px] flex h-[34px] items-center justify-center rounded-[5px] bg-[#fff1f1] text-[12px] font-semibold text-[#ef2b2d]">
                    Out of Stock
                </div>
            )}
        </article>
    );
};

const DiscountBadge = ({
    discount,
}) => {
    return (
        <span className="absolute left-[10px] top-[10px] z-20 flex h-[25px] min-w-[43px] items-center justify-center rounded-full border border-[#e1e1e1] bg-white px-[8px] text-[12px] font-semibold text-[#ef1b28] shadow-sm">
            -{discount}%
        </span>
    );
};

const FeaturedBadge = ({
    hasDiscount,
}) => {
    return (
        <span
            className={`absolute left-[10px] z-20 rounded-full bg-[#2065D1] px-[10px] py-[5px] text-[11px] font-semibold text-white ${
                hasDiscount
                    ? "top-[43px]"
                    : "top-[10px]"
            }`}
        >
            Featured
        </span>
    );
};

const WishlistButton = ({
    isWishlisted,
    loading,
    onClick,
}) => {
    return (
        <button
            type="button"
            disabled={loading}
            title={
                isWishlisted
                    ? "Remove from wishlist"
                    : "Add to wishlist"
            }
            onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();

                onClick();
            }}
            className={
                isWishlisted
                    ? "absolute right-[10px] top-[10px] z-20 flex h-[37px] w-[37px] items-center justify-center rounded-full border border-[#f1dddd] bg-white text-[#ef1b28] shadow-sm transition hover:bg-[#fff7f7] disabled:cursor-not-allowed disabled:opacity-60"
                    : "absolute right-[10px] top-[10px] z-20 flex h-[37px] w-[37px] -translate-y-[5px] items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#777] opacity-0 transition-all duration-200 hover:text-[#ef1b28] disabled:cursor-not-allowed disabled:opacity-60 group-hover/card:translate-y-0 group-hover/card:opacity-100"
            }
        >
            {loading ? (
                <LoaderCircle
                    size={17}
                    className="animate-spin"
                />
            ) : (
                <Heart
                    size={19}
                    strokeWidth={1.8}
                    fill={
                        isWishlisted
                            ? "currentColor"
                            : "none"
                    }
                />
            )}
        </button>
    );
};

const ProductActions = ({
    product,
    onQuickView,
    onChooseOptions,
}) => {
    return (
        <div className="pointer-events-none absolute bottom-[10px] left-[10px] right-[10px] z-30 flex translate-y-[10px] items-center gap-[7px] opacity-0 transition-all duration-200 group-hover/card:pointer-events-auto group-hover/card:translate-y-0 group-hover/card:opacity-100">
            <button
                type="button"
                onClick={() =>
                    onChooseOptions?.(product)
                }
                className="flex h-[40px] flex-1 items-center justify-center gap-[7px] rounded-full bg-[#171717] text-[12px] font-semibold text-white transition-colors hover:bg-black"
            >
                <ShoppingBag size={15} />
                Choose options
            </button>

            <button
                type="button"
                onClick={() =>
                    onQuickView?.(product)
                }
                className="flex h-[40px] flex-1 items-center justify-center gap-[7px] rounded-full border border-[#e5e5e5] bg-white text-[12px] font-semibold text-[#202020] transition-colors hover:bg-[#fafafa]"
            >
                <Maximize2 size={14} />
                Quick view
            </button>
        </div>
    );
};

const ProductSwatches = ({
    colors,
    remainingColors,
}) => {
    if (!colors.length) {
        return (
            <div className="h-[26px]" />
        );
    }

    return (
        <div className="mt-[12px] flex h-[16px] items-center gap-[6px]">
            {colors.map(
                (color, index) => (
                    <span
                        key={
                            color.id ||
                            `${color.value}-${index}`
                        }
                        title={color.value}
                        className="h-[16px] w-[16px] shrink-0 rounded-full border border-white ring-1 ring-[#d8d8d8]"
                        style={{
                            backgroundColor:
                                color.color_code ||
                                getSwatchColor(
                                    color.value
                                ),
                        }}
                    />
                )
            )}

            {remainingColors > 0 && (
                <span className="ml-[1px] text-[12px] font-semibold text-[#0969da]">
                    +{remainingColors}
                </span>
            )}
        </div>
    );
};

const ProductRating = ({
    rating,
    reviewCount,
}) => {
    return (
        <div
            className="flex shrink-0 items-center gap-[4px] text-[13px] font-medium text-[#222]"
            title={`${reviewCount} review${
                reviewCount === 1
                    ? ""
                    : "s"
            }`}
        >
            <Star
                size={15}
                strokeWidth={2}
                className="fill-[#f6b800] text-[#f6b800]"
            />

            <span>
                {Number(rating).toFixed(1)}
            </span>

            {reviewCount > 0 && (
                <span className="text-[11px] text-[#888]">
                    ({reviewCount})
                </span>
            )}
        </div>
    );
};

const getProductColors = (
    product
) => {
    if (
        Array.isArray(product?.colors) &&
        product.colors.length > 0
    ) {
        return product.colors
            .filter(
                (color) =>
                    color?.value
            )
            .map((color) => ({
                id:
                    color.id || null,

                value:
                    String(color.value),

                color_code:
                    color.color_code ||
                    null,
            }));
    }

    const options =
        getProductOptions(product);

    const colorOption = options.find(
        (option) =>
            isColorOption(option.name)
    );

    if (!colorOption) {
        return [];
    }

    if (
        Array.isArray(
            colorOption.items
        ) &&
        colorOption.items.length > 0
    ) {
        return colorOption.items.map(
            (item, index) => ({
                id:
                    item.id ||
                    item.global_variant_value_id ||
                    `${item.value}-${index}`,

                value:
                    String(
                        item.value || ""
                    ),

                color_code:
                    item.color_code ||
                    null,
            })
        );
    }

    return (
        colorOption.values || []
    ).map((value, index) => {
        if (
            typeof value === "object" &&
            value !== null
        ) {
            return {
                id:
                    value.id ||
                    `${value.value}-${index}`,

                value:
                    String(
                        value.value || ""
                    ),

                color_code:
                    value.color_code ||
                    null,
            };
        }

        return {
            id:
                `${value}-${index}`,

            value:
                String(value),

            color_code:
                null,
        };
    });
};

export default ProductCard;