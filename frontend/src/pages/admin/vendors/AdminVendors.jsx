import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    Store,
    BadgeCheck,
    Clock3,
    CircleAlert,
    HandCoins,
    Plus,
    Search,
    FileText,
    Pencil,
    CheckCircle2,
    ShieldBan,
    RotateCcw,
    Trash2,
    ExternalLink,
    X,
} from "lucide-react";

import api from "../../../api/axios";

const AdminVendors = () => {
    const [vendors, setVendors] = useState([]);

    const [stats, setStats] = useState({
        total_vendors: 0,
        approved_vendors: 0,
        pending_review: 0,
        flagged_vendors: 0,
        vendor_sales: 0,
    });

    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchVendors();
        }, 300);

        return () => clearTimeout(timer);
    }, [activeTab, search]);

    // Fetch vendors
    const fetchVendors = async () => {
        try {
            setLoading(true);
            setError("");

            const params = {
                status: activeTab,
            };

            if (search.trim()) {
                params.search = search.trim();
            }

            const response = await api.get("/admin/vendors", { params });

            setVendors(response.data?.vendors || []);

            setStats({
                total_vendors: response.data?.stats?.total_vendors || 0,
                approved_vendors: response.data?.stats?.approved_vendors || 0,
                pending_review: response.data?.stats?.pending_review || 0,
                flagged_vendors: response.data?.stats?.flagged_vendors || 0,
                vendor_sales: response.data?.stats?.vendor_sales || 0,
            });
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to load vendors."
            );
        } finally {
            setLoading(false);
        }
    };

    // Approve vendor application
    const handleApprove = async (vendor) => {
        if (!vendor.is_application || !vendor.application_id) return;

        try {
            setActionLoading(vendor.id);
            setError("");
            setSuccessMessage("");

            const response = await api.post(
                `/admin/vendor-applications/${vendor.application_id}/approve`
            );

            setSuccessMessage(
                response.data?.message ||
                "Vendor approved successfully."
            );

            await fetchVendors();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to approve vendor."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // Reject vendor application
    const handleReject = async (vendor) => {
        if (!vendor.is_application || !vendor.application_id) return;

        const confirmed = window.confirm(
            `Reject ${vendor.store_name || "this vendor"} application?`
        );

        if (!confirmed) return;

        try {
            setActionLoading(vendor.id);
            setError("");
            setSuccessMessage("");

            const response = await api.post(
                `/admin/vendor-applications/${vendor.application_id}/reject`,
                {
                    reason: "Rejected by admin.",
                }
            );

            setSuccessMessage(
                response.data?.message ||
                "Vendor application rejected."
            );

            await fetchVendors();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to reject vendor."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // Suspend vendor
    const handleSuspend = async (vendor) => {
        const confirmed = window.confirm(
            `Suspend ${vendor.store_name || "this vendor"}?`
        );

        if (!confirmed) return;

        try {
            setActionLoading(vendor.id);
            setError("");
            setSuccessMessage("");

            const response = await api.post(
                `/admin/vendors/${vendor.id}/suspend`,
                {
                    reason: "Suspended by admin.",
                }
            );

            setSuccessMessage(
                response.data?.message ||
                "Vendor suspended successfully."
            );

            await fetchVendors();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to suspend vendor."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // Restore vendor
    const handleRestore = async (vendor) => {
        try {
            setActionLoading(vendor.id);
            setError("");
            setSuccessMessage("");

            const response = await api.post(
                `/admin/vendors/${vendor.id}/restore`
            );

            setSuccessMessage(
                response.data?.message ||
                "Vendor reactivated successfully."
            );

            await fetchVendors();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to reactivate vendor."
            );
        } finally {
            setActionLoading(null);
        }
    };

    // Delete vendor
    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setActionLoading(deleteTarget.id);
            setError("");
            setSuccessMessage("");

            const response = await api.delete(
                `/admin/vendors/${deleteTarget.id}`
            );

            setSuccessMessage(
                response.data?.message ||
                "Vendor removed successfully."
            );

            setDeleteTarget(null);

            await fetchVendors();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to delete vendor."
            );
        } finally {
            setActionLoading(null);
        }
    };

    return (
        <div className="min-h-full bg-[#f7f7f8] p-[22px] font-['Inter']">

            {/* Stats */}
            <VendorStats stats={stats} />

            {/* Vendors */}
            <div className="mt-[18px] rounded-[16px] border border-[#e2e3e5] bg-white shadow-sm">

                {/* Header */}
                <div className="flex items-center justify-between px-[22px] py-[20px]">
                    <h1 className="text-[22px] font-semibold text-[#111827]">
                        Vendors
                    </h1>

                    <Link
                        to="/admin/vendors/new"
                        className="flex h-[38px] items-center gap-[7px] rounded-[10px] bg-[#2065D1] px-[15px] text-[13px] font-semibold text-white transition hover:bg-[#1958ba]"
                    >
                        <Plus size={16} />
                        Add Vendor
                    </Link>
                </div>

                {/* Error */}
                {error && (
                    <div className="mx-[22px] mb-[15px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[10px] text-[12px] text-red-600">
                        {error}
                    </div>
                )}

                {/* Success */}
                {successMessage && (
                    <div className="mx-[22px] mb-[15px] rounded-[10px] border border-green-200 bg-green-50 px-[14px] py-[10px] text-[12px] text-green-700">
                        {successMessage}
                    </div>
                )}

                {/* Tabs */}
                <VendorTabs
                    activeTab={activeTab}
                    onChange={setActiveTab}
                />

                {/* Search */}
                <div className="flex items-center justify-between border-t border-[#ececef] px-[16px] py-[13px]">
                    <div className="relative w-full max-w-[500px]">
                        <Search
                            size={16}
                            className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#888]"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search vendors..."
                            className="h-[38px] w-full rounded-[10px] border border-[#dedfe2] bg-white pl-[39px] pr-[14px] text-[13px] outline-none transition focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10"
                        />
                    </div>

                    <button
                        type="button"
                        className="ml-[14px] h-[38px] shrink-0 rounded-[10px] border border-[#dedfe2] bg-white px-[15px] text-[12px] font-medium text-[#333]"
                    >
                        Import / Export
                    </button>
                </div>

                {/* Table */}
                <VendorTable
                    vendors={vendors}
                    loading={loading}
                    actionLoading={actionLoading}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onSuspend={handleSuspend}
                    onRestore={handleRestore}
                    onDeleteRequest={setDeleteTarget}
                />

            </div>

            {/* Delete Modal */}
            <DeleteVendorModal
                vendor={deleteTarget}
                loading={actionLoading === deleteTarget?.id}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
            />

        </div>
    );
};

// Vendor stats
const VendorStats = ({ stats }) => {
    const cards = [
        {
            label: "Total Vendors",
            value: stats.total_vendors,
            description: "All registered stores",
            icon: Store,
            iconClass: "bg-[#e7f0ff] text-[#2065D1]",
        },
        {
            label: "Approved Vendors",
            value: stats.approved_vendors,
            description: "Currently selling",
            icon: BadgeCheck,
            iconClass: "bg-[#dcfce7] text-[#16a34a]",
        },
        {
            label: "Pending Review",
            value: stats.pending_review,
            description: "Awaiting approval",
            icon: Clock3,
            iconClass: "bg-[#fff3c8] text-[#d99100]",
        },
        {
            label: "Flagged Vendors",
            value: stats.flagged_vendors,
            description: "Suspended or rejected",
            icon: CircleAlert,
            iconClass: "bg-[#ffe4e6] text-[#e11d48]",
        },
        {
            label: "Vendor Sales",
            value: `$${Number(stats.vendor_sales || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            })}`,
            description: "Lifetime gross vendor sales",
            icon: HandCoins,
            iconClass: "bg-[#eee8ff] text-[#7c3aed]",
        },
    ];

    return (
        <div className="grid grid-cols-1 overflow-hidden rounded-[16px] border border-[#e2e3e5] bg-white shadow-sm md:grid-cols-5">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.label}
                        className="relative min-h-[125px] border-b border-[#e8e8ea] px-[20px] py-[18px] last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"
                    >
                        <div className={`absolute right-[18px] top-[17px] flex h-[38px] w-[38px] items-center justify-center rounded-full ${card.iconClass}`}>
                            <Icon size={18} />
                        </div>

                        <p className="pr-[45px] text-[13px] font-medium text-[#333]">
                            {card.label}
                        </p>

                        <p className="mt-[10px] text-[23px] font-semibold tracking-[-0.5px] text-[#111827]">
                            {card.value}
                        </p>

                        <p className="mt-[6px] text-[12px] text-[#777]">
                            {card.description}
                        </p>
                    </div>
                );
            })}
        </div>
    );
};

// Vendor tabs
const VendorTabs = ({ activeTab, onChange }) => {
    const tabs = [
        { key: "all", label: "All" },
        { key: "pending", label: "Pending" },
        { key: "payment_required", label: "Payment Required" },
        { key: "approved", label: "Approved" },
        { key: "suspended", label: "Suspended" },
        { key: "rejected", label: "Rejected" },
    ];

    return (
        <div className="flex gap-[22px] overflow-x-auto px-[22px]">
            {tabs.map((tab) => (
                <button
                    key={tab.key}
                    type="button"
                    onClick={() => onChange(tab.key)}
                    className={`relative h-[44px] whitespace-nowrap text-[13px] font-medium ${
                        activeTab === tab.key
                            ? "text-[#111]"
                            : "text-[#777]"
                    }`}
                >
                    {tab.label}

                    {activeTab === tab.key && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#111]" />
                    )}
                </button>
            ))}
        </div>
    );
};

// Vendor table
const VendorTable = ({
    vendors,
    loading,
    actionLoading,
    onApprove,
    onReject,
    onSuspend,
    onRestore,
    onDeleteRequest,
}) => {
    return (
        <div className="overflow-x-auto border-t border-[#ececef]">
            <table className="w-full min-w-[1050px] border-collapse">
                <thead>
                    <tr className="border-b border-[#ececef] text-left">
                        <th className="px-[22px] py-[15px] text-[11px] font-medium uppercase tracking-[0.04em] text-[#777]">
                            Store & Owner
                        </th>

                        <th className="px-[15px] py-[15px] text-[11px] font-medium uppercase tracking-[0.04em] text-[#777]">
                            Vendor Status
                        </th>

                        <th className="px-[15px] py-[15px] text-[11px] font-medium uppercase tracking-[0.04em] text-[#777]">
                            Account
                        </th>

                        <th className="px-[15px] py-[15px] text-[11px] font-medium uppercase tracking-[0.04em] text-[#777]">
                            Commission
                        </th>

                        <th className="px-[15px] py-[15px] text-[11px] font-medium uppercase tracking-[0.04em] text-[#777]">
                            Sales
                        </th>

                        <th className="px-[15px] py-[15px] text-[11px] font-medium uppercase tracking-[0.04em] text-[#777]">
                            Joined
                        </th>

                        <th className="px-[22px] py-[15px] text-right text-[11px] font-medium uppercase tracking-[0.04em] text-[#777]">
                            Actions
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        <VendorTableLoading />
                    ) : vendors.length === 0 ? (
                        <VendorTableEmpty />
                    ) : (
                        vendors.map((vendor) => (
                            <VendorRow
                                key={vendor.id}
                                vendor={vendor}
                                loading={actionLoading === vendor.id}
                                onApprove={onApprove}
                                onReject={onReject}
                                onSuspend={onSuspend}
                                onRestore={onRestore}
                                onDeleteRequest={onDeleteRequest}
                            />
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

// Vendor row
const VendorRow = ({
    vendor,
    loading,
    onApprove,
    onReject,
    onSuspend,
    onRestore,
    onDeleteRequest,
}) => {
    const user = vendor.user || {};
    const accountStatus = user.account_status || "active";

    return (
        <tr className="border-b border-[#eeeeef] transition hover:bg-[#fafafa]">
            <td className="px-[22px] py-[14px]">
                <div className="flex items-center gap-[11px]">
                    <VendorAvatar vendor={vendor} />

                    <div>
                        <p className="text-[13px] font-semibold text-[#111827]">
                            {vendor.store_name || "Unnamed Store"}
                        </p>

                        <p className="mt-[3px] text-[11px] text-[#777]">
                            {user.name || "Unknown owner"}
                            {user.email ? ` • ${user.email}` : ""}
                        </p>
                    </div>
                </div>
            </td>

            <td className="px-[15px] py-[14px]">
                <VendorStatus status={vendor.status} />
            </td>

            <td className="px-[15px] py-[14px]">
                <AccountStatus status={accountStatus} />
            </td>

            <td className="px-[15px] py-[14px] text-[13px] text-[#222]">
                {Number(vendor.commission_rate || 0)}%
            </td>

            <td className="px-[15px] py-[14px] text-[13px] text-[#222]">
                ${Number(vendor.sales || 0).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                })}
            </td>

            <td className="px-[15px] py-[14px] text-[12px] text-[#555]">
                {formatDate(vendor.created_at)}
            </td>

            <td className="px-[22px] py-[14px]">
                <VendorActions
                    vendor={vendor}
                    loading={loading}
                    onApprove={onApprove}
                    onReject={onReject}
                    onSuspend={onSuspend}
                    onRestore={onRestore}
                    onDeleteRequest={onDeleteRequest}
                />
            </td>
        </tr>
    );
};

// Vendor avatar
const VendorAvatar = ({ vendor }) => {
    const [imageError, setImageError] = useState(false);

    const initial = vendor.store_name?.charAt(0)?.toUpperCase() || "V";
    const logoUrl = getImageUrl(vendor.logo);

    if (logoUrl && !imageError) {
        return (
            <img
                src={logoUrl}
                alt={vendor.store_name || "Vendor"}
                onError={() => setImageError(true)}
                className="h-[40px] w-[40px] shrink-0 rounded-full border border-[#eee] object-cover"
            />
        );
    }

    return (
        <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#f3f4f6] text-[13px] font-medium text-[#333]">
            {initial}
        </div>
    );
};

// Vendor status
const VendorStatus = ({ status }) => {
    const classes = {
        pending: "border-[#e5e5e5] bg-white text-[#444]",
        payment_required: "border-[#fde68a] bg-[#fffbeb] text-[#a16207]",
        approved: "border-[#bbf7d0] bg-[#f0fdf4] text-[#15803d]",
        suspended: "border-[#fecaca] bg-[#fef2f2] text-[#dc2626]",
        rejected: "border-[#fecaca] bg-[#fef2f2] text-[#dc2626]",
    };

    const labels = {
        pending: "Pending",
        payment_required: "Payment Required",
        approved: "Approved",
        suspended: "Suspended",
        rejected: "Rejected",
    };

    return (
        <span className={`inline-flex rounded-full border px-[10px] py-[4px] text-[11px] font-medium ${classes[status] || classes.pending}`}>
            {labels[status] || status}
        </span>
    );
};

// Account status
const AccountStatus = ({ status }) => {
    const classes = {
        active: "bg-[#2065D1] text-white",
        pending_activation: "bg-[#fff3c8] text-[#a16207]",
        suspended: "bg-red-600 text-white",
        banned: "bg-red-600 text-white",
    };

    const labels = {
        active: "Active",
        pending_activation: "Pending Activation",
        suspended: "Suspended",
        banned: "Banned",
    };

    return (
        <span className={`inline-flex rounded-full px-[10px] py-[4px] text-[11px] font-semibold ${classes[status] || classes.active}`}>
            {labels[status] || status}
        </span>
    );
};

// Vendor actions
const VendorActions = ({
    vendor,
    loading,
    onApprove,
    onReject,
    onSuspend,
    onRestore,
    onDeleteRequest,
}) => {
    if (vendor.is_application) {
        return (
            <div className="flex justify-end">
                <div className="inline-flex overflow-hidden rounded-[9px] border border-[#dedfe2]">
                    <ActionButton
                        title="Review application"
                        icon={FileText}
                    />

                    <ActionButton
                        title="Approve"
                        icon={CheckCircle2}
                        disabled={loading}
                        onClick={() => onApprove(vendor)}
                    />

                    <ActionButton
                        title="Reject"
                        icon={ShieldBan}
                        disabled={loading}
                        onClick={() => onReject(vendor)}
                        last
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-end">
            <div className="inline-flex overflow-hidden rounded-[9px] border border-[#dedfe2]">
                <Link
                    to={`/admin/vendors/${vendor.id}`}
                    title="View vendor"
                    className="flex h-[32px] w-[34px] items-center justify-center border-r border-[#dedfe2] text-[#666] transition hover:bg-[#f5f5f5] hover:text-[#2065D1]"
                >
                    <FileText size={15} />
                </Link>

                <Link
                    to={`/admin/vendors/${vendor.id}/edit`}
                    title="Edit vendor"
                    className="flex h-[32px] w-[34px] items-center justify-center border-r border-[#dedfe2] text-[#666] transition hover:bg-[#f5f5f5] hover:text-[#2065D1]"
                >
                    <Pencil size={15} />
                </Link>

                <ActionButton
                    title="Open storefront"
                    icon={ExternalLink}
                />

                {vendor.status === "suspended" ? (
                    <ActionButton
                        title="Reactivate vendor"
                        icon={RotateCcw}
                        disabled={loading}
                        onClick={() => onRestore(vendor)}
                    />
                ) : (
                    <ActionButton
                        title="Suspend vendor"
                        icon={ShieldBan}
                        disabled={loading}
                        onClick={() => onSuspend(vendor)}
                    />
                )}

                <ActionButton
                    title="Delete vendor"
                    icon={Trash2}
                    disabled={loading}
                    danger
                    last
                    onClick={() => onDeleteRequest(vendor)}
                />
            </div>
        </div>
    );
};

// Action button
const ActionButton = ({
    title,
    icon: Icon,
    onClick,
    disabled = false,
    danger = false,
    last = false,
}) => {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={`flex h-[32px] w-[34px] items-center justify-center text-[#666] transition disabled:cursor-not-allowed disabled:opacity-40 ${
                !last ? "border-r border-[#dedfe2]" : ""
            } ${
                danger
                    ? "hover:bg-red-50 hover:text-red-600"
                    : "hover:bg-[#f5f5f5] hover:text-[#2065D1]"
            }`}
        >
            <Icon size={15} />
        </button>
    );
};

// Delete vendor modal
const DeleteVendorModal = ({
    vendor,
    loading,
    onClose,
    onConfirm,
}) => {
    if (!vendor) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-[18px]">
            <div className="relative w-full max-w-[575px] overflow-hidden rounded-[26px] border-t-[3px] border-red-500 bg-white px-[32px] pb-[30px] pt-[30px] shadow-[0_30px_80px_rgba(0,0,0,0.28)]">

                {/* Close */}
                <button
                    type="button"
                    disabled={loading}
                    onClick={onClose}
                    className="absolute right-[22px] top-[22px] flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#888] transition hover:bg-[#f5f5f5] hover:text-[#222] disabled:cursor-not-allowed"
                >
                    <X size={20} />
                </button>

                {/* Delete icon */}
                <div className="mx-auto flex h-[62px] w-[62px] items-center justify-center rounded-full bg-red-100 text-red-500">
                    <Trash2
                        size={27}
                        strokeWidth={2}
                    />
                </div>

                {/* Content */}
                <div className="mt-[24px] text-center">
                    <h2 className="text-[25px] font-semibold tracking-[-0.4px] text-[#292929]">
                        Delete Vendor
                    </h2>

                    <p className="mx-auto mt-[14px] max-w-[430px] text-[16px] leading-[26px] text-[#777]">
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-[#555]">
                            "{vendor.store_name || "this vendor"}"
                        </span>
                        ?
                        <br />
                        This action cannot be undone.
                    </p>
                </div>

                {/* Buttons */}
                <div className="mt-[30px] grid grid-cols-2 gap-[16px]">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={onClose}
                        className="h-[52px] rounded-[15px] border border-[#dddddf] bg-white text-[16px] font-medium text-[#333] shadow-sm transition hover:bg-[#f7f7f8] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={onConfirm}
                        className="flex h-[52px] items-center justify-center rounded-[15px] bg-[#ff1018] text-[16px] font-semibold text-white transition hover:bg-[#e90810] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <span className="flex items-center gap-[9px]">
                                <span className="h-[17px] w-[17px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                Deleting...
                            </span>
                        ) : (
                            "Delete"
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
};

// Loading row
const VendorTableLoading = () => {
    return (
        <tr>
            <td
                colSpan="7"
                className="py-[60px] text-center"
            >
                <div className="mx-auto h-[28px] w-[28px] animate-spin rounded-full border-2 border-[#2065D1]/20 border-t-[#2065D1]" />

                <p className="mt-[12px] text-[12px] text-[#777]">
                    Loading vendors...
                </p>
            </td>
        </tr>
    );
};

// Empty row
const VendorTableEmpty = () => {
    return (
        <tr>
            <td
                colSpan="7"
                className="py-[65px] text-center"
            >
                <Store
                    size={34}
                    className="mx-auto text-[#bbb]"
                />

                <p className="mt-[12px] text-[14px] font-medium text-[#444]">
                    No vendors found
                </p>

                <p className="mt-[5px] text-[12px] text-[#888]">
                    Vendor applications and stores will appear here.
                </p>
            </td>
        </tr>
    );
};

// Backend image URL
const getImageUrl = (path) => {
    if (!path) return "";

    if (
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {
        return path;
    }

    const apiBase = api.defaults.baseURL || "";
    const backendBase = apiBase.replace(/\/api\/?$/, "");

    return `${backendBase}/${path.replace(/^\/+/, "")}`;
};

// Format date
const formatDate = (date) => {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export default AdminVendors;