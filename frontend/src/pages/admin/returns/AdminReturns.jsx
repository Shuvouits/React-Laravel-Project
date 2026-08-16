import {
    Check,
    Eye,
    LoaderCircle,
    MoreHorizontal,
    PackageCheck,
    RotateCcw,
    Search,
    Truck,
    X,
    XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";

export default function AdminReturns() {
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

    const [actionLoading, setActionLoading] = useState(false);

    const [confirmModal, setConfirmModal] = useState({
        open: false,
        type: null,
        item: null,
    });

    const [refundModal, setRefundModal] = useState({
        open: false,
        item: null,
        amount: "",
        reason: "",
    });

    const [refundLoading, setRefundLoading] = useState(false);
    const [refundError, setRefundError] = useState("");

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

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
            const response = await api.get("/admin/returns", {
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
        const menuHeight = 260;
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

        if (!item?.order_id) {
            return;
        }

        navigate(`/admin/orders/${item.order_id}`);
    };

    const openConfirmModal = (type, item) => {
        closeMenu();

        setConfirmModal({
            open: true,
            type,
            item,
        });
    };

    const closeConfirmModal = () => {
        if (actionLoading) {
            return;
        }

        setConfirmModal({
            open: false,
            type: null,
            item: null,
        });
    };

    const runReturnAction = async () => {
        const item = confirmModal.item;
        const type = confirmModal.type;

        if (!item || !type) {
            return;
        }

        const endpointMap = {
            approve: `/admin/returns/${item.id}/approve`,
            reject: `/admin/returns/${item.id}/reject`,
            in_transit: `/admin/returns/${item.id}/in-transit`,
            received: `/admin/returns/${item.id}/received`,
            cancel: `/admin/returns/${item.id}/cancel`,
        };

        const endpoint = endpointMap[type];

        if (!endpoint) {
            return;
        }

        setActionLoading(true);
        setMessage("");

        try {
            const response = await api.post(endpoint);

            setMessageType("success");
            setMessage(
                response.data?.message ||
                "Return updated successfully."
            );

            setConfirmModal({
                open: false,
                type: null,
                item: null,
            });

            await fetchReturns(pagination.current_page);
        } catch (err) {
            console.error("Return action error:", err);

            setMessageType("error");
            setMessage(
                err.response?.data?.message ||
                "Unable to update return."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const openRefundModal = (item) => {
        closeMenu();

        const amount = getReturnValue(item);

        setRefundError("");

        setRefundModal({
            open: true,
            item,
            amount: amount > 0
                ? amount.toFixed(2)
                : "",
            reason: "",
        });
    };

    const closeRefundModal = () => {
        if (refundLoading) {
            return;
        }

        setRefundError("");

        setRefundModal({
            open: false,
            item: null,
            amount: "",
            reason: "",
        });
    };

    const handleRefund = async () => {
        const item = refundModal.item;
        const amount = Number(refundModal.amount);

        if (!item || refundLoading) {
            return;
        }

        if (!amount || amount <= 0) {
            setRefundError(
                "Enter a valid refund amount."
            );
            return;
        }

        const returnValue = getReturnValue(item);

        if (
            returnValue > 0 &&
            amount > returnValue
        ) {
            setRefundError(
                `Refund amount cannot exceed ${formatCurrency(
                    returnValue,
                    item.order?.currency || "USD"
                )}.`
            );
            return;
        }

        setRefundLoading(true);
        setRefundError("");
        setMessage("");

        try {
            const response = await api.post(
                `/admin/returns/${item.id}/refund`,
                {
                    amount,
                    reason:
                        refundModal.reason.trim() || null,
                }
            );

            setMessageType("success");
            setMessage(
                response.data?.message ||
                "Refund issued successfully."
            );

            setRefundModal({
                open: false,
                item: null,
                amount: "",
                reason: "",
            });

            await fetchReturns(
                pagination.current_page
            );
        } catch (err) {
            console.error("Return refund error:", err);

            setRefundError(
                err.response?.data?.message ||
                "Unable to issue refund."
            );
        } finally {
            setRefundLoading(false);
        }
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

                {message && (
                    <div
                        className={`mb-4 rounded-[10px] border px-4 py-3 text-[13px] ${
                            messageType === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                        }`}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <span>{message}</span>

                            <button
                                type="button"
                                onClick={() => setMessage("")}
                                className="rounded-md p-1 hover:bg-black/5"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>
                )}

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
                        onRefund={openRefundModal}
                        onAction={openConfirmModal}
                        onClose={closeMenu}
                    />,
                    document.body
                )}

            {confirmModal.open &&
                confirmModal.item && (
                <ConfirmActionModal
                    type={confirmModal.type}
                    item={confirmModal.item}
                    loading={actionLoading}
                    onClose={closeConfirmModal}
                    onConfirm={runReturnAction}
                />
            )}

            {refundModal.open &&
                refundModal.item && (
                <IssueRefundModal
                    item={refundModal.item}
                    amount={refundModal.amount}
                    reason={refundModal.reason}
                    loading={refundLoading}
                    error={refundError}
                    onAmountChange={(value) =>
                        setRefundModal((current) => ({
                            ...current,
                            amount: value,
                        }))
                    }
                    onReasonChange={(value) =>
                        setRefundModal((current) => ({
                            ...current,
                            reason: value,
                        }))
                    }
                    onClose={closeRefundModal}
                    onConfirm={handleRefund}
                />
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
    onRefund,
    onAction,
    onClose,
}) {
    if (!item) {
        return null;
    }

    const status = String(
        item.status || ""
    ).toLowerCase();

    const refundStatus = String(
        item.refund_status || "not_refunded"
    ).toLowerCase();

    const canIssueRefund =
        status === "received" &&
        refundStatus !== "refunded";

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
                    onClick={() =>
                        onView(item)
                    }
                    className="flex w-full items-center gap-[10px] px-[13px] py-[9px] text-left text-[13px] text-[#333] transition hover:bg-[#f5f5f5]"
                >
                    <Eye
                        size={15}
                        className="text-[#777]"
                    />
                    View order
                </button>

                {canIssueRefund && (
                    <>
                        <div className="my-[4px] border-t border-[#eeeeee]" />

                        <button
                            type="button"
                            onClick={() =>
                                onRefund(item)
                            }
                            className="flex w-full items-center gap-[10px] px-[13px] py-[9px] text-left text-[13px] text-[#333] transition hover:bg-[#f5f5f5]"
                        >
                            <RotateCcw
                                size={15}
                                className="text-[#777]"
                            />
                            Issue refund
                        </button>
                    </>
                )}

                {status === "requested" && (
                    <>
                        <div className="my-[4px] border-t border-[#eeeeee]" />

                        <button
                            type="button"
                            onClick={() =>
                                onAction(
                                    "approve",
                                    item
                                )
                            }
                            className="flex w-full items-center gap-[10px] px-[13px] py-[9px] text-left text-[13px] text-[#333] transition hover:bg-[#f5f5f5]"
                        >
                            <Check
                                size={15}
                                className="text-green-600"
                            />
                            Approve return
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                onAction(
                                    "reject",
                                    item
                                )
                            }
                            className="flex w-full items-center gap-[10px] px-[13px] py-[9px] text-left text-[13px] text-red-600 transition hover:bg-red-50"
                        >
                            <XCircle size={15} />
                            Reject return
                        </button>
                    </>
                )}

                {status === "approved" && (
                    <>
                        <div className="my-[4px] border-t border-[#eeeeee]" />

                        <button
                            type="button"
                            onClick={() =>
                                onAction(
                                    "in_transit",
                                    item
                                )
                            }
                            className="flex w-full items-center gap-[10px] px-[13px] py-[9px] text-left text-[13px] text-[#333] transition hover:bg-[#f5f5f5]"
                        >
                            <Truck
                                size={15}
                                className="text-[#777]"
                            />
                            Mark in transit
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                onAction(
                                    "received",
                                    item
                                )
                            }
                            className="flex w-full items-center gap-[10px] px-[13px] py-[9px] text-left text-[13px] text-[#333] transition hover:bg-[#f5f5f5]"
                        >
                            <PackageCheck
                                size={15}
                                className="text-green-600"
                            />
                            Mark received
                        </button>
                    </>
                )}

                {status === "in_transit" && (
                    <>
                        <div className="my-[4px] border-t border-[#eeeeee]" />

                        <button
                            type="button"
                            onClick={() =>
                                onAction(
                                    "received",
                                    item
                                )
                            }
                            className="flex w-full items-center gap-[10px] px-[13px] py-[9px] text-left text-[13px] text-[#333] transition hover:bg-[#f5f5f5]"
                        >
                            <PackageCheck
                                size={15}
                                className="text-green-600"
                            />
                            Mark received
                        </button>
                    </>
                )}

                {[
                    "requested",
                    "approved",
                    "in_transit",
                ].includes(status) && (
                    <>
                        <div className="my-[4px] border-t border-[#eeeeee]" />

                        <button
                            type="button"
                            onClick={() =>
                                onAction(
                                    "cancel",
                                    item
                                )
                            }
                            className="flex w-full items-center gap-[10px] px-[13px] py-[9px] text-left text-[13px] text-red-600 transition hover:bg-red-50"
                        >
                            <XCircle size={15} />
                            Cancel return
                        </button>
                    </>
                )}
            </div>
        </>
    );
}

function IssueRefundModal({
    item,
    amount,
    reason,
    loading,
    error,
    onAmountChange,
    onReasonChange,
    onClose,
    onConfirm,
}) {
    const orderNo =
        item.order?.order_no || "Order";

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4">
            <div className="relative w-full max-w-[575px] rounded-[18px] bg-white p-[28px] shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="absolute right-[18px] top-[18px] flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#666] transition hover:bg-[#f3f3f3] disabled:opacity-50"
                >
                    <X size={18} />
                </button>

                <h2 className="text-[21px] font-semibold tracking-[-0.25px] text-[#222]">
                    Issue refund
                </h2>

                <p className="mt-[5px] text-[14px] text-[#777]">
                    {item.return_no} for order {orderNo}
                </p>

                <div className="mt-[28px]">
                    <label className="text-[14px] font-medium text-[#222]">
                        Refund amount
                    </label>

                    <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={amount}
                        onChange={(event) =>
                            onAmountChange(
                                event.target.value
                            )
                        }
                        className="mt-[8px] h-[42px] w-full rounded-[14px] border border-[#dedede] bg-white px-[14px] text-[14px] text-[#222] outline-none shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition focus:border-[#b5b5b5] focus:ring-2 focus:ring-[#f4f4f4]"
                    />
                </div>

                <div className="mt-[22px]">
                    <label className="text-[14px] font-medium text-[#222]">
                        Reason
                    </label>

                    <textarea
                        rows="3"
                        value={reason}
                        onChange={(event) =>
                            onReasonChange(
                                event.target.value
                            )
                        }
                        placeholder="Optional refund note"
                        className="mt-[8px] min-h-[76px] w-full resize-y rounded-[14px] border border-[#dedede] bg-white px-[14px] py-[11px] text-[14px] text-[#222] outline-none shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition placeholder:text-[#888] focus:border-[#b5b5b5] focus:ring-2 focus:ring-[#f4f4f4]"
                    />
                </div>

                {error && (
                    <div className="mt-[14px] rounded-[9px] border border-red-200 bg-red-50 px-[12px] py-[9px] text-[12px] text-red-600">
                        {error}
                    </div>
                )}

                <div className="mt-[26px] flex justify-end gap-[10px]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="h-[42px] rounded-[12px] border border-[#dedede] bg-white px-[18px] text-[14px] font-medium text-[#333] shadow-sm transition hover:bg-[#f8f8f8] disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex h-[42px] min-w-[128px] items-center justify-center gap-[7px] rounded-[12px] bg-[#2467d5] px-[18px] text-[14px] font-semibold text-white transition hover:bg-[#1f59ba] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading && (
                            <LoaderCircle
                                size={16}
                                className="animate-spin"
                            />
                        )}

                        {loading
                            ? "Issuing..."
                            : "Issue refund"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function ConfirmActionModal({
    type,
    item,
    loading,
    onClose,
    onConfirm,
}) {
    const config = {
        approve: {
            title: "Approve Return",
            button: "Approve Return",
            description:
                "Approve this return request and allow the return process to continue?",
        },
        reject: {
            title: "Reject Return",
            button: "Reject Return",
            description:
                "Reject this return request? This action cannot be undone.",
        },
        in_transit: {
            title: "Mark In Transit",
            button: "Mark In Transit",
            description:
                "Confirm that this return is currently in transit.",
        },
        received: {
            title: "Mark Return Received",
            button: "Mark Received",
            description:
                "Confirm that the returned items have been received.",
        },
        cancel: {
            title: "Cancel Return",
            button: "Cancel Return",
            description:
                "Cancel this return request? This action cannot be undone.",
        },
    };

    const current =
        config[type] || config.cancel;

    const destructive =
        type === "reject" ||
        type === "cancel";

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4">
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div
                    className={`h-1 w-full ${
                        destructive
                            ? "bg-red-500"
                            : "bg-blue-600"
                    }`}
                />

                <button
                    type="button"
                    disabled={loading}
                    onClick={onClose}
                    className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                >
                    <X size={18} />
                </button>

                <div className="px-6 pb-6 pt-7">
                    <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full ${
                            destructive
                                ? "bg-red-50 text-red-600"
                                : "bg-blue-50 text-blue-600"
                        }`}
                    >
                        {destructive ? (
                            <XCircle size={22} />
                        ) : (
                            <RotateCcw size={22} />
                        )}
                    </div>

                    <h2 className="mt-5 text-xl font-semibold text-gray-900">
                        {current.title}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        {current.description}
                    </p>

                    <p className="mt-3 text-sm font-medium text-gray-900">
                        {item.return_no}
                    </p>
                </div>

                <div className="flex gap-3 border-t border-gray-100 bg-gray-50 px-6 py-4">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={onClose}
                        className="h-11 flex-1 rounded-xl border border-gray-300 bg-white px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={onConfirm}
                        className={`h-11 flex-1 rounded-xl px-4 text-sm font-semibold text-white disabled:opacity-60 ${
                            destructive
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-blue-600 hover:bg-blue-700"
                        }`}
                    >
                        {loading
                            ? "Processing..."
                            : current.button}
                    </button>
                </div>
            </div>
        </div>,
        document.body
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
