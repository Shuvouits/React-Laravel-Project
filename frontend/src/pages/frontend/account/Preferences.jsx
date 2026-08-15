import { useEffect, useState } from "react";
import {
    LoaderCircle,
    Save,
} from "lucide-react";

import api from "../../../api/axios";
import CustomerSidebar from "../../../components/frontend/account/CustomerSidebar";

const CustomerPreferences = () => {
    const [preferences, setPreferences] = useState({
        order_updates: true,
        promotions_deals: true,
        newsletter: false,
        price_drop_alerts: true,
        back_in_stock_alerts: true,
        marketing_emails: true,
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        getPreferences();
    }, []);

    const getPreferences = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/account/preferences"
            );

            if (response.data?.preferences) {
                setPreferences(
                    response.data.preferences
                );
            }
        } catch (error) {
            console.error(
                "Preference loading error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to load your preferences."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = (field) => {
        setPreferences((previous) => ({
            ...previous,
            [field]: !previous[field],
        }));

        setMessage("");
        setError("");
    };

    const savePreferences = async () => {
        try {
            setSaving(true);
            setMessage("");
            setError("");

            const payload = {
                order_updates: preferences.order_updates,
                promotions_deals: preferences.promotions_deals,
                newsletter: preferences.newsletter,
                price_drop_alerts: preferences.price_drop_alerts,
                back_in_stock_alerts: preferences.back_in_stock_alerts,
                marketing_emails: preferences.marketing_emails,
            };

            const response = await api.put(
                "/account/preferences",
                payload
            );

            if (response.data?.preferences) {
                setPreferences(
                    response.data.preferences
                );
            }

            setMessage(
                response.data?.message ||
                "Preferences saved successfully."
            );
        } catch (error) {
            console.error(
                "Preference saving error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to save your preferences."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#f8f9fa]">
            <div className="mx-auto flex w-full max-w-[1320px] gap-[30px] px-[20px] py-[16px]">

                <CustomerSidebar />

                <div className="min-w-0 flex-1">

                    <div className="mb-[20px] flex items-center justify-between rounded-[10px] border border-[#e3e3e3] bg-white px-[24px] py-[16px]">
                        <div>
                            <h1 className="text-[20px] font-semibold text-[#171717]">
                                Preferences
                            </h1>

                            <p className="mt-[3px] text-[13px] text-[#777]">
                                Manage your notifications and marketing preferences.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={savePreferences}
                            disabled={saving || loading}
                            className="flex h-[40px] items-center gap-[7px] rounded-[7px] bg-[#2065D1] px-[17px] text-[14px] font-medium text-white transition hover:bg-[#1858bb] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                />
                            ) : (
                                <Save size={16} />
                            )}

                            {saving
                                ? "Saving..."
                                : "Save"}
                        </button>
                    </div>

                    {message && (
                        <div className="mb-[18px] rounded-[8px] border border-green-200 bg-green-50 px-[15px] py-[11px] text-[13px] text-green-700">
                            {message}
                        </div>
                    )}

                    {error && (
                        <div className="mb-[18px] rounded-[8px] border border-red-200 bg-red-50 px-[15px] py-[11px] text-[13px] text-red-600">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <LoadingState />
                    ) : (
                        <>
                            <section className="rounded-[12px] border border-[#e2e2e2] bg-white px-[24px] py-[21px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                                <h2 className="mb-[12px] text-[17px] font-semibold text-[#171717]">
                                    Email Notifications
                                </h2>

                                <PreferenceItem
                                    title="Order Updates"
                                    description="Get notified about your order status changes"
                                    checked={preferences.order_updates}
                                    onChange={() => handleToggle("order_updates")}
                                />

                                <PreferenceItem
                                    title="Promotions & Deals"
                                    description="Receive exclusive offers and promotional emails"
                                    checked={preferences.promotions_deals}
                                    onChange={() => handleToggle("promotions_deals")}
                                />

                                <PreferenceItem
                                    title="Newsletter"
                                    description="Weekly updates on new products and trends"
                                    checked={preferences.newsletter}
                                    onChange={() => handleToggle("newsletter")}
                                />

                                <PreferenceItem
                                    title="Price Drop Alerts"
                                    description="Get notified when items in your wishlist go on sale"
                                    checked={preferences.price_drop_alerts}
                                    onChange={() => handleToggle("price_drop_alerts")}
                                />

                                <PreferenceItem
                                    title="Back in Stock Alerts"
                                    description="Get notified when out-of-stock items become available"
                                    checked={preferences.back_in_stock_alerts}
                                    onChange={() => handleToggle("back_in_stock_alerts")}
                                    last
                                />
                            </section>

                            <section className="mt-[20px] rounded-[12px] border border-[#e2e2e2] bg-white px-[24px] py-[21px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                                <h2 className="mb-[12px] text-[17px] font-semibold text-[#171717]">
                                    Marketing Preferences
                                </h2>

                                <PreferenceItem
                                    title="Marketing Emails"
                                    description="Receive marketing communications and special offers"
                                    checked={preferences.marketing_emails}
                                    onChange={() => handleToggle("marketing_emails")}
                                    last
                                />
                            </section>
                        </>
                    )}

                </div>

            </div>
        </main>
    );
};

const PreferenceItem = ({
    title,
    description,
    checked,
    onChange,
    last = false,
}) => {
    return (
        <div
            className={
                last
                    ? "flex items-center justify-between py-[15px]"
                    : "flex items-center justify-between border-b border-[#e5e5e5] py-[15px]"
            }
        >
            <div className="pr-[20px]">
                <h3 className="text-[14px] font-medium text-[#171717]">
                    {title}
                </h3>

                <p className="mt-[2px] text-[13px] text-[#777]">
                    {description}
                </p>
            </div>

            <ToggleSwitch
                checked={checked}
                onChange={onChange}
            />
        </div>
    );
};

const ToggleSwitch = ({
    checked,
    onChange,
}) => {
    return (
        <button
            type="button"
            onClick={onChange}
            className={
                checked
                    ? "relative h-[20px] w-[36px] shrink-0 rounded-full bg-[#2065D1] transition"
                    : "relative h-[20px] w-[36px] shrink-0 rounded-full bg-[#dddddd] transition"
            }
        >
            <span
                className={
                    checked
                        ? "absolute left-[18px] top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition"
                        : "absolute left-[2px] top-[2px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition"
                }
            />
        </button>
    );
};

const LoadingState = () => {
    return (
        <div className="flex min-h-[350px] items-center justify-center rounded-[12px] border border-[#e2e2e2] bg-white">
            <div className="text-center">
                <LoaderCircle
                    size={28}
                    className="mx-auto animate-spin text-[#2065D1]"
                />

                <p className="mt-[10px] text-[13px] text-[#777]">
                    Loading preferences...
                </p>
            </div>
        </div>
    );
};

export default CustomerPreferences;