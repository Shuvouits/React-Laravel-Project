import React, { useEffect, useState } from "react";
import {
    Search,
    UserRoundPlus,
    Footprints,
    X,
    Plus,
    Mail,
    Phone,
    UserRound,
} from "lucide-react";

import api from "../../../api/axios";

const PosCustomerModal = ({ onClose, onSelectCustomer }) => {
    const [activeTab, setActiveTab] = useState("existing");
    const [search, setSearch] = useState("");
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({
        name: "",
        email: "",
        phone: "",
    });

    const [saving, setSaving] = useState(false);

    /*
    |--------------------------------------------------------------------------
    | SEARCH CUSTOMERS
    |--------------------------------------------------------------------------
    */
    useEffect(() => {
        if (activeTab !== "existing") {
            return;
        }

        const query = search.trim();

        if (query.length < 2) {
            setCustomers([]);
            setError("");
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get("/admin/pos/customers", {
                    params: {
                        search: query,
                    },
                });

                setCustomers(response.data?.customers || []);
            } catch (err) {
                console.error("Customer search error:", err);

                setCustomers([]);

                setError(
                    err.response?.data?.message ||
                    "Failed to load customers."
                );
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [search, activeTab]);

    /*
    |--------------------------------------------------------------------------
    | SELECT EXISTING CUSTOMER
    |--------------------------------------------------------------------------
    */
    const handleSelectCustomer = (customer) => {
        onSelectCustomer(customer);
    };

    /*
    |--------------------------------------------------------------------------
    | WALK-IN CUSTOMER
    |--------------------------------------------------------------------------
    */
    const handleWalkInCustomer = () => {
        onSelectCustomer(null);
    };

    /*
    |--------------------------------------------------------------------------
    | CREATE NEW CUSTOMER
    |--------------------------------------------------------------------------
    */
    const handleCreateCustomer = async (e) => {
        e.preventDefault();

        if (!form.name.trim() || !form.email.trim()) {
            return;
        }

        try {
            setSaving(true);
            setError("");

            const response = await api.post("/admin/pos/customers", {
                name: form.name.trim(),
                email: form.email.trim(),
                phone: form.phone.trim() || null,
            });

            const customer =
                response.data?.customer ||
                response.data?.data ||
                null;

            if (customer) {
                onSelectCustomer(customer);
            }
        } catch (err) {
            console.error("Create customer error:", err);

            setError(
                err.response?.data?.message ||
                "Failed to create customer."
            );
        } finally {
            setSaving(false);
        }
    };

    /*
    |--------------------------------------------------------------------------
    | FORM CHANGE
    |--------------------------------------------------------------------------
    */
    const handleFormChange = (e) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 px-4 backdrop-blur-[2px]">
            <div className="w-full
max-w-[460px]
overflow-hidden
rounded-[22px]
bg-white
border
border-[#e7e8eb]
shadow-[0_20px_60px_rgba(0,0,0,0.15)]">

                {/* HEADER */}
                <div className="flex items-center justify-between border-b border-[#e7e8eb] px-5 py-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#eaf2ff]">
                            <UserRoundPlus
                                size={20}
                                className="text-[#2065D1]"
                            />
                        </div>

                        <div>
                            <h2 className="text-[16px] font-semibold text-[#111111]">
                                Add Customer
                            </h2>

                            <p className="mt-1 text-[12px] text-[#858790]">
                                Search existing customers or create a new one
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[#55565d] transition hover:bg-[#f4f5f7]"
                    >
                        <X size={17} />
                    </button>
                </div>

                {/* BODY */}
                <div className="p-5">

                    {/* WALK-IN CUSTOMER */}
                    <button
                        type="button"
                        onClick={handleWalkInCustomer}
                        className="flex w-full items-center gap-3 rounded-[16px] border border-dashed border-[#8db8f5] bg-[#f8fbff] px-4 py-4 text-left transition hover:bg-[#f1f7ff]"
                    >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eaf2ff]">
                            <Footprints
                                size={19}
                                className="text-[#2065D1]"
                            />
                        </div>

                        <div>
                            <p className="text-[14px] font-semibold text-[#17181b]">
                                Walk-in Customer
                            </p>

                            <p className="mt-1 text-[11px] text-[#858790]">
                                No customer details required
                            </p>
                        </div>
                    </button>

                    {/* TABS */}
                    <div className="mt-4 grid grid-cols-2 gap-2">

                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("existing");
                                setError("");
                            }}
                            className={`flex h-9 items-center justify-center gap-2 rounded-full text-[12px] font-medium transition ${activeTab === "existing"
                                    ? "bg-[#2065D1] text-white"
                                    : "text-[#666871] hover:bg-[#f5f6f8]"
                                }`}
                        >
                            <Search size={14} />
                            Existing Customer
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab("create");
                                setError("");
                            }}
                            className={`flex h-9 items-center justify-center gap-2 rounded-full text-[12px] font-medium transition ${activeTab === "create"
                                    ? "bg-[#2065D1] text-white"
                                    : "text-[#666871] hover:bg-[#f5f6f8]"
                                }`}
                        >
                            <Plus size={15} />
                            Create New
                        </button>
                    </div>

                    {/* ================================================== */}
                    {/* EXISTING CUSTOMER */}
                    {/* ================================================== */}
                    {activeTab === "existing" && (
                        <>
                            {/* SEARCH */}
                            <div className="relative mt-4">
                                <Search
                                    size={17}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c8f97]"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                    placeholder="Search by name, phone, or email..."
                                    className="h-12 w-full rounded-full border border-[#e1e3e8] bg-white pl-11 pr-10 text-[13px] outline-none transition placeholder:text-[#999ca5] focus:border-[#2065D1]"
                                />

                                {search && (
                                    <button
                                        type="button"
                                        onClick={() => setSearch("")}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#999ca5] hover:text-[#55565d]"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                            </div>

                            {/* LOADING */}
                            {loading && (
                                <div className="flex min-h-[100px] items-center justify-center">
                                    <p className="text-[12px] text-[#858790]">
                                        Searching customers...
                                    </p>
                                </div>
                            )}

                            {/* ERROR */}
                            {!loading && error && (
                                <div className="mt-3 rounded-[10px] bg-[#fff1f1] px-3 py-2 text-[12px] text-[#dc2626]">
                                    {error}
                                </div>
                            )}

                            {/* EMPTY */}
                            {!loading &&
                                !error &&
                                search.trim().length < 2 && (
                                    <div className="flex min-h-[100px] items-center justify-center">
                                        <p className="text-[12px] text-[#858790]">
                                            Type at least 2 characters to search
                                        </p>
                                    </div>
                                )}

                            {/* NO CUSTOMER */}
                            {!loading &&
                                !error &&
                                search.trim().length >= 2 &&
                                customers.length === 0 && (
                                    <div className="flex min-h-[100px] items-center justify-center">
                                        <p className="text-[12px] text-[#858790]">
                                            No customers found
                                        </p>
                                    </div>
                                )}

                            {/* CUSTOMER RESULTS */}
                            {!loading && customers.length > 0 && (
                                <div className="mt-4 max-h-[240px] space-y-2 overflow-y-auto pr-1">
                                    {customers.map((customer) => (
                                        <div
                                            key={customer.id}
                                            className="flex items-center gap-3 rounded-[15px] border border-[#e1e3e8] bg-white px-4 py-3 transition hover:border-[#b9d1f5] hover:bg-[#f8fbff]"
                                        >
                                            {/* CUSTOMER IMAGE */}
                                            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#eaf2ff]">
                                                {customer.photo_url ? (
                                                    <img
                                                        src={customer.photo_url}
                                                        alt={customer.name || "Customer"}
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center">
                                                        <UserRound
                                                            size={18}
                                                            className="text-[#2065D1]"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* CUSTOMER INFO */}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-[13px] font-semibold text-[#17181b]">
                                                    {customer.name}
                                                </p>

                                                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                                    {customer.phone && (
                                                        <span className="flex items-center gap-1 text-[11px] text-[#858790]">
                                                            <Phone size={11} />
                                                            {customer.phone}
                                                        </span>
                                                    )}

                                                    {customer.email && (
                                                        <span className="flex items-center gap-1 truncate text-[11px] text-[#858790]">
                                                            <Mail size={11} />
                                                            {customer.email}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* SELECT BUTTON */}
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    handleSelectCustomer(
                                                        customer
                                                    )
                                                }
                                                className="shrink-0 rounded-full bg-[#eaf2ff] px-4 py-1.5 text-[11px] font-medium text-[#2065D1] transition hover:bg-[#dceaff]"
                                            >
                                                Select
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ================================================== */}
                    {/* CREATE NEW CUSTOMER */}
                    {/* ================================================== */}
                    {activeTab === "create" && (
                        <form
                            onSubmit={handleCreateCustomer}
                            className="mt-4"
                        >
                            {/* CUSTOMER NAME */}
                            <div>
                                <label className="text-[13px] font-medium text-[#17181b]">
                                    Customer Name{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleFormChange}
                                    placeholder="Enter customer name"
                                    className="mt-2 h-11 w-full rounded-full border border-[#e1e3e8] px-4 text-[13px] outline-none focus:border-[#2065D1]"
                                    required
                                />
                            </div>

                            {/* EMAIL */}
                            <div className="mt-4">
                                <label className="text-[13px] font-medium text-[#17181b]">
                                    Email Address{" "}
                                    <span className="text-red-500">*</span>
                                </label>

                                <div className="relative mt-2">
                                    <Mail
                                        size={16}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c8f97]"
                                    />

                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleFormChange}
                                        placeholder="customer@example.com"
                                        className="h-11 w-full rounded-full border border-[#e1e3e8] pl-10 pr-4 text-[13px] outline-none focus:border-[#2065D1]"
                                        required
                                    />
                                </div>
                            </div>

                            {/* PHONE */}
                            <div className="mt-4">
                                <label className="text-[13px] font-medium text-[#17181b]">
                                    Phone
                                </label>

                                <div className="relative mt-2">
                                    <Phone
                                        size={16}
                                        className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8c8f97]"
                                    />

                                    <input
                                        type="text"
                                        name="phone"
                                        value={form.phone}
                                        onChange={handleFormChange}
                                        placeholder="Enter phone number"
                                        className="h-11 w-full rounded-full border border-[#e1e3e8] pl-10 pr-4 text-[13px] outline-none focus:border-[#2065D1]"
                                    />
                                </div>
                            </div>

                            {/* ERROR */}
                            {error && (
                                <div className="mt-4 rounded-[10px] bg-[#fff1f1] px-3 py-2 text-[12px] text-[#dc2626]">
                                    {error}
                                </div>
                            )}

                            {/* FOOTER */}
                            <div className="mt-5 flex justify-end gap-2 border-t border-[#e7e8eb] pt-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="h-10 rounded-full border border-[#e1e3e8] px-5 text-[12px] font-medium text-[#33343a] hover:bg-[#f5f6f8]"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={
                                        saving ||
                                        !form.name.trim() ||
                                        !form.email.trim()
                                    }
                                    className="flex h-10 items-center gap-2 rounded-full bg-[#2065D1] px-5 text-[12px] font-medium text-white transition hover:bg-[#1959bd] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <UserRoundPlus size={15} />

                                    {saving
                                        ? "Saving..."
                                        : "Save Customer"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PosCustomerModal;