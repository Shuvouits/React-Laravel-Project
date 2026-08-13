import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";

import api from "../../../api/axios";

const VendorPlanSelector = ({
    selectedPlan,
    billingCycle,
    onSelectPlan,
    onBillingCycle,
}) => {
    const [plans, setPlans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchPlans();
    }, []);

    // Fetch vendor plans
    const fetchPlans = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/vendor-registration/plans");

            console.log("Vendor plans response:", response.data);

            setPlans(response.data?.plans || []);
        } catch (error) {
            console.error("Vendor plans error:", error);

            setError(
                error.response?.data?.message ||
                "Unable to load vendor plans."
            );
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[250px] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#2065D1]/20 border-t-[#2065D1]" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-600">
                {error}
            </div>
        );
    }

    if (plans.length === 0) {
        return (
            <div className="rounded-[12px] border border-[#e5e5e5] bg-[#fafafa] px-4 py-8 text-center text-[13px] text-[#777]">
                No vendor plans are currently available.
            </div>
        );
    }

    return (
        <>
            {/* Billing Cycle */}
            <div className="mx-auto mt-5 flex w-fit rounded-full border border-[#ddd] bg-white p-1">
                <button
                    type="button"
                    onClick={() => onBillingCycle("monthly")}
                    className={`min-w-[90px] rounded-full px-5 py-2 text-[13px] font-medium ${
                        billingCycle === "monthly"
                            ? "bg-[#2065D1] text-white"
                            : "text-[#666]"
                    }`}
                >
                    Monthly
                </button>

                <button
                    type="button"
                    onClick={() => onBillingCycle("yearly")}
                    className={`min-w-[90px] rounded-full px-5 py-2 text-[13px] font-medium ${
                        billingCycle === "yearly"
                            ? "bg-[#2065D1] text-white"
                            : "text-[#666]"
                    }`}
                >
                    Yearly
                </button>
            </div>

            {/* Plan Cards */}
            <div className="mt-5 grid gap-5 md:grid-cols-3">
                {plans.map((plan) => {
                    const selected = Number(selectedPlan) === Number(plan.id);

                    const price =
                        billingCycle === "monthly"
                            ? plan.monthly_price
                            : plan.yearly_price;

                    const unavailable = price === null;

                    return (
                        <div
                            key={plan.id}
                            className={`flex min-h-[385px] flex-col rounded-[18px] border p-6 transition-all ${
                                selected
                                    ? "border-[#2065D1] ring-2 ring-[#2065D1]/10"
                                    : "border-[#e1e1e1]"
                            }`}
                        >
                            <h3 className="text-[18px] font-semibold text-[#111]">
                                {plan.name}
                            </h3>

                            <div className="mt-6">
                                {unavailable ? (
                                    <span className="text-[28px] font-bold text-[#aaa]">
                                        N/A
                                    </span>
                                ) : Number(price) === 0 ? (
                                    <span className="text-[34px] font-bold text-[#111]">
                                        Free
                                    </span>
                                ) : (
                                    <>
                                        <span className="text-[34px] font-bold text-[#111]">
                                            ${Number(price).toLocaleString()}
                                        </span>

                                        <span className="ml-1 text-[13px] text-[#777]">
                                            /{billingCycle === "monthly" ? "mo" : "yr"}
                                        </span>
                                    </>
                                )}
                            </div>

                            <p className="mt-1 text-[12px] text-[#777]">
                                {Number(plan.commission_rate)}% commission per sale
                            </p>

                            <div className="mt-5 flex-1 space-y-3">
                                {(plan.features || []).map((feature, index) => (
                                    <div
                                        key={index}
                                        className="flex gap-2 text-[13px] text-[#333]"
                                    >
                                        <CheckCircle2
                                            size={16}
                                            className="mt-[1px] shrink-0 text-[#2065D1]"
                                        />

                                        <span>{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                disabled={unavailable}
                                onClick={() => onSelectPlan(plan.id)}
                                className={`mt-6 h-[38px] rounded-full border text-[13px] font-medium transition-all ${
                                    selected
                                        ? "border-[#2065D1] bg-[#2065D1] text-white"
                                        : "border-[#ddd] bg-white text-[#111] hover:border-[#2065D1]"
                                } disabled:cursor-not-allowed disabled:opacity-40`}
                            >
                                {selected
                                    ? "Selected"
                                    : unavailable
                                      ? "Unavailable"
                                      : "Select"}
                            </button>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default VendorPlanSelector;