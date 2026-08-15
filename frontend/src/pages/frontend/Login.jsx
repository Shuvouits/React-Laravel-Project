import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import Navbar from "../../components/frontend/Navbar";
import api from "../../api/axios";

const Login = () => {
    const navigate = useNavigate();

    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((previous) => ({
                ...previous,
                [name]: null,
            }));
        }

        setGeneralError("");
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setLoading(true);
            setErrors({});
            setGeneralError("");

            const response = await api.post("/auth/login", {
                email: formData.email,
                password: formData.password,
            });

            const data = response.data;

            if (data.requires_two_factor) {
                sessionStorage.setItem(
                    "two_factor_challenge",
                    data.challenge_token
                );

                sessionStorage.setItem(
                    "two_factor_email",
                    data.email || formData.email
                );

                navigate("/two-factor-challenge", {
                    replace: true,
                });

                return;
            }

            if (!data?.token || !data?.user) {
                setGeneralError(
                    data?.message ||
                    "Login completed, but authentication data is missing."
                );

                return;
            }

            localStorage.setItem(
                "token",
                data.token
            );

            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            api.defaults.headers.common.Authorization =
                `Bearer ${data.token}`;

            sessionStorage.removeItem(
                "two_factor_challenge"
            );

            sessionStorage.removeItem(
                "two_factor_email"
            );

            const redirectPath = getLoginRedirectPath(
                data.user.role
            );

            window.location.replace(
                redirectPath
            );
        } catch (error) {
            console.error(
                "Login error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 422) {
                const validationErrors =
                    error.response?.data?.errors || {};

                setErrors(validationErrors);

                if (validationErrors.email?.length) {
                    setGeneralError(
                        validationErrors.email[0]
                    );
                } else {
                    setGeneralError(
                        error.response?.data?.message || ""
                    );
                }

                return;
            }

            setGeneralError(
                error.response?.data?.message ||
                "Unable to sign in. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white font-['Inter']">

            <Navbar />

            <main className="w-full px-5 py-[64px]">

                <div className="mx-auto w-full max-w-[410px]">

                    <div className="w-full rounded-[20px] border border-[#dddddd] bg-white px-[24px] pb-[23px] pt-[25px] shadow-[0_6px_18px_rgba(0,0,0,0.10)] sm:px-[28px]">

                        <div className="text-center">
                            <h1 className="text-[25px] font-bold leading-[1.25] text-[#111111]">
                                Welcome back
                            </h1>

                            <p className="mt-[12px] text-[14px] text-[#666666]">
                                Sign in
                            </p>
                        </div>

                        {generalError && (
                            <div className="mt-[18px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[10px] text-center text-[12px] text-red-600">
                                {generalError}
                            </div>
                        )}

                        <button
                            type="button"
                            className="mt-[25px] flex h-[38px] w-full items-center justify-center gap-[9px] rounded-full border border-[#dddddd] bg-white text-[14px] font-medium text-[#222222] transition-all duration-200 hover:border-[#2065D1] hover:text-[#2065D1]"
                        >
                            <GoogleIcon />
                            Continue with Google
                        </button>

                        <div className="my-[21px] flex items-center gap-[10px]">

                            <div className="h-px flex-1 bg-[#e2e2e2]" />

                            <span className="shrink-0 text-[11px] uppercase text-[#777777]">
                                Or continue with
                            </span>

                            <div className="h-px flex-1 bg-[#e2e2e2]" />

                        </div>

                        <form onSubmit={handleSubmit}>

                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-[7px] block text-[13px] font-medium text-[#111111]"
                                >
                                    Email
                                </label>

                                <div className="relative">

                                    <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#7d7d7d]">
                                        <EmailIcon />
                                    </span>

                                    <input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="name@example.com"
                                        autoComplete="email"
                                        className={`h-[36px] w-full rounded-full border bg-white pl-[40px] pr-[15px] text-[13px] text-[#222222] outline-none transition-all placeholder:text-[#777777] focus:ring-[3px] ${
                                            errors.email
                                                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                                                : "border-[#dedede] focus:border-[#2065D1] focus:ring-[#2065D1]/10"
                                        }`}
                                    />

                                </div>

                                {errors.email && (
                                    <p className="mt-[5px] text-[11px] text-red-500">
                                        {errors.email[0]}
                                    </p>
                                )}

                            </div>

                            <div className="mt-[17px]">

                                <label
                                    htmlFor="password"
                                    className="mb-[7px] block text-[13px] font-medium text-[#111111]"
                                >
                                    Password
                                </label>

                                <div className="relative">

                                    <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#7d7d7d]">
                                        <LockIcon />
                                    </span>

                                    <input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        className={`h-[36px] w-full rounded-full border bg-white pl-[40px] pr-[42px] text-[13px] text-[#222222] outline-none transition-all placeholder:text-[#777777] focus:ring-[3px] ${
                                            errors.password
                                                ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                                                : "border-[#dedede] focus:border-[#2065D1] focus:ring-[#2065D1]/10"
                                        }`}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowPassword(
                                                (previous) => !previous
                                            );
                                        }}
                                        className="absolute right-[13px] top-1/2 -translate-y-1/2 text-[#888888] transition-colors hover:text-[#2065D1]"
                                        aria-label="Toggle password visibility"
                                    >
                                        {showPassword ? (
                                            <EyeOffIcon />
                                        ) : (
                                            <EyeIcon />
                                        )}
                                    </button>

                                </div>

                                {errors.password && (
                                    <p className="mt-[5px] text-[11px] text-red-500">
                                        {errors.password[0]}
                                    </p>
                                )}

                            </div>

                            <div className="mt-[12px] flex justify-end">

                                <Link
                                    to="/forgot-password"
                                    className="text-[13px] text-[#2065D1] transition-colors hover:text-[#174fa9]"
                                >
                                    Forgot password?
                                </Link>

                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="mt-[18px] h-[37px] w-full rounded-full bg-[#2065D1] text-[14px] font-semibold text-white transition-colors duration-200 hover:bg-[#1957b7] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <Spinner />
                                        Signing in...
                                    </span>
                                ) : (
                                    "Sign in"
                                )}
                            </button>

                        </form>

                        <div className="mb-[19px] mt-[28px] flex items-center gap-[10px]">

                            <div className="h-px flex-1 bg-[#e2e2e2]" />

                            <span className="shrink-0 text-[11px] uppercase text-[#777777]">
                                Don't have an account?
                            </span>

                            <div className="h-px flex-1 bg-[#e2e2e2]" />

                        </div>

                        <Link
                            to="/register"
                            className="flex h-[37px] w-full items-center justify-center rounded-full border border-[#dddddd] bg-white text-[14px] font-medium text-[#111111] transition-all hover:border-[#2065D1] hover:text-[#2065D1]"
                        >
                            Create an account
                        </Link>

                    </div>

                </div>

            </main>

        </div>
    );
};

const getLoginRedirectPath = (role) => {
    if (role === "admin") {
        return "/admin/dashboard";
    }

    if (role === "vendor") {
        return "/vendor/dashboard";
    }

    if (
        role === "customer" ||
        role === "user"
    ) {
        return "/account";
    }

    return "/account";
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

const GoogleIcon = () => {
    return (
        <svg
            width="18"
            height="18"
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
    );
};

export default Login;