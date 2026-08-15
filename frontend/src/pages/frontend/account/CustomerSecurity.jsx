import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    ChevronRight,
    Eye,
    EyeOff,
    KeyRound,
    LoaderCircle,
    RefreshCw,
    Shield,
    Smartphone,
} from "lucide-react";

import api from "../../../api/axios";
import CustomerSidebar from "../../../components/frontend/account/CustomerSidebar";

const passwordInitialState = {
    old_password: "",
    new_password: "",
    new_password_confirmation: "",
};

const CustomerSecurity = () => {
    const navigate = useNavigate();

    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    const [security, setSecurity] = useState({
        two_factor_enabled: false,
        two_factor_pending: false,
    });

    const [sessions, setSessions] = useState([]);

    // Password
    const [passwordForm, setPasswordForm] = useState(passwordInitialState);
    const [passwordErrors, setPasswordErrors] = useState({});
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState("");
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // 2FA
    const [twoFactorPassword, setTwoFactorPassword] = useState("");
    const [twoFactorCode, setTwoFactorCode] = useState("");
    const [twoFactorSecret, setTwoFactorSecret] = useState("");
    const [twoFactorErrors, setTwoFactorErrors] = useState({});
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [twoFactorSuccess, setTwoFactorSuccess] = useState("");
    const [recoveryCodes, setRecoveryCodes] = useState([]);
    const [showTwoFactorPassword, setShowTwoFactorPassword] = useState(false);

    // Sessions
    const [sessionLoading, setSessionLoading] = useState(false);
    const [sessionMessage, setSessionMessage] = useState("");

    // Load security
    const fetchSecurity = useCallback(async () => {
        try {
            setLoading(true);
            setPageError("");

            const response = await api.get(
                "/customer/security"
            );

            setSecurity({
                two_factor_enabled: Boolean(
                    response.data?.security?.two_factor_enabled
                ),
                two_factor_pending: Boolean(
                    response.data?.security?.two_factor_pending
                ),
            });

            setSessions(
                Array.isArray(response.data?.sessions)
                    ? response.data.sessions
                    : []
            );
        } catch (error) {
            console.error(
                "Security load error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {
                navigate("/login");
                return;
            }

            setPageError(
                error.response?.data?.message ||
                "Unable to load security settings."
            );
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchSecurity();
    }, [fetchSecurity]);

    // Password form change
    const handlePasswordChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setPasswordForm((current) => ({
            ...current,
            [name]: value,
        }));

        if (passwordErrors[name]) {
            setPasswordErrors((current) => ({
                ...current,
                [name]: null,
            }));
        }

        if (passwordSuccess) {
            setPasswordSuccess("");
        }
    };

    // Update password
    const updatePassword = async (event) => {
        event.preventDefault();

        try {
            setPasswordSaving(true);
            setPasswordErrors({});
            setPasswordSuccess("");

            const response = await api.post(
                "/customer/security/password",
                passwordForm
            );

            setPasswordForm(passwordInitialState);

            setPasswordSuccess(
                response.data?.message ||
                "Password updated successfully."
            );

            await fetchSecurity();
        } catch (error) {
            console.error(
                "Password update error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {
                navigate("/login");
                return;
            }

            if (error.response?.status === 422) {
                setPasswordErrors(
                    error.response?.data?.errors || {}
                );

                return;
            }

            setPasswordErrors({
                general:
                    error.response?.data?.message ||
                    "Unable to update password.",
            });
        } finally {
            setPasswordSaving(false);
        }
    };

    // 2FA setup
    const setupTwoFactor = async () => {
        try {
            setTwoFactorLoading(true);
            setTwoFactorErrors({});
            setTwoFactorSuccess("");
            setRecoveryCodes([]);

            const response = await api.post(
                "/customer/security/two-factor/setup",
                {
                    password: twoFactorPassword,
                }
            );

            setTwoFactorSecret(
                response.data?.two_factor?.secret || ""
            );

            setSecurity((current) => ({
                ...current,
                two_factor_pending: true,
            }));

            setTwoFactorPassword("");

            setTwoFactorSuccess(
                "Two-factor setup started. Add the secret to your authenticator app, then enter the 6-digit code."
            );
        } catch (error) {
            handleTwoFactorError(error);
        } finally {
            setTwoFactorLoading(false);
        }
    };

    // Confirm 2FA
    const confirmTwoFactor = async () => {
        try {
            setTwoFactorLoading(true);
            setTwoFactorErrors({});
            setTwoFactorSuccess("");

            const response = await api.post(
                "/customer/security/two-factor/confirm",
                {
                    code: twoFactorCode,
                }
            );

            setRecoveryCodes(
                Array.isArray(response.data?.recovery_codes)
                    ? response.data.recovery_codes
                    : []
            );

            setTwoFactorCode("");
            setTwoFactorSecret("");

            setSecurity({
                two_factor_enabled: true,
                two_factor_pending: false,
            });

            setTwoFactorSuccess(
                response.data?.message ||
                "Two-factor authentication enabled successfully."
            );

            await fetchSecurity();
        } catch (error) {
            handleTwoFactorError(error);
        } finally {
            setTwoFactorLoading(false);
        }
    };

    // Disable 2FA
    const disableTwoFactor = async () => {
        try {
            setTwoFactorLoading(true);
            setTwoFactorErrors({});
            setTwoFactorSuccess("");
            setRecoveryCodes([]);

            const response = await api.post(
                "/customer/security/two-factor/disable",
                {
                    password: twoFactorPassword,
                    code: twoFactorCode,
                }
            );

            setSecurity({
                two_factor_enabled: false,
                two_factor_pending: false,
            });

            setTwoFactorPassword("");
            setTwoFactorCode("");
            setTwoFactorSecret("");

            setTwoFactorSuccess(
                response.data?.message ||
                "Two-factor authentication disabled successfully."
            );

            await fetchSecurity();
        } catch (error) {
            handleTwoFactorError(error);
        } finally {
            setTwoFactorLoading(false);
        }
    };

    // Regenerate recovery codes
    const regenerateRecoveryCodes = async () => {
        try {
            setTwoFactorLoading(true);
            setTwoFactorErrors({});
            setTwoFactorSuccess("");

            const response = await api.post(
                "/customer/security/two-factor/recovery-codes",
                {
                    password: twoFactorPassword,
                }
            );

            setRecoveryCodes(
                Array.isArray(response.data?.recovery_codes)
                    ? response.data.recovery_codes
                    : []
            );

            setTwoFactorPassword("");

            setTwoFactorSuccess(
                response.data?.message ||
                "Recovery codes regenerated successfully."
            );
        } catch (error) {
            handleTwoFactorError(error);
        } finally {
            setTwoFactorLoading(false);
        }
    };

    // 2FA errors
    const handleTwoFactorError = (error) => {
        console.error(
            "Two-factor error:",
            error.response?.data || error.message
        );

        if (error.response?.status === 401) {
            navigate("/login");
            return;
        }

        if (error.response?.status === 422) {
            setTwoFactorErrors(
                error.response?.data?.errors || {
                    general:
                        error.response?.data?.message ||
                        "Unable to process two-factor authentication.",
                }
            );

            return;
        }

        setTwoFactorErrors({
            general:
                error.response?.data?.message ||
                "Unable to process two-factor authentication.",
        });
    };

    // Logout other sessions
    const logoutOtherSessions = async () => {
        try {
            setSessionLoading(true);
            setSessionMessage("");
            setPageError("");

            const response = await api.post(
                "/customer/security/sessions/logout-others"
            );

            setSessionMessage(
                response.data?.message ||
                "All other sessions have been signed out."
            );

            await fetchSecurity();
        } catch (error) {
            console.error(
                "Session logout error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 401) {
                navigate("/login");
                return;
            }

            setPageError(
                error.response?.data?.message ||
                "Unable to sign out other sessions."
            );
        } finally {
            setSessionLoading(false);
        }
    };

    if (loading) {
        return <SecurityLoader />;
    }

    return (
        <main className="min-h-screen bg-white font-['Inter']">

            <div className="mx-auto max-w-[1330px] px-5 pb-[70px] pt-[32px]">

                <Breadcrumb />

                <div className="mt-[28px] grid grid-cols-1 gap-[32px] lg:grid-cols-[250px_minmax(0,1fr)]">

                    <CustomerSidebar />

                    <section className="min-w-0">

                        <div>

                            <h1 className="text-[26px] font-semibold text-[#171717]">
                                Security
                            </h1>

                            <p className="mt-[4px] text-[16px] text-[#777]">
                                Manage your account security settings
                            </p>

                        </div>

                        {pageError && (
                            <AlertMessage
                                type="error"
                                message={pageError}
                            />
                        )}

                        <ChangePasswordCard
                            form={passwordForm}
                            errors={passwordErrors}
                            success={passwordSuccess}
                            saving={passwordSaving}
                            showOld={showOldPassword}
                            showNew={showNewPassword}
                            showConfirm={showConfirmPassword}
                            onChange={handlePasswordChange}
                            onSubmit={updatePassword}
                            onToggleOld={() => setShowOldPassword((current) => !current)}
                            onToggleNew={() => setShowNewPassword((current) => !current)}
                            onToggleConfirm={() => setShowConfirmPassword((current) => !current)}
                        />

                        <TwoFactorCard
                            security={security}
                            password={twoFactorPassword}
                            code={twoFactorCode}
                            secret={twoFactorSecret}
                            errors={twoFactorErrors}
                            success={twoFactorSuccess}
                            loading={twoFactorLoading}
                            recoveryCodes={recoveryCodes}
                            showPassword={showTwoFactorPassword}
                            onPasswordChange={setTwoFactorPassword}
                            onCodeChange={setTwoFactorCode}
                            onTogglePassword={() => setShowTwoFactorPassword((current) => !current)}
                            onSetup={setupTwoFactor}
                            onConfirm={confirmTwoFactor}
                            onDisable={disableTwoFactor}
                            onRegenerate={regenerateRecoveryCodes}
                        />

                        <ActiveSessionsCard
                            sessions={sessions}
                            loading={sessionLoading}
                            message={sessionMessage}
                            onLogoutOthers={logoutOtherSessions}
                        />

                    </section>

                </div>

            </div>

        </main>
    );
};

// Breadcrumb
const Breadcrumb = () => {
    return (
        <div className="flex items-center gap-[10px] text-[14px] text-[#777]">

            <Link
                to="/"
                className="hover:text-[#2065D1]"
            >
                Home
            </Link>

            <ChevronRight size={15} />

            <Link
                to="/account"
                className="hover:text-[#2065D1]"
            >
                Account
            </Link>

            <ChevronRight size={15} />

            <span className="font-medium text-[#171717]">
                Security
            </span>

        </div>
    );
};

// Change password
const ChangePasswordCard = ({
    form,
    errors,
    success,
    saving,
    showOld,
    showNew,
    showConfirm,
    onChange,
    onSubmit,
    onToggleOld,
    onToggleNew,
    onToggleConfirm,
}) => {
    return (
        <form
            onSubmit={onSubmit}
            className="mt-[26px] rounded-[12px] border border-[#dedede] bg-white p-[24px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        >

            <h2 className="text-[18px] font-semibold text-[#171717]">
                Change password
            </h2>

            {errors.general && (
                <AlertMessage
                    type="error"
                    message={errors.general}
                />
            )}

            {success && (
                <AlertMessage
                    type="success"
                    message={success}
                />
            )}

            <div className="mt-[24px] space-y-[20px]">

                <PasswordField
                    label="Old password"
                    name="old_password"
                    value={form.old_password}
                    show={showOld}
                    error={errors.old_password}
                    onChange={onChange}
                    onToggle={onToggleOld}
                />

                <PasswordField
                    label="New password"
                    name="new_password"
                    value={form.new_password}
                    show={showNew}
                    error={errors.new_password}
                    onChange={onChange}
                    onToggle={onToggleNew}
                />

                <PasswordField
                    label="Confirm password"
                    name="new_password_confirmation"
                    value={form.new_password_confirmation}
                    show={showConfirm}
                    error={errors.new_password_confirmation}
                    onChange={onChange}
                    onToggle={onToggleConfirm}
                />

            </div>

            <button
                type="submit"
                disabled={saving}
                className="mt-[22px] flex h-[44px] items-center justify-center gap-[8px] rounded-[6px] bg-[#2065D1] px-[18px] text-[14px] font-semibold text-white transition hover:bg-[#1858bb] disabled:cursor-not-allowed disabled:opacity-60"
            >
                {saving && (
                    <LoaderCircle
                        size={17}
                        className="animate-spin"
                    />
                )}

                {saving
                    ? "Updating..."
                    : "Update Password"}
            </button>

        </form>
    );
};

// 2FA
const TwoFactorCard = ({
    security,
    password,
    code,
    secret,
    errors,
    success,
    loading,
    recoveryCodes,
    showPassword,
    onPasswordChange,
    onCodeChange,
    onTogglePassword,
    onSetup,
    onConfirm,
    onDisable,
    onRegenerate,
}) => {
    return (
        <section className="mt-[24px] rounded-[12px] border border-[#dedede] bg-white p-[24px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">

            <div className="flex items-start justify-between gap-[20px]">

                <div className="flex items-start gap-[14px]">

                    <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px] bg-[#eef4ff] text-[#2065D1]">
                        <Shield size={20} />
                    </div>

                    <div>

                        <h2 className="text-[18px] font-semibold text-[#171717]">
                            Two-Factor Authentication
                        </h2>

                        <p className="mt-[2px] text-[14px] text-[#777]">
                            Add an extra layer of security to your account
                        </p>

                    </div>

                </div>

                <TwoFactorStatus security={security} />

            </div>

            <p className="mt-[28px] max-w-[550px] text-[14px] leading-[21px] text-[#666]">
                Protect your account by requiring a verification code from your
                authenticator app in addition to your password.
            </p>

            {errors.general && (
                <AlertMessage
                    type="error"
                    message={errors.general}
                />
            )}

            {success && (
                <AlertMessage
                    type="success"
                    message={success}
                />
            )}

            {!security.two_factor_enabled && !security.two_factor_pending && (
                <div className="mt-[18px] max-w-[420px]">

                    <PasswordInput
                        value={password}
                        placeholder="Password"
                        show={showPassword}
                        error={errors.password}
                        onChange={onPasswordChange}
                        onToggle={onTogglePassword}
                    />

                    <button
                        type="button"
                        disabled={loading || !password}
                        onClick={onSetup}
                        className="mt-[12px] flex h-[42px] items-center justify-center gap-[8px] rounded-[6px] bg-[#2065D1] px-[16px] text-[14px] font-semibold text-white transition hover:bg-[#1858bb] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading ? (
                            <LoaderCircle
                                size={17}
                                className="animate-spin"
                            />
                        ) : (
                            <Smartphone size={17} />
                        )}

                        Set Up Two-Factor Authentication
                    </button>

                </div>
            )}

            {security.two_factor_pending && (
                <TwoFactorConfirmation
                    secret={secret}
                    code={code}
                    error={errors.code}
                    loading={loading}
                    onCodeChange={onCodeChange}
                    onConfirm={onConfirm}
                />
            )}

            {security.two_factor_enabled && (
                <TwoFactorEnabled
                    password={password}
                    code={code}
                    errors={errors}
                    loading={loading}
                    recoveryCodes={recoveryCodes}
                    showPassword={showPassword}
                    onPasswordChange={onPasswordChange}
                    onCodeChange={onCodeChange}
                    onTogglePassword={onTogglePassword}
                    onDisable={onDisable}
                    onRegenerate={onRegenerate}
                />
            )}

            {recoveryCodes.length > 0 && (
                <RecoveryCodes codes={recoveryCodes} />
            )}

        </section>
    );
};

const TwoFactorStatus = ({ security }) => {
    if (security.two_factor_enabled) {
        return (
            <span className="shrink-0 rounded-full bg-[#dcfce7] px-[11px] py-[4px] text-[12px] font-medium text-[#15803d]">
                Enabled
            </span>
        );
    }

    if (security.two_factor_pending) {
        return (
            <span className="shrink-0 rounded-full bg-[#fff3d6] px-[11px] py-[4px] text-[12px] font-medium text-[#a16207]">
                Pending
            </span>
        );
    }

    return (
        <span className="shrink-0 rounded-full bg-[#8b5cf6] px-[11px] py-[4px] text-[12px] font-medium text-white">
            Disabled
        </span>
    );
};

// Pending 2FA
const TwoFactorConfirmation = ({
    secret,
    code,
    error,
    loading,
    onCodeChange,
    onConfirm,
}) => {
    const message = getErrorMessage(error);

    return (
        <div className="mt-[20px] max-w-[520px] rounded-[10px] border border-[#dedede] bg-[#fafafa] p-[18px]">

            <p className="text-[14px] font-medium text-[#222]">
                Authenticator setup
            </p>

            <p className="mt-[7px] text-[14px] leading-[21px] text-[#666]">
                Add the following secret key to Google Authenticator, Microsoft
                Authenticator, Authy, or another compatible authenticator app.
            </p>

            {secret && (
                <div className="mt-[14px] rounded-[8px] border border-[#dedede] bg-white px-[14px] py-[12px]">

                    <p className="text-[12px] text-[#777]">
                        Secret key
                    </p>

                    <p className="mt-[4px] break-all font-mono text-[14px] font-semibold tracking-[1px] text-[#222]">
                        {secret}
                    </p>

                </div>
            )}

            <div className="mt-[14px]">

                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(event) => {
                        onCodeChange(
                            event.target.value.replace(/\D/g, "")
                        );
                    }}
                    placeholder="Enter 6-digit verification code"
                    className={`h-[46px] w-full rounded-[7px] border px-[13px] text-[14px] outline-none ${
                        message
                            ? "border-red-400"
                            : "border-[#dedede] focus:border-[#2065D1]"
                    }`}
                />

                {message && (
                    <p className="mt-[6px] text-[12px] text-red-500">
                        {message}
                    </p>
                )}

            </div>

            <button
                type="button"
                disabled={loading || code.length !== 6}
                onClick={onConfirm}
                className="mt-[12px] flex h-[42px] items-center justify-center gap-[8px] rounded-[6px] bg-[#2065D1] px-[17px] text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading && (
                    <LoaderCircle
                        size={17}
                        className="animate-spin"
                    />
                )}

                Confirm Two-Factor Authentication
            </button>

        </div>
    );
};

// Enabled 2FA
const TwoFactorEnabled = ({
    password,
    code,
    errors,
    loading,
    recoveryCodes,
    showPassword,
    onPasswordChange,
    onCodeChange,
    onTogglePassword,
    onDisable,
    onRegenerate,
}) => {
    return (
        <div className="mt-[20px] max-w-[520px]">

            <PasswordInput
                value={password}
                placeholder="Current password"
                show={showPassword}
                error={errors.password}
                onChange={onPasswordChange}
                onToggle={onTogglePassword}
            />

            <div className="mt-[12px]">

                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(event) => {
                        onCodeChange(
                            event.target.value.replace(/\D/g, "")
                        );
                    }}
                    placeholder="6-digit authentication code"
                    className="h-[46px] w-full rounded-[7px] border border-[#dedede] px-[13px] text-[14px] outline-none focus:border-[#2065D1]"
                />

                {getErrorMessage(errors.code) && (
                    <p className="mt-[6px] text-[12px] text-red-500">
                        {getErrorMessage(errors.code)}
                    </p>
                )}

            </div>

            <div className="mt-[13px] flex flex-wrap gap-[10px]">

                <button
                    type="button"
                    disabled={
                        loading ||
                        !password ||
                        code.length !== 6
                    }
                    onClick={onDisable}
                    className="flex h-[42px] items-center gap-[7px] rounded-[6px] border border-red-200 bg-white px-[15px] text-[14px] font-medium text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Disable Two-Factor
                </button>

                <button
                    type="button"
                    disabled={loading || !password}
                    onClick={onRegenerate}
                    className="flex h-[42px] items-center gap-[7px] rounded-[6px] border border-[#dedede] bg-white px-[15px] text-[14px] font-medium text-[#333] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <RefreshCw size={15} />
                    New Recovery Codes
                </button>

            </div>

            {recoveryCodes.length === 0 && (
                <p className="mt-[10px] text-[12px] text-[#777]">
                    Enter your current password to regenerate recovery codes.
                </p>
            )}

        </div>
    );
};

// Recovery codes
const RecoveryCodes = ({ codes }) => {
    return (
        <div className="mt-[22px] rounded-[10px] border border-[#f1d795] bg-[#fffaf0] p-[18px]">

            <div className="flex items-start gap-[10px]">

                <KeyRound
                    size={18}
                    className="mt-[1px] shrink-0 text-[#a16207]"
                />

                <div>

                    <p className="text-[14px] font-semibold text-[#744600]">
                        Recovery Codes
                    </p>

                    <p className="mt-[4px] text-[13px] leading-[20px] text-[#80621c]">
                        Store these codes somewhere safe. Each code should only
                        be used once.
                    </p>

                </div>

            </div>

            <div className="mt-[14px] grid grid-cols-1 gap-[7px] sm:grid-cols-2">

                {codes.map((code) => (
                    <div
                        key={code}
                        className="rounded-[6px] border border-[#ead9ad] bg-white px-[11px] py-[8px] font-mono text-[13px] font-medium text-[#333]"
                    >
                        {code}
                    </div>
                ))}

            </div>

        </div>
    );
};

// Sessions
const ActiveSessionsCard = ({
    sessions,
    loading,
    message,
    onLogoutOthers,
}) => {
    const currentSession = sessions.find((session) => {
        return session.is_current;
    });

    const otherSessions = sessions.filter((session) => {
        return !session.is_current;
    });

    return (
        <section className="mt-[24px] rounded-[12px] border border-[#dedede] bg-white p-[24px] shadow-[0_1px_2px_rgba(0,0,0,0.03)]">

            <div className="flex items-start gap-[14px]">

                <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[9px] bg-[#f2f2f2] text-[#666]">
                    <RefreshCw size={19} />
                </div>

                <div>

                    <h2 className="text-[18px] font-semibold text-[#171717]">
                        Active Sessions
                    </h2>

                    <p className="mt-[2px] text-[14px] text-[#777]">
                        Manage your active login sessions
                    </p>

                </div>

            </div>

            <p className="mt-[27px] text-[14px] leading-[21px] text-[#666]">
                You're currently signed in on this device. You can sign out of
                all other sessions if you notice any suspicious activity.
            </p>

            {currentSession && (
                <SessionDetails session={currentSession} />
            )}

            {otherSessions.length > 0 && (
                <p className="mt-[13px] text-[13px] text-[#777]">
                    {otherSessions.length} other active
                    {otherSessions.length === 1
                        ? " session"
                        : " sessions"} found.
                </p>
            )}

            {message && (
                <AlertMessage
                    type="success"
                    message={message}
                />
            )}

            <button
                type="button"
                disabled={loading || otherSessions.length === 0}
                onClick={onLogoutOthers}
                className="mt-[18px] flex h-[42px] items-center justify-center gap-[8px] rounded-[6px] border border-[#dedede] bg-white px-[16px] text-[14px] font-medium text-[#171717] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-50"
            >
                {loading && (
                    <LoaderCircle
                        size={16}
                        className="animate-spin"
                    />
                )}

                Sign Out of All Other Sessions
            </button>

        </section>
    );
};

const SessionDetails = ({ session }) => {
    return (
        <div className="mt-[16px] flex flex-wrap gap-x-[22px] gap-y-[6px] rounded-[8px] bg-[#fafafa] px-[14px] py-[11px] text-[12px] text-[#777]">

            <span>
                {session.browser || "Unknown Browser"}
            </span>

            <span>
                {session.platform || "Unknown Platform"}
            </span>

            <span>
                {session.device || "Unknown Device"}
            </span>

            {session.ip_address && (
                <span>
                    IP: {session.ip_address}
                </span>
            )}

            <span className="font-medium text-[#228b55]">
                Current session
            </span>

        </div>
    );
};

// Password field
const PasswordField = ({
    label,
    name,
    value,
    show,
    error,
    onChange,
    onToggle,
}) => {
    const message = getErrorMessage(error);

    return (
        <div>

            <label className="mb-[7px] block text-[14px] font-medium text-[#222]">
                {label}
            </label>

            <div className="relative">

                <input
                    type={show ? "text" : "password"}
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`h-[46px] w-full rounded-[7px] border bg-white px-[13px] pr-[45px] text-[14px] outline-none ${
                        message
                            ? "border-red-400"
                            : "border-[#dedede] focus:border-[#2065D1]"
                    }`}
                />

                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-[13px] top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555]"
                >
                    {show ? (
                        <EyeOff size={17} />
                    ) : (
                        <Eye size={17} />
                    )}
                </button>

            </div>

            {message && (
                <p className="mt-[6px] text-[12px] text-red-500">
                    {message}
                </p>
            )}

        </div>
    );
};

const PasswordInput = ({
    value,
    placeholder,
    show,
    error,
    onChange,
    onToggle,
}) => {
    const message = getErrorMessage(error);

    return (
        <div>

            <div className="relative">

                <input
                    type={show ? "text" : "password"}
                    value={value}
                    onChange={(event) => {
                        onChange(event.target.value);
                    }}
                    placeholder={placeholder}
                    className={`h-[42px] w-full rounded-[6px] border bg-white px-[13px] pr-[42px] text-[14px] outline-none ${
                        message
                            ? "border-red-400"
                            : "border-[#dedede] focus:border-[#2065D1]"
                    }`}
                />

                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-[12px] top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#555]"
                >
                    {show ? (
                        <EyeOff size={16} />
                    ) : (
                        <Eye size={16} />
                    )}
                </button>

            </div>

            {message && (
                <p className="mt-[6px] text-[12px] text-red-500">
                    {message}
                </p>
            )}

        </div>
    );
};

// Alert
const AlertMessage = ({
    type,
    message,
}) => {
    const success = type === "success";

    return (
        <div
            className={`mt-[18px] rounded-[8px] border px-[13px] py-[11px] text-[13px] ${
                success
                    ? "border-green-200 bg-green-50 text-green-700"
                    : "border-red-200 bg-red-50 text-red-600"
            }`}
        >
            {message}
        </div>
    );
};

const getErrorMessage = (error) => {
    if (Array.isArray(error)) {
        return error[0];
    }

    return error || "";
};

// Loading
const SecurityLoader = () => {
    return (
        <main className="min-h-[600px] bg-white">

            <div className="flex min-h-[600px] items-center justify-center">

                <LoaderCircle
                    size={30}
                    className="animate-spin text-[#2065D1]"
                />

            </div>

        </main>
    );
};

export default CustomerSecurity;