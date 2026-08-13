import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

import {
    ArrowLeft,
    Check,
    ImagePlus,
    Save,
    Upload,
} from "lucide-react";

import api from "../../../api/axios";

const permissionResources = [
    { key: "point_of_sale", label: "Point of Sale" },
    { key: "orders", label: "Orders" },
    { key: "products", label: "Products" },
    { key: "store_settings", label: "Store Settings" },
    { key: "payouts", label: "Payouts" },
    { key: "analytics", label: "Analytics" },
    { key: "brands", label: "Brands" },
    { key: "discounts", label: "Discounts" },
];

const AdminVendorEdit = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        store_name: "",
        slug: "",
        description: "",
        status: "pending",
        account_status: "active",
        commission_rate: "10",
        owner_name: "",
        owner_email: "",
        owner_phone: "",
        vendor_plan_id: "",
        billing_cycle: "",
    });

    const [plans, setPlans] = useState([]);
    const [permissions, setPermissions] = useState([]);
    const [logo, setLogo] = useState(null);
    const [banner, setBanner] = useState(null);
    const [logoPreview, setLogoPreview] = useState("");
    const [bannerPreview, setBannerPreview] = useState("");
    const [pageLoading, setPageLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    useEffect(() => {
        fetchVendor();
        fetchPlans();
    }, [id]);

    // Fetch vendor
    const fetchVendor = async () => {
        try {
            setPageLoading(true);
            setGeneralError("");

            const response = await api.get(`/admin/vendors/${id}`);
            const vendor = response.data?.vendor;

            if (!vendor) {
                setGeneralError("Vendor not found.");
                return;
            }

            setFormData({
                store_name: vendor.store_name || "",
                slug: vendor.slug || "",
                description: vendor.description || "",
                status: vendor.status || "pending",
                account_status: vendor.user?.account_status || "active",
                commission_rate: vendor.commission_rate || "10",
                owner_name: vendor.user?.name || "",
                owner_email: vendor.user?.email || "",
                owner_phone: vendor.user?.phone || "",
                vendor_plan_id: vendor.vendor_plan_id || "",
                billing_cycle: vendor.billing_cycle || "",
            });

            setLogoPreview(getImageUrl(vendor.logo));
            setBannerPreview(getImageUrl(vendor.banner));
            setPermissions(normalizePermissions(vendor.permissions || []));
        } catch (error) {
            setGeneralError(
                error.response?.data?.message ||
                "Unable to load vendor."
            );
        } finally {
            setPageLoading(false);
        }
    };

    // Fetch vendor plans
    const fetchPlans = async () => {
        try {
            const response = await api.get("/vendor-registration/plans");
            setPlans(response.data?.plans || []);
        } catch (error) {
            console.error("Vendor plans load error:", error);
        }
    };

    // Handle field change
    const handleChange = (e) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: null,
            }));
        }

        setGeneralError("");
        setSuccessMessage("");
    };

    // Handle image
    const handleImageChange = (field, file) => {
        if (!file) return;

        const preview = URL.createObjectURL(file);

        if (field === "logo") {
            setLogo(file);
            setLogoPreview(preview);
        }

        if (field === "banner") {
            setBanner(file);
            setBannerPreview(preview);
        }
    };

    // Toggle permission
    const togglePermission = (index, field) => {
        setPermissions((prev) =>
            prev.map((permission, permissionIndex) =>
                permissionIndex === index
                    ? {
                          ...permission,
                          [field]: !permission[field],
                      }
                    : permission
            )
        );
    };

    // Select all permissions
    const selectAllPermissions = () => {
        setPermissions((prev) =>
            prev.map((permission) => ({
                ...permission,
                can_view: true,
                can_create: true,
                can_edit: true,
                can_delete: true,
            }))
        );
    };

    // Clear all permissions
    const clearAllPermissions = () => {
        setPermissions((prev) =>
            prev.map((permission) => ({
                ...permission,
                can_view: false,
                can_create: false,
                can_edit: false,
                can_delete: false,
            }))
        );
    };

    // Update vendor
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            setSaving(true);
            setErrors({});
            setGeneralError("");
            setSuccessMessage("");

            const data = new FormData();

            data.append("store_name", formData.store_name);
            data.append("slug", formData.slug);
            data.append("description", formData.description);
            data.append("status", formData.status);
            data.append("account_status", formData.account_status);
            data.append("commission_rate", formData.commission_rate);
            data.append("owner_name", formData.owner_name);
            data.append("owner_email", formData.owner_email);
            data.append("owner_phone", formData.owner_phone);

            if (formData.vendor_plan_id) {
                data.append("vendor_plan_id", formData.vendor_plan_id);
            }

            if (formData.billing_cycle) {
                data.append("billing_cycle", formData.billing_cycle);
            }

            if (logo) {
                data.append("logo", logo);
            }

            if (banner) {
                data.append("banner", banner);
            }

            permissions.forEach((permission, index) => {
                data.append(`permissions[${index}][resource]`, permission.resource);
                data.append(`permissions[${index}][can_view]`, permission.can_view ? "1" : "0");
                data.append(`permissions[${index}][can_create]`, permission.can_create ? "1" : "0");
                data.append(`permissions[${index}][can_edit]`, permission.can_edit ? "1" : "0");
                data.append(`permissions[${index}][can_delete]`, permission.can_delete ? "1" : "0");
            });

            const response = await api.post(
                `/admin/vendors/${id}/update`,
                data
            );

            setSuccessMessage(
                response.data?.message ||
                "Vendor updated successfully."
            );

            const vendor = response.data?.vendor;

            if (vendor) {
                setLogoPreview(getImageUrl(vendor.logo));
                setBannerPreview(getImageUrl(vendor.banner));
                setLogo(null);
                setBanner(null);
            }
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response?.data?.errors || {});
                setGeneralError(error.response?.data?.message || "");
                return;
            }

            setGeneralError(
                error.response?.data?.message ||
                "Unable to update vendor."
            );
        } finally {
            setSaving(false);
        }
    };

    if (pageLoading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center bg-[#f7f7f8]">
                <div className="h-[32px] w-[32px] animate-spin rounded-full border-2 border-[#2065D1]/20 border-t-[#2065D1]" />
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="min-h-full bg-[#f7f7f8] p-[24px] font-['Inter']"
        >
            <div className="mx-auto max-w-[1120px]">

                {/* Page Header */}
                <div className="mb-[22px] flex items-center justify-between">
                    <div>
                        <h1 className="text-[22px] font-semibold text-[#111827]">
                            Edit Vendor
                        </h1>

                        <p className="mt-[3px] text-[13px] text-[#777]">
                            Update store, owner, status, plan and permissions
                        </p>
                    </div>

                    <div className="flex items-center gap-[10px]">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex h-[38px] items-center gap-[7px] rounded-[10px] bg-[#2065D1] px-[16px] text-[13px] font-semibold text-white transition hover:bg-[#1958ba] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <Save size={15} />
                            {saving ? "Saving..." : "Save changes"}
                        </button>

                        <Link
                            to="/admin/vendors"
                            className="flex h-[38px] items-center gap-[6px] rounded-[10px] border border-[#dedfe2] bg-white px-[15px] text-[13px] font-medium text-[#333] transition hover:bg-[#f5f5f5]"
                        >
                            <ArrowLeft size={15} />
                            Back to vendors
                        </Link>
                    </div>
                </div>

                {/* Messages */}
                {generalError && (
                    <div className="mb-[18px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[11px] text-[12px] text-red-600">
                        {generalError}
                    </div>
                )}

                {successMessage && (
                    <div className="mb-[18px] rounded-[10px] border border-green-200 bg-green-50 px-[14px] py-[11px] text-[12px] text-green-700">
                        {successMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-[20px] lg:grid-cols-[1fr_340px]">

                    {/* Store Profile */}
                    <SectionCard
                        title="Store Profile"
                        subtitle="Public storefront details"
                    >
                        <FormField
                            label="Store name"
                            required
                            error={errors.store_name?.[0]}
                        >
                            <input
                                type="text"
                                name="store_name"
                                value={formData.store_name}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </FormField>

                        <FormField
                            label="Store slug"
                            error={errors.slug?.[0]}
                        >
                            <input
                                type="text"
                                name="slug"
                                value={formData.slug}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </FormField>

                        <FormField
                            label="Description"
                            error={errors.description?.[0]}
                        >
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className={textareaClass}
                            />
                        </FormField>

                        <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
                            <ImageUploader
                                label="Store logo"
                                preview={logoPreview}
                                recommendation="Recommended size: 512 × 512 px"
                                onChange={(file) => handleImageChange("logo", file)}
                            />

                            <ImageUploader
                                label="Store banner"
                                preview={bannerPreview}
                                recommendation="Recommended size: 1360 × 314 px"
                                onChange={(file) => handleImageChange("banner", file)}
                            />
                        </div>
                    </SectionCard>

                    {/* Status */}
                    <SectionCard
                        title="Status"
                        subtitle="Approval and account state"
                    >
                        <FormField
                            label="Vendor status"
                            error={errors.status?.[0]}
                        >
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="pending">Pending</option>
                                <option value="payment_required">Payment Required</option>
                                <option value="approved">Approved</option>
                                <option value="suspended">Suspended</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </FormField>

                        <FormField
                            label="Owner account status"
                            error={errors.account_status?.[0]}
                        >
                            <select
                                name="account_status"
                                value={formData.account_status}
                                onChange={handleChange}
                                className={inputClass}
                            >
                                <option value="active">Active</option>
                                <option value="suspended">Suspended</option>
                                <option value="banned">Banned</option>
                            </select>
                        </FormField>

                        <FormField
                            label="Commission %"
                            error={errors.commission_rate?.[0]}
                        >
                            <input
                                type="number"
                                name="commission_rate"
                                value={formData.commission_rate}
                                onChange={handleChange}
                                min="0"
                                max="100"
                                step="0.01"
                                className={inputClass}
                            />
                        </FormField>
                    </SectionCard>
                </div>

                {/* Subscription */}
                <div className="mt-[20px] max-w-[760px]">
                    <SectionCard
                        title="Subscription"
                        subtitle="Vendor subscription plan and billing cycle"
                    >
                        <div className="grid grid-cols-1 gap-[16px] md:grid-cols-2">
                            <FormField
                                label="Vendor plan"
                                error={errors.vendor_plan_id?.[0]}
                            >
                                <select
                                    name="vendor_plan_id"
                                    value={formData.vendor_plan_id}
                                    onChange={handleChange}
                                    className={inputClass}
                                >
                                    <option value="">No plan</option>

                                    {plans.map((plan) => (
                                        <option
                                            key={plan.id}
                                            value={plan.id}
                                        >
                                            {plan.name}
                                        </option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField
                                label="Billing cycle"
                                error={errors.billing_cycle?.[0]}
                            >
                                <select
                                    name="billing_cycle"
                                    value={formData.billing_cycle}
                                    onChange={handleChange}
                                    className={inputClass}
                                >
                                    <option value="">No billing cycle</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </FormField>
                        </div>
                    </SectionCard>
                </div>

                {/* Permissions */}
                <div className="mt-[20px] max-w-[760px]">
                    <PermissionCard
                        permissions={permissions}
                        onToggle={togglePermission}
                        onSelectAll={selectAllPermissions}
                        onClearAll={clearAllPermissions}
                    />
                </div>

                {/* Owner Account */}
                <div className="mt-[20px] max-w-[760px]">
                    <SectionCard
                        title="Owner Account"
                        subtitle="User account linked to this vendor"
                    >
                        <FormField
                            label="Owner name"
                            required
                            error={errors.owner_name?.[0]}
                        >
                            <input
                                type="text"
                                name="owner_name"
                                value={formData.owner_name}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </FormField>

                        <FormField
                            label="Owner email"
                            required
                            error={errors.owner_email?.[0]}
                        >
                            <input
                                type="email"
                                name="owner_email"
                                value={formData.owner_email}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </FormField>

                        <FormField
                            label="Owner phone"
                            error={errors.owner_phone?.[0]}
                        >
                            <input
                                type="text"
                                name="owner_phone"
                                value={formData.owner_phone}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </FormField>
                    </SectionCard>
                </div>

            </div>
        </form>
    );
};

// Section card
const SectionCard = ({ title, subtitle, children }) => {
    return (
        <div className="rounded-[16px] border border-[#e1e2e5] bg-white p-[22px] shadow-sm">
            <div className="mb-[22px]">
                <h2 className="text-[16px] font-semibold text-[#111827]">
                    {title}
                </h2>

                {subtitle && (
                    <p className="mt-[3px] text-[13px] text-[#777]">
                        {subtitle}
                    </p>
                )}
            </div>

            <div className="space-y-[16px]">
                {children}
            </div>
        </div>
    );
};

// Form field
const FormField = ({
    label,
    required = false,
    error,
    children,
}) => {
    return (
        <div>
            <label className="mb-[7px] block text-[13px] font-medium text-[#111]">
                {label}

                {required && (
                    <span className="ml-1 text-red-500">
                        *
                    </span>
                )}
            </label>

            {children}

            {error && (
                <p className="mt-[5px] text-[11px] text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
};

// Image uploader
const ImageUploader = ({
    label,
    preview,
    recommendation,
    onChange,
}) => {
    return (
        <div>
            <label className="mb-[7px] block text-[13px] font-medium text-[#111]">
                {label}
            </label>

            <label className="relative flex min-h-[150px] cursor-pointer items-center justify-center overflow-hidden rounded-[13px] border border-dashed border-[#cfd1d5] bg-white transition hover:border-[#2065D1]">
                {preview ? (
                    <>
                        <img
                            src={preview}
                            alt=""
                            className="absolute inset-0 h-full w-full object-cover"
                        />

                        <div className="absolute inset-0 bg-black/20" />

                        <div className="relative flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[12px] font-medium text-[#333] shadow">
                            <ImagePlus size={15} />
                            Change image
                        </div>
                    </>
                ) : (
                    <div className="px-5 text-center">
                        <Upload
                            size={28}
                            className="mx-auto text-[#777]"
                        />

                        <p className="mt-[10px] text-[12px] font-medium text-[#222]">
                            Drag and drop image, or click to browse
                        </p>

                        <p className="mt-[5px] text-[11px] text-[#777]">
                            Image format: JPG, PNG, JPEG, WEBP.
                        </p>

                        <p className="mt-[3px] text-[11px] text-[#777]">
                            {recommendation}
                        </p>
                    </div>
                )}

                <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => onChange(e.target.files?.[0])}
                    className="hidden"
                />
            </label>
        </div>
    );
};

// Permissions
const PermissionCard = ({
    permissions,
    onToggle,
    onSelectAll,
    onClearAll,
}) => {
    return (
        <div className="rounded-[16px] border border-[#e1e2e5] bg-white p-[22px] shadow-sm">
            <div className="mb-[20px] flex items-center justify-between">
                <div>
                    <h2 className="text-[16px] font-semibold text-[#111827]">
                        Permissions
                    </h2>

                    <p className="mt-[3px] text-[13px] text-[#777]">
                        Configure dedicated view/create/edit/delete access per resource
                    </p>
                </div>

                <div className="flex gap-[8px]">
                    <button
                        type="button"
                        onClick={onSelectAll}
                        className="h-[34px] rounded-[9px] border border-[#dedfe2] bg-white px-[13px] text-[12px] font-medium text-[#333] hover:bg-[#f5f5f5]"
                    >
                        Select all
                    </button>

                    <button
                        type="button"
                        onClick={onClearAll}
                        className="h-[34px] rounded-[9px] border border-[#dedfe2] bg-white px-[13px] text-[12px] font-medium text-[#333] hover:bg-[#f5f5f5]"
                    >
                        Clear all
                    </button>
                </div>
            </div>

            <div className="overflow-hidden rounded-[13px] border border-[#e1e2e5]">
                <div className="grid grid-cols-[1fr_repeat(4,105px)] bg-[#f8f8f8] px-[14px] py-[12px] text-[10px] font-semibold uppercase tracking-[0.05em] text-[#777]">
                    <span>Resource</span>
                    <span className="text-center">View</span>
                    <span className="text-center">Create</span>
                    <span className="text-center">Edit</span>
                    <span className="text-center">Delete</span>
                </div>

                {permissions.map((permission, index) => (
                    <PermissionRow
                        key={permission.resource}
                        permission={permission}
                        index={index}
                        onToggle={onToggle}
                    />
                ))}
            </div>
        </div>
    );
};

// Permission row
const PermissionRow = ({
    permission,
    index,
    onToggle,
}) => {
    return (
        <div className="grid grid-cols-[1fr_repeat(4,105px)] items-center border-t border-[#e1e2e5] px-[14px] py-[12px] text-[13px]">
            <span className="font-medium text-[#222]">
                {permission.label}
            </span>

            <PermissionCheckbox
                checked={permission.can_view}
                onChange={() => onToggle(index, "can_view")}
            />

            <PermissionCheckbox
                checked={permission.can_create}
                onChange={() => onToggle(index, "can_create")}
            />

            <PermissionCheckbox
                checked={permission.can_edit}
                onChange={() => onToggle(index, "can_edit")}
            />

            <PermissionCheckbox
                checked={permission.can_delete}
                onChange={() => onToggle(index, "can_delete")}
            />
        </div>
    );
};

// Permission checkbox
const PermissionCheckbox = ({
    checked,
    onChange,
}) => {
    return (
        <div className="flex justify-center">
            <button
                type="button"
                onClick={onChange}
                className={`flex h-[17px] w-[17px] items-center justify-center rounded-[4px] border ${
                    checked
                        ? "border-[#2065D1] bg-[#2065D1] text-white"
                        : "border-[#d8d9dc] bg-white"
                }`}
            >
                {checked && (
                    <Check
                        size={12}
                        strokeWidth={3}
                    />
                )}
            </button>
        </div>
    );
};

// Normalize permissions
const normalizePermissions = (savedPermissions) => {
    return permissionResources.map((resource) => {
        const saved = savedPermissions.find(
            (permission) => permission.resource === resource.key
        );

        return {
            resource: resource.key,
            label: resource.label,
            can_view: Boolean(saved?.can_view),
            can_create: Boolean(saved?.can_create),
            can_edit: Boolean(saved?.can_edit),
            can_delete: Boolean(saved?.can_delete),
        };
    });
};

// Image URL
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

const inputClass = `
    h-[42px]
    w-full
    rounded-[10px]
    border
    border-[#dedfe2]
    bg-white
    px-[13px]
    text-[13px]
    text-[#222]
    outline-none
    transition
    focus:border-[#2065D1]
    focus:ring-2
    focus:ring-[#2065D1]/10
`;

const textareaClass = `
    min-h-[96px]
    w-full
    resize-y
    rounded-[10px]
    border
    border-[#dedfe2]
    bg-white
    px-[13px]
    py-[11px]
    text-[13px]
    text-[#222]
    outline-none
    transition
    focus:border-[#2065D1]
    focus:ring-2
    focus:ring-[#2065D1]/10
`;

export default AdminVendorEdit;