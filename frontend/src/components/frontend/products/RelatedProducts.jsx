import { useEffect, useRef, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    LoaderCircle,
} from "lucide-react";

import api from "../../../api/axios";

import ProductCard from "./ProductCard";
import ProductQuickViewModal from "./ProductQuickViewModal";

const RelatedProducts = ({ product }) => {
    const sliderRef = useRef(null);

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [quickViewProduct, setQuickViewProduct] = useState(null);

    useEffect(() => {
        if (!product?.id) {
            setProducts([]);
            setLoading(false);
            return;
        }

        fetchRelatedProducts();
        setQuickViewProduct(null);
    }, [product?.id, product?.category?.slug]);

    const fetchRelatedProducts = async () => {
        try {
            setLoading(true);

            const categorySlug =
                product?.category?.slug ||
                product?.category_slug ||
                "";

            const params = {
                per_page: 12,
            };

            if (categorySlug) {
                params.category = categorySlug;
            }

            const response = await api.get(
                "/products",
                {
                    params,
                }
            );

            let items = extractProducts(
                response
            );

            items = removeCurrentProduct(
                items,
                product.id
            );

            /*
             * যদি category থেকে যথেষ্ট product না পাওয়া যায়,
             * general catalog থেকে বাকিগুলো fill করবে।
             */
            if (
                categorySlug &&
                items.length < 6
            ) {
                const fallbackResponse =
                    await api.get(
                        "/products",
                        {
                            params: {
                                per_page: 12,
                            },
                        }
                    );

                const fallbackItems =
                    removeCurrentProduct(
                        extractProducts(
                            fallbackResponse
                        ),
                        product.id
                    );

                items = mergeProducts(
                    items,
                    fallbackItems
                );
            }

            setProducts(
                items.slice(0, 10)
            );
        } catch (error) {
            console.error(
                "Related products error:",
                error.response?.data ||
                error.message
            );

            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    const scrollSlider = (direction) => {
        if (!sliderRef.current) {
            return;
        }

        const amount =
            sliderRef.current.clientWidth *
            0.9;

        sliderRef.current.scrollBy({
            left:
                direction === "right"
                    ? amount
                    : -amount,
            behavior: "smooth",
        });
    };

    const openQuickView = (selectedProduct) => {
        setQuickViewProduct(
            selectedProduct
        );
    };

    const closeQuickView = () => {
        setQuickViewProduct(null);
    };

    if (loading) {
        return <RelatedProductsLoader />;
    }

    if (!products.length) {
        return null;
    }

    return (
        <>
            <section className="w-full pb-[30px]">
                <div className="mx-auto max-w-[1500px] px-5">
                    <div className="border-t border-[#ececec] pt-[42px]">

                        <div className="flex items-end justify-between gap-5">
                            <div>
                                <h2 className="text-[26px] font-bold leading-[1.2] tracking-[-0.5px] text-[#171717]">
                                    You May Also Like
                                </h2>

                                <p className="mt-[5px] text-[13px] text-[#777777]">
                                    More products you may be interested in
                                </p>
                            </div>

                            <div className="flex items-center gap-[8px]">
                                <button
                                    type="button"
                                    onClick={() =>
                                        scrollSlider(
                                            "left"
                                        )
                                    }
                                    aria-label="Previous products"
                                    className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#777777] transition hover:border-[#d4d4d4] hover:bg-[#f7f7f7] hover:text-[#171717]"
                                >
                                    <ChevronLeft
                                        size={18}
                                    />
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        scrollSlider(
                                            "right"
                                        )
                                    }
                                    aria-label="Next products"
                                    className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[#e5e5e5] bg-white text-[#777777] transition hover:border-[#d4d4d4] hover:bg-[#f7f7f7] hover:text-[#171717]"
                                >
                                    <ChevronRight
                                        size={18}
                                    />
                                </button>
                            </div>
                        </div>

                        <div
                            ref={sliderRef}
                            style={{
                                "--related-card-width":
                                    "calc((100% - 48px) / 4)",
                            }}
                            className="mt-[27px] flex snap-x snap-mandatory items-start gap-[16px] overflow-x-auto scroll-smooth pb-[12px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                        >
                            {products.map(
                                (relatedProduct) => (
                                    <div
                                        key={
                                            relatedProduct.id
                                        }
                                        className="shrink-0 basis-[82%] snap-start sm:basis-[47%] md:basis-[31%] lg:basis-[var(--related-card-width)]"
                                    >
                                        <ProductCard
                                            product={
                                                relatedProduct
                                            }
                                            onQuickView={
                                                openQuickView
                                            }
                                            onChooseOptions={
                                                openQuickView
                                            }
                                        />
                                    </div>
                                )
                            )}
                        </div>

                    </div>
                </div>
            </section>

            <ProductQuickViewModal
                open={Boolean(
                    quickViewProduct
                )}
                product={quickViewProduct}
                onClose={closeQuickView}
            />
        </>
    );
};

const RelatedProductsLoader = () => {
    return (
        <section className="w-full pb-[30px]">
            <div className="mx-auto max-w-[1500px] px-5">
                <div className="border-t border-[#ececec] py-[70px]">
                    <div className="flex justify-center">
                        <LoaderCircle
                            size={27}
                            className="animate-spin text-[#2065D1]"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

const extractProducts = (response) => {
    const products =
        response?.data?.products;

    if (Array.isArray(products)) {
        return products;
    }

    if (
        Array.isArray(
            products?.data
        )
    ) {
        return products.data;
    }

    const data =
        response?.data?.data;

    if (Array.isArray(data)) {
        return data;
    }

    if (
        Array.isArray(
            data?.data
        )
    ) {
        return data.data;
    }

    return [];
};

const removeCurrentProduct = (
    products,
    currentProductId
) => {
    return products.filter(
        (item) =>
            String(item.id) !==
            String(currentProductId)
    );
};

const mergeProducts = (
    primary,
    secondary
) => {
    const map = new Map();

    [
        ...primary,
        ...secondary,
    ].forEach((item) => {
        if (!item?.id) {
            return;
        }

        map.set(
            String(item.id),
            item
        );
    });

    return Array.from(
        map.values()
    );
};

export default RelatedProducts;