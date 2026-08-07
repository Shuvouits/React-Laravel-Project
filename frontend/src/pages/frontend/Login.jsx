import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import Navbar from "../../components/frontend/Navbar";
import api from "../../api/axios";
import { getDashboardPath } from "../../utils/auth";


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


  /* =========================================================
     HANDLE INPUT
  ========================================================= */

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    setGeneralError("");
  };


  /* =========================================================
     LOGIN
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrors({});
    setGeneralError("");

    try {
      const response = await api.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const data = response.data;


      /* ============================
         SAVE TOKEN
      ============================ */

      localStorage.setItem(
        "token",
        data.token
      );


      /* ============================
         SAVE USER
      ============================ */

      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );


      /* ============================
         ROLE BASED REDIRECT
      ============================ */

      navigate(
        getDashboardPath(data.user.role),
        {
          replace: true,
        }
      );

    } catch (error) {

      /* ============================
         VALIDATION ERROR
      ============================ */

      if (
        error.response &&
        error.response.status === 422
      ) {
        const validationErrors =
          error.response.data.errors || {};

        setErrors(validationErrors);

        /*
         * Wrong credentials backend থেকে
         * email error হিসেবে আসলে উপরে show করবে
         */
        if (
          validationErrors.email &&
          validationErrors.email.length
        ) {
          setGeneralError(
            validationErrors.email[0]
          );
        }

        return;
      }


      /* ============================
         OTHER ERROR
      ============================ */

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


      {/* ================================
          LOGIN PAGE
      ================================= */}

      <main className="w-full py-[64px] px-5">

        <div className="w-full max-w-[410px] mx-auto">


          {/* ================================
              CARD
          ================================= */}

          <div
            className="
              w-full
              bg-white
              border
              border-[#dddddd]
              rounded-[20px]
              px-[24px]
              sm:px-[28px]
              pt-[25px]
              pb-[23px]
              shadow-[0_6px_18px_rgba(0,0,0,0.10)]
            "
          >


            {/* ============================
                HEADING
            ============================ */}

            <div className="text-center">

              <h1 className="text-[25px] leading-[1.25] font-bold text-[#111111]">
                Welcome back
              </h1>

              <p className="mt-[12px] text-[14px] text-[#666666]">
                Sign in
              </p>

            </div>


            {/* ============================
                GENERAL ERROR
            ============================ */}

            {generalError && (
              <div
                className="
                  mt-[18px]
                  px-[14px]
                  py-[10px]
                  rounded-[10px]
                  bg-red-50
                  border
                  border-red-200
                  text-red-600
                  text-[12px]
                  text-center
                "
              >
                {generalError}
              </div>
            )}


            {/* ============================
                GOOGLE BUTTON
            ============================ */}

            <button
              type="button"
              className="
                mt-[25px]
                w-full
                h-[38px]
                rounded-full
                border
                border-[#dddddd]
                bg-white
                flex
                items-center
                justify-center
                gap-[9px]
                text-[14px]
                font-medium
                text-[#222222]
                hover:border-[#2065D1]
                hover:text-[#2065D1]
                transition-all
                duration-200
              "
            >
              <GoogleIcon />

              Continue with Google
            </button>


            {/* ============================
                DIVIDER
            ============================ */}

            <div className="flex items-center gap-[10px] my-[21px]">

              <div className="flex-1 h-px bg-[#e2e2e2]" />

              <span className="shrink-0 text-[11px] uppercase text-[#777777]">
                Or continue with
              </span>

              <div className="flex-1 h-px bg-[#e2e2e2]" />

            </div>


            {/* ============================
                FORM
            ============================ */}

            <form onSubmit={handleSubmit}>


              {/* ============================
                  EMAIL
              ============================ */}

              <div>

                <label
                  htmlFor="email"
                  className="block mb-[7px] text-[13px] font-medium text-[#111111]"
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
                    className={`
                      w-full
                      h-[36px]
                      rounded-full
                      border
                      bg-white
                      pl-[40px]
                      pr-[15px]
                      text-[13px]
                      text-[#222222]
                      outline-none
                      placeholder:text-[#777777]
                      focus:ring-[3px]
                      transition-all

                      ${
                        errors.email
                          ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                          : "border-[#dedede] focus:border-[#2065D1] focus:ring-[#2065D1]/10"
                      }
                    `}
                  />

                </div>


                {errors.email && (
                  <p className="mt-[5px] text-[11px] text-red-500">
                    {errors.email[0]}
                  </p>
                )}

              </div>


              {/* ============================
                  PASSWORD
              ============================ */}

              <div className="mt-[17px]">

                <label
                  htmlFor="password"
                  className="block mb-[7px] text-[13px] font-medium text-[#111111]"
                >
                  Password
                </label>


                <div className="relative">

                  <span className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#7d7d7d]">
                    <LockIcon />
                  </span>


                  <input
                    id="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    className={`
                      w-full
                      h-[36px]
                      rounded-full
                      border
                      bg-white
                      pl-[40px]
                      pr-[42px]
                      text-[13px]
                      text-[#222222]
                      outline-none
                      placeholder:text-[#777777]
                      focus:ring-[3px]
                      transition-all

                      ${
                        errors.password
                          ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                          : "border-[#dedede] focus:border-[#2065D1] focus:ring-[#2065D1]/10"
                      }
                    `}
                  />


                  {/* SHOW / HIDE PASSWORD */}

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (prev) => !prev
                      )
                    }
                    className="
                      absolute
                      right-[13px]
                      top-1/2
                      -translate-y-1/2
                      text-[#888888]
                      hover:text-[#2065D1]
                      transition-colors
                    "
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


              {/* ============================
                  FORGOT PASSWORD
              ============================ */}

              <div className="flex justify-end mt-[12px]">

                <Link
                  to="/forgot-password"
                  className="
                    text-[13px]
                    text-[#2065D1]
                    hover:text-[#174fa9]
                    transition-colors
                  "
                >
                  Forgot password?
                </Link>

              </div>


              {/* ============================
                  SIGN IN BUTTON
              ============================ */}

              <button
                type="submit"
                disabled={loading}
                className="
                  mt-[18px]
                  w-full
                  h-[37px]
                  rounded-full
                  bg-[#2065D1]
                  text-white
                  text-[14px]
                  font-semibold
                  hover:bg-[#1957b7]
                  transition-colors
                  duration-200

                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
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


            {/* ============================
                ACCOUNT DIVIDER
            ============================ */}

            <div className="flex items-center gap-[10px] mt-[28px] mb-[19px]">

              <div className="flex-1 h-px bg-[#e2e2e2]" />

              <span className="shrink-0 text-[11px] uppercase text-[#777777]">
                Don't have an account?
              </span>

              <div className="flex-1 h-px bg-[#e2e2e2]" />

            </div>


            {/* ============================
                CREATE ACCOUNT
            ============================ */}

            <Link
              to="/register"
              className="
                w-full
                h-[37px]
                rounded-full
                border
                border-[#dddddd]
                bg-white
                flex
                items-center
                justify-center
                text-[14px]
                font-medium
                text-[#111111]
                hover:border-[#2065D1]
                hover:text-[#2065D1]
                transition-all
              "
            >
              Create an account
            </Link>

          </div>
        </div>

      </main>
    </div>
  );
};


/* =========================================================
   SPINNER
========================================================= */

const Spinner = () => (
  <span
    className="
      w-[15px]
      h-[15px]
      rounded-full
      border-2
      border-white/40
      border-t-white
      animate-spin
    "
  />
);


/* =========================================================
   ICONS
========================================================= */

const EmailIcon = () => (
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


const LockIcon = () => (
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


const EyeIcon = () => (
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


const EyeOffIcon = () => (
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


const GoogleIcon = () => (
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


export default Login;