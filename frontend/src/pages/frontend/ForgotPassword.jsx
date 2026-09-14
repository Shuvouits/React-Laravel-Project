import {
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import Navbar from "../../components/frontend/Navbar";
import api from "../../api/axios";

const ForgotPassword = () => {
    const [
        email,
        setEmail,
    ] = useState("");

    const [
        error,
        setError,
    ] = useState("");

    const [
        fieldError,
        setFieldError,
    ] = useState("");

    const [
        message,
        setMessage,
    ] = useState("");

    const [
        loading,
        setLoading,
    ] = useState(false);

    const [
        sent,
        setSent,
    ] = useState(false);

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        if (loading) {
            return;
        }

        try {
            setLoading(true);
            setError("");
            setFieldError("");
            setMessage("");

            const response =
                await api.post(
                    "/auth/forgot-password",
                    {
                        email:
                            email.trim(),
                    }
                );

            setMessage(
                response.data?.message ||
                    "If an account exists with this email, a password reset link has been sent."
            );

            setSent(true);
        } catch (error) {
            console.error(
                "Forgot password error:",
                error.response?.data ||
                    error.message
            );

            const validationErrors =
                error.response?.data
                    ?.errors || {};

            if (
                validationErrors
                    .email?.length
            ) {
                setFieldError(
                    validationErrors
                        .email[0]
                );
            }

            setError(
                error.response?.data
                    ?.message ||
                    "Unable to send password reset email. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleTryAgain = () => {
        setSent(false);
        setMessage("");
        setError("");
        setFieldError("");
    };

    return (
        <div className="min-h-screen bg-white font-['Inter']">

            <Navbar />

            <main className="w-full px-5 py-[64px]">

                <div className="mx-auto w-full max-w-[410px]">

                    <div className="w-full rounded-[20px] border border-[#dddddd] bg-white px-[24px] pb-[25px] pt-[27px] shadow-[0_6px_18px_rgba(0,0,0,0.10)] sm:px-[28px]">

                        {!sent ? (
                            <>
                                <div className="text-center">

                                    <div className="mx-auto flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#edf3ff] text-[#2065D1]">
                                        <KeyIcon />
                                    </div>

                                    <h1 className="mt-[17px] text-[25px] font-bold leading-[1.25] text-[#111111]">
                                        Forgot password?
                                    </h1>

                                    <p className="mx-auto mt-[10px] max-w-[320px] text-[13px] leading-[20px] text-[#666666]">
                                        Enter your email address and we'll send you a link to reset your password.
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
                                    className="mt-[25px]"
                                >

                                    <div>

                                        <label
                                            htmlFor="forgot-email"
                                            className="mb-[7px] block text-[13px] font-medium text-[#111111]"
                                        >
                                            Email
                                        </label>

                                        <div className="relative">

                                            <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#7d7d7d]">
                                                <EmailIcon />
                                            </span>

                                            <input
                                                id="forgot-email"
                                                type="email"
                                                value={
                                                    email
                                                }
                                                onChange={(
                                                    event
                                                ) => {
                                                    setEmail(
                                                        event
                                                            .target
                                                            .value
                                                    );

                                                    setError(
                                                        ""
                                                    );

                                                    setFieldError(
                                                        ""
                                                    );
                                                }}
                                                placeholder="name@example.com"
                                                autoComplete="email"
                                                autoFocus
                                                className={`h-[38px] w-full rounded-full border bg-white pl-[40px] pr-[15px] text-[13px] text-[#222222] outline-none transition-all placeholder:text-[#777777] focus:ring-[3px] ${
                                                    fieldError
                                                        ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                                                        : "border-[#dedede] focus:border-[#2065D1] focus:ring-[#2065D1]/10"
                                                }`}
                                            />

                                        </div>

                                        {fieldError && (
                                            <p className="mt-[5px] text-[11px] text-red-500">
                                                {
                                                    fieldError
                                                }
                                            </p>
                                        )}

                                    </div>

                                    <button
                                        type="submit"
                                        disabled={
                                            loading
                                        }
                                        className="mt-[20px] h-[38px] w-full rounded-full bg-[#2065D1] text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#1957b7] disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">

                                                <Spinner />

                                                Sending...

                                            </span>
                                        ) : (
                                            "Send reset link"
                                        )}
                                    </button>

                                </form>

                                <div className="mt-[21px] text-center">

                                    <Link
                                        to="/login"
                                        className="inline-flex items-center gap-[7px] text-[13px] font-medium text-[#555555] transition-colors hover:text-[#2065D1]"
                                    >
                                        <ArrowLeftIcon />

                                        Back to sign in
                                    </Link>

                                </div>
                            </>
                        ) : (
                            <div className="text-center">

                                <div className="mx-auto flex h-[54px] w-[54px] items-center justify-center rounded-full bg-[#eaf8f0] text-[#28935a]">
                                    <MailCheckIcon />
                                </div>

                                <h1 className="mt-[18px] text-[24px] font-bold text-[#111111]">
                                    Check your email
                                </h1>

                                <p className="mt-[10px] text-[13px] leading-[20px] text-[#666666]">
                                    {message}
                                </p>

                                <p className="mt-[10px] break-all text-[13px] font-medium text-[#222222]">
                                    {email}
                                </p>

                                <Link
                                    to="/login"
                                    className="mt-[24px] flex h-[38px] w-full items-center justify-center rounded-full bg-[#2065D1] text-[14px] font-semibold text-white transition-colors hover:bg-[#1957b7]"
                                >
                                    Back to sign in
                                </Link>

                                <button
                                    type="button"
                                    onClick={
                                        handleTryAgain
                                    }
                                    className="mt-[15px] text-[12px] font-medium text-[#2065D1] transition-colors hover:text-[#174fa9]"
                                >
                                    Try another email
                                </button>

                            </div>
                        )}

                    </div>

                </div>

            </main>

        </div>
    );
};

const Spinner = () => {
    return (
        <span className="h-[15px] w-[15px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
    );
};

const EmailIcon = () => {
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
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
            />

            <path d="m3 7 9 6 9-6" />
        </svg>
    );
};

const KeyIcon = () => {
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
            <circle
                cx="7.5"
                cy="15.5"
                r="4.5"
            />

            <path d="m11 12 9-9" />
            <path d="m15 8 2 2" />
            <path d="m17 6 2 2" />
        </svg>
    );
};

const MailCheckIcon = () => {
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
            <rect
                x="3"
                y="5"
                width="18"
                height="14"
                rx="2"
            />

            <path d="m3 7 9 6 9-6" />
            <path d="m16 16 2 2 4-4" />
        </svg>
    );
};

const ArrowLeftIcon = () => {
    return (
        <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M19 12H5" />
            <path d="m12 19-7-7 7-7" />
        </svg>
    );
};

export default ForgotPassword;