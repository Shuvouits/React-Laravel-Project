import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, LoaderCircle, SlidersHorizontal } from "lucide-react";
import api from "../../../api/axios";
import ProductCard from "./ProductCard";
import ProductQuickViewModal from "./ProductQuickViewModal";

const FeaturedProducts = () => {
    const [section, setSection] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState("all");
    const [sort, setSort] = useState("default");
    const [page, setPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState("");
    const [filterOpen, setFilterOpen] = useState(false);
    const [quickViewProduct, setQuickViewProduct] = useState(null);
    const observerRef = useRef(null);
    const sentinelRef = useRef(null);

    // Load products.
    const fetchProducts = useCallback(async (pageNumber = 1, append = false) => {
        try {
            append ? setLoadingMore(true) : setLoading(true);
            setError("");

            const params = { page: pageNumber };
            if (activeCategory !== "all") params.category_id = activeCategory;
            if (sort !== "default") params.sort = sort;

            const response = await api.get("/home/featured-products", { params });
            const data = response.data || {};
            const incomingProducts = data.products?.data || data.products || [];
            const pagination = data.pagination || data.meta || {};

            setSection(data.section || null);
            setCategories(data.categories || []);
            setProducts((previous) => append ? [...previous, ...incomingProducts] : incomingProducts);

            const currentPage = Number(
                pagination.current_page ||
                data.products?.current_page ||
                pageNumber
            );

            const finalPage = Number(
                pagination.last_page ||
                data.products?.last_page ||
                currentPage
            );

            setPage(currentPage);
            setLastPage(finalPage);
        } catch (error) {
            console.error("Featured Products error:", error);
            if (!append) setProducts([]);
            setError(error.response?.data?.message || "Unable to load products.");
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [activeCategory, sort]);

    // Reload when category or sort changes.
    useEffect(() => {
        setProducts([]);
        setPage(1);
        setLastPage(1);
        fetchProducts(1, false);
    }, [fetchProducts]);

    // Infinite scroll.
    useEffect(() => {
        if (!sentinelRef.current) return;

        if (observerRef.current) observerRef.current.disconnect();

        observerRef.current = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (!entry.isIntersecting || loading || loadingMore || page >= lastPage) return;
                fetchProducts(page + 1, true);
            },
            { rootMargin: "300px 0px" }
        );

        observerRef.current.observe(sentinelRef.current);

        return () => {
            if (observerRef.current) observerRef.current.disconnect();
        };
    }, [fetchProducts, loading, loadingMore, page, lastPage]);

    // Open reusable Quick View.
    const openQuickView = (product) => {
        setQuickViewProduct(product);
    };

    // Choose options uses the same modal.
    const handleChooseOptions = (product) => {
        setQuickViewProduct(product);
    };

    if (loading && products.length === 0) return <FeaturedProductsSkeleton />;
    if (!section || section.is_active === false) return null;

    return (
        <>
            <section className="w-full bg-white py-[38px] md:py-[46px]">
                <div className="mx-auto max-w-[1280px] px-4 md:px-5">
                    <h2 className="text-[27px] font-bold leading-[1.2] tracking-[-0.6px] text-[#151515] md:text-[30px]">
                        {section.title || "Find your favorite products."}
                    </h2>

                    <div className="mt-[28px] flex flex-col gap-[18px] lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-[10px] overflow-x-auto pb-[3px] scrollbar-hide">
                            <CategoryButton
                                active={activeCategory === "all"}
                                onClick={() => setActiveCategory("all")}
                            >
                                All Items
                            </CategoryButton>

                            {categories.map((category) => (
                                <CategoryButton
                                    key={category.id}
                                    active={String(activeCategory) === String(category.id)}
                                    onClick={() => setActiveCategory(category.id)}
                                >
                                    {category.name}
                                </CategoryButton>
                            ))}
                        </div>

                        <div className="relative shrink-0">
                            <button
                                type="button"
                                onClick={() => setFilterOpen((previous) => !previous)}
                                className="flex h-[42px] items-center gap-[11px] rounded-full bg-[#171717] px-[18px] text-[13px] font-semibold text-white transition-colors hover:bg-black"
                            >
                                <SlidersHorizontal size={15} />
                                Filter
                                <ChevronDown size={14} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
                            </button>

                            {filterOpen && (
                                <div className="absolute right-0 top-[50px] z-30 w-[210px] overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white p-[6px] shadow-[0_12px_35px_rgba(0,0,0,0.12)]">
                                    <FilterOption
                                        active={sort === "default"}
                                        onClick={() => {
                                            setSort("default");
                                            setFilterOpen(false);
                                        }}
                                    >
                                        Recommended
                                    </FilterOption>

                                    <FilterOption
                                        active={sort === "latest"}
                                        onClick={() => {
                                            setSort("latest");
                                            setFilterOpen(false);
                                        }}
                                    >
                                        Newest
                                    </FilterOption>

                                    <FilterOption
                                        active={sort === "price_low"}
                                        onClick={() => {
                                            setSort("price_low");
                                            setFilterOpen(false);
                                        }}
                                    >
                                        Price: Low to High
                                    </FilterOption>

                                    <FilterOption
                                        active={sort === "price_high"}
                                        onClick={() => {
                                            setSort("price_high");
                                            setFilterOpen(false);
                                        }}
                                    >
                                        Price: High to Low
                                    </FilterOption>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && products.length === 0 ? (
                        <div className="mt-[25px] rounded-[12px] border border-red-100 bg-red-50 px-4 py-4 text-[13px] text-red-600">
                            {error}
                        </div>
                    ) : products.length === 0 ? (
                        <div className="mt-[40px] flex min-h-[220px] items-center justify-center rounded-[14px] border border-[#ebebeb] bg-[#fafafa] text-[13px] text-[#777]">
                            No products found.
                        </div>
                    ) : (
                        <div className="mt-[25px] grid grid-cols-2 gap-x-[14px] gap-y-[32px] md:grid-cols-3 md:gap-x-[18px] lg:grid-cols-4">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    onQuickView={openQuickView}
                                    onChooseOptions={handleChooseOptions}
                                />
                            ))}
                        </div>
                    )}

                    <div ref={sentinelRef} className="h-[10px]" />

                    {loadingMore && (
                        <div className="flex items-center justify-center py-[30px]">
                            <LoaderCircle size={24} className="animate-spin text-[#2065D1]" />
                        </div>
                    )}

                    {!loading && !loadingMore && products.length > 0 && page >= lastPage && (
                        <div className="h-[20px]" />
                    )}
                </div>
            </section>

            <ProductQuickViewModal
                product={quickViewProduct}
                open={Boolean(quickViewProduct)}
                onClose={() => setQuickViewProduct(null)}
            />
        </>
    );
};

const CategoryButton = ({ children, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`shrink-0 rounded-full px-[18px] py-[10px] text-[12px] font-semibold transition-colors ${active ? "bg-[#171717] text-white" : "bg-transparent text-[#626262] hover:bg-[#f4f4f4] hover:text-[#111]"
            }`}
    >
        {children}
    </button>
);

const FilterOption = ({ children, active, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-full rounded-[8px] px-[11px] py-[9px] text-left text-[12px] transition-colors ${active ? "bg-[#f0f5fd] font-semibold text-[#2065D1]" : "text-[#444] hover:bg-[#f6f6f6]"
            }`}
    >
        {children}
    </button>
);

const FeaturedProductsSkeleton = () => (
    <section className="w-full bg-white py-[46px]">
        <div className="mx-auto max-w-[1280px] px-4 md:px-5">
            <div className="h-[36px] w-[310px] animate-pulse rounded-[8px] bg-[#f0f1f2]" />

            <div className="mt-[28px] flex items-center gap-[10px]">
                {[90, 100, 80, 95, 110, 85].map((width, index) => (
                    <div
                        key={index}
                        style={{ width }}
                        className="h-[38px] animate-pulse rounded-full bg-[#f3f4f5]"
                    />
                ))}
            </div>

            <div className="mt-[27px] grid grid-cols-2 gap-[14px] md:grid-cols-3 lg:grid-cols-4 lg:gap-[18px]">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                    <div key={item}>
                        <div className="aspect-square animate-pulse rounded-[14px] bg-[#f2f3f4]" />
                        <div className="mt-[11px] h-[13px] w-[80%] animate-pulse rounded bg-[#f2f3f4]" />
                        <div className="mt-[7px] h-[12px] w-[45%] animate-pulse rounded bg-[#f2f3f4]" />
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default FeaturedProducts;