import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, LoaderCircle } from "lucide-react";

import api from "../../../api/axios";
import ProductCard from "./ProductCard";
import ProductQuickViewModal from "./ProductQuickViewModal";

const ProductsOnSale = () => {
    const sliderRef = useRef(null);

    const [section, setSection] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [quickViewProduct, setQuickViewProduct] = useState(null);

    // Fetch products
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/home/products-on-sale");

            setSection(response.data?.section || null);
            setProducts(response.data?.products || []);
        } catch (error) {
            console.error("Products on Sale error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load products."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Scroll slider
    const scrollSlider = (direction) => {
        if (!sliderRef.current) {
            return;
        }

        const amount = sliderRef.current.clientWidth * 0.9;
        const left = direction === "right" ? amount : -amount;

        sliderRef.current.scrollBy({
            left: left,
            behavior: "smooth",
        });
    };

    // Open quick view
    const openQuickView = (product) => {
        setQuickViewProduct(product);
    };

    // Close quick view
    const closeQuickView = () => {
        setQuickViewProduct(null);
    };

    if (loading) {
        return <ProductsLoader />;
    }

    if (
        error ||
        !section ||
        section.is_active === false ||
        products.length === 0
    ) {
        return null;
    }

    const desktopCards = getDesktopCards(section);
    const cardWidth = getCardWidth(desktopCards);

    return (
        <>
            <section className="mt-[55px] w-full">

                <div className="mx-auto max-w-[1280px] px-5">

                    {/* Header */}
                    <div className="flex items-end justify-between gap-4">

                        <div>
                            <h2 className="text-[27px] font-bold leading-[1.2] tracking-[-0.6px] text-[#171717]">
                                {section.title || "Product on Sale"}
                            </h2>

                            {section.settings?.subtitle && (
                                <p className="mt-[6px] text-[13px] text-[#777]">
                                    {section.settings.subtitle}
                                </p>
                            )}
                        </div>

                        <SliderButtons onScroll={scrollSlider} />

                    </div>

                    {/* Products */}
                    <div
                        ref={sliderRef}
                        style={{
                            "--desktop-product-width": cardWidth,
                        }}
                        className="mt-[27px] flex snap-x snap-mandatory items-start gap-[16px] overflow-x-auto scroll-smooth pb-[10px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    >
                        {products.map((product) => (
                            <div
                                key={product.id}
                                className="shrink-0 basis-[82%] snap-start sm:basis-[47%] md:basis-[31%] lg:basis-[var(--desktop-product-width)]"
                            >
                                <ProductCard
                                    product={product}
                                    onQuickView={openQuickView}
                                    onChooseOptions={openQuickView}
                                />
                            </div>
                        ))}
                    </div>

                </div>

            </section>

            <ProductQuickViewModal
                open={Boolean(quickViewProduct)}
                product={quickViewProduct}
                onClose={closeQuickView}
            />
        </>
    );
};

// Slider buttons
const SliderButtons = ({ onScroll }) => {
    return (
        <div className="flex items-center gap-[7px]">

            <button
                type="button"
                onClick={() => onScroll("left")}
                className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#e6e6e6] bg-white text-[#777] hover:bg-[#f7f7f7] hover:text-[#111]"
            >
                <ChevronLeft size={18} />
            </button>

            <button
                type="button"
                onClick={() => onScroll("right")}
                className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#e6e6e6] bg-white text-[#777] hover:bg-[#f7f7f7] hover:text-[#111]"
            >
                <ChevronRight size={18} />
            </button>

        </div>
    );
};

// Loading
const ProductsLoader = () => {
    return (
        <section className="mt-[55px]">
            <div className="mx-auto max-w-[1280px] px-5">
                <div className="flex justify-center py-[70px]">
                    <LoaderCircle
                        size={28}
                        className="animate-spin text-[#2065D1]"
                    />
                </div>
            </div>
        </section>
    );
};

// Desktop cards
const getDesktopCards = (section) => {
    const value = Number(
        section.settings?.desktop_cards_per_row || 4
    );

    if (value < 2) {
        return 2;
    }

    if (value > 6) {
        return 6;
    }

    return value;
};

// Card width
const getCardWidth = (desktopCards) => {
    const gap = 16;
    const totalGap = (desktopCards - 1) * gap;

    return `calc((100% - ${totalGap}px) / ${desktopCards})`;
};

export default ProductsOnSale;