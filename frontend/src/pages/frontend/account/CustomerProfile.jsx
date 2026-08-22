import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
    ChevronRight,
    LoaderCircle,
    Save,
    ShieldCheck,
} from "lucide-react";

import api from "../../../api/axios";
import CustomerSidebar from "../../../components/frontend/account/CustomerSidebar";

const CustomerProfile = () => {
    const [form, setForm] = useState({
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        birthdate: "",
        gender: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});

    useEffect(() => {
        getProfile();
    }, []);

    const getProfile = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get("/account/profile");
            const user = response.data?.user;

            if (!user) {
                return;
            }

            setForm({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                phone: user.phone || "",
                birthdate: user.birthdate || "",
                gender: user.gender || "",
            });
        } catch (error) {
            console.error(
                "Profile loading error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to load your profile."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;

        setForm({
            ...form,
            [name]: value,
        });

        setMessage("");
        setError("");

        if (errors[name]) {
            setErrors({
                ...errors,
                [name]: null,
            });
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setMessage("");
            setError("");
            setErrors({});

            const response = await api.put(
                "/account/profile",
                form
            );

            const user = response.data?.user;

            if (user) {
                setForm({
                    first_name: user.first_name || "",
                    last_name: user.last_name || "",
                    email: user.email || "",
                    phone: user.phone || "",
                    birthdate: user.birthdate || "",
                    gender: user.gender || "",
                });

                localStorage.setItem(
                    "user",
                    JSON.stringify(user)
                );

                window.dispatchEvent(
                    new Event("user-updated")
                );


            }

            setMessage(
                response.data?.message ||
                "Profile updated successfully."
            );
        } catch (error) {
            console.error(
                "Profile update error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 422) {
                setErrors(
                    error.response?.data?.errors || {}
                );

                return;
            }

            setError(
                error.response?.data?.message ||
                "Unable to update your profile."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <ProfileLoading />;
    }

    return (
        <main className="min-h-screen bg-[#f8f9fa]">
            <div className="mx-auto flex w-full max-w-[1320px] gap-[30px] px-[20px] py-[16px]">

                <CustomerSidebar />

                <div className="min-w-0 flex-1">

                    <form onSubmit={handleSubmit}>

                        <div className="mb-[20px] flex items-center justify-between rounded-[10px] border border-[#e3e3e3] bg-white px-[24px] py-[16px]">
                            <div>
                                <h1 className="text-[20px] font-semibold text-[#171717]">
                                    Profile
                                </h1>

                                <p className="mt-[3px] text-[13px] text-[#777]">
                                    Manage your personal information.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
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

                                {saving ? "Saving..." : "Save"}
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

                        <section className="rounded-[12px] border border-[#e2e2e2] bg-white px-[24px] py-[22px] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

                            <h2 className="mb-[24px] text-[17px] font-semibold text-[#171717]">
                                Personal
                            </h2>

                            <div className="grid grid-cols-1 gap-x-[24px] gap-y-[20px] md:grid-cols-2">

                                <FormField
                                    label="First name"
                                    name="first_name"
                                    value={form.first_name}
                                    onChange={handleChange}
                                    error={errors.first_name?.[0]}
                                />

                                <FormField
                                    label="Last name"
                                    name="last_name"
                                    value={form.last_name}
                                    onChange={handleChange}
                                    error={errors.last_name?.[0]}
                                />

                                <FormField
                                    label="Email address"
                                    name="email"
                                    type="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    error={errors.email?.[0]}
                                />

                                <FormField
                                    label="Phone number"
                                    name="phone"
                                    type="tel"
                                    value={form.phone}
                                    onChange={handleChange}
                                    error={errors.phone?.[0]}
                                />

                                <FormField
                                    label="Birthday"
                                    name="birthdate"
                                    type="date"
                                    value={form.birthdate}
                                    onChange={handleChange}
                                    error={errors.birthdate?.[0]}
                                />

                                <GenderField
                                    value={form.gender}
                                    onChange={handleChange}
                                    error={errors.gender?.[0]}
                                />

                            </div>

                        </section>

                    </form>

                    <Link
                        to="/account/security"
                        className="mt-[20px] flex items-center justify-between rounded-[12px] border border-[#e2e2e2] bg-white px-[20px] py-[17px] shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition hover:border-[#cfcfcf]"
                    >
                        <div className="flex items-center gap-[13px]">

                            <div className="flex h-[36px] w-[36px] items-center justify-center rounded-[8px] bg-[#eef4ff] text-[#2065D1]">
                                <ShieldCheck size={19} />
                            </div>

                            <div>
                                <h3 className="text-[15px] font-semibold text-[#171717]">
                                    Security
                                </h3>

                                <p className="mt-[2px] text-[13px] text-[#777]">
                                    Manage your account security settings
                                </p>
                            </div>

                        </div>

                        <ChevronRight
                            size={18}
                            className="text-[#777]"
                        />
                    </Link>

                </div>

            </div>
        </main>
    );
};

const FormField = ({
    label,
    name,
    type = "text",
    value,
    onChange,
    error,
}) => {
    return (
        <div>
            <label className="mb-[8px] block text-[14px] font-medium text-[#171717]">
                {label}
            </label>

            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                className={
                    error
                        ? "h-[46px] w-full rounded-[7px] border border-red-400 px-[13px] text-[14px] text-[#333] outline-none transition focus:border-red-500"
                        : "h-[46px] w-full rounded-[7px] border border-[#dedede] px-[13px] text-[14px] text-[#333] outline-none transition focus:border-[#2065D1]"
                }
            />

            {error && (
                <p className="mt-[5px] text-[12px] text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
};

const GenderField = ({
    value,
    onChange,
    error,
}) => {
    return (
        <div>
            <label className="mb-[8px] block text-[14px] font-medium text-[#171717]">
                Gender
            </label>

            <select
                name="gender"
                value={value}
                onChange={onChange}
                className={
                    error
                        ? "h-[46px] w-full rounded-[7px] border border-red-400 bg-white px-[13px] text-[14px] text-[#333] outline-none"
                        : "h-[46px] w-full rounded-[7px] border border-[#dedede] bg-white px-[13px] text-[14px] text-[#333] outline-none focus:border-[#2065D1]"
                }
            >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
            </select>

            {error && (
                <p className="mt-[5px] text-[12px] text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
};

const ProfileLoading = () => {
    return (
        <main className="min-h-screen bg-[#f8f9fa]">
            <div className="flex min-h-[450px] items-center justify-center">
                <div className="text-center">

                    <LoaderCircle
                        size={28}
                        className="mx-auto animate-spin text-[#2065D1]"
                    />

                    <p className="mt-[10px] text-[13px] text-[#777]">
                        Loading profile...
                    </p>

                </div>
            </div>
        </main>
    );
};

export default CustomerProfile;