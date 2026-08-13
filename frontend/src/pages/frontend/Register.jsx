import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { getDashboardPath } from "../../utils/auth";

import Navbar from "../../components/frontend/Navbar";
import api from "../../api/axios";

const Register = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
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

    /*
     * Clear field error when user starts typing again
     */
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }

    setGeneralError("");
  };


  /* =========================================================
     REGISTER
  ========================================================= */

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setErrors({});
    setGeneralError("");
    setSuccessMessage("");

    try {
      const response = await api.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        password: formData.password,

        /*
         * Laravel backend uses:
         * 'password' => ['confirmed']
         *
         * Reference design has only one password input,
         * so currently we send the same password as confirmation.
         */
        password_confirmation: formData.password,
      });

      const data = response.data;

      /*
       * Save Sanctum API token
       */
      localStorage.setItem("token", data.token);

      /*
       * Save logged-in user
       */
      localStorage.setItem(
        "user",
        JSON.stringify(data.user)
      );

      setSuccessMessage(
        data.message || "Account created successfully."
      );

      /*
       * Reset form
       */
      setFormData({
        name: "",
        email: "",
        password: "",
      });

      /*
       * Redirect after short delay
       */
    setTimeout(() => {
  navigate(getDashboardPath(data.user.role), {
    replace: true,
  });
}, 800);

    } catch (error) {

      /*
       * Laravel validation error = 422
       */
      if (
        error.response &&
        error.response.status === 422
      ) {
        const validationErrors =
          error.response.data.errors || {};

        setErrors(validationErrors);

        return;
      }

      /*
       * Other API errors
       */
      setGeneralError(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );

    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen bg-white font-['Inter']">

      <Navbar />

      {/* ================================
          REGISTER PAGE
      ================================= */}

      <main className="w-full py-[16px] sm:py-[18px] px-5">

        <div className="w-full max-w-[435px] mx-auto">

          <div
            className="
              w-full
              bg-white
              border
              border-[#dddddd]
              rounded-[20px]
              px-[23px]
              sm:px-[25px]
              pt-[24px]
              pb-[22px]
              shadow-[0_5px_17px_rgba(0,0,0,0.08)]
            "
          >

            {/* ============================
                HEADING
            ============================ */}

            <div className="text-center">

              <h1 className="text-[25px] leading-[1.2] font-bold text-[#111111]">
                Create an account
              </h1>

              <p className="mt-[13px] text-[14px] text-[#6e6e6e]">
                Enter your details to get started
              </p>

            </div>


            {/* ============================
                SUCCESS MESSAGE
            ============================ */}

            {successMessage && (
              <div
                className="
                  mt-[18px]
                  px-[14px]
                  py-[10px]
                  rounded-[10px]
                  bg-green-50
                  border
                  border-green-200
                  text-green-700
                  text-[12px]
                  text-center
                "
              >
                {successMessage}
              </div>
            )}


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
                GOOGLE
            ============================ */}

            <button
              type="button"
              className="
                mt-[24px]
                w-full
                h-[37px]
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
                text-[#111111]
                hover:border-[#2065D1]
                hover:text-[#2065D1]
                transition-all
              "
            >
              <GoogleIcon />

              Continue with Google
            </button>


            {/* ============================
                DIVIDER
            ============================ */}

            <div className="flex items-center gap-[9px] my-[18px]">

              <div className="flex-1 h-px bg-[#e1e1e1]" />

              <span className="shrink-0 text-[11px] uppercase text-[#777777]">
                Or continue with
              </span>

              <div className="flex-1 h-px bg-[#e1e1e1]" />

            </div>


            {/* ============================
                FORM
            ============================ */}

            <form onSubmit={handleSubmit}>

              {/* ============================
                  FULL NAME
              ============================ */}

              <div>

                <label
                  htmlFor="name"
                  className="block mb-[6px] text-[13px] font-medium text-[#111111]"
                >
                  Full Name
                </label>

                <div className="relative">

                  <span className="absolute left-[13px] top-[18px] -translate-y-1/2 text-[#7b7b7b]">
                    <UserIcon />
                  </span>

                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    autoComplete="name"
                    className={`
                      ${inputClass}

                      ${
                        errors.name
                          ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                          : ""
                      }
                    `}
                  />

                </div>

                {errors.name && (
                  <p className="mt-[5px] text-[11px] text-red-500">
                    {errors.name[0]}
                  </p>
                )}

              </div>


              {/* ============================
                  EMAIL
              ============================ */}

              <div className="mt-[14px]">

                <label
                  htmlFor="email"
                  className="block mb-[6px] text-[13px] font-medium text-[#111111]"
                >
                  Email
                </label>

                <div className="relative">

                  <span className="absolute left-[13px] top-[18px] -translate-y-1/2 text-[#7b7b7b]">
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
                      ${inputClass}

                      ${
                        errors.email
                          ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                          : ""
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

              <div className="mt-[14px]">

                <label
                  htmlFor="password"
                  className="block mb-[6px] text-[13px] font-medium text-[#111111]"
                >
                  Password
                </label>

                <div className="relative">

                  <span className="absolute left-[13px] top-[18px] -translate-y-1/2 text-[#7b7b7b]">
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
                    autoComplete="new-password"
                    className={`
                      ${inputClass}
                      pr-[42px]

                      ${
                        errors.password
                          ? "border-red-400 focus:border-red-400 focus:ring-red-100"
                          : ""
                      }
                    `}
                  />


                  {/* SHOW PASSWORD */}

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
                      top-[18px]
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
                  SIGNUP BUTTON
              ============================ */}

              <button
                type="submit"
                disabled={loading}
                className="
                  mt-[15px]
                  w-full
                  h-[36px]
                  rounded-full
                  bg-[#2065D1]
                  text-white
                  text-[14px]
                  font-semibold
                  hover:bg-[#1958ba]
                  transition-colors

                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              >

                {loading ? (
                  <span className="flex items-center justify-center gap-2">

                    <Spinner />

                    Creating account...

                  </span>
                ) : (
                  "Sign up"
                )}

              </button>

            </form>


            {/* ============================
                TERMS
            ============================ */}

            <p className="mt-[23px] px-1 text-center text-[12px] leading-[18px] text-[#707070]">

              By creating an account, you agree to our{" "}

              <Link
                to="/terms"
                className="text-[#2065D1] hover:underline"
              >
                Terms of Service
              </Link>

              <br className="hidden sm:block" />

              {" "}and{" "}

              <Link
                to="/privacy"
                className="text-[#2065D1] hover:underline"
              >
                Privacy Policy
              </Link>

            </p>


            {/* ============================
                VENDOR
            ============================ */}

           {/* Vendor */}
<Link
  to="/become-vendor"
  className="mt-[18px] w-full min-h-[38px] px-[12px] rounded-full border border-[#d5e2fa] bg-[#f7faff] flex items-center justify-center gap-[7px] text-[12px] sm:text-[13px] text-[#666666] hover:border-[#2065D1] transition-all"
>
  <span className="text-[#2065D1] shrink-0">
    <StoreIcon />
  </span>

  <span>
    Want to sell on our marketplace?{" "}
    <span className="text-[#2065D1] font-medium">
      Become a Vendor
    </span>
  </span>
</Link>


            {/* ============================
                ALREADY ACCOUNT
            ============================ */}

            <div className="flex items-center gap-[9px] mt-[20px] mb-[17px]">

              <div className="flex-1 h-px bg-[#e1e1e1]" />

              <span className="shrink-0 text-[10px] sm:text-[11px] uppercase text-[#777777]">
                Already have an account?
              </span>

              <div className="flex-1 h-px bg-[#e1e1e1]" />

            </div>


            {/* ============================
                SIGN IN
            ============================ */}

            <Link
              to="/login"
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
              Sign in
            </Link>

          </div>
        </div>

      </main>
    </div>
  );
};


/* =========================================================
   INPUT CLASS
========================================================= */

const inputClass = `
  w-full
  h-[36px]
  rounded-full
  border
  border-[#dedede]
  bg-white
  pl-[40px]
  pr-[15px]
  text-[13px]
  text-[#222222]
  outline-none
  placeholder:text-[#777777]
  focus:border-[#2065D1]
  focus:ring-[3px]
  focus:ring-[#2065D1]/10
  transition-all
`;


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

const UserIcon = () => (
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
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
  </svg>
);


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


const StoreIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 10v10h16V10" />
    <path d="M3 10l2-6h14l2 6" />
    <path d="M8 20v-6h8v6" />

    <path d="M3 10a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2" />
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


export default Register;