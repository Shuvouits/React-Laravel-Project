import { useEffect, useState } from "react";
import {
    CheckCircle2,
    LoaderCircle,
    Save,
    TestTube2,
} from "lucide-react";

import api from "../../../api/axios";

const gatewayDefinitions = {
    stripe: {
        name: "Stripe",
        shortName: "S",
        description: "Accept credit & debit cards globally",
        defaultMode: "test",
        modes: [
            {
                value: "test",
                label: "Test",
            },
            {
                value: "live",
                label: "Live",
            },
        ],
        fields: [
            {
                name: "publishable_key",
                label: "Publishable Key",
            },
            {
                name: "secret_key",
                label: "Secret Key",
            },
            {
                name: "webhook_secret",
                label: "Webhook Secret",
                fullWidth: true,
                help: "Required for handling payment events. Get this from Stripe Dashboard → Developers → Webhooks.",
            },
        ],
    },

    paypal: {
        name: "PayPal",
        shortName: "P",
        description: "Trusted global checkout & wallet",
        defaultMode: "sandbox",
        modes: [
            {
                value: "sandbox",
                label: "Sandbox",
            },
            {
                value: "live",
                label: "Live",
            },
        ],
        fields: [
            {
                name: "client_id",
                label: "Client ID",
            },
            {
                name: "client_secret",
                label: "Client Secret",
            },
            {
                name: "webhook_id",
                label: "Webhook ID",
            },
        ],
    },

   sslcommerz: {
    name: "SSLCommerz",
    shortName: "S",
    description: "Cards, mobile banking and internet banking",
    defaultMode: "sandbox",

    modes: [
        {
            value: "sandbox",
            label: "Sandbox",
        },
        {
            value: "live",
            label: "Live",
        },
    ],

    fields: [
        {
            name: "store_id",
            label: "Store ID",
        },
        {
            name: "store_password",
            label: "Store Password",
        },
    ],
},



};

const PaymentSettings = () => {
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/admin/settings/payments"
            );

            const gateways =
                response.data?.gateways || [];

            const formatted = {};

            gateways.forEach((gateway) => {
                const definition =
                    gatewayDefinitions[gateway.gateway];

                if (!definition) {
                    return;
                }

                formatted[gateway.gateway] = {
                    gateway: gateway.gateway,
                    is_enabled: Boolean(
                        gateway.is_enabled
                    ),
                    mode:
                        gateway.mode ||
                        definition.defaultMode,
                    configured: Boolean(
                        gateway.configured
                    ),
                    values: getSavedValues(
                        definition,
                        gateway.fields
                    ),
                };
            });

            setSettings(formatted);
        } catch (error) {
            console.error(
                "Payment settings error:",
                error.response?.data ||
                error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to load payment settings."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (gateway) => {
        setSettings((current) => {
            return {
                ...current,
                [gateway]: {
                    ...current[gateway],
                    is_enabled:
                        !current[gateway].is_enabled,
                },
            };
        });

        setSuccess("");
    };

    const handleModeChange = (
        gateway,
        value
    ) => {
        setSettings((current) => {
            return {
                ...current,
                [gateway]: {
                    ...current[gateway],
                    mode: value,
                },
            };
        });

        setSuccess("");
    };

    const handleFieldChange = (
        gateway,
        field,
        value
    ) => {
        setSettings((current) => {
            return {
                ...current,
                [gateway]: {
                    ...current[gateway],
                    values: {
                        ...current[gateway].values,
                        [field]: value,
                    },
                },
            };
        });

        setSuccess("");
    };

    const handleSave = async () => {
        if (saving) {
            return;
        }

        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const requests = Object.keys(
                settings
            ).map((gateway) => {
                const gatewaySetting =
                    settings[gateway];

                const payload = {
                    is_enabled:
                        gatewaySetting.is_enabled,
                    mode:
                        gatewaySetting.mode,
                };

                Object.entries(
                    gatewaySetting.values
                ).forEach(([field, value]) => {
                    if (
                        typeof value === "string" &&
                        value.trim() !== ""
                    ) {
                        payload[field] =
                            value.trim();
                    }
                });

                return api.put(
                    `/admin/settings/payments/${gateway}`,
                    payload
                );
            });

            await Promise.all(requests);

            await fetchSettings();

            setSuccess(
                "Payment settings saved successfully."
            );
        } catch (error) {
            console.error(
                "Payment settings save error:",
                error.response?.data ||
                error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to save payment settings."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <PaymentSettingsLoader />;
    }

    const activeCount = Object.values(
        settings
    ).filter((gateway) => {
        return gateway.is_enabled;
    }).length;

    return (
        <div className="w-full">

            <div className="rounded-[14px] border border-[#e2e2e2] bg-white px-[22px] py-[20px]">

                <div className="flex items-center justify-between gap-[20px]">

                    <div>
                        <h1 className="text-[17px] font-semibold text-[#333]">
                            Payment Settings
                        </h1>

                        <p className="mt-[4px] text-[13px] text-[#999]">
                            Configure payment gateways and options
                        </p>
                    </div>

                    <span className="rounded-full bg-[#9868ec] px-[10px] py-[4px] text-[11px] font-semibold text-white">
                        {activeCount} active
                    </span>

                </div>

            </div>

            {error && (
                <div className="mt-[16px] rounded-[12px] border border-red-200 bg-red-50 px-[15px] py-[11px] text-[13px] text-red-600">
                    {error}
                </div>
            )}

            {success && (
                <div className="mt-[16px] flex items-center gap-[8px] rounded-[12px] border border-green-200 bg-green-50 px-[15px] py-[11px] text-[13px] text-green-700">

                    <CheckCircle2 size={16} />

                    {success}

                </div>
            )}

            <div className="mt-[20px] space-y-[20px]">

                {Object.keys(gatewayDefinitions).map((gateway) => {
                    const setting =
                        settings[gateway];

                    if (!setting) {
                        return null;
                    }

                    return (
                        <PaymentGatewayCard
                            key={gateway}
                            gateway={gateway}
                            definition={gatewayDefinitions[gateway]}
                            setting={setting}
                            onToggle={handleToggle}
                            onModeChange={handleModeChange}
                            onFieldChange={handleFieldChange}
                        />
                    );
                })}

            </div>

            <div className="sticky bottom-[12px] z-20 mt-[20px] flex justify-end">

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex h-[40px] min-w-[145px] items-center justify-center gap-[8px] rounded-[11px] bg-[#8eb4ef] px-[18px] text-[13px] font-semibold text-white shadow-[0_4px_15px_rgba(32,101,209,0.20)] transition hover:bg-[#75a4e9] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {saving ? (
                        <LoaderCircle
                            size={15}
                            className="animate-spin"
                        />
                    ) : (
                        <Save size={15} />
                    )}

                    {saving
                        ? "Saving..."
                        : "Save Changes"}
                </button>

            </div>

        </div>
    );
};

const PaymentGatewayCard = ({
    gateway,
    definition,
    setting,
    onToggle,
    onModeChange,
    onFieldChange,
}) => {
    return (
        <section className="overflow-hidden rounded-[14px] border border-[#e2e2e2] bg-white">

            <div className="flex min-h-[72px] items-center justify-between gap-[20px] border-b border-[#e8e8e8] px-[20px]">

                <div className="flex min-w-0 items-center gap-[12px]">

                    <GatewayLogo
                        gateway={gateway}
                        label={definition.shortName}
                    />

                    <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-[7px]">

                            <h2 className="text-[14px] font-semibold text-[#444]">
                                {definition.name}
                            </h2>

                            {setting.configured && (
                                <span className="flex items-center gap-[4px] rounded-full bg-[#e7f7f0] px-[8px] py-[3px] text-[10px] font-medium text-[#27a779]">
                                    <CheckCircle2 size={11} />
                                    Configured
                                </span>
                            )}

                            <ModeSelect
                                gateway={gateway}
                                value={setting.mode}
                                options={definition.modes}
                                onChange={onModeChange}
                            />

                        </div>

                        <p className="mt-[2px] text-[12px] text-[#999]">
                            {definition.description}
                        </p>

                    </div>

                </div>

                <Toggle
                    active={setting.is_enabled}
                    onClick={() => {
                        onToggle(gateway);
                    }}
                />

            </div>

            <div className="px-[20px] pb-[18px] pt-[16px]">

                <div className="grid grid-cols-1 gap-x-[16px] gap-y-[14px] md:grid-cols-2">

                    {definition.fields.map((field) => (
                        <GatewayField
                            key={field.name}
                            gateway={gateway}
                            field={field}
                            setting={setting}
                            onChange={onFieldChange}
                        />
                    ))}

                </div>

                <div className="mt-[16px] flex justify-end">

                    <button
                        type="button"
                        disabled
                        className="flex h-[36px] items-center gap-[7px] rounded-[10px] border border-[#e5e5e5] bg-white px-[14px] text-[12px] font-medium text-[#aaa] disabled:cursor-not-allowed"
                    >
                        <TestTube2 size={14} />
                        Test connection
                    </button>

                </div>

            </div>

        </section>
    );
};

const GatewayField = ({
    gateway,
    field,
    setting,
    onChange,
}) => {
    const value =
        setting.values?.[field.name] || "";

    return (
        <div
            className={
                field.fullWidth
                    ? "md:col-span-2"
                    : ""
            }
        >

            <label className="mb-[6px] block text-[12px] font-medium text-[#555]">
                {field.label}
            </label>

            <input
                type="text"
                value={value}
                placeholder={`Enter ${field.label.toLowerCase()}`}
                onChange={(event) => {
                    onChange(
                        gateway,
                        field.name,
                        event.target.value
                    );
                }}
                className="h-[36px] w-full rounded-[10px] border border-[#e4e4e4] bg-white px-[11px] text-[12px] text-[#444] outline-none transition placeholder:text-[#c2c2c2] focus:border-[#9db9e6]"
            />

            {field.help && (
                <p className="mt-[6px] text-[11px] leading-[17px] text-[#aaa]">
                    {field.help}
                </p>
            )}

        </div>
    );
};

const ModeSelect = ({
    gateway,
    value,
    options,
    onChange,
}) => {
    return (
        <select
            value={value}
            onChange={(event) => {
                onChange(
                    gateway,
                    event.target.value
                );
            }}
            className={`h-[25px] rounded-full border-0 px-[9px] text-[10px] font-medium outline-none ${
                value === "live"
                    ? "bg-[#e8f7ef] text-[#218c62]"
                    : "bg-[#fff3df] text-[#e38b28]"
            }`}
        >
            {options.map((option) => (
                <option
                    key={option.value}
                    value={option.value}
                >
                    {option.label}
                </option>
            ))}
        </select>
    );
};

const Toggle = ({
    active,
    onClick,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative h-[20px] w-[36px] shrink-0 rounded-full transition ${
                active
                    ? "bg-[#8db7ee]"
                    : "bg-[#d9dce1]"
            }`}
        >
            <span
                className={`absolute top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition-all ${
                    active
                        ? "left-[18px]"
                        : "left-[2px]"
                }`}
            />
        </button>
    );
};

const GatewayLogo = ({
    gateway,
    label,
}) => {
    let className =
        "bg-[#8068ef]";

    if (gateway === "paypal") {
        className =
            "bg-[#496fb6]";
    }

   if (gateway === "sslcommerz") {
    className = "bg-[#169447]";
}

    return (
        <div
            className={`flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[12px] text-[18px] font-bold text-white ${className}`}
        >
            {label}
        </div>
    );
};

const PaymentSettingsLoader = () => {
    return (
        <div className="flex min-h-[500px] items-center justify-center">

            <LoaderCircle
                size={27}
                className="animate-spin text-[#2065D1]"
            />

        </div>
    );
};

const getSavedValues = (
    definition,
    fields
) => {
    const values = {};

    definition.fields.forEach((field) => {
        values[field.name] =
            fields?.[field.name]?.value || "";
    });

    return values;
};

export default PaymentSettings;