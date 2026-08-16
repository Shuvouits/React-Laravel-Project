import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
    Bold,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Heading2,
    Heading3,
    Italic,
    Link2,
    List,
    ListOrdered,
    LoaderCircle,
    Maximize2,
    Minus,
    Pencil,
    Plus,
    Quote,
    Redo2,
    ShoppingBag,
    Star,
    Strikethrough,
    Underline,
    Undo2,
    X,
    ZoomIn,
} from "lucide-react";

import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";

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
    const [activeTab, setActiveTab] = useState("description");

    const [authChecked, setAuthChecked] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const [contentSections, setContentSections] = useState([]);
    const [sectionsLoading, setSectionsLoading] = useState(false);
    const [sectionsError, setSectionsError] = useState("");
    const [sectionOpenMap, setSectionOpenMap] = useState({});

    const [sectionModalOpen, setSectionModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [sectionTitle, setSectionTitle] = useState("");
    const [sectionContent, setSectionContent] = useState("");
    const [sectionEnabled, setSectionEnabled] = useState(true);
    const [sectionSaving, setSectionSaving] = useState(false);
    const [sectionFormError, setSectionFormError] = useState("");

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

    const checkCurrentUser = async () => {
        const storedUser = getStoredUser();

        if (getUserRole(storedUser) === "admin") {
            setIsAdmin(true);
            setAuthChecked(true);
            return;
        }

        try {
            const response = await api.get("/auth/me");
            const user =
                response.data?.user ||
                response.data?.data?.user ||
                response.data?.data ||
                null;

            setIsAdmin(getUserRole(user) === "admin");
        } catch (error) {
            setIsAdmin(false);
        } finally {
            setAuthChecked(true);
        }
    };

    const fetchContentSections = async (productId) => {
        if (!productId) {
            return;
        }

        try {
            setSectionsLoading(true);
            setSectionsError("");

            const endpoint = isAdmin
                ? `/admin/products/${productId}/content-sections`
                : `/products/${slug}/content-sections`;

            const response = await api.get(endpoint);
            const sections = Array.isArray(response.data?.sections)
                ? response.data.sections
                : [];

            setContentSections(sections);

            setSectionOpenMap((current) => {
                const next = {};

                sections.forEach((section, index) => {
                    next[section.id] =
                        current[section.id] !== undefined
                            ? current[section.id]
                            : index === 0;
                });

                return next;
            });
        } catch (error) {
            console.error(
                "Product content sections error:",
                error.response?.data || error.message
            );

            setSectionsError(
                error.response?.data?.message ||
                "Unable to load product sections."
            );

            setContentSections([]);
        } finally {
            setSectionsLoading(false);
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [slug]);

    useEffect(() => {
        checkCurrentUser();
    }, []);

    useEffect(() => {
        if (!product?.id || !authChecked) {
            return;
        }

        fetchContentSections(product.id);
    }, [product?.id, slug, isAdmin, authChecked]);

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

    const displayContentSections = useMemo(() => {
        if (contentSections.length) {
            return contentSections;
        }

        if (!product) {
            return [];
        }

        return [
            {
                id: "legacy-technical",
                legacy_key: "technical",
                is_legacy: true,
                title: "Technical Details",
                content: product.specifications || "",
                is_enabled: true,
            },
            {
                id: "legacy-faq",
                legacy_key: "faq",
                is_legacy: true,
                title: "FAQ",
                content: "",
                is_enabled: true,
            },
        ];
    }, [contentSections, product]);

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

    const toggleContentSection = (sectionId, defaultOpen = false) => {
        setSectionOpenMap((current) => {
            const currentValue =
                current[sectionId] !== undefined
                    ? current[sectionId]
                    : defaultOpen;

            return {
                ...current,
                [sectionId]: !currentValue,
            };
        });
    };

    const openSectionEditor = (section = null) => {
        if (!isAdmin) {
            return;
        }

        setEditingSection(section);
        setSectionTitle(section?.title || "");
        setSectionContent(section?.content || "");
        setSectionEnabled(section?.is_enabled !== false);
        setSectionFormError("");
        setSectionModalOpen(true);
    };

    const closeSectionEditor = () => {
        if (sectionSaving) {
            return;
        }

        setSectionModalOpen(false);
        setEditingSection(null);
        setSectionTitle("");
        setSectionContent("");
        setSectionEnabled(true);
        setSectionFormError("");
    };

    const createLegacySections = async (
        selectedSection = null,
        selectedPayload = null
    ) => {
        const legacySections = [
            {
                legacy_key: "technical",
                title: "Technical Details",
                content: product?.specifications || null,
            },
            {
                legacy_key: "faq",
                title: "FAQ",
                content: null,
            },
        ];

        for (const legacySection of legacySections) {
            const selected =
                selectedSection?.legacy_key === legacySection.legacy_key;

            await api.post(
                `/admin/products/${product.id}/content-sections`,
                {
                    title:
                        selected && selectedPayload
                            ? selectedPayload.title
                            : legacySection.title,
                    content:
                        selected && selectedPayload
                            ? selectedPayload.content
                            : legacySection.content,
                    is_enabled:
                        selected && selectedPayload
                            ? selectedPayload.is_enabled
                            : true,
                }
            );
        }
    };

    const handleSaveSection = async () => {
        if (!isAdmin || !product?.id || sectionSaving) {
            return;
        }

        const title = sectionTitle.trim();

        if (!title) {
            setSectionFormError("Section title is required.");
            return;
        }

        const payload = {
            title,
            content: cleanEditorContent(sectionContent),
            is_enabled: sectionEnabled,
        };

        try {
            setSectionSaving(true);
            setSectionFormError("");

            if (editingSection?.is_legacy && contentSections.length === 0) {
                await createLegacySections(editingSection, payload);
            } else if (editingSection?.id && !editingSection?.is_legacy) {
                await api.put(
                    `/admin/products/${product.id}/content-sections/${editingSection.id}`,
                    payload
                );
            } else {
                if (contentSections.length === 0) {
                    await createLegacySections();
                }

                await api.post(
                    `/admin/products/${product.id}/content-sections`,
                    payload
                );
            }

            await fetchContentSections(product.id);

            setSectionModalOpen(false);
            setEditingSection(null);
            setSectionTitle("");
            setSectionContent("");
            setSectionEnabled(true);
            setSectionFormError("");
        } catch (error) {
            console.error(
                "Save product section error:",
                error.response?.data || error.message
            );

            const validationErrors = error.response?.data?.errors;

            if (validationErrors) {
                const firstError = Object.values(validationErrors)
                    .flat()
                    .find(Boolean);

                setSectionFormError(
                    firstError || "Unable to save product section."
                );
                return;
            }

            setSectionFormError(
                error.response?.data?.message ||
                "Unable to save product section."
            );
        } finally {
            setSectionSaving(false);
        }
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

                            {sectionsLoading && (
                                <div className="flex min-h-[70px] items-center justify-center rounded-[8px] border border-[#dedede] bg-[#f7f7f7]">
                                    <LoaderCircle
                                        size={20}
                                        className="animate-spin text-[#2065D1]"
                                    />
                                </div>
                            )}

                            {!sectionsLoading &&
                                displayContentSections.map((section, index) => {
                                    const open =
                                        sectionOpenMap[section.id] !== undefined
                                            ? sectionOpenMap[section.id]
                                            : index === 0;

                                    return (
                                        <ProductAccordion
                                            key={section.id}
                                            title={section.title}
                                            open={open}
                                            disabled={section.is_enabled === false}
                                            isAdmin={isAdmin}
                                            onEdit={() => openSectionEditor(section)}
                                            onToggle={() => {
                                                toggleContentSection(
                                                    section.id,
                                                    index === 0
                                                );
                                            }}
                                        >
                                            <ProductContent
                                                content={section.content}
                                                empty="No content added yet."
                                            />
                                        </ProductAccordion>
                                    );
                                })}

                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => openSectionEditor(null)}
                                    className="flex h-[40px] w-full items-center justify-center gap-[7px] rounded-[8px] border border-dashed border-[#b8ccef] bg-[#f8fbff] text-[13px] font-semibold text-[#2065D1] transition hover:border-[#2065D1] hover:bg-[#f2f7ff]"
                                >
                                    <Plus size={15} />
                                    Add content section
                                </button>
                            )}

                            {isAdmin && sectionsError && (
                                <p className="px-[4px] pt-[3px] text-[12px] text-red-500">
                                    {sectionsError}
                                </p>
                            )}

                        </div>

                    </div>

                </div>

                <ProductTabs
                    product={product}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />

            </div>

            {sectionModalOpen && isAdmin && (
                <SectionEditorModal
                    editing={Boolean(editingSection)}
                    title={sectionTitle}
                    content={sectionContent}
                    enabled={sectionEnabled}
                    saving={sectionSaving}
                    error={sectionFormError}
                    onTitleChange={setSectionTitle}
                    onContentChange={setSectionContent}
                    onEnabledChange={setSectionEnabled}
                    onClose={closeSectionEditor}
                    onSave={handleSaveSection}
                />
            )}

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
    isAdmin = false,
    onEdit,
    disabled = false,
}) => {
    return (
        <div className="overflow-hidden rounded-[8px] border border-[#dedede] bg-[#f7f7f7]">

            <div className="flex items-center">

                <button
                    type="button"
                    onClick={onToggle}
                    className="flex flex-1 items-center justify-between px-[15px] py-[12px] text-left"
                >
                    <div className="flex items-center gap-[8px]">
                        <span className="text-[14px] font-semibold text-[#171717]">
                            {title}
                        </span>

                        {isAdmin && disabled && (
                            <span className="rounded-full bg-[#eeeeee] px-[7px] py-[2px] text-[10px] font-medium text-[#777]">
                                Hidden
                            </span>
                        )}
                    </div>

                    <ChevronDown
                        size={17}
                        className={`transition ${open ? "rotate-180" : ""}`}
                    />
                </button>

                {isAdmin && (
                    <button
                        type="button"
                        title="Edit section"
                        onClick={(event) => {
                            event.stopPropagation();
                            onEdit?.();
                        }}
                        className="mr-[10px] flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-[7px] border border-[#dedede] bg-white text-[#555] transition hover:border-[#2065D1] hover:bg-[#f3f7ff] hover:text-[#2065D1]"
                    >
                        <Pencil size={14} strokeWidth={1.8} />
                    </button>
                )}

            </div>

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
        const looksLikeHtml = /<\/?[a-z][\s\S]*>/i.test(content);

        if (!looksLikeHtml) {
            return (
                <div className="whitespace-pre-line text-[13px] leading-[23px] text-[#666]">
                    {content}
                </div>
            );
        }

        return (
            <div
                className="text-[13px] leading-[23px] text-[#666] [&_a]:text-[#2065D1] [&_a]:underline [&_blockquote]:my-[12px] [&_blockquote]:border-l-4 [&_blockquote]:border-[#d8d8d8] [&_blockquote]:pl-[14px] [&_h2]:mb-[10px] [&_h2]:mt-[18px] [&_h2]:text-[19px] [&_h2]:font-semibold [&_h2]:text-[#171717] [&_h3]:mb-[8px] [&_h3]:mt-[16px] [&_h3]:text-[16px] [&_h3]:font-semibold [&_h3]:text-[#171717] [&_ol]:my-[10px] [&_ol]:list-decimal [&_ol]:pl-[22px] [&_p]:mb-[10px] [&_ul]:my-[10px] [&_ul]:list-disc [&_ul]:pl-[22px]"
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

const RichTextEditor = ({
    value,
    disabled,
    onChange,
}) => {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [StarterKit],
        content: value || "",
        editable: !disabled,
        editorProps: {
            attributes: {
                class: "min-h-[220px] px-[14px] py-[12px] text-[14px] leading-[23px] text-[#333] outline-none [&_a]:text-[#2065D1] [&_a]:underline [&_blockquote]:my-[12px] [&_blockquote]:border-l-4 [&_blockquote]:border-[#d8d8d8] [&_blockquote]:pl-[14px] [&_h2]:mb-[8px] [&_h2]:mt-[14px] [&_h2]:text-[20px] [&_h2]:font-semibold [&_h3]:mb-[7px] [&_h3]:mt-[12px] [&_h3]:text-[17px] [&_h3]:font-semibold [&_ol]:my-[8px] [&_ol]:list-decimal [&_ol]:pl-[24px] [&_p]:mb-[8px] [&_ul]:my-[8px] [&_ul]:list-disc [&_ul]:pl-[24px]",
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
    });

    useEffect(() => {
        if (!editor) {
            return;
        }

        editor.setEditable(!disabled);
    }, [editor, disabled]);

    useEffect(() => {
        if (!editor) {
            return;
        }

        const current = editor.getHTML();
        const next = value || "";

        if (current !== next) {
            editor.commands.setContent(next, {
                emitUpdate: false,
            });
        }
    }, [editor, value]);

    if (!editor) {
        return (
            <div className="flex min-h-[260px] items-center justify-center rounded-[9px] border border-[#dcdcdc] bg-white">
                <LoaderCircle
                    size={20}
                    className="animate-spin text-[#2065D1]"
                />
            </div>
        );
    }

    const setLink = () => {
        const previousUrl = editor.getAttributes("link").href || "";
        const url = window.prompt("Enter link URL", previousUrl || "https://");

        if (url === null) {
            return;
        }

        if (!url.trim()) {
            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .unsetLink()
                .run();
            return;
        }

        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({ href: url.trim() })
            .run();
    };

    return (
        <div
            className={`overflow-hidden rounded-[9px] border border-[#dcdcdc] bg-white transition focus-within:border-[#2065D1] focus-within:ring-2 focus-within:ring-blue-100 ${
                disabled ? "opacity-60" : ""
            }`}
        >
            <div className="flex flex-wrap items-center gap-[5px] border-b border-[#e5e5e5] bg-[#fafafa] px-[9px] py-[8px]">
                <EditorToolbarButton
                    title="Bold"
                    active={editor.isActive("bold")}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleBold().run()}
                >
                    <Bold size={15} />
                </EditorToolbarButton>

                <EditorToolbarButton
                    title="Italic"
                    active={editor.isActive("italic")}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                >
                    <Italic size={15} />
                </EditorToolbarButton>

                <EditorToolbarButton
                    title="Underline"
                    active={editor.isActive("underline")}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                >
                    <Underline size={15} />
                </EditorToolbarButton>

                <EditorToolbarButton
                    title="Strikethrough"
                    active={editor.isActive("strike")}
                    disabled={disabled}
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                >
                    <Strikethrough size={15} />
                </EditorToolbarButton>

                <EditorToolbarDivider />

                <EditorToolbarButton
                    title="Heading 2"
                    active={editor.isActive("heading", { level: 2 })}
                    disabled={disabled}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 2 }).run()
                    }
                >
                    <Heading2 size={16} />
                </EditorToolbarButton>

                <EditorToolbarButton
                    title="Heading 3"
                    active={editor.isActive("heading", { level: 3 })}
                    disabled={disabled}
                    onClick={() =>
                        editor.chain().focus().toggleHeading({ level: 3 }).run()
                    }
                >
                    <Heading3 size={16} />
                </EditorToolbarButton>

                <EditorToolbarDivider />

                <EditorToolbarButton
                    title="Bullet list"
                    active={editor.isActive("bulletList")}
                    disabled={disabled}
                    onClick={() =>
                        editor.chain().focus().toggleBulletList().run()
                    }
                >
                    <List size={16} />
                </EditorToolbarButton>

                <EditorToolbarButton
                    title="Numbered list"
                    active={editor.isActive("orderedList")}
                    disabled={disabled}
                    onClick={() =>
                        editor.chain().focus().toggleOrderedList().run()
                    }
                >
                    <ListOrdered size={16} />
                </EditorToolbarButton>

                <EditorToolbarButton
                    title="Blockquote"
                    active={editor.isActive("blockquote")}
                    disabled={disabled}
                    onClick={() =>
                        editor.chain().focus().toggleBlockquote().run()
                    }
                >
                    <Quote size={16} />
                </EditorToolbarButton>

                <EditorToolbarButton
                    title="Link"
                    active={editor.isActive("link")}
                    disabled={disabled}
                    onClick={setLink}
                >
                    <Link2 size={15} />
                </EditorToolbarButton>

                <EditorToolbarDivider />

                <EditorToolbarButton
                    title="Undo"
                    disabled={disabled || !editor.can().chain().focus().undo().run()}
                    onClick={() => editor.chain().focus().undo().run()}
                >
                    <Undo2 size={15} />
                </EditorToolbarButton>

                <EditorToolbarButton
                    title="Redo"
                    disabled={disabled || !editor.can().chain().focus().redo().run()}
                    onClick={() => editor.chain().focus().redo().run()}
                >
                    <Redo2 size={15} />
                </EditorToolbarButton>
            </div>

            <EditorContent editor={editor} />
        </div>
    );
};

const EditorToolbarButton = ({
    title,
    active = false,
    disabled = false,
    onClick,
    children,
}) => {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onMouseDown={(event) => event.preventDefault()}
            onClick={onClick}
            className={`flex h-[31px] min-w-[31px] items-center justify-center rounded-[6px] border px-[7px] transition ${
                active
                    ? "border-[#b9cef5] bg-[#eaf2ff] text-[#2065D1]"
                    : "border-transparent text-[#555] hover:border-[#dedede] hover:bg-white"
            } disabled:cursor-not-allowed disabled:opacity-35`}
        >
            {children}
        </button>
    );
};

const EditorToolbarDivider = () => {
    return <span className="mx-[2px] h-[22px] w-px bg-[#dedede]" />;
};

const SectionEditorModal = ({
    editing,
    title,
    content,
    enabled,
    saving,
    error,
    onTitleChange,
    onContentChange,
    onEnabledChange,
    onClose,
    onSave,
}) => {
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-[20px] py-[30px]">

            <div className="relative flex max-h-[92vh] w-full max-w-[700px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_25px_80px_rgba(0,0,0,0.28)]">

                <div className="shrink-0 border-b border-[#e7e7e7] px-[26px] py-[20px]">
                    <h2 className="text-[20px] font-semibold text-[#171717]">
                        {editing ? "Edit Product Section" : "Add Product Section"}
                    </h2>

                    <p className="mt-[4px] text-[13px] text-[#777]">
                        This content is shown only on this product page.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    disabled={saving}
                    className="absolute right-[18px] top-[18px] flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#777] transition hover:bg-[#f2f2f2] hover:text-[#222] disabled:opacity-50"
                >
                    <X size={18} />
                </button>

                <div className="flex-1 space-y-[20px] overflow-y-auto px-[26px] py-[22px]">
                    <div>
                        <label className="mb-[7px] block text-[13px] font-semibold text-[#333]">
                            Section title
                        </label>

                        <input
                            type="text"
                            value={title}
                            disabled={saving}
                            onChange={(event) => onTitleChange(event.target.value)}
                            placeholder="Example: Dimensions & Details"
                            className="h-[46px] w-full rounded-[9px] border border-[#dcdcdc] px-[14px] text-[14px] text-[#222] outline-none transition focus:border-[#2065D1] focus:ring-2 focus:ring-blue-100 disabled:bg-[#f5f5f5]"
                        />
                    </div>

                    <div>
                        <label className="mb-[7px] block text-[13px] font-semibold text-[#333]">
                            Content
                        </label>

                        <RichTextEditor
                            value={content}
                            disabled={saving}
                            onChange={onContentChange}
                        />
                    </div>

                    <label className="flex cursor-pointer items-start gap-[9px]">
                        <input
                            type="checkbox"
                            checked={enabled}
                            disabled={saving}
                            onChange={(event) =>
                                onEnabledChange(event.target.checked)
                            }
                            className="mt-[2px] h-[16px] w-[16px]"
                        />

                        <div>
                            <p className="text-[13px] font-medium text-[#333]">
                                Show this section
                            </p>
                            <p className="mt-[1px] text-[11px] text-[#888]">
                                Turn this off to hide it from customers.
                            </p>
                        </div>
                    </label>

                    {error && (
                        <div className="rounded-[8px] border border-red-200 bg-red-50 px-[12px] py-[10px] text-[12px] text-red-600">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 items-center justify-end gap-[9px] border-t border-[#e7e7e7] px-[26px] py-[17px]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="h-[40px] rounded-[9px] border border-[#dedede] bg-white px-[17px] text-[13px] font-semibold text-[#333] transition hover:bg-[#f7f7f7] disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onSave}
                        disabled={saving || !title.trim()}
                        className="flex h-[40px] items-center gap-[7px] rounded-[9px] bg-[#2065D1] px-[18px] text-[13px] font-semibold text-white transition hover:bg-[#1959bd] disabled:cursor-not-allowed disabled:bg-[#91afe0]"
                    >
                        {saving && (
                            <LoaderCircle size={15} className="animate-spin" />
                        )}
                        {saving ? "Saving..." : "Save Section"}
                    </button>
                </div>

            </div>

        </div>
    );
};

const cleanEditorContent = (content) => {
    const value = String(content || "").trim();

    if (!value || value === "<p></p>") {
        return null;
    }

    return value;
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

const getStoredUser = () => {
    if (typeof window === "undefined") {
        return null;
    }

    const storageValues = [
        localStorage.getItem("user"),
        localStorage.getItem("auth_user"),
        localStorage.getItem("currentUser"),
        localStorage.getItem("auth"),
        sessionStorage.getItem("user"),
    ];

    for (const value of storageValues) {
        if (!value) {
            continue;
        }

        try {
            const parsed = JSON.parse(value);
            const user = parsed?.user || parsed?.data?.user || parsed;

            if (user && typeof user === "object") {
                return user;
            }
        } catch (error) {
            continue;
        }
    }

    return null;
};

const getUserRole = (user) => {
    if (!user) {
        return "";
    }

    const role =
        user.role?.name ||
        user.role ||
        user.user_type ||
        user.type ||
        "";

    return String(role).trim().toLowerCase();
};

export default ProductDetails;


















