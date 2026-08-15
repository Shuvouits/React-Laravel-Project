import { Link } from "react-router-dom";
import {
    Box,
    ChevronRight,
    Clock3,
    DollarSign,
    Heart,
    Package,
    Star,
} from "lucide-react";

import CustomerSidebar from "../../../components/frontend/account/CustomerSidebar";

const stats = [
    {
        title: "Total Orders",
        value: "0",
        icon: Package,
    },
    {
        title: "Total Spent",
        value: "$0.00",
        icon: DollarSign,
    },
    {
        title: "Pending Orders",
        value: "7",
        icon: Clock3,
    },
    {
        title: "Wishlist Items",
        value: "3",
        icon: Heart,
    },
];

const recentOrders = [
    {
        id: "#ORD000105",
        date: "Aug 14, 2026",
        status: "cancelled",
        total: "$500.00",
    },
    {
        id: "#ORD000104",
        date: "Aug 14, 2026",
        status: "processing",
        total: "$313.00",
    },
    {
        id: "#ORD000103",
        date: "Aug 14, 2026",
        status: "cancelled",
        total: "$291.00",
    },
];

const CustomerDashboard = () => {
    return (
        <main className="min-h-screen bg-white font-['Inter']">

            <div className="mx-auto max-w-[1330px] px-5 pb-[70px] pt-[32px]">

                <Breadcrumb />

                <div className="mt-[28px] grid grid-cols-1 gap-[32px] lg:grid-cols-[250px_minmax(0,1fr)]">

                    <CustomerSidebar />

                    <div className="min-w-0">

                        <DashboardHeader />

                        <div className="mt-[25px] grid grid-cols-1 gap-[15px] sm:grid-cols-2 xl:grid-cols-4">

                            {stats.map((stat) => (
                                <StatCard
                                    key={stat.title}
                                    stat={stat}
                                />
                            ))}

                        </div>

                        <RecentOrders />

                    </div>

                </div>

            </div>

        </main>
    );
};

// Breadcrumb
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

// Dashboard header
const DashboardHeader = () => {
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

            <div className="flex items-center gap-[9px] pt-[8px]">

                <span className="inline-flex items-center gap-[5px] rounded-full border border-[#f59e0b] bg-[#fff8ed] px-[10px] py-[4px] text-[12px] font-medium text-[#b35b00]">
                    <Star
                        size={13}
                        fill="currentColor"
                    />
                    Bronze
                </span>

                <span className="text-[14px] text-[#777]">
                    100 Points
                </span>

            </div>

        </div>
    );
};

// Stat card
const StatCard = ({ stat }) => {
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

// Recent orders
const RecentOrders = () => {
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

            <div className="mt-[22px] space-y-[14px]">

                {recentOrders.map((order) => (
                    <RecentOrder
                        key={order.id}
                        order={order}
                    />
                ))}

            </div>

        </section>
    );
};

// Recent order
const RecentOrder = ({ order }) => {
    return (
        <button
            type="button"
            className="flex min-h-[76px] w-full items-center gap-[15px] rounded-[8px] border border-[#dedede] px-[15px] text-left transition hover:border-[#c9c9c9] hover:bg-[#fcfcfc]"
        >

            <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[8px] bg-[#f5f5f5] text-[#777]">

                <Box
                    size={19}
                    strokeWidth={1.6}
                />

            </div>

            <div className="min-w-0 flex-1">

                <p className="text-[15px] font-medium text-[#171717]">
                    {order.id}
                </p>

                <p className="mt-[3px] text-[13px] text-[#777]">
                    {order.date}
                </p>

            </div>

            <OrderStatus status={order.status} />

            <span className="min-w-[80px] text-right text-[16px] font-semibold text-[#171717]">
                {order.total}
            </span>

            <ChevronRight
                size={18}
                strokeWidth={1.7}
                className="shrink-0 text-[#777]"
            />

        </button>
    );
};

// Order status
const OrderStatus = ({ status }) => {
    if (status === "processing") {
        return (
            <span className="rounded-full bg-[#e5efff] px-[11px] py-[4px] text-[12px] font-medium text-[#1458c7]">
                processing
            </span>
        );
    }

    if (status === "cancelled") {
        return (
            <span className="rounded-full bg-[#ffe7e7] px-[11px] py-[4px] text-[12px] font-medium text-[#d52a2a]">
                cancelled
            </span>
        );
    }

    return (
        <span className="rounded-full bg-[#e9f7ee] px-[11px] py-[4px] text-[12px] font-medium text-[#198754]">
            {status}
        </span>
    );
};

export default CustomerDashboard;