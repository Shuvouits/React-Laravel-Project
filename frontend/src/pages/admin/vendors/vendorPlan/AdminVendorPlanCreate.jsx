import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Save } from "lucide-react";

import api from "../../../../api/axios";

const AdminVendorPlanCreate = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        features: "",
        billing: "free",
        monthly_price: "0",
        yearly_price: "0",
        commission_rate: "0",
        trial_days: "0",
        product_limit: "",
        staff_limit: "",
        ai_authoring: false,
        stripe_product_id: "",
        stripe_price_id: "",
        is_active: true,
        is_default: false,
        sort_order: "0",
    });

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");

    const showMonthlyPrice = formData.billing === "monthly" || formData.billing === "both";
    const showYearlyPrice = formData.billing === "yearly" || formData.billing === "both";

    // Handle input
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        clearError(name);
    };

    // Handle billing
    const handleBillingChange = (e) => {
        const billing = e.target.value;

        setFormData((previous) => {
            let monthlyPrice = previous.monthly_price;
            let yearlyPrice = previous.yearly_price;

            if (billing === "free") {
                monthlyPrice = "0";
                yearlyPrice = "0";
            }

            if (billing === "monthly") {
                monthlyPrice = previous.monthly_price === "0" ? "" : previous.monthly_price;
                yearlyPrice = "";
            }

            if (billing === "yearly") {
                monthlyPrice = "";
                yearlyPrice = previous.yearly_price === "0" ? "" : previous.yearly_price;
            }

            if (billing === "both") {
                monthlyPrice = previous.monthly_price === "0" ? "" : previous.monthly_price;
                yearlyPrice = previous.yearly_price === "0" ? "" : previous.yearly_price;
            }

            return {
                ...previous,
                billing: billing,
                monthly_price: monthlyPrice,
                yearly_price: yearlyPrice,
            };
        });

        setGeneralError("");
    };

    // Handle status
    const handleStatusChange = (e) => {
        const active = e.target.value === "active";

        setFormData((previous) => ({
            ...previous,
            is_active: active,
            is_default: active ? previous.is_default : false,
        }));

        setGeneralError("");
    };

    // Handle toggle
    const handleToggle = (field) => {
        setFormData((previous) => ({
            ...previous,
            [field]: !previous[field],
        }));

        setGeneralError("");
    };

    // Clear field error
    const clearError = (field) => {
        if (errors[field]) {
            setErrors((previous) => ({
                ...previous,
                [field]: null,
            }));
        }

        setGeneralError("");
    };

    // Create plan
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setErrors({});
            setGeneralError("");

            const payload = {
                name: formData.name.trim(),
                description: formData.description,
                features: formData.features,
                monthly_price: getMonthlyPrice(formData),
                yearly_price: getYearlyPrice(formData),
                commission_rate: Number(formData.commission_rate || 0),
                trial_days: Number(formData.trial_days || 0),
                product_limit: formData.product_limit === "" ? null : Number(formData.product_limit),
                staff_limit: formData.staff_limit === "" ? null : Number(formData.staff_limit),
                ai_authoring: formData.ai_authoring,
                stripe_product_id: formData.stripe_product_id || null,
                stripe_price_id: formData.stripe_price_id || null,
                is_active: formData.is_active,
                is_default: formData.is_default,
                sort_order: Number(formData.sort_order || 0),
            };

            await api.post("/admin/vendor-plans", payload);

            navigate("/admin/vendors/plans");
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response?.data?.errors || {});
                setGeneralError(error.response?.data?.message || "");
                return;
            }

            setGeneralError(error.response?.data?.message || "Unable to create vendor plan.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="min-h-full bg-[#f7f7f8] p-[24px] font-['Inter']">
            <div className="mx-auto max-w-[1120px]">

                {/* Header */}
                <div className="mb-[22px] flex items-center justify-between">
                    <div className="flex items-center gap-[9px]">
                        <h1 className="text-[22px] font-semibold text-[#111827]">Add plan</h1>
                        <StatusBadge active={formData.is_active} />
                    </div>

                    <div className="flex items-center gap-[10px]">
                        <button type="submit" disabled={saving} className="flex h-[38px] items-center gap-[7px] rounded-[10px] bg-[#2065D1] px-[16px] text-[13px] font-semibold text-white transition hover:bg-[#1958ba] disabled:cursor-not-allowed disabled:opacity-60">
                            <Save size={15} />
                            {saving ? "Saving..." : "Save"}
                        </button>

                        <Link to="/admin/vendors/plans" className="flex h-[38px] items-center gap-[6px] rounded-[10px] border border-[#dedfe2] bg-white px-[15px] text-[13px] font-medium text-[#333] transition hover:bg-[#f5f5f5]">
                            <ArrowLeft size={15} />
                            Back
                        </Link>
                    </div>
                </div>

                {/* Error */}
                {generalError && (
                    <div className="mb-[18px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[11px] text-[12px] text-red-600">
                        {generalError}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-[20px] lg:grid-cols-[1fr_360px]">

                    {/* Left Column */}
                    <div className="space-y-[20px]">

                        {/* Details */}
                        <SectionCard title="Details">

                            <FormField label="Name" required error={errors.name?.[0]}>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Starter" className={inputClass} />
                            </FormField>

                            <FormField label="Description" error={errors.description?.[0]}>
                                <textarea name="description" value={formData.description} onChange={handleChange} maxLength="2000" rows="4" placeholder="Describe this plan..." className={textareaClass} />
                                <FieldHelp>{formData.description.length}/2000 characters</FieldHelp>
                            </FormField>

                            <FormField label="Features" error={errors.features?.[0]}>
                                <textarea name="features" value={formData.features} onChange={handleChange} rows="4" placeholder={"Unlimited products\nPriority support"} className={textareaClass} />
                                <FieldHelp>One feature per line. Shown as bullet points on the plan.</FieldHelp>
                            </FormField>

                        </SectionCard>

                        {/* Pricing */}
                        <SectionCard title="Pricing">

                            <FormField label="Billing">
                                <select value={formData.billing} onChange={handleBillingChange} className={inputClass}>
                                    <option value="free">Free</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                    <option value="both">Monthly & Yearly</option>
                                </select>
                            </FormField>

                            {showMonthlyPrice && (
                                <FormField label="Monthly price" required error={errors.monthly_price?.[0]}>
                                    <input type="number" name="monthly_price" value={formData.monthly_price} onChange={handleChange} min="0" step="0.01" placeholder="0.00" className={inputClass} />
                                </FormField>
                            )}

                            {showYearlyPrice && (
                                <FormField label="Yearly price" required error={errors.yearly_price?.[0]}>
                                    <input type="number" name="yearly_price" value={formData.yearly_price} onChange={handleChange} min="0" step="0.01" placeholder="0.00" className={inputClass} />
                                </FormField>
                            )}

                            <FormField label="Commission rate (%)" required error={errors.commission_rate?.[0]}>
                                <input type="number" name="commission_rate" value={formData.commission_rate} onChange={handleChange} min="0" max="100" step="0.01" className={inputClass} />
                                <FieldHelp>Percentage kept from each vendor sale.</FieldHelp>
                            </FormField>

                            <FormField label="Trial days" error={errors.trial_days?.[0]}>
                                <input type="number" name="trial_days" value={formData.trial_days} onChange={handleChange} min="0" className={inputClass} />
                                <FieldHelp>Optional access period for this plan.</FieldHelp>
                            </FormField>

                        </SectionCard>

                        {/* Limits */}
                        <SectionCard title="Limits">

                            <FormField label="Max products" error={errors.product_limit?.[0]}>
                                <input type="number" name="product_limit" value={formData.product_limit} onChange={handleChange} min="1" placeholder="Unlimited" className={inputClass} />
                                <FieldHelp>Maximum products a vendor on this plan can publish. Leave blank for unlimited.</FieldHelp>
                            </FormField>

                            <FormField label="Max staff" error={errors.staff_limit?.[0]}>
                                <input type="number" name="staff_limit" value={formData.staff_limit} onChange={handleChange} min="1" placeholder="Unlimited" className={inputClass} />
                                <FieldHelp>Maximum staff members a vendor on this plan can add. Leave blank for unlimited.</FieldHelp>
                            </FormField>

                        </SectionCard>

                        {/* Capabilities */}
                        <SectionCard title="Capabilities">
                            <ToggleBox
                                label="AI Authoring"
                                description="Let vendors on this plan use AI Studio to generate product and brand content."
                                checked={formData.ai_authoring}
                                onChange={() => handleToggle("ai_authoring")}
                            />
                        </SectionCard>

                    </div>

                    {/* Right Column */}
                    <div className="space-y-[20px]">

                        {/* Status */}
                        <SectionCard title="Status">

                            <FormField label="Status">
                                <select value={formData.is_active ? "active" : "inactive"} onChange={handleStatusChange} className={inputClass}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </FormField>

                            <ToggleBox
                                label="Default plan"
                                description="Assigned to new vendors automatically. Only one plan can be the default."
                                checked={formData.is_default}
                                disabled={!formData.is_active}
                                onChange={() => handleToggle("is_default")}
                            />

                        </SectionCard>

                        {/* Stripe */}
                        <SectionCard title="Stripe">

                            <FormField label="Product ID" error={errors.stripe_product_id?.[0]}>
                                <input type="text" name="stripe_product_id" value={formData.stripe_product_id} onChange={handleChange} placeholder="prod_..." className={inputClass} />
                                <FieldHelp>Auto-created for paid plans when Stripe is configured.</FieldHelp>
                            </FormField>

                            <FormField label="Price ID" error={errors.stripe_price_id?.[0]}>
                                <input type="text" name="stripe_price_id" value={formData.stripe_price_id} onChange={handleChange} placeholder="price_..." className={inputClass} />
                                <FieldHelp>Must match this plan's price, currency, and billing interval.</FieldHelp>
                            </FormField>

                        </SectionCard>

                        {/* Organization */}
                        <SectionCard title="Organization">

                            <FormField label="Sort order" error={errors.sort_order?.[0]}>
                                <input type="number" name="sort_order" value={formData.sort_order} onChange={handleChange} min="0" className={inputClass} />
                                <FieldHelp>Lower numbers appear first.</FieldHelp>
                            </FormField>

                        </SectionCard>

                    </div>

                </div>
            </div>
        </form>
    );
};

// Section card
const SectionCard = ({ title, children }) => {
    return (
        <div className="rounded-[16px] border border-[#e1e2e5] bg-white p-[22px] shadow-sm">
            <h2 className="mb-[20px] text-[16px] font-semibold text-[#111827]">{title}</h2>
            <div className="space-y-[16px]">{children}</div>
        </div>
    );
};

// Form field
const FormField = ({ label, required = false, error, children }) => {
    return (
        <div>
            <label className="mb-[7px] block text-[13px] font-medium text-[#111]">
                {label}
                {required && <span className="ml-1 text-red-500">*</span>}
            </label>

            {children}

            {error && (
                <p className="mt-[5px] text-[11px] text-red-500">{error}</p>
            )}
        </div>
    );
};

// Field help
const FieldHelp = ({ children }) => {
    return (
        <p className="mt-[6px] text-[11px] leading-[17px] text-[#777]">{children}</p>
    );
};

// Toggle box
const ToggleBox = ({ label, description, checked, onChange, disabled = false }) => {
    const toggleClass = checked ? "bg-[#2065D1]" : "bg-[#dedfe2]";
    const positionClass = checked ? "left-[21px]" : "left-[3px]";

    return (
        <div className="flex items-center justify-between gap-[16px] rounded-[13px] border border-[#e2e3e5] p-[14px]">
            <div>
                <p className="text-[13px] font-medium text-[#111]">{label}</p>
                <p className="mt-[2px] text-[11px] leading-[17px] text-[#777]">{description}</p>
            </div>

            <button type="button" disabled={disabled} onClick={onChange} className={`relative h-[22px] w-[40px] shrink-0 rounded-full transition ${toggleClass} disabled:cursor-not-allowed disabled:opacity-50`}>
                <span className={`absolute top-[3px] flex h-[16px] w-[16px] items-center justify-center rounded-full bg-white shadow-sm transition-all ${positionClass}`}>
                    {checked && <Check size={10} className="text-[#2065D1]" />}
                </span>
            </button>
        </div>
    );
};

// Status badge
const StatusBadge = ({ active }) => {
    const className = active ? "bg-[#2065D1] text-white" : "bg-[#e5e7eb] text-[#666]";

    return (
        <span className={`rounded-full px-[10px] py-[4px] text-[11px] font-semibold ${className}`}>
            {active ? "Active" : "Inactive"}
        </span>
    );
};

// Monthly price
const getMonthlyPrice = (formData) => {
    if (formData.billing === "free") {
        return 0;
    }

    if (formData.billing === "yearly") {
        return null;
    }

    if (formData.monthly_price === "") {
        return null;
    }

    return Number(formData.monthly_price);
};

// Yearly price
const getYearlyPrice = (formData) => {
    if (formData.billing === "free") {
        return 0;
    }

    if (formData.billing === "monthly") {
        return null;
    }

    if (formData.yearly_price === "") {
        return null;
    }

    return Number(formData.yearly_price);
};

const inputClass = "h-[42px] w-full rounded-[10px] border border-[#dedfe2] bg-white px-[13px] text-[13px] text-[#222] outline-none transition focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10";

const textareaClass = "min-h-[96px] w-full resize-y rounded-[10px] border border-[#dedfe2] bg-white px-[13px] py-[11px] text-[13px] text-[#222] outline-none transition focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10";

export default AdminVendorPlanCreate;