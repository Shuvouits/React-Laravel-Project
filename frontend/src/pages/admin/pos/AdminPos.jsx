import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import { LoaderCircle } from "lucide-react";

import api from "../../../api/axios";

import PosHeader from "../../../components/admin/pos/PosHeader";
import PosBranchSwitcher from "../../../components/admin/pos/PosBranchSwitcher";
import PosProductSection from "../../../components/admin/pos/PosProductSection";
import PosCart from "../../../components/admin/pos/PosCart";
import PosVariantModal from "../../../components/admin/pos/PosVariantModal";
import PosCustomerModal from "../../../components/admin/pos/PosCustomerModal";

import PosPaymentModal from "../../../components/admin/pos/PosPaymentModal";
import PosDiscountModal from "../../../components/admin/pos/PosDiscountModal";


// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

const formatMoney = (amount) => {
    const value = Number(amount || 0);

    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

// Professional POS add-to-cart sound
const playAddToCartSound = () => {
    try {
        const AudioContext =
            window.AudioContext ||
            window.webkitAudioContext;

        if (!AudioContext) {
            return;
        }

        const audioContext = new AudioContext();

        const masterGain =
            audioContext.createGain();

        masterGain.gain.setValueAtTime(
            0.0001,
            audioContext.currentTime
        );

        masterGain.gain.exponentialRampToValueAtTime(
            0.08,
            audioContext.currentTime + 0.01
        );

        masterGain.gain.exponentialRampToValueAtTime(
            0.0001,
            audioContext.currentTime + 0.16
        );

        masterGain.connect(
            audioContext.destination
        );

        const oscillator =
            audioContext.createOscillator();

        oscillator.type = "sine";

        oscillator.frequency.setValueAtTime(
            880,
            audioContext.currentTime
        );

        oscillator.frequency.exponentialRampToValueAtTime(
            1320,
            audioContext.currentTime + 0.08
        );

        oscillator.connect(masterGain);

        oscillator.start();

        oscillator.stop(
            audioContext.currentTime + 0.17
        );

        oscillator.onended = () => {
            audioContext.close();
        };
    } catch (error) {
        console.warn(
            "POS sound could not play:",
            error
        );
    }
};

// -----------------------------------------------------------------------------
// MAIN PAGE
// -----------------------------------------------------------------------------

const AdminPos = () => {

    const [showCustomerModal, setShowCustomerModal] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    const [showDiscountModal, setShowDiscountModal] = useState(false);

    const [discount, setDiscount] = useState({
        type: null,
        value: 0,
        reason: "",
        note: "",
    });


    const [heldOrders, setHeldOrders] = useState([]);

    const [locations, setLocations] = useState([]);

    const [selectedLocationId, setSelectedLocationId] =
        useState("");

    const [categories, setCategories] = useState([]);

    const [selectedCategoryId, setSelectedCategoryId] =
        useState("");

    const [products, setProducts] = useState([]);

    const [search, setSearch] = useState("");

    const [cart, setCart] = useState([]);

    const [selectedVariantProduct, setSelectedVariantProduct] =
        useState(null);

    const [context, setContext] = useState(null);

    const [loading, setLoading] = useState(true);

    const [productsLoading, setProductsLoading] =
        useState(false);

    const [error, setError] = useState("");

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
    });



    const handleHoldOrder = (label) => {
        if (cart.length === 0) {
            return;
        }

        const held = {
            id: Date.now(),
            label: label?.trim() || `Order ${heldOrders.length + 1}`,
            items: cart.map((item) => ({
                ...item,
            })),
            totals: {
                ...cartTotals,
            },
            customer: selectedCustomer
                ? {
                    ...selectedCustomer,
                }
                : null,
            locationId: selectedLocationId,
            createdAt: new Date().toISOString(),
        };

        setHeldOrders((currentOrders) => [
            ...currentOrders,
            held,
        ]);

        // Clear current sale
        setCart([]);

        // Clear customer from current sale
        setSelectedCustomer(null);

        // Close payment modal if somehow open
        setShowPaymentModal(false);
    };


    const handleResumeOrder = (heldOrderId) => {
        if (!heldOrderId) {
            return;
        }

        const heldOrder = heldOrders.find(
            (order) => order.id === heldOrderId
        );

        if (!heldOrder) {
            return;
        }

        // Restore cart
        setCart(
            Array.isArray(heldOrder.items)
                ? heldOrder.items.map((item) => ({
                    ...item,
                }))
                : []
        );

        // Restore customer
        setSelectedCustomer(
            heldOrder.customer
                ? {
                    ...heldOrder.customer,
                }
                : null
        );

        // Restore location if needed
        if (heldOrder.locationId) {
            setSelectedLocationId(
                String(heldOrder.locationId)
            );
        }

        // Remove resumed order from held orders
        setHeldOrders((currentOrders) =>
            currentOrders.filter(
                (order) => order.id !== heldOrderId
            )
        );
    };

    // -------------------------------------------------------------------------
    // FETCH POS CONTEXT
    // -------------------------------------------------------------------------

    const fetchContext = useCallback(
        async (locationId = null) => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(
                    "/admin/pos/context",
                    {
                        params: locationId
                            ? {
                                location_id:
                                    locationId,
                            }
                            : {},
                    }
                );

                const data = response.data || {};

                setContext(
                    data.context || null
                );

                const locationList =
                    Array.isArray(data.locations)
                        ? data.locations
                        : [];

                setLocations(locationList);

                if (locationId) {
                    setSelectedLocationId(
                        String(locationId)
                    );
                } else if (
                    data.context?.location_id
                ) {
                    setSelectedLocationId(
                        String(
                            data.context.location_id
                        )
                    );
                } else if (
                    locationList.length > 0
                ) {
                    setSelectedLocationId(
                        String(locationList[0].id)
                    );
                }
            } catch (error) {
                console.error(
                    "Admin POS context error:",
                    error.response?.data ||
                    error.message
                );

                setError(
                    error.response?.data?.message ||
                    "Unable to load POS context."
                );
            } finally {
                setLoading(false);
            }
        },
        []
    );

    // -------------------------------------------------------------------------
    // FETCH CATEGORIES
    // -------------------------------------------------------------------------

    const fetchCategories = useCallback(
        async (locationId) => {
            if (!locationId) {
                setCategories([]);
                return;
            }

            try {
                const response = await api.get(
                    "/admin/pos/categories",
                    {
                        params: {
                            location_id: locationId,
                        },
                    }
                );

                setCategories(
                    Array.isArray(
                        response.data?.categories
                    )
                        ? response.data.categories
                        : []
                );
            } catch (error) {
                console.error(
                    "Admin POS categories error:",
                    error.response?.data ||
                    error.message
                );

                setCategories([]);
            }
        },
        []
    );

    // -------------------------------------------------------------------------
    // FETCH PRODUCTS
    // -------------------------------------------------------------------------

    const fetchProducts = useCallback(
        async ({
            locationId,
            searchValue = "",
            categoryId = "",
            page = 1,
        }) => {
            if (!locationId) {
                setProducts([]);
                return;
            }

            try {
                setProductsLoading(true);
                setError("");

                const response = await api.get(
                    "/admin/pos/products",
                    {
                        params: {
                            location_id:
                                locationId,

                            search:
                                searchValue.trim() ||
                                undefined,

                            category_id:
                                categoryId ||
                                undefined,

                            stock: "all",

                            page,

                            per_page: 24,
                        },
                    }
                );

                const data = response.data || {};

                setProducts(
                    Array.isArray(data.products)
                        ? data.products
                        : []
                );

                setPagination(
                    data.pagination || {
                        current_page: 1,
                        last_page: 1,
                        total: 0,
                    }
                );
            } catch (error) {
                console.error(
                    "Admin POS products error:",
                    error.response?.data ||
                    error.message
                );

                setProducts([]);

                setError(
                    error.response?.data?.message ||
                    "Unable to load POS products."
                );
            } finally {
                setProductsLoading(false);
            }
        },
        []
    );

    // -------------------------------------------------------------------------
    // ADD NORMAL PRODUCT TO CART
    // -------------------------------------------------------------------------

    const addProductToCart = (product) => {
        if (!product) {
            return;
        }

        if (
            !product.in_stock &&
            !product.continue_selling_when_out_of_stock
        ) {
            return;
        }

        const cartKey = `product-${product.id}`;

        setCart((currentCart) => {
            const existing = currentCart.find(
                (item) =>
                    item.cartKey === cartKey
            );

            if (existing) {
                const maxQuantity =
                    product.continue_selling_when_out_of_stock
                        ? existing.quantity + 1
                        : Math.min(
                            existing.quantity + 1,
                            product.available_quantity
                        );

                return currentCart.map((item) =>
                    item.cartKey === cartKey
                        ? {
                            ...item,
                            quantity:
                                maxQuantity,
                        }
                        : item
                );
            }

            return [
                ...currentCart,
                {
                    cartKey,

                    product_id: product.id,

                    variant_id: null,

                    title: product.title,

                    variant_title: null,

                    sku: product.sku,

                    barcode: product.barcode,

                    image_url:
                        product.image_url,

                    unit_price: Number(
                        product.price || 0
                    ),

                    quantity: 1,

                    available_quantity:
                        product.available_quantity,

                    continue_selling_when_out_of_stock:
                        product.continue_selling_when_out_of_stock,
                },
            ];
        });

        // Professional POS sound
        playAddToCartSound();
    };

    // -------------------------------------------------------------------------
    // PRODUCT CLICK
    // -----------------------------------------------------------------------------

    const handleAddProduct = (product) => {
        if (!product) {
            return;
        }

        // Has variants → open variant modal
        if (product.has_variants) {
            setSelectedVariantProduct(
                product
            );

            return;
        }

        // No variants → directly add
        addProductToCart(product);
    };

    // -------------------------------------------------------------------------
    // ADD VARIANT TO CART
    // -----------------------------------------------------------------------------

    const addVariantToCart = (
        product,
        variant
    ) => {
        if (!product || !variant) {
            return;
        }

        if (
            !variant.in_stock &&
            !product.continue_selling_when_out_of_stock
        ) {
            return;
        }

        const cartKey =
            `variant-${variant.id}`;

        setCart((currentCart) => {
            const existing =
                currentCart.find(
                    (item) =>
                        item.cartKey ===
                        cartKey
                );

            if (existing) {
                const maxQuantity =
                    product.continue_selling_when_out_of_stock
                        ? existing.quantity + 1
                        : Math.min(
                            existing.quantity + 1,
                            variant.available_quantity
                        );

                return currentCart.map(
                    (item) =>
                        item.cartKey ===
                            cartKey
                            ? {
                                ...item,
                                quantity:
                                    maxQuantity,
                            }
                            : item
                );
            }

            return [
                ...currentCart,
                {
                    cartKey,

                    product_id:
                        product.id,

                    variant_id:
                        variant.id,

                    title:
                        product.title,

                    variant_title:
                        variant.title,

                    sku:
                        variant.sku ||
                        product.sku,

                    barcode:
                        variant.barcode ||
                        product.barcode,

                    image_url:
                        variant.image_url ||
                        product.image_url,

                    unit_price: Number(
                        variant.price ||
                        product.price ||
                        0
                    ),

                    quantity: 1,

                    available_quantity:
                        variant.available_quantity,

                    continue_selling_when_out_of_stock:
                        product.continue_selling_when_out_of_stock,
                },
            ];
        });

        // Close modal
        setSelectedVariantProduct(
            null
        );

        // Professional POS sound
        playAddToCartSound();
    };



    const handleIncrease = (item) => {
        setCart((prevCart) =>
            prevCart.map((cartItem) =>
                cartItem.cartKey === item.cartKey
                    ? {
                        ...cartItem,
                        quantity: Number(cartItem.quantity || 1) + 1,
                    }
                    : cartItem
            )
        );
    };

    const handleDecrease = (item) => {
        setCart((prevCart) =>
            prevCart
                .map((cartItem) =>
                    cartItem.cartKey === item.cartKey
                        ? {
                            ...cartItem,
                            quantity: Math.max(
                                Number(cartItem.quantity || 1) - 1,
                                1
                            ),
                        }
                        : cartItem
                )
        );
    };

    const handleRemove = (item) => {
        setCart((prevCart) =>
            prevCart.filter(
                (cartItem) => cartItem.cartKey !== item.cartKey
            )
        );
    };



    // -------------------------------------------------------------------------
    // INITIAL LOAD
    // -------------------------------------------------------------------------

    useEffect(() => {
        fetchContext();
    }, [fetchContext]);

    // -------------------------------------------------------------------------
    // LOCATION CHANGE
    // -------------------------------------------------------------------------

    useEffect(() => {
        if (!selectedLocationId) {
            return;
        }

        setSelectedCategoryId("");

        fetchCategories(
            selectedLocationId
        );

        fetchProducts({
            locationId:
                selectedLocationId,

            searchValue: search,

            categoryId: "",

            page: 1,
        });
    }, [
        selectedLocationId,
        fetchCategories,
        fetchProducts,
    ]);

    // -------------------------------------------------------------------------
    // SEARCH
    // -------------------------------------------------------------------------

    useEffect(() => {
        if (!selectedLocationId) {
            return;
        }

        const timer = setTimeout(() => {
            fetchProducts({
                locationId:
                    selectedLocationId,

                searchValue: search,

                categoryId:
                    selectedCategoryId,

                page: 1,
            });
        }, 350);

        return () =>
            clearTimeout(timer);
    }, [
        search,
        selectedLocationId,
        selectedCategoryId,
        fetchProducts,
    ]);

    // -------------------------------------------------------------------------
    // CATEGORY CHANGE
    // -------------------------------------------------------------------------

    const handleCategoryChange = (
        categoryId
    ) => {
        setSelectedCategoryId(
            categoryId
        );
    };

    // -------------------------------------------------------------------------
    // LOCATION CHANGE
    // -------------------------------------------------------------------------

    const handleLocationChange = (
        event
    ) => {
        const value =
            event.target.value;

        setSelectedLocationId(value);

        setCart([]);

        setSelectedVariantProduct(
            null
        );
    };


    // -----------------------------------------------------------------------------
    // CART QUANTITY
    // -----------------------------------------------------------------------------

    const increaseCartItem = (item) => {
        if (!item) {
            return;
        }

        setCart((currentCart) =>
            currentCart.map((cartItem) => {
                if (cartItem.cartKey !== item.cartKey) {
                    return cartItem;
                }

                if (
                    cartItem.continue_selling_when_out_of_stock
                ) {
                    return {
                        ...cartItem,
                        quantity: cartItem.quantity + 1,
                    };
                }

                if (
                    cartItem.quantity >=
                    Number(cartItem.available_quantity || 0)
                ) {
                    return cartItem;
                }

                return {
                    ...cartItem,
                    quantity: cartItem.quantity + 1,
                };
            })
        );
    };

    // -----------------------------------------------------------------------------
    // DECREASE CART ITEM
    // -----------------------------------------------------------------------------

    const decreaseCartItem = (item) => {
        if (!item) {
            return;
        }

        setCart((currentCart) =>
            currentCart
                .map((cartItem) =>
                    cartItem.cartKey === item.cartKey
                        ? {
                            ...cartItem,
                            quantity:
                                cartItem.quantity - 1,
                        }
                        : cartItem
                )
                .filter(
                    (cartItem) =>
                        cartItem.quantity > 0
                )
        );
    };

    // -----------------------------------------------------------------------------
    // REMOVE CART ITEM
    // -----------------------------------------------------------------------------

    const removeCartItem = (item) => {
        if (!item) {
            return;
        }

        setCart((currentCart) =>
            currentCart.filter(
                (cartItem) =>
                    cartItem.cartKey !== item.cartKey
            )
        );
    };






    // -------------------------------------------------------------------------
    // CART TOTALS
    // -------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // CART TOTALS
    // -------------------------------------------------------------------------

    const cartTotals = useMemo(() => {

        const itemCount =
            cart.reduce(
                (total, item) =>
                    total + Number(item.quantity || 0),
                0
            );


        const subtotal =
            cart.reduce(
                (total, item) =>
                    total +
                    Number(item.unit_price || 0) *
                    Number(item.quantity || 0),
                0
            );


        const discountAmount =
            discount.type === "percentage"
                ? (subtotal * Number(discount.value || 0)) / 100
                : Number(discount.value || 0);


        const total =
            Math.max(
                subtotal - discountAmount,
                0
            );


        return {
            itemCount,

            subtotal,

            discountAmount,

            total,
        };


    }, [cart, discount]);



    const handleConfirmPayment = async (paymentData) => {
    if (!selectedLocationId) {
        throw new Error(
            "Please select a POS location."
        );
    }

    if (!cart.length) {
        throw new Error(
            "Your cart is empty."
        );
    }

    try {
        setError("");

        const registerResponse = await api.get(
            "/admin/pos/register/current",
            {
                params: {
                    location_id: Number(
                        selectedLocationId
                    ),
                },
            }
        );

        const registerSession =
            registerResponse.data?.register_session;

        if (
            !registerSession ||
            registerSession.status !== "open"
        ) {
            throw new Error(
                "Please open the POS register before taking payment."
            );
        }

        const checkoutPayload = {
            location_id: Number(
                selectedLocationId
            ),

            register_session_id:
                registerSession.id,

            customer_id:
                selectedCustomer?.id || null,

            currency: "USD",

            items: cart.map((item) => ({
                product_id: Number(
                    item.product_id
                ),

                variant_id:
                    item.variant_id
                        ? Number(item.variant_id)
                        : null,

                quantity: Number(
                    item.quantity || 1
                ),

                note: item.note || null,
            })),

            discount: {
                type:
                    Number(discount?.value || 0) > 0
                        ? discount.type
                        : null,

                value: Number(
                    discount?.value || 0
                ),

                reason:
                    discount?.reason || null,
            },

            tax_rate: 0,

            payments: paymentData.payments.map(
                (payment) => ({
                    method: payment.method,

                    amount: Number(
                        payment.amount
                    ),

                    reference:
                        payment.reference || null,

                    last_four:
                        payment.last_four || null,

                    metadata:
                        payment.metadata || {},
                })
            ),

            note: null,

            internal_note:
                discount?.note || null,
        };

        const response = await api.post(
            "/admin/pos/checkout",
            checkoutPayload
        );

        const result = response.data;

        if (!result?.success) {
            throw new Error(
                result?.message ||
                "POS checkout could not be completed."
            );
        }

        setShowPaymentModal(false);

        setCart([]);

        setSelectedCustomer(null);

        setDiscount({
            type: null,
            value: 0,
            reason: "",
            note: "",
        });

        await fetchProducts({
            locationId: selectedLocationId,
            searchValue: search,
            categoryId: selectedCategoryId,
            page: pagination.current_page || 1,
        });

        return result;
    } catch (checkoutError) {
        console.error(
            "POS checkout error:",
            checkoutError.response?.data ||
            checkoutError.message
        );

        const validationErrors =
            checkoutError.response?.data?.errors;

        let errorMessage =
            checkoutError.response?.data?.message ||
            checkoutError.message ||
            "POS checkout could not be completed.";

        if (validationErrors) {
            const firstValidationError =
                Object.values(validationErrors)
                    .flat()
                    .find(Boolean);

            if (firstValidationError) {
                errorMessage =
                    firstValidationError;
            }
        }

        throw new Error(errorMessage);
    }
};




    // -------------------------------------------------------------------------
    // CONTINUE TO PAYMENT
    // -------------------------------------------------------------------------

    const handleContinuePayment = () => {

        if (cart.length === 0) {
            return;
        }


        setShowPaymentModal(true);

    };

    // -------------------------------------------------------------------------
    // ADD CUSTOMER
    // -------------------------------------------------------------------------

    const handleAddCustomer = () => {
        setShowCustomerModal(true);
    };

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setShowCustomerModal(false);
    };

    // -------------------------------------------------------------------------
    // LOADING
    // -------------------------------------------------------------------------

    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <LoaderCircle
                    size={34}
                    className="animate-spin text-[#2563eb]"
                />
            </div>
        );
    }

    // -------------------------------------------------------------------------
    // UI
    // -------------------------------------------------------------------------

    return (
        <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-[#f6f7f9] text-[#111827]">

            {/* HEADER */}

            <div className="shrink-0">
                <PosHeader
                    search={search}
                    setSearch={setSearch}
                />
            </div>

            {/* ERROR */}

            {error && (
                <div className="mx-6 mt-5 shrink-0 rounded-[12px] border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-[14px] text-[#b42318]">
                    {error}
                </div>
            )}

            {/* MAIN POS AREA */}

            <div className="grid min-h-0 flex-1 grid-cols-1 overflow-hidden xl:grid-cols-[minmax(0,1fr)_430px]">

                {/* LEFT */}

                <div className="min-w-0 overflow-y-auto p-6">

                    {/* PRODUCTS */}

                    <PosProductSection
                        categories={
                            categories
                        }
                        selectedCategoryId={
                            selectedCategoryId
                        }
                        onCategoryChange={
                            handleCategoryChange
                        }
                        products={
                            products
                        }
                        productsLoading={
                            productsLoading
                        }
                        pagination={
                            pagination
                        }
                        onAddProduct={
                            handleAddProduct
                        }
                        formatMoney={
                            formatMoney
                        }
                    />

                </div>

                {/* RIGHT / CART */}

                <PosCart

                    cart={cart}

                    cartTotals={cartTotals}

                    discount={discount}

                    onDiscount={() =>
                        setShowDiscountModal(true)
                    }

                    selectedCustomer={selectedCustomer}


                    onIncrease={handleIncrease}

                    onDecrease={handleDecrease}

                    onRemove={handleRemove}


                    formatMoney={formatMoney}


                    onAddCustomer={handleAddCustomer}

                    onRemoveCustomer={() =>
                        setSelectedCustomer(null)
                    }


                    onContinuePayment={handleContinuePayment}


                    onHold={handleHoldOrder}


                    heldOrders={heldOrders}

                    onResume={handleResumeOrder}

                />


            </div>

            {/* VARIANT MODAL */}

            {selectedVariantProduct && (
                <PosVariantModal
                    product={
                        selectedVariantProduct
                    }
                    onClose={() =>
                        setSelectedVariantProduct(
                            null
                        )
                    }
                    onSelectVariant={
                        addVariantToCart
                    }
                    formatMoney={
                        formatMoney
                    }
                />
            )}


            {showCustomerModal && (
                <PosCustomerModal
                    onClose={() => setShowCustomerModal(false)}
                    onSelectCustomer={handleSelectCustomer}
                />
            )}


           {showPaymentModal && (
    <PosPaymentModal
        cart={cart}
        cartTotals={cartTotals}
        discount={discount}
        selectedCustomer={selectedCustomer}
        formatMoney={formatMoney}
        onClose={() =>
            setShowPaymentModal(false)
        }
        onConfirmPayment={
            handleConfirmPayment
        }
    />
)}





            {showDiscountModal && (
                <PosDiscountModal
                    cartTotals={cartTotals}
                    discount={discount}
                    formatMoney={formatMoney}
                    onClose={() => setShowDiscountModal(false)}
                    onApply={(data) => {
                        setDiscount({
                            type: data.type,
                            value: Number(data.value || 0),
                            reason: data.reason || "",
                            note: data.note || "",
                        });

                        setShowDiscountModal(false);
                    }}
                />
            )}



        </div>
    );
};

export default AdminPos;