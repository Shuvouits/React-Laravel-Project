import {
    CalendarDays,
    ChevronRight,
    CreditCard,
    DollarSign,
    Package,
    Plus,
    ShoppingCart,
    TrendingUp,
} from "lucide-react";

const stats = [
    {
        label: "Total Revenue",
        value: "$43,767.00",
        icon: DollarSign,
    },
    {
        label: "Net Earnings",
        value: "$39,390.30",
        icon: TrendingUp,
    },
    {
        label: "Total Orders",
        value: "80",
        icon: ShoppingCart,
    },
    {
        label: "Active Products",
        value: "2",
        icon: Package,
        extra: (
            <div className="mt-2 flex items-center gap-2 text-[13px]">
                <span className="text-[#737373]">
                    2 pending
                </span>

                <span className="font-medium text-[#ef4444]">
                    Attention ↘
                </span>
            </div>
        ),
    },
];

const chartData = [
    {
        month: "May",
        value: 3,
    },
    {
        month: "Jun",
        value: 7,
    },
    {
        month: "Jul",
        value: 18,
    },
    {
        month: "Aug",
        value: 8,
    },
];

const recentOrders = [
    {
        id: 1,
        title: "Order ORD000114",
        orderNo: "ORD000114",
        customer: "Guest",
        quantity: "0 Pcs",
        status: "pending",
        payment: "Credit Card",
        total: "$280.00",
    },
    {
        id: 2,
        title: "Order ORD000113",
        orderNo: "ORD000113",
        customer: "Guest",
        quantity: "0 Pcs",
        status: "cancelled",
        payment: "Credit Card",
        total: "$280.00",
    },
    {
        id: 3,
        title: "Order ORD000104",
        orderNo: "ORD000104",
        customer: "Guest",
        quantity: "0 Pcs",
        status: "delivered",
        payment: "Credit Card",
        total: "$280.00",
    },
    {
        id: 4,
        title: "Order ORD000103",
        orderNo: "ORD000103",
        customer: "Guest",
        quantity: "0 Pcs",
        status: "cancelled",
        payment: "Credit Card",
        total: "$280.00",
    },
    {
        id: 5,
        title: "Order ORD000102",
        orderNo: "ORD000102",
        customer: "Guest",
        quantity: "0 Pcs",
        status: "cancelled",
        payment: "Credit Card",
        total: "$290.00",
    },
];

function VendorDashboard() {
    return (
        <div className="min-h-full bg-[#f7f7f8] px-6 py-6">
            <div className="mx-auto max-w-[1600px]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[26px] font-semibold tracking-[-0.02em] text-[#171717]">
                            Dashboard
                        </h1>

                        <p className="mt-1 text-[15px] text-[#777777]">
                            Manage your store and products
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            className="flex h-[40px] items-center gap-2 rounded-[10px] border border-[#dddddd] bg-white px-5 text-[14px] font-medium text-[#202020] transition hover:bg-[#f8f8f8]"
                        >
                            <ShoppingCart
                                size={17}
                                strokeWidth={1.8}
                            />

                            Orders
                        </button>

                        <button
                            type="button"
                            className="flex h-[40px] items-center gap-2 rounded-[10px] bg-[#2563d9] px-5 text-[14px] font-semibold text-white transition hover:bg-[#1f56c3]"
                        >
                            <Plus
                                size={17}
                                strokeWidth={2}
                            />

                            Add Product
                        </button>
                    </div>
                </div>

                <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map((stat) => {
                        const Icon =
                            stat.icon;

                        return (
                            <div
                                key={stat.label}
                                className="min-h-[115px] rounded-[13px] border border-[#dedede] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[14px] font-medium text-[#777777]">
                                            {stat.label}
                                        </div>

                                        <div className="mt-2 text-[22px] font-semibold tracking-[-0.02em] text-[#111111]">
                                            {stat.value}
                                        </div>

                                        {stat.extra}
                                    </div>

                                    <Icon
                                        size={20}
                                        strokeWidth={1.7}
                                        className="mt-1 text-[#737373]"
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-6 overflow-hidden rounded-[14px] border border-[#dedede] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
                        <h2 className="text-[20px] font-semibold text-[#171717]">
                            Orders
                        </h2>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                className="flex h-[40px] items-center gap-2 rounded-[8px] border border-[#dddddd] bg-white px-4 text-[13px] font-medium text-[#333333]"
                            >
                                <CalendarDays
                                    size={15}
                                    strokeWidth={1.7}
                                />

                                Sep 1, 2025 - Aug 17, 2026
                            </button>

                            <button
                                type="button"
                                className="flex h-[40px] items-center gap-2 rounded-[8px] border border-[#dddddd] bg-white px-4 text-[13px] font-medium text-[#333333]"
                            >
                                <Plus
                                    size={15}
                                    strokeWidth={1.8}
                                />

                                Add activity
                            </button>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-[minmax(0,1fr)_310px]">
                        <div className="border-t border-[#eeeeee] px-6 pb-5 pt-5 lg:border-r">
                            <OrdersChart />
                        </div>

                        <div className="border-t border-[#eeeeee] px-5 py-5">
                            <OrderInsight />
                        </div>
                    </div>
                </div>

                <div className="mt-6 rounded-[14px] border border-[#dedede] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                    <div className="flex items-center justify-between gap-4">
                        <h2 className="text-[21px] font-semibold text-[#171717]">
                            Recent Orders
                        </h2>

                        <button
                            type="button"
                            className="text-[14px] font-medium text-[#666666] transition hover:text-[#111111]"
                        >
                            View all orders
                        </button>
                    </div>

                    <div className="mt-5 space-y-3">
                        {recentOrders.map(
                            (order) => (
                                <RecentOrder
                                    key={order.id}
                                    order={order}
                                />
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function OrdersChart() {
    return (
        <div className="relative h-[355px]">
            <div className="absolute inset-x-0 top-0">
                <ChartLine
                    label="18"
                    top="0%"
                />

                <ChartLine
                    label="13.5"
                    top="25%"
                />

                <ChartLine
                    label="9"
                    top="50%"
                />

                <ChartLine
                    label="4.5"
                    top="75%"
                />

                <ChartLine
                    label="0"
                    top="100%"
                />
            </div>

            <div className="absolute bottom-[40px] left-[58px] right-[20px] top-[5px] flex items-end justify-around">
                {chartData.map(
                    (item) => (
                        <div
                            key={item.month}
                            className="flex h-full flex-1 flex-col items-center justify-end"
                        >
                            <div className="flex h-full w-full items-end justify-center">
                                <div
                                    className="w-[22px] rounded-t-[5px] bg-[#b9b9b9]"
                                    style={{
                                        height: `${
                                            (item.value /
                                                18) *
                                            100
                                        }%`,
                                    }}
                                />
                            </div>

                            <div className="mt-3 text-[12px] text-[#777777]">
                                {item.month}
                            </div>
                        </div>
                    )
                )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-5">
                <div className="flex items-center gap-2 text-[12px] text-[#777777]">
                    <span className="h-[9px] w-[9px] rounded-[2px] bg-[#2563eb]" />

                    In-store
                </div>

                <div className="flex items-center gap-2 text-[12px] text-[#777777]">
                    <span className="h-[9px] w-[9px] rounded-[2px] bg-[#b9b9b9]" />

                    Online
                </div>
            </div>
        </div>
    );
}

function ChartLine({
    label,
    top,
}) {
    return (
        <div
            className="absolute left-0 right-0 flex items-center"
            style={{
                top,
            }}
        >
            <div className="w-[45px] pr-2 text-right text-[11px] text-[#777777]">
                {label}
            </div>

            <div className="h-px flex-1 bg-[#e8e8e8]" />
        </div>
    );
}

function OrderInsight() {
    return (
        <div>
            <div className="flex gap-6 border-b border-[#e7e7e7]">
                <button
                    type="button"
                    className="relative pb-3 text-[14px] font-semibold text-[#171717]"
                >
                    Orders

                    <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#171717]" />
                </button>

                <button
                    type="button"
                    className="pb-3 text-[14px] font-medium text-[#777777]"
                >
                    Sales
                </button>
            </div>

            <div className="mt-6 text-[42px] font-semibold leading-none tracking-[-0.03em] text-[#111111]">
                36
            </div>

            <div className="mt-6 h-[5px] overflow-hidden rounded-full bg-[#eeeeee]">
                <div className="h-full w-[36%] rounded-full bg-[#2563eb]" />
            </div>

            <div className="mt-2 flex items-center justify-between text-[11px] text-[#777777]">
                <span>
                    0.00
                </span>

                <span>
                    100
                </span>
            </div>

            <p className="mt-6 text-[13px] leading-6 text-[#777777]">
                A project-wise breakdown of total orders complemented by detailed insights.
            </p>

            <div className="mt-5 space-y-3">
                <InsightButton>
                    Show all highlights
                </InsightButton>

                <InsightButton>
                    Show all sales data
                </InsightButton>
            </div>
        </div>
    );
}

function InsightButton({
    children,
}) {
    return (
        <button
            type="button"
            className="flex w-full items-center justify-between rounded-[11px] border border-[#e0e0e0] bg-white px-4 py-3 text-left text-[13px] font-semibold text-[#222222] transition hover:bg-[#fafafa]"
        >
            <span>
                {children}
            </span>

            <ChevronRight
                size={17}
                strokeWidth={1.7}
                className="text-[#777777]"
            />
        </button>
    );
}

function RecentOrder({
    order,
}) {
    return (
        <div className="grid min-h-[84px] items-center gap-4 rounded-[12px] border border-[#e1e1e1] px-4 py-3 md:grid-cols-[minmax(250px,1.5fr)_minmax(120px,1fr)_100px_120px_minmax(140px,1fr)_110px]">
            <div className="flex items-center gap-3">
                <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-[12px] border border-[#e8e8e8] bg-[#f7f7f7]">
                    <Package
                        size={19}
                        strokeWidth={1.7}
                        className="text-[#707070]"
                    />
                </div>

                <div>
                    <div className="text-[14px] font-semibold text-[#181818]">
                        {order.title}
                    </div>

                    <div className="mt-1 text-[12px] text-[#777777]">
                        {order.orderNo}
                    </div>
                </div>
            </div>

            <OrderColumn
                label="Customer"
                value={order.customer}
            />

            <OrderColumn
                label="Qty"
                value={order.quantity}
            />

            <div>
                <div className="text-[11px] text-[#777777]">
                    Status
                </div>

                <div className="mt-1">
                    <StatusBadge
                        status={order.status}
                    />
                </div>
            </div>

            <div>
                <div className="text-[11px] text-[#777777]">
                    Payment Method
                </div>

                <div className="mt-1 flex items-center gap-2 text-[13px] font-medium text-[#202020]">
                    <CreditCard
                        size={14}
                        strokeWidth={1.7}
                        className="text-[#777777]"
                    />

                    {order.payment}
                </div>
            </div>

            <div className="md:text-right">
                <div className="text-[11px] text-[#777777]">
                    Total Price
                </div>

                <div className="mt-1 text-[14px] font-semibold text-[#171717]">
                    {order.total}
                </div>
            </div>
        </div>
    );
}

function OrderColumn({
    label,
    value,
}) {
    return (
        <div>
            <div className="text-[11px] text-[#777777]">
                {label}
            </div>

            <div className="mt-1 text-[14px] font-medium text-[#171717]">
                {value}
            </div>
        </div>
    );
}

function StatusBadge({
    status,
}) {
    const styles = {
        pending:
            "bg-[#fff1c7] text-[#b46800]",

        cancelled:
            "bg-[#ffe5e8] text-[#d92342]",

        delivered:
            "bg-[#d9f7e7] text-[#14804a]",
    };

    return (
        <span
            className={`inline-flex rounded-full px-[9px] py-[4px] text-[11px] font-medium ${
                styles[status] ||
                "bg-[#eeeeee] text-[#555555]"
            }`}
        >
            {status}
        </span>
    );
}

export default VendorDashboard;