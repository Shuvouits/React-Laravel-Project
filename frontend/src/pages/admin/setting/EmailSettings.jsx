import {
    useEffect,
    useState,
} from "react";

import {
    CheckCircle2,
    Eye,
    EyeOff,
    LoaderCircle,
    Mail,
    Save,
    Send,
    Server,
    ShieldCheck,
} from "lucide-react";

import api from "../../../api/axios";

const EmailSettings = () => {
    const [form, setForm] = useState({
        is_enabled: false,
        mailer: "smtp",
        host: "",
        port: 587,
        username: "",
        password: "",
        has_password: false,
        encryption: "tls",
        from_address: "",
        from_name: "",
    });

    const [testEmail, setTestEmail] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [testing, setTesting] =
        useState(false);

    const [showPassword, setShowPassword] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [errors, setErrors] =
        useState({});

    /*
    |--------------------------------------------------------------------------
    | LOAD SETTINGS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await api.get(
                    "/admin/settings/email"
                );

            const setting =
                response.data?.setting;

            if (!setting) {
                return;
            }

            setForm({
                is_enabled:
                    Boolean(
                        setting.is_enabled
                    ),

                mailer:
                    setting.mailer ||
                    "smtp",

                host:
                    setting.host ||
                    "",

                port:
                    Number(
                        setting.port ||
                        587
                    ),

                username:
                    setting.username ||
                    "",

                password:
                    "",

                has_password:
                    Boolean(
                        setting.has_password
                    ),

                encryption:
                    setting.encryption ||
                    "tls",

                from_address:
                    setting.from_address ||
                    "",

                from_name:
                    setting.from_name ||
                    "",
            });

            if (
                setting.from_address
            ) {
                setTestEmail(
                    setting.from_address
                );
            }
        } catch (error) {
            console.error(
                "Email settings load error:",
                error.response?.data ||
                    error.message
            );

            setError(
                error.response?.data
                    ?.message ||
                    "Unable to load email settings."
            );
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | UPDATE FIELD
    |--------------------------------------------------------------------------
    */

    const updateField = (
        field,
        value
    ) => {
        setForm(
            (current) => ({
                ...current,
                [field]: value,
            })
        );

        setMessage("");
        setError("");

        if (errors[field]) {
            setErrors(
                (current) => ({
                    ...current,
                    [field]: null,
                })
            );
        }
    };

    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    const handleSave = async () => {
        if (saving) {
            return;
        }

        try {
            setSaving(true);
            setMessage("");
            setError("");
            setErrors({});

            const payload = {
                is_enabled:
                    Boolean(
                        form.is_enabled
                    ),

                mailer:
                    "smtp",

                host:
                    form.host.trim(),

                port:
                    Number(
                        form.port ||
                        587
                    ),

                username:
                    form.username.trim(),

                password:
                    form.password,

                encryption:
                    form.encryption,

                from_address:
                    form.from_address.trim(),

                from_name:
                    form.from_name.trim(),
            };

            const response =
                await api.put(
                    "/admin/settings/email",
                    payload
                );

            const setting =
                response.data?.setting;

            if (setting) {
                setForm(
                    (current) => ({
                        ...current,

                        is_enabled:
                            Boolean(
                                setting.is_enabled
                            ),

                        mailer:
                            setting.mailer ||
                            "smtp",

                        host:
                            setting.host ||
                            "",

                        port:
                            Number(
                                setting.port ||
                                587
                            ),

                        username:
                            setting.username ||
                            "",

                        password:
                            "",

                        has_password:
                            Boolean(
                                setting.has_password
                            ),

                        encryption:
                            setting.encryption ||
                            "tls",

                        from_address:
                            setting.from_address ||
                            "",

                        from_name:
                            setting.from_name ||
                            "",
                    })
                );
            }

            setMessage(
                response.data?.message ||
                    "Email configuration saved successfully."
            );
        } catch (error) {
            console.error(
                "Email settings save error:",
                error.response?.data ||
                    error.message
            );

            if (
                error.response?.status ===
                422
            ) {
                setErrors(
                    error.response?.data
                        ?.errors || {}
                );
            }

            setError(
                error.response?.data
                    ?.message ||
                    "Unable to save email configuration."
            );
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | TEST EMAIL
    |--------------------------------------------------------------------------
    */

    const handleTestEmail = async () => {
        if (testing) {
            return;
        }

        if (
            !testEmail.trim()
        ) {
            setError(
                "Enter an email address for the test message."
            );

            return;
        }

        try {
            setTesting(true);
            setMessage("");
            setError("");

            const response =
                await api.post(
                    "/admin/settings/email/test",
                    {
                        email:
                            testEmail.trim(),
                    }
                );

            setMessage(
                response.data?.message ||
                    "Test email sent successfully."
            );
        } catch (error) {
            console.error(
                "SMTP test error:",
                error.response?.data ||
                    error.message
            );

            setError(
                error.response?.data
                    ?.message ||
                    "Unable to send test email."
            );
        } finally {
            setTesting(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | PROVIDER PRESETS
    |--------------------------------------------------------------------------
    */

    const applyPreset = (
        provider
    ) => {
        if (
            provider === "gmail"
        ) {
            setForm(
                (current) => ({
                    ...current,
                    host:
                        "smtp.gmail.com",
                    port:
                        587,
                    encryption:
                        "tls",
                })
            );
        }

        if (
            provider === "outlook"
        ) {
            setForm(
                (current) => ({
                    ...current,
                    host:
                        "smtp.office365.com",
                    port:
                        587,
                    encryption:
                        "tls",
                })
            );
        }

        if (
            provider === "custom"
        ) {
            setForm(
                (current) => ({
                    ...current,
                    host: "",
                    port: 587,
                    encryption: "tls",
                })
            );
        }

        setMessage("");
        setError("");
    };

    if (loading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <LoaderCircle
                    size={28}
                    className="animate-spin text-[#2065D1]"
                />
            </div>
        );
    }

    const configured =
        Boolean(
            form.host &&
            form.from_address &&
            (
                form.has_password ||
                form.password
            )
        );

    return (
        <div className="w-full">

            <div className="rounded-[14px] border border-[#e2e2e2] bg-white px-[22px] py-[18px]">

                <div className="flex items-start justify-between gap-5">

                    <div>
                        <h1 className="text-[17px] font-semibold text-[#333]">
                            Email Configuration (SMTP)
                        </h1>

                        <p className="mt-[3px] text-[13px] text-[#999]">
                            Configure outgoing email delivery for your store
                        </p>
                    </div>

                    <StatusBadge
                        enabled={
                            form.is_enabled
                        }
                        configured={
                            configured
                        }
                    />

                </div>

            </div>

            {(message || error) && (
                <div
                    className={`mt-[15px] flex items-start gap-[9px] rounded-[12px] border px-[14px] py-[11px] text-[12px] ${
                        error
                            ? "border-red-200 bg-red-50 text-red-600"
                            : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}
                >
                    {error ? (
                        <span className="mt-[1px] font-bold">
                            !
                        </span>
                    ) : (
                        <CheckCircle2
                            size={15}
                            className="mt-[1px] shrink-0"
                        />
                    )}

                    <span>
                        {error ||
                            message}
                    </span>
                </div>
            )}

            <section className="mt-[20px] overflow-hidden rounded-[14px] border border-[#e2e2e2] bg-white">

                <div className="flex min-h-[72px] items-center justify-between gap-[20px] border-b border-[#e8e8e8] px-[22px]">

                    <div className="flex items-center gap-[12px]">

                        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-[#edf3ff] text-[#2065D1]">
                            <Mail
                                size={18}
                            />
                        </div>

                        <div>
                            <div className="flex items-center gap-[8px]">

                                <h2 className="text-[14px] font-semibold text-[#444]">
                                    SMTP Email Delivery
                                </h2>

                                {configured && (
                                    <span className="rounded-full bg-[#eaf8f0] px-[8px] py-[3px] text-[9px] font-semibold text-[#2e9d61]">
                                        Configured
                                    </span>
                                )}

                            </div>

                            <p className="mt-[2px] text-[11px] text-[#999]">
                                Send transactional and notification emails through your SMTP server
                            </p>
                        </div>

                    </div>

                    <Toggle
                        active={
                            form.is_enabled
                        }
                        onClick={() =>
                            updateField(
                                "is_enabled",
                                !form.is_enabled
                            )
                        }
                    />

                </div>

                <div className="px-[22px] py-[20px]">

                    <div>
                        <label className="mb-[8px] block text-[11px] font-medium text-[#555]">
                            Quick Provider Setup
                        </label>

                        <div className="flex flex-wrap gap-[8px]">

                            <PresetButton
                                title="Gmail"
                                onClick={() =>
                                    applyPreset(
                                        "gmail"
                                    )
                                }
                            />

                            <PresetButton
                                title="Microsoft 365"
                                onClick={() =>
                                    applyPreset(
                                        "outlook"
                                    )
                                }
                            />

                            <PresetButton
                                title="Custom SMTP"
                                onClick={() =>
                                    applyPreset(
                                        "custom"
                                    )
                                }
                            />

                        </div>
                    </div>

                    <div className="mt-[20px] grid grid-cols-1 gap-[16px] xl:grid-cols-2">

                        <InputField
                            label="SMTP Host"
                            value={
                                form.host
                            }
                            placeholder="smtp.gmail.com"
                            error={
                                errors
                                    .host?.[0]
                            }
                            onChange={(
                                value
                            ) =>
                                updateField(
                                    "host",
                                    value
                                )
                            }
                        />

                        <div className="grid grid-cols-[1fr_1.2fr] gap-[10px]">

                            <InputField
                                label="Port"
                                type="number"
                                value={
                                    form.port
                                }
                                placeholder="587"
                                error={
                                    errors
                                        .port?.[0]
                                }
                                onChange={(
                                    value
                                ) =>
                                    updateField(
                                        "port",
                                        value
                                    )
                                }
                            />

                            <SelectField
                                label="Encryption"
                                value={
                                    form.encryption
                                }
                                onChange={(
                                    value
                                ) =>
                                    updateField(
                                        "encryption",
                                        value
                                    )
                                }
                                options={[
                                    {
                                        value:
                                            "tls",
                                        label:
                                            "TLS / STARTTLS",
                                    },
                                    {
                                        value:
                                            "ssl",
                                        label:
                                            "SSL",
                                    },
                                ]}
                            />

                        </div>

                    </div>

                    <div className="mt-[16px] grid grid-cols-1 gap-[16px] xl:grid-cols-2">

                        <InputField
                            label="SMTP Username"
                            value={
                                form.username
                            }
                            placeholder="your@email.com"
                            error={
                                errors
                                    .username?.[0]
                            }
                            onChange={(
                                value
                            ) =>
                                updateField(
                                    "username",
                                    value
                                )
                            }
                        />

                        <PasswordField
                            value={
                                form.password
                            }
                            show={
                                showPassword
                            }
                            hasExistingPassword={
                                form.has_password
                            }
                            error={
                                errors
                                    .password?.[0]
                            }
                            onToggle={() =>
                                setShowPassword(
                                    (
                                        current
                                    ) =>
                                        !current
                                )
                            }
                            onChange={(
                                value
                            ) =>
                                updateField(
                                    "password",
                                    value
                                )
                            }
                        />

                    </div>

                    <div className="mt-[16px] grid grid-cols-1 gap-[16px] xl:grid-cols-2">

                        <InputField
                            label="From Email"
                            type="email"
                            value={
                                form.from_address
                            }
                            placeholder="store@example.com"
                            error={
                                errors
                                    .from_address?.[0]
                            }
                            onChange={(
                                value
                            ) =>
                                updateField(
                                    "from_address",
                                    value
                                )
                            }
                        />

                        <InputField
                            label="From Name"
                            value={
                                form.from_name
                            }
                            placeholder="Storify"
                            error={
                                errors
                                    .from_name?.[0]
                            }
                            onChange={(
                                value
                            ) =>
                                updateField(
                                    "from_name",
                                    value
                                )
                            }
                        />

                    </div>

                    <div className="mt-[18px] rounded-[12px] border border-[#e7eaf0] bg-[#fafbfc] px-[14px] py-[12px]">

                        <div className="flex gap-[10px]">

                            <ShieldCheck
                                size={17}
                                className="mt-[1px] shrink-0 text-[#5279c9]"
                            />

                            <div>
                                <p className="text-[11px] font-semibold text-[#555]">
                                    SMTP credentials are stored securely
                                </p>

                                <p className="mt-[3px] text-[10px] leading-[17px] text-[#888]">
                                    The SMTP password is encrypted before being stored. After saving, the password field stays blank and the existing password is preserved unless you enter a new one.
                                </p>
                            </div>

                        </div>

                    </div>

                </div>

                <div className="flex justify-end border-t border-[#ececec] bg-[#fcfcfd] px-[22px] py-[14px]">

                    <button
                        type="button"
                        onClick={
                            handleSave
                        }
                        disabled={
                            saving ||
                            testing
                        }
                        className="flex h-[36px] items-center gap-[7px] rounded-[10px] bg-[#2065D1] px-[15px] text-[11px] font-semibold text-white transition hover:bg-[#1957b7] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving ? (
                            <LoaderCircle
                                size={14}
                                className="animate-spin"
                            />
                        ) : (
                            <Save
                                size={14}
                            />
                        )}

                        {saving
                            ? "Saving..."
                            : "Save Changes"}
                    </button>

                </div>

            </section>

            <section className="mt-[20px] overflow-hidden rounded-[14px] border border-[#e2e2e2] bg-white">

                <div className="flex min-h-[68px] items-center gap-[12px] border-b border-[#e8e8e8] px-[22px]">

                    <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-[#f4f6fa] text-[#555]">
                        <Send
                            size={17}
                        />
                    </div>

                    <div>
                        <h2 className="text-[14px] font-semibold text-[#444]">
                            Send Test Email
                        </h2>

                        <p className="mt-[2px] text-[11px] text-[#999]">
                            Verify that your saved SMTP configuration can deliver email
                        </p>
                    </div>

                </div>

                <div className="px-[22px] py-[20px]">

                    <div className="flex max-w-[680px] flex-col gap-[10px] sm:flex-row">

                        <div className="min-w-0 flex-1">

                            <label className="mb-[6px] block text-[11px] font-medium text-[#555]">
                                Send test email to
                            </label>

                            <input
                                type="email"
                                value={
                                    testEmail
                                }
                                onChange={(
                                    event
                                ) =>
                                    setTestEmail(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="your@email.com"
                                className="h-[38px] w-full rounded-[10px] border border-[#dedfe2] bg-white px-[11px] text-[11px] text-[#555] outline-none transition focus:border-[#8fb0e8]"
                            />

                        </div>

                        <button
                            type="button"
                            onClick={
                                handleTestEmail
                            }
                            disabled={
                                testing ||
                                saving ||
                                !configured
                            }
                            className="mt-0 flex h-[38px] shrink-0 items-center justify-center gap-[7px] self-end rounded-[10px] border border-[#dedfe3] bg-white px-[15px] text-[11px] font-semibold text-[#555] transition hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-[21px]"
                        >
                            {testing ? (
                                <LoaderCircle
                                    size={14}
                                    className="animate-spin"
                                />
                            ) : (
                                <Send
                                    size={14}
                                />
                            )}

                            {testing
                                ? "Sending..."
                                : "Send Test"}
                        </button>

                    </div>

                    {!configured && (
                        <p className="mt-[9px] text-[10px] text-[#999]">
                            Save a valid SMTP configuration before sending a test email.
                        </p>
                    )}

                </div>

            </section>

        </div>
    );
};

/*
|--------------------------------------------------------------------------
| INPUT FIELD
|--------------------------------------------------------------------------
*/

const InputField = ({
    label,
    value,
    placeholder,
    onChange,
    error,
    type = "text",
}) => {
    return (
        <div>

            <label className="mb-[6px] block text-[11px] font-medium text-[#555]">
                {label}
            </label>

            <input
                type={type}
                value={
                    value ?? ""
                }
                placeholder={
                    placeholder
                }
                onChange={(
                    event
                ) =>
                    onChange(
                        event.target.value
                    )
                }
                className={`h-[38px] w-full rounded-[10px] border bg-white px-[11px] text-[11px] text-[#555] outline-none transition ${
                    error
                        ? "border-red-400 focus:border-red-400"
                        : "border-[#dedfe2] focus:border-[#8fb0e8]"
                }`}
            />

            {error && (
                <p className="mt-[5px] text-[10px] text-red-500">
                    {error}
                </p>
            )}

        </div>
    );
};

/*
|--------------------------------------------------------------------------
| PASSWORD FIELD
|--------------------------------------------------------------------------
*/

const PasswordField = ({
    value,
    show,
    hasExistingPassword,
    onToggle,
    onChange,
    error,
}) => {
    const placeholder =
        hasExistingPassword
            ? "Stored securely ••••••••••••"
            : "Enter SMTP password";

    return (
        <div>

            <label className="mb-[6px] block text-[11px] font-medium text-[#555]">
                SMTP Password
            </label>

            <div className="relative">

                <input
                    type={
                        show
                            ? "text"
                            : "password"
                    }
                    value={value}
                    placeholder={
                        placeholder
                    }
                    onChange={(
                        event
                    ) =>
                        onChange(
                            event.target.value
                        )
                    }
                    autoComplete="new-password"
                    className={`h-[38px] w-full rounded-[10px] border bg-white px-[11px] pr-[40px] text-[11px] text-[#555] outline-none transition ${
                        error
                            ? "border-red-400"
                            : "border-[#dedfe2] focus:border-[#8fb0e8]"
                    }`}
                />

                <button
                    type="button"
                    onClick={
                        onToggle
                    }
                    title={
                        show
                            ? "Hide password"
                            : "Show password"
                    }
                    className="absolute right-[10px] top-1/2 -translate-y-1/2 text-[#888] transition hover:text-[#2065D1]"
                >
                    {show ? (
                        <EyeOff
                            size={15}
                        />
                    ) : (
                        <Eye
                            size={15}
                        />
                    )}
                </button>

            </div>

            {error ? (
                <p className="mt-[5px] text-[10px] text-red-500">
                    {error}
                </p>
            ) : hasExistingPassword ? (
                <p className="mt-[5px] text-[9px] text-[#999]">
                    Leave blank to keep the existing password.
                </p>
            ) : null}

        </div>
    );
};

/*
|--------------------------------------------------------------------------
| SELECT
|--------------------------------------------------------------------------
*/

const SelectField = ({
    label,
    value,
    onChange,
    options,
}) => {
    return (
        <div>

            <label className="mb-[6px] block text-[11px] font-medium text-[#555]">
                {label}
            </label>

            <select
                value={value}
                onChange={(
                    event
                ) =>
                    onChange(
                        event.target.value
                    )
                }
                className="h-[38px] w-full rounded-[10px] border border-[#dedfe2] bg-white px-[10px] text-[11px] text-[#555] outline-none focus:border-[#8fb0e8]"
            >
                {options.map(
                    (option) => (
                        <option
                            key={
                                option.value
                            }
                            value={
                                option.value
                            }
                        >
                            {option.label}
                        </option>
                    )
                )}
            </select>

        </div>
    );
};

/*
|--------------------------------------------------------------------------
| PROVIDER PRESET
|--------------------------------------------------------------------------
*/

const PresetButton = ({
    title,
    onClick,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex h-[34px] items-center gap-[6px] rounded-[9px] border border-[#dedfe3] bg-white px-[12px] text-[10px] font-medium text-[#555] transition hover:border-[#b9cae8] hover:bg-[#f8faff] hover:text-[#2065D1]"
        >
            <Server
                size={13}
            />

            {title}
        </button>
    );
};

/*
|--------------------------------------------------------------------------
| TOGGLE
|--------------------------------------------------------------------------
*/

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
                    ? "bg-[#2065D1]"
                    : "bg-[#dcdfe4]"
            }`}
        >
            <span
                className={`absolute top-[3px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-all ${
                    active
                        ? "left-[19px]"
                        : "left-[3px]"
                }`}
            />
        </button>
    );
};

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

const StatusBadge = ({
    enabled,
    configured,
}) => {
    if (
        enabled &&
        configured
    ) {
        return (
            <span className="rounded-full bg-[#eaf8f0] px-[10px] py-[5px] text-[9px] font-semibold text-[#269159]">
                Active
            </span>
        );
    }

    if (configured) {
        return (
            <span className="rounded-full bg-[#fff6e4] px-[10px] py-[5px] text-[9px] font-semibold text-[#bc7918]">
                Configured
            </span>
        );
    }

    return (
        <span className="rounded-full bg-[#f1f2f4] px-[10px] py-[5px] text-[9px] font-semibold text-[#777]">
            Not configured
        </span>
    );
};

export default EmailSettings;