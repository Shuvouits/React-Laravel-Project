import {
    useEffect,
    useState,
} from "react";

import {
    Link,
    useNavigate,
    useSearchParams,
} from "react-router-dom";

import api from "../../api/axios";

const exchangeRequests = new Map();

const SocialAuthCallback = () => {
    const navigate = useNavigate();

    const [
        searchParams,
    ] = useSearchParams();

    const [
        error,
        setError,
    ] = useState("");

    const [
        status,
        setStatus,
    ] = useState(
        "Completing your Google sign in..."
    );

    useEffect(() => {
        const providerError =
            searchParams.get("error");

        const code =
            searchParams.get("code");

        if (providerError) {
            setError(
                getProviderErrorMessage(
                    providerError
                )
            );

            return;
        }

        if (!code) {
            setError(
                "The Google sign-in response is missing or invalid."
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | REMOVE CODE FROM ADDRESS BAR
        |--------------------------------------------------------------------------
        |
        | The exchange code is short-lived and one-time use.
        | Remove it from the visible URL/history as soon as we have read it.
        |
        */

        window.history.replaceState(
            {},
            document.title,
            "/social-auth/callback"
        );

        completeSocialLogin(
            code
        );

        async function completeSocialLogin(
            exchangeCode
        ) {
            try {
                setStatus(
                    "Verifying your Google account..."
                );

                const response =
                    await exchangeSocialCode(
                        exchangeCode
                    );

                const data =
                    response.data || {};

                /*
                |--------------------------------------------------------------------------
                | TWO-FACTOR AUTHENTICATION
                |--------------------------------------------------------------------------
                */

                if (
                    data.requires_two_factor
                ) {
                    if (
                        !data.challenge_token
                    ) {
                        setError(
                            "Two-factor authentication could not be started."
                        );

                        return;
                    }

                    sessionStorage.setItem(
                        "two_factor_challenge",
                        data.challenge_token
                    );

                    sessionStorage.setItem(
                        "two_factor_email",
                        data.email || ""
                    );

                    navigate(
                        "/two-factor-challenge",
                        {
                            replace: true,
                        }
                    );

                    return;
                }

                /*
                |--------------------------------------------------------------------------
                | AUTH DATA
                |--------------------------------------------------------------------------
                */

                if (
                    !data.token ||
                    !data.user
                ) {
                    setError(
                        data.message ||
                        "Google sign in completed, but authentication data is missing."
                    );

                    return;
                }

                setStatus(
                    "Signing you in..."
                );

                /*
                |--------------------------------------------------------------------------
                | STORE LOGIN
                |--------------------------------------------------------------------------
                */

                localStorage.setItem(
                    "token",
                    data.token
                );

                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        data.user
                    )
                );

                api.defaults.headers.common.Authorization =
                    `Bearer ${data.token}`;

                /*
                |--------------------------------------------------------------------------
                | CLEAR OLD 2FA SESSION
                |--------------------------------------------------------------------------
                */

                sessionStorage.removeItem(
                    "two_factor_challenge"
                );

                sessionStorage.removeItem(
                    "two_factor_email"
                );

                /*
                |--------------------------------------------------------------------------
                | ROLE REDIRECT
                |--------------------------------------------------------------------------
                */

                const redirectPath =
                    getLoginRedirectPath(
                        data.user.role
                    );

                window.location.replace(
                    redirectPath
                );
            } catch (error) {
                console.error(
                    "Social login exchange error:",
                    error.response?.data ||
                    error.message
                );

                const validationErrors =
                    error.response?.data
                        ?.errors;

                const firstValidationError =
                    validationErrors
                        ? Object.values(
                              validationErrors
                          )
                              .flat()
                              .find(Boolean)
                        : null;

                setError(
                    firstValidationError ||
                    error.response?.data
                        ?.message ||
                    "Unable to complete Google sign in. Please try again."
                );
            }
        }
    }, [
        navigate,
        searchParams,
    ]);

    return (
        <main className="flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 font-['Inter']">
            <div className="w-full max-w-[420px] rounded-[18px] border border-[#e0e0e0] bg-white px-[28px] py-[36px] text-center shadow-[0_8px_28px_rgba(0,0,0,0.08)]">

                {!error ? (
                    <>
                        <div className="mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#f4f7ff]">
                            <GoogleLoadingIcon />
                        </div>

                        <h1 className="mt-[20px] text-[20px] font-bold text-[#171717]">
                            Signing you in
                        </h1>

                        <p className="mt-[8px] text-[13px] leading-[1.6] text-[#777777]">
                            {status}
                        </p>

                        <div className="mt-[22px] flex justify-center">
                            <span className="h-[22px] w-[22px] animate-spin rounded-full border-[3px] border-[#2065D1]/20 border-t-[#2065D1]" />
                        </div>
                    </>
                ) : (
                    <>
                        <div className="mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-full bg-red-50 text-red-500">
                            <ErrorIcon />
                        </div>

                        <h1 className="mt-[20px] text-[20px] font-bold text-[#171717]">
                            Google sign in failed
                        </h1>

                        <p className="mt-[9px] text-[13px] leading-[1.6] text-[#777777]">
                            {error}
                        </p>

                        <Link
                            to="/login"
                            replace="true"
                            className="mt-[24px] flex h-[39px] w-full items-center justify-center rounded-full bg-[#2065D1] text-[13px] font-semibold text-white transition hover:bg-[#1957b7]"
                        >
                            Back to sign in
                        </Link>
                    </>
                )}

            </div>
        </main>
    );
};

/*
|--------------------------------------------------------------------------
| EXCHANGE REQUEST
|--------------------------------------------------------------------------
|
| React StrictMode can execute effects more than once during development.
| The backend exchange code is one-time use, so reuse the same Promise
| instead of accidentally submitting the code twice.
|
*/

const exchangeSocialCode = (
    code
) => {
    if (
        exchangeRequests.has(
            code
        )
    ) {
        return exchangeRequests.get(
            code
        );
    }

    const request =
        api.post(
            "/auth/social/exchange",
            {
                code,
            }
        );

    exchangeRequests.set(
        code,
        request
    );

    return request;
};

/*
|--------------------------------------------------------------------------
| PROVIDER ERRORS
|--------------------------------------------------------------------------
*/

const getProviderErrorMessage = (
    error
) => {
    const messages = {
        invalid_state:
            "The Google sign-in session expired or could not be verified. Please try again.",

        provider_auth_failed:
            "Google could not authenticate this sign-in request. Please try again.",

        email_not_verified:
            "Your Google account does not have a verified email address.",

        account_unavailable:
            "This account is currently unavailable.",
    };

    return (
        messages[error] ||
        "Unable to sign in with Google. Please try again."
    );
};

/*
|--------------------------------------------------------------------------
| ROLE REDIRECT
|--------------------------------------------------------------------------
*/

const getLoginRedirectPath = (
    role
) => {
    if (role === "admin") {
        return "/admin/dashboard";
    }

    if (role === "vendor") {
        return "/vendor/dashboard";
    }

    return "/account";
};

/*
|--------------------------------------------------------------------------
| GOOGLE ICON
|--------------------------------------------------------------------------
*/

const GoogleLoadingIcon = () => {
    return (
        <svg
            width="25"
            height="25"
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

const ErrorIcon = () => {
    return (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
        >
            <circle
                cx="12"
                cy="12"
                r="9"
            />

            <path d="M12 7v6" />

            <path d="M12 17h.01" />
        </svg>
    );
};

export default SocialAuthCallback;