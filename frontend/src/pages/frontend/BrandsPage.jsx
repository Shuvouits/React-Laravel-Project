import {
    useEffect,
    useState,
} from "react";
import {
    ArrowRight,
    ChevronRight,
    LoaderCircle,
    Tags,
} from "lucide-react";
import {
    Link,
} from "react-router-dom";

import api from "../../api/axios";

const BrandsPage = () => {
    const [brands, setBrands] =
        useState([]);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await api.get(
                    "/brands"
                );

            setBrands(
                response.data?.brands ||
                []
            );
        } catch (error) {
            console.error(
                "Brands fetch error:",
                error.response?.data ||
                    error.message
            );

            setError(
                error.response?.data
                    ?.message ||
                    "Unable to load brands."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-[70vh] bg-white">
            <section className="mx-auto w-full max-w-[1500px] px-5 pb-[80px] pt-[45px]">
                <BrandBreadcrumb />

                <div className="mt-[26px]">
                    <h1 className="text-[32px] font-bold leading-[1.15] tracking-[-0.8px] text-[#171717] sm:text-[36px]">
                        Brands
                    </h1>

                    <p className="mt-[10px] text-[16px] leading-[1.6] text-[#727272]">
                        Browse products by
                        your favorite brands.
                    </p>
                </div>

                <div className="mt-[36px] border-t border-[#e5e5e5]" />

                {loading ? (
                    <BrandsLoader />
                ) : error ? (
                    <BrandsError
                        message={error}
                        onRetry={
                            fetchBrands
                        }
                    />
                ) : brands.length > 0 ? (
                    <BrandsGrid
                        brands={brands}
                    />
                ) : (
                    <EmptyBrands />
                )}
            </section>
        </main>
    );
};

const BrandBreadcrumb = () => {
    return (
        <nav
            aria-label="Breadcrumb"
            className="flex items-center gap-[12px] text-[14px]"
        >
            <Link
                to="/"
                className="text-[#6f6f6f] transition-colors hover:text-[#2065D1]"
            >
                Home
            </Link>

            <ChevronRight
                size={15}
                strokeWidth={1.7}
                className="text-[#9a9a9a]"
            />

            <span className="font-medium text-[#171717]">
                Brands
            </span>
        </nav>
    );
};

const BrandsGrid = ({
    brands,
}) => {
    return (
        <div className="mt-[35px] grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {brands.map(
                (brand) => (
                    <BrandCard
                        key={brand.id}
                        brand={brand}
                    />
                )
            )}
        </div>
    );
};

const BrandCard = ({
    brand,
}) => {
    const productsUrl =
        `/products?brand=${encodeURIComponent(
            brand.slug
        )}`;

    return (
        <article className="group flex min-h-[355px] flex-col overflow-hidden rounded-[16px] border border-[#e4e4e4] bg-white transition-all duration-300 hover:-translate-y-[4px] hover:border-[#d6d6d6] hover:shadow-[0_18px_45px_rgba(0,0,0,0.09)]">
            <Link
                to={productsUrl}
                aria-label={`View ${brand.name} products`}
                className="relative flex h-[215px] items-center justify-center overflow-hidden bg-[#fafafa] px-[34px] py-[28px]"
            >
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-[#f5f5f5]/30" />

                <BrandLogo
                    brand={brand}
                />
            </Link>

            <div className="flex flex-1 flex-col border-t border-[#f0f0f0] px-[18px] pb-[18px] pt-[18px]">
                <Link
                    to={productsUrl}
                    className="block truncate text-[17px] font-semibold leading-[1.3] text-[#171717] transition-colors group-hover:text-[#2065D1]"
                >
                    {brand.name}
                </Link>

                <p className="mt-[7px] text-[13px] text-[#777]">
                    {formatProductCount(
                        brand.products_count
                    )}
                </p>

                <Link
                    to={productsUrl}
                    className="mt-auto inline-flex items-center gap-[7px] pt-[25px] text-[13px] font-medium text-[#2065D1] transition-all hover:gap-[10px] hover:text-[#164fa9]"
                >
                    View products

                    <ArrowRight
                        size={15}
                        strokeWidth={1.8}
                    />
                </Link>
            </div>
        </article>
    );
};

const BrandLogo = ({
    brand,
}) => {
    const [imageError, setImageError] =
        useState(false);

    if (
        brand.logo_url &&
        !imageError
    ) {
        return (
            <img
                src={brand.logo_url}
                alt={`${brand.name} logo`}
                loading="lazy"
                onError={() =>
                    setImageError(true)
                }
                className="relative z-10 max-h-[105px] max-w-[82%] object-contain transition-transform duration-300 group-hover:scale-[1.045]"
            />
        );
    }

    return (
        <div className="relative z-10 flex h-[100px] w-[100px] items-center justify-center rounded-[24px] border border-[#e7e7e7] bg-white text-[34px] font-bold uppercase text-[#2065D1] shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
            {getBrandInitials(
                brand.name
            )}
        </div>
    );
};

const BrandsLoader = () => {
    return (
        <div className="flex min-h-[350px] items-center justify-center">
            <div className="flex flex-col items-center gap-[12px]">
                <LoaderCircle
                    size={30}
                    strokeWidth={1.8}
                    className="animate-spin text-[#2065D1]"
                />

                <p className="text-[13px] text-[#777]">
                    Loading brands...
                </p>
            </div>
        </div>
    );
};

const BrandsError = ({
    message,
    onRetry,
}) => {
    return (
        <div className="mt-[35px] flex min-h-[260px] flex-col items-center justify-center rounded-[18px] border border-[#f0dddd] bg-[#fffafa] px-5 text-center">
            <p className="text-[14px] font-medium text-[#cc3434]">
                {message}
            </p>

            <button
                type="button"
                onClick={onRetry}
                className="mt-[18px] flex h-[42px] items-center justify-center rounded-full bg-[#2065D1] px-[22px] text-[13px] font-semibold text-white transition-colors hover:bg-[#1858bb]"
            >
                Try again
            </button>
        </div>
    );
};

const EmptyBrands = () => {
    return (
        <div className="mt-[35px] flex min-h-[300px] flex-col items-center justify-center rounded-[18px] border border-dashed border-[#dddddd] bg-[#fafafa] px-5 text-center">
            <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#edf4ff] text-[#2065D1]">
                <Tags
                    size={25}
                    strokeWidth={1.7}
                />
            </div>

            <h2 className="mt-[16px] text-[18px] font-semibold text-[#222]">
                No brands available
            </h2>

            <p className="mt-[7px] text-[13px] text-[#777]">
                Active brands will appear
                here.
            </p>
        </div>
    );
};

const formatProductCount = (
    count
) => {
    const total = Number(
        count || 0
    );

    return `${total} ${
        total === 1
            ? "product"
            : "products"
    }`;
};

const getBrandInitials = (
    name
) => {
    return String(name || "B")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((word) =>
            word.charAt(0)
        )
        .join("");
};

export default BrandsPage;