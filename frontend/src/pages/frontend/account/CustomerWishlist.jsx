import { useEffect, useState } from "react";
import { Heart, LoaderCircle } from "lucide-react";

import api from "../../../api/axios";
import CustomerSidebar from "../../../components/frontend/account/CustomerSidebar";
import ProductCard from "../../../components/frontend/products/ProductCard";
import ProductQuickViewModal from "../../../components/frontend/products/ProductQuickViewModal";

const CustomerWishlist = () => {
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [removingId, setRemovingId] = useState(null);
    const [quickViewProduct, setQuickViewProduct] = useState(null);

    // Fetch wishlist
    const fetchWishlist = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/account/wishlist");

            setWishlist(
                response.data?.wishlists || []
            );
        } catch (error) {
            console.error(
                "Wishlist error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to load wishlist."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();
    }, []);

    // Remove from wishlist
    const removeFromWishlist = async (product) => {
        if (!product?.id || removingId) {
            return;
        }

        try {
            setRemovingId(product.id);
            setError("");

            const response = await api.delete(
                `/account/wishlist/${product.id}`
            );

            setWishlist((current) => {
                return current.filter((item) => {
                    return item.product_id !== product.id;
                });
            });

            window.dispatchEvent(
                new CustomEvent("wishlist-updated", {
                    detail: {
                        count: response.data?.wishlist_count || 0,
                    },
                })
            );
        } catch (error) {
            console.error(
                "Wishlist remove error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to remove product from wishlist."
            );
        } finally {
            setRemovingId(null);
        }
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
        return <WishlistLoader />;
    }

    return (
        <>
            <main className="min-h-screen bg-white">

                <div className="mx-auto flex w-full max-w-[1280px] gap-[30px] px-5 py-[22px]">

                    <CustomerSidebar />

                    <div className="min-w-0 flex-1">

                        {/* Header */}
                        <div className="mb-[30px]">
                            <h1 className="text-[27px] font-bold leading-[1.2] tracking-[-0.6px] text-[#171717]">
                                Wishlist
                            </h1>

                            <p className="mt-[6px] text-[13px] text-[#777]">
                                Your saved products in one place.
                            </p>
                        </div>

                        {/* Error */}
                        {error && (
                            <div className="mb-[22px] rounded-[8px] border border-red-200 bg-red-50 px-[14px] py-[11px] text-[13px] text-red-600">
                                {error}
                            </div>
                        )}

                        {/* Products */}
                        {wishlist.length > 0 ? (
                            <div className="grid grid-cols-1 gap-x-[22px] gap-y-[38px] sm:grid-cols-2 lg:grid-cols-3">

                                {wishlist.map((item) => (
                                    <ProductCard
                                        key={item.id}
                                        product={item.product}
                                        isWishlisted={true}
                                        wishlistLoading={
                                            removingId === item.product_id
                                        }
                                        onWishlistToggle={removeFromWishlist}
                                        onQuickView={openQuickView}
                                        onChooseOptions={openQuickView}
                                    />
                                ))}

                            </div>
                        ) : (
                            <EmptyWishlist />
                        )}

                    </div>

                </div>

            </main>

            <ProductQuickViewModal
                open={Boolean(quickViewProduct)}
                product={quickViewProduct}
                onClose={closeQuickView}
            />
        </>
    );
};

// Loading
const WishlistLoader = () => {
    return (
        <main className="min-h-screen bg-white">

            <div className="flex min-h-[450px] items-center justify-center">

                <LoaderCircle
                    size={28}
                    className="animate-spin text-[#2065D1]"
                />

            </div>

        </main>
    );
};

// Empty wishlist
const EmptyWishlist = () => {
    return (
        <div className="flex min-h-[380px] items-center justify-center rounded-[12px] border border-[#eeeeee] bg-[#fafafa]">

            <div className="text-center">

                <div className="mx-auto flex h-[60px] w-[60px] items-center justify-center rounded-full bg-white shadow-sm">
                    <Heart
                        size={26}
                        strokeWidth={1.7}
                        className="text-[#777]"
                    />
                </div>

                <h2 className="mt-[16px] text-[17px] font-semibold text-[#171717]">
                    Your wishlist is empty
                </h2>

                <p className="mt-[6px] text-[13px] text-[#777]">
                    Products you save will appear here.
                </p>

            </div>

        </div>
    );
};

export default CustomerWishlist;