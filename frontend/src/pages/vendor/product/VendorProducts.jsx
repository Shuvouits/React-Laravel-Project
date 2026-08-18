import {
    useEffect,
    useState,
} from "react";

import {
    Archive,
    Box,
    CircleAlert,
    Eye,
    Package,
    Pencil,
    Plus,
    Search,
    Store,
    Trash2,
    X,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import api from "../../../api/axios";


const VendorProducts = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);

    const [stats, setStats] = useState({
        total_products: 0,
        active_listings: 0,
        draft_products: 0,
        archived_products: 0,
        out_of_stock: 0,
        inventory_units: 0,
    });

    const [tabCounts, setTabCounts] = useState({
        all: 0,
        active: 0,
        draft: 0,
        archived: 0,
    });

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: null,
        to: null,
    });

    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sort, setSort] = useState("recent");

    const [deleteProduct, setDeleteProduct] = useState(null);
    const [deleting, setDeleting] = useState(false);

    const [error, setError] = useState("");


    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(
                search.trim()
            );
        }, 400);

        return () => clearTimeout(timer);
    }, [search]);


    useEffect(() => {
        fetchProducts(1);
    }, [
        activeTab,
        debouncedSearch,
        sort,
    ]);


    const fetchProducts = async (
        page = 1
    ) => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/vendor/products",
                {
                    params: {
                        tab: activeTab,
                        search:
                            debouncedSearch ||
                            undefined,
                        sort,
                        page,
                        per_page: 10,
                    },
                }
            );

            const data =
                response.data;

            setStats(
                data.stats || {}
            );

            setTabCounts(
                data.tab_counts || {}
            );

            setProducts(
                data.products?.data || []
            );

            setPagination({
                current_page:
                    data.products?.current_page ||
                    1,

                last_page:
                    data.products?.last_page ||
                    1,

                per_page:
                    data.products?.per_page ||
                    10,

                total:
                    data.products?.total ||
                    0,

                from:
                    data.products?.from ||
                    null,

                to:
                    data.products?.to ||
                    null,
            });
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to load products."
            );
        } finally {
            setLoading(false);
        }
    };


    const handleTabChange = (
        tab
    ) => {
        setActiveTab(tab);
    };


    const handleView = (
        product
    ) => {
        if (!product?.slug) {
            return;
        }

        navigate(
            `/products/${product.slug}`
        );
    };


    const handleEdit = (
        product
    ) => {
        navigate(
            `/vendor/products/${product.id}/edit`
        );
    };


    const handleDelete = async () => {
        if (
            !deleteProduct ||
            deleting
        ) {
            return;
        }

        try {
            setDeleting(true);
            setError("");

            await api.delete(
                `/vendor/products/${deleteProduct.id}`
            );

            setDeleteProduct(null);

            await fetchProducts(
                pagination.current_page
            );
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to delete product."
            );

            setDeleteProduct(null);
        } finally {
            setDeleting(false);
        }
    };


    const statsCards = [
        {
            label: "Total Products",
            value:
                stats.total_products ||
                0,
            icon: Package,
        },
        {
            label: "Active Listings",
            value:
                stats.active_listings ||
                0,
            icon: Store,
        },
        {
            label: "Draft Products",
            value:
                stats.draft_products ||
                0,
            icon: Archive,
        },
        {
            label: "Out of Stock",
            value:
                stats.out_of_stock ||
                0,
            icon: CircleAlert,
        },
        {
            label: "Inventory Units",
            value:
                stats.inventory_units ||
                0,
            icon: Box,
        },
    ];


    const tabs = [
        {
            key: "all",
            label: "All",
            count:
                tabCounts.all ||
                0,
        },
        {
            key: "active",
            label: "Active",
            count:
                tabCounts.active ||
                0,
        },
        {
            key: "draft",
            label: "Draft",
            count:
                tabCounts.draft ||
                0,
        },
        {
            key: "archived",
            label: "Archived",
            count:
                tabCounts.archived ||
                0,
        },
    ];


    return (
        <div className="min-h-full bg-[#f6f7fb] px-6 py-6">
            <div className="mx-auto max-w-[1600px]">

                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[#171717]">
                            Products
                        </h1>

                        <p className="mt-1 text-[14px] text-[#777777]">
                            Manage your products, inventory and sales channels
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/vendor/products/create"
                            )
                        }
                        className="flex h-[40px] items-center gap-2 rounded-[9px] bg-[#2563eb] px-5 text-[14px] font-semibold text-white transition hover:bg-[#1d56cc]"
                    >
                        <Plus
                            size={17}
                            strokeWidth={2}
                        />

                        Add Product
                    </button>
                </div>


                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {statsCards.map(
                        (item) => {
                            const Icon =
                                item.icon;

                            return (
                                <div
                                    key={
                                        item.label
                                    }
                                    className="rounded-[13px] border border-[#e2e3e8] bg-white px-5 py-5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-[13px] font-medium text-[#777777]">
                                                {
                                                    item.label
                                                }
                                            </p>

                                            <p className="mt-2 text-[23px] font-semibold tracking-[-0.02em] text-[#171717]">
                                                {
                                                    item.value
                                                }
                                            </p>
                                        </div>

                                        <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#f5f7fb] text-[#646b78]">
                                            <Icon
                                                size={18}
                                                strokeWidth={1.7}
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        }
                    )}
                </div>


                <div className="mt-6 overflow-hidden rounded-[14px] border border-[#e1e2e7] bg-white">

                    <div className="border-b border-[#ececf0] px-5">
                        <div className="flex items-center gap-7 overflow-x-auto">
                            {tabs.map(
                                (tab) => (
                                    <button
                                        key={
                                            tab.key
                                        }
                                        type="button"
                                        onClick={() =>
                                            handleTabChange(
                                                tab.key
                                            )
                                        }
                                        className={`relative flex h-[56px] items-center gap-2 whitespace-nowrap text-[14px] font-medium ${
                                            activeTab ===
                                            tab.key
                                                ? "text-[#2563eb]"
                                                : "text-[#686868]"
                                        }`}
                                    >
                                        {
                                            tab.label
                                        }

                                        <span
                                            className={`rounded-full px-2 py-[2px] text-[11px] ${
                                                activeTab ===
                                                tab.key
                                                    ? "bg-[#edf4ff] text-[#2563eb]"
                                                    : "bg-[#f2f2f3] text-[#777777]"
                                            }`}
                                        >
                                            {
                                                tab.count
                                            }
                                        </span>

                                        {activeTab ===
                                            tab.key && (
                                            <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#2563eb]" />
                                        )}
                                    </button>
                                )
                            )}
                        </div>
                    </div>


                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#eeeeef] px-5 py-4">

                        <div className="relative w-full max-w-[360px]">
                            <Search
                                size={17}
                                strokeWidth={1.8}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#929292]"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(
                                        event.target.value
                                    )
                                }
                                placeholder="Search products"
                                className="h-[40px] w-full rounded-[9px] border border-[#dedfe4] bg-white pl-10 pr-4 text-[14px] text-[#222222] outline-none transition placeholder:text-[#999999] focus:border-[#a7bce8] focus:ring-2 focus:ring-[#edf3ff]"
                            />
                        </div>


                        <select
                            value={sort}
                            onChange={(event) =>
                                setSort(
                                    event.target.value
                                )
                            }
                            className="h-[40px] min-w-[150px] rounded-[9px] border border-[#dedfe4] bg-white px-3 text-[13px] text-[#444444] outline-none"
                        >
                            <option value="recent">
                                Most recent
                            </option>

                            <option value="oldest">
                                Oldest
                            </option>

                            <option value="name_asc">
                                Name A-Z
                            </option>

                            <option value="name_desc">
                                Name Z-A
                            </option>
                        </select>

                    </div>


                    {error && (
                        <div className="mx-5 mt-5 rounded-[10px] border border-[#ffd6d6] bg-[#fff6f6] px-4 py-3 text-[13px] text-[#d63636]">
                            {error}
                        </div>
                    )}


                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px]">

                            <thead>
                                <tr className="border-b border-[#ececf0] bg-[#fbfbfc]">

                                    <th className="px-5 py-3 text-left text-[12px] font-medium text-[#777777]">
                                        Product
                                    </th>

                                    <th className="px-4 py-3 text-left text-[12px] font-medium text-[#777777]">
                                        Category
                                    </th>

                                    <th className="px-4 py-3 text-left text-[12px] font-medium text-[#777777]">
                                        Status
                                    </th>

                                    <th className="px-4 py-3 text-left text-[12px] font-medium text-[#777777]">
                                        Inventory
                                    </th>

                                    <th className="px-4 py-3 text-left text-[12px] font-medium text-[#777777]">
                                        Price
                                    </th>

                                    <th className="px-4 py-3 text-left text-[12px] font-medium text-[#777777]">
                                        Available In
                                    </th>

                                    <th className="px-5 py-3 text-right text-[12px] font-medium text-[#777777]">
                                        Actions
                                    </th>

                                </tr>
                            </thead>


                            <tbody>

                                {loading ? (
                                    <LoadingRows />
                                ) : products.length ===
                                  0 ? (
                                    <EmptyProducts
                                        search={
                                            debouncedSearch
                                        }
                                        onAdd={() =>
                                            navigate(
                                                "/vendor/products/create"
                                            )
                                        }
                                    />
                                ) : (
                                    products.map(
                                        (product) => (
                                            <ProductRow
                                                key={
                                                    product.id
                                                }
                                                product={
                                                    product
                                                }
                                                onView={() =>
                                                    handleView(
                                                        product
                                                    )
                                                }
                                                onEdit={() =>
                                                    handleEdit(
                                                        product
                                                    )
                                                }
                                                onDelete={() =>
                                                    setDeleteProduct(
                                                        product
                                                    )
                                                }
                                            />
                                        )
                                    )
                                )}

                            </tbody>

                        </table>
                    </div>


                    {!loading &&
                        products.length >
                            0 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#ececf0] px-5 py-4">

                                <p className="text-[13px] text-[#777777]">
                                    Showing{" "}
                                    {pagination.from ||
                                        0}{" "}
                                    to{" "}
                                    {pagination.to ||
                                        0}{" "}
                                    of{" "}
                                    {
                                        pagination.total
                                    }{" "}
                                    products
                                </p>


                                <div className="flex items-center gap-2">

                                    <button
                                        type="button"
                                        disabled={
                                            pagination.current_page <=
                                            1
                                        }
                                        onClick={() =>
                                            fetchProducts(
                                                pagination.current_page -
                                                    1
                                            )
                                        }
                                        className="h-[36px] rounded-[8px] border border-[#dedfe4] bg-white px-4 text-[13px] font-medium text-[#444444] transition hover:bg-[#f8f8f9] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>


                                    <div className="flex h-[36px] min-w-[36px] items-center justify-center rounded-[8px] border border-[#dce5f7] bg-[#f3f7ff] px-3 text-[13px] font-semibold text-[#2563eb]">
                                        {
                                            pagination.current_page
                                        }
                                    </div>


                                    <button
                                        type="button"
                                        disabled={
                                            pagination.current_page >=
                                            pagination.last_page
                                        }
                                        onClick={() =>
                                            fetchProducts(
                                                pagination.current_page +
                                                    1
                                            )
                                        }
                                        className="h-[36px] rounded-[8px] border border-[#dedfe4] bg-white px-4 text-[13px] font-medium text-[#444444] transition hover:bg-[#f8f8f9] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>

                                </div>

                            </div>
                        )}

                </div>
            </div>


            {deleteProduct && (
                <DeleteModal
                    product={
                        deleteProduct
                    }
                    deleting={
                        deleting
                    }
                    onClose={() => {
                        if (!deleting) {
                            setDeleteProduct(
                                null
                            );
                        }
                    }}
                    onDelete={
                        handleDelete
                    }
                />
            )}

        </div>
    );
};


const ProductRow = ({
    product,
    onView,
    onEdit,
    onDelete,
}) => {
    return (
        <tr className="border-b border-[#eeeeef] transition last:border-b-0 hover:bg-[#fcfcfd]">

            <td className="px-5 py-4">
                <div className="flex items-center gap-3">

                    <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[9px] border border-[#e4e5e9] bg-[#f7f7f8]">
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
                                strokeWidth={1.6}
                                className="text-[#969696]"
                            />
                        )}
                    </div>


                    <div className="min-w-0">

                        <p className="max-w-[280px] truncate text-[14px] font-semibold text-[#222222]">
                            {
                                product.title
                            }
                        </p>

                        {product.variants_count >
                            0 && (
                            <p className="mt-1 text-[11px] text-[#888888]">
                                {
                                    product.variants_count
                                }{" "}
                                variants
                            </p>
                        )}

                    </div>

                </div>
            </td>


            <td className="px-4 py-4 text-[13px] text-[#555555]">
                {product.category?.name ||
                    "Uncategorized"}
            </td>


            <td className="px-4 py-4">
                <StatusBadge
                    status={
                        product.status
                    }
                />
            </td>


            <td className="px-4 py-4">

                <p className="text-[13px] font-medium text-[#333333]">
                    {
                        product.inventory_label
                    }
                </p>

                {product.inventory >
                    0 && (
                    <p className="mt-1 text-[11px] text-[#888888]">
                        {
                            product.inventory
                        }{" "}
                        units
                    </p>
                )}

            </td>


            <td className="px-4 py-4 text-[14px] font-semibold text-[#242424]">
                {
                    product.formatted_price
                }
            </td>


            <td className="px-4 py-4">

                <div className="flex flex-wrap items-center gap-2">

                    {product.point_of_sale && (
                        <ChannelBadge>
                            In-store
                        </ChannelBadge>
                    )}

                    {product.online_store && (
                        <ChannelBadge>
                            Online
                        </ChannelBadge>
                    )}

                    {!product.online_store &&
                        !product.point_of_sale && (
                            <span className="text-[12px] text-[#999999]">
                                Not available
                            </span>
                        )}

                </div>

            </td>


            <td className="px-5 py-4">

                <div className="flex justify-end">

                    <div className="inline-flex overflow-hidden rounded-[9px] border border-[#dedfe4] bg-white">

                        <button
                            type="button"
                            onClick={
                                onView
                            }
                            title="View product"
                            aria-label="View product"
                            className="flex h-[34px] w-[36px] items-center justify-center text-[#707070] transition hover:bg-[#f7f8fa] hover:text-[#2563eb]"
                        >
                            <Eye
                                size={15}
                                strokeWidth={1.8}
                            />
                        </button>


                        <button
                            type="button"
                            onClick={
                                onEdit
                            }
                            title="Edit product"
                            aria-label="Edit product"
                            className="flex h-[34px] w-[36px] items-center justify-center border-l border-[#dedfe4] text-[#707070] transition hover:bg-[#f7f8fa] hover:text-[#2563eb]"
                        >
                            <Pencil
                                size={15}
                                strokeWidth={1.8}
                            />
                        </button>


                        <button
                            type="button"
                            onClick={
                                onDelete
                            }
                            title="Delete product"
                            aria-label="Delete product"
                            className="flex h-[34px] w-[36px] items-center justify-center border-l border-[#dedfe4] text-[#8a8a8a] transition hover:bg-[#fff5f5] hover:text-[#dc4444]"
                        >
                            <Trash2
                                size={15}
                                strokeWidth={1.8}
                            />
                        </button>

                    </div>

                </div>

            </td>

        </tr>
    );
};


const StatusBadge = ({
    status,
}) => {
    const styles = {
        active:
            "bg-[#e3f8ec] text-[#16804b]",

        draft:
            "bg-[#f0f1f3] text-[#686868]",

        archived:
            "bg-[#fff0d9] text-[#aa6500]",
    };

    const labels = {
        active: "Active",
        draft: "Draft",
        archived: "Archived",
    };

    return (
        <span
            className={`inline-flex rounded-full px-[10px] py-[4px] text-[11px] font-medium ${
                styles[status] ||
                "bg-[#f0f1f3] text-[#666666]"
            }`}
        >
            {labels[status] ||
                status}
        </span>
    );
};


const ChannelBadge = ({
    children,
}) => {
    return (
        <span className="inline-flex rounded-full border border-[#dfe6f4] bg-[#f7f9fd] px-[9px] py-[4px] text-[11px] font-medium text-[#51617d]">
            {children}
        </span>
    );
};


const LoadingRows = () => {
    return Array.from({
        length: 5,
    }).map((_, index) => (
        <tr
            key={index}
            className="border-b border-[#eeeeef]"
        >
            <td
                colSpan="7"
                className="px-5 py-4"
            >
                <div className="h-[52px] animate-pulse rounded-[8px] bg-[#f3f3f5]" />
            </td>
        </tr>
    ));
};


const EmptyProducts = ({
    search,
    onAdd,
}) => {
    return (
        <tr>
            <td
                colSpan="7"
                className="px-6 py-16"
            >
                <div className="mx-auto flex max-w-[420px] flex-col items-center text-center">

                    <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full bg-[#f3f6fc] text-[#62708a]">
                        <Package
                            size={24}
                            strokeWidth={1.6}
                        />
                    </div>


                    <h3 className="mt-4 text-[17px] font-semibold text-[#222222]">
                        {search
                            ? "No products found"
                            : "No products yet"}
                    </h3>


                    <p className="mt-2 text-[13px] leading-6 text-[#777777]">
                        {search
                            ? "Try changing your search or switching to another product tab."
                            : "Add your first product to start selling through your Storify store."}
                    </p>


                    {!search && (
                        <button
                            type="button"
                            onClick={
                                onAdd
                            }
                            className="mt-5 flex h-[38px] items-center gap-2 rounded-[8px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white transition hover:bg-[#1d56cc]"
                        >
                            <Plus
                                size={16}
                            />

                            Add Product
                        </button>
                    )}

                </div>
            </td>
        </tr>
    );
};


const DeleteModal = ({
    product,
    deleting,
    onClose,
    onDelete,
}) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/35 px-4">

            <div className="relative w-full max-w-[470px] overflow-hidden rounded-[18px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.2)]">

                <div className="h-[4px] w-full bg-[#ef4444]" />


                <button
                    type="button"
                    onClick={
                        onClose
                    }
                    disabled={
                        deleting
                    }
                    className="absolute right-4 top-5 flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#777777] transition hover:bg-[#f4f4f5] disabled:opacity-40"
                >
                    <X
                        size={18}
                    />
                </button>


                <div className="px-6 pb-6 pt-7">

                    <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#fff0f0] text-[#e54848]">
                        <Trash2
                            size={22}
                            strokeWidth={1.8}
                        />
                    </div>


                    <h3 className="mt-5 text-[20px] font-semibold text-[#202020]">
                        Delete Product
                    </h3>


                    <p className="mt-2 max-w-[390px] text-[14px] leading-6 text-[#6f6f6f]">
                        Are you sure you want
                        to delete{" "}
                        <span className="font-semibold text-[#333333]">
                            {
                                product.title
                            }
                        </span>
                        ? This action cannot
                        be undone.
                    </p>


                    <div className="mt-7 flex items-center justify-end gap-3">

                        <button
                            type="button"
                            onClick={
                                onClose
                            }
                            disabled={
                                deleting
                            }
                            className="h-[42px] min-w-[110px] rounded-[9px] border border-[#dadce1] bg-white px-5 text-[14px] font-semibold text-[#444444] transition hover:bg-[#f8f8f8] disabled:opacity-50"
                        >
                            Cancel
                        </button>


                        <button
                            type="button"
                            onClick={
                                onDelete
                            }
                            disabled={
                                deleting
                            }
                            className="h-[42px] min-w-[120px] rounded-[9px] bg-[#e54848] px-5 text-[14px] font-semibold text-white transition hover:bg-[#d83c3c] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {deleting
                                ? "Deleting..."
                                : "Delete"}
                        </button>

                    </div>

                </div>
            </div>

        </div>
    );
};


export default VendorProducts;