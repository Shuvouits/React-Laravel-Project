import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    Clock3,
    Eye,
    EyeOff,
    Globe2,
    LockKeyhole,
    Phone,
    Store,
    User,
    Mail,
} from "lucide-react";

import Navbar from "../../components/frontend/Navbar";
import api from "../../api/axios";
import VendorPlanSelector from "../../components/frontend/vendor/VendorPlanSelector";

const BecomeVendor = () => {
    const storedUser = getStoredUser();

    const [step, setStep] = useState(1);
    const [application, setApplication] = useState(null);
    const [plans, setPlans] = useState([]);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [billingCycle, setBillingCycle] = useState("yearly");
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [underReview, setUnderReview] = useState(false);

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] = useState("");

    const [details, setDetails] = useState({
        name: storedUser?.name || "",
        email: storedUser?.email || "",
        password: "",
        password_confirmation: "",
    });

    const [storeDetails, setStoreDetails] = useState({
        store_name: "",
        store_description: "",
        country: "",
        state: "",
        phone_country_code: "+880",
        phone: "",
    });

    useEffect(() => {
        initializePage();
    }, []);

    const initializePage = async () => {
        try {
            setPageLoading(true);

            const plansResponse = await api.get("/vendor-registration/plans");
            setPlans(plansResponse.data?.plans || []);

            const token = localStorage.getItem("token");
            if (!token) return;

            try {
                const response = await api.get("/vendor-registration/application");
                const data = response.data;
                const currentApplication = data?.application;

                if (!currentApplication) return;

                setApplication(currentApplication);

                setDetails((prev) => ({
                    ...prev,
                    name: data?.user?.name || prev.name,
                    email: data?.user?.email || prev.email,
                }));

                setStoreDetails({
                    store_name: currentApplication.store_name || "",
                    store_description: currentApplication.store_description || "",
                    country: currentApplication.country || "",
                    state: currentApplication.state || "",
                    phone_country_code: currentApplication.phone_country_code || "+880",
                    phone: currentApplication.phone || "",
                });

                if (currentApplication.vendor_plan_id) {
                    setSelectedPlan(Number(currentApplication.vendor_plan_id));
                }

                if (currentApplication.billing_cycle) {
                    setBillingCycle(currentApplication.billing_cycle);
                }

                if (data.current_step === "under_review" || currentApplication.status === "pending") {
                    setUnderReview(true);
                    return;
                }

                if (data.current_step === "approved") {
                    setUnderReview(true);
                    return;
                }

                if (typeof data.current_step === "number") {
                    setStep(data.current_step);
                }
            } catch (error) {
                if (error.response?.status !== 404) {
                    console.error("Vendor application load error:", error);
                }
            }
        } catch (error) {
            console.error("Vendor registration initialization error:", error);
        } finally {
            setPageLoading(false);
        }
    };

    const clearError = (field) => {
        if (!errors[field]) return;

        setErrors((prev) => ({
            ...prev,
            [field]: null,
        }));
    };

    const handleDetailsChange = (e) => {
        const { name, value } = e.target;

        setDetails((prev) => ({
            ...prev,
            [name]: value,
        }));

        clearError(name);
        setGeneralError("");
    };

    const handleStoreChange = (e) => {
        const { name, value } = e.target;

        setStoreDetails((prev) => ({
            ...prev,
            [name]: value,
        }));

        clearError(name);
        setGeneralError("");
    };

    const handleStepOne = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setErrors({});
            setGeneralError("");

            const token = localStorage.getItem("token");

            const payload = token
                ? {}
                : {
                    name: details.name,
                    email: details.email,
                    password: details.password,
                    password_confirmation: details.password_confirmation,
                };

            const response = await api.post("/vendor-registration/start", payload);
            const data = response.data;

            if (data.token) localStorage.setItem("token", data.token);
            if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

            setApplication(data.application || null);
            setStep(2);
        } catch (error) {
            handleApiError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStepTwo = async (e) => {
        e.preventDefault();

        try {
            setLoading(true);
            setErrors({});
            setGeneralError("");

            const response = await api.put("/vendor-registration/store", storeDetails);

            setApplication(response.data?.application || application);
            setStep(3);
        } catch (error) {
            handleApiError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleStepThree = async () => {
        if (!selectedPlan) {
            setGeneralError("Please select a plan to continue.");
            return;
        }

        try {
            setLoading(true);
            setGeneralError("");

            const response = await api.put("/vendor-registration/plan", {
                vendor_plan_id: selectedPlan,
                billing_cycle: billingCycle,
            });

            setApplication(response.data?.application || application);
            setStep(4);
        } catch (error) {
            handleApiError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitApplication = async () => {
        if (!termsAccepted) {
            setGeneralError("Please accept the vendor and subscription terms.");
            return;
        }

        try {
            setLoading(true);
            setGeneralError("");

            const response = await api.post("/vendor-registration/submit", {
                terms_accepted: true,
            });

            setApplication(response.data?.application || application);
            setUnderReview(true);
        } catch (error) {
            handleApiError(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApiError = (error) => {
        if (error.response?.status === 422) {
            setErrors(error.response?.data?.errors || {});
            setGeneralError(error.response?.data?.message || "");
            return;
        }

        setGeneralError(
            error.response?.data?.message ||
            "Something went wrong. Please try again."
        );
    };

    const selectedPlanData =
        plans.find((plan) => Number(plan.id) === Number(selectedPlan)) ||
        application?.plan ||
        null;

    if (pageLoading) {
        return (
            <div className="min-h-screen bg-white font-['Inter']">
                <Navbar />

                <div className="flex min-h-[500px] items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2065D1]/20 border-t-[#2065D1]" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white font-['Inter']">
            <Navbar />

            <main className="bg-[#fafafa] px-4 pb-16 pt-10">
                <div className="mx-auto max-w-[900px]">
                    <div className="mb-8 text-[13px] text-[#777]">
                        <Link to="/" className="hover:text-[#2065D1]">
                            Home
                        </Link>

                        <span className="mx-3">›</span>

                        <span className="text-[#111]">Become a Vendor</span>
                    </div>

                    <div className="mb-9 text-center">
                        <h1 className="text-[32px] font-bold tracking-[-0.7px] text-[#111]">
                            Start Selling Today
                        </h1>

                        <p className="mt-3 text-[15px] text-[#777]">
                            Join thousands of successful sellers
                        </p>
                    </div>

                    {underReview ? (
                        <UnderReview />
                    ) : (
                        <div className="rounded-[22px] border border-[#e5e5e5] bg-white px-6 py-7 shadow-[0_12px_30px_rgba(0,0,0,0.06)] md:px-7">
                            <VendorStepper step={step} />

                            {generalError && (
                                <div className="mb-5 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
                                    {generalError}
                                </div>
                            )}

                            {step === 1 && (
                                <StepOne
                                    details={details}
                                    errors={errors}
                                    loading={loading}
                                    storedUser={storedUser}
                                    showPassword={showPassword}
                                    showConfirmation={showConfirmation}
                                    onChange={handleDetailsChange}
                                    onSubmit={handleStepOne}
                                    setShowPassword={setShowPassword}
                                    setShowConfirmation={setShowConfirmation}
                                />
                            )}

                            {step === 2 && (
                                <StepTwo
                                    value={storeDetails}
                                    errors={errors}
                                    loading={loading}
                                    onChange={handleStoreChange}
                                    onBack={() => setStep(1)}
                                    onSubmit={handleStepTwo}
                                />
                            )}

                            {step === 3 && (

                                <StepThree
                                    plans={plans}
                                    selectedPlan={selectedPlan}
                                    billingCycle={billingCycle}
                                    loading={loading}
                                    onSelectPlan={setSelectedPlan}
                                    onBillingCycle={setBillingCycle}
                                    onBack={() => setStep(2)}
                                    onContinue={handleStepThree}
                                />
                            )}

                            {step === 4 && (
                                <StepFour
                                    details={details}
                                    storeDetails={storeDetails}
                                    selectedPlan={selectedPlanData}
                                    billingCycle={billingCycle}
                                    termsAccepted={termsAccepted}
                                    loading={loading}
                                    onTermsChange={setTermsAccepted}
                                    onBack={() => setStep(3)}
                                    onSubmit={handleSubmitApplication}
                                />
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

const VendorStepper = ({ step }) => {
    const steps = [
        { number: 1, label: "Your details" },
        { number: 2, label: "Store & documents" },
        { number: 3, label: "Subscription" },
        { number: 4, label: "Review" },
    ];

    return (
        <div className="mb-7 grid grid-cols-4">
            {steps.map((item, index) => {
                const completed = step > item.number;
                const active = step === item.number;

                return (
                    <div key={item.number} className="relative flex items-center">
                        <div className="relative z-10 flex items-center gap-2 bg-white pr-3">
                            <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[12px] font-medium ${completed
                                        ? "border-[#2065D1] bg-[#2065D1] text-white"
                                        : active
                                            ? "border-[#2065D1] text-[#2065D1]"
                                            : "border-[#ddd] text-[#777]"
                                    }`}
                            >
                                {completed ? <Check size={14} /> : item.number}
                            </div>

                            <span
                                className={`hidden whitespace-nowrap text-[11px] sm:block ${active ? "font-semibold text-[#111]" : "text-[#777]"
                                    }`}
                            >
                                {item.label}
                            </span>
                        </div>

                        {index < steps.length - 1 && (
                            <div
                                className={`absolute left-7 right-0 top-1/2 h-px ${completed ? "bg-[#2065D1]" : "bg-[#ddd]"
                                    }`}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const StepOne = ({
    details,
    errors,
    loading,
    storedUser,
    showPassword,
    showConfirmation,
    onChange,
    onSubmit,
    setShowPassword,
    setShowConfirmation,
}) => {
    return (
        <form onSubmit={onSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
                <Field
                    label="Full Name"
                    required
                    error={errors.name?.[0]}
                    icon={<User size={17} />}
                >
                    <input
                        name="name"
                        value={details.name}
                        onChange={onChange}
                        disabled={Boolean(storedUser)}
                        placeholder="Enter your full name"
                        className={inputClass}
                    />
                </Field>

                <Field
                    label="Email"
                    required
                    error={errors.email?.[0]}
                    icon={<Mail size={17} />}
                >
                    <input
                        type="email"
                        name="email"
                        value={details.email}
                        onChange={onChange}
                        disabled={Boolean(storedUser)}
                        placeholder="Enter your email"
                        className={inputClass}
                    />
                </Field>

                {!storedUser && (
                    <>
                        <Field
                            label="Password"
                            required
                            error={errors.password?.[0]}
                            icon={<LockKeyhole size={17} />}
                        >
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={details.password}
                                onChange={onChange}
                                placeholder="Enter password"
                                className={`${inputClass} pr-10`}
                            />

                            <PasswordButton
                                show={showPassword}
                                onClick={() => setShowPassword((prev) => !prev)}
                            />
                        </Field>

                        <Field
                            label="Confirm Password"
                            required
                            icon={<LockKeyhole size={17} />}
                        >
                            <input
                                type={showConfirmation ? "text" : "password"}
                                name="password_confirmation"
                                value={details.password_confirmation}
                                onChange={onChange}
                                placeholder="Confirm password"
                                className={`${inputClass} pr-10`}
                            />

                            <PasswordButton
                                show={showConfirmation}
                                onClick={() => setShowConfirmation((prev) => !prev)}
                            />
                        </Field>
                    </>
                )}
            </div>

            <PrimaryButton loading={loading}>
                Continue
                <ArrowRight size={16} />
            </PrimaryButton>

            <p className="mt-4 text-center text-[13px] text-[#777]">
                Already have an account?{" "}
                <Link to="/login" className="font-medium text-[#2065D1]">
                    Sign in
                </Link>
            </p>
        </form>
    );
};

const StepTwo = ({ value, errors, loading, onChange, onBack, onSubmit }) => {
    return (
        <form onSubmit={onSubmit}>
            <Field
                label="Store Name"
                required
                error={errors.store_name?.[0]}
                icon={<Store size={17} />}
            >
                <input
                    name="store_name"
                    value={value.store_name}
                    onChange={onChange}
                    placeholder="Enter your store name"
                    className={inputClass}
                />
            </Field>

            <div className="mt-4">
                <label className="mb-2 block text-[13px] font-medium text-[#111]">
                    Store Description
                </label>

                <textarea
                    name="store_description"
                    value={value.store_description}
                    onChange={onChange}
                    placeholder="Tell customers about your store"
                    rows="4"
                    className="w-full resize-none rounded-[12px] border border-[#dedede] px-4 py-3 text-[13px] outline-none focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10"
                />
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field
                    label="Country"
                    required
                    error={errors.country?.[0]}
                    icon={<Globe2 size={17} />}
                >
                    <input
                        name="country"
                        value={value.country}
                        onChange={onChange}
                        placeholder="Enter country"
                        className={inputClass}
                    />
                </Field>

                <Field
                    label="State"
                    required
                    error={errors.state?.[0]}
                >
                    <input
                        name="state"
                        value={value.state}
                        onChange={onChange}
                        placeholder="Enter state"
                        className={`${inputClass} pl-4`}
                    />
                </Field>
            </div>

            <div className="mt-4">
                <label className="mb-2 block text-[13px] font-medium text-[#111]">
                    Phone
                </label>

                <div className="flex gap-2">
                    <input
                        name="phone_country_code"
                        value={value.phone_country_code}
                        onChange={onChange}
                        className="h-[42px] w-[95px] rounded-[11px] border border-[#dedede] px-3 text-[13px] outline-none focus:border-[#2065D1]"
                    />

                    <div className="relative flex-1">
                        <Phone
                            size={17}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888]"
                        />

                        <input
                            name="phone"
                            value={value.phone}
                            onChange={onChange}
                            placeholder="Enter phone number"
                            className={inputClass}
                        />
                    </div>
                </div>
            </div>

            <PrimaryButton loading={loading}>
                Continue
                <ArrowRight size={16} />
            </PrimaryButton>

            <BackButton onClick={onBack} />
        </form>
    );
};

const StepThree = ({
    selectedPlan,
    billingCycle,
    loading,
    onSelectPlan,
    onBillingCycle,
    onBack,
    onContinue,
}) => {
    return (
        <div>
            <h2 className="text-[18px] font-semibold text-[#111]">
                Choose your plan
            </h2>

            <p className="mt-1 text-[13px] text-[#777]">
                Pick the subscription you want the admin to review with your application.
            </p>

            <VendorPlanSelector
                selectedPlan={selectedPlan}
                billingCycle={billingCycle}
                onSelectPlan={onSelectPlan}
                onBillingCycle={onBillingCycle}
            />

            <div className="mt-5 flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex h-[42px] items-center gap-2 rounded-full border border-[#ddd] px-5 text-[13px] font-medium"
                >
                    <ArrowLeft size={15} />
                    Back
                </button>

                <button
                    type="button"
                    disabled={loading || !selectedPlan}
                    onClick={onContinue}
                    className="flex h-[42px] flex-1 items-center justify-center gap-2 rounded-full bg-[#2065D1] text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Saving..." : "Continue"}
                    <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

const StepFour = ({
    details,
    storeDetails,
    selectedPlan,
    billingCycle,
    termsAccepted,
    loading,
    onTermsChange,
    onBack,
    onSubmit,
}) => {
    const planPrice =
        billingCycle === "monthly"
            ? selectedPlan?.monthly_price
            : selectedPlan?.yearly_price;

    return (
        <div>
            <p className="mb-5 text-[13px] text-[#666]">
                Please review your details before submitting. You can go back and edit anything.
            </p>

            <ReviewBox title="Your details">
                <ReviewRow label="Full Name" value={details.name} />
                <ReviewRow label="Email" value={details.email} />
                <ReviewRow label="Password" value="••••••••" />
                <ReviewRow label="Confirm Password" value="••••••••" />
            </ReviewBox>

            <ReviewBox title="Store & documents">
                <ReviewRow label="Store Name" value={storeDetails.store_name} />
                <ReviewRow
                    label="Store Description"
                    value={storeDetails.store_description || "-"}
                />
                <ReviewRow label="Country" value={storeDetails.country} />
                <ReviewRow label="State" value={storeDetails.state} />
                <ReviewRow
                    label="Phone"
                    value={`${storeDetails.phone_country_code || ""}${storeDetails.phone || ""}`}
                />
            </ReviewBox>

            <ReviewBox title="Plan">
                <ReviewRow label="Plan" value={selectedPlan?.name || "-"} />
                <ReviewRow
                    label="Price"
                    value={
                        Number(planPrice) === 0
                            ? "Free"
                            : planPrice
                                ? `$${Number(planPrice).toLocaleString()} / ${billingCycle}`
                                : "-"
                    }
                />
                <ReviewRow
                    label="Commission"
                    value={`${selectedPlan?.commission_rate || 0}% per sale`}
                />
            </ReviewBox>

            <label className="mt-5 flex cursor-pointer items-start gap-3 border-t border-[#eee] pt-5 text-[12px] leading-[20px] text-[#666]">
                <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => onTermsChange(e.target.checked)}
                    className="mt-1 h-4 w-4"
                />

                <span>
                    I agree to the{" "}
                    <Link to="/vendor-terms" className="text-[#2065D1]">
                        vendor and subscription terms
                    </Link>
                    . If a paid plan is approved, payment is due according to the selected subscription terms.
                </span>
            </label>

            <div className="mt-5 flex gap-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex h-[42px] items-center gap-2 rounded-full border border-[#ddd] px-5 text-[13px] font-medium"
                >
                    <ArrowLeft size={15} />
                    Back
                </button>

                <button
                    type="button"
                    disabled={!termsAccepted || loading}
                    onClick={onSubmit}
                    className="h-[42px] flex-1 rounded-full bg-[#2065D1] text-[14px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {loading ? "Submitting..." : "Submit"}
                </button>
            </div>
        </div>
    );
};

const UnderReview = () => (
    <div className="rounded-[22px] border border-[#e4e4e4] bg-white p-6 shadow-[0_12px_30px_rgba(0,0,0,0.05)]">
        <div className="flex min-h-[225px] flex-col items-center justify-center rounded-[18px] border border-[#e4e4e4] text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff3d5] text-[#f59e0b]">
                <Clock3 size={23} />
            </div>

            <h2 className="mt-5 text-[18px] font-semibold text-[#111]">
                Application Under Review
            </h2>

            <p className="mt-2 text-[13px] text-[#777]">
                Your vendor application is being reviewed. We'll notify you once it's approved.
            </p>
        </div>
    </div>
);

const Field = ({ label, required, error, icon, children }) => (
    <div>
        <label className="mb-2 block text-[13px] font-medium text-[#111]">
            {label}
            {required && <span className="ml-1 text-red-500">*</span>}
        </label>

        <div className="relative">
            {icon && (
                <span className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#888]">
                    {icon}
                </span>
            )}

            {children}
        </div>

        {error && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
);

const PasswordButton = ({ show, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888]"
    >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </button>
);

const PrimaryButton = ({ loading, children }) => (
    <button
        type="submit"
        disabled={loading}
        className="mt-5 flex h-[42px] w-full items-center justify-center gap-2 rounded-full bg-[#2065D1] text-[14px] font-semibold text-white transition-colors hover:bg-[#1958ba] disabled:cursor-not-allowed disabled:opacity-60"
    >
        {loading ? "Please wait..." : children}
    </button>
);

const BackButton = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="mx-auto mt-4 flex items-center gap-2 text-[13px] text-[#666] hover:text-[#2065D1]"
    >
        <ArrowLeft size={15} />
        Back
    </button>
);

const ReviewBox = ({ title, children }) => (
    <div className="mb-4 rounded-[16px] border border-[#e5e5e5] p-5">
        <h3 className="mb-3 text-[13px] font-semibold text-[#111]">{title}</h3>
        <div className="space-y-2">{children}</div>
    </div>
);

const ReviewRow = ({ label, value }) => (
    <div className="grid grid-cols-[140px_1fr] gap-3 text-[13px]">
        <span className="text-[#777]">{label}</span>
        <span className="break-words text-[#111]">{value || "-"}</span>
    </div>
);

const inputClass = `
    h-[42px]
    w-full
    rounded-[11px]
    border
    border-[#dedede]
    bg-white
    pl-11
    pr-4
    text-[13px]
    text-[#222]
    outline-none
    placeholder:text-[#888]
    focus:border-[#2065D1]
    focus:ring-2
    focus:ring-[#2065D1]/10
    disabled:bg-[#f7f7f7]
    disabled:text-[#777]
`;

const getStoredUser = () => {
    try {
        const user = localStorage.getItem("user");
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

export default BecomeVendor;