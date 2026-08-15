import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    KeyRound,
    LoaderCircle,
    ShieldCheck,
} from "lucide-react";

import api from "../../api/axios";

const TwoFactorChallenge = () => {
    const navigate = useNavigate();

    const [mode, setMode] = useState("code");
    const [code, setCode] = useState("");
    const [recoveryCode, setRecoveryCode] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const [challengeToken] = useState(() =>
        sessionStorage.getItem("two_factor_challenge")
    );

    const [email] = useState(() =>
        sessionStorage.getItem("two_factor_email")
    );

    useEffect(() => {
        if (!challengeToken) {
            navigate("/login", {
                replace: true,
            });
        }
    }, [challengeToken, navigate]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!challengeToken || loading) {
            return;
        }

        try {
            setLoading(true);
            setError("");

            const payload = {
                challenge_token: challengeToken,
            };

            if (mode === "code") {
                payload.code = code;
            } else {
                payload.recovery_code = recoveryCode.trim();
            }

            const response = await api.post(
                "/auth/two-factor/challenge",
                payload
            );

            const data = response.data;

            if (!data?.token || !data?.user) {
                setError(
                    data?.message ||
                    "Login verification completed, but authentication data is missing."
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

            const redirectPath = getDashboardPath(
                data.user.role
            );

            window.location.replace(
                redirectPath
            );
        } catch (error) {
            console.error(
                "Two-factor login error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 422) {
                const errors =
                    error.response?.data?.errors || {};

                setError(
                    errors.code?.[0] ||
                    errors.recovery_code?.[0] ||
                    error.response?.data?.message ||
                    "Unable to verify your login."
                );

                return;
            }

            setError(
                error.response?.data?.message ||
                "Unable to verify your login."
            );
        } finally {
            setLoading(false);
        }
    };

    const cancelChallenge = () => {
        sessionStorage.removeItem(
            "two_factor_challenge"
        );

        sessionStorage.removeItem(
            "two_factor_email"
        );

        navigate("/login", {
            replace: true,
        });
    };

    if (!challengeToken) {
        return null;
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 py-[60px] font-['Inter']">

            <div className="w-full max-w-[470px] rounded-[20px] border border-[#e2e2e2] bg-white px-[38px] py-[40px] shadow-[0_18px_60px_rgba(0,0,0,0.08)]">

                <div className="flex justify-center">
                    <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#eef4ff] text-[#2065D1]">
                        <ShieldCheck
                            size={30}
                            strokeWidth={1.8}
                        />
                    </div>
                </div>

                <div className="mt-[22px] text-center">
                    <h1 className="text-[26px] font-semibold text-[#171717]">
                        Two-Factor Authentication
                    </h1>

                    <p className="mt-[8px] text-[14px] leading-[22px] text-[#777]">
                        Enter the verification code from your authenticator app to continue signing in.
                    </p>

                    {email && (
                        <p className="mt-[6px] text-[13px] font-medium text-[#444]">
                            {email}
                        </p>
                    )}
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="mt-[30px]"
                >
                    {error && (
                        <div className="mb-[16px] rounded-[8px] border border-red-200 bg-red-50 px-[13px] py-[11px] text-[13px] text-red-600">
                            {error}
                        </div>
                    )}

                    {mode === "code" ? (
                        <AuthenticatorCode
                            code={code}
                            onChange={setCode}
                        />
                    ) : (
                        <RecoveryCode
                            value={recoveryCode}
                            onChange={setRecoveryCode}
                        />
                    )}

                    <button
                        type="submit"
                        disabled={
                            loading ||
                            (
                                mode === "code"
                                    ? code.length !== 6
                                    : !recoveryCode.trim()
                            )
                        }
                        className="mt-[18px] flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[8px] bg-[#2065D1] text-[15px] font-semibold text-white transition hover:bg-[#1858bb] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading && (
                            <LoaderCircle
                                size={18}
                                className="animate-spin"
                            />
                        )}

                        {loading
                            ? "Verifying..."
                            : "Verify and Sign In"}
                    </button>
                </form>

                <div className="mt-[22px] border-t border-[#eeeeee] pt-[20px] text-center">
                    {mode === "code" ? (
                        <button
                            type="button"
                            onClick={() => {
                                setMode("recovery");
                                setError("");
                            }}
                            className="inline-flex items-center gap-[7px] text-[14px] font-medium text-[#2065D1] hover:underline"
                        >
                            <KeyRound size={15} />
                            Use a recovery code
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => {
                                setMode("code");
                                setError("");
                            }}
                            className="text-[14px] font-medium text-[#2065D1] hover:underline"
                        >
                            Use authenticator code
                        </button>
                    )}
                </div>

                <button
                    type="button"
                    onClick={cancelChallenge}
                    className="mt-[22px] flex w-full items-center justify-center gap-[7px] text-[14px] text-[#777] transition hover:text-[#222]"
                >
                    <ArrowLeft size={15} />
                    Back to sign in
                </button>

                <p className="mt-[24px] text-center text-[12px] leading-[19px] text-[#999]">
                    Your verification session expires after 5 minutes.
                </p>

            </div>
        </main>
    );
};

const AuthenticatorCode = ({
    code,
    onChange,
}) => {
    return (
        <div>
            <label className="mb-[8px] block text-[14px] font-medium text-[#222]">
                Authentication code
            </label>

            <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                autoFocus
                maxLength={6}
                value={code}
                onChange={(event) => {
                    onChange(
                        event.target.value.replace(/\D/g, "")
                    );
                }}
                placeholder="000000"
                className="h-[54px] w-full rounded-[9px] border border-[#dedede] px-[16px] text-center text-[22px] font-semibold tracking-[8px] text-[#222] outline-none transition focus:border-[#2065D1]"
            />

            <p className="mt-[8px] text-[12px] text-[#888]">
                Open your authenticator app and enter the current 6-digit code.
            </p>
        </div>
    );
};

const RecoveryCode = ({
    value,
    onChange,
}) => {
    return (
        <div>
            <label className="mb-[8px] block text-[14px] font-medium text-[#222]">
                Recovery code
            </label>

            <input
                type="text"
                autoFocus
                value={value}
                onChange={(event) => {
                    onChange(
                        event.target.value.toUpperCase()
                    );
                }}
                placeholder="XXXXX-XXXXX"
                className="h-[54px] w-full rounded-[9px] border border-[#dedede] px-[16px] text-[16px] font-medium uppercase tracking-[1px] text-[#222] outline-none transition focus:border-[#2065D1]"
            />

            <p className="mt-[8px] text-[12px] text-[#888]">
                Each recovery code can only be used once.
            </p>
        </div>
    );
};

const getDashboardPath = (role) => {
    if (role === "admin") {
        return "/admin/dashboard";
    }

    if (role === "vendor") {
        return "/vendor/dashboard";
    }

    if (role === "customer") {
        return "/account";
    }

    return "/";
};

export default TwoFactorChallenge;