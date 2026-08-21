import {
    Eye,
    LoaderCircle,
    MoreHorizontal,
    RotateCcw,
    Search,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../../../api/axios";

export default function VendorReturns() {
    const navigate = useNavigate();
    const menuButtonRefs = useRef({});

    const [returns, setReturns] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: null,
        to: null,
    });

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null);

    useEffect(() => {
        fetchReturns(1);
    }, [search]);

    useEffect(() => {
        const closeFloatingMenu = () => {
            setOpenMenuId(null);
            setMenuPosition(null);
        };

        window.addEventListener("scroll", closeFloatingMenu, true);
        window.addEventListener("resize", closeFloatingMenu);

        return () => {
            window.removeEventListener("scroll", closeFloatingMenu, true);
            window.removeEventListener("resize", closeFloatingMenu);
        };
    }, []);

    const fetchReturns = async (page = 1) => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/vendor/returns", {
                params: {
                    tab: "all",
                    search,
                    page,
                    per_page: 15,
                },
            });

            const data = response.data?.returns;

            setReturns(data?.data || []);

            setPagination({
                current_page: data?.current_page || 1,
                last_page: data?.last_page || 1,
                per_page: data?.per_page || 15,
                total: data?.total || 0,
                from: data?.from || null,
                to: data?.to || null,
            });
        } catch (err) {
            console.error("Returns fetch error:", err);

            setError(
                err.response?.data?.message ||
                "Unable to load returns."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event) => {
        event.preventDefault();
        setSearch(searchInput.trim());
    };

    const closeMenu = () => {
        setOpenMenuId(null);
        setMenuPosition(null);
    };

    const toggleMenu = (item) => {
        if (openMenuId === item.id) {
            closeMenu();
            return;
        }

        const button = menuButtonRefs.current[item.id];

        if (!button) {
            return;
        }

        const rect = button.getBoundingClientRect();
        const menuWidth = 190;
        const menuHeight = 52;
        const gap = 7;
        const padding = 12;

        let left = rect.right - menuWidth;
        let top = rect.bottom + gap;

        if (
            top + menuHeight >
            window.innerHeight - padding
        ) {
            top = Math.max(
                padding,
                rect.top - menuHeight - gap
            );
        }

        left = Math.max(
            padding,
            Math.min(
                left,
                window.innerWidth - menuWidth - padding
            )
        );

        setOpenMenuId(item.id);
        setMenuPosition({
            top,
            left,
        });
    };

   
    const handleViewOrder = (item) => {

    closeMenu();

    const orderId =
        item?.order?.id;

    if (!orderId) {
        console.log(
            "Order ID missing:",
            item
        );

        return;
    }

    navigate(
        `/vendor/orders/${orderId}`
    );

};



    return (
        <div className="min-h-screen bg-[#f6f6f7]">
            <div className="mx-auto w-full max-w-[1600px] px-[24px] py-[26px]">
                <div className="mb-[18px]">
                    <h1 className="text-[24px] font-semibold leading-[31px] tracking-[-0.4px] text-[#171717]">
                        Returns and refunds
                    </h1>

                    <p className="mt-[3px] text-[14px] leading-[21px] text-[#737373]">
                        Review customer return requests, approve received items, and issue refunds through the original payment method when available.
                    </p>
                </div>

                <section className="overflow-hidden rounded-[18px] border border-[#dedede] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.035)]">
                    <div className="px-[23px] pb-[23px] pt-[21px]">
                        <h2 className="text-[16px] font-semibold leading-[22px] text-[#171717]">
                            Return requests
                        </h2>

                        <form
                            onSubmit={handleSearch}
                            className="relative mt-[14px] w-full max-w-[318px]"
                        >
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]"
                            />

                            <input
                                type="text"
                                value={searchInput}
                                onChange={(event) =>
                                    setSearchInput(
                                        event.target.value
                                    )
                                }
                                placeholder="Search return or order number"
                                className="h-[36px] w-full rounded-[18px] border border-[#dedede] bg-white pl-[39px] pr-[14px] text-[13px] text-[#222] shadow-[0_1px_2px_rgba(0,0,0,0.025)] outline-none transition placeholder:text-[#777] focus:border-[#b8b8b8] focus:ring-2 focus:ring-[#f4f4f4]"
                            />
                        </form>
                    </div>

                    {error && (
                        <div className="mx-6 mb-5 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="mx-[23px] mb-[23px] overflow-hidden rounded-[13px] border border-[#dedede] bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1275px] table-fixed border-collapse">
                                <colgroup>
                                    <col className="w-[195px]" />
                                    <col className="w-[205px]" />
                                    <col className="w-[220px]" />
                                    <col className="w-[300px]" />
                                    <col className="w-[120px]" />
                                    <col className="w-[165px]" />
                                    <col className="w-[70px]" />
                                </colgroup>

                                <thead>
                                    <tr className="h-[41px] border-b border-[#dedede] bg-white text-left">
                                        <TableHead>
                                            Return
                                        </TableHead>

                                        <TableHead>
                                            Order
                                        </TableHead>

                                        <TableHead>
                                            Customer
                                        </TableHead>

                                        <TableHead>
                                            Items
                                        </TableHead>

                                        <TableHead>
                                            Refund
                                        </TableHead>

                                        <TableHead>
                                            Status
                                        </TableHead>

                                        <TableHead className="text-right">
                                            Actions
                                        </TableHead>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <LoadingRows />
                                    ) : returns.length === 0 ? (
                                        <EmptyState />
                                    ) : (
                                        returns.map((item) => (
                                            <ReturnRow
                                                key={item.id}
                                                item={item}
                                                menuButtonRefs={menuButtonRefs}
                                                toggleMenu={toggleMenu}
                                                handleViewOrder={handleViewOrder}
                                            />
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {!loading && pagination.total > 0 && (
                            <div className="flex items-center justify-between border-t border-[#dedede] bg-white px-[16px] py-[11px]">
                                <div className="text-[12px] text-[#777]">
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
                                        disabled={
                                            pagination.current_page <= 1
                                        }
                                        onClick={() =>
                                            fetchReturns(
                                                pagination.current_page - 1
                                            )
                                        }
                                        className="h-8 rounded-[8px] border border-[#dedede] bg-white px-3 text-[12px] font-medium text-[#555] transition hover:bg-[#f8f8f8] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>

                                    <div className="flex h-8 min-w-[44px] items-center justify-center rounded-[8px] border border-[#dedede] bg-white px-2 text-[12px] font-medium text-[#333]">
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
                                            fetchReturns(
                                                pagination.current_page + 1
                                            )
                                        }
                                        className="h-8 rounded-[8px] border border-[#dedede] bg-white px-3 text-[12px] font-medium text-[#555] transition hover:bg-[#f8f8f8] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {openMenuId &&
                menuPosition &&
                createPortal(
                    <ActionMenu
                        item={returns.find(
                            (item) =>
                                item.id === openMenuId
                        )}
                        position={menuPosition}
                        onView={handleViewOrder}
                        onClose={closeMenu}
                    />,
                    document.body
                )}
        </div>
    );
}

function ReturnRow({
    item,
    menuButtonRefs,
    toggleMenu,
    handleViewOrder,
}) {
    const order = item.order || {};
    const customer = order.user || {};
    const items = Array.isArray(item.items)
        ? item.items
        : [];

    const firstItem = items[0] || null;
    const extraItems = Math.max(
        0,
        items.length - 1
    );

    const returnAmount = getReturnValue(item);

    return (
        <tr className="h-[58px] border-b border-[#e6e6e6] bg-white last:border-b-0 transition-colors hover:bg-[#fcfcfc]">
            <td className="px-[16px] py-[9px] align-middle">
                <div className="whitespace-nowrap text-[13px] font-semibold leading-[18px] text-[#171717]">
                    {item.return_no}
                </div>

                <div className="mt-[1px] whitespace-nowrap text-[11px] leading-[15px] text-[#777]">
                    {formatDate(item.requested_at || item.created_at)}
                </div>
            </td>

            <td className="px-[16px] py-[9px] align-middle">
                <button
                    type="button"
                    onClick={() =>
                        handleViewOrder(item)
                    }
                    className="whitespace-nowrap text-[13px] font-medium leading-[18px] text-[#005bd3] transition hover:text-[#0046a8] hover:underline"
                >
                    {order.order_no || "Order"}
                </button>
            </td>

            <td className="px-[16px] py-[9px] align-middle">
                <div className="truncate text-[13px] font-medium leading-[18px] text-[#222]">
                    {customer.name || "Customer"}
                </div>

                <div className="mt-[1px] truncate text-[11px] leading-[15px] text-[#777]">
                    {customer.email || "No email"}
                </div>
            </td>

            <td className="px-[16px] py-[9px] align-middle">
                <div className="truncate text-[13px] leading-[18px] text-[#222]">
                    {firstItem
                        ? `${firstItem.product_name} x${firstItem.quantity}`
                        : "No items"}

                    {extraItems > 0 && (
                        <span className="text-[#777]">
                            {" "}
                            +{extraItems} more
                        </span>
                    )}
                </div>
            </td>

            <td className="px-[16px] py-[9px] align-middle">
                <div className="whitespace-nowrap text-[13px] font-medium leading-[18px] tabular-nums text-[#171717]">
                    {formatCurrency(
                        returnAmount,
                        order.currency || "USD"
                    )}
                </div>
            </td>

            <td className="px-[16px] py-[8px] align-middle">
                <ReturnStatusCell item={item} />
            </td>

            <td className="px-[16px] py-[8px] align-middle">
                <div className="flex justify-end">
                    <button
                        ref={(element) => {
                            menuButtonRefs.current[
                                item.id
                            ] = element;
                        }}
                        type="button"
                        onClick={() =>
                            toggleMenu(item)
                        }
                        className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-[#dedede] bg-[#fafafa] text-[#333] shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition hover:border-[#cfcfcf] hover:bg-[#f3f3f3]"
                        aria-label={`Actions for ${item.return_no}`}
                    >
                        <MoreHorizontal size={17} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function ReturnStatusCell({ item }) {
    const status = String(
        item.status || "requested"
    ).toLowerCase();

    let badgeClass =
        "border-[#d8d8d8] bg-white text-[#222]";

    if (status === "refunded") {
        badgeClass =
            "border-[#2467d5] bg-[#2467d5] text-white";
    }

    if (
        status === "rejected" ||
        status === "cancelled"
    ) {
        badgeClass =
            "border-red-500 bg-red-500 text-white";
    }

    if (status === "approved") {
        badgeClass =
            "border-blue-200 bg-blue-50 text-blue-700";
    }

    let secondary = formatStatus(
        item.refund_status || "not_refunded"
    );

    if (
        status === "rejected" ||
        status === "cancelled"
    ) {
        secondary = "Not Required";
    } else if (
        status === "received" &&
        item.refund_status === "not_refunded"
    ) {
        secondary = "Pending";
    }

    return (
        <div>
            <span
                className={`inline-flex min-h-[22px] items-center whitespace-nowrap rounded-full border px-[9px] py-[2px] text-[11px] font-medium leading-[16px] ${badgeClass}`}
            >
                {formatStatus(status)}
            </span>

            <div className="mt-[2px] whitespace-nowrap text-[11px] leading-[15px] text-[#777]">
                {secondary}
            </div>
        </div>
    );
}

function ActionMenu({
    item,
    position,
    onView,
    onClose,
}) {
    if (!item) {
        return null;
    }

    return (
        <>
            <div
                className="fixed inset-0 z-[9997]"
                onClick={onClose}
            />

            <div
                className="fixed z-[9998] w-[190px] overflow-hidden rounded-[12px] border border-[#dedede] bg-white py-[5px] shadow-[0_12px_34px_rgba(0,0,0,0.16)]"
                style={{
                    top: position.top,
                    left: position.left,
                }}
            >


                <button
    type="button"
    onClick={() => onView(item)}
    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50"
>
    View Order
</button>


            </div>
        </>
    );
}


function TableHead({
    children,
    className = "",
}) {
    return (
        <th
            className={`whitespace-nowrap px-4 py-[10px] text-[12px] font-semibold text-[#222] ${className}`}
        >
            {children}
        </th>
    );
}

function LoadingRows() {
    return Array.from({
        length: 7,
    }).map((_, index) => (
        <tr
            key={index}
            className="border-b border-[#e6e6e6] last:border-b-0"
        >
            {Array.from({
                length: 7,
            }).map((__, cellIndex) => (
                <td
                    key={cellIndex}
                    className="px-4 py-[13px]"
                >
                    <div className="h-4 animate-pulse rounded bg-[#f1f1f1]" />
                </td>
            ))}
        </tr>
    ));
}

function EmptyState() {
    return (
        <tr>
            <td
                colSpan="7"
                className="px-6 py-16 text-center"
            >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f3f3] text-[#777]">
                    <RotateCcw size={21} />
                </div>

                <h3 className="mt-4 text-[14px] font-semibold text-[#222]">
                    No returns found
                </h3>

                <p className="mt-1 text-[13px] text-[#777]">
                    Return requests will appear here.
                </p>
            </td>
        </tr>
    );
}

function getReturnValue(item) {
    const orderItems =
        Array.isArray(item.order?.items)
            ? item.order.items
            : [];

    const returnItems =
        Array.isArray(item.items)
            ? item.items
            : [];

    const calculated = returnItems.reduce(
        (total, returnItem) => {
            const sourceItem =
                orderItems.find(
                    (orderItem) =>
                        Number(orderItem.id) ===
                        Number(
                            returnItem.order_item_id
                        )
                );

            const unitPrice = Number(
                sourceItem?.unit_price || 0
            );

            const quantity = Number(
                returnItem.quantity || 0
            );

            return (
                total +
                unitPrice * quantity
            );
        },
        0
    );

    if (calculated > 0) {
        return Number(
            calculated.toFixed(2)
        );
    }

    return Number(
        item.refund_amount || 0
    );
}

function formatCurrency(
    value,
    currency = "USD"
) {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency:
                currency || "USD",
        }
    ).format(
        Number(value || 0)
    );
}

function formatDate(value) {
    if (!value) {
        return "-";
    }

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return value;
    }

    return date.toLocaleDateString(
        "en-US",
        {
            month: "numeric",
            day: "numeric",
            year: "numeric",
        }
    );
}

function formatStatus(value) {
    if (!value) {
        return "-";
    }

    return String(value)
        .replaceAll("_", " ")
        .replace(
            /\b\w/g,
            (letter) =>
                letter.toUpperCase()
        );
}
