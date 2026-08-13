import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, Save } from "lucide-react";

import api from "../../../../api/axios";

const AdminVendorConfiguration = () => {
    const [formData, setFormData] = useState({
        allow_vendor_registration: true,
        auto_approve_applications: false,
        enable_subscription_plans: true,
        require_plan_at_signup: true,
        free_trial_days: "0",
        default_commission_rate: "10",
        minimum_withdrawal_amount: "1000",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        fetchConfiguration();
    }, []);

    // Fetch configuration
    const fetchConfiguration = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/admin/vendor-configuration");
            const configuration = response.data?.configuration;

            if (!configuration) {
                setError("Vendor configuration not found.");
                return;
            }

            setFormData({
                allow_vendor_registration: Boolean(configuration.allow_vendor_registration),
                auto_approve_applications: Boolean(configuration.auto_approve_applications),
                enable_subscription_plans: Boolean(configuration.enable_subscription_plans),
                require_plan_at_signup: Boolean(configuration.require_plan_at_signup),
                free_trial_days: configuration.free_trial_days ?? "0",
                default_commission_rate: configuration.default_commission_rate ?? "10",
                minimum_withdrawal_amount: configuration.minimum_withdrawal_amount ?? "1000",
            });
        } catch (error) {
            setError(error.response?.data?.message || "Unable to load vendor configuration.");
        } finally {
            setLoading(false);
        }
    };

    // Handle input
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setError("");
        setSuccessMessage("");
    };

    // Handle toggle
    const handleToggle = (field) => {
        setFormData((previous) => {
            const updated = {
                ...previous,
                [field]: !previous[field],
            };

            if (field === "enable_subscription_plans" && previous[field]) {
                updated.require_plan_at_signup = false;
            }

            return updated;
        });

        setError("");
        setSuccessMessage("");
    };

    // Save configuration
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setError("");
            setSuccessMessage("");

            const payload = {
                allow_vendor_registration: formData.allow_vendor_registration,
                auto_approve_applications: formData.auto_approve_applications,
                enable_subscription_plans: formData.enable_subscription_plans,
                require_plan_at_signup: formData.require_plan_at_signup,
                free_trial_days: Number(formData.free_trial_days || 0),
                default_commission_rate: Number(formData.default_commission_rate || 0),
                minimum_withdrawal_amount: Number(formData.minimum_withdrawal_amount || 0),
            };

            const response = await api.post("/admin/vendor-configuration", payload);
            const configuration = response.data?.configuration;

            setSuccessMessage(response.data?.message || "Vendor configuration saved successfully.");

            if (configuration) {
                setFormData({
                    allow_vendor_registration: Boolean(configuration.allow_vendor_registration),
                    auto_approve_applications: Boolean(configuration.auto_approve_applications),
                    enable_subscription_plans: Boolean(configuration.enable_subscription_plans),
                    require_plan_at_signup: Boolean(configuration.require_plan_at_signup),
                    free_trial_days: configuration.free_trial_days ?? "0",
                    default_commission_rate: configuration.default_commission_rate ?? "10",
                    minimum_withdrawal_amount: configuration.minimum_withdrawal_amount ?? "1000",
                });
            }
        } catch (error) {
            setError(error.response?.data?.message || "Unable to save vendor configuration.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <PageLoader />;
    }

    return (
        <form onSubmit={handleSubmit} className="min-h-full bg-[#f7f7f8] p-[24px] font-['Inter']">
            <div className="mx-auto max-w-[760px]">

                {/* Header */}
                <div className="rounded-[16px] border border-[#e1e2e5] bg-white px-[22px] py-[20px]">
                    <h1 className="text-[18px] font-semibold text-[#111827]">
                        Vendor Configuration
                    </h1>

                    <p className="mt-[4px] text-[13px] text-[#777]">
                        Registration, approval, and subscription plan policy for vendors.
                    </p>
                </div>

                {/* Messages */}
                {error && (
                    <div className="mt-[16px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[11px] text-[12px] text-red-600">
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="mt-[16px] rounded-[10px] border border-green-200 bg-green-50 px-[14px] py-[11px] text-[12px] text-green-700">
                        {successMessage}
                    </div>
                )}

                {/* Registration */}
                <ConfigurationCard title="Registration & approval">

                    <SettingRow
                        title="Allow vendor registration"
                        description="Let people apply to become a vendor from the storefront."
                    >
                        <ToggleSwitch
                            checked={formData.allow_vendor_registration}
                            onChange={() => handleToggle("allow_vendor_registration")}
                        />
                    </SettingRow>

                    <SettingRow
                        title="Auto-approve applications"
                        description="Approve new vendors automatically instead of manual review."
                    >
                        <ToggleSwitch
                            checked={formData.auto_approve_applications}
                            onChange={() => handleToggle("auto_approve_applications")}
                        />
                    </SettingRow>

                </ConfigurationCard>

                {/* Plans */}
                <ConfigurationCard title="Plans & subscriptions">

                    <SettingRow
                        title="Enable subscription plans"
                        description="Show vendors a plan step during onboarding. When off, vendors use the default commission."
                    >
                        <ToggleSwitch
                            checked={formData.enable_subscription_plans}
                            onChange={() => handleToggle("enable_subscription_plans")}
                        />
                    </SettingRow>

                    <SettingRow
                        title="Require a plan at signup"
                        description="Applicants must choose a plan before finishing. Otherwise a default plan is used."
                    >
                        <ToggleSwitch
                            checked={formData.require_plan_at_signup}
                            disabled={!formData.enable_subscription_plans}
                            onChange={() => handleToggle("require_plan_at_signup")}
                        />
                    </SettingRow>

                    <SettingRow
                        title="Free trial length (days)"
                        description="Fallback trial length when a paid plan is chosen."
                    >
                        <input
                            type="number"
                            name="free_trial_days"
                            value={formData.free_trial_days}
                            onChange={handleChange}
                            min="0"
                            className="h-[38px] w-[95px] rounded-[10px] border border-[#dedfe2] bg-white px-[12px] text-[13px] outline-none focus:border-[#2065D1]"
                        />
                    </SettingRow>

                </ConfigurationCard>

                {/* Documents */}
                <div className="mt-[16px] rounded-[16px] border border-[#e1e2e5] bg-white px-[22px] py-[22px] shadow-sm">
                    <div className="flex items-center justify-between gap-[20px]">
                        <div>
                            <h2 className="text-[14px] font-semibold text-[#111827]">
                                Required documents & fields
                            </h2>

                            <p className="mt-[4px] max-w-[500px] text-[13px] leading-[19px] text-[#777]">
                                Required documents and every onboarding field are managed in the Onboarding Flow builder, where you can mark any field required, hide it, reorder steps, or add custom fields.
                            </p>
                        </div>

                        <Link
                            to="/admin/vendors/onboarding-flow"
                            className="flex h-[38px] shrink-0 items-center gap-[8px] rounded-[10px] border border-[#dedfe2] bg-white px-[14px] text-[13px] font-medium text-[#222] transition hover:bg-[#f7f7f8]"
                        >
                            Open Onboarding Flow
                            <ArrowRight size={15} />
                        </Link>
                    </div>
                </div>

                {/* Default Commission */}
                <div className="mt-[16px] rounded-[16px] border border-[#e1e2e5] bg-white px-[22px] py-[20px]">
                    <h2 className="text-[15px] font-semibold text-[#111827]">
                        Default commission
                    </h2>

                    <p className="mt-[4px] text-[13px] text-[#777]">
                        Applied to vendors without a plan. Also editable under Order Settings.
                    </p>
                </div>

                {/* Commission Settings */}
                <ConfigurationCard>

                    <SettingRow
                        title="Commission rate"
                        description="Percentage the platform keeps on each vendor sale."
                    >
                        <div className="flex items-center gap-[8px]">
                            <input
                                type="number"
                                name="default_commission_rate"
                                value={formData.default_commission_rate}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                step="0.01"
                                className="h-[38px] w-[95px] rounded-[10px] border border-[#dedfe2] bg-white px-[12px] text-[13px] outline-none focus:border-[#2065D1]"
                            />

                            <span className="text-[13px] text-[#777]">%</span>
                        </div>
                    </SettingRow>

                    <SettingRow
                        title="Minimum withdrawal amount"
                        description="Smallest balance a vendor can request as a payout."
                    >
                        <input
                            type="number"
                            name="minimum_withdrawal_amount"
                            value={formData.minimum_withdrawal_amount}
                            onChange={handleChange}
                            min="0"
                            step="0.01"
                            className="h-[38px] w-[110px] rounded-[10px] border border-[#dedfe2] bg-white px-[12px] text-[13px] outline-none focus:border-[#2065D1]"
                        />
                    </SettingRow>

                </ConfigurationCard>

                {/* Save */}
                <div className="sticky bottom-[20px] mt-[16px] flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex h-[40px] items-center gap-[7px] rounded-[10px] bg-[#2065D1] px-[18px] text-[13px] font-semibold text-white shadow-lg transition hover:bg-[#1958ba] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Save size={15} />
                        {saving ? "Saving..." : "Save"}
                    </button>
                </div>

            </div>
        </form>
    );
};

// Configuration card
const ConfigurationCard = ({ title, children }) => {
    return (
        <div className="mt-[16px] rounded-[16px] border border-[#e1e2e5] bg-white px-[22px] py-[22px] shadow-sm">
            {title && (
                <h2 className="mb-[18px] text-[14px] font-semibold text-[#111827]">
                    {title}
                </h2>
            )}

            <div className="space-y-[18px]">
                {children}
            </div>
        </div>
    );
};

// Setting row
const SettingRow = ({ title, description, children }) => {
    return (
        <div className="flex items-center justify-between gap-[20px]">
            <div>
                <p className="text-[13px] font-medium text-[#111827]">
                    {title}
                </p>

                <p className="mt-[2px] text-[12px] leading-[18px] text-[#777]">
                    {description}
                </p>
            </div>

            <div className="shrink-0">
                {children}
            </div>
        </div>
    );
};

// Toggle switch
const ToggleSwitch = ({ checked, onChange, disabled = false }) => {
    const backgroundClass = checked ? "bg-[#2065D1]" : "bg-[#dedfe2]";
    const positionClass = checked ? "left-[21px]" : "left-[3px]";

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onChange}
            className={`relative h-[22px] w-[40px] rounded-full transition ${backgroundClass} disabled:cursor-not-allowed disabled:opacity-50`}
        >
            <span className={`absolute top-[3px] flex h-[16px] w-[16px] items-center justify-center rounded-full bg-white shadow-sm transition-all ${positionClass}`}>
                {checked && <Check size={10} className="text-[#2065D1]" />}
            </span>
        </button>
    );
};

// Page loader
const PageLoader = () => {
    return (
        <div className="flex min-h-[500px] items-center justify-center bg-[#f7f7f8]">
            <div className="h-[32px] w-[32px] animate-spin rounded-full border-2 border-[#2065D1]/20 border-t-[#2065D1]" />
        </div>
    );
};

export default AdminVendorConfiguration;