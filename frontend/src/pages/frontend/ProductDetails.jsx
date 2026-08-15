import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Link2,
    LoaderCircle,
    Maximize2,
    Minus,
    Plus,
    ShoppingBag,
    Star,
    X,
    ZoomIn,
} from "lucide-react";

import api from "../../api/axios";

import {
    formatPrice,
    getCompareAtPrice,
    getProductImage,
    getProductOptions,
    getProductPrice,
    getSwatchColor,
    isColorOption,
} from "../../components/frontend/products/productHelpers";

import { useCart } from "../../context/CartContext";

const ProductDetails = () => {


    const { slug } = useParams();
    const navigate = useNavigate();
    const { addToCart, openCart } = useCart();


    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [quantity, setQuantity] = useState(1);
    const [selections, setSelections] = useState({});
    const [selectedImage, setSelectedImage] = useState(null);

    const [previewOpen, setPreviewOpen] = useState(false);
    const [technicalOpen, setTechnicalOpen] = useState(false);
    const [faqOpen, setFaqOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("description");

    // Fetch product
    const fetchProduct = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(`/products/${slug}`);

            setProduct(response.data?.product || null);
        } catch (error) {
            console.error("Product details error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load product."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [slug]);

    const options = useMemo(() => {
        return getProductOptions(product);
    }, [product]);

    // Set default variant options
    useEffect(() => {
        if (!product) {
            return;
        }

        const variants = Array.isArray(product.variants)
            ? product.variants
            : [];

        const defaultVariant =
            variants.find((variant) => variant.is_default) ||
            variants[0] ||
            null;

        const defaults = {};

        if (defaultVariant && Array.isArray(defaultVariant.options)) {
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
                defaults[option.name] = String(option.values[0]);
            }
        });

        setSelections(defaults);
        setQuantity(1);
    }, [product, options]);

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
            variants[0] ||
            null
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

    const variantImage =
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

    const galleryImages = useMemo(() => {
        return getVariantGallery(product);
    }, [product]);

    // Update main image when variant changes
    useEffect(() => {
        if (variantImage) {
            setSelectedImage(variantImage);
        }
    }, [variantImage]);

    // Select option
    const selectOption = (optionName, value) => {
        setSelections((previous) => ({
            ...previous,
            [optionName]: String(value),
        }));
    };

    // Change gallery image
    const changeGalleryImage = (direction) => {
        if (!galleryImages.length) {
            return;
        }

        const currentIndex = galleryImages.findIndex((item) => {
            return item.image === selectedImage;
        });

        let nextIndex = currentIndex;

        if (direction === "next") {
            nextIndex =
                currentIndex >= galleryImages.length - 1
                    ? 0
                    : currentIndex + 1;
        }

        if (direction === "previous") {
            nextIndex =
                currentIndex <= 0
                    ? galleryImages.length - 1
                    : currentIndex - 1;
        }

        setSelectedImage(galleryImages[nextIndex].image);
    };

    // Add to cart

    // Cart item
    const getCartItem = () => {
        return {
            product_id: product.id,
            variant_id: selectedVariant?.id || null,
            title: product.title,
            slug: product.slug,
            image: variantImage,
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

        openCart();
    };

    // Buy now
const handleBuyNow = () => {
    addToCart(
        getCartItem()
    );

    navigate("/checkout");
};

   

    if (loading) {
        return <ProductLoader />;
    }

    if (error || !product) {
        return <ProductNotFound error={error} />;
    }

    return (
        <main className="min-h-screen bg-white">

            <div className="mx-auto max-w-[1280px] px-5 pb-[70px] pt-[32px]">

                <ProductBreadcrumb product={product} />

                <div className="mt-[28px] grid grid-cols-1 gap-[38px] lg:grid-cols-2">

                    <ProductGallery
                        product={product}
                        images={galleryImages}
                        selectedImage={selectedImage}
                        discount={discount}
                        onSelectImage={setSelectedImage}
                        onPrevious={() => changeGalleryImage("previous")}
                        onNext={() => changeGalleryImage("next")}
                        onPreview={() => setPreviewOpen(true)}
                    />

                    <div className="pt-[3px]">

                        <h1 className="text-[29px] font-bold leading-[1.2] tracking-[-0.6px] text-[#111]">
                            {product.title}
                        </h1>

                        <ProductRating />

                        <div className="mt-[17px] flex items-center justify-between gap-4">

                            <div className="flex items-center gap-[10px]">
                                <span className="text-[21px] font-bold text-[#111]">
                                    {formatPrice(price)}
                                </span>

                                {comparePrice > price && (
                                    <span className="text-[14px] text-[#777] line-through">
                                        {formatPrice(comparePrice)}
                                    </span>
                                )}
                            </div>

                            <StockBadge
                                selectedVariant={selectedVariant}
                                quantity={availableQuantity}
                            />

                        </div>

                        {product.summary && (
                            <p className="mt-[18px] text-[13px] leading-[21px] text-[#666]">
                                {product.summary}
                            </p>
                        )}

                        <ProductOptions
                            options={options}
                            selections={selections}
                            onSelect={selectOption}
                        />

                        <div className="mt-[25px] flex items-center gap-[10px]">

                            <QuantitySelector
                                quantity={quantity}
                                onDecrease={() => {
                                    setQuantity((current) => {
                                        return Math.max(1, current - 1);
                                    });
                                }}
                                onIncrease={() => {
                                    setQuantity((current) => current + 1);
                                }}
                            />

                            <button
                                type="button"
                                disabled={
                                    selectedVariant &&
                                    availableQuantity <= 0
                                }
                                onClick={handleAddToCart}
                                className="flex h-[47px] flex-1 items-center justify-center gap-[9px] rounded-[9px] bg-[#171717] px-[20px] text-[13px] font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:bg-[#aaa]"
                            >
                                <ShoppingBag size={16} />
                                Add to Cart
                            </button>

                            <button
                                type="button"
                                disabled={
                                    selectedVariant &&
                                    availableQuantity <= 0
                                }
                                onClick={handleBuyNow}
                                className="h-[47px] flex-1 rounded-[9px] bg-[#2065D1] px-[20px] text-[13px] font-semibold text-white hover:bg-[#1959bd] disabled:cursor-not-allowed disabled:bg-[#8cace0]"
                            >
                                Buy Now
                            </button>

                        </div>

                        <ProductShare />

                        <div className="mt-[40px] space-y-[8px]">

                            <ProductAccordion
                                title="Technical Details"
                                open={technicalOpen}
                                onToggle={() => setTechnicalOpen(!technicalOpen)}
                            >
                                <ProductContent
                                    content={product.specifications}
                                    empty="No technical details available."
                                />
                            </ProductAccordion>

                            <ProductAccordion
                                title="FAQ"
                                open={faqOpen}
                                onToggle={() => setFaqOpen(!faqOpen)}
                            >
                                <p className="text-[12px] leading-[20px] text-[#777]">
                                    No FAQ available for this product.
                                </p>
                            </ProductAccordion>

                        </div>

                    </div>

                </div>

                <ProductTabs
                    product={product}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />

            </div>

            {previewOpen && (
                <ImagePreview
                    image={selectedImage}
                    title={product.title}
                    onClose={() => setPreviewOpen(false)}
                />
            )}

        </main>
    );
};

// Breadcrumb
const ProductBreadcrumb = ({ product }) => {
    return (
        <div className="flex flex-wrap items-center gap-[10px] text-[12px] text-[#777]">

            <Link to="/" className="hover:text-[#2065D1]">
                Home
            </Link>

            <span>/</span>

            <Link to="/products" className="hover:text-[#2065D1]">
                Products
            </Link>

            {product.category?.name && (
                <>
                    <span>/</span>

                    <span>
                        {product.category.name}
                    </span>
                </>
            )}

            <span>/</span>

            <span className="font-medium text-[#222]">
                {product.title}
            </span>

        </div>
    );
};

// Product gallery
const ProductGallery = ({
    product,
    images,
    selectedImage,
    discount,
    onSelectImage,
    onPrevious,
    onNext,
    onPreview,
}) => {
    return (
        <div>

            <div className="relative flex aspect-[1.35/1] min-h-[420px] items-center justify-center overflow-hidden rounded-[14px] bg-[#f3f3f4]">

                {discount > 0 && (
                    <span className="absolute left-[14px] top-[14px] z-20 rounded-full bg-[#00b77a] px-[11px] py-[5px] text-[12px] font-semibold text-white">
                        -{discount}%
                    </span>
                )}

                <div className="absolute right-[14px] top-[14px] z-20 flex gap-[7px]">

                    <button
                        type="button"
                        onClick={onPreview}
                        className="flex h-[35px] w-[35px] items-center justify-center rounded-full border border-[#e2e2e2] bg-white text-[#333] shadow-sm"
                    >
                        <ZoomIn size={16} />
                    </button>

                    <button
                        type="button"
                        onClick={onPreview}
                        className="flex h-[35px] w-[35px] items-center justify-center rounded-full border border-[#e2e2e2] bg-white text-[#333] shadow-sm"
                    >
                        <Maximize2 size={16} />
                    </button>

                </div>

                {images.length > 1 && (
                    <>
                        <button
                            type="button"
                            onClick={onPrevious}
                            className="absolute left-[15px] top-1/2 z-20 flex h-[39px] w-[39px] -translate-y-1/2 items-center justify-center rounded-full border border-[#e5e5e5] bg-white shadow-sm"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={onNext}
                            className="absolute right-[15px] top-1/2 z-20 flex h-[39px] w-[39px] -translate-y-1/2 items-center justify-center rounded-full border border-[#e5e5e5] bg-white shadow-sm"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </>
                )}

                {selectedImage ? (
                    <img
                        key={selectedImage}
                        src={selectedImage}
                        alt={product.title}
                        className="max-h-[72%] max-w-[72%] object-contain animate-[fadeIn_.18s_ease-in-out]"
                    />
                ) : (
                    <span className="text-[13px] text-[#999]">
                        No image
                    </span>
                )}

            </div>

            {images.length > 0 && (
                <div className="mt-[16px] flex gap-[14px] overflow-x-auto pb-[4px]">

                    {images.map((item, index) => (
                        <button
                            key={`${item.image}-${index}`}
                            type="button"
                            onClick={() => onSelectImage(item.image)}
                            className={`flex h-[90px] w-[124px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] border bg-[#f3f3f4] p-[12px] ${selectedImage === item.image
                                    ? "border-[#c9c9c9]"
                                    : "border-transparent"
                                }`}
                        >
                            <img
                                src={item.image}
                                alt={`${product.title} ${index + 1}`}
                                className="max-h-full max-w-full object-contain"
                            />
                        </button>
                    ))}

                </div>
            )}

        </div>
    );
};

// Rating
const ProductRating = () => {
    return (
        <div className="mt-[13px] flex items-center gap-[8px]">

            <div className="flex gap-[2px]">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={15}
                        fill="#d8d8d8"
                        strokeWidth={0}
                    />
                ))}
            </div>

            <span className="text-[12px] text-[#777]">
                (0 Reviews)
            </span>

        </div>
    );
};

// Stock
const StockBadge = ({
    selectedVariant,
    quantity,
}) => {
    const inStock =
        !selectedVariant ||
        quantity > 0;

    return (
        <span
            className={`rounded-[6px] px-[10px] py-[5px] text-[11px] font-semibold ${inStock
                    ? "bg-[#dff8e9] text-[#008949]"
                    : "bg-[#ffe7e7] text-[#d52b2b]"
                }`}
        >
            {inStock ? "In Stock" : "Out of Stock"}
        </span>
    );
};

// Product options
const ProductOptions = ({
    options,
    selections,
    onSelect,
}) => {
    if (!options.length) {
        return null;
    }

    return (
        <div className="mt-[26px] space-y-[20px]">

            {options.map((option) => (
                <div key={option.name}>

                    <p className="mb-[9px] text-[13px] font-medium text-[#222]">
                        {option.name}
                    </p>

                    {isColorOption(option.name) ? (
                        <ColorOptions
                            option={option}
                            selected={selections[option.name]}
                            onSelect={onSelect}
                        />
                    ) : (
                        <NormalOptions
                            option={option}
                            selected={selections[option.name]}
                            onSelect={onSelect}
                        />
                    )}

                </div>
            ))}

        </div>
    );
};

// Color options
const ColorOptions = ({
    option,
    selected,
    onSelect,
}) => {
    return (
        <div className="flex flex-wrap gap-[10px]">

            {option.values.map((value) => {
                const active =
                    String(selected) === String(value);

                const item = option.items?.find((optionItem) => {
                    return String(optionItem.value) === String(value);
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
                        className={`h-[32px] w-[32px] rounded-full border-[3px] border-white transition ${active
                                ? "ring-2 ring-[#171717]"
                                : "ring-1 ring-[#d9d9d9]"
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
    selected,
    onSelect,
}) => {
    return (
        <div className="flex flex-wrap gap-[8px]">

            {option.values.map((value) => {
                const active =
                    String(selected) === String(value);

                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => onSelect(option.name, value)}
                        className={`min-h-[37px] rounded-[9px] border px-[14px] text-[12px] font-medium transition ${active
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
        <div className="flex h-[47px] w-[145px] overflow-hidden rounded-[9px] border border-[#dedede]">

            <button
                type="button"
                onClick={onDecrease}
                className="flex w-[43px] items-center justify-center border-r border-[#e5e5e5] hover:bg-[#f8f8f8]"
            >
                <Minus size={14} />
            </button>

            <div className="flex flex-1 items-center justify-center text-[17px] font-medium">
                {quantity}
            </div>

            <button
                type="button"
                onClick={onIncrease}
                className="flex w-[43px] items-center justify-center border-l border-[#e5e5e5] hover:bg-[#f8f8f8]"
            >
                <Plus size={14} />
            </button>

        </div>
    );
};

// Share
const ProductShare = () => {
    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(
                window.location.href
            );
        } catch (error) {
            console.error("Copy link error:", error);
        }
    };

    return (
        <div className="mt-[36px] flex items-center justify-end gap-[8px]">

            <span className="mr-[3px] text-[12px] font-medium">
                Share
            </span>

            <ShareButton label="f" />
            <ShareButton label="𝕏" />
            <ShareButton label="◉" />

            <button
                type="button"
                onClick={copyLink}
                className="flex h-[31px] w-[31px] items-center justify-center rounded-full border border-[#e2e2e2] text-[#777]"
            >
                <Link2 size={14} />
            </button>

        </div>
    );
};

const ShareButton = ({ label }) => {
    return (
        <button
            type="button"
            className="flex h-[31px] w-[31px] items-center justify-center rounded-full border border-[#e2e2e2] text-[12px] text-[#777]"
        >
            {label}
        </button>
    );
};

// Accordion
const ProductAccordion = ({
    title,
    open,
    onToggle,
    children,
}) => {
    return (
        <div className="overflow-hidden rounded-[8px] border border-[#dedede] bg-[#f7f7f7]">

            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center justify-between px-[15px] py-[12px]"
            >
                <span className="text-[14px] font-semibold text-[#171717]">
                    {title}
                </span>

                <ChevronDown
                    size={17}
                    className={open ? "rotate-180" : ""}
                />
            </button>

            {open && (
                <div className="border-t border-[#e2e2e2] bg-white px-[15px] py-[14px]">
                    {children}
                </div>
            )}

        </div>
    );
};

// Product tabs
const ProductTabs = ({
    product,
    activeTab,
    onChange,
}) => {
    return (
        <div className="mt-[62px]">

            <div className="flex border-b border-[#e6e6e6]">
                <TabButton
                    active={activeTab === "description"}
                    onClick={() => onChange("description")}
                >
                    Description
                </TabButton>

                <TabButton
                    active={activeTab === "specifications"}
                    onClick={() => onChange("specifications")}
                >
                    Specifications
                </TabButton>

                <TabButton
                    active={activeTab === "reviews"}
                    onClick={() => onChange("reviews")}
                >
                    Reviews
                </TabButton>
            </div>

            <div className="pt-[28px]">

                {activeTab === "description" && (
                    <div>
                        <h2 className="text-[19px] font-semibold">
                            Description
                        </h2>

                        <div className="mt-[16px] max-w-[980px]">
                            <ProductContent
                                content={product.description}
                                empty="No description available."
                            />
                        </div>
                    </div>
                )}

                {activeTab === "specifications" && (
                    <div>
                        <h2 className="text-[19px] font-semibold">
                            Specifications
                        </h2>

                        <div className="mt-[16px]">
                            <ProductContent
                                content={product.specifications}
                                empty="No specifications available for this product."
                            />
                        </div>
                    </div>
                )}

                {activeTab === "reviews" && (
                    <ProductReviews />
                )}

            </div>

        </div>
    );
};

const TabButton = ({
    active,
    onClick,
    children,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`border-b-[2px] px-[14px] py-[13px] text-[13px] font-medium ${active
                    ? "border-[#2065D1] bg-[#f4f7ff] text-[#2065D1]"
                    : "border-transparent text-[#333]"
                }`}
        >
            {children}
        </button>
    );
};

// Reviews
const ProductReviews = () => {
    return (
        <div>

            <div className="flex items-center justify-between">

                <h2 className="text-[19px] font-semibold">
                    Reviews
                </h2>

                <button
                    type="button"
                    className="rounded-[8px] border border-[#dedede] px-[15px] py-[9px] text-[12px] font-medium"
                >
                    Write a Review
                </button>

            </div>

            <div className="mt-[25px] border-t border-[#ececec] pt-[28px]">

                <div className="grid grid-cols-1 gap-[35px] lg:grid-cols-[300px_1fr]">

                    <div>
                        <span className="text-[46px] font-semibold leading-none">
                            0.0
                        </span>

                        <span className="ml-[10px] text-[12px] text-[#777]">
                            0 reviews
                        </span>

                        <div className="mt-[14px] flex gap-[2px]">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={15}
                                    fill="#d8d8d8"
                                    strokeWidth={0}
                                />
                            ))}
                        </div>

                        <div className="mt-[25px] border-t border-[#ececec] pt-[20px]">
                            <p className="text-[13px] font-semibold">
                                Rating snapshot
                            </p>

                            <RatingSnapshot />
                        </div>
                    </div>

                    <div className="flex min-h-[105px] items-center justify-center rounded-[18px] border border-dashed border-[#dfdfdf] text-[13px] text-[#777]">
                        No reviews yet
                    </div>

                </div>

            </div>

        </div>
    );
};

const RatingSnapshot = () => {
    return (
        <div className="mt-[15px] space-y-[10px]">

            {[5, 4, 3, 2, 1].map((star) => (
                <div
                    key={star}
                    className="flex items-center gap-[10px]"
                >
                    <span className="w-[50px] text-[11px] text-[#777]">
                        {star} stars
                    </span>

                    <div className="h-[6px] flex-1 rounded-full bg-[#f0f0f0]" />

                    <span className="text-[11px] text-[#777]">
                        0
                    </span>
                </div>
            ))}

        </div>
    );
};

// Product content
const ProductContent = ({
    content,
    empty,
}) => {
    if (!content) {
        return (
            <p className="text-[13px] text-[#777]">
                {empty}
            </p>
        );
    }

    if (typeof content === "string") {
        return (
            <div
                className="text-[13px] leading-[23px] text-[#666] [&_h2]:mb-[10px] [&_h2]:mt-[20px] [&_h2]:text-[19px] [&_h2]:font-semibold [&_h2]:text-[#171717] [&_h3]:mb-[8px] [&_h3]:mt-[18px] [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-[#171717] [&_p]:mb-[12px]"
                dangerouslySetInnerHTML={{
                    __html: content,
                }}
            />
        );
    }

    return (
        <pre className="whitespace-pre-wrap text-[12px] text-[#666]">
            {JSON.stringify(content, null, 2)}
        </pre>
    );
};

// Image preview
const ImagePreview = ({
    image,
    title,
    onClose,
}) => {
    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 p-[30px]"
        >
            <button
                type="button"
                onClick={onClose}
                className="absolute right-[25px] top-[25px] flex h-[42px] w-[42px] items-center justify-center rounded-full bg-white"
            >
                <X size={20} />
            </button>

            {image && (
                <img
                    src={image}
                    alt={title}
                    onClick={(event) => event.stopPropagation()}
                    className="max-h-[90vh] max-w-[90vw] object-contain"
                />
            )}
        </div>
    );
};

// Variant gallery
const getVariantGallery = (product) => {
    if (!product) {
        return [];
    }

    const images = [];
    const variants = Array.isArray(product.variants)
        ? product.variants
        : [];

    const defaultVariant =
        variants.find((variant) => variant.is_default) ||
        variants[0];

    const addImage = (image, variantId = null) => {
        if (!image) {
            return;
        }

        const exists = images.some((item) => {
            return item.image === image;
        });

        if (!exists) {
            images.push({
                image: image,
                variantId: variantId,
            });
        }
    };

    if (defaultVariant?.image_url) {
        addImage(
            defaultVariant.image_url,
            defaultVariant.id
        );
    }

    variants.forEach((variant) => {
        addImage(
            variant.image_url,
            variant.id
        );
    });

    addImage(
        getProductImage(product),
        null
    );

    return images;
};

// Loader
const ProductLoader = () => {
    return (
        <div className="flex min-h-[600px] items-center justify-center">
            <LoaderCircle
                size={30}
                className="animate-spin text-[#2065D1]"
            />
        </div>
    );
};

// Not found
const ProductNotFound = ({ error }) => {
    return (
        <div className="mx-auto max-w-[1280px] px-5 py-[80px] text-center">

            <h1 className="text-[22px] font-semibold">
                Product not found
            </h1>

            <p className="mt-[8px] text-[13px] text-[#777]">
                {error}
            </p>

            <Link
                to="/"
                className="mt-[20px] inline-flex rounded-[9px] bg-[#2065D1] px-[18px] py-[10px] text-[13px] font-semibold text-white"
            >
                Back to Home
            </Link>

        </div>
    );
};

export default ProductDetails;


















