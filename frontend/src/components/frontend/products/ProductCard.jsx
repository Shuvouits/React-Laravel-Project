import { useEffect, useState } from "react";
import { Heart, LoaderCircle, Maximize2, ShoppingBag } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

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

    const [wishlisted, setWishlisted] = useState(isWishlisted);
    const [wishlistBusy, setWishlistBusy] = useState(false);

    const image = getProductImage(product);
    const price = getProductPrice(product);
    const comparePrice = getCompareAtPrice(product);
    const discount = getDiscountPercent(product);
    const featured = isProductFeatured(product);
    const options = getProductOptions(product);

    const colorOption = options.find((option) => {
        return isColorOption(option.name);
    });

    const colors = colorOption?.values?.slice(0, 4) || [];

    const productUrl = product.slug
        ? `/products/${product.slug}`
        : "/products";

    useEffect(() => {
        setWishlisted(isWishlisted);
    }, [isWishlisted]);

    const handleWishlist = async () => {
        const token = localStorage.getItem("token");

        if (!token) {
            navigate("/login");
            return;
        }

        if (!product?.id || wishlistBusy || wishlistLoading) {
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
                new CustomEvent("wishlist-updated", {
                    detail: {
                        count: response.data?.wishlist_count,
                    },
                })
            );
        } catch (error) {
            console.error(
                "Wishlist error:",
                error.response?.data || error.message
            );
        } finally {
            setWishlistBusy(false);
        }
    };

    return (
        <div className="group/card min-w-0">

            {/* Image */}
            <div className="relative aspect-square w-full overflow-hidden rounded-[12px] bg-[#f3f3f4]">

                {discount > 0 && (
                    <DiscountBadge discount={discount} />
                )}

                {featured && (
                    <FeaturedBadge />
                )}

                <WishlistButton
                    isWishlisted={wishlisted}
                    loading={wishlistBusy || wishlistLoading}
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
                    onChooseOptions={onChooseOptions}
                />

            </div>

            {/* Swatches */}
            <ProductSwatches colors={colors} />

            {/* Title */}
            <Link
                to={productUrl}
                className="mt-[7px] block truncate text-[14px] font-semibold leading-[1.3] text-[#171717] transition-colors hover:text-[#2065D1]"
            >
                {product.title}
            </Link>

            {/* Subtitle */}
            <p className="mt-[5px] min-h-[18px] truncate text-[12px] text-[#777]">
                {getProductSubtitle(product)}
            </p>

            {/* Price */}
            <div className="mt-[9px] flex items-center justify-between gap-2">

                <div className="flex min-w-0 items-center gap-[8px]">

                    <span className="flex h-[25px] items-center rounded-[4px] border border-[#00b777] px-[9px] text-[13px] font-bold text-[#009d66]">
                        {formatPrice(price)}
                    </span>

                    {comparePrice > price && (
                        <span className="whitespace-nowrap text-[12px] text-[#777] line-through">
                            {formatPrice(comparePrice)}
                        </span>
                    )}

                </div>

                {product.rating && (
                    <ProductRating rating={product.rating} />
                )}

            </div>

        </div>
    );
};

// Discount badge
const DiscountBadge = ({ discount }) => {
    return (
        <span className="absolute left-[10px] top-[10px] z-20 flex h-[25px] min-w-[43px] items-center justify-center rounded-full border border-[#e1e1e1] bg-white px-[8px] text-[12px] font-semibold text-[#ef1b28] shadow-sm">
            -{discount}%
        </span>
    );
};

// Featured badge
const FeaturedBadge = () => {
    return (
        <span className="absolute left-[10px] top-[42px] z-20 rounded-full bg-[#2065D1] px-[10px] py-[4px] text-[11px] font-semibold text-white">
            Featured
        </span>
    );
};

// Wishlist button
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

// Product actions
const ProductActions = ({
    product,
    onQuickView,
    onChooseOptions,
}) => {
    return (
        <div className="pointer-events-none absolute bottom-[10px] left-[10px] right-[10px] z-30 flex translate-y-[10px] items-center gap-[7px] opacity-0 transition-all duration-200 group-hover/card:pointer-events-auto group-hover/card:translate-y-0 group-hover/card:opacity-100">

            <button
                type="button"
                onClick={() => onChooseOptions?.(product)}
                className="flex h-[40px] flex-1 items-center justify-center gap-[7px] rounded-full bg-[#171717] text-[12px] font-semibold text-white transition-colors hover:bg-black"
            >
                <ShoppingBag size={15} />
                Choose options
            </button>

            <button
                type="button"
                onClick={() => onQuickView?.(product)}
                className="flex h-[40px] flex-1 items-center justify-center gap-[7px] rounded-full border border-[#e5e5e5] bg-white text-[12px] font-semibold text-[#202020] transition-colors hover:bg-[#fafafa]"
            >
                <Maximize2 size={14} />
                Quick view
            </button>

        </div>
    );
};

// Product swatches
const ProductSwatches = ({ colors }) => {
    return (
        <div className="mt-[10px] flex h-[16px] items-center gap-[5px]">

            {colors.length > 0 ? (
                colors.map((color) => (
                    <span
                        key={color}
                        title={color}
                        className="h-[16px] w-[16px] rounded-full border border-white ring-1 ring-[#dedede]"
                        style={{
                            backgroundColor: getSwatchColor(color),
                        }}
                    />
                ))
            ) : (
                <>
                    <span className="h-[16px] w-[16px] rounded-full bg-[#171717]" />
                    <span className="h-[16px] w-[16px] rounded-full bg-[#e5d5dd]" />
                    <span className="h-[16px] w-[16px] rounded-full bg-[#b8bbc2]" />
                </>
            )}

        </div>
    );
};

// Product rating
const ProductRating = ({ rating }) => {
    return (
        <div className="flex items-center gap-[4px] text-[12px] font-medium">

            <span className="text-[#f6b800]">
                ★
            </span>

            {Number(rating).toFixed(1)}

        </div>
    );
};

export default ProductCard;