import {
    BadgeCheck,
    Box,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    Clock3,
    Eye,
    LoaderCircle,
    MoreVertical,
    ReceiptText,
    Search,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

import api from "../../../api/axios";


const VendorOrders = () => {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);

    const [stats, setStats] = useState({
        total_orders: 0,
        open_orders: 0,
        paid_orders: 0,
        total_revenue: 0,
        average_order_value: 0,
    });

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
    });

    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openMenu, setOpenMenu] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null);


    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders(1);
        }, search.trim() ? 400 : 0);

        return () => {
            clearTimeout(timer);
        };
    }, [activeTab, search]);


    useEffect(() => {
        const closeMenu = () => {
            setOpenMenu(null);
            setMenuPosition(null);
        };

        const handleScroll = () => {
            closeMenu();
        };

        const handleResize = () => {
            closeMenu();
        };

        document.addEventListener(
            "click",
            closeMenu
        );

        window.addEventListener(
            "resize",
            handleResize
        );

        window.addEventListener(
            "scroll",
            handleScroll,
            true
        );

        return () => {
            document.removeEventListener(
                "click",
                closeMenu
            );

            window.removeEventListener(
                "resize",
                handleResize
            );

            window.removeEventListener(
                "scroll",
                handleScroll,
                true
            );
        };
    }, []);


    const fetchOrders = async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/vendor/orders",
                {
                    params: {
                        tab: activeTab,
                        search: search.trim(),
                        page,
                        per_page: 15,
                    },
                }
            );

            const data = response.data || {};
            const orderResponse = data.orders || {};

            setStats({
                total_orders:
                    data.stats?.total_orders || 0,

                open_orders:
                    data.stats?.open_orders || 0,

                paid_orders:
                    data.stats?.paid_orders || 0,

                total_revenue:
                    data.stats?.total_revenue || 0,

                average_order_value:
                    data.stats?.average_order_value || 0,
            });

            setOrders(
                orderResponse.data || []
            );

            setPagination({
                current_page:
                    orderResponse.current_page || 1,

                last_page:
                    orderResponse.last_page || 1,

                per_page:
                    orderResponse.per_page || 15,

                total:
                    orderResponse.total || 0,
            });
        } catch (error) {
            console.error(
                "Vendor orders fetch error:",
                error.response?.data ||
                error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to load orders."
            );

            setOrders([]);

            setStats({
                total_orders: 0,
                open_orders: 0,
                paid_orders: 0,
                total_revenue: 0,
                average_order_value: 0,
            });
        } finally {
            setLoading(false);
        }
    };


    const closeActionMenu = () => {
        setOpenMenu(null);
        setMenuPosition(null);
    };


    const handleTabChange = (tab) => {
        setActiveTab(tab);
        closeActionMenu();
    };


    const handlePageChange = (page) => {
        if (page < 1) {
            return;
        }

        if (page > pagination.last_page) {
            return;
        }

        closeActionMenu();

        fetchOrders(page);
    };


    const handleMenuToggle = (
        event,
        orderId
    ) => {
        event.stopPropagation();

        if (openMenu === orderId) {
            closeActionMenu();
            return;
        }

        const button = event.currentTarget;
        const rect = button.getBoundingClientRect();

        const menuWidth = 170;
        const menuHeight = 48;
        const gap = 7;
        const padding = 12;

        let left =
            rect.right - menuWidth;

        let top =
            rect.bottom + gap;

        if (left < padding) {
            left = padding;
        }

        if (
            left + menuWidth >
            window.innerWidth - padding
        ) {
            left =
                window.innerWidth -
                menuWidth -
                padding;
        }

        const spaceBelow =
            window.innerHeight -
            rect.bottom;

        if (
            spaceBelow <
            menuHeight + gap
        ) {
            top =
                rect.top -
                menuHeight -
                gap;
        }

        if (top < padding) {
            top = padding;
        }

        setOpenMenu(orderId);

        setMenuPosition({
            top,
            left,
        });
    };


    const handleViewDetails = (orderId) => {
        closeActionMenu();

        navigate(
            `/vendor/orders/${orderId}`
        );
    };


    const tabs = [
        {
            key: "all",
            label: "All",
        },
        {
            key: "unfulfilled",
            label: "Unfulfilled",
        },
        {
            key: "unpaid",
            label: "Unpaid",
        },
        {
            key: "open",
            label: "Open",
        },
        {
            key: "archived",
            label: "Archived",
        },
    ];


    return (
        <div className="min-h-screen bg-[#f7f7f8] p-[24px]">

            <div className="mx-auto max-w-[1600px]">

                <OrderStats
                    stats={stats}
                />

                <div className="mt-[16px] rounded-[16px] border border-[#dedede] bg-white">

                    <div className="flex items-center justify-between px-[24px] py-[22px]">

                        <h1 className="text-[22px] font-semibold text-[#171717]">
                            Orders
                        </h1>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/vendor/orders/create"
                                )
                            }
                            className="flex h-[40px] items-center gap-[8px] rounded-[10px] bg-[#2467d5] px-[18px] text-[14px] font-semibold text-white transition hover:bg-[#1d59bc]"
                        >
                            <span className="text-[21px] font-light">
                                +
                            </span>

                            Create Order
                        </button>

                    </div>


                    <div className="border-t border-[#eeeeee]">

                        <div className="flex items-center gap-[28px] px-[24px] pt-[18px]">

                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => {
                                        handleTabChange(
                                            tab.key
                                        );
                                    }}
                                    className={`relative pb-[16px] text-[14px] ${
                                        activeTab === tab.key
                                            ? "font-semibold text-[#171717]"
                                            : "font-medium text-[#666]"
                                    }`}
                                >
                                    {tab.label}

                                    {activeTab === tab.key && (
                                        <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#171717]" />
                                    )}
                                </button>
                            ))}

                            <div className="ml-auto pb-[13px] text-[16px] text-[#555]">
                                ⇅
                            </div>

                        </div>


                        <div className="border-t border-[#eeeeee] px-[16px] py-[12px]">

                            <div className="flex items-center justify-between gap-[20px]">

                                <div className="relative w-full max-w-[520px]">

                                    <Search
                                        size={17}
                                        className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#777]"
                                    />

                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(event) => {
                                            setSearch(
                                                event.target.value
                                            );
                                        }}
                                        placeholder="Search by order number"
                                        className="h-[42px] w-full rounded-[10px] border border-[#d8d8d8] bg-white pl-[40px] pr-[14px] text-[14px] text-[#222] outline-none transition focus:border-[#2467d5]"
                                    />

                                </div>


                                <div className="flex items-center gap-[10px]">

                                    <button
                                        type="button"
                                        className="flex h-[40px] items-center gap-[8px] rounded-[9px] border border-[#dedede] bg-white px-[14px] text-[13px] font-medium text-[#222] transition hover:bg-[#f8f8f8]"
                                    >
                                        <span>
                                            ↕
                                        </span>

                                        <span>
                                            Import / Export
                                        </span>

                                        <span>
                                            ⌄
                                        </span>
                                    </button>


                                    <button
                                        type="button"
                                        className="flex h-[40px] items-center gap-[7px] rounded-[9px] border border-[#dedede] bg-white px-[14px] text-[13px] font-medium text-[#222] transition hover:bg-[#f8f8f8]"
                                    >
                                        <span>
                                            ☷
                                        </span>

                                        Filter
                                    </button>

                                </div>

                            </div>

                        </div>


                        {error && (
                            <div className="mx-[16px] mb-[14px] rounded-[9px] border border-red-200 bg-red-50 px-[14px] py-[11px] text-[13px] text-red-600">
                                {error}
                            </div>
                        )}


                        <OrdersTable
                            orders={orders}
                            loading={loading}
                            openMenu={openMenu}
                            menuPosition={menuPosition}
                            onMenuToggle={handleMenuToggle}
                            onViewDetails={handleViewDetails}
                        />


                        <Pagination
                            pagination={pagination}
                            onPageChange={handlePageChange}
                        />

                    </div>

                </div>

            </div>

        </div>
    );
};


const OrderStats = ({ stats }) => {
    const totalOrders =
        Number(stats.total_orders || 0);

    const openOrders =
        Number(stats.open_orders || 0);

    const paidOrders =
        Number(stats.paid_orders || 0);

    const totalRevenue =
        Number(stats.total_revenue || 0);

    const averageOrderValue =
        Number(stats.average_order_value || 0);


    return (
        <div className="grid grid-cols-1 overflow-hidden rounded-[16px] border border-[#dedede] bg-white md:grid-cols-2 xl:grid-cols-5">

            <StatCard
                title="Total Orders"
                value={formatNumber(totalOrders)}
                subtitle="All order records"
                icon={
                    <ReceiptText
                        size={21}
                        className="text-[#2467d5]"
                    />
                }
                iconClass="bg-[#e8f1ff]"
            />


            <StatCard
                title="Open Orders"
                value={formatNumber(openOrders)}
                subtitle="Pending, processing, or shipped"
                icon={
                    <Clock3
                        size={21}
                        className="text-[#d48400]"
                    />
                }
                iconClass="bg-[#fff3c9]"
            />


            <StatCard
                title="Paid Orders"
                value={formatNumber(paidOrders)}
                subtitle="Payment completed"
                icon={
                    <BadgeCheck
                        size={21}
                        className="text-[#15935a]"
                    />
                }
                iconClass="bg-[#dcfaea]"
            />


            <StatCard
                title="Total Revenue"
                value={formatMoney(totalRevenue)}
                subtitle="Gross paid order value"
                icon={
                    <CircleDollarSign
                        size={21}
                        className="text-[#7045d6]"
                    />
                }
                iconClass="bg-[#eee8ff]"
            />


            <StatCard
                title="Avg. Order Value"
                value={formatMoney(averageOrderValue)}
                subtitle="Revenue per paid order"
                icon={
                    <Box
                        size={21}
                        className="text-[#1697a6]"
                    />
                }
                iconClass="bg-[#daf7fa]"
                last
            />

        </div>
    );
};


const StatCard = ({
    title,
    value,
    subtitle,
    icon,
    iconClass,
    last = false,
}) => {
    return (
        <div
            className={`min-h-[128px] px-[24px] py-[18px] ${
                last
                    ? ""
                    : "border-b border-[#e7e7e7] xl:border-b-0 xl:border-r"
            }`}
        >

            <div className="flex items-start justify-between gap-[15px]">

                <div>

                    <p className="text-[15px] font-medium text-[#222]">
                        {title}
                    </p>

                    <p className="mt-[8px] text-[27px] font-semibold leading-none text-[#101010]">
                        {value}
                    </p>

                    <p className="mt-[12px] text-[13px] text-[#777]">
                        {subtitle}
                    </p>

                </div>


                <div
                    className={`flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full ${iconClass}`}
                >
                    {icon}
                </div>

            </div>

        </div>
    );
};


const OrdersTable = ({
    orders,
    loading,
    openMenu,
    menuPosition,
    onMenuToggle,
    onViewDetails,
}) => {
    if (loading) {
        return (
            <div className="flex min-h-[340px] items-center justify-center border-t border-[#eeeeee]">

                <LoaderCircle
                    size={28}
                    className="animate-spin text-[#2467d5]"
                />

            </div>
        );
    }


    if (!orders.length) {
        return (
            <div className="flex min-h-[340px] flex-col items-center justify-center border-t border-[#eeeeee] px-[20px] text-center">

                <ReceiptText
                    size={38}
                    className="text-[#bbb]"
                />

                <p className="mt-[14px] text-[15px] font-semibold text-[#333]">
                    No orders found
                </p>

                <p className="mt-[5px] text-[13px] text-[#888]">
                    Try changing the current tab or search.
                </p>

            </div>
        );
    }


    return (
        <div className="overflow-x-auto border-t border-[#eeeeee]">

            <table className="w-full min-w-[1050px] border-collapse">

                <thead>

                    <tr className="border-b border-[#e9e9e9] text-left">

                        <th className="w-[48px] px-[16px] py-[14px]">

                            <input
                                type="checkbox"
                                className="h-[15px] w-[15px]"
                            />

                        </th>


                        <TableHead>
                            Order
                        </TableHead>

                        <TableHead>
                            Customer
                        </TableHead>

                        <TableHead>
                            Date ↓
                        </TableHead>

                        <TableHead>
                            Payment
                        </TableHead>

                        <TableHead>
                            Fulfillment
                        </TableHead>

                        <TableHead>
                            Items
                        </TableHead>

                        <TableHead>
                            Net sales
                        </TableHead>


                        <th className="w-[80px] px-[10px] py-[14px] text-center text-[12px] font-medium text-[#707070]">
                            Actions
                        </th>

                    </tr>

                </thead>


                <tbody>

                    {orders.map((order) => {
                        const itemCount =
                            getOrderItemCount(order);

                        const netSales =
                            order.net_sales ??
                            order.grand_total ??
                            0;

                        const fulfillmentStatus =
                            order.delivery_status ||
                            order.fulfillment_status;


                        return (
                            <tr
                                key={order.id}
                                className="border-b border-[#eeeeee] last:border-b-0 hover:bg-[#fcfcfc]"
                            >

                                <td className="px-[16px] py-[14px]">

                                    <input
                                        type="checkbox"
                                        className="h-[15px] w-[15px]"
                                    />

                                </td>


                                <td className="px-[10px] py-[14px]">

                                    <button
                                        type="button"
                                        onClick={() => {
                                            onViewDetails(
                                                order.id
                                            );
                                        }}
                                        className="text-left text-[13px] font-semibold text-[#2467d5] hover:underline"
                                    >
                                        {order.order_no}
                                    </button>

                                    <p className="mt-[2px] text-[11px] text-[#888]">
                                        {formatRelativeDate(
                                            order.placed_at ||
                                            order.created_at
                                        )}
                                    </p>

                                </td>


                                <td className="max-w-[220px] px-[10px] py-[14px]">

                                    <p className="truncate text-[12px] font-medium text-[#333]">
                                        {order.user?.name ||
                                            "Guest Customer"}
                                    </p>

                                    <p className="mt-[2px] truncate text-[11px] text-[#888]">
                                        {order.user?.email || "-"}
                                    </p>

                                </td>


                                <td className="whitespace-nowrap px-[10px] py-[14px] text-[12px] text-[#333]">
                                    {formatDate(
                                        order.placed_at ||
                                        order.created_at
                                    )}
                                </td>


                                <td className="px-[10px] py-[14px]">

                                    <PaymentBadge
                                        status={
                                            order.payment_status
                                        }
                                    />

                                </td>


                                <td className="px-[10px] py-[14px]">

                                    <FulfillmentBadge
                                        status={
                                            fulfillmentStatus
                                        }
                                    />

                                </td>


                                <td className="whitespace-nowrap px-[10px] py-[14px] text-[12px] text-[#333]">
                                    {itemCount}{" "}
                                    {itemCount === 1
                                        ? "item"
                                        : "items"}
                                </td>


                                <td className="whitespace-nowrap px-[10px] py-[14px] text-[12px] font-medium text-[#333]">
                                    {formatMoney(
                                        netSales
                                    )}
                                </td>


                                <td className="px-[10px] py-[14px] text-center">

                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            onMenuToggle(
                                                event,
                                                order.id
                                            );
                                        }}
                                        className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-[#dddddd] bg-white text-[#333] transition hover:bg-[#f4f4f4]"
                                    >
                                        <MoreVertical
                                            size={17}
                                        />
                                    </button>


                                    {openMenu === order.id &&
                                        menuPosition &&
                                        createPortal(
                                            <OrderActionMenu
                                                order={order}
                                                position={menuPosition}
                                                onViewDetails={onViewDetails}
                                            />,
                                            document.body
                                        )}

                                </td>

                            </tr>
                        );
                    })}

                </tbody>

            </table>

        </div>
    );
};


const TableHead = ({ children }) => {
    return (
        <th className="px-[10px] py-[14px] text-[12px] font-medium text-[#707070]">
            {children}
        </th>
    );
};


const OrderActionMenu = ({
    order,
    position,
    onViewDetails,
}) => {
    return (
        <div
            onClick={(event) => {
                event.stopPropagation();
            }}
            style={{
                top: position.top,
                left: position.left,
            }}
            className="fixed z-[9999] w-[170px] overflow-hidden rounded-[12px] border border-[#e3e3e3] bg-white py-[6px] text-left shadow-[0_12px_35px_rgba(0,0,0,0.16)]"
        >

            <button
                type="button"
                onClick={() => {
                    onViewDetails(
                        order.id
                    );
                }}
                className="flex w-full items-center gap-[10px] px-[14px] py-[10px] text-[13px] font-medium text-[#333] transition hover:bg-[#f7f7f8]"
            >
                <Eye
                    size={16}
                    className="text-[#666]"
                />

                View details
            </button>

        </div>
    );
};


const PaymentBadge = ({ status }) => {
    const normalized =
        String(status || "pending")
            .toLowerCase();


    if (normalized === "paid") {
        return (
            <span className="inline-flex items-center gap-[6px] whitespace-nowrap rounded-full bg-[#f0f4f8] px-[10px] py-[5px] text-[11px] font-medium text-[#34465b]">

                <span className="h-[7px] w-[7px] rounded-full bg-[#213750]" />

                Paid
            </span>
        );
    }


    if (normalized === "refunded") {
        return (
            <span className="inline-flex items-center gap-[6px] whitespace-nowrap rounded-full bg-[#e8f1ff] px-[10px] py-[5px] text-[11px] font-medium text-[#245fc5]">

                <span className="h-[7px] w-[7px] rounded-full bg-[#2467d5]" />

                Refunded
            </span>
        );
    }


    if (
        normalized ===
        "partially_refunded"
    ) {
        return (
            <span className="inline-flex items-center gap-[6px] whitespace-nowrap rounded-full bg-[#eee8ff] px-[10px] py-[5px] text-[11px] font-medium text-[#7045d6]">

                <span className="h-[7px] w-[7px] rounded-full bg-[#7045d6]" />

                Partially refunded
            </span>
        );
    }


    if (normalized === "failed") {
        return (
            <span className="inline-flex items-center gap-[6px] whitespace-nowrap rounded-full bg-red-100 px-[10px] py-[5px] text-[11px] font-medium text-red-600">

                <span className="h-[7px] w-[7px] rounded-full bg-red-500" />

                Failed
            </span>
        );
    }


    if (normalized === "cancelled") {
        return (
            <span className="inline-flex items-center gap-[6px] whitespace-nowrap rounded-full bg-[#f2f2f2] px-[10px] py-[5px] text-[11px] font-medium text-[#666]">

                <span className="h-[7px] w-[7px] rounded-full bg-[#777]" />

                Cancelled
            </span>
        );
    }


    return (
        <span className="inline-flex items-center gap-[6px] whitespace-nowrap rounded-full bg-[#fff0bd] px-[10px] py-[5px] text-[11px] font-medium text-[#a96100]">

            <span className="h-[7px] w-[7px] rounded-full bg-[#be7200]" />

            Pending
        </span>
    );
};


const FulfillmentBadge = ({ status }) => {
    const normalized =
        String(status || "unfulfilled")
            .toLowerCase();


    if (
        normalized === "delivered" ||
        normalized === "fulfilled"
    ) {
        return (
            <span className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-full bg-[#dff9ec] px-[10px] py-[5px] text-[11px] font-medium text-[#158457]">

                <Clock3 size={13} />

                {normalized === "delivered"
                    ? "Delivered"
                    : "Fulfilled"}
            </span>
        );
    }


    if (
        normalized === "in_transit" ||
        normalized === "shipped"
    ) {
        return (
            <span className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-full bg-[#e8f1ff] px-[10px] py-[5px] text-[11px] font-medium text-[#2467d5]">

                <Clock3 size={13} />

                {normalized === "in_transit"
                    ? "In transit"
                    : "Shipped"}
            </span>
        );
    }


    if (normalized === "cancelled") {
        return (
            <span className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-full bg-[#ffe4e4] px-[10px] py-[5px] text-[11px] font-medium text-[#dd3434]">

                <Clock3 size={13} />

                Cancelled
            </span>
        );
    }


    return (
        <span className="inline-flex items-center gap-[5px] whitespace-nowrap rounded-full bg-[#f0f4f8] px-[10px] py-[5px] text-[11px] font-medium text-[#536273]">

            <Clock3 size={13} />

            Unfulfilled
        </span>
    );
};


const Pagination = ({
    pagination,
    onPageChange,
}) => {
    if (pagination.last_page <= 1) {
        return null;
    }


    return (
        <div className="flex items-center justify-between border-t border-[#eeeeee] px-[20px] py-[15px]">

            <p className="text-[12px] text-[#777]">
                Page {pagination.current_page} of{" "}
                {pagination.last_page}
                {" · "}
                {pagination.total} orders
            </p>


            <div className="flex items-center gap-[8px]">

                <button
                    type="button"
                    disabled={
                        pagination.current_page <= 1
                    }
                    onClick={() => {
                        onPageChange(
                            pagination.current_page - 1
                        );
                    }}
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-[#dedede] bg-white text-[#444] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={16} />
                </button>


                <button
                    type="button"
                    disabled={
                        pagination.current_page >=
                        pagination.last_page
                    }
                    onClick={() => {
                        onPageChange(
                            pagination.current_page + 1
                        );
                    }}
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-[#dedede] bg-white text-[#444] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronRight size={16} />
                </button>

            </div>

        </div>
    );
};


const getOrderItemCount = (order) => {
    const items =
        Array.isArray(order.items)
            ? order.items
            : [];

    return items.reduce(
        (total, item) => {
            return total +
                Number(item.quantity || 0);
        },
        0
    );
};


const formatMoney = (value) => {
    const amount =
        Number(value || 0);

    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
        }
    ).format(amount);
};


const formatNumber = (value) => {
    return new Intl.NumberFormat(
        "en-US"
    ).format(
        Number(value || 0)
    );
};


const formatDate = (value) => {
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


const formatRelativeDate = (value) => {
    if (!value) {
        return "-";
    }

    const date = new Date(value);
    const today = new Date();

    const startDate =
        new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
        );

    const startToday =
        new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
        );

    const diffDays =
        Math.round(
            (
                startToday.getTime() -
                startDate.getTime()
            ) /
            86400000
        );


    if (diffDays === 0) {
        return "Today";
    }


    if (diffDays === 1) {
        return "Yesterday";
    }


    if (diffDays > 1) {
        return `${diffDays} days ago`;
    }


    return formatDate(value);
};


export default VendorOrders;