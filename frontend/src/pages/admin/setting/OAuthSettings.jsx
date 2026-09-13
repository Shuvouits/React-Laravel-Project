import {
    useEffect,
    useState,
} from "react";

import {
    CheckCircle2,
    Copy,
    Eye,
    EyeOff,
    KeyRound,
    LoaderCircle,
    Save,
    ShieldCheck,
    TestTube2,
} from "lucide-react";

import api from "../../../api/axios";

const OAuthSettings = () => {
    const [form, setForm] = useState({
        provider: "google",
        is_enabled: false,
        client_id: "",
        client_secret: "",
        has_client_secret: false,
        redirect_uri: "",
    });

    const [loading, setLoading] =
        useState(true);

    const [saving, setSaving] =
        useState(false);

    const [testing, setTesting] =
        useState(false);

    const [
        showSecret,
        setShowSecret,
    ] = useState(false);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [errors, setErrors] =
        useState({});

    useEffect(() => {
        loadSettings();
    }, []);

    /*
    |--------------------------------------------------------------------------
    | LOAD SETTINGS
    |--------------------------------------------------------------------------
    */

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError("");

            const response =
                await api.get(
                    "/admin/settings/social-login"
                );

            const settings =
                response.data?.settings ||
                [];

            const google =
                settings.find(
                    (item) =>
                        item.provider ===
                        "google"
                );

            if (!google) {
                return;
            }

            setForm({
                provider: "google",

                is_enabled:
                    Boolean(
                        google.is_enabled
                    ),

                client_id:
                    google.client_id ||
                    "",

                client_secret:
                    "",

                has_client_secret:
                    Boolean(
                        google.has_client_secret
                    ),

                redirect_uri:
                    google.redirect_uri ||
                    "",
            });
        } catch (error) {
            console.error(
                "Social login settings error:",
                error.response?.data ||
                    error.message
            );

            setError(
                error.response?.data
                    ?.message ||
                    "Unable to load social login settings."
            );
        } finally {
            setLoading(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | FIELD CHANGE
    |--------------------------------------------------------------------------
    */

    const updateField = (
        field,
        value
    ) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

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
    | SAVE SETTINGS
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

                client_id:
                    form.client_id.trim(),

                redirect_uri:
                    form.redirect_uri.trim(),

                client_secret:
                    form.client_secret.trim(),
            };

            const response =
                await api.put(
                    "/admin/settings/social-login/google",
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

                        client_id:
                            setting.client_id ||
                            "",

                        client_secret:
                            "",

                        has_client_secret:
                            Boolean(
                                setting.has_client_secret
                            ),

                        redirect_uri:
                            setting.redirect_uri ||
                            "",
                    })
                );
            }

            setMessage(
                response.data?.message ||
                    "Google login settings saved successfully."
            );
        } catch (error) {
            console.error(
                "Social login save error:",
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
                    "Unable to save Google login settings."
            );
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | TEST CONNECTION
    |--------------------------------------------------------------------------
    */

    const handleTest = async () => {
        if (testing) {
            return;
        }

        try {
            setTesting(true);
            setMessage("");
            setError("");

            const response =
                await api.post(
                    "/admin/settings/social-login/google/test"
                );

            setMessage(
                response.data?.message ||
                    "Google OAuth configuration is ready."
            );
        } catch (error) {
            console.error(
                "Google OAuth test error:",
                error.response?.data ||
                    error.message
            );

            setError(
                error.response?.data
                    ?.message ||
                    "Google OAuth connection could not be verified."
            );
        } finally {
            setTesting(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | COPY REDIRECT URI
    |--------------------------------------------------------------------------
    */

    const copyRedirectUri =
        async () => {
            if (
                !form.redirect_uri
            ) {
                return;
            }

            try {
                await navigator.clipboard.writeText(
                    form.redirect_uri
                );

                setMessage(
                    "Redirect URI copied."
                );
            } catch {
                setError(
                    "Unable to copy the redirect URI."
                );
            }
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

    return (
        <div className="w-full">

            <div className="rounded-[14px] border border-[#e2e2e2] bg-white px-[22px] py-[18px]">
                <div className="flex items-start justify-between gap-5">

                    <div>
                        <h1 className="text-[17px] font-semibold text-[#333]">
                            OAuth / Social Login
                        </h1>

                        <p className="mt-[3px] text-[13px] text-[#999]">
                            Configure social login providers for your storefront
                        </p>
                    </div>

                    <ProviderStatus
                        enabled={
                            form.is_enabled
                        }
                        configured={
                            Boolean(
                                form.client_id &&
                                form.has_client_secret &&
                                form.redirect_uri
                            )
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
                        <span className="mt-[1px]">
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

                        <GoogleLogo />

                        <div>
                            <div className="flex items-center gap-[8px]">
                                <h2 className="text-[14px] font-semibold text-[#444]">
                                    Google
                                </h2>

                                {form.has_client_secret &&
                                    form.client_id && (
                                        <span className="rounded-full bg-[#eaf8f0] px-[8px] py-[3px] text-[9px] font-semibold text-[#2e9d61]">
                                            Configured
                                        </span>
                                    )}
                            </div>

                            <p className="mt-[2px] text-[11px] text-[#999]">
                                Allow customers to sign in using their Google account
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

                    <div className="grid grid-cols-1 gap-[16px] xl:grid-cols-2">

                        <InputField
                            label="Client ID"
                            value={
                                form.client_id
                            }
                            placeholder="xxxxxxxx.apps.googleusercontent.com"
                            error={
                                errors
                                    .client_id?.[0]
                            }
                            onChange={(
                                value
                            ) =>
                                updateField(
                                    "client_id",
                                    value
                                )
                            }
                        />

                        <SecretField
                            value={
                                form.client_secret
                            }
                            hasExistingSecret={
                                form.has_client_secret
                            }
                            show={
                                showSecret
                            }
                            error={
                                errors
                                    .client_secret?.[0]
                            }
                            onToggle={() =>
                                setShowSecret(
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
                                    "client_secret",
                                    value
                                )
                            }
                        />

                    </div>

                    <div className="mt-[16px]">
                        <RedirectField
                            value={
                                form.redirect_uri
                            }
                            error={
                                errors
                                    .redirect_uri?.[0]
                            }
                            onChange={(
                                value
                            ) =>
                                updateField(
                                    "redirect_uri",
                                    value
                                )
                            }
                            onCopy={
                                copyRedirectUri
                            }
                        />
                    </div>

                    <div className="mt-[17px] rounded-[12px] border border-[#e7eaf0] bg-[#fafbfc] px-[14px] py-[12px]">

                        <div className="flex gap-[10px]">

                            <ShieldCheck
                                size={17}
                                className="mt-[1px] shrink-0 text-[#5279c9]"
                            />

                            <div>
                                <p className="text-[11px] font-semibold text-[#555]">
                                    Google Cloud configuration
                                </p>

                                <p className="mt-[3px] text-[10px] leading-[17px] text-[#888]">
                                    Add the exact Redirect URI shown above to your Google OAuth Web Application under Authorized redirect URIs.
                                </p>
                            </div>

                        </div>

                    </div>

                </div>

                <div className="flex flex-wrap items-center justify-end gap-[10px] border-t border-[#ececec] bg-[#fcfcfd] px-[22px] py-[14px]">

                    <button
                        type="button"
                        onClick={
                            handleTest
                        }
                        disabled={
                            testing ||
                            saving ||
                            !form.client_id ||
                            !form.has_client_secret ||
                            !form.redirect_uri
                        }
                        className="flex h-[36px] items-center gap-[7px] rounded-[10px] border border-[#dedfe3] bg-white px-[14px] text-[11px] font-semibold text-[#555] transition hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {testing ? (
                            <LoaderCircle
                                size={14}
                                className="animate-spin"
                            />
                        ) : (
                            <TestTube2
                                size={14}
                            />
                        )}

                        {testing
                            ? "Testing..."
                            : "Test Connection"}
                    </button>

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

        </div>
    );
};

/*
|--------------------------------------------------------------------------
| INPUT
|--------------------------------------------------------------------------
*/

const InputField = ({
    label,
    value,
    placeholder,
    onChange,
    error,
}) => {
    return (
        <div>
            <label className="mb-[6px] block text-[11px] font-medium text-[#555]">
                {label}
            </label>

            <input
                type="text"
                value={value}
                placeholder={
                    placeholder
                }
                onChange={(
                    event
                ) =>
                    onChange(
                        event.target
                            .value
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
| SECRET
|--------------------------------------------------------------------------
*/

const SecretField = ({
    value,
    hasExistingSecret,
    show,
    onToggle,
    onChange,
    error,
}) => {
    const placeholder =
        hasExistingSecret
            ? "Stored securely ••••••••••••"
            : "Enter Google client secret";

    return (
        <div>
            <label className="mb-[6px] block text-[11px] font-medium text-[#555]">
                Client Secret
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
                            event
                                .target
                                .value
                        )
                    }
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
            ) : (
                hasExistingSecret && (
                    <p className="mt-[5px] text-[9px] text-[#999]">
                        Leave blank to keep the existing secret.
                    </p>
                )
            )}
        </div>
    );
};

/*
|--------------------------------------------------------------------------
| REDIRECT URI
|--------------------------------------------------------------------------
*/

const RedirectField = ({
    value,
    error,
    onChange,
    onCopy,
}) => {
    return (
        <div>
            <label className="mb-[6px] block text-[11px] font-medium text-[#555]">
                Authorized Redirect URI
            </label>

            <div className="flex gap-[8px]">

                <input
                    type="url"
                    value={value}
                    onChange={(
                        event
                    ) =>
                        onChange(
                            event.target
                                .value
                        )
                    }
                    placeholder="https://api.example.com/api/auth/social/google/callback"
                    className={`h-[38px] min-w-0 flex-1 rounded-[10px] border bg-white px-[11px] text-[11px] text-[#555] outline-none ${
                        error
                            ? "border-red-400"
                            : "border-[#dedfe2] focus:border-[#8fb0e8]"
                    }`}
                />

                <button
                    type="button"
                    onClick={
                        onCopy
                    }
                    title="Copy redirect URI"
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-[#dedfe2] bg-white text-[#777] transition hover:bg-[#f6f7f8] hover:text-[#2065D1]"
                >
                    <Copy size={14} />
                </button>

            </div>

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

const ProviderStatus = ({
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

/*
|--------------------------------------------------------------------------
| GOOGLE LOGO
|--------------------------------------------------------------------------
*/

const GoogleLogo = () => {
    return (
        <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] border border-[#ececec] bg-white shadow-sm">
            <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
            >
                <path
                    fill="#4285F4"
                    d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z"
                />

                <path
                    fill="#34A853"
                    d="M12 22c2.7 0 5-.9 6.6-2.4L15.4 17c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"
                />

                <path
                    fill="#FBBC05"
                    d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.5H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.5l3.3-2.6Z"
                />

                <path
                    fill="#EA4335"
                    d="M12 6c1.5 0 2.9.5 4 1.6l3-3A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.8 9.4 6 12 6Z"
                />
            </svg>
        </div>
    );
};

export default OAuthSettings;