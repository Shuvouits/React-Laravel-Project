import {
    useEffect,
    useState,
} from "react";
import {
    useNavigate,
    useParams,
} from "react-router-dom";
import api from "../../../api/axios";

const emptyForm = {
    name: "",
    email: "",
    phone: "",
    account_status: "active",

    acquisition_source: "",
    tags: "",

    loyalty_tier: "bronze",
    loyalty_points: 0,

    marketing_opt_in: false,
    order_updates: true,
    promotions: false,
    newsletter: false,
    price_drops: false,
    back_in_stock: false,

    shipping_address: {
        first_name: "",
        last_name: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        postal_code: "",
        country: "",
        phone: "",
    },

    internal_notes: "",
};

function AdminCustomerEdit() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [customer, setCustomer] =
        useState(null);

    const [form, setForm] =
        useState(emptyForm);

    const [errors, setErrors] =
        useState({});

    const [message, setMessage] =
        useState("");

    const [errorMessage, setErrorMessage] =
        useState("");

    useEffect(() => {
        loadCustomer();
    }, [id]);

    const loadCustomer = async () => {
        setLoading(true);
        setErrorMessage("");

        try {
            const response =
                await api.get(
                    `/admin/customers/${id}/edit`
                );

            const data =
                response.data.customer;

            setCustomer(data);

            setForm({
                name:
                    data.name || "",

                email:
                    data.email || "",

                phone:
                    data.phone || "",

                account_status:
                    data.account_status ||
                    "active",

                acquisition_source:
                    data.acquisition_source ||
                    "",

                tags:
                    Array.isArray(
                        data.tags
                    )
                        ? data.tags.join(
                            ", "
                        )
                        : "",

                loyalty_tier:
                    data.loyalty_tier ||
                    "bronze",

                loyalty_points:
                    data.loyalty_points ||
                    0,

                marketing_opt_in:
                    data
                        .communication_preferences
                        ?.marketing_opt_in ??
                    false,

                order_updates:
                    data
                        .communication_preferences
                        ?.order_updates ??
                    true,

                promotions:
                    data
                        .communication_preferences
                        ?.promotions ??
                    false,

                newsletter:
                    data
                        .communication_preferences
                        ?.newsletter ??
                    false,

                price_drops:
                    data
                        .communication_preferences
                        ?.price_drops ??
                    false,

                back_in_stock:
                    data
                        .communication_preferences
                        ?.back_in_stock ??
                    false,

                shipping_address: {
                    first_name:
                        data
                            .shipping_address
                            ?.first_name ||
                        "",

                    last_name:
                        data
                            .shipping_address
                            ?.last_name ||
                        "",

                    address_line1:
                        data
                            .shipping_address
                            ?.address_line1 ||
                        "",

                    address_line2:
                        data
                            .shipping_address
                            ?.address_line2 ||
                        "",

                    city:
                        data
                            .shipping_address
                            ?.city ||
                        "",

                    state:
                        data
                            .shipping_address
                            ?.state ||
                        "",

                    postal_code:
                        data
                            .shipping_address
                            ?.postal_code ||
                        "",

                    country:
                        data
                            .shipping_address
                            ?.country ||
                        "",

                    phone:
                        data
                            .shipping_address
                            ?.phone ||
                        "",
                },

                internal_notes:
                    data.internal_notes ||
                    "",
            });
        } catch (requestError) {
            setErrorMessage(
                requestError.response
                    ?.data?.message ||
                "Unable to load customer."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setForm(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );

        clearFieldError(name);
    };

    const handleShippingChange = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setForm(
            (previous) => ({
                ...previous,

                shipping_address: {
                    ...previous.shipping_address,
                    [name]: value,
                },
            })
        );

        clearFieldError(
            `shipping_address.${name}`
        );
    };

    const handlePreferenceChange = (
        name
    ) => {
        setForm(
            (previous) => ({
                ...previous,
                [name]:
                    !previous[name],
            })
        );
    };

    const clearFieldError = (
        field
    ) => {
        if (!errors[field]) {
            return;
        }

        setErrors(
            (previous) => {
                const next = {
                    ...previous,
                };

                delete next[field];

                return next;
            }
        );
    };

    const handleSubmit =
        async (event) => {
            event.preventDefault();

            setSaving(true);
            setErrors({});
            setMessage("");
            setErrorMessage("");

            try {
                const payload = {
                    name:
                        form.name.trim(),

                    email:
                        form.email.trim(),

                    phone:
                        form.phone.trim() ||
                        null,

                    account_status:
                        form.account_status,

                    acquisition_source:
                        form
                            .acquisition_source
                            .trim() ||
                        null,

                    tags:
                        form.tags,

                    loyalty_tier:
                        form.loyalty_tier,

                    loyalty_points:
                        Number(
                            form.loyalty_points ||
                            0
                        ),

                    marketing_opt_in:
                        form.marketing_opt_in,

                    order_updates:
                        form.order_updates,

                    promotions:
                        form.promotions,

                    newsletter:
                        form.newsletter,

                    price_drops:
                        form.price_drops,

                    back_in_stock:
                        form.back_in_stock,

                    internal_notes:
                        form
                            .internal_notes
                            .trim() ||
                        null,

                    shipping_address: {
                        first_name:
                            form
                                .shipping_address
                                .first_name
                                .trim(),

                        last_name:
                            form
                                .shipping_address
                                .last_name
                                .trim(),

                        address_line1:
                            form
                                .shipping_address
                                .address_line1
                                .trim(),

                        address_line2:
                            form
                                .shipping_address
                                .address_line2
                                .trim(),

                        city:
                            form
                                .shipping_address
                                .city
                                .trim(),

                        state:
                            form
                                .shipping_address
                                .state
                                .trim(),

                        postal_code:
                            form
                                .shipping_address
                                .postal_code
                                .trim(),

                        country:
                            form
                                .shipping_address
                                .country
                                .trim(),

                        phone:
                            form
                                .shipping_address
                                .phone
                                .trim(),
                    },
                };

                const response =
                    await api.put(
                        `/admin/customers/${id}`,
                        payload
                    );

                const updated =
                    response.data.customer;

                setCustomer(updated);

                setMessage(
                    response.data
                        .message ||
                    "Customer updated successfully."
                );

                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                });
            } catch (requestError) {
                const validationErrors =
                    requestError.response
                        ?.data?.errors;

                if (validationErrors) {
                    const formatted = {};

                    Object.keys(
                        validationErrors
                    ).forEach(
                        (key) => {
                            formatted[key] =
                                validationErrors[
                                    key
                                ][0];
                        }
                    );

                    setErrors(
                        formatted
                    );
                } else {
                    setErrorMessage(
                        requestError
                            .response
                            ?.data
                            ?.message ||
                        "Unable to update customer."
                    );
                }
            } finally {
                setSaving(false);
            }
        };

    if (loading) {
        return (
            <div className="min-h-full bg-[#f7f7f8] px-6 py-8">
                <div className="mx-auto max-w-[1280px]">
                    <div className="h-[38px] w-[260px] animate-pulse rounded bg-[#e9e9e9]" />

                    <div className="mt-6 h-[180px] animate-pulse rounded-[16px] bg-white" />

                    <div className="mt-6 grid gap-5 lg:grid-cols-2">
                        <div className="h-[420px] animate-pulse rounded-[16px] bg-white" />
                        <div className="h-[420px] animate-pulse rounded-[16px] bg-white" />
                    </div>
                </div>
            </div>
        );
    }

    if (
        !customer &&
        errorMessage
    ) {
        return (
            <div className="min-h-full bg-[#f7f7f8] px-6 py-8">
                <div className="mx-auto max-w-[1280px]">
                    <div className="rounded-[12px] border border-[#f0caca] bg-[#fff5f5] px-5 py-4 text-[14px] text-[#bd2525]">
                        {errorMessage}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-full bg-[#f7f7f8] px-6 py-7">
            <div className="mx-auto max-w-[1280px]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-[22px] font-semibold text-[#151515]">
                            Customer Details
                        </h1>

                        <p className="mt-1 text-[14px] text-[#777777]">
                            View and update customer profile, loyalty, and internal notes
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="submit"
                            form="customer-edit-form"
                            disabled={saving}
                            className="h-[40px] rounded-[10px] bg-[#2563d9] px-5 text-[13px] font-semibold text-white transition hover:bg-[#1f56c3] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving
                                ? "Saving..."
                                : "Save changes"}
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/admin/customers"
                                )
                            }
                            className="h-[40px] rounded-[10px] border border-[#dddddd] bg-white px-5 text-[13px] font-semibold text-[#333333] transition hover:bg-[#f6f6f6]"
                        >
                            Back to customers
                        </button>
                    </div>
                </div>

                {message && (
                    <div className="mt-5 rounded-[10px] border border-[#cdebd8] bg-[#f0fbf4] px-4 py-3 text-[13px] text-[#167344]">
                        {message}
                    </div>
                )}

                {errorMessage && (
                    <div className="mt-5 rounded-[10px] border border-[#f0caca] bg-[#fff5f5] px-4 py-3 text-[13px] text-[#bd2525]">
                        {errorMessage}
                    </div>
                )}

                <CustomerSummary
                    customer={
                        customer
                    }
                />

                <div className="mt-5 border-b border-[#dddddd]">
                    <div className="flex flex-wrap gap-7">
                        <button
                            type="button"
                            className="relative py-3 text-[14px] font-semibold text-[#111111]"
                        >
                            Profile

                            <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#2563eb]" />
                        </button>

                        <button
                            type="button"
                            className="py-3 text-[14px] font-medium text-[#777777]"
                        >
                            Orders
                        </button>

                        <button
                            type="button"
                            className="py-3 text-[14px] font-medium text-[#777777]"
                        >
                            Activity
                        </button>

                        <button
                            type="button"
                            className="py-3 text-[14px] font-medium text-[#777777]"
                        >
                            Loyalty
                        </button>

                        <button
                            type="button"
                            className="py-3 text-[14px] font-medium text-[#777777]"
                        >
                            Notes
                        </button>
                    </div>
                </div>

                <form
                    id="customer-edit-form"
                    onSubmit={handleSubmit}
                    className="mt-6"
                >
                    <div className="grid gap-5 lg:grid-cols-2">
                        <SectionCard
                            title="Basic Information"
                            description="Customer account identity and contact fields"
                        >
                            <FormField
                                label="Full name"
                                required
                                error={
                                    errors.name
                                }
                            >
                                <input
                                    type="text"
                                    name="name"
                                    value={
                                        form.name
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={
                                        inputClass
                                    }
                                />
                            </FormField>

                            <FormField
                                label="Email"
                                required
                                error={
                                    errors.email
                                }
                            >
                                <input
                                    type="email"
                                    name="email"
                                    value={
                                        form.email
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={
                                        inputClass
                                    }
                                />
                            </FormField>

                            <FormField
                                label="Phone"
                                error={
                                    errors.phone
                                }
                            >
                                <input
                                    type="text"
                                    name="phone"
                                    value={
                                        form.phone
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. +1 555 0123"
                                    className={
                                        inputClass
                                    }
                                />
                            </FormField>

                            <FormField
                                label="Account status"
                                error={
                                    errors.account_status
                                }
                            >
                                <select
                                    name="account_status"
                                    value={
                                        form.account_status
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={
                                        inputClass
                                    }
                                >
                                    <option value="active">
                                        Active
                                    </option>

                                    <option value="pending_activation">
                                        Inactive
                                    </option>

                                    <option value="suspended">
                                        Suspended
                                    </option>

                                    <option value="banned">
                                        Banned
                                    </option>
                                </select>
                            </FormField>
                        </SectionCard>

                        <SectionCard
                            title="Segmentation"
                            description="Profile settings used by support and marketing teams"
                        >
                            <FormField
                                label="Acquisition source"
                                error={
                                    errors.acquisition_source
                                }
                            >
                                <input
                                    type="text"
                                    name="acquisition_source"
                                    value={
                                        form.acquisition_source
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="e.g. instagram, organic, referral"
                                    className={
                                        inputClass
                                    }
                                />
                            </FormField>

                            <FormField
                                label="Tags"
                                error={
                                    errors.tags
                                }
                            >
                                <input
                                    type="text"
                                    name="tags"
                                    value={
                                        form.tags
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    placeholder="vip, repeat, b2b"
                                    className={
                                        inputClass
                                    }
                                />

                                <p className="mt-2 text-[12px] text-[#888888]">
                                    Separate tags with commas
                                </p>
                            </FormField>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    label="Loyalty tier"
                                    error={
                                        errors.loyalty_tier
                                    }
                                >
                                    <select
                                        name="loyalty_tier"
                                        value={
                                            form.loyalty_tier
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className={
                                            inputClass
                                        }
                                    >
                                        <option value="bronze">
                                            Bronze
                                        </option>

                                        <option value="silver">
                                            Silver
                                        </option>

                                        <option value="gold">
                                            Gold
                                        </option>

                                        <option value="platinum">
                                            Platinum
                                        </option>
                                    </select>
                                </FormField>

                                <FormField
                                    label="Loyalty points"
                                    error={
                                        errors.loyalty_points
                                    }
                                >
                                    <input
                                        type="number"
                                        min="0"
                                        name="loyalty_points"
                                        value={
                                            form.loyalty_points
                                        }
                                        onChange={
                                            handleChange
                                        }
                                        className={
                                            inputClass
                                        }
                                    />
                                </FormField>
                            </div>
                        </SectionCard>

                        <SectionCard
                            title="Communication Preferences"
                            description="Marketing consent and email notification settings"
                        >
                            <PreferenceRow
                                title="Marketing opt-in"
                                description="Customer agreed to receive marketing communications"
                                checked={
                                    form.marketing_opt_in
                                }
                                onChange={() =>
                                    handlePreferenceChange(
                                        "marketing_opt_in"
                                    )
                                }
                            />

                            <PreferenceRow
                                title="Order updates"
                                description="Shipping, delivery, and status changes"
                                checked={
                                    form.order_updates
                                }
                                onChange={() =>
                                    handlePreferenceChange(
                                        "order_updates"
                                    )
                                }
                            />

                            <PreferenceRow
                                title="Promotions"
                                description="Discounts, sales, and campaigns"
                                checked={
                                    form.promotions
                                }
                                onChange={() =>
                                    handlePreferenceChange(
                                        "promotions"
                                    )
                                }
                            />

                            <PreferenceRow
                                title="Newsletter"
                                description="Periodic store newsletter"
                                checked={
                                    form.newsletter
                                }
                                onChange={() =>
                                    handlePreferenceChange(
                                        "newsletter"
                                    )
                                }
                            />

                            <PreferenceRow
                                title="Price drops"
                                description="Alerts when watched items get cheaper"
                                checked={
                                    form.price_drops
                                }
                                onChange={() =>
                                    handlePreferenceChange(
                                        "price_drops"
                                    )
                                }
                            />

                            <PreferenceRow
                                title="Back in stock"
                                description="Alerts when saved items are restocked"
                                checked={
                                    form.back_in_stock
                                }
                                onChange={() =>
                                    handlePreferenceChange(
                                        "back_in_stock"
                                    )
                                }
                            />
                        </SectionCard>

                        <SectionCard
                            title="Shipping Address"
                            description="Default shipping address for quick order creation"
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    label="First name"
                                    error={
                                        errors[
                                            "shipping_address.first_name"
                                        ]
                                    }
                                >
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={
                                            form
                                                .shipping_address
                                                .first_name
                                        }
                                        onChange={
                                            handleShippingChange
                                        }
                                        placeholder="e.g. Jane"
                                        className={
                                            inputClass
                                        }
                                    />
                                </FormField>

                                <FormField
                                    label="Last name"
                                    error={
                                        errors[
                                            "shipping_address.last_name"
                                        ]
                                    }
                                >
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={
                                            form
                                                .shipping_address
                                                .last_name
                                        }
                                        onChange={
                                            handleShippingChange
                                        }
                                        placeholder="e.g. Doe"
                                        className={
                                            inputClass
                                        }
                                    />
                                </FormField>
                            </div>

                            <FormField
                                label="Street"
                                error={
                                    errors[
                                        "shipping_address.address_line1"
                                    ]
                                }
                            >
                                <input
                                    type="text"
                                    name="address_line1"
                                    value={
                                        form
                                            .shipping_address
                                            .address_line1
                                    }
                                    onChange={
                                        handleShippingChange
                                    }
                                    placeholder="House, road, area"
                                    className={
                                        inputClass
                                    }
                                />
                            </FormField>

                            <FormField
                                label="Apartment, suite, etc."
                                error={
                                    errors[
                                        "shipping_address.address_line2"
                                    ]
                                }
                            >
                                <input
                                    type="text"
                                    name="address_line2"
                                    value={
                                        form
                                            .shipping_address
                                            .address_line2
                                    }
                                    onChange={
                                        handleShippingChange
                                    }
                                    placeholder="Optional"
                                    className={
                                        inputClass
                                    }
                                />
                            </FormField>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    label="City"
                                    error={
                                        errors[
                                            "shipping_address.city"
                                        ]
                                    }
                                >
                                    <input
                                        type="text"
                                        name="city"
                                        value={
                                            form
                                                .shipping_address
                                                .city
                                        }
                                        onChange={
                                            handleShippingChange
                                        }
                                        placeholder="City"
                                        className={
                                            inputClass
                                        }
                                    />
                                </FormField>

                                <FormField
                                    label="State"
                                    error={
                                        errors[
                                            "shipping_address.state"
                                        ]
                                    }
                                >
                                    <input
                                        type="text"
                                        name="state"
                                        value={
                                            form
                                                .shipping_address
                                                .state
                                        }
                                        onChange={
                                            handleShippingChange
                                        }
                                        placeholder="State"
                                        className={
                                            inputClass
                                        }
                                    />
                                </FormField>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FormField
                                    label="Postal code"
                                    error={
                                        errors[
                                            "shipping_address.postal_code"
                                        ]
                                    }
                                >
                                    <input
                                        type="text"
                                        name="postal_code"
                                        value={
                                            form
                                                .shipping_address
                                                .postal_code
                                        }
                                        onChange={
                                            handleShippingChange
                                        }
                                        placeholder="Postal code"
                                        className={
                                            inputClass
                                        }
                                    />
                                </FormField>

                                <FormField
                                    label="Country"
                                    error={
                                        errors[
                                            "shipping_address.country"
                                        ]
                                    }
                                >
                                    <select
                                        name="country"
                                        value={
                                            form
                                                .shipping_address
                                                .country
                                        }
                                        onChange={
                                            handleShippingChange
                                        }
                                        className={
                                            inputClass
                                        }
                                    >
                                        <option value="">
                                            Select country
                                        </option>

                                        <option value="Bangladesh">
                                            Bangladesh
                                        </option>

                                        <option value="United States">
                                            United States
                                        </option>

                                        <option value="United Kingdom">
                                            United Kingdom
                                        </option>

                                        <option value="Canada">
                                            Canada
                                        </option>

                                        <option value="Australia">
                                            Australia
                                        </option>

                                        <option value="India">
                                            India
                                        </option>
                                    </select>
                                </FormField>
                            </div>

                            <FormField
                                label="Phone"
                                error={
                                    errors[
                                        "shipping_address.phone"
                                    ]
                                }
                            >
                                <input
                                    type="text"
                                    name="phone"
                                    value={
                                        form
                                            .shipping_address
                                            .phone
                                    }
                                    onChange={
                                        handleShippingChange
                                    }
                                    placeholder="e.g. +1 555 0123"
                                    className={
                                        inputClass
                                    }
                                />
                            </FormField>
                        </SectionCard>
                    </div>

                    <div className="mt-5">
                        <SectionCard
                            title="Internal Notes"
                            description="Private notes visible only to store administrators"
                        >
                            <FormField
                                label="Notes"
                                error={
                                    errors.internal_notes
                                }
                            >
                                <textarea
                                    name="internal_notes"
                                    value={
                                        form.internal_notes
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    rows="5"
                                    placeholder="Add internal notes about this customer"
                                    className="w-full resize-none rounded-[9px] border border-[#dddddd] bg-white px-3 py-3 text-[14px] text-[#222222] outline-none placeholder:text-[#999999] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                                />
                            </FormField>
                        </SectionCard>
                    </div>

                    <div className="mt-5 flex justify-end gap-3 pb-8">
                        <button
                            type="button"
                            onClick={() =>
                                navigate(
                                    "/admin/customers"
                                )
                            }
                            className="h-[40px] rounded-[9px] border border-[#dddddd] bg-white px-5 text-[13px] font-semibold text-[#444444] transition hover:bg-[#f7f7f7]"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="h-[40px] rounded-[9px] bg-[#2563d9] px-6 text-[13px] font-semibold text-white transition hover:bg-[#1f56c3] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving
                                ? "Saving..."
                                : "Save changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function CustomerSummary({
    customer,
}) {
    const stats =
        customer?.stats || {};

    return (
        <div className="mt-6 overflow-hidden rounded-[16px] border border-[#e2e2e2] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex flex-wrap items-center gap-4 px-5 py-5">
                <CustomerAvatar
                    customer={
                        customer
                    }
                />

                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-[20px] font-semibold text-[#171717]">
                            {customer.name}
                        </h2>

                        <LoyaltyBadge
                            tier={
                                customer.loyalty_tier
                            }
                        />

                        <StatusBadge
                            status={
                                customer.account_status
                            }
                        />
                    </div>

                    <div className="mt-1 text-[13px] text-[#777777]">
                        {customer.email}
                    </div>
                </div>
            </div>

            <div className="grid border-t border-[#e5e5e5] sm:grid-cols-2 lg:grid-cols-5">
                <SummaryItem
                    label="Total spent"
                    value={formatCurrency(
                        stats.total_spent
                    )}
                />

                <SummaryItem
                    label="Orders"
                    value={formatNumber(
                        stats.orders
                    )}
                />

                <SummaryItem
                    label="Avg. order"
                    value={formatCurrency(
                        stats.average_order
                    )}
                />

                <SummaryItem
                    label="Last order"
                    value={formatDate(
                        stats.last_order_at
                    )}
                />

                <SummaryItem
                    label="Loyalty points"
                    value={formatNumber(
                        stats.loyalty_points
                    )}
                    last
                />
            </div>
        </div>
    );
}

function SummaryItem({
    label,
    value,
    last = false,
}) {
    return (
        <div
            className={`min-h-[74px] px-4 py-3 ${
                !last
                    ? "border-b border-[#e5e5e5] sm:border-r lg:border-b-0"
                    : ""
            }`}
        >
            <div className="text-[12px] text-[#777777]">
                {label}
            </div>

            <div className="mt-1 text-[18px] font-semibold text-[#171717]">
                {value}
            </div>
        </div>
    );
}

function SectionCard({
    title,
    description,
    children,
}) {
    return (
        <div className="rounded-[16px] border border-[#e1e1e1] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <h3 className="text-[17px] font-semibold text-[#171717]">
                {title}
            </h3>

            {description && (
                <p className="mt-1 text-[13px] text-[#777777]">
                    {description}
                </p>
            )}

            <div className="mt-5 space-y-4">
                {children}
            </div>
        </div>
    );
}

function FormField({
    label,
    required = false,
    error,
    children,
}) {
    return (
        <div>
            <label className="mb-2 block text-[13px] font-medium text-[#202020]">
                {label}

                {required && (
                    <span className="ml-1">
                        *
                    </span>
                )}
            </label>

            {children}

            {error && (
                <p className="mt-1 text-[12px] text-[#dc2626]">
                    {error}
                </p>
            )}
        </div>
    );
}

function PreferenceRow({
    title,
    description,
    checked,
    onChange,
}) {
    return (
        <div className="flex items-center justify-between gap-5">
            <div>
                <div className="text-[14px] font-medium text-[#202020]">
                    {title}
                </div>

                <div className="mt-[2px] text-[12px] text-[#777777]">
                    {description}
                </div>
            </div>

            <button
                type="button"
                onClick={onChange}
                className={`relative h-[22px] w-[38px] shrink-0 rounded-full transition ${
                    checked
                        ? "bg-[#2563d9]"
                        : "bg-[#dddddd]"
                }`}
            >
                <span
                    className={`absolute top-[3px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-all ${
                        checked
                            ? "left-[19px]"
                            : "left-[3px]"
                    }`}
                />
            </button>
        </div>
    );
}

function CustomerAvatar({
    customer,
}) {
    if (
        customer?.photo_url
    ) {
        return (
            <img
                src={
                    customer.photo_url
                }
                alt={
                    customer.name ||
                    "Customer"
                }
                className="h-[54px] w-[54px] shrink-0 rounded-full border border-[#eeeeee] object-cover"
            />
        );
    }

    return (
        <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-[#f3f3f3] text-[14px] font-medium text-[#333333]">
            {getInitials(
                customer?.name
            )}
        </div>
    );
}

function LoyaltyBadge({
    tier,
}) {
    const value =
        String(
            tier || "bronze"
        ).toLowerCase();

    const styles = {
        bronze:
            "bg-[#fff1e7] text-[#a55a14]",

        silver:
            "bg-[#f1f3f5] text-[#5d6670]",

        gold:
            "bg-[#fff3ca] text-[#976400]",

        platinum:
            "bg-[#e8f6f6] text-[#28706f]",
    };

    return (
        <span
            className={`rounded-full px-[9px] py-[3px] text-[11px] font-medium capitalize ${
                styles[value] ||
                styles.bronze
            }`}
        >
            {value}
        </span>
    );
}

function StatusBadge({
    status,
}) {
    const styles = {
        active:
            "bg-[#e8f8ef] text-[#12854a]",

        banned:
            "bg-[#fff0f0] text-[#d32f2f]",

        suspended:
            "bg-[#fff4df] text-[#a16a00]",

        pending_activation:
            "bg-[#f2f2f2] text-[#666666]",
    };

    const labels = {
        active:
            "Active",

        banned:
            "Banned",

        suspended:
            "Suspended",

        pending_activation:
            "Inactive",
    };

    return (
        <span
            className={`rounded-full px-[10px] py-[3px] text-[11px] font-semibold ${
                styles[status] ||
                styles.pending_activation
            }`}
        >
            {labels[status] ||
                "Inactive"}
        </span>
    );
}

const inputClass =
    "h-[42px] w-full rounded-[9px] border border-[#dddddd] bg-white px-3 text-[14px] text-[#222222] outline-none placeholder:text-[#999999] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]";

function formatCurrency(
    value
) {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }
    ).format(
        Number(
            value || 0
        )
    );
}

function formatNumber(
    value
) {
    return new Intl.NumberFormat(
        "en-US"
    ).format(
        Number(
            value || 0
        )
    );
}

function formatDate(
    value
) {
    if (!value) {
        return "—";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "—";
    }

    return date.toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
        }
    );
}

function getInitials(
    name
) {
    const value =
        String(
            name || ""
        ).trim();

    if (!value) {
        return "C";
    }

    const parts =
        value
            .split(/\s+/)
            .filter(Boolean);

    if (
        parts.length ===
        1
    ) {
        return parts[0]
            .slice(0, 1)
            .toUpperCase();
    }

    return (
        parts[0]
            .slice(0, 1) +
        parts[
            parts.length - 1
        ]
            .slice(0, 1)
    ).toUpperCase();
}

export default AdminCustomerEdit;