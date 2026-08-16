import { useEffect, useMemo, useState } from "react";
import {
    ArrowLeft,
    Check,
    LoaderCircle,
    Pencil,
    Plus,
    Search,
    Trash2,
    X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import api from "../../../api/axios";

const AdminOrderCreate = () => {
    const navigate = useNavigate();

    const [products, setProducts] = useState([]);
    const [productModalOpen, setProductModalOpen] = useState(false);

    const [customerSearch, setCustomerSearch] = useState("");
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOpen, setCustomerOpen] = useState(false);
    const [customerLoading, setCustomerLoading] = useState(false);

    const [discount, setDiscount] = useState(0);
    const [shipping, setShipping] = useState(0);
    const [taxRate, setTaxRate] = useState(0);
    const [paymentDueLater, setPaymentDueLater] = useState(false);

    const [notes, setNotes] = useState("");
    const [tags, setTags] = useState("vip, wholesale");

    const [saveLoading, setSaveLoading] = useState(false);

    useEffect(() => {
        if (!customerOpen) {
            return;
        }

        const timer = setTimeout(() => {
            fetchCustomers(customerSearch);
        }, 300);

        return () => {
            clearTimeout(timer);
        };
    }, [customerSearch, customerOpen]);

    const subtotal = useMemo(() => {
        return products.reduce((total, item) => {
            const price = Number(item.price || 0);
            const quantity = Number(item.quantity || 1);

            return total + price * quantity;
        }, 0);
    }, [products]);

    const taxAmount = useMemo(() => {
        return subtotal * (Number(taxRate || 0) / 100);
    }, [subtotal, taxRate]);

    const total = useMemo(() => {
        return Math.max(
            0,
            subtotal -
            Number(discount || 0) +
            Number(shipping || 0) +
            taxAmount
        );
    }, [subtotal, discount, shipping, taxAmount]);

    const totalItems = useMemo(() => {
        return products.reduce((total, item) => {
            return total + Number(item.quantity || 0);
        }, 0);
    }, [products]);

    const fetchCustomers = async (search = "") => {
        try {
            setCustomerLoading(true);

            const response = await api.get(
                "/admin/orders/create/customers",
                {
                    params: {
                        search,
                    },
                }
            );

            setCustomers(
                response.data?.customers || []
            );
        } catch (error) {
            console.error(
                "Customer search error:",
                error.response?.data || error.message
            );

            setCustomers([]);
        } finally {
            setCustomerLoading(false);
        }
    };

    const handleSelectCustomer = (customer) => {
        setSelectedCustomer(customer);
        setCustomerSearch("");
        setCustomerOpen(false);
    };

    const handleRemoveCustomer = () => {
        setSelectedCustomer(null);
        setCustomerSearch("");
        setCustomerOpen(false);
    };

    const handleAddProducts = (selectedProducts) => {
        setProducts((currentProducts) => {
            const updatedProducts = [...currentProducts];

            selectedProducts.forEach((product) => {
                const exists = updatedProducts.some((item) => {
                    return item.key === product.key;
                });

                if (exists) {
                    return;
                }

                updatedProducts.push({
                    ...product,
                    quantity: 1,
                });
            });

            return updatedProducts;
        });

        setProductModalOpen(false);
    };

    const handleQuantityChange = (key, value) => {
        let quantity = Math.max(
            1,
            Number(value || 1)
        );

        setProducts((currentProducts) => {
            return currentProducts.map((item) => {
                if (item.key !== key) {
                    return item;
                }

                if (
                    item.available !== null &&
                    item.available !== undefined
                ) {
                    quantity = Math.min(
                        quantity,
                        Math.max(
                            1,
                            Number(item.available || 1)
                        )
                    );
                }

                return {
                    ...item,
                    quantity,
                };
            });
        });
    };

    const handleRemoveProduct = (key) => {
        setProducts((currentProducts) => {
            return currentProducts.filter((item) => {
                return item.key !== key;
            });
        });
    };

    const handleCreateOrder = async (markAsPaid = false) => {
        if (saveLoading) {
            return;
        }

        if (!products.length) {
            alert("Please add at least one product.");
            return;
        }

        if (!selectedCustomer) {
            alert("Please select a customer.");
            return;
        }

        try {
            setSaveLoading(true);

            const payload = {
                customer_id: selectedCustomer.id,

                items: products.map((item) => ({
                    product_id: item.product_id,
                    variant_id: item.variant_id || null,
                    quantity: Number(item.quantity || 1),
                })),

                discount_total: Number(discount || 0),
                shipping_total: Number(shipping || 0),
                tax_rate: Number(taxRate || 0),

                customer_note:
                    notes.trim() || null,

                payment_due_later:
                    markAsPaid
                        ? false
                        : paymentDueLater,

                mark_as_paid: markAsPaid,
            };

            const response = await api.post(
                "/admin/orders/manual",
                payload
            );

            const createdOrder =
                response.data?.order;

            if (!createdOrder?.id) {
                throw new Error(
                    "Created order ID was not returned."
                );
            }

            navigate(
                `/admin/orders/${createdOrder.id}`
            );
        } catch (error) {
            console.error(
                "Create manual order error:",
                error.response?.data || error.message
            );

            const validationErrors =
                error.response?.data?.errors;

            if (validationErrors) {
                const firstError =
                    Object.values(validationErrors)
                        .flat()
                        .find(Boolean);

                alert(
                    firstError ||
                    "Unable to create order."
                );

                return;
            }

            alert(
                error.response?.data?.message ||
                error.message ||
                "Unable to create order."
            );
        } finally {
            setSaveLoading(false);
        }
    };

    const handleBack = () => {
        navigate("/admin/orders");
    };

    return (
        <div className="min-h-screen bg-[#f6f6f7] font-['Inter']">

            <div className="border-b border-[#dedede] bg-white px-[24px] py-[17px]">
                <div className="mx-auto flex max-w-[1500px] items-center justify-between">

                    <div>
                        <div className="flex items-center gap-[9px]">
                            <h1 className="text-[20px] font-semibold text-[#171717]">
                                Create order
                            </h1>

                            <span className="rounded-full border border-[#dedede] bg-white px-[8px] py-[3px] text-[11px] font-medium text-[#444]">
                                Draft
                            </span>
                        </div>

                        <p className="mt-[3px] text-[13px] text-[#777]">
                            Unsaved draft order
                        </p>
                    </div>

                    <div className="flex items-center gap-[9px]">

                        <button
                            type="button"
                            onClick={() => handleCreateOrder(false)}
                            disabled={
                                saveLoading ||
                                !products.length ||
                                !selectedCustomer
                            }
                            className="flex h-[38px] items-center gap-[7px] rounded-[10px] bg-[#2467d5] px-[17px] text-[14px] font-semibold text-white transition hover:bg-[#1e59ba] disabled:cursor-not-allowed disabled:bg-[#9bbceb]"
                        >
                            {saveLoading && (
                                <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                />
                            )}

                            {saveLoading
                                ? "Saving..."
                                : "Save"}
                        </button>

                        <button
                            type="button"
                            onClick={handleBack}
                            disabled={saveLoading}
                            className="flex h-[38px] items-center gap-[7px] rounded-[10px] border border-[#dedede] bg-white px-[15px] text-[14px] font-medium text-[#222] transition hover:bg-[#f7f7f7] disabled:opacity-50"
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>

                    </div>

                </div>
            </div>

            <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-[22px] px-[24px] py-[24px] xl:grid-cols-[minmax(0,1fr)_410px]">

                <div className="space-y-[22px]">

                    <section className="rounded-[17px] border border-[#dedede] bg-white p-[22px] shadow-sm">

                        <div className="flex items-center justify-between">

                            <h2 className="text-[16px] font-semibold text-[#171717]">
                                Products
                            </h2>

                            <div className="flex items-center gap-[8px]">

                                <button
                                    type="button"
                                    onClick={() => setProductModalOpen(true)}
                                    disabled={saveLoading}
                                    className="flex h-[35px] items-center gap-[6px] rounded-full border border-[#dedede] bg-white px-[14px] text-[13px] font-semibold text-[#222] transition hover:bg-[#f7f7f7] disabled:opacity-50"
                                >
                                    <Plus size={16} />
                                    Add product
                                </button>

                                <button
                                    type="button"
                                    disabled
                                    className="flex h-[35px] items-center gap-[6px] rounded-full border border-[#dedede] bg-[#fafafa] px-[14px] text-[13px] font-medium text-[#999]"
                                >
                                    <Plus size={16} />
                                    Add custom item
                                </button>

                            </div>

                        </div>

                        {!products.length && (
                            <div className="mt-[22px] flex min-h-[72px] items-center justify-center rounded-[14px] border border-dashed border-[#dedede] text-[13px] text-[#777]">
                                No products added yet.
                            </div>
                        )}

                        {products.length > 0 && (
                            <div className="mt-[18px] space-y-[10px]">

                                {products.map((item) => (
                                    <div
                                        key={item.key}
                                        className="flex items-center gap-[14px] rounded-[14px] border border-[#dedede] px-[14px] py-[12px]"
                                    >

                                        <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center overflow-hidden rounded-[10px] border border-[#e3e3e3] bg-[#f7f7f7]">

                                            {item.image_url ? (
                                                <img
                                                    src={item.image_url}
                                                    alt={item.product_name}
                                                    className="h-full w-full object-contain p-[4px]"
                                                />
                                            ) : (
                                                <span className="text-[10px] text-[#999]">
                                                    No image
                                                </span>
                                            )}

                                        </div>

                                        <div className="min-w-0 flex-1">

                                            <p className="truncate text-[14px] font-medium text-[#171717]">
                                                {item.product_name}
                                            </p>

                                            <div className="mt-[4px] flex flex-wrap items-center gap-[7px]">

                                                {item.variant_name && (
                                                    <span className="rounded-full bg-[#8455ec] px-[8px] py-[3px] text-[11px] font-medium text-white">
                                                        {item.variant_name}
                                                    </span>
                                                )}

                                                {item.sku && (
                                                    <span className="text-[11px] text-[#777]">
                                                        {item.sku}
                                                    </span>
                                                )}

                                            </div>

                                        </div>

                                        <input
                                            type="number"
                                            min="1"
                                            max={
                                                item.available === null
                                                    ? undefined
                                                    : Math.max(
                                                        1,
                                                        Number(item.available)
                                                    )
                                            }
                                            value={item.quantity}
                                            disabled={saveLoading}
                                            onChange={(event) => {
                                                handleQuantityChange(
                                                    item.key,
                                                    event.target.value
                                                );
                                            }}
                                            className="h-[38px] w-[92px] rounded-[10px] border border-[#dedede] px-[13px] text-[14px] outline-none focus:border-[#2467d5] disabled:bg-[#f5f5f5]"
                                        />

                                        <div className="w-[115px] text-right">

                                            <p className="text-[14px] font-semibold text-[#171717]">
                                                {formatMoney(
                                                    Number(item.price || 0) *
                                                    Number(item.quantity || 1)
                                                )}
                                            </p>

                                            <p className="mt-[2px] text-[11px] text-[#777]">
                                                {formatMoney(item.price)} each
                                            </p>

                                        </div>

                                        <button
                                            type="button"
                                            disabled={saveLoading}
                                            onClick={() => {
                                                handleRemoveProduct(item.key);
                                            }}
                                            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px] text-[#333] transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                                        >
                                            <Trash2 size={17} />
                                        </button>

                                    </div>
                                ))}

                            </div>
                        )}

                    </section>

                    <section className="rounded-[17px] border border-[#dedede] bg-white p-[22px] shadow-sm">

                        <h2 className="text-[16px] font-semibold text-[#171717]">
                            Payment
                        </h2>

                        <div className="mt-[18px] overflow-hidden rounded-[14px] border border-[#dedede]">

                            <div className="flex items-center justify-between px-[16px] py-[13px]">

                                <span className="text-[14px] font-medium text-[#222]">
                                    Subtotal
                                </span>

                                <div className="flex items-center gap-[80px]">

                                    <span className="text-[13px] text-[#555]">
                                        {totalItems}{" "}
                                        {totalItems === 1
                                            ? "item"
                                            : "items"}
                                    </span>

                                    <span className="w-[110px] text-right text-[14px] font-medium text-[#222]">
                                        {formatMoney(subtotal)}
                                    </span>

                                </div>

                            </div>

                            <div className="flex items-center justify-between px-[16px] py-[9px]">

                                <span className="text-[14px] font-medium text-[#2467d5]">
                                    Add discount
                                </span>

                                <div className="flex items-center gap-[12px]">

                                    <span className="text-[13px] text-[#777]">
                                        $
                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        value={discount}
                                        disabled={saveLoading}
                                        onChange={(event) => {
                                            setDiscount(event.target.value);
                                        }}
                                        className="h-[34px] w-[110px] rounded-full border border-[#dedede] px-[13px] text-right text-[13px] outline-none focus:border-[#2467d5] disabled:bg-[#f5f5f5]"
                                    />

                                </div>

                            </div>

                            <div className="flex items-center justify-between px-[16px] py-[9px]">

                                <span className="text-[14px] font-medium text-[#2467d5]">
                                    Add shipping or delivery
                                </span>

                                <div className="flex items-center gap-[12px]">

                                    <span className="text-[13px] text-[#777]">
                                        $
                                    </span>

                                    <input
                                        type="number"
                                        min="0"
                                        value={shipping}
                                        disabled={saveLoading}
                                        onChange={(event) => {
                                            setShipping(event.target.value);
                                        }}
                                        className="h-[34px] w-[110px] rounded-full border border-[#dedede] px-[13px] text-right text-[13px] outline-none focus:border-[#2467d5] disabled:bg-[#f5f5f5]"
                                    />

                                </div>

                            </div>

                            <div className="flex items-center justify-between px-[16px] py-[9px]">

                                <span className="text-[14px] font-medium text-[#2467d5]">
                                    Estimated tax
                                </span>

                                <div className="flex items-center gap-[6px]">

                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={taxRate}
                                        disabled={saveLoading}
                                        onChange={(event) => {
                                            setTaxRate(event.target.value);
                                        }}
                                        className="h-[34px] w-[95px] rounded-full border border-[#dedede] px-[13px] text-right text-[13px] outline-none focus:border-[#2467d5] disabled:bg-[#f5f5f5]"
                                    />

                                    <span className="text-[12px] leading-[14px] text-[#777]">
                                        %<br />
                                        VAT
                                    </span>

                                </div>

                            </div>

                            <div className="flex items-center justify-between border-b border-[#dedede] px-[16px] py-[13px]">

                                <span className="text-[14px] font-semibold text-[#171717]">
                                    Total
                                </span>

                                <span className="text-[15px] font-semibold text-[#171717]">
                                    {formatMoney(total)}
                                </span>

                            </div>

                            <label className="flex cursor-pointer items-center gap-[9px] px-[16px] py-[12px]">

                                <input
                                    type="checkbox"
                                    checked={paymentDueLater}
                                    disabled={saveLoading}
                                    onChange={(event) => {
                                        setPaymentDueLater(
                                            event.target.checked
                                        );
                                    }}
                                    className="h-[16px] w-[16px]"
                                />

                                <span className="text-[14px] text-[#222]">
                                    Payment due later
                                </span>

                            </label>

                        </div>

                        <div className="mt-[20px] flex items-center justify-between">

                            <p className="text-[13px] text-[#777]">
                                {products.length
                                    ? "Send an invoice or mark this manual order as paid."
                                    : "Add a product to calculate total and view payment options."}
                            </p>

                            <div className="flex items-center gap-[8px]">

                                <button
                                    type="button"
                                    disabled
                                    title="Invoice sending will be connected separately"
                                    className="h-[38px] rounded-full border border-[#dedede] bg-white px-[16px] text-[13px] font-semibold text-[#aaa]"
                                >
                                    Send invoice
                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleCreateOrder(true)}
                                    disabled={
                                        saveLoading ||
                                        !products.length ||
                                        !selectedCustomer
                                    }
                                    className="flex h-[38px] items-center gap-[7px] rounded-full bg-[#2467d5] px-[17px] text-[13px] font-semibold text-white transition hover:bg-[#1e59ba] disabled:cursor-not-allowed disabled:bg-[#9bbceb]"
                                >
                                    {saveLoading && (
                                        <LoaderCircle
                                            size={16}
                                            className="animate-spin"
                                        />
                                    )}

                                    {saveLoading
                                        ? "Processing..."
                                        : "Mark as paid"}
                                </button>

                            </div>

                        </div>

                    </section>

                </div>

                <div className="space-y-[18px]">

                    <SideCard title="Notes">

                        <textarea
                            rows="3"
                            value={notes}
                            disabled={saveLoading}
                            onChange={(event) => {
                                setNotes(event.target.value);
                            }}
                            placeholder="No notes"
                            className="w-full resize-none border-0 bg-transparent text-[13px] text-[#555] outline-none disabled:opacity-60"
                        />

                    </SideCard>

                    <SideCard title="Customer">

                        {!selectedCustomer && (
                            <div className="relative">

                                <Search
                                    size={16}
                                    className="absolute left-[13px] top-[13px] z-10 text-[#777]"
                                />

                                <input
                                    type="text"
                                    value={customerSearch}
                                    disabled={saveLoading}
                                    onFocus={() => {
                                        setCustomerOpen(true);
                                    }}
                                    onChange={(event) => {
                                        setCustomerSearch(
                                            event.target.value
                                        );

                                        setCustomerOpen(true);
                                    }}
                                    placeholder="Search or create a customer"
                                    className="h-[42px] w-full rounded-[10px] border border-[#dedede] pl-[39px] pr-[12px] text-[13px] outline-none focus:border-[#2467d5] focus:ring-2 focus:ring-blue-100 disabled:bg-[#f5f5f5]"
                                />

                                {customerOpen && (
                                    <div className="absolute left-0 right-0 top-[50px] z-[150] max-h-[330px] overflow-y-auto rounded-[12px] border border-[#dedede] bg-white py-[6px] shadow-[0_12px_30px_rgba(0,0,0,0.16)]">

                                        <button
                                            type="button"
                                            disabled
                                            className="flex w-full items-center gap-[8px] border-b border-[#eeeeee] px-[14px] py-[11px] text-left text-[13px] font-medium text-[#999]"
                                        >
                                            <Plus size={16} />
                                            Create a new customer
                                        </button>

                                        {customerLoading && (
                                            <div className="flex items-center justify-center py-[25px]">
                                                <LoaderCircle
                                                    size={21}
                                                    className="animate-spin text-[#2467d5]"
                                                />
                                            </div>
                                        )}

                                        {!customerLoading &&
                                            customers.length === 0 && (
                                                <div className="px-[14px] py-[20px] text-center text-[13px] text-[#888]">
                                                    No customers found.
                                                </div>
                                            )}

                                        {!customerLoading &&
                                            customers.map((customer) => (
                                                <button
                                                    key={customer.id}
                                                    type="button"
                                                    onClick={() => {
                                                        handleSelectCustomer(
                                                            customer
                                                        );
                                                    }}
                                                    className="block w-full px-[14px] py-[10px] text-left transition hover:bg-[#f7f7f7]"
                                                >
                                                    <p className="truncate text-[14px] font-medium text-[#222]">
                                                        {customer.name ||
                                                            "Customer"}
                                                    </p>

                                                    <p className="mt-[2px] truncate text-[12px] text-[#777]">
                                                        {customer.email ||
                                                            customer.phone ||
                                                            "-"}
                                                    </p>
                                                </button>
                                            ))}

                                    </div>
                                )}

                            </div>
                        )}

                        {selectedCustomer && (
                            <div className="rounded-[12px] border border-[#dedede] bg-[#fafafa] px-[14px] py-[13px]">

                                <div className="flex items-start justify-between gap-[12px]">

                                    <div className="min-w-0">

                                        <p className="truncate text-[14px] font-semibold text-[#222]">
                                            {selectedCustomer.name}
                                        </p>

                                        {selectedCustomer.email && (
                                            <p className="mt-[3px] truncate text-[12px] text-[#777]">
                                                {selectedCustomer.email}
                                            </p>
                                        )}

                                        {selectedCustomer.phone && (
                                            <p className="mt-[3px] text-[12px] text-[#777]">
                                                {selectedCustomer.phone}
                                            </p>
                                        )}

                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleRemoveCustomer}
                                        disabled={saveLoading}
                                        className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] text-[#777] transition hover:bg-[#eeeeee] hover:text-[#222] disabled:opacity-50"
                                    >
                                        <X size={16} />
                                    </button>

                                </div>

                            </div>
                        )}

                    </SideCard>

                    <SideCard title="Tags">

                        <input
                            type="text"
                            value={tags}
                            disabled={saveLoading}
                            onChange={(event) => {
                                setTags(event.target.value);
                            }}
                            placeholder="vip, wholesale"
                            className="h-[42px] w-full rounded-[10px] border border-[#dedede] px-[13px] text-[13px] outline-none focus:border-[#2467d5] disabled:bg-[#f5f5f5]"
                        />

                    </SideCard>

                </div>

            </div>

            <ProductPickerModal
                open={productModalOpen}
                existingProducts={products}
                onClose={() => {
                    setProductModalOpen(false);
                }}
                onAdd={handleAddProducts}
            />

        </div>
    );
};

const ProductPickerModal = ({
    open,
    existingProducts,
    onClose,
    onAdd,
}) => {
    const [products, setProducts] = useState([]);
    const [selected, setSelected] = useState([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        setSelected([]);
        setSearch("");
    }, [open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const timer = setTimeout(() => {
            fetchProducts(search);
        }, 300);

        return () => {
            clearTimeout(timer);
        };
    }, [open, search]);

    const fetchProducts = async (keyword) => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/admin/orders/create/products",
                {
                    params: {
                        search: keyword,
                        per_page: 100,
                    },
                }
            );

            setProducts(
                response.data?.products || []
            );
        } catch (error) {
            console.error(
                "Create order products error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to load products."
            );
        } finally {
            setLoading(false);
        }
    };

    const isExisting = (product) => {
        return existingProducts.some((item) => {
            return item.key === product.key;
        });
    };

    const isSelected = (product) => {
        return selected.some((item) => {
            return item.key === product.key;
        });
    };

    const toggleProduct = (product) => {
        if (isExisting(product)) {
            return;
        }

        setSelected((currentSelected) => {
            const found = currentSelected.some((item) => {
                return item.key === product.key;
            });

            if (found) {
                return currentSelected.filter((item) => {
                    return item.key !== product.key;
                });
            }

            if (currentSelected.length >= 500) {
                return currentSelected;
            }

            return [
                ...currentSelected,
                product,
            ];
        });
    };

    const handleAdd = () => {
        if (!selected.length) {
            return;
        }

        onAdd(selected);
    };

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/45 px-[20px]">

            <div className="flex h-[650px] w-full max-w-[670px] flex-col overflow-hidden rounded-[17px] bg-white shadow-[0_25px_70px_rgba(0,0,0,0.25)]">

                <div className="flex h-[62px] items-center justify-between border-b border-[#e5e5e5] px-[18px]">

                    <h2 className="text-[18px] font-semibold text-[#222]">
                        Select products
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] text-[#666] transition hover:bg-[#f5f5f5]"
                    >
                        <X size={19} />
                    </button>

                </div>

                <div className="border-b border-[#e5e5e5] px-[18px] py-[14px]">

                    <div className="flex gap-[10px]">

                        <div className="relative flex-1">

                            <Search
                                size={17}
                                className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#777]"
                            />

                            <input
                                type="text"
                                value={search}
                                autoFocus
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                }}
                                placeholder="Search products"
                                className="h-[42px] w-full rounded-[10px] border-2 border-[#4b8df8] pl-[38px] pr-[12px] text-[14px] outline-none"
                            />

                        </div>

                        <button
                            type="button"
                            className="flex h-[42px] w-[185px] items-center justify-between rounded-[10px] border border-[#dedede] bg-white px-[13px] text-[13px] text-[#777]"
                        >
                            Search by All
                            <span>⌄</span>
                        </button>

                    </div>

                    <button
                        type="button"
                        className="mt-[10px] flex h-[34px] items-center gap-[6px] rounded-full border border-[#dedede] bg-white px-[12px] text-[13px] text-[#777]"
                    >
                        Add filter
                        <Plus size={14} />
                    </button>

                </div>

                <div className="grid grid-cols-[minmax(0,1fr)_100px_105px] border-b border-[#e5e5e5] px-[18px] py-[10px] text-[12px] font-medium text-[#777]">
                    <span>Product</span>
                    <span className="text-center">Available</span>
                    <span className="text-right">Price</span>
                </div>

                <div className="flex-1 overflow-y-auto">

                    {loading && (
                        <div className="flex h-full items-center justify-center">
                            <LoaderCircle
                                size={28}
                                className="animate-spin text-[#2467d5]"
                            />
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex h-full items-center justify-center px-[30px] text-center text-[13px] text-red-500">
                            {error}
                        </div>
                    )}

                    {!loading &&
                        !error &&
                        !products.length && (
                            <div className="flex h-full items-center justify-center text-[13px] text-[#888]">
                                No products found.
                            </div>
                        )}

                    {!loading &&
                        !error &&
                        products.map((product) => {
                            const selectedRow =
                                isSelected(product);

                            const existingRow =
                                isExisting(product);

                            return (
                                <button
                                    key={product.key}
                                    type="button"
                                    disabled={existingRow}
                                    onClick={() => {
                                        toggleProduct(product);
                                    }}
                                    className={`grid w-full grid-cols-[minmax(0,1fr)_100px_105px] items-center border-b border-[#eeeeee] px-[18px] py-[9px] text-left transition ${
                                        selectedRow
                                            ? "bg-[#f4f7ff]"
                                            : "bg-white hover:bg-[#fafafa]"
                                    } ${
                                        existingRow
                                            ? "cursor-not-allowed opacity-45"
                                            : ""
                                    }`}
                                >

                                    <div className="flex min-w-0 items-center gap-[10px]">

                                        <div
                                            className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-[4px] border ${
                                                selectedRow
                                                    ? "border-[#2467d5] bg-[#2467d5]"
                                                    : "border-[#d5d5d5] bg-white"
                                            }`}
                                        >
                                            {selectedRow && (
                                                <Check
                                                    size={13}
                                                    className="text-white"
                                                />
                                            )}
                                        </div>

                                        <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#e3e3e3] bg-[#f7f7f7]">

                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.product_name}
                                                    className="h-full w-full object-contain p-[3px]"
                                                />
                                            ) : (
                                                <span className="text-[8px] text-[#999]">
                                                    No image
                                                </span>
                                            )}

                                        </div>

                                        <div className="min-w-0">

                                            <p className="truncate text-[13px] font-medium text-[#222]">
                                                {product.product_name}
                                            </p>

                                            <p className="mt-[2px] truncate text-[11px] text-[#777]">
                                                {product.variant_name ||
                                                    product.sku ||
                                                    "Default"}
                                            </p>

                                        </div>

                                    </div>

                                    <div className="text-center text-[13px] text-[#333]">
                                        {product.available === null
                                            ? "∞"
                                            : product.available}
                                    </div>

                                    <div className="text-right text-[13px] font-medium text-[#333]">
                                        {formatMoney(product.price)}
                                    </div>

                                </button>
                            );
                        })}

                </div>

                <div className="flex h-[64px] items-center justify-between border-t border-[#e5e5e5] bg-white px-[18px]">

                    <span className="text-[13px] text-[#777]">
                        {selected.length}/500 variants selected
                    </span>

                    <div className="flex items-center gap-[8px]">

                        <button
                            type="button"
                            onClick={onClose}
                            className="h-[38px] rounded-[10px] border border-[#dedede] bg-white px-[16px] text-[13px] font-semibold text-[#333] transition hover:bg-[#f7f7f7]"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={handleAdd}
                            disabled={!selected.length}
                            className="h-[38px] rounded-[10px] bg-[#2467d5] px-[18px] text-[13px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9bbceb]"
                        >
                            Add
                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
};

const SideCard = ({
    title,
    children,
}) => {
    return (
        <section className="relative overflow-visible rounded-[17px] border border-[#dedede] bg-white px-[22px] py-[20px] shadow-sm">

            <div className="mb-[18px] flex items-center justify-between">

                <h2 className="text-[15px] font-semibold text-[#171717]">
                    {title}
                </h2>

                {title !== "Customer" && (
                    <Pencil
                        size={17}
                        className="text-[#333]"
                    />
                )}

            </div>

            {children}

        </section>
    );
};

const formatMoney = (value) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
    }).format(
        Number(value || 0)
    );
};

export default AdminOrderCreate;