import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
    BadgeCheck,
    CheckCircle2,
    CreditCard,
    Pencil,
    Plus,
    Sparkles,
    Trash2,
    X,
} from "lucide-react";

import api from "../../../../api/axios"

const AdminVendorPlans = () => {
    const [plans, setPlans] = useState([]);
    const [billingCycle, setBillingCycle] = useState("yearly");
    const [loading, setLoading] = useState(true);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        fetchPlans();
    }, []);

    // Fetch plans
    const fetchPlans = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/admin/vendor-plans");

            setPlans(response.data?.plans || []);
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to load vendor plans."
            );
        } finally {
            setLoading(false);
        }
    };

    // Delete plan
    const handleDelete = async () => {
        if (!deleteTarget) return;

        try {
            setDeleteLoading(true);
            setError("");
            setSuccessMessage("");

            const response = await api.delete(
                `/admin/vendor-plans/${deleteTarget.id}`
            );

            setSuccessMessage(
                response.data?.message ||
                "Vendor plan deleted successfully."
            );

            setDeleteTarget(null);

            await fetchPlans();
        } catch (error) {
            setError(
                error.response?.data?.message ||
                "Unable to delete vendor plan."
            );
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="min-h-full bg-[#f7f7f8] p-[24px] font-['Inter']">

            {/* Header */}
            <div className="mx-auto max-w-[1120px]">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-[22px] font-semibold text-[#111827]">
                            Plans
                        </h1>

                        <p className="mt-[4px] text-[13px] text-[#777]">
                            Seller packages offered to vendors on your marketplace.
                        </p>
                    </div>

                    <Link
                        to="/admin/vendors/plans/new"
                        className="flex h-[38px] items-center gap-[7px] rounded-[10px] bg-[#2065D1] px-[15px] text-[13px] font-semibold text-white transition hover:bg-[#1958ba]"
                    >
                        <Plus size={16} />
                        Add plan
                    </Link>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mt-[18px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[10px] text-[12px] text-red-600">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mt-[18px] rounded-[10px] border border-green-200 bg-green-50 px-[14px] py-[10px] text-[12px] text-green-700">
                        {successMessage}
                    </div>
                )}

                {/* Billing Toggle */}
                <div className="mt-[28px] flex justify-center">
                    <BillingToggle
                        value={billingCycle}
                        onChange={setBillingCycle}
                    />
                </div>

                {/* Plans */}
                <div className="mt-[24px]">
                    {loading ? (
                        <PlansLoading />
                    ) : plans.length === 0 ? (
                        <EmptyPlans />
                    ) : (
                        <div className="grid grid-cols-1 gap-[22px] md:grid-cols-2 lg:grid-cols-3">
                            {plans.map((plan) => (
                                <VendorPlanCard
                                    key={plan.id}
                                    plan={plan}
                                    billingCycle={billingCycle}
                                    onDelete={() => setDeleteTarget(plan)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Modal */}
            <DeletePlanModal
                plan={deleteTarget}
                loading={deleteLoading}
                onClose={() => setDeleteTarget(null)}
                onConfirm={handleDelete}
            />

        </div>
    );
};

// Billing toggle
const BillingToggle = ({ value, onChange }) => {
    return (
        <div className="flex rounded-full border border-[#dedfe2] bg-white p-[4px] shadow-sm">
            <button
                type="button"
                onClick={() => onChange("monthly")}
                className={`min-w-[98px] rounded-full px-[18px] py-[8px] text-[13px] font-medium transition ${value === "monthly"
                        ? "bg-[#2065D1] text-white"
                        : "text-[#555]"
                    }`}
            >
                Monthly
            </button>

            <button
                type="button"
                onClick={() => onChange("yearly")}
                className={`min-w-[98px] rounded-full px-[18px] py-[8px] text-[13px] font-medium transition ${value === "yearly"
                        ? "bg-[#2065D1] text-white"
                        : "text-[#555]"
                    }`}
            >
                Yearly
            </button>
        </div>
    );
};

// Plan card
const VendorPlanCard = ({
    plan,
    billingCycle,
    onDelete,
}) => {
    const price = getPlanPrice(plan, billingCycle);
    const isFree = Number(price) === 0;
    const isUnavailable = price === null;
    const isDefault = Boolean(plan.is_default);
    const needsStripe = isPaidPlan(plan) && !plan.stripe_product_id;

    return (
        <div
            className={`relative flex min-h-[420px] flex-col rounded-[22px] border p-[24px] shadow-sm transition ${isDefault
                    ? "border-[#2065D1] bg-[#1265d5] text-white shadow-[0_12px_28px_rgba(32,101,209,0.22)]"
                    : "border-[#e0e1e4] bg-white text-[#111827]"
                }`}
        >
            {/* Badges */}
            <div className="flex min-h-[26px] justify-end gap-[6px]">
                {plan.stripe_product_id && (
                    <PlanBadge
                        icon={CreditCard}
                        label="Stripe"
                        active={isDefault}
                    />
                )}

                {needsStripe && (
                    <PlanBadge
                        icon={CreditCard}
                        label="Needs Stripe"
                        light
                    />
                )}

                {plan.ai_authoring && (
                    <PlanBadge
                        icon={Sparkles}
                        label="AI"
                        active={isDefault}
                    />
                )}

                {isDefault && (
                    <PlanBadge
                        icon={BadgeCheck}
                        label="Default"
                        active
                    />
                )}
            </div>

            {/* Name */}
            <h2 className="mt-[8px] text-[18px] font-semibold">
                {plan.name}
            </h2>

            {/* Description */}
            {plan.description && (
                <p
                    className={`mt-[6px] text-[12px] leading-[19px] ${isDefault
                            ? "text-white/80"
                            : "text-[#777]"
                        }`}
                >
                    {plan.description}
                </p>
            )}

            {/* Price */}
            <div className="mt-[24px]">
                {isUnavailable ? (
                    <span
                        className={`text-[30px] font-bold ${isDefault
                                ? "text-white/60"
                                : "text-[#aaa]"
                            }`}
                    >
                        N/A
                    </span>
                ) : isFree ? (
                    <span className="text-[36px] font-bold tracking-[-1px]">
                        Free
                    </span>
                ) : (
                    <>
                        <span className="text-[36px] font-bold tracking-[-1px]">
                            ${Number(price).toLocaleString()}
                        </span>

                        <span
                            className={`ml-[4px] text-[13px] ${isDefault
                                    ? "text-white/80"
                                    : "text-[#777]"
                                }`}
                        >
                            /{billingCycle === "monthly" ? "mo" : "yr"}
                        </span>
                    </>
                )}
            </div>

            {/* Commission */}
            <p
                className={`mt-[3px] text-[12px] ${isDefault
                        ? "text-white/85"
                        : "text-[#777]"
                    }`}
            >
                {Number(plan.commission_rate || 0)}% commission per sale
            </p>

            {/* Features */}
            <div className="mt-[22px] flex-1 space-y-[11px]">
                {(plan.features || []).map((feature, index) => (
                    <div
                        key={index}
                        className="flex items-start gap-[9px] text-[13px]"
                    >
                        <CheckCircle2
                            size={16}
                            className={`mt-[1px] shrink-0 ${isDefault
                                    ? "text-white"
                                    : "text-[#2065D1]"
                                }`}
                        />

                        <span>{feature}</span>
                    </div>
                ))}

                {plan.product_limit !== null && (
                    <PlanLimit
                        label={`${plan.product_limit} product upload limit`}
                        isDefault={isDefault}
                    />
                )}

                {plan.staff_limit !== null && (
                    <PlanLimit
                        label={`${plan.staff_limit} staff limit`}
                        isDefault={isDefault}
                    />
                )}

                {plan.ai_authoring && (
                    <PlanLimit
                        label="AI Studio included"
                        isDefault={isDefault}
                    />
                )}
            </div>

            {/* Actions */}
            <div className="mt-[24px] grid grid-cols-2 gap-[8px]">
                <Link
                    to={`/admin/vendors/plans/${plan.id}/edit`}
                    className={`flex h-[38px] items-center justify-center gap-[7px] rounded-[10px] border text-[13px] font-medium transition ${isDefault
                            ? "border-[#9b6df6] bg-[#9258eb] text-white hover:bg-[#8648df]"
                            : "border-[#dedfe2] bg-white text-[#222] hover:bg-[#f6f6f7]"
                        }`}
                >
                    <Pencil size={15} />
                    Edit
                </Link>

                <button
                    type="button"
                    onClick={onDelete}
                    className="flex h-[38px] items-center justify-center gap-[7px] rounded-[10px] bg-[#ff1119] text-[13px] font-semibold text-white transition hover:bg-[#e50911]"
                >
                    <Trash2 size={15} />
                    Delete
                </button>
            </div>
        </div>
    );
};

// Plan badge
const PlanBadge = ({
    icon: Icon,
    label,
    active = false,
    light = false,
}) => {
    const className = active
        ? "bg-[#9258eb] text-white"
        : light
            ? "border border-[#dedfe2] bg-white text-[#333]"
            : "bg-[#9258eb] text-white";

    return (
        <span className={`inline-flex h-[24px] items-center gap-[4px] rounded-full px-[8px] text-[10px] font-semibold ${className}`}>
            <Icon size={12} />
            {label}
        </span>
    );
};

// Plan limit
const PlanLimit = ({ label, isDefault }) => {
    return (
        <div className="flex items-start gap-[9px] text-[13px]">
            <CheckCircle2
                size={16}
                className={`mt-[1px] shrink-0 ${isDefault
                        ? "text-white"
                        : "text-[#2065D1]"
                    }`}
            />

            <span>{label}</span>
        </div>
    );
};

// Delete modal
const DeletePlanModal = ({
    plan,
    loading,
    onClose,
    onConfirm,
}) => {
    if (!plan) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/55 px-[18px]">
            <div className="relative w-full max-w-[575px] overflow-hidden rounded-[26px] border-t-[3px] border-red-500 bg-white px-[32px] pb-[30px] pt-[30px] shadow-[0_30px_80px_rgba(0,0,0,0.28)]">

                {/* Close */}
                <button
                    type="button"
                    disabled={loading}
                    onClick={onClose}
                    className="absolute right-[22px] top-[22px] flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#888] transition hover:bg-[#f5f5f5] hover:text-[#222]"
                >
                    <X size={20} />
                </button>

                {/* Icon */}
                <div className="mx-auto flex h-[62px] w-[62px] items-center justify-center rounded-full bg-red-100 text-red-500">
                    <Trash2 size={27} />
                </div>

                {/* Content */}
                <div className="mt-[24px] text-center">
                    <h2 className="text-[25px] font-semibold tracking-[-0.4px] text-[#292929]">
                        Delete Vendor Plan
                    </h2>

                    <p className="mx-auto mt-[14px] max-w-[430px] text-[16px] leading-[26px] text-[#777]">
                        Are you sure you want to delete{" "}
                        <span className="font-medium text-[#555]">
                            "{plan.name}"
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
                        className="h-[52px] rounded-[15px] border border-[#dddddf] bg-white text-[16px] font-medium text-[#333] shadow-sm transition hover:bg-[#f7f7f8] disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={onConfirm}
                        className="flex h-[52px] items-center justify-center rounded-[15px] bg-[#ff1018] text-[16px] font-semibold text-white transition hover:bg-[#e90810] disabled:opacity-60"
                    >
                        {loading ? "Deleting..." : "Delete"}
                    </button>
                </div>

            </div>
        </div>
    );
};

// Loading
const PlansLoading = () => {
    return (
        <div className="flex min-h-[350px] items-center justify-center">
            <div className="h-[32px] w-[32px] animate-spin rounded-full border-2 border-[#2065D1]/20 border-t-[#2065D1]" />
        </div>
    );
};

// Empty plans
const EmptyPlans = () => {
    return (
        <div className="rounded-[18px] border border-[#e1e2e5] bg-white py-[70px] text-center">
            <CreditCard
                size={38}
                className="mx-auto text-[#bbb]"
            />

            <h2 className="mt-[12px] text-[16px] font-semibold text-[#333]">
                No vendor plans found
            </h2>

            <p className="mt-[5px] text-[12px] text-[#777]">
                Create your first vendor subscription plan.
            </p>
        </div>
    );
};

// Get selected price
const getPlanPrice = (plan, billingCycle) => {
    const value = billingCycle === "monthly"
        ? plan.monthly_price
        : plan.yearly_price;

    if (value === null || value === undefined || value === "") {
        return null;
    }

    return Number(value);
};

// Check paid plan
const isPaidPlan = (plan) => {
    return Number(plan.monthly_price || 0) > 0 ||
        Number(plan.yearly_price || 0) > 0;
};

export default AdminVendorPlans;