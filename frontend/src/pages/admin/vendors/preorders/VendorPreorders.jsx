import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    CreditCard,
    Eye,
    MoreHorizontal,
    PackageCheck,
    PackageOpen,
    Search,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../../../api/axios";

const tabs = [
    {
        key: "all",
        label: "All",
    },
    {
        key: "reserved",
        label: "Reserved",
    },
    {
        key: "payment_due",
        label: "Payment due",
    },
    {
        key: "delayed",
        label: "Delayed",
    },
    {
        key: "ready",
        label: "Ready",
    },
    {
        key: "due_soon",
        label: "Due soon",
    },
    {
        key: "overdue",
        label: "Overdue",
    },
    {
        key: "cancelled",
        label: "Cancelled",
    },
];

export default function VendorPreOrders() {
    const navigate = useNavigate();
    const menuRef = useRef(null);

    const [preorders, setPreorders] = useState([]);
    const [stats, setStats] = useState({
        preorders: 0,
        reserved: 0,
        payment_due: 0,
        ready: 0,
        due_soon: 0,
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
    const [searchInput, setSearchInput] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null);

    useEffect(() => {
        fetchPreorders(1);
    }, [activeTab, search]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target)
            ) {
                setOpenMenuId(null);
                setMenuPosition(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    useEffect(() => {
        if (!openMenuId) {
            return;
        }

        const closeMenu = () => {
            setOpenMenuId(null);
            setMenuPosition(null);
        };

        window.addEventListener("resize", closeMenu);
        window.addEventListener("scroll", closeMenu, true);

        return () => {
            window.removeEventListener("resize", closeMenu);
            window.removeEventListener("scroll", closeMenu, true);
        };
    }, [openMenuId]);

    const fetchPreorders = async (page = 1) => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/vendor/preorders", {
                params: {
                    tab: activeTab,
                    search,
                    page,
                    per_page: 10,
                },
            });

            setPreorders(
                response.data.preorders || []
            );

            setStats(
                response.data.stats || {
                    preorders: 0,
                    reserved: 0,
                    payment_due: 0,
                    ready: 0,
                    due_soon: 0,
                }
            );

            setPagination(
                response.data.pagination || {
                    current_page: 1,
                    last_page: 1,
                    per_page: 10,
                    total: 0,
                    from: null,
                    to: null,
                }
            );
        } catch (err) {
            console.error(err);

            setError(
                err.response?.data?.message ||
                "Unable to load pre-orders."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event) => {
        event.preventDefault();

        setSearch(
            searchInput.trim()
        );
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setOpenMenuId(null);
        setMenuPosition(null);
    };

    const handleViewOrder = (preorder) => {
        setOpenMenuId(null);
        setMenuPosition(null);

        if (!preorder.order_id) {
            return;
        }

        navigate(
            `/vendor/orders/${preorder.order_id}`
        );
    };

    const toggleMenu = (id, event) => {
        event.stopPropagation();

        if (openMenuId === id) {
            setOpenMenuId(null);
            setMenuPosition(null);

            return;
        }

        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();

        const menuWidth = 192;
        const menuHeight = 52;
        const gap = 8;
        const viewportPadding = 12;

        let left = rect.right - menuWidth;

        if (left < viewportPadding) {
            left = viewportPadding;
        }

        if (left + menuWidth > window.innerWidth - viewportPadding) {
            left =
                window.innerWidth -
                menuWidth -
                viewportPadding;
        }

        let top = rect.bottom + gap;

        if (
            top + menuHeight >
            window.innerHeight - viewportPadding
        ) {
            top = Math.max(
                viewportPadding,
                rect.top - menuHeight - gap
            );
        }

        setMenuPosition({
            top,
            left,
        });

        setOpenMenuId(id);
    };

    const formatCurrency = (value, currency = "USD") => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currency || "USD",
        }).format(
            Number(value || 0)
        );
    };

    const formatDate = (value) => {
        if (!value) {
            return "Not set";
        }

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
            return value;
        }

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const formatStatus = (value) => {
        if (!value) {
            return "Unknown";
        }

        return String(value)
            .replaceAll("_", " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
    };

    const getStatusClass = (status) => {
        const value = String(status || "").toLowerCase();

        if (value === "reserved") {
            return "bg-blue-50 text-blue-700 border-blue-200";
        }

        if (value === "payment_due") {
            return "bg-amber-50 text-amber-700 border-amber-200";
        }

        if (value === "ready") {
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        }

        if (value === "delayed") {
            return "bg-orange-50 text-orange-700 border-orange-200";
        }

        if (value === "cancelled") {
            return "bg-red-50 text-red-700 border-red-200";
        }

        if (value === "paid") {
            return "bg-emerald-50 text-emerald-700 border-emerald-200";
        }

        if (
            value === "pending" ||
            value === "unpaid"
        ) {
            return "bg-amber-50 text-amber-700 border-amber-200";
        }

        if (
            value === "fulfilled" ||
            value === "shipped"
        ) {
            return "bg-purple-50 text-purple-700 border-purple-200";
        }

        return "bg-gray-50 text-gray-700 border-gray-200";
    };

    return (
        <div className="min-h-screen bg-[#f7f7f8]">
            <div className="mx-auto max-w-[1600px] px-6 py-7">
                <div className="mb-7 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900">
                            Pre-orders
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Manage reservations, payments and upcoming fulfillment.
                        </p>
                    </div>
                </div>

                <StatsGrid stats={stats} />

                <div className="mt-6 overflow-visible rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="border-b border-gray-200 px-5">
                        <div className="flex gap-6 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`relative whitespace-nowrap py-4 text-sm font-medium transition ${
                                        activeTab === tab.key
                                            ? "text-gray-900"
                                            : "text-gray-500 hover:text-gray-800"
                                    }`}
                                >
                                    {tab.label}

                                    {activeTab === tab.key && (
                                        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-gray-900" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
                        <form
                            onSubmit={handleSearch}
                            className="relative w-full max-w-md"
                        >
                            <Search
                                size={18}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                            />

                            <input
                                type="text"
                                value={searchInput}
                                onChange={(event) =>
                                    setSearchInput(event.target.value)
                                }
                                placeholder="Search pre-orders"
                                className="h-10 w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-gray-500 focus:ring-2 focus:ring-gray-100"
                            />
                        </form>

                        <div className="text-sm text-gray-500">
                            {pagination.total} pre-orders
                        </div>
                    </div>

                    {error && (
                        <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1250px] border-collapse">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/70 text-left">
                                    <TableHead>
                                        Pre-order
                                    </TableHead>

                                    <TableHead>
                                        Customer
                                    </TableHead>

                                    <TableHead>
                                        Items
                                    </TableHead>

                                    <TableHead>
                                        Expected
                                    </TableHead>

                                    <TableHead>
                                        Pre-order status
                                    </TableHead>

                                    <TableHead>
                                        Fulfillment
                                    </TableHead>

                                    <TableHead>
                                        Payment
                                    </TableHead>

                                    <TableHead>
                                        Terms
                                    </TableHead>

                                    <TableHead className="text-right">
                                        Total
                                    </TableHead>

                                    <TableHead className="w-16" />
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <LoadingRows />
                                ) : preorders.length === 0 ? (
                                    <EmptyState />
                                ) : (
                                    preorders.map((preorder) => (
                                        <tr
                                            key={preorder.id}
                                            className="border-b border-gray-100 transition last:border-b-0 hover:bg-gray-50/60"
                                        >
                                            <td className="px-5 py-4">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleViewOrder(preorder)
                                                    }
                                                    className="font-medium text-gray-900 hover:underline"
                                                >
                                                    {preorder.order_no || `#${preorder.id}`}
                                                </button>

                                                <div className="mt-1 text-xs text-gray-500">
                                                    {formatDate(
                                                        preorder.placed_at ||
                                                        preorder.created_at
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="font-medium text-gray-800">
                                                    {preorder.customer?.name || "Customer"}
                                                </div>

                                                <div className="mt-1 max-w-[210px] truncate text-xs text-gray-500">
                                                    {preorder.customer?.email || "No email"}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="max-w-[220px] text-sm text-gray-800">
                                                    {preorder.items_summary || "No items"}
                                                </div>

                                                <div className="mt-1 text-xs text-gray-500">
                                                    {preorder.reserved_quantity || 0} reserved
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                                    <CalendarDays
                                                        size={15}
                                                        className="text-gray-400"
                                                    />

                                                    {formatDate(
                                                        preorder.expected_at
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    status={
                                                        preorder.preorder_status
                                                    }
                                                    getStatusClass={
                                                        getStatusClass
                                                    }
                                                    formatStatus={
                                                        formatStatus
                                                    }
                                                />
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    status={
                                                        preorder.fulfillment_status
                                                    }
                                                    getStatusClass={
                                                        getStatusClass
                                                    }
                                                    formatStatus={
                                                        formatStatus
                                                    }
                                                />
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    status={
                                                        preorder.payment_status
                                                    }
                                                    getStatusClass={
                                                        getStatusClass
                                                    }
                                                    formatStatus={
                                                        formatStatus
                                                    }
                                                />

                                                {Number(preorder.balance_due || 0) > 0 && (
                                                    <div className="mt-1 text-xs text-gray-500">
                                                        Due{" "}
                                                        {formatCurrency(
                                                            preorder.balance_due,
                                                            preorder.currency
                                                        )}
                                                    </div>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="text-sm font-medium text-gray-700">
                                                    {formatStatus(
                                                        preorder.payment_terms
                                                    )}
                                                </div>

                                                {preorder.payment_terms === "deposit" &&
                                                    preorder.deposit_amount !== null && (
                                                        <div className="mt-1 text-xs text-gray-500">
                                                            Deposit{" "}
                                                            {formatCurrency(
                                                                preorder.deposit_amount,
                                                                preorder.currency
                                                            )}
                                                        </div>
                                                    )}
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <div className="font-medium text-gray-900">
                                                    {formatCurrency(
                                                        preorder.grand_total,
                                                        preorder.currency
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-4">
                                                <button
                                                    type="button"
                                                    onMouseDown={(event) =>
                                                        event.stopPropagation()
                                                    }
                                                    onClick={(event) =>
                                                        toggleMenu(
                                                            preorder.id,
                                                            event
                                                        )
                                                    }
                                                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
                                                    aria-label="Open pre-order actions"
                                                    aria-expanded={
                                                        openMenuId === preorder.id
                                                    }
                                                >
                                                    <MoreHorizontal size={18} />
                                                </button>

                                                {openMenuId === preorder.id &&
                                                    menuPosition &&
                                                    createPortal(
                                                        <PreorderActionsMenu
                                                            menuRef={menuRef}
                                                            position={menuPosition}
                                                            preorder={preorder}
                                                            onViewOrder={
                                                                handleViewOrder
                                                            }
                                                        />,
                                                        document.body
                                                    )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && pagination.total > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4">
                            <div className="text-sm text-gray-500">
                                Showing{" "}
                                {pagination.from || 0}
                                {" - "}
                                {pagination.to || 0}
                                {" of "}
                                {pagination.total}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={pagination.current_page <= 1}
                                    onClick={() =>
                                        fetchPreorders(
                                            pagination.current_page - 1
                                        )
                                    }
                                    className="flex h-9 items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft size={16} />
                                    Previous
                                </button>

                                <div className="flex h-9 min-w-9 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-medium text-gray-700">
                                    {pagination.current_page}
                                    {" / "}
                                    {pagination.last_page}
                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        pagination.current_page >=
                                        pagination.last_page
                                    }
                                    onClick={() =>
                                        fetchPreorders(
                                            pagination.current_page + 1
                                        )
                                    }
                                    className="flex h-9 items-center gap-1 rounded-lg border border-gray-300 bg-white px-3 text-sm font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


function PreorderActionsMenu({
    menuRef,
    position,
    preorder,
    onViewOrder,
}) {
    return (
        <div
            ref={menuRef}
            className="fixed z-[9999] w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-xl"
            style={{
                top: position.top,
                left: position.left,
            }}
            onMouseDown={(event) =>
                event.stopPropagation()
            }
        >
            <button
                type="button"
                onClick={() =>
                    onViewOrder(preorder)
                }
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition hover:bg-gray-50"
            >
                <Eye size={16} />

                View order
            </button>
        </div>
    );
}


function StatsGrid({ stats }) {
    const cards = [
        {
            label: "Pre-orders",
            value: stats.preorders || 0,
            icon: PackageOpen,
        },
        {
            label: "Reserved",
            value: stats.reserved || 0,
            icon: PackageCheck,
        },
        {
            label: "Payment due",
            value: stats.payment_due || 0,
            icon: CreditCard,
        },
        {
            label: "Ready",
            value: stats.ready || 0,
            icon: PackageCheck,
        },
        {
            label: "Due soon",
            value: stats.due_soon || 0,
            icon: Clock3,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.label}
                        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-sm font-medium text-gray-500">
                                    {card.label}
                                </div>

                                <div className="mt-2 text-2xl font-semibold text-gray-900">
                                    {card.value}
                                </div>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                                <Icon size={19} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function StatusBadge({
    status,
    getStatusClass,
    formatStatus,
}) {
    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                status
            )}`}
        >
            {formatStatus(status)}
        </span>
    );
}

function TableHead({
    children,
    className = "",
}) {
    return (
        <th
            className={`px-5 py-3.5 text-xs font-semibold uppercase tracking-wide text-gray-500 ${className}`}
        >
            {children}
        </th>
    );
}

function LoadingRows() {
    return Array.from({
        length: 6,
    }).map((_, index) => (
        <tr
            key={index}
            className="border-b border-gray-100"
        >
            {Array.from({
                length: 10,
            }).map((__, cellIndex) => (
                <td
                    key={cellIndex}
                    className="px-5 py-5"
                >
                    <div className="h-4 animate-pulse rounded bg-gray-100" />
                </td>
            ))}
        </tr>
    ));
}

function EmptyState() {
    return (
        <tr>
            <td
                colSpan="10"
                className="px-6 py-16 text-center"
            >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <PackageOpen size={22} />
                </div>

                <h3 className="mt-4 text-sm font-semibold text-gray-900">
                    No pre-orders found
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                    Pre-orders matching this filter will appear here.
                </p>
            </td>
        </tr>
    );
}
