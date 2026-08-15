import {
    createContext,
    useContext,
    useMemo,
    useState,
} from "react";

const CartContext = createContext(null);

const CART_KEY = "cart";

const CartProvider = ({ children }) => {
    const [cartOpen, setCartOpen] = useState(false);

    const [cartItems, setCartItems] = useState(() => {
        try {
            const storedCart = localStorage.getItem(CART_KEY);

            if (!storedCart) {
                return [];
            }

            const parsedCart = JSON.parse(storedCart);

            if (!Array.isArray(parsedCart)) {
                return [];
            }

            return parsedCart;
        } catch (error) {
            console.error("Cart load error:", error);

            return [];
        }
    });

    const saveCart = (items) => {
        localStorage.setItem(
            CART_KEY,
            JSON.stringify(items)
        );

        return items;
    };

    const openCart = () => {
        setCartOpen(true);
    };

    const closeCart = () => {
        setCartOpen(false);
    };

    const addToCart = (item) => {
        setCartItems((currentItems) => {
            const index = currentItems.findIndex((cartItem) => {
                return isSameCartItem(
                    cartItem,
                    item
                );
            });

            if (index === -1) {
                const newItem = {
                    ...item,
                    quantity: Math.max(
                        1,
                        Number(item.quantity || 1)
                    ),
                };

                const updatedItems = [
                    ...currentItems,
                    newItem,
                ];

                return saveCart(updatedItems);
            }

            const updatedItems = currentItems.map((cartItem, itemIndex) => {
                if (itemIndex !== index) {
                    return cartItem;
                }

                return {
                    ...cartItem,
                    quantity:
                        Number(cartItem.quantity || 1) +
                        Number(item.quantity || 1),
                };
            });

            return saveCart(updatedItems);
        });
    };

    const updateQuantity = (
        productId,
        variantId,
        quantity
    ) => {
        const newQuantity = Math.max(
            1,
            Number(quantity || 1)
        );

        setCartItems((currentItems) => {
            const updatedItems = currentItems.map((item) => {
                const matched = matchesCartItem(
                    item,
                    productId,
                    variantId
                );

                if (!matched) {
                    return item;
                }

                return {
                    ...item,
                    quantity: newQuantity,
                };
            });

            return saveCart(updatedItems);
        });
    };

    const removeFromCart = (
        productId,
        variantId
    ) => {
        setCartItems((currentItems) => {
            const updatedItems = currentItems.filter((item) => {
                return !matchesCartItem(
                    item,
                    productId,
                    variantId
                );
            });

            return saveCart(updatedItems);
        });
    };

    const clearCart = () => {
        localStorage.setItem(
            CART_KEY,
            JSON.stringify([])
        );

        setCartItems([]);
        setCartOpen(false);
    };

    const itemCount = useMemo(() => {
        return cartItems.reduce((total, item) => {
            return total + Number(
                item.quantity || 0
            );
        }, 0);
    }, [cartItems]);

    const cartTotal = useMemo(() => {
        return cartItems.reduce((total, item) => {
            const price = Number(
                item.price || 0
            );

            const quantity = Number(
                item.quantity || 0
            );

            return total + price * quantity;
        }, 0);
    }, [cartItems]);

    const value = {
        cartOpen,
        cartItems,
        itemCount,
        cartTotal,
        openCart,
        closeCart,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

const isSameCartItem = (
    firstItem,
    secondItem
) => {
    const firstProductId = Number(
        firstItem.product_id
    );

    const secondProductId = Number(
        secondItem.product_id
    );

    const firstVariantId = normalizeVariantId(
        firstItem.variant_id
    );

    const secondVariantId = normalizeVariantId(
        secondItem.variant_id
    );

    return (
        firstProductId === secondProductId &&
        firstVariantId === secondVariantId
    );
};

const matchesCartItem = (
    item,
    productId,
    variantId
) => {
    const itemProductId = Number(
        item.product_id
    );

    const targetProductId = Number(
        productId
    );

    const itemVariantId = normalizeVariantId(
        item.variant_id
    );

    const targetVariantId = normalizeVariantId(
        variantId
    );

    return (
        itemProductId === targetProductId &&
        itemVariantId === targetVariantId
    );
};

const normalizeVariantId = (variantId) => {
    if (variantId === null) {
        return null;
    }

    if (variantId === undefined) {
        return null;
    }

    if (variantId === "") {
        return null;
    }

    return Number(variantId);
};

const useCart = () => {
    const context = useContext(
        CartContext
    );

    if (!context) {
        throw new Error(
            "useCart must be used inside CartProvider."
        );
    }

    return context;
};

export {
    CartProvider,
    useCart,
};