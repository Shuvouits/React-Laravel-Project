import {
    CalendarDays,
    Check,
    Copy,
    Eye,
    EyeOff,
    KeyRound,
    LoaderCircle,
    LockKeyhole,
    Mail,
    Phone,
    ShieldCheck,
    Upload,
    UserRound,
    X,
} from "lucide-react";
import {
    useEffect,
    useRef,
    useState,
} from "react";
import api from "../../../api/axios";

const emptyProfile = {
    id: null,
    first_name: "",
    last_name: "",
    name: "",
    email: "",
    phone: "",
    birthdate: "",
    gender: "",
    photo: "",
    photo_url: "",
    role: "vendor",
    two_factor_enabled: false,
    two_factor_pending: false,
};

const emptySecurity = {
    two_factor_enabled: false,
    two_factor_pending: false,
};

export default function VendorProfile() {
    const [profile, setProfile] = useState(emptyProfile);
    const [security, setSecurity] = useState(emptySecurity);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    const fetchProfile = async () => {
        try {
            const response = await api.get("/vendor/profile");

            setProfile(
                response.data?.profile || emptyProfile
            );
        } catch (error) {
            console.error(
                "Vendor profile fetch error:",
                error.response?.data || error.message
            );

            showMessage(
                "error",
                error.response?.data?.message ||
                    "Unable to load profile."
            );
        }
    };

    const fetchSecurity = async () => {
        try {
            const response = await api.get("/vendor/security");

            setSecurity(
                response.data?.security || emptySecurity
            );
        } catch (error) {
            console.error(
                "Vendor security fetch error:",
                error.response?.data || error.message
            );
        }
    };

    const refreshData = async () => {
        setLoading(true);

        await Promise.all([
            fetchProfile(),
            fetchSecurity(),
        ]);

        setLoading(false);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const showMessage = (type, text) => {
        setMessageType(type);
        setMessage(text);
    };

    const handleProfileUpdated = (
        updatedProfile,
        successMessage
    ) => {
        setProfile(updatedProfile);
        showMessage("success", successMessage);
    };

    const handleSecurityChanged = async (
        successMessage
    ) => {
        await Promise.all([
            fetchProfile(),
            fetchSecurity(),
        ]);

        showMessage("success", successMessage);
    };

    if (loading) {
        return <ProfileLoader />;
    }

    return (
        <div className="min-h-screen bg-[#f6f6f7]">
            <div className="mx-auto w-full max-w-[1180px] px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-[23px] font-semibold tracking-[-0.35px] text-[#171717]">
                        Profile
                    </h1>

                    <p className="mt-1 text-[13px] text-[#777]">
                        Manage your account settings and preferences
                    </p>
                </div>

                {message && (
                    <MessageBanner
                        type={messageType}
                        message={message}
                        onClose={() => setMessage("")}
                    />
                )}

                <div className="grid gap-5 lg:grid-cols-[330px_minmax(0,1fr)]">
                    <ProfileSummaryCard profile={profile} />

                    <PersonalInformationCard
                        profile={profile}
                        onUpdated={handleProfileUpdated}
                        onMessage={showMessage}
                    />
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
                    <ChangePasswordCard
                        onMessage={showMessage}
                    />

                    <AccountCard
                        profile={profile}
                        security={security}
                    />
                </div>

                <div className="mt-5">
                    <TwoFactorCard
                        profile={profile}
                        security={security}
                        onSecurityChanged={handleSecurityChanged}
                        onMessage={showMessage}
                    />
                </div>
            </div>
        </div>
    );
}

function ProfileSummaryCard({ profile }) {
    const initials = getInitials(
        profile.name ||
            `${profile.first_name} ${profile.last_name}`
    );

    return (
        <section className="flex min-h-[390px] flex-col items-center justify-center rounded-[20px] border border-[#dedede] bg-white p-7 text-center shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex h-[112px] w-[112px] items-center justify-center overflow-hidden rounded-full border-[4px] border-white bg-[#f1f1f1] text-[30px] font-semibold text-[#666] shadow-[0_5px_18px_rgba(0,0,0,0.12)]">
                {profile.photo_url ? (
                    <img
                        src={profile.photo_url}
                        alt={profile.name || "Vendor"}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    initials
                )}
            </div>

            <h2 className="mt-6 text-[19px] font-semibold text-[#171717]">
                {profile.name || "Vendor"}
            </h2>

            <p className="mt-2 text-[13px] text-[#777]">
                {profile.email}
            </p>

            <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-[#f1efff] px-3 py-1.5 text-[11px] font-medium text-[#5e4dac]">
                <ShieldCheck size={13} />
                {formatRole(profile.role)}
            </span>
        </section>
    );
}

function PersonalInformationCard({
    profile,
    onUpdated,
    onMessage,
}) {
    const fileInputRef = useRef(null);

    const [form, setForm] = useState({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        email: profile.email || "",
        phone: profile.phone || "",
        birthdate: normalizeDateInput(profile.birthdate),
        gender: profile.gender || "",
    });

    const [photo, setPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(
        profile.photo_url || ""
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setForm({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            email: profile.email || "",
            phone: profile.phone || "",
            birthdate: normalizeDateInput(profile.birthdate),
            gender: profile.gender || "",
        });

        setPhotoPreview(profile.photo_url || "");
        setPhoto(null);
    }, [profile]);

    useEffect(() => {
        if (!photo) {
            return;
        }

        const preview = URL.createObjectURL(photo);

        setPhotoPreview(preview);

        return () => {
            URL.revokeObjectURL(preview);
        };
    }, [photo]);

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handlePhoto = (file) => {
        if (!file) {
            return;
        }

        const allowed = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowed.includes(file.type)) {
            setError(
                "Profile photo must be JPG, PNG, or WEBP."
            );
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError(
                "Profile photo must be 5MB or smaller."
            );
            return;
        }

        setError("");
        setPhoto(file);
    };

    const handleSave = async (event) => {
        event.preventDefault();

        if (
            !form.first_name.trim() ||
            !form.last_name.trim() ||
            !form.email.trim()
        ) {
            setError(
                "First name, last name, and email are required."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");

            const formData = new FormData();

            formData.append(
                "first_name",
                form.first_name.trim()
            );
            formData.append(
                "last_name",
                form.last_name.trim()
            );
            formData.append(
                "email",
                form.email.trim()
            );
            formData.append(
                "phone",
                form.phone.trim()
            );
            formData.append(
                "birthdate",
                form.birthdate
            );
            formData.append(
                "gender",
                form.gender
            );

            if (photo) {
                formData.append(
                    "photo",
                    photo
                );
            }

            const response = await api.post(
                "/vendor/profile",
                formData
            );

            onUpdated(
                response.data?.profile || profile,
                response.data?.message ||
                    "Profile updated successfully."
            );
        } catch (error) {
            console.error(
                "Vendor profile update error:",
                error.response?.data || error.message
            );

            const apiError =
                firstApiError(error) ||
                "Unable to update profile.";

            setError(apiError);
            onMessage("error", apiError);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-[20px] border border-[#dedede] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
                <IconBubble>
                    <UserRound size={18} />
                </IconBubble>

                <div>
                    <h2 className="text-[17px] font-semibold text-[#171717]">
                        Personal Information
                    </h2>

                    <p className="mt-[2px] text-[12px] text-[#777]">
                        Update your name and contact details
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSave}
                className="mt-6"
            >
                <div className="grid gap-4 sm:grid-cols-2">
                    <ProfileField
                        label="First Name"
                        icon={UserRound}
                        value={form.first_name}
                        onChange={(value) =>
                            updateField(
                                "first_name",
                                value
                            )
                        }
                    />

                    <ProfileField
                        label="Last Name"
                        icon={UserRound}
                        value={form.last_name}
                        onChange={(value) =>
                            updateField(
                                "last_name",
                                value
                            )
                        }
                    />

                    <ProfileField
                        label="Email Address"
                        icon={Mail}
                        type="email"
                        value={form.email}
                        onChange={(value) =>
                            updateField(
                                "email",
                                value
                            )
                        }
                    />

                    <ProfileField
                        label="Phone Number"
                        icon={Phone}
                        value={form.phone}
                        onChange={(value) =>
                            updateField(
                                "phone",
                                value
                            )
                        }
                    />

                    <ProfileField
                        label="Birthday"
                        icon={CalendarDays}
                        type="date"
                        value={form.birthdate}
                        onChange={(value) =>
                            updateField(
                                "birthdate",
                                value
                            )
                        }
                    />

                    <label className="block">
                        <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.04em] text-[#666]">
                            Gender
                        </span>

                        <select
                            value={form.gender}
                            onChange={(event) =>
                                updateField(
                                    "gender",
                                    event.target.value
                                )
                            }
                            className="h-[44px] w-full rounded-[22px] border border-[#e1e1e1] bg-white px-4 text-[13px] text-[#444] outline-none transition focus:border-[#b6c9ee] focus:ring-2 focus:ring-[#f1f6ff]"
                        >
                            <option value="">
                                Select gender
                            </option>
                            <option value="male">
                                Male
                            </option>
                            <option value="female">
                                Female
                            </option>
                            <option value="other">
                                Other
                            </option>
                            <option value="prefer_not_to_say">
                                Prefer not to say
                            </option>
                        </select>
                    </label>
                </div>

                <div className="mt-5 rounded-[14px] border border-[#e6e6e6] bg-[#fafafa] p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-[#ededed] text-[14px] font-semibold text-[#666]">
                                {photoPreview ? (
                                    <img
                                        src={photoPreview}
                                        alt="Profile preview"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    getInitials(
                                        `${form.first_name} ${form.last_name}`
                                    )
                                )}
                            </div>

                            <div>
                                <div className="text-[13px] font-medium text-[#333]">
                                    Profile photo
                                </div>
                                <div className="mt-[2px] text-[11px] text-[#888]">
                                    JPG, PNG or WEBP. Max 5MB.
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                fileInputRef.current?.click()
                            }
                            className="flex h-9 items-center justify-center gap-2 rounded-[18px] border border-[#dedede] bg-white px-4 text-[12px] font-medium text-[#444] transition hover:bg-[#f6f6f6]"
                        >
                            <Upload size={14} />
                            Change photo
                        </button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) => {
                                handlePhoto(
                                    event.target.files?.[0]
                                );

                                event.target.value = "";
                            }}
                            className="hidden"
                        />
                    </div>
                </div>

                {error && (
                    <InlineError message={error} />
                )}

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex h-10 min-w-[125px] items-center justify-center gap-2 rounded-[20px] bg-[#2065D1] px-5 text-[13px] font-semibold text-white transition hover:bg-[#1959bd] disabled:cursor-not-allowed disabled:bg-[#91afe0]"
                    >
                        {saving && (
                            <LoaderCircle
                                size={14}
                                className="animate-spin"
                            />
                        )}

                        {saving
                            ? "Saving..."
                            : "Save changes"}
                    </button>
                </div>
            </form>
        </section>
    );
}

function ChangePasswordCard({ onMessage }) {
    const [form, setForm] = useState({
        old_password: "",
        new_password: "",
        new_password_confirmation: "",
    });

    const [showPassword, setShowPassword] =
        useState({
            old: false,
            new: false,
            confirm: false,
        });

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (
            !form.old_password ||
            !form.new_password ||
            !form.new_password_confirmation
        ) {
            setError(
                "Complete all password fields."
            );
            return;
        }

        if (
            form.new_password !==
            form.new_password_confirmation
        ) {
            setError(
                "New password confirmation does not match."
            );
            return;
        }

        try {
            setSaving(true);
            setError("");

            const response = await api.put(
                "/vendor/security/password",
                form
            );

            setForm({
                old_password: "",
                new_password: "",
                new_password_confirmation: "",
            });

            onMessage(
                "success",
                response.data?.message ||
                    "Password updated successfully."
            );
        } catch (error) {
            setError(
                firstApiError(error) ||
                    "Unable to update password."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="rounded-[20px] border border-[#dedede] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
                <IconBubble tone="orange">
                    <KeyRound size={18} />
                </IconBubble>

                <div>
                    <h2 className="text-[17px] font-semibold text-[#171717]">
                        Change password
                    </h2>

                    <p className="mt-[2px] text-[12px] text-[#777]">
                        Update your password to keep your account secure
                    </p>
                </div>
            </div>

            <form
                onSubmit={handleSubmit}
                className="mt-6"
            >
                <div className="grid gap-4 lg:grid-cols-3">
                    <PasswordField
                        label="Old Password"
                        value={form.old_password}
                        visible={showPassword.old}
                        onChange={(value) =>
                            updateField(
                                "old_password",
                                value
                            )
                        }
                        onToggle={() =>
                            setShowPassword(
                                (current) => ({
                                    ...current,
                                    old: !current.old,
                                })
                            )
                        }
                    />

                    <PasswordField
                        label="New Password"
                        value={form.new_password}
                        visible={showPassword.new}
                        onChange={(value) =>
                            updateField(
                                "new_password",
                                value
                            )
                        }
                        onToggle={() =>
                            setShowPassword(
                                (current) => ({
                                    ...current,
                                    new: !current.new,
                                })
                            )
                        }
                    />

                    <PasswordField
                        label="Confirm Password"
                        value={
                            form.new_password_confirmation
                        }
                        visible={showPassword.confirm}
                        onChange={(value) =>
                            updateField(
                                "new_password_confirmation",
                                value
                            )
                        }
                        onToggle={() =>
                            setShowPassword(
                                (current) => ({
                                    ...current,
                                    confirm:
                                        !current.confirm,
                                })
                            )
                        }
                    />
                </div>

                {error && (
                    <InlineError message={error} />
                )}

                <div className="mt-5 flex justify-end">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex h-10 min-w-[145px] items-center justify-center gap-2 rounded-[20px] border border-[#dedede] bg-white px-5 text-[12px] font-semibold text-[#333] transition hover:bg-[#f7f7f7] disabled:opacity-50"
                    >
                        {saving && (
                            <LoaderCircle
                                size={14}
                                className="animate-spin"
                            />
                        )}

                        {saving
                            ? "Updating..."
                            : "Update Password"}
                    </button>
                </div>
            </form>
        </section>
    );
}

function AccountCard({ profile, security }) {
    const twoFactorEnabled = Boolean(
        security.two_factor_enabled ||
            profile.two_factor_enabled
    );

    return (
        <section className="rounded-[20px] border border-[#dedede] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex items-center gap-3">
                <IconBubble>
                    <Mail size={18} />
                </IconBubble>

                <h2 className="text-[17px] font-semibold text-[#171717]">
                    Account
                </h2>
            </div>

            <div className="mt-6 space-y-3">
                <AccountRow
                    icon={Mail}
                    label="Email address"
                    value={profile.email || "—"}
                />

                <AccountRow
                    icon={Phone}
                    label="Phone number"
                    value={profile.phone || "—"}
                />

                <AccountRow
                    icon={ShieldCheck}
                    label="Two-Factor Auth"
                    value={
                        twoFactorEnabled
                            ? "Enabled"
                            : "Disabled"
                    }
                    valueClass={
                        twoFactorEnabled
                            ? "text-emerald-700"
                            : ""
                    }
                />
            </div>
        </section>
    );
}

function TwoFactorCard({
    profile,
    security,
    onSecurityChanged,
    onMessage,
}) {
    const enabled = Boolean(
        security.two_factor_enabled ||
            profile.two_factor_enabled
    );

    const pending = Boolean(
        security.two_factor_pending ||
            profile.two_factor_pending
    );

    const [setupPassword, setSetupPassword] =
        useState("");
    const [setupSecret, setSetupSecret] =
        useState("");
    const [qrUrl, setQrUrl] = useState("");
    const [confirmCode, setConfirmCode] =
        useState("");
    const [disablePassword, setDisablePassword] =
        useState("");
    const [disableCode, setDisableCode] =
        useState("");
    const [recoveryPassword, setRecoveryPassword] =
        useState("");
    const [recoveryCodes, setRecoveryCodes] =
        useState([]);
    const [loadingAction, setLoadingAction] =
        useState("");
    const [error, setError] = useState("");

    const startSetup = async () => {
        if (!setupPassword) {
            setError(
                "Enter your password to start two-factor authentication."
            );
            return;
        }

        try {
            setLoadingAction("setup");
            setError("");

            const response = await api.post(
                "/vendor/security/two-factor/setup",
                {
                    password: setupPassword,
                }
            );

            setSetupSecret(
                response.data?.two_factor?.secret || ""
            );

            setQrUrl(
                response.data?.two_factor?.qr_url || ""
            );

            setConfirmCode("");

            onMessage(
                "success",
                response.data?.message ||
                    "Two-factor authentication setup started."
            );
        } catch (error) {
            setError(
                firstApiError(error) ||
                    "Unable to start two-factor authentication setup."
            );
        } finally {
            setLoadingAction("");
        }
    };

    const confirmSetup = async () => {
        if (!/^\d{6}$/.test(confirmCode)) {
            setError(
                "Enter the 6-digit code from your authenticator app."
            );
            return;
        }

        try {
            setLoadingAction("confirm");
            setError("");

            const response = await api.post(
                "/vendor/security/two-factor/confirm",
                {
                    code: confirmCode,
                }
            );

            setRecoveryCodes(
                response.data?.recovery_codes || []
            );

            setSetupPassword("");
            setSetupSecret("");
            setQrUrl("");
            setConfirmCode("");

            await onSecurityChanged(
                response.data?.message ||
                    "Two-factor authentication enabled successfully."
            );
        } catch (error) {
            setError(
                firstApiError(error) ||
                    "Unable to confirm two-factor authentication."
            );
        } finally {
            setLoadingAction("");
        }
    };

    const disableTwoFactor = async () => {
        if (
            !disablePassword ||
            !/^\d{6}$/.test(disableCode)
        ) {
            setError(
                "Enter your password and current 6-digit authenticator code."
            );
            return;
        }

        try {
            setLoadingAction("disable");
            setError("");

            const response = await api.post(
                "/vendor/security/two-factor/disable",
                {
                    password: disablePassword,
                    code: disableCode,
                }
            );

            setDisablePassword("");
            setDisableCode("");
            setRecoveryCodes([]);

            await onSecurityChanged(
                response.data?.message ||
                    "Two-factor authentication disabled successfully."
            );
        } catch (error) {
            setError(
                firstApiError(error) ||
                    "Unable to disable two-factor authentication."
            );
        } finally {
            setLoadingAction("");
        }
    };

    const regenerateRecoveryCodes = async () => {
        if (!recoveryPassword) {
            setError(
                "Enter your password to regenerate recovery codes."
            );
            return;
        }

        try {
            setLoadingAction("recovery");
            setError("");

            const response = await api.post(
                "/vendor/security/two-factor/recovery-codes",
                {
                    password: recoveryPassword,
                }
            );

            setRecoveryCodes(
                response.data?.recovery_codes || []
            );

            setRecoveryPassword("");

            onMessage(
                "success",
                response.data?.message ||
                    "Recovery codes regenerated successfully."
            );
        } catch (error) {
            setError(
                firstApiError(error) ||
                    "Unable to regenerate recovery codes."
            );
        } finally {
            setLoadingAction("");
        }
    };

    const setupStarted = Boolean(setupSecret);

    return (
        <section className="rounded-[20px] border border-[#dedede] bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex items-center gap-3">
                    <IconBubble>
                        <ShieldCheck size={18} />
                    </IconBubble>

                    <div>
                        <h2 className="text-[17px] font-semibold text-[#171717]">
                            Two-Factor Authentication
                        </h2>

                        <p className="mt-[2px] text-[12px] text-[#777]">
                            Add an extra layer of security to your account
                        </p>
                    </div>
                </div>

                <TwoFactorStatus
                    enabled={enabled}
                    pending={pending && !enabled}
                />
            </div>

            {!enabled && (
                <div className="mt-6 max-w-[620px]">
                    <p className="text-[13px] leading-5 text-[#666]">
                        Protect your account by requiring a verification code from your authenticator app in addition to your password.
                    </p>

                    {!setupStarted && (
                        <div className="mt-5">
                            <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.04em] text-[#666]">
                                Password
                            </label>

                            <input
                                type="password"
                                value={setupPassword}
                                onChange={(event) =>
                                    setSetupPassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Password"
                                className="h-[40px] w-full max-w-[370px] rounded-[20px] border border-[#e0e0e0] px-4 text-[13px] outline-none transition focus:border-[#b7cbed] focus:ring-2 focus:ring-[#f0f5ff]"
                            />

                            <div className="mt-3">
                                <button
                                    type="button"
                                    onClick={startSetup}
                                    disabled={
                                        loadingAction === "setup"
                                    }
                                    className="flex h-10 items-center gap-2 rounded-[10px] bg-[#78a3e8] px-4 text-[12px] font-semibold text-white transition hover:bg-[#6595df] disabled:opacity-60"
                                >
                                    {loadingAction === "setup" ? (
                                        <LoaderCircle
                                            size={14}
                                            className="animate-spin"
                                        />
                                    ) : (
                                        <ShieldCheck size={14} />
                                    )}

                                    {pending
                                        ? "Restart Two-Factor Setup"
                                        : "Set Up Two-Factor Authentication"}
                                </button>
                            </div>
                        </div>
                    )}

                    {setupStarted && (
                        <div className="mt-5 rounded-[15px] border border-[#dfe7f5] bg-[#f8fbff] p-5">
                            <h3 className="text-[14px] font-semibold text-[#222]">
                                Add Storify to your authenticator app
                            </h3>

                            <p className="mt-2 text-[12px] leading-5 text-[#707070]">
                                Enter this setup key in Google Authenticator, Microsoft Authenticator, Authy, or another TOTP app.
                            </p>

                            <div className="mt-4 flex items-center gap-2">
                                <code className="min-w-0 flex-1 overflow-x-auto rounded-[9px] border border-[#dce3ee] bg-white px-3 py-2.5 text-[12px] font-semibold tracking-[0.08em] text-[#333]">
                                    {setupSecret}
                                </code>

                                <CopyButton
                                    value={setupSecret}
                                />
                            </div>

                            {qrUrl && (
                                <a
                                    href={qrUrl}
                                    className="mt-3 inline-flex text-[11px] font-medium text-[#2065D1] hover:underline"
                                >
                                    Open authenticator setup link
                                </a>
                            )}

                            <div className="mt-5">
                                <label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.04em] text-[#666]">
                                    Verification code
                                </label>

                                <input
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    value={confirmCode}
                                    onChange={(event) =>
                                        setConfirmCode(
                                            event.target.value.replace(
                                                /\D/g,
                                                ""
                                            )
                                        )
                                    }
                                    placeholder="000000"
                                    className="h-[40px] w-full max-w-[220px] rounded-[20px] border border-[#e0e0e0] px-4 text-center text-[15px] font-semibold tracking-[0.22em] outline-none transition focus:border-[#b7cbed] focus:ring-2 focus:ring-[#f0f5ff]"
                                />

                                <div className="mt-3">
                                    <button
                                        type="button"
                                        onClick={confirmSetup}
                                        disabled={
                                            loadingAction ===
                                            "confirm"
                                        }
                                        className="flex h-10 items-center gap-2 rounded-[10px] bg-[#2065D1] px-4 text-[12px] font-semibold text-white transition hover:bg-[#1959bd] disabled:opacity-60"
                                    >
                                        {loadingAction === "confirm" ? (
                                            <LoaderCircle
                                                size={14}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Check size={14} />
                                        )}

                                        Confirm and Enable
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {enabled && (
                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    <div className="rounded-[15px] border border-[#e2e2e2] bg-[#fafafa] p-5">
                        <div className="flex items-center gap-2 text-[13px] font-semibold text-[#222]">
                            <LockKeyhole
                                size={16}
                                className="text-emerald-600"
                            />
                            Two-factor authentication is enabled
                        </div>

                        <p className="mt-2 text-[12px] leading-5 text-[#777]">
                            Your account requires an authenticator code during sign in.
                        </p>

                        <div className="mt-5 space-y-3">
                            <input
                                type="password"
                                value={disablePassword}
                                onChange={(event) =>
                                    setDisablePassword(
                                        event.target.value
                                    )
                                }
                                placeholder="Current password"
                                className="h-[40px] w-full rounded-[20px] border border-[#e0e0e0] bg-white px-4 text-[13px] outline-none"
                            />

                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={6}
                                value={disableCode}
                                onChange={(event) =>
                                    setDisableCode(
                                        event.target.value.replace(
                                            /\D/g,
                                            ""
                                        )
                                    )
                                }
                                placeholder="6-digit authenticator code"
                                className="h-[40px] w-full rounded-[20px] border border-[#e0e0e0] bg-white px-4 text-[13px] outline-none"
                            />

                            <button
                                type="button"
                                onClick={disableTwoFactor}
                                disabled={
                                    loadingAction === "disable"
                                }
                                className="flex h-9 items-center gap-2 rounded-[9px] border border-red-200 bg-white px-4 text-[12px] font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                            >
                                {loadingAction === "disable" && (
                                    <LoaderCircle
                                        size={13}
                                        className="animate-spin"
                                    />
                                )}

                                Disable Two-Factor
                            </button>
                        </div>
                    </div>

                    <div className="rounded-[15px] border border-[#e2e2e2] bg-[#fafafa] p-5">
                        <div className="text-[13px] font-semibold text-[#222]">
                            Recovery codes
                        </div>

                        <p className="mt-2 text-[12px] leading-5 text-[#777]">
                            Recovery codes can be used if you lose access to your authenticator app.
                        </p>

                        <input
                            type="password"
                            value={recoveryPassword}
                            onChange={(event) =>
                                setRecoveryPassword(
                                    event.target.value
                                )
                            }
                            placeholder="Current password"
                            className="mt-4 h-[40px] w-full rounded-[20px] border border-[#e0e0e0] bg-white px-4 text-[13px] outline-none"
                        />

                        <button
                            type="button"
                            onClick={regenerateRecoveryCodes}
                            disabled={
                                loadingAction === "recovery"
                            }
                            className="mt-3 flex h-9 items-center gap-2 rounded-[9px] border border-[#d9d9d9] bg-white px-4 text-[12px] font-medium text-[#333] transition hover:bg-[#f5f5f5] disabled:opacity-50"
                        >
                            {loadingAction === "recovery" && (
                                <LoaderCircle
                                    size={13}
                                    className="animate-spin"
                                />
                            )}

                            Regenerate Recovery Codes
                        </button>
                    </div>
                </div>
            )}

            {recoveryCodes.length > 0 && (
                <RecoveryCodes
                    codes={recoveryCodes}
                />
            )}

            {error && (
                <InlineError message={error} />
            )}
        </section>
    );
}

function RecoveryCodes({ codes }) {
    const joined = codes.join("\n");

    return (
        <div className="mt-5 rounded-[15px] border border-amber-200 bg-amber-50 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h3 className="text-[13px] font-semibold text-amber-900">
                        Save your recovery codes
                    </h3>

                    <p className="mt-1 text-[11px] leading-5 text-amber-800">
                        Store these codes somewhere safe. Each code should be treated like a password.
                    </p>
                </div>

                <CopyButton value={joined} />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {codes.map((code) => (
                    <code
                        key={code}
                        className="rounded-[8px] border border-amber-200 bg-white px-3 py-2 text-center text-[11px] font-semibold text-[#443b25]"
                    >
                        {code}
                    </code>
                ))}
            </div>
        </div>
    );
}

function ProfileField({
    label,
    icon: Icon,
    value,
    type = "text",
    onChange,
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.04em] text-[#666]">
                {label}
            </span>

            <div className="relative">
                <Icon
                    size={14}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999]"
                />

                <input
                    type={type}
                    value={value}
                    onChange={(event) =>
                        onChange(
                            event.target.value
                        )
                    }
                    className="h-[44px] w-full rounded-[22px] border border-[#e1e1e1] bg-white pl-10 pr-4 text-[13px] text-[#444] outline-none transition focus:border-[#b6c9ee] focus:ring-2 focus:ring-[#f1f6ff]"
                />
            </div>
        </label>
    );
}

function PasswordField({
    label,
    value,
    visible,
    onChange,
    onToggle,
}) {
    return (
        <label className="block">
            <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.04em] text-[#666]">
                {label}
            </span>

            <div className="relative">
                <input
                    type={
                        visible
                            ? "text"
                            : "password"
                    }
                    value={value}
                    onChange={(event) =>
                        onChange(
                            event.target.value
                        )
                    }
                    className="h-[44px] w-full rounded-[22px] border border-[#e1e1e1] bg-white px-4 pr-11 text-[13px] text-[#444] outline-none transition focus:border-[#b6c9ee] focus:ring-2 focus:ring-[#f1f6ff]"
                />

                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#999] hover:bg-[#f3f3f3] hover:text-[#555]"
                >
                    {visible ? (
                        <EyeOff size={14} />
                    ) : (
                        <Eye size={14} />
                    )}
                </button>
            </div>
        </label>
    );
}

function AccountRow({
    icon: Icon,
    label,
    value,
    valueClass = "",
}) {
    return (
        <div className="flex items-center gap-3 rounded-[13px] bg-[#fafafa] px-4 py-3.5">
            <Icon
                size={16}
                className="shrink-0 text-[#777]"
            />

            <div className="min-w-0">
                <div className="text-[11px] text-[#888]">
                    {label}
                </div>

                <div
                    className={`mt-[2px] truncate text-[12px] font-medium text-[#222] ${valueClass}`}
                >
                    {value}
                </div>
            </div>
        </div>
    );
}

function TwoFactorStatus({
    enabled,
    pending,
}) {
    let label = "Disabled";
    let className =
        "bg-[#f1efff] text-[#5e4dac]";

    if (enabled) {
        label = "Enabled";
        className =
            "bg-emerald-50 text-emerald-700";
    } else if (pending) {
        label = "Setup pending";
        className =
            "bg-amber-50 text-amber-700";
    }

    return (
        <span
            className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-medium ${className}`}
        >
            {label}
        </span>
    );
}

function IconBubble({
    children,
    tone = "blue",
}) {
    const className =
        tone === "orange"
            ? "bg-[#fff0e8] text-[#ff6f2c]"
            : "bg-[#eaf2ff] text-[#2065D1]";

    return (
        <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${className}`}
        >
            {children}
        </div>
    );
}

function CopyButton({ value }) {
    const [copied, setCopied] =
        useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(
                value
            );

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 1500);
        } catch (error) {
            console.error(
                "Copy error:",
                error
            );
        }
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            className="flex h-9 items-center gap-2 rounded-[9px] border border-[#dedede] bg-white px-3 text-[11px] font-medium text-[#555] transition hover:bg-[#f6f6f6]"
        >
            {copied ? (
                <Check size={13} />
            ) : (
                <Copy size={13} />
            )}

            {copied
                ? "Copied"
                : "Copy"}
        </button>
    );
}

function InlineError({ message }) {
    return (
        <div className="mt-4 rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] text-red-600">
            {message}
        </div>
    );
}

function MessageBanner({
    type,
    message,
    onClose,
}) {
    const success =
        type === "success";

    return (
        <div
            className={`mb-5 rounded-[10px] border px-4 py-3 text-[12px] ${
                success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
            }`}
        >
            <div className="flex items-center justify-between gap-4">
                <span>{message}</span>

                <button
                    type="button"
                    onClick={onClose}
                    className="rounded p-1 hover:bg-black/5"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

function ProfileLoader() {
    return (
        <div className="min-h-screen bg-[#f6f6f7] px-6 py-8">
            <div className="mx-auto flex min-h-[420px] max-w-[1180px] items-center justify-center rounded-[20px] border border-[#e3e3e3] bg-white">
                <LoaderCircle
                    size={28}
                    className="animate-spin text-[#2065D1]"
                />
            </div>
        </div>
    );
}


function getInitials(name) {

  const value = String(
    name || ""
  ).trim();

  if (!value) {
    return "A";
  }

  const parts = value
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "A";
  }

  if (parts.length === 1) {
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


function normalizeDateInput(value) {
    if (!value) {
        return "";
    }

    return String(value).slice(0, 10);
}

function formatRole(role) {
    const value = String(role || "vendor")
        .replace(/[_-]+/g, " ")
        .trim();

    return value
        .split(/\s+/)
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(" ");
}

function firstApiError(error) {
    const errors =
        error.response?.data?.errors;

    if (errors) {
        const first = Object.values(errors)
            .flat()
            .find(Boolean);

        if (first) {
            return String(first);
        }
    }

    return (
        error.response?.data?.message ||
        ""
    );
}
