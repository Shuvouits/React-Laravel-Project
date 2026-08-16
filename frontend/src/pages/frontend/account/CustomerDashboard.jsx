import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    Box,
    ChevronRight,
    Clock3,
    DollarSign,
    Heart,
    LoaderCircle,
    Package,
    Star,
} from "lucide-react";

import api from "../../../api/axios";
import CustomerSidebar from "../../../components/frontend/account/CustomerSidebar";

const CustomerDashboard = () => {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/account/overview"
            );

            setDashboard(response.data || null);
        } catch (error) {
            console.error(
                "Customer dashboard error:",
                error.response?.data ||
                error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to load your account overview."
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <DashboardLoader />;
    }

    if (error) {
        return (
            <DashboardError
                message={error}
                onRetry={fetchDashboard}
            />
        );
    }

    const customer =
        dashboard?.customer || {};

    const statsData =
        dashboard?.stats || {};

    const recentOrders =
        dashboard?.recent_orders || [];

    const sidebar =
        dashboard?.sidebar || {};

    const stats = [
        {
            title: "Total Orders",
            value: formatNumber(
                statsData.total_orders
            ),
            icon: Package,
        },
        {
            title: "Total Spent",
            value: formatMoney(
                statsData.total_spent
            ),
            icon: DollarSign,
        },
        {
            title: "Pending Orders",
            value: formatNumber(
                statsData.pending_orders
            ),
            icon: Clock3,
        },
        {
            title: "Wishlist Items",
            value: formatNumber(
                statsData.wishlist_items
            ),
            icon: Heart,
        },
    ];

    return (
        <main className="min-h-screen bg-white font-['Inter']">

            <div className="mx-auto max-w-[1330px] px-5 pb-[70px] pt-[32px]">

                <Breadcrumb />

                <div className="mt-[28px] grid grid-cols-1 gap-[32px] lg:grid-cols-[250px_minmax(0,1fr)]">

                    <CustomerSidebar
                        customer={customer}
                        ordersCount={
                            sidebar.orders_count || 0
                        }
                        wishlistCount={
                            sidebar.wishlist_count || 0
                        }
                    />

                    <div className="min-w-0">

                        <DashboardHeader
                            customer={customer}
                            loyalty={
                                dashboard?.loyalty
                            }
                        />

                        <div className="mt-[25px] grid grid-cols-1 gap-[15px] sm:grid-cols-2 xl:grid-cols-4">

                            {stats.map((stat) => (
                                <StatCard
                                    key={stat.title}
                                    stat={stat}
                                />
                            ))}

                        </div>

                        <RecentOrders
                            orders={recentOrders}
                        />

                    </div>

                </div>

            </div>

        </main>
    );
};

const Breadcrumb = () => {
    return (
        <div className="flex items-center gap-[10px] text-[14px] text-[#777]">

            <Link
                to="/"
                className="hover:text-[#2065D1]"
            >
                Home
            </Link>

            <ChevronRight
                size={15}
                strokeWidth={1.7}
            />

            <span className="font-medium text-[#171717]">
                Account
            </span>

        </div>
    );
};

const DashboardHeader = ({
    loyalty,
}) => {
    return (
        <div className="flex flex-wrap items-start justify-between gap-[20px]">

            <div>

                <h1 className="text-[26px] font-semibold leading-[1.2] text-[#171717]">
                    Overview
                </h1>

                <p className="mt-[6px] text-[16px] text-[#777]">
                    Your account at a glance
                </p>

            </div>

            {loyalty && (
                <div className="flex items-center gap-[9px] pt-[8px]">

                    <span className="inline-flex items-center gap-[5px] rounded-full border border-[#f59e0b] bg-[#fff8ed] px-[10px] py-[4px] text-[12px] font-medium text-[#b35b00]">

                        <Star
                            size={13}
                            fill="currentColor"
                        />

                        {loyalty.tier || "Bronze"}

                    </span>

                    <span className="text-[14px] text-[#777]">
                        {formatNumber(
                            loyalty.points
                        )} Points
                    </span>

                </div>
            )}

        </div>
    );
};

const StatCard = ({
    stat,
}) => {
    const Icon = stat.icon;

    return (
        <div className="relative min-h-[105px] rounded-[12px] border border-[#dedede] bg-white px-[20px] py-[19px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">

            <Icon
                size={20}
                strokeWidth={1.6}
                className="absolute right-[18px] top-[19px] text-[#777]"
            />

            <p className="text-[26px] font-semibold leading-none text-[#171717]">
                {stat.value}
            </p>

            <p className="mt-[12px] text-[14px] text-[#777]">
                {stat.title}
            </p>

        </div>
    );
};

const RecentOrders = ({
    orders,
}) => {
    return (
        <section className="mt-[24px] rounded-[12px] border border-[#dedede] bg-white p-[24px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">

            <div className="flex items-center justify-between">

                <h2 className="text-[17px] font-semibold text-[#171717]">
                    Recent Orders
                </h2>

                <Link
                    to="/account/orders"
                    className="flex items-center gap-[8px] text-[14px] font-medium text-[#171717] hover:text-[#2065D1]"
                >
                    View All

                    <ChevronRight
                        size={16}
                        strokeWidth={1.7}
                    />
                </Link>

            </div>

            {!orders.length && (
                <div className="mt-[22px] flex min-h-[130px] items-center justify-center rounded-[8px] border border-dashed border-[#dedede]">

                    <p className="text-[14px] text-[#888]">
                        You have not placed any orders yet.
                    </p>

                </div>
            )}

            {orders.length > 0 && (
                <div className="mt-[22px] space-y-[14px]">

                    {orders.map((order) => (
                        <RecentOrder
                            key={order.id}
                            order={order}
                        />
                    ))}

                </div>
            )}

        </section>
    );
};



const RecentOrder = ({ order }) => {
    return (
        <Link
            to={`/account/orders/${order.id}`}
            className="flex min-h-[76px] w-full items-center gap-[15px] rounded-[8px] border border-[#dedede] px-[15px] text-left transition hover:border-[#c9c9c9] hover:bg-[#fcfcfc]"
        >
            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[8px] bg-[#f5f5f5] text-[#777]">
                <Box size={19} strokeWidth={1.6} />
            </div>

            <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-medium text-[#171717]">
                    #{order.order_no}
                </p>

                <p className="mt-[3px] text-[13px] text-[#777]">
                    {formatDate(order.placed_at || order.created_at)}
                </p>
            </div>

            <OrderStatus status={order.status} />

            <span className="min-w-[90px] text-right text-[16px] font-semibold text-[#171717]">
                {formatMoney(order.total, order.currency)}
            </span>

            <ChevronRight
                size={18}
                strokeWidth={1.7}
                className="shrink-0 text-[#777]"
            />
        </Link>
    );
};

const OrderStatus = ({
    status,
}) => {
    const value =
        String(status || "pending")
            .toLowerCase();

    if (value === "processing") {
        return (
            <span className="rounded-full bg-[#e5efff] px-[11px] py-[4px] text-[12px] font-medium text-[#1458c7]">
                processing
            </span>
        );
    }

    if (value === "cancelled") {
        return (
            <span className="rounded-full bg-[#ffe7e7] px-[11px] py-[4px] text-[12px] font-medium text-[#d52a2a]">
                cancelled
            </span>
        );
    }

    if (value === "pending") {
        return (
            <span className="rounded-full bg-[#fff1c9] px-[11px] py-[4px] text-[12px] font-medium text-[#9a6400]">
                pending
            </span>
        );
    }

    if (value === "shipped") {
        return (
            <span className="rounded-full bg-[#eee9ff] px-[11px] py-[4px] text-[12px] font-medium text-[#6743c6]">
                shipped
            </span>
        );
    }

    if (value === "completed") {
        return (
            <span className="rounded-full bg-[#e9f7ee] px-[11px] py-[4px] text-[12px] font-medium text-[#198754]">
                completed
            </span>
        );
    }

    return (
        <span className="rounded-full bg-[#f1f1f1] px-[11px] py-[4px] text-[12px] font-medium text-[#666]">
            {formatStatus(value)}
        </span>
    );
};

const DashboardLoader = () => {
    return (
        <main className="flex min-h-[600px] items-center justify-center bg-white">

            <LoaderCircle
                size={30}
                className="animate-spin text-[#2065D1]"
            />

        </main>
    );
};

const DashboardError = ({
    message,
    onRetry,
}) => {
    return (
        <main className="flex min-h-[600px] items-center justify-center bg-white px-[20px]">

            <div className="w-full max-w-[430px] rounded-[14px] border border-[#dedede] bg-white px-[30px] py-[30px] text-center">

                <h2 className="text-[18px] font-semibold text-[#171717]">
                    Unable to load account
                </h2>

                <p className="mt-[8px] text-[14px] leading-[22px] text-[#777]">
                    {message}
                </p>

                <button
                    type="button"
                    onClick={onRetry}
                    className="mt-[20px] h-[40px] rounded-[9px] bg-[#2065D1] px-[18px] text-[14px] font-semibold text-white hover:bg-[#1956b6]"
                >
                    Try Again
                </button>

            </div>

        </main>
    );
};

const formatMoney = (
    value,
    currency = "USD"
) => {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: currency || "USD",
        }
    ).format(
        Number(value || 0)
    );
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

const formatStatus = (value) => {
    if (!value) {
        return "-";
    }

    return String(value)
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) => {
            return letter.toUpperCase();
        });
};

export default CustomerDashboard;