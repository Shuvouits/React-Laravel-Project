import {
     ChevronDown,
    ChevronLeft,
    ChevronRight,
    LoaderCircle,
    SlidersHorizontal,
} from "lucide-react";
import {
     useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import {
    Link,
    useSearchParams,
} from "react-router-dom";

import api from "../../../api/axios";




import ProductCatalogSidebar from "../../../components/frontend/products/catalog/ProductCatalogSidebar";

import {
    buildCatalogApiParams,
    buildCatalogSearchParams,
    DEFAULT_CATALOG_STATE,
    EMPTY_CATALOG_FILTERS,
    getAppliedFilterCount,
    getInitialCatalogState,
    PRODUCT_CATALOG_API,
    PRODUCT_SORT_OPTIONS,
    toggleFilterValue,
} from "../../../components/frontend/products/catalog/productCatalogConfig";
import ProductCard from "../../../components/frontend/products/ProductCard";
import ProductQuickViewModal from "../../../components/frontend/products/ProductQuickViewModal";

const ProductsPage = () => {
    const [
        searchParams,
        setSearchParams,
    ] = useSearchParams();

       const syncingFromUrlRef =
        useRef(false);

    const [state, setState] = useState(
        () =>
            getInitialCatalogState(
                searchParams
            )
    );

    const [products, setProducts] =
        useState([]);

    const [filters, setFilters] =
        useState(
            EMPTY_CATALOG_FILTERS
        );

    const [pagination, setPagination] =
        useState({
            current_page: 1,
            last_page: 1,
            per_page: 12,
            total: 0,
            from: null,
            to: null,
            has_more_pages: false,
        });

    const [loading, setLoading] =
        useState(true);

    const [filterLoading, setFilterLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [mobileFiltersOpen, setMobileFiltersOpen] =
        useState(false);

    const [
        quickViewProduct,
        setQuickViewProduct,
    ] = useState(null);

    const appliedCount = useMemo(
        () =>
            getAppliedFilterCount(
                state
            ),
        [state]
    );

    const fetchFilters =
        useCallback(async () => {
            try {
                setFilterLoading(true);

                const response =
                    await api.get(
                        PRODUCT_CATALOG_API.filters
                    );

                setFilters(
                    response.data?.filters ||
                    EMPTY_CATALOG_FILTERS
                );
            } catch (error) {
                console.error(
                    "Catalog filters error:",
                    error.response?.data ||
                    error.message
                );
            } finally {
                setFilterLoading(false);
            }
        }, []);

    const fetchProducts =
        useCallback(async () => {
            try {
                setLoading(true);
                setError("");

                const response =
                    await api.get(
                        PRODUCT_CATALOG_API.products,
                        {
                            params:
                                buildCatalogApiParams(
                                    state
                                ),
                        }
                    );

                setProducts(
                    response.data?.products ||
                    []
                );

                setPagination(
                    response.data?.pagination ||
                    {
                        current_page:
                            state.page,
                        last_page: 1,
                        per_page:
                            state.perPage,
                        total: 0,
                        from: null,
                        to: null,
                        has_more_pages:
                            false,
                    }
                );
            } catch (error) {
                console.error(
                    "Product catalog error:",
                    error.response?.data ||
                    error.message
                );

                setError(
                    error.response?.data
                        ?.message ||
                    "Unable to load products."
                );

                setProducts([]);
            } finally {
                setLoading(false);
            }
        }, [state]);



        useEffect(() => {
    const currentQuery =
        searchParams.toString();

    const stateQuery =
        buildCatalogSearchParams(
            state
        ).toString();

    if (
        currentQuery ===
        stateQuery
    ) {
        return;
    }

    syncingFromUrlRef.current =
        true;

    setState(
        getInitialCatalogState(
            searchParams
        )
    );
}, [searchParams]);




    useEffect(() => {
        fetchFilters();
    }, [fetchFilters]);

   

    useEffect(() => {
    const nextParams =
        buildCatalogSearchParams(
            state
        );

    setSearchParams(
        nextParams,
        {
            replace: true,
        }
    );

    fetchProducts();
}, [
    state,
    setSearchParams,
    fetchProducts,
]);



    const updateFilter = (
        key,
        value
    ) => {
        setState((previous) => ({
            ...previous,
            [key]: value,
            page: 1,
        }));
    };

    const handleToggleCategory = (
        slug
    ) => {
        setState((previous) => ({
            ...previous,
            categories:
                toggleFilterValue(
                    previous.categories,
                    slug
                ),
            page: 1,
        }));
    };

    const handleToggleCollection = (
        slug
    ) => {
        setState((previous) => ({
            ...previous,
            collections:
                toggleFilterValue(
                    previous.collections,
                    slug
                ),
            page: 1,
        }));
    };

    const handleToggleLocation = (
        locationId
    ) => {
        setState((previous) => ({
            ...previous,
            locations:
                toggleFilterValue(
                    previous.locations,
                    locationId
                ),
            page: 1,
        }));
    };

    const handleClearFilters = () => {
        setState({
            ...DEFAULT_CATALOG_STATE,
            sort: state.sort,
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const handlePageChange = (
        page
    ) => {
        if (
            page < 1 ||
            page >
                pagination.last_page ||
            page ===
                pagination.current_page
        ) {
            return;
        }

        setState((previous) => ({
            ...previous,
            page,
        }));

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <>
            <main className="min-h-[650px] bg-white pb-[80px] pt-[34px]">
                <div className="mx-auto max-w-[1500px] px-5">
                    <CatalogBreadcrumb />

                    <CatalogHeader
                        sort={state.sort}
                        total={
                            pagination.total
                        }
                        onSortChange={(
                            value
                        ) =>
                            updateFilter(
                                "sort",
                                value
                            )
                        }
                        onOpenFilters={() =>
                            setMobileFiltersOpen(
                                true
                            )
                        }
                    />

                    <div className="mt-[34px] flex items-start gap-[42px]">
                        <div className="hidden lg:block">
                            {filterLoading ? (
                                <SidebarLoader />
                            ) : (
                                <ProductCatalogSidebar
                                    state={state}
                                    filters={
                                        filters
                                    }
                                    appliedCount={
                                        appliedCount
                                    }
                                    onToggleCategory={
                                        handleToggleCategory
                                    }
                                    onToggleCollection={
                                        handleToggleCollection
                                    }
                                    onToggleLocation={
                                        handleToggleLocation
                                    }
                                    onPriceChange={(
                                        key,
                                        value
                                    ) =>
                                        updateFilter(
                                            key,
                                            value
                                        )
                                    }
                                    onStockChange={(
                                        value
                                    ) =>
                                        updateFilter(
                                            "inStock",
                                            value
                                        )
                                    }
                                    onClear={
                                        handleClearFilters
                                    }
                                />
                            )}
                        </div>

                        <section className="min-w-0 flex-1">
                            {loading ? (
                                <ProductsLoader />
                            ) : error ? (
                                <CatalogError
                                    message={
                                        error
                                    }
                                    onRetry={
                                        fetchProducts
                                    }
                                />
                            ) : products.length ===
                              0 ? (
                                <EmptyProducts
                                    onClear={
                                        handleClearFilters
                                    }
                                />
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 gap-x-[20px] gap-y-[42px] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                        {products.map(
                                            (
                                                product
                                            ) => (
                                                <ProductCard
                                                    key={
                                                        product.id
                                                    }
                                                    product={
                                                        product
                                                    }
                                                    onQuickView={
                                                        setQuickViewProduct
                                                    }
                                                    onChooseOptions={
                                                        setQuickViewProduct
                                                    }
                                                />
                                            )
                                        )}
                                    </div>

                                    <CatalogPagination
                                        pagination={
                                            pagination
                                        }
                                        onPageChange={
                                            handlePageChange
                                        }
                                    />
                                </>
                            )}
                        </section>
                    </div>
                </div>
            </main>

            <MobileFilters
                open={mobileFiltersOpen}
                loading={filterLoading}
                state={state}
                filters={filters}
                appliedCount={
                    appliedCount
                }
                onClose={() =>
                    setMobileFiltersOpen(
                        false
                    )
                }
                onToggleCategory={
                    handleToggleCategory
                }
                onToggleCollection={
                    handleToggleCollection
                }
                onToggleLocation={
                    handleToggleLocation
                }
                onPriceChange={(
                    key,
                    value
                ) =>
                    updateFilter(
                        key,
                        value
                    )
                }
                onStockChange={(
                    value
                ) =>
                    updateFilter(
                        "inStock",
                        value
                    )
                }
                onClear={
                    handleClearFilters
                }
            />

            <ProductQuickViewModal
                open={Boolean(
                    quickViewProduct
                )}
                product={
                    quickViewProduct
                }
                onClose={() =>
                    setQuickViewProduct(
                        null
                    )
                }
            />
        </>
    );
};

const CatalogBreadcrumb = () => {
    return (
        <nav className="flex items-center gap-[10px] text-[13px]">
            <Link
                to="/"
                className="text-[#777] transition hover:text-[#2065D1]"
            >
                Home
            </Link>

            <ChevronRight
                size={15}
                strokeWidth={1.7}
                className="text-[#999]"
            />

            <span className="font-medium text-[#222]">
                Products
            </span>
        </nav>
    );
};

const CatalogHeader = ({
    sort,
    total,
    onSortChange,
    onOpenFilters,
}) => {
    return (
        <div className="mt-[24px] flex min-h-[66px] items-start justify-between gap-5 border-b border-[#e5e5e5] pb-[28px]">
            <div>
                <h1 className="text-[30px] font-bold tracking-[-0.8px] text-[#111]">
                    All Products
                </h1>

                <p className="mt-[5px] text-[12px] text-[#888]">
                    {total}{" "}
                    {total === 1
                        ? "product"
                        : "products"}
                </p>
            </div>

            <div className="flex items-center gap-[10px]">
                <button
                    type="button"
                    onClick={onOpenFilters}
                    className="flex h-[42px] items-center gap-[7px] rounded-full border border-[#dedede] px-[15px] text-[13px] font-medium text-[#333] lg:hidden"
                >
                    <SlidersHorizontal
                        size={15}
                    />
                    Filters
                </button>

                <label className="relative">
                    <span className="sr-only">
                        Sort products
                    </span>

                    <select
                        value={sort}
                        onChange={(event) =>
                            onSortChange(
                                event.target
                                    .value
                            )
                        }
                        className="h-[42px] min-w-[150px] appearance-none rounded-full border border-[#dedede] bg-white pl-[17px] pr-[38px] text-[13px] font-medium text-[#222] outline-none transition hover:border-[#c9c9c9] focus:border-[#7da4ec]"
                    >
                        {PRODUCT_SORT_OPTIONS.map(
                            (option) => (
                                <option
                                    key={
                                        option.value
                                    }
                                    value={
                                        option.value
                                    }
                                >
                                    {
                                        option.label
                                    }
                                </option>
                            )
                        )}
                    </select>

                    <ChevronDown
                        size={15}
                        className="pointer-events-none absolute right-[14px] top-1/2 -translate-y-1/2 text-[#777]"
                    />
                </label>
            </div>
        </div>
    );
};

const ProductsLoader = () => {
    return (
        <div className="grid grid-cols-1 gap-x-[20px] gap-y-[42px] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {Array.from({
                length: 8,
            }).map((_, index) => (
                <div
                    key={index}
                    className="animate-pulse"
                >
                    <div className="aspect-square rounded-[12px] bg-[#f0f1f3]" />
                    <div className="mt-4 h-[13px] w-[45%] rounded bg-[#f0f1f3]" />
                    <div className="mt-3 h-[16px] w-[85%] rounded bg-[#eceef0]" />
                    <div className="mt-3 h-[12px] w-[60%] rounded bg-[#f0f1f3]" />
                    <div className="mt-4 h-[27px] w-[42%] rounded bg-[#eceef0]" />
                </div>
            ))}
        </div>
    );
};

const SidebarLoader = () => {
    return (
        <div className="w-[292px] animate-pulse">
            {Array.from({
                length: 5,
            }).map((_, index) => (
                <div
                    key={index}
                    className="border-b border-[#e6e6e6] py-[20px]"
                >
                    <div className="h-[15px] w-[45%] rounded bg-[#eceef0]" />
                    <div className="mt-5 space-y-3">
                        <div className="h-[12px] w-full rounded bg-[#f0f1f3]" />
                        <div className="h-[12px] w-[85%] rounded bg-[#f0f1f3]" />
                        <div className="h-[12px] w-[70%] rounded bg-[#f0f1f3]" />
                    </div>
                </div>
            ))}
        </div>
    );
};

const CatalogError = ({
    message,
    onRetry,
}) => {
    return (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-[16px] border border-[#ffd0d0] bg-[#fff8f8] px-6 text-center">
            <p className="text-[14px] font-semibold text-[#d93434]">
                {message}
            </p>

            <button
                type="button"
                onClick={onRetry}
                className="mt-4 h-[39px] rounded-full bg-[#2065D1] px-5 text-[12px] font-semibold text-white hover:bg-[#1757b8]"
            >
                Try again
            </button>
        </div>
    );
};

const EmptyProducts = ({
    onClear,
}) => {
    return (
        <div className="flex min-h-[420px] flex-col items-center justify-center text-center">
            <div className="flex h-[62px] w-[62px] items-center justify-center rounded-full bg-[#f0f4ff] text-[#2065D1]">
                <SlidersHorizontal
                    size={25}
                />
            </div>

            <h2 className="mt-5 text-[18px] font-semibold text-[#222]">
                No products found
            </h2>

            <p className="mt-2 max-w-[380px] text-[13px] leading-[20px] text-[#888]">
                Try removing some filters or choosing a different price range.
            </p>

            <button
                type="button"
                onClick={onClear}
                className="mt-5 h-[40px] rounded-full bg-[#2065D1] px-6 text-[13px] font-semibold text-white hover:bg-[#1757b8]"
            >
                Clear filters
            </button>
        </div>
    );
};

const CatalogPagination = ({
    pagination,
    onPageChange,
}) => {
    const currentPage =
        Number(
            pagination.current_page
        ) || 1;

    const lastPage =
        Number(
            pagination.last_page
        ) || 1;

    const pages =
        getVisiblePages(
            currentPage,
            lastPage
        );

    return (
        <div className="mt-[65px] border-t border-[#eeeeee] pt-[28px]">
            <div className="flex flex-col items-center justify-between gap-5 sm:flex-row">
                <p className="text-[12px] text-[#777]">
                    Showing{" "}
                    {pagination.from || 0}
                    {" - "}
                    {pagination.to || 0}
                    {" of "}
                    {pagination.total || 0}
                    {" products"}
                </p>

                {lastPage > 1 && (
                    <div className="flex items-center gap-[7px]">
                        <PaginationButton
                            disabled={
                                currentPage <= 1
                            }
                            onClick={() =>
                                onPageChange(
                                    currentPage -
                                        1
                                )
                            }
                            ariaLabel="Previous page"
                        >
                            <ChevronLeft
                                size={16}
                            />
                        </PaginationButton>

                        {pages.map(
                            (page) => (
                                <PaginationButton
                                    key={page}
                                    active={
                                        page ===
                                        currentPage
                                    }
                                    onClick={() =>
                                        onPageChange(
                                            page
                                        )
                                    }
                                    ariaLabel={`Page ${page}`}
                                >
                                    {page}
                                </PaginationButton>
                            )
                        )}

                        <PaginationButton
                            disabled={
                                currentPage >=
                                lastPage
                            }
                            onClick={() =>
                                onPageChange(
                                    currentPage +
                                        1
                                )
                            }
                            ariaLabel="Next page"
                        >
                            <ChevronRight
                                size={16}
                            />
                        </PaginationButton>
                    </div>
                )}
            </div>
        </div>
    );
};

const PaginationButton = ({
    active = false,
    disabled = false,
    onClick,
    ariaLabel,
    children,
}) => {
    return (
        <button
            type="button"
            aria-label={ariaLabel}
            disabled={disabled}
            onClick={onClick}
            className={`flex h-[36px] min-w-[36px] items-center justify-center rounded-full border px-[10px] text-[12px] font-semibold transition ${
                active
                    ? "border-[#2065D1] bg-[#2065D1] text-white"
                    : "border-[#dedede] bg-white text-[#555] hover:border-[#a9c2ef] hover:text-[#2065D1]"
            } disabled:cursor-not-allowed disabled:opacity-40`}
        >
            {children}
        </button>
    );
};

const MobileFilters = ({
    open,
    loading,
    state,
    filters,
    appliedCount,
    onClose,
    onToggleCategory,
    onToggleCollection,
    onToggleLocation,
    onPriceChange,
    onStockChange,
    onClear,
}) => {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[900] lg:hidden">
            <button
                type="button"
                aria-label="Close filters"
                onClick={onClose}
                className="absolute inset-0 bg-black/40"
            />

            <div className="absolute bottom-0 left-0 top-0 w-[88%] max-w-[360px] overflow-y-auto bg-white px-5 pb-8 shadow-[15px_0_40px_rgba(0,0,0,0.18)]">
                <div className="sticky top-0 z-10 flex h-[65px] items-center justify-between border-b border-[#e5e5e5] bg-white">
                    <h2 className="text-[17px] font-semibold text-[#222]">
                        Product filters
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-[13px] font-semibold text-[#2065D1]"
                    >
                        Done
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-[70px]">
                        <LoaderCircle
                            size={25}
                            className="animate-spin text-[#2065D1]"
                        />
                    </div>
                ) : (
                    <ProductCatalogSidebar
                        state={state}
                        filters={filters}
                        appliedCount={
                            appliedCount
                        }
                        onToggleCategory={
                            onToggleCategory
                        }
                        onToggleCollection={
                            onToggleCollection
                        }
                        onToggleLocation={
                            onToggleLocation
                        }
                        onPriceChange={
                            onPriceChange
                        }
                        onStockChange={
                            onStockChange
                        }
                        onClear={onClear}
                    />
                )}
            </div>
        </div>
    );
};

const getVisiblePages = (
    currentPage,
    lastPage
) => {
    if (lastPage <= 5) {
        return Array.from(
            {
                length: lastPage,
            },
            (_, index) =>
                index + 1
        );
    }

    let start = Math.max(
        1,
        currentPage - 2
    );

    let end = Math.min(
        lastPage,
        start + 4
    );

    if (end - start < 4) {
        start = Math.max(
            1,
            end - 4
        );
    }

    return Array.from(
        {
            length:
                end - start + 1,
        },
        (_, index) =>
            start + index
    );
};

export default ProductsPage;