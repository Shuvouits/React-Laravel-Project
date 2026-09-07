import {
    Package,
    Search,
    ShoppingCart,
    Sparkles,
    X,
} from "lucide-react";
import {
    useEffect,
    useRef,
    useState,
} from "react";
import {
    Link,
    useNavigate,
} from "react-router-dom";

import api from "../../../api/axios";
import { useCart } from "../../../context/CartContext";

const MobileNavbar = () => {
    const navigate = useNavigate();
    const searchRef = useRef(null);

    const { itemCount, openCart } = useCart();

    const [logo, setLogo] = useState("");
    const [logoAlt, setLogoAlt] =
        useState("Storify");

    const [query, setQuery] = useState("");
    const [products, setProducts] = useState([]);
    const [searching, setSearching] =
        useState(false);

    const [searchOpen, setSearchOpen] =
        useState(false);

    const [searchError, setSearchError] =
        useState("");

    useEffect(() => {
        fetchLogo();
    }, []);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (
                searchRef.current &&
                !searchRef.current.contains(
                    event.target
                )
            ) {
                setSearchOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutsideClick
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutsideClick
            );
        };
    }, []);

    useEffect(() => {
        const searchText = query.trim();

        if (searchText.length < 2) {
            setProducts([]);
            setSearchError("");
            setSearching(false);
            return;
        }

        const controller =
            new AbortController();

        const timer = setTimeout(async () => {
            try {
                setSearching(true);
                setSearchError("");

                const response = await api.get(
                    "/products",
                    {
                        params: {
                            search: searchText,
                            per_page: 5,
                        },
                        signal: controller.signal,
                    }
                );

                setProducts(
                    response.data?.products || []
                );

                setSearchOpen(true);
            } catch (error) {
                if (
                    error.code === "ERR_CANCELED" ||
                    error.name === "CanceledError"
                ) {
                    return;
                }

                console.error(
                    "Mobile product search error:",
                    error.response?.data ||
                    error.message
                );

                setProducts([]);
                setSearchError(
                    "Products could not be loaded."
                );
                setSearchOpen(true);
            } finally {
                setSearching(false);
            }
        }, 350);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [query]);

    const fetchLogo = async () => {
        try {
            const response = await api.get(
                "/general-settings"
            );

            const settings =
                response.data?.settings || {};

            setLogo(
                settings.navbar_logo_url ||
                getImageUrl(
                    settings.navbar_logo
                ) ||
                ""
            );

            setLogoAlt(
                settings.navbar_logo_alt ||
                "Storify"
            );
        } catch (error) {
            console.error(
                "Mobile navbar logo error:",
                error.response?.data ||
                error.message
            );
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const searchText = query.trim();

        if (!searchText) {
            return;
        }

        setSearchOpen(false);

        navigate(
            `/products?search=${encodeURIComponent(
                searchText
            )}`
        );
    };

    const handleProductClick = (product) => {
        setSearchOpen(false);
        setQuery("");

        navigate(
            `/products/${product.slug}`
        );
    };

    const clearSearch = () => {
        setQuery("");
        setProducts([]);
        setSearchError("");
        setSearchOpen(false);
    };

    const openSalesAi = () => {
        window.dispatchEvent(
            new CustomEvent(
                "storify:sales-ai-open"
            )
        );
    };

    const displayCartCount =
        itemCount > 99
            ? "99+"
            : itemCount;

    const showResults =
        searchOpen &&
        query.trim().length >= 2;

    return (
        <header className="relative z-[1100] block w-full border-b border-[#eeeeee] bg-white font-['Inter'] shadow-[0_2px_10px_rgba(0,0,0,0.04)] lg:hidden">
            <div className="px-4 pb-[12px] pt-[11px]">
                <div className="flex h-[37px] items-center justify-between">
                    <Link
                        to="/"
                        className="flex min-w-0 items-center"
                    >
                        <MobileLogo
                            logo={logo}
                            alt={logoAlt}
                        />
                    </Link>

                    <button
                        type="button"
                        onClick={openCart}
                        aria-label={`Cart with ${itemCount} items`}
                        className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center text-[#171717]"
                    >
                        <ShoppingCart
                            size={23}
                            strokeWidth={1.8}
                        />

                        {itemCount > 0 && (
                            <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#2065D1] px-1 text-[9px] font-semibold text-white">
                                {displayCartCount}
                            </span>
                        )}
                    </button>
                </div>

                <div
                    ref={searchRef}
                    className="relative mt-[9px]"
                >
                    <form
                        onSubmit={handleSubmit}
                        className="flex h-[38px] w-full items-center rounded-full border border-[#dddddd] bg-white px-[12px] transition focus-within:border-[#2065D1] focus-within:ring-2 focus-within:ring-[#2065D1]/10"
                    >
                        <Search
                            size={16}
                            strokeWidth={1.8}
                            className="shrink-0 text-[#191919]"
                        />

                        <input
                            type="search"
                            value={query}
                            onChange={(event) => {
                                const value =
                                    event.target.value;

                                setQuery(value);

                                if (
                                    value.trim()
                                        .length >= 2
                                ) {
                                    setSearchOpen(true);
                                }
                            }}
                            onFocus={() => {
                                if (
                                    query.trim()
                                        .length >= 2
                                ) {
                                    setSearchOpen(true);
                                }
                            }}
                            placeholder="Search products..."
                            autoComplete="off"
                            className="h-full min-w-0 flex-1 border-none bg-transparent px-[10px] text-[12px] text-[#252525] outline-none placeholder:text-[#777777]"
                        />

                        {searching && (
                            <span className="mr-2 h-[15px] w-[15px] shrink-0 animate-spin rounded-full border-2 border-[#2065D1]/20 border-t-[#2065D1]" />
                        )}

                        {!searching && query && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                aria-label="Clear search"
                                className="mr-2 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full text-[#777777]"
                            >
                                <X size={15} />
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={openSalesAi}
                            aria-label="Open Sales AI"
                            className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[#6957e9] text-white"
                        >
                            <Sparkles
                                size={14}
                                strokeWidth={2}
                            />
                        </button>
                    </form>

                    {showResults && (
                        <MobileSearchResults
                            query={query}
                            products={products}
                            searching={searching}
                            error={searchError}
                            onSubmit={handleSubmit}
                            onProductClick={
                                handleProductClick
                            }
                        />
                    )}
                </div>
            </div>
        </header>
    );
};

const MobileLogo = ({
    logo,
    alt,
}) => {
    if (logo) {
        return (
            <img
                src={logo}
                alt={alt}
                className="h-[31px] w-auto max-w-[135px] object-contain"
            />
        );
    }

    return (
        <div className="flex items-center gap-[7px]">
            <span className="flex h-[30px] w-[28px] items-center justify-center rounded-[7px] bg-gradient-to-br from-[#27b4f5] via-[#6378f7] to-[#b54df5] text-[15px] font-bold text-white">
                S
            </span>

            <span className="text-[19px] font-bold tracking-[-0.5px] text-[#3478ea]">
                Storify
            </span>
        </div>
    );
};

const MobileSearchResults = ({
    query,
    products,
    searching,
    error,
    onSubmit,
    onProductClick,
}) => {
    return (
        <div className="absolute left-0 right-0 top-[45px] z-[1400] overflow-hidden rounded-[18px] border border-[#e3e3e3] bg-white shadow-[0_15px_35px_rgba(0,0,0,0.18)]">
            <div className="max-h-[330px] overflow-y-auto p-2">
                {searching &&
                    products.length === 0 && (
                        <MobileSearchSkeleton />
                    )}

                {!searching && error && (
                    <div className="px-4 py-7 text-center text-[12px] text-red-500">
                        {error}
                    </div>
                )}

                {!searching &&
                    !error &&
                    products.length === 0 && (
                        <div className="px-4 py-7 text-center">
                            <p className="text-[13px] font-semibold text-[#333333]">
                                No products found
                            </p>

                            <p className="mt-1 text-[11px] text-[#888888]">
                                Try another search term.
                            </p>
                        </div>
                    )}

                {products.map((product) => (
                    <button
                        key={product.id}
                        type="button"
                        onClick={() =>
                            onProductClick(
                                product
                            )
                        }
                        className="flex min-h-[62px] w-full items-center gap-3 rounded-[12px] px-2 py-2 text-left transition active:bg-[#f4f6fb]"
                    >
                        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-[#f3f3f3]">
                            {product.image_url ? (
                                <img
                                    src={
                                        product.image_url
                                    }
                                    alt={
                                        product.title
                                    }
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <Package
                                    size={20}
                                    className="text-[#aaaaaa]"
                                />
                            )}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] font-semibold text-[#242424]">
                                {product.title}
                            </p>

                            <p className="mt-1 truncate text-[10px] text-[#888888]">
                                {[
                                    product.brand
                                        ?.name,
                                    product.category
                                        ?.name,
                                ]
                                    .filter(Boolean)
                                    .join(" · ") ||
                                    "Store product"}
                            </p>
                        </div>

                        <p className="shrink-0 text-[12px] font-semibold text-[#00a86b]">
                            $
                            {Number(
                                product.price || 0
                            ).toFixed(2)}
                        </p>
                    </button>
                ))}
            </div>

            {!searching &&
                !error &&
                products.length > 0 && (
                    <button
                        type="button"
                        onClick={onSubmit}
                        className="min-h-[40px] w-full border-t border-[#eeeeee] px-4 text-left text-[11px] text-[#555555]"
                    >
                        View all results for{" "}
                        <strong>
                            "{query.trim()}"
                        </strong>
                    </button>
                )}
        </div>
    );
};

const MobileSearchSkeleton = () => {
    return (
        <div className="space-y-2 p-1">
            {[1, 2, 3].map((item) => (
                <div
                    key={item}
                    className="flex animate-pulse items-center gap-3 px-2 py-2"
                >
                    <div className="h-[46px] w-[46px] rounded-[10px] bg-gray-200" />

                    <div className="flex-1">
                        <div className="h-[11px] w-2/3 rounded bg-gray-200" />
                        <div className="mt-2 h-[9px] w-1/3 rounded bg-gray-100" />
                    </div>
                </div>
            ))}
        </div>
    );
};

const getImageUrl = (path) => {
    if (!path) {
        return "";
    }

    if (
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {
        return path;
    }

    const apiBase =
        api.defaults.baseURL || "";

    const backendBase = apiBase.replace(
        /\/api\/?$/,
        ""
    );

    return `${backendBase}/${path.replace(
        /^\/+/,
        ""
    )}`;
};

export default MobileNavbar;