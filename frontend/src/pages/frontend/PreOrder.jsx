import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Box,
    CalendarClock,
    ChevronRight,
    Clock3,
    CreditCard,
    LoaderCircle,
    MapPin,
    PackageCheck,
    Sparkles,
    TrendingUp,
} from "lucide-react";

import api from "../../api/axios";

const PreOrder = () => {
    const [products, setProducts] = useState([]);
    const [sort, setSort] = useState("ships_soonest");
    const [loading, setLoading] = useState(true);
    const [loadMoreLoading, setLoadMoreLoading] = useState(false);
    const [error, setError] = useState("");

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });

    useEffect(() => {
        fetchProducts(1, false);
    }, [sort]);

    const fetchProducts = async (page = 1, append = false) => {
        try {
            if (append) {
                setLoadMoreLoading(true);
            } else {
                setLoading(true);
            }

            setError("");

            const response = await api.get("/pre-orders", {
                params: {
                    sort,
                    page,
                    per_page: 12,
                },
            });

            const newProducts =
                response.data?.products || [];

            if (append) {
                setProducts((currentProducts) => [
                    ...currentProducts,
                    ...newProducts,
                ]);
            } else {
                setProducts(newProducts);
            }

            setPagination(
                response.data?.pagination || {
                    current_page: 1,
                    last_page: 1,
                    total: newProducts.length,
                }
            );
        } catch (error) {
            console.error(
                "Pre-order products error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to load pre-order products."
            );
        } finally {
            setLoading(false);
            setLoadMoreLoading(false);
        }
    };

    const handleSortChange = (value) => {
        if (value === sort) {
            return;
        }

        setSort(value);
    };

    const handleLoadMore = () => {
        if (
            loadMoreLoading ||
            pagination.current_page >= pagination.last_page
        ) {
            return;
        }

        fetchProducts(
            pagination.current_page + 1,
            true
        );
    };

    return (
        <main className="min-h-screen bg-white font-['Inter']">

            <div className="mx-auto max-w-[1330px] px-5 pb-[70px] pt-[32px]">

                <Breadcrumb />

                <PreOrderHero />

                <div className="mt-[30px]">

                    <div className="flex items-center gap-[7px] text-[14px] font-medium text-[#171717]">
                        <MapPin
                            size={16}
                            className="text-[#2065D1]"
                        />

                        Dhaka
                    </div>

                    <div className="mt-[18px] flex flex-wrap items-center justify-between gap-[15px] border-b border-[#dedede] pb-[22px]">

                        <div className="flex flex-wrap items-center gap-[10px]">

                            <SortButton
                                label="Ships soonest"
                                active={sort === "ships_soonest"}
                                onClick={() => {
                                    handleSortChange("ships_soonest");
                                }}
                            />

                            <SortButton
                                label="Most reserved"
                                active={sort === "most_reserved"}
                                onClick={() => {
                                    handleSortChange("most_reserved");
                                }}
                            />

                            <SortButton
                                label="Newest drops"
                                active={sort === "newest"}
                                onClick={() => {
                                    handleSortChange("newest");
                                }}
                            />

                        </div>

                        <Link
                            to="/account/orders"
                            className="rounded-full border border-[#cfe0ff] bg-[#f7faff] px-[16px] py-[9px] text-[13px] font-medium text-[#2065D1] transition hover:bg-[#eef5ff]"
                        >
                            Track my pre-orders
                        </Link>

                    </div>

                </div>

                {loading && (
                    <div className="flex min-h-[420px] items-center justify-center">

                        <LoaderCircle
                            size={32}
                            className="animate-spin text-[#2065D1]"
                        />

                    </div>
                )}

                {!loading && error && (
                    <div className="flex min-h-[350px] items-center justify-center">

                        <div className="text-center">

                            <p className="text-[14px] text-red-500">
                                {error}
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    fetchProducts(1, false);
                                }}
                                className="mt-[16px] rounded-[9px] bg-[#2065D1] px-[18px] py-[10px] text-[13px] font-semibold text-white"
                            >
                                Try Again
                            </button>

                        </div>

                    </div>
                )}

                {!loading && !error && products.length === 0 && (
                    <div className="flex min-h-[350px] items-center justify-center">

                        <div className="text-center">

                            <PackageCheck
                                size={38}
                                className="mx-auto text-[#aaa]"
                            />

                            <h2 className="mt-[14px] text-[18px] font-semibold text-[#171717]">
                                No pre-order drops yet
                            </h2>

                            <p className="mt-[6px] text-[14px] text-[#777]">
                                New pre-order products will appear here.
                            </p>

                        </div>

                    </div>
                )}

                {!loading && !error && products.length > 0 && (
                    <>
                        <div className="mt-[30px] grid grid-cols-1 gap-[22px] sm:grid-cols-2 xl:grid-cols-3">

                            {products.map((product) => (
                                <PreOrderCard
                                    key={product.id}
                                    product={product}
                                />
                            ))}

                        </div>

                        {pagination.current_page < pagination.last_page && (
                            <div className="mt-[35px] flex justify-center">

                                <button
                                    type="button"
                                    onClick={handleLoadMore}
                                    disabled={loadMoreLoading}
                                    className="flex h-[44px] items-center gap-[8px] rounded-full border border-[#dedede] bg-white px-[22px] text-[14px] font-semibold text-[#222] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {loadMoreLoading && (
                                        <LoaderCircle
                                            size={17}
                                            className="animate-spin"
                                        />
                                    )}

                                    {loadMoreLoading
                                        ? "Loading..."
                                        : "Load more"}
                                </button>

                            </div>
                        )}
                    </>
                )}

            </div>

        </main>
    );
};

const Breadcrumb = () => {
    return (
        <div className="flex items-center gap-[9px] text-[14px] text-[#777]">

            <Link
                to="/"
                className="transition hover:text-[#2065D1]"
            >
                Home
            </Link>

            <ChevronRight
                size={14}
                strokeWidth={1.7}
            />

            <span className="font-medium text-[#171717]">
                Pre-order
            </span>

        </div>
    );
};

const PreOrderHero = () => {
    return (
        <section className="mt-[22px] rounded-[12px] border border-[#dbe6f8] bg-white px-[38px] py-[27px] shadow-[0_1px_2px_rgba(0,0,0,0.04)]">

            <div className="grid grid-cols-1 gap-[35px] lg:grid-cols-[minmax(0,1fr)_450px]">

                <div>

                    <span className="inline-flex items-center gap-[6px] rounded-full border border-[#cfe0ff] bg-[#f5f9ff] px-[11px] py-[5px] text-[12px] font-medium text-[#2065D1]">
                        <Sparkles size={13} />
                        Storify early access
                    </span>

                    <h1 className="mt-[18px] text-[36px] font-semibold leading-[1.15] text-[#111]">
                        Pre-order Drops
                    </h1>

                    <p className="mt-[12px] max-w-[650px] text-[16px] leading-[24px] text-[#666]">
                        Reserve upcoming products early, see the expected ship window, and track every pre-order from your account.
                    </p>

                    <div className="mt-[20px] flex flex-wrap gap-[8px]">

                        <span className="rounded-full border border-[#d7e5ff] bg-[#f4f8ff] px-[12px] py-[6px] text-[12px] font-medium text-[#2065D1]">
                            Release windows visible
                        </span>

                        <span className="rounded-full border border-[#e4dcff] bg-[#f8f5ff] px-[12px] py-[6px] text-[12px] font-medium text-[#6b35d6]">
                            Deposit-aware checkout
                        </span>

                        <span className="rounded-full border border-[#f6dfaa] bg-[#fff9eb] px-[12px] py-[6px] text-[12px] font-medium text-[#b66700]">
                            Account tracking
                        </span>

                    </div>

                </div>

                <div className="space-y-[10px]">

                    <HeroFeature
                        icon={CalendarClock}
                        title="Transparent ship dates"
                        text="Included"
                        iconClass="bg-[#edf5ff] text-[#2065D1]"
                    />

                    <HeroFeature
                        icon={CreditCard}
                        title="Deposit and pay-later terms"
                        text="Shown upfront"
                        iconClass="bg-[#f6f0ff] text-[#7838df]"
                    />

                    <HeroFeature
                        icon={Box}
                        title="Account tracking"
                        text="After checkout"
                        iconClass="bg-[#fff6df] text-[#d47a00]"
                    />

                </div>

            </div>

        </section>
    );
};

const HeroFeature = ({
    icon: Icon,
    title,
    text,
    iconClass,
}) => {
    return (
        <div className="flex items-center gap-[13px] rounded-[9px] border border-[#dedede] px-[13px] py-[11px]">

            <div className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full ${iconClass}`}>
                <Icon
                    size={18}
                    strokeWidth={1.8}
                />
            </div>

            <div>

                <p className="text-[14px] font-medium text-[#171717]">
                    {title}
                </p>

                <p className="mt-[2px] text-[12px] text-[#777]">
                    {text}
                </p>

            </div>

        </div>
    );
};

const SortButton = ({
    label,
    active,
    onClick,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={
                active
                    ? "rounded-full bg-[#2065D1] px-[17px] py-[9px] text-[13px] font-semibold text-white shadow-sm"
                    : "rounded-full border border-[#dedede] bg-white px-[17px] py-[9px] text-[13px] font-semibold text-[#222] transition hover:bg-[#f7f7f7]"
            }
        >
            {label}
        </button>
    );
};

const PreOrderCard = ({
    product,
}) => {
    const preorder =
        product.preorder || {};

    const status =
        preorder.status || "open";

    const disabled =
        status === "sold_out" ||
        status === "closed";

    return (
        <article className="overflow-hidden rounded-[14px] border border-[#dedede] bg-white transition hover:border-[#c8c8c8] hover:shadow-[0_8px_25px_rgba(0,0,0,0.06)]">

            <Link
                to={`/products/${product.slug}`}
                className="relative block h-[300px] overflow-hidden bg-[#f5f6f8]"
            >

                <span className="absolute left-[12px] top-[12px] z-10 rounded-full bg-[#1764e8] px-[11px] py-[5px] text-[11px] font-semibold text-white">
                    {preorder.badge_text || "Pre-order"}
                </span>

                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.title}
                        className="h-full w-full object-contain p-[22px] transition duration-300 hover:scale-[1.03]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">

                        <Box
                            size={55}
                            strokeWidth={1.3}
                            className="text-[#aaa]"
                        />

                    </div>
                )}

            </Link>

            <div className="p-[18px]">

                <div className="flex items-start justify-between gap-[15px]">

                    <div className="min-w-0">

                        {product.brand?.name && (
                            <p className="mb-[4px] text-[11px] font-medium uppercase tracking-[0.4px] text-[#888]">
                                {product.brand.name}
                            </p>
                        )}

                        <Link
                            to={`/products/${product.slug}`}
                            className="block"
                        >
                            <h2 className="line-clamp-2 text-[17px] font-semibold leading-[23px] text-[#171717] transition hover:text-[#2065D1]">
                                {product.title}
                            </h2>
                        </Link>

                    </div>

                    {Number(preorder.reserved_quantity || 0) > 0 && (
                        <div className="flex shrink-0 items-center gap-[4px] text-[11px] text-[#777]">

                            <TrendingUp
                                size={13}
                                className="text-[#2065D1]"
                            />

                            {preorder.reserved_quantity} reserved

                        </div>
                    )}

                </div>

                <div className="mt-[13px]">

                    <ProductPrice
                        product={product}
                    />

                </div>

                <div className="mt-[17px] space-y-[10px] border-t border-[#eeeeee] pt-[14px]">

                    <div className="flex items-center gap-[8px]">

                        <CalendarClock
                            size={15}
                            className="shrink-0 text-[#2065D1]"
                        />

                        <div>

                            <p className="text-[11px] text-[#888]">
                                Expected to ship
                            </p>

                            <p className="mt-[1px] text-[13px] font-medium text-[#333]">
                                {formatShipWindow(
                                    preorder.expected_ship_from,
                                    preorder.expected_ship_to
                                )}
                            </p>

                        </div>

                    </div>

                    <PaymentTerms
                        product={product}
                    />

                    {preorder.show_remaining_quantity &&
                        preorder.remaining_quantity !== null &&
                        preorder.remaining_quantity !== undefined && (
                            <div className="flex items-center gap-[8px]">

                                <PackageCheck
                                    size={15}
                                    className="text-[#777]"
                                />

                                <p className="text-[12px] text-[#666]">
                                    {preorder.remaining_quantity} remaining
                                </p>

                            </div>
                        )}

                </div>

                <Link
                    to={`/products/${product.slug}`}
                    className={
                        disabled
                            ? "mt-[18px] flex h-[42px] w-full cursor-not-allowed items-center justify-center rounded-[9px] bg-[#eeeeee] text-[13px] font-semibold text-[#999]"
                            : "mt-[18px] flex h-[42px] w-full items-center justify-center rounded-[9px] bg-[#2065D1] text-[13px] font-semibold text-white transition hover:bg-[#1957b8]"
                    }
                    onClick={(event) => {
                        if (disabled) {
                            event.preventDefault();
                        }
                    }}
                >
                    {getButtonLabel(status)}
                </Link>

            </div>

        </article>
    );
};

const ProductPrice = ({
    product,
}) => {
    const minimum =
        Number(product.price_min || 0);

    const maximum =
        Number(product.price_max || 0);

    if (
        product.has_variants &&
        minimum !== maximum
    ) {
        return (
            <p className="text-[17px] font-semibold text-[#171717]">
                {formatMoney(minimum)} - {formatMoney(maximum)}
            </p>
        );
    }

    const price =
        product.has_variants
            ? minimum
            : Number(product.price || minimum);

    return (
        <div className="flex items-center gap-[8px]">

            <span className="text-[17px] font-semibold text-[#171717]">
                {formatMoney(price)}
            </span>

            {product.compare_at_price &&
                Number(product.compare_at_price) > price && (
                    <span className="text-[13px] text-[#999] line-through">
                        {formatMoney(product.compare_at_price)}
                    </span>
                )}

        </div>
    );
};

const PaymentTerms = ({
    product,
}) => {
    const preorder =
        product.preorder || {};

    if (preorder.payment_type === "deposit") {
        return (
            <div className="flex items-center gap-[8px]">

                <CreditCard
                    size={15}
                    className="shrink-0 text-[#7838df]"
                />

                <p className="text-[12px] text-[#666]">

                    {preorder.deposit_amount_from !== null &&
                    preorder.deposit_amount_from !== undefined
                        ? `${formatMoney(preorder.deposit_amount_from)} deposit`
                        : "Deposit required"}

                    {preorder.allow_full_payment
                        ? " or pay in full"
                        : ""}

                </p>

            </div>
        );
    }

    if (preorder.payment_type === "pay_later") {
        return (
            <div className="flex items-center gap-[8px]">

                <Clock3
                    size={15}
                    className="shrink-0 text-[#b66700]"
                />

                <p className="text-[12px] text-[#666]">
                    Reserve now, pay later
                </p>

            </div>
        );
    }

    return (
        <div className="flex items-center gap-[8px]">

            <CreditCard
                size={15}
                className="shrink-0 text-[#777]"
            />

            <p className="text-[12px] text-[#666]">
                Full payment at checkout
            </p>

        </div>
    );
};

const getButtonLabel = (status) => {
    if (status === "upcoming") {
        return "Coming soon";
    }

    if (status === "sold_out") {
        return "Fully reserved";
    }

    if (status === "closed") {
        return "Pre-order closed";
    }

    return "View pre-order";
};

const formatShipWindow = (
    from,
    to
) => {
    if (!from && !to) {
        return "Shipping date coming soon";
    }

    if (from && !to) {
        return formatShortDate(from);
    }

    if (!from && to) {
        return `By ${formatShortDate(to)}`;
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const sameMonth =
        fromDate.getFullYear() === toDate.getFullYear() &&
        fromDate.getMonth() === toDate.getMonth();

    if (sameMonth) {
        return `${fromDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        })} - ${toDate.toLocaleDateString("en-US", {
            day: "numeric",
            year: "numeric",
        })}`;
    }

    return `${formatShortDate(from)} - ${formatShortDate(to)}`;
};

const formatShortDate = (value) => {
    if (!value) {
        return "-";
    }

    return new Date(value)
        .toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric",
            }
        );
};

const formatMoney = (value) => {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
        }
    ).format(
        Number(value || 0)
    );
};

export default PreOrder;