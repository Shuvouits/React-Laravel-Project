import { createPortal } from "react-dom";
import { useCallback, useEffect, useRef, useState } from "react";

import {
    ChevronLeft,
    ChevronRight,
    Download,
    FileText,
    LoaderCircle,
    Plus,
    ReceiptText,
    Search,
    Trash2,
    Upload,
    X,
} from "lucide-react";

import api from "../../../api/axios";

function getToday() {
    return new Date().toISOString().split("T")[0];
}

const initialForm = {
    expense_date: getToday(),
    amount: "",
    currency: "USD",
    description: "",
    category: "other",
    paid_from: "bank",
    paid_to: "",
    book: "own_store",
    repeats: false,
    repeat_frequency: "monthly",
    next_repeat_date: "",
    note: "",
    receipt: null,
};

const categories = [
    { value: "rent", label: "Rent" },
    { value: "salary", label: "Salary" },
    { value: "advertising", label: "Advertising" },
    { value: "shipping", label: "Shipping" },
    { value: "software", label: "Software" },
    { value: "utilities", label: "Utilities" },
    { value: "tax", label: "Tax" },
    { value: "maintenance", label: "Maintenance" },
    { value: "inventory", label: "Inventory" },
    { value: "other", label: "Other" },
];

const paidFromOptions = [
    { value: "bank", label: "Bank" },
    { value: "cash", label: "Cash" },
    { value: "gateway", label: "Gateway" },
    { value: "card", label: "Card" },
    { value: "other", label: "Other" },
];

const bookOptions = [
    { value: "own_store", label: "Own store" },
    { value: "marketplace", label: "Marketplace" },
];

const repeatOptions = [
    { value: "weekly", label: "Weekly" },
    { value: "monthly", label: "Monthly" },
    { value: "quarterly", label: "Quarterly" },
    { value: "yearly", label: "Yearly" },
];

const formatMoney = (amount, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency || "USD",
        minimumFractionDigits: 2,
    }).format(Number(amount || 0));
};

const formatDate = (date) => {
    if (!date) {
        return "—";
    }

    return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(new Date(`${date}T00:00:00`));
};

const labelFromValue = (options, value) => {
    return (
        options.find(
            (option) => option.value === value
        )?.label || value
    );
};

const FieldError = ({ message }) => {
    if (!message) {
        return null;
    }

    return (
        <p className="mt-1 text-[12px] text-[#dc2626]">
            {message}
        </p>
    );
};

const ExpenseModal = ({
    open,
    onClose,
    onSaved,
}) => {
    const fileInputRef = useRef(null);

    const [form, setForm] =
        useState(initialForm);

    const [errors, setErrors] =
        useState({});

    const [saving, setSaving] =
        useState(false);

    useEffect(() => {
        if (!open) {
            return;
        }

        setForm({
            ...initialForm,
            expense_date: getToday(),
        });

        setErrors({});
    }, [open]);

    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener(
            "keydown",
            handleEscape
        );

        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );

            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) {
        return null;
    }

    const updateField = (event) => {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        setErrors((current) => ({
            ...current,
            [name]: "",
        }));
    };

    const handleReceipt = (event) => {
        const file = event.target.files?.[0] || null;

        setForm((current) => ({
            ...current,
            receipt: file,
        }));

        setErrors((current) => ({
            ...current,
            receipt: "",
        }));
    };

    const removeReceipt = () => {
        setForm((current) => ({
            ...current,
            receipt: null,
        }));

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        try {
            setSaving(true);
            setErrors({});

            const formData = new FormData();

            formData.append(
                "expense_date",
                form.expense_date
            );

            formData.append(
                "amount",
                form.amount
            );

            formData.append(
                "currency",
                form.currency
            );

            formData.append(
                "description",
                form.description
            );

            formData.append(
                "category",
                form.category
            );

            formData.append(
                "paid_from",
                form.paid_from
            );

            formData.append(
                "paid_to",
                form.paid_to
            );

            formData.append(
                "book",
                form.book
            );

            formData.append(
                "repeats",
                form.repeats ? "1" : "0"
            );

            formData.append(
                "note",
                form.note
            );

            if (form.repeats) {
                formData.append(
                    "repeat_frequency",
                    form.repeat_frequency
                );

                if (form.next_repeat_date) {
                    formData.append(
                        "next_repeat_date",
                        form.next_repeat_date
                    );
                }
            }

            if (form.receipt) {
                formData.append(
                    "receipt",
                    form.receipt
                );
            }

            await api.post(
                "/admin/finance/expenses",
                formData,
                {
                    headers: {
                        "Content-Type":
                            "multipart/form-data",
                    },
                }
            );

            onSaved();
            onClose();
        } catch (error) {
            const validationErrors =
                error.response?.data?.errors || {};

            const formattedErrors = {};

            Object.entries(validationErrors).forEach(
                ([key, value]) => {
                    formattedErrors[key] =
                        Array.isArray(value)
                            ? value[0]
                            : value;
                }
            );

            setErrors(formattedErrors);
        } finally {
            setSaving(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 px-4 py-6">
            <div
                className="absolute inset-0"
                onClick={onClose}
            />

            <form
                onSubmit={handleSubmit}
                className="relative z-10 max-h-[92vh] w-full max-w-[590px] overflow-y-auto rounded-[18px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.24)]"
            >
                <div className="flex items-start justify-between px-7 pb-3 pt-6">
                    <div>
                        <h2 className="text-[21px] font-semibold text-[#18181b]">
                            Record expense
                        </h2>

                        <p className="mt-1 max-w-[455px] text-[14px] leading-5 text-[#73737b]">
                            Costs the store pays out, including rent, salaries, advertising, and other operating expenses.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-1 text-[#626269] transition hover:bg-[#f1f2f4]"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-4 px-7 pb-7">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label>
                            <span className="mb-1.5 block text-[14px] font-medium text-[#26262a]">
                                Date
                            </span>

                            <input
                                type="date"
                                name="expense_date"
                                value={form.expense_date}
                                onChange={updateField}
                                className="h-11 w-full rounded-[13px] border border-[#dedfe4] px-3.5 text-[14px] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
                            />

                            <FieldError
                                message={errors.expense_date}
                            />
                        </label>

                        <label>
                            <span className="mb-1.5 block text-[14px] font-medium text-[#26262a]">
                                Amount
                            </span>

                            <div className="flex h-11 overflow-hidden rounded-[13px] border border-[#dedfe4] focus-within:border-[#2563eb] focus-within:ring-2 focus-within:ring-[#2563eb]/15">
                                <span className="flex items-center bg-[#f7f7f8] px-3 text-[13px] text-[#6c6d73]">
                                    USD
                                </span>

                                <input
                                    type="number"
                                    name="amount"
                                    value={form.amount}
                                    onChange={updateField}
                                    min="0.01"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="min-w-0 flex-1 px-3 text-[14px] outline-none"
                                />
                            </div>

                            <FieldError
                                message={errors.amount}
                            />
                        </label>
                    </div>

                    <label>
                        <span className="mb-1.5 block text-[14px] font-medium text-[#26262a]">
                            Description
                        </span>

                        <input
                            type="text"
                            name="description"
                            value={form.description}
                            onChange={updateField}
                            placeholder="August office rent"
                            className="h-11 w-full rounded-[13px] border border-[#dedfe4] px-3.5 text-[14px] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
                        />

                        <FieldError
                            message={errors.description}
                        />
                    </label>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label>
                            <span className="mb-1.5 block text-[14px] font-medium text-[#26262a]">
                                Category
                            </span>

                            <select
                                name="category"
                                value={form.category}
                                onChange={updateField}
                                className="h-11 w-full rounded-[13px] border border-[#dedfe4] bg-white px-3.5 text-[14px] outline-none focus:border-[#2563eb]"
                            >
                                {categories.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <FieldError
                                message={errors.category}
                            />
                        </label>

                        <label>
                            <span className="mb-1.5 block text-[14px] font-medium text-[#26262a]">
                                Paid from
                            </span>

                            <select
                                name="paid_from"
                                value={form.paid_from}
                                onChange={updateField}
                                className="h-11 w-full rounded-[13px] border border-[#dedfe4] bg-white px-3.5 text-[14px] outline-none focus:border-[#2563eb]"
                            >
                                {paidFromOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <label>
                            <span className="mb-1.5 block text-[14px] font-medium text-[#26262a]">
                                Paid to
                            </span>

                            <input
                                type="text"
                                name="paid_to"
                                value={form.paid_to}
                                onChange={updateField}
                                placeholder="Landlord or company"
                                className="h-11 w-full rounded-[13px] border border-[#dedfe4] px-3.5 text-[14px] outline-none focus:border-[#2563eb]"
                            />
                        </label>

                        <label>
                            <span className="mb-1.5 block text-[14px] font-medium text-[#26262a]">
                                Book
                            </span>

                            <select
                                name="book"
                                value={form.book}
                                onChange={updateField}
                                className="h-11 w-full rounded-[13px] border border-[#dedfe4] bg-white px-3.5 text-[14px] outline-none focus:border-[#2563eb]"
                            >
                                {bookOptions.map((option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    <div>
                        <span className="mb-1.5 block text-[14px] font-medium text-[#26262a]">
                            Receipt
                        </span>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp,.pdf"
                            onChange={handleReceipt}
                            className="hidden"
                        />

                        {!form.receipt ? (
                            <button
                                type="button"
                                onClick={() => {
                                    fileInputRef.current?.click();
                                }}
                                className="flex h-12 w-full items-center justify-center gap-2 rounded-[13px] border border-dashed border-[#cfd1d7] bg-[#fafafa] text-[14px] text-[#62636a] transition hover:border-[#2563eb] hover:bg-[#f5f8ff]"
                            >
                                <Upload size={17} />
                                Upload JPG, PNG, WebP or PDF
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 rounded-[13px] border border-[#dedfe4] p-3">
                                <FileText
                                    size={20}
                                    className="shrink-0 text-[#2563eb]"
                                />

                                <span className="min-w-0 flex-1 truncate text-[13px] text-[#36363b]">
                                    {form.receipt.name}
                                </span>

                                <button
                                    type="button"
                                    onClick={removeReceipt}
                                    className="rounded-lg p-1 text-[#77777d] hover:bg-[#f1f2f4]"
                                >
                                    <X size={17} />
                                </button>
                            </div>
                        )}

                        <FieldError
                            message={errors.receipt}
                        />
                    </div>

                    <div className="rounded-[14px] border border-[#e1e2e6] p-4">
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <p className="text-[14px] font-medium text-[#242428]">
                                    Repeats
                                </p>

                                <p className="mt-0.5 text-[12px] text-[#76767d]">
                                    Record this expense again automatically when it falls due.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setForm((current) => ({
                                        ...current,
                                        repeats:
                                            !current.repeats,
                                    }));
                                }}
                                className={[
                                    "relative h-6 w-11 rounded-full transition",
                                    form.repeats
                                        ? "bg-[#2563eb]"
                                        : "bg-[#e4e5e8]",
                                ].join(" ")}
                            >
                                <span
                                    className={[
                                        "absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow transition",
                                        form.repeats
                                            ? "left-[23px]"
                                            : "left-[3px]",
                                    ].join(" ")}
                                />
                            </button>
                        </div>

                        {form.repeats && (
                            <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                <label>
                                    <span className="mb-1 block text-[13px] text-[#45454b]">
                                        Frequency
                                    </span>

                                    <select
                                        name="repeat_frequency"
                                        value={form.repeat_frequency}
                                        onChange={updateField}
                                        className="h-10 w-full rounded-[11px] border border-[#dedfe4] bg-white px-3 text-[13px] outline-none"
                                    >
                                        {repeatOptions.map((option) => (
                                            <option
                                                key={option.value}
                                                value={option.value}
                                            >
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </label>

                                <label>
                                    <span className="mb-1 block text-[13px] text-[#45454b]">
                                        Next date
                                    </span>

                                    <input
                                        type="date"
                                        name="next_repeat_date"
                                        value={form.next_repeat_date}
                                        onChange={updateField}
                                        className="h-10 w-full rounded-[11px] border border-[#dedfe4] px-3 text-[13px] outline-none"
                                    />
                                </label>
                            </div>
                        )}
                    </div>

                    <label>
                        <span className="mb-1.5 block text-[14px] font-medium text-[#26262a]">
                            Note
                        </span>

                        <textarea
                            name="note"
                            value={form.note}
                            onChange={updateField}
                            rows={3}
                            placeholder="Optional internal note"
                            className="w-full resize-none rounded-[13px] border border-[#dedfe4] px-3.5 py-3 text-[14px] outline-none focus:border-[#2563eb]"
                        />
                    </label>

                    <div className="flex justify-end gap-3 border-t border-[#ececef] pt-5">
                        <button
                            type="button"
                            onClick={onClose}
                            className="h-11 rounded-[13px] border border-[#dedfe4] bg-white px-5 text-[14px] font-medium text-[#27272b] hover:bg-[#f7f7f8]"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex h-11 items-center justify-center gap-2 rounded-[13px] bg-[#2563eb] px-5 text-[14px] font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving && (
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                            )}

                            Record expense
                        </button>
                    </div>
                </div>
            </form>
        </div>,
        document.body
    );
};

const DeleteExpenseModal = ({
    expense,
    deleting,
    onCancel,
    onDelete,
}) => {
    if (!expense) {
        return null;
    }

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 px-4">
            <div
                className="absolute inset-0"
                onClick={onCancel}
            />

            <div className="relative z-10 w-full max-w-[440px] overflow-hidden rounded-[18px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.25)]">
                <div className="h-1 bg-[#dc2626]" />

                <button
                    type="button"
                    onClick={onCancel}
                    className="absolute right-4 top-5 rounded-lg p-1 text-[#74747b] hover:bg-[#f4f4f5]"
                >
                    <X size={19} />
                </button>

                <div className="px-7 pb-7 pt-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fee2e2] text-[#dc2626]">
                        <Trash2 size={22} />
                    </div>

                    <h2 className="mt-5 text-[20px] font-semibold text-[#18181b]">
                        Delete Expense
                    </h2>

                    <p className="mt-2 text-[14px] leading-6 text-[#6b6b72]">
                        Are you sure you want to delete “
                        {expense.description}”? This action cannot be undone.
                    </p>

                    <div className="mt-7 grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="h-11 rounded-[12px] border border-[#d8d9de] bg-white text-[14px] font-medium text-[#29292d] hover:bg-[#f7f7f8]"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={deleting}
                            className="flex h-11 items-center justify-center gap-2 rounded-[12px] bg-[#dc2626] text-[14px] font-semibold text-white hover:bg-[#b91c1c] disabled:opacity-60"
                        >
                            {deleting && (
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                            )}

                            Delete
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

const AdminFinanceExpenses = () => {
    const [expenses, setExpenses] =
        useState([]);

    const [pagination, setPagination] =
        useState({
            current_page: 1,
            last_page: 1,
            total: 0,
            per_page: 20,
        });

    const [search, setSearch] =
        useState("");

    const [book, setBook] =
        useState("both");

    const [loading, setLoading] =
        useState(true);

    const [downloading, setDownloading] =
        useState(false);

    const [modalOpen, setModalOpen] =
        useState(false);

    const [deleteTarget, setDeleteTarget] =
        useState(null);

    const [deleting, setDeleting] =
        useState(false);

    const [message, setMessage] =
        useState("");

    const fetchExpenses = useCallback(
        async (page = 1) => {
            try {
                setLoading(true);

                const response = await api.get(
                    "/admin/finance/expenses",
                    {
                        params: {
                            page,
                            per_page: 20,
                            search: search.trim(),
                            book,
                        },
                    }
                );

                const result =
                    response.data?.data || {};

                setExpenses(
                    result.data || []
                );

                setPagination({
                    current_page:
                        result.current_page || 1,

                    last_page:
                        result.last_page || 1,

                    total:
                        result.total || 0,

                    per_page:
                        result.per_page || 20,
                });
            } catch (error) {
                console.error(
                    "Admin expenses error:",
                    error.response?.data ||
                    error.message
                );

                setExpenses([]);
            } finally {
                setLoading(false);
            }
        },
        [search, book]
    );

    useEffect(() => {
        const timer = setTimeout(
            () => fetchExpenses(1),
            search.trim() ? 350 : 0
        );

        return () => clearTimeout(timer);
    }, [fetchExpenses, search]);

    const showMessage = (text) => {
        setMessage(text);

        setTimeout(() => {
            setMessage("");
        }, 3000);
    };

    const handleSaved = () => {
        showMessage(
            "Expense recorded successfully."
        );

        fetchExpenses(1);
    };

    const handleDelete = async () => {
        if (!deleteTarget) {
            return;
        }

        try {
            setDeleting(true);

            await api.delete(
                `/admin/finance/expenses/${deleteTarget.id}`
            );

            setDeleteTarget(null);

            showMessage(
                "Expense deleted successfully."
            );

            fetchExpenses(
                pagination.current_page
            );
        } catch (error) {
            console.error(
                "Delete expense error:",
                error.response?.data ||
                error.message
            );
        } finally {
            setDeleting(false);
        }
    };

    const handleDownload = async () => {
        try {
            setDownloading(true);

            const response = await api.get(
                "/admin/finance/expenses/download",
                {
                    params: {
                        book,
                    },
                    responseType: "blob",
                }
            );

            const url = URL.createObjectURL(
                new Blob([response.data])
            );

            const link =
                document.createElement("a");

            link.href = url;
            link.download =
                `admin-expenses-${getToday()}.csv`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            URL.revokeObjectURL(url);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f7f9] px-7 py-8 xl:px-10">
            <div className="mx-auto max-w-[1600px]">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-[29px] font-semibold tracking-[-0.035em] text-[#111111]">
                            Expenses
                        </h1>

                        <p className="mt-1 text-[14px] text-[#6f7077]">
                            Record and track costs paid by the store.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={downloading}
                            className="flex h-11 items-center gap-2 rounded-[13px] border border-[#dcdee3] bg-white px-4 text-[14px] font-medium hover:bg-[#f8f8f9]"
                        >
                            {downloading ? (
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                            ) : (
                                <Download size={17} />
                            )}

                            Download
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setModalOpen(true);
                            }}
                            className="flex h-11 items-center gap-2 rounded-[13px] bg-[#2563eb] px-5 text-[14px] font-semibold text-white hover:bg-[#1d4ed8]"
                        >
                            <Plus size={18} />
                            Record expense
                        </button>
                    </div>
                </div>

                {message && (
                    <div className="mt-5 rounded-[13px] border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[14px] text-[#15803d]">
                        {message}
                    </div>
                )}

                <div className="mt-7 overflow-hidden rounded-[18px] border border-[#dedfe4] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                    <div className="flex flex-col gap-3 border-b border-[#e5e6e9] p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="relative w-full max-w-[500px]">
                            <Search
                                size={17}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#898990]"
                            />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) => {
                                    setSearch(event.target.value);
                                }}
                                placeholder="Search expenses"
                                className="h-11 w-full rounded-[13px] border border-[#dedfe4] pl-10 pr-4 text-[14px] outline-none focus:border-[#2563eb]"
                            />
                        </div>

                        <select
                            value={book}
                            onChange={(event) => {
                                setBook(event.target.value);
                            }}
                            className="h-11 rounded-[13px] border border-[#dedfe4] bg-white px-4 text-[14px] outline-none"
                        >
                            <option value="both">
                                Both books
                            </option>

                            {bookOptions.map((option) => (
                                <option
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-[950px] w-full">
                            <thead className="bg-[#fafafa]">
                                <tr className="border-b border-[#e5e6e9] text-left text-[13px] font-medium text-[#53545b]">
                                    <th className="px-5 py-4">
                                        Date
                                    </th>

                                    <th className="px-5 py-4">
                                        Description
                                    </th>

                                    <th className="px-5 py-4">
                                        Category
                                    </th>

                                    <th className="px-5 py-4">
                                        Paid from
                                    </th>

                                    <th className="px-5 py-4">
                                        Book
                                    </th>

                                    <th className="px-5 py-4 text-right">
                                        Amount
                                    </th>

                                    <th className="px-5 py-4 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="h-[230px]"
                                        >
                                            <div className="flex justify-center">
                                                <LoaderCircle
                                                    size={30}
                                                    className="animate-spin text-[#2563eb]"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ) : expenses.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="h-[250px]"
                                        >
                                            <div className="flex flex-col items-center justify-center px-5 text-center">
                                                <ReceiptText
                                                    size={38}
                                                    strokeWidth={1.6}
                                                    className="text-[#777880]"
                                                />

                                                <p className="mt-4 text-[15px] text-[#6d6e75]">
                                                    No expenses recorded yet.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.map((expense) => (
                                        <tr
                                            key={expense.id}
                                            className="border-b border-[#ececef] text-[14px] last:border-b-0"
                                        >
                                            <td className="px-5 py-4">
                                                {formatDate(
                                                    expense.expense_date
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium text-[#202024]">
                                                    {expense.description}
                                                </p>

                                                {expense.paid_to && (
                                                    <p className="mt-0.5 text-[12px] text-[#777880]">
                                                        Paid to {expense.paid_to}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-[#55565d]">
                                                {labelFromValue(
                                                    categories,
                                                    expense.category
                                                )}
                                            </td>

                                            <td className="px-5 py-4 text-[#55565d]">
                                                {labelFromValue(
                                                    paidFromOptions,
                                                    expense.paid_from
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="rounded-full bg-[#f1f3f6] px-2.5 py-1 text-[12px] text-[#484950]">
                                                    {labelFromValue(
                                                        bookOptions,
                                                        expense.book
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-right font-medium">
                                                {formatMoney(
                                                    expense.amount,
                                                    expense.currency
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-2">
                                                    {expense.receipt_url && (
                                                        <a
                                                            href={expense.receipt_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#dedfe4] text-[#55565d] hover:bg-[#f5f6f8]"
                                                        >
                                                            <FileText size={16} />
                                                        </a>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDeleteTarget(
                                                                expense
                                                            );
                                                        }}
                                                        className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#fecaca] text-[#dc2626] hover:bg-[#fff1f2]"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-[#e5e6e9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[13px] text-[#686970]">
                            Showing {expenses.length} of{" "}
                            {pagination.total} results
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={
                                    pagination.current_page <= 1
                                }
                                onClick={() => {
                                    fetchExpenses(
                                        pagination.current_page - 1
                                    );
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dedfe4] disabled:opacity-40"
                            >
                                <ChevronLeft size={17} />
                            </button>

                            <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#2563eb] px-3 text-[13px] font-medium text-white">
                                {pagination.current_page}
                            </span>

                            <button
                                type="button"
                                disabled={
                                    pagination.current_page >=
                                    pagination.last_page
                                }
                                onClick={() => {
                                    fetchExpenses(
                                        pagination.current_page + 1
                                    );
                                }}
                                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#dedfe4] disabled:opacity-40"
                            >
                                <ChevronRight size={17} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <ExpenseModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                onSaved={handleSaved}
            />

            <DeleteExpenseModal
                expense={deleteTarget}
                deleting={deleting}
                onCancel={() => {
                    if (!deleting) {
                        setDeleteTarget(null);
                    }
                }}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default AdminFinanceExpenses;