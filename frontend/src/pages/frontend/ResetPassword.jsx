import {
    useEffect,
    useState,
} from "react";

import {
    Link,
    useSearchParams,
} from "react-router-dom";

import Navbar from "../../components/frontend/Navbar";
import api from "../../api/axios";

const ResetPassword = () => {
    const [
        searchParams,
    ] = useSearchParams();

    const token =
        searchParams.get(
            "token"
        ) || "";

    const email =
        searchParams.get(
            "email"
        ) || "";

    const [
        form,
        setForm,
    ] = useState({
        password: "",
        password_confirmation: "",
    });

    const [
        showPassword,
        setShowPassword,
    ] = useState(false);

    const [
        showConfirmation,
        setShowConfirmation,
    ] = useState(false);

    const [
        validating,
        setValidating,
    ] = useState(true);

    const [
        validToken,
        setValidToken,
    ] = useState(false);

    const [
        submitting,
        setSubmitting,
    ] = useState(false);

    const [
        success,
        setSuccess,
    ] = useState(false);

    const [
        error,
        setError,
    ] = useState("");

    const [
        errors,
        setErrors,
    ] = useState({});

    useEffect(() => {
        validateResetLink();
    }, [
        token,
        email,
    ]);

    const validateResetLink =
        async () => {
            if (
                !token ||
                !email
            ) {
                setValidToken(false);
                setValidating(false);
                setError(
                    "This password reset link is invalid or incomplete."
                );

                return;
            }

            try {
                setValidating(true);
                setError("");

                await api.post(
                    "/auth/reset-password/validate",
                    {
                        token,
                        email,
                    }
                );

                setValidToken(true);
            } catch (error) {
                console.error(
                    "Reset token validation error:",
                    error.response?.data ||
                        error.message
                );

                setValidToken(false);

                setError(
                    error.response?.data
                        ?.message ||
                        "This password reset link is invalid or has expired."
                );
            } finally {
                setValidating(false);
            }
        };

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

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        if (submitting) {
            return;
        }

        setError("");
        setErrors({});

        if (
            form.password !==
            form.password_confirmation
        ) {
            setErrors({
                password_confirmation: [
                    "Passwords do not match.",
                ],
            });

            return;
        }

        try {
            setSubmitting(true);

            const response =
                await api.post(
                    "/auth/reset-password",
                    {
                        email,
                        token,

                        password:
                            form.password,

                        password_confirmation:
                            form.password_confirmation,
                    }
                );

            if (
                response.data?.status
            ) {
                setSuccess(true);
                return;
            }

            setError(
                response.data?.message ||
                    "Unable to reset your password."
            );
        } catch (error) {
            console.error(
                "Reset password error:",
                error.response?.data ||
                    error.message
            );

            const validationErrors =
                error.response?.data
                    ?.errors || {};

            setErrors(
                validationErrors
            );

            setError(
                error.response?.data
                    ?.message ||
                    "Unable to reset your password. Please try again."
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (validating) {
        return (
            <div className="min-h-screen bg-white font-['Inter']">

                <Navbar />

                <main className="flex min-h-[420px] items-center justify-center px-5">

                    <div className="text-center">

                        <span className="mx-auto block h-[28px] w-[28px] animate-spin rounded-full border-[3px] border-[#2065D1]/20 border-t-[#2065D1]" />

                        <p className="mt-[13px] text-[13px] text-[#777777]">
                            Checking reset link...
                        </p>

                    </div>

                </main>

            </div>
        );
    }

    if (!validToken) {
        return (
            <div className="min-h-screen bg-white font-['Inter']">

                <Navbar />

                <main className="w-full px-5 py-[64px]">

                    <div className="mx-auto w-full max-w-[410px]">

                        <div className="rounded-[20px] border border-[#dddddd] bg-white px-[28px] py-[30px] text-center shadow-[0_6px_18px_rgba(0,0,0,0.10)]">

                            <div className="mx-auto flex h-[54px] w-[54px] items-center justify-center rounded-full bg-red-50 text-red-500">
                                <InvalidIcon />
                            </div>

                            <h1 className="mt-[18px] text-[23px] font-bold text-[#111111]">
                                Reset link expired
                            </h1>

                            <p className="mt-[10px] text-[13px] leading-[20px] text-[#666666]">
                                {error}
                            </p>

                            <Link
                                to="/forgot-password"
                                className="mt-[23px] flex h-[38px] w-full items-center justify-center rounded-full bg-[#2065D1] text-[14px] font-semibold text-white transition-colors hover:bg-[#1957b7]"
                            >
                                Request a new link
                            </Link>

                            <Link
                                to="/login"
                                className="mt-[15px] inline-block text-[12px] font-medium text-[#555555] transition-colors hover:text-[#2065D1]"
                            >
                                Back to sign in
                            </Link>

                        </div>

                    </div>

                </main>

            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-white font-['Inter']">

                <Navbar />

                <main className="w-full px-5 py-[64px]">

                    <div className="mx-auto w-full max-w-[410px]">

                        <div className="rounded-[20px] border border-[#dddddd] bg-white px-[28px] py-[30px] text-center shadow-[0_6px_18px_rgba(0,0,0,0.10)]">

                            <div className="mx-auto flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#eaf8f0] text-[#28935a]">
                                <SuccessIcon />
                            </div>

                            <h1 className="mt-[18px] text-[24px] font-bold text-[#111111]">
                                Password updated
                            </h1>

                            <p className="mt-[10px] text-[13px] leading-[20px] text-[#666666]">
                                Your password has been reset successfully. You can now sign in using your new password.
                            </p>

                            <Link
                                to="/login"
                                className="mt-[24px] flex h-[38px] w-full items-center justify-center rounded-full bg-[#2065D1] text-[14px] font-semibold text-white transition-colors hover:bg-[#1957b7]"
                            >
                                Sign in
                            </Link>

                        </div>

                    </div>

                </main>

            </div>
        );
    }

    const passwordRules =
        getPasswordRules(
            form.password
        );

    return (
        <div className="min-h-screen bg-white font-['Inter']">

            <Navbar />

            <main className="w-full px-5 py-[64px]">

                <div className="mx-auto w-full max-w-[410px]">

                    <div className="w-full rounded-[20px] border border-[#dddddd] bg-white px-[24px] pb-[25px] pt-[27px] shadow-[0_6px_18px_rgba(0,0,0,0.10)] sm:px-[28px]">

                        <div className="text-center">

                            <div className="mx-auto flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#edf3ff] text-[#2065D1]">
                                <LockLargeIcon />
                            </div>

                            <h1 className="mt-[17px] text-[25px] font-bold leading-[1.25] text-[#111111]">
                                Create new password
                            </h1>

                            <p className="mt-[10px] text-[13px] leading-[20px] text-[#666666]">
                                Choose a secure password for
                            </p>

                            <p className="mt-[3px] break-all text-[12px] font-medium text-[#333333]">
                                {email}
                            </p>

                        </div>

                        {error && (
                            <div className="mt-[18px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[10px] text-center text-[12px] text-red-600">
                                {error}
                            </div>
                        )}

                        <form
                            onSubmit={
                                handleSubmit
                            }
                            className="mt-[24px]"
                        >

                            <PasswordField
                                label="New password"
                                value={
                                    form.password
                                }
                                show={
                                    showPassword
                                }
                                error={
                                    errors
                                        .password?.[0]
                                }
                                autoComplete="new-password"
                                onChange={(
                                    value
                                ) =>
                                    updateField(
                                        "password",
                                        value
                                    )
                                }
                                onToggle={() =>
                                    setShowPassword(
                                        (
                                            current
                                        ) =>
                                            !current
                                    )
                                }
                            />

                            <div className="mt-[11px] grid grid-cols-2 gap-x-[12px] gap-y-[7px] rounded-[11px] bg-[#f8f9fb] px-[12px] py-[11px]">

                                <PasswordRule
                                    passed={
                                        passwordRules.length
                                    }
                                    label="8+ characters"
                                />

                                <PasswordRule
                                    passed={
                                        passwordRules.uppercase
                                    }
                                    label="Uppercase"
                                />

                                <PasswordRule
                                    passed={
                                        passwordRules.lowercase
                                    }
                                    label="Lowercase"
                                />

                                <PasswordRule
                                    passed={
                                        passwordRules.number
                                    }
                                    label="Number"
                                />

                            </div>

                            <div className="mt-[17px]">

                                <PasswordField
                                    label="Confirm password"
                                    value={
                                        form.password_confirmation
                                    }
                                    show={
                                        showConfirmation
                                    }
                                    error={
                                        errors
                                            .password_confirmation?.[0]
                                    }
                                    autoComplete="new-password"
                                    onChange={(
                                        value
                                    ) =>
                                        updateField(
                                            "password_confirmation",
                                            value
                                        )
                                    }
                                    onToggle={() =>
                                        setShowConfirmation(
                                            (
                                                current
                                            ) =>
                                                !current
                                        )
                                    }
                                />

                            </div>

                            <button
                                type="submit"
                                disabled={
                                    submitting
                                }
                                className="mt-[21px] h-[38px] w-full rounded-full bg-[#2065D1] text-[14px] font-semibold text-white transition-colors hover:bg-[#1957b7] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {submitting ? (
                                    <span className="flex items-center justify-center gap-2">

                                        <Spinner />

                                        Resetting...

                                    </span>
                                ) : (
                                    "Reset password"
                                )}
                            </button>

                        </form>

                        <div className="mt-[20px] text-center">

                            <Link
                                to="/login"
                                className="text-[12px] font-medium text-[#555555] transition-colors hover:text-[#2065D1]"
                            >
                                Back to sign in
                            </Link>

                        </div>

                    </div>

                </div>

            </main>

        </div>
    );
};

const PasswordField = ({
    label,
    value,
    show,
    error,
    autoComplete,
    onChange,
    onToggle,
}) => {
    return (
        <div>

            <label className="mb-[7px] block text-[13px] font-medium text-[#111111]">
                {label}
            </label>

            <div className="relative">

                <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#7d7d7d]">
                    <LockIcon />
                </span>

                <input
                    type={
                        show
                            ? "text"
                            : "password"
                    }
                    value={value}
                    onChange={(
                        event
                    ) =>
                        onChange(
                            event.target.value
                        )
                    }
                    placeholder="••••••••"
                    autoComplete={
                        autoComplete
                    }
                    className={`h-[38px] w-full rounded-full border bg-white pl-[40px] pr-[42px] text-[13px] text-[#222222] outline-none transition-all placeholder:text-[#777777] focus:ring-[3px] ${
                        error
                            ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                            : "border-[#dedede] focus:border-[#2065D1] focus:ring-[#2065D1]/10"
                    }`}
                />

                <button
                    type="button"
                    onClick={
                        onToggle
                    }
                    className="absolute right-[13px] top-1/2 -translate-y-1/2 text-[#888888] transition-colors hover:text-[#2065D1]"
                    aria-label={
                        show
                            ? "Hide password"
                            : "Show password"
                    }
                >
                    {show ? (
                        <EyeOffIcon />
                    ) : (
                        <EyeIcon />
                    )}
                </button>

            </div>

            {error && (
                <p className="mt-[5px] text-[11px] text-red-500">
                    {error}
                </p>
            )}

        </div>
    );
};

const PasswordRule = ({
    passed,
    label,
}) => {
    return (
        <div
            className={`flex items-center gap-[6px] text-[10px] ${
                passed
                    ? "text-[#28935a]"
                    : "text-[#999999]"
            }`}
        >
            <span
                className={`flex h-[13px] w-[13px] items-center justify-center rounded-full border ${
                    passed
                        ? "border-[#28935a] bg-[#eaf8f0]"
                        : "border-[#cccccc]"
                }`}
            >
                {passed && (
                    <CheckIcon />
                )}
            </span>

            {label}
        </div>
    );
};

const getPasswordRules = (
    password
) => {
    return {
        length:
            password.length >= 8,

        uppercase:
            /[A-Z]/.test(
                password
            ),

        lowercase:
            /[a-z]/.test(
                password
            ),

        number:
            /[0-9]/.test(
                password
            ),
    };
};

const Spinner = () => {
    return (
        <span className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
    );
};

const LockIcon = () => {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect
                x="4"
                y="10"
                width="16"
                height="10"
                rx="2"
            />

            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
    );
};

const LockLargeIcon = () => {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect
                x="4"
                y="10"
                width="16"
                height="10"
                rx="2"
            />

            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </svg>
    );
};

const EyeIcon = () => {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />

            <circle
                cx="12"
                cy="12"
                r="2.5"
            />
        </svg>
    );
};

const EyeOffIcon = () => {
    return (
        <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m3 3 18 18" />

            <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />

            <path d="M9.9 4.2A11 11 0 0 1 12 4c6.5 0 10 8 10 8a17 17 0 0 1-2 3" />

            <path d="M6.6 6.6C3.6 8.4 2 12 2 12s3.5 8 10 8a10 10 0 0 0 4-.8" />
        </svg>
    );
};

const CheckIcon = () => {
    return (
        <svg
            width="8"
            height="8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m5 12 4 4L19 6" />
        </svg>
    );
};

const InvalidIcon = () => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
            />

            <path d="M12 8v5" />
            <path d="M12 16h.01" />
        </svg>
    );
};

const SuccessIcon = () => {
    return (
        <svg
            width="25"
            height="25"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
            />

            <path d="m8 12 2.7 2.7L16.5 9" />
        </svg>
    );
};

export default ResetPassword;