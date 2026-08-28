import {
    Download,
    LoaderCircle,
    Plus,
    ReceiptText,
    Trash2,
    X,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import api from "../../../api/axios";

function getToday() {
    const date = new Date();

    const timezoneOffset =
        date.getTimezoneOffset() * 60000;

    return new Date(
        date.getTime() - timezoneOffset
    )
        .toISOString()
        .slice(0, 10);
}

const emptyForm = {
    expense_date: getToday(),
    amount: "",
    description: "",
    category: "other",
    paid_to: "",
};

const defaultCategories = {
    rent: "Rent",
    salaries: "Salaries",
    advertising: "Advertising",
    shipping: "Shipping",
    supplies: "Supplies",
    software: "Software",
    utilities: "Utilities",
    taxes: "Taxes",
    professional_services: "Professional Services",
    other: "Other",
};

const VendorExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState(
        defaultCategories
    );

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
        from: 0,
        to: 0,
    });

    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    const [downloading, setDownloading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchExpenses();
    }, []);

    useEffect(() => {
        if (!modalOpen) {
            return;
        }

        const handleEscape = (event) => {
            if (
                event.key === "Escape" &&
                !submitting
            ) {
                closeModal();
            }
        };

        document.body.style.overflow = "hidden";

        window.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.body.style.overflow = "";

            window.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [modalOpen, submitting]);

    const fetchExpenses = async (page = 1) => {
        try {
            setLoading(true);
            setPageError("");

            const response = await api.get(
                "/vendor/finance/expenses",
                {
                    params: {
                        page,
                        per_page: 20,
                    },
                }
            );

            const data = response.data || {};
            const expenseResponse =
                data.expenses || {};

            setExpenses(
                expenseResponse.data || []
            );

            setPagination({
                current_page:
                    expenseResponse.current_page || 1,

                last_page:
                    expenseResponse.last_page || 1,

                per_page:
                    expenseResponse.per_page || 20,

                total:
                    expenseResponse.total || 0,

                from:
                    expenseResponse.from || 0,

                to:
                    expenseResponse.to || 0,
            });

            if (
                data.categories &&
                typeof data.categories === "object"
            ) {
                setCategories(data.categories);
            }
        } catch (error) {
            console.error(
                "Expense fetch error:",
                error.response?.data ||
                error.message
            );

            setPageError(
                error.response?.data?.message ||
                "Expenses load করা সম্ভব হয়নি।"
            );

            setExpenses([]);
        } finally {
            setLoading(false);
        }
    };

    const openModal = () => {
        setForm({
            ...emptyForm,
            expense_date: getToday(),
        });

        setFormErrors({});
        setModalOpen(true);
    };

    const closeModal = () => {
        if (submitting) {
            return;
        }

        setModalOpen(false);
        setForm(emptyForm);
        setFormErrors({});
    };

    const handleInputChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        if (formErrors[name]) {
            setFormErrors((previous) => ({
                ...previous,
                [name]: null,
            }));
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        const clientErrors =
            validateExpenseForm(form);

        if (
            Object.keys(clientErrors).length > 0
        ) {
            setFormErrors(clientErrors);
            return;
        }

        try {
            setSubmitting(true);
            setFormErrors({});

            await api.post(
                "/vendor/finance/expenses",
                {
                    expense_date:
                        form.expense_date,

                    amount:
                        Number(form.amount),

                    description:
                        form.description.trim(),

                    category:
                        form.category,

                    paid_to:
                        form.paid_to.trim() ||
                        null,
                }
            );

            setModalOpen(false);
            setForm(emptyForm);

            await fetchExpenses(1);
        } catch (error) {
            console.error(
                "Expense create error:",
                error.response?.data ||
                error.message
            );

            if (
                error.response?.status === 422
            ) {
                setFormErrors(
                    error.response.data.errors || {}
                );

                return;
            }

            setFormErrors({
                general:
                    error.response?.data?.message ||
                    "Expense record করা সম্ভব হয়নি।",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (expense) => {
        const confirmed = window.confirm(
            `"${expense.description}" expense-টি delete করতে চান?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(expense.id);

            await api.delete(
                `/vendor/finance/expenses/${expense.id}`
            );

            const nextPage =
                expenses.length === 1 &&
                pagination.current_page > 1
                    ? pagination.current_page - 1
                    : pagination.current_page;

            await fetchExpenses(nextPage);
        } catch (error) {
            console.error(
                "Expense delete error:",
                error.response?.data ||
                error.message
            );

            window.alert(
                error.response?.data?.message ||
                "Expense delete করা সম্ভব হয়নি।"
            );
        } finally {
            setDeletingId(null);
        }
    };

    const handleDownload = async () => {
        try {
            setDownloading(true);

            const response = await api.get(
                "/vendor/finance/expenses/download",
                {
                    responseType: "blob",
                }
            );

            const fileBlob = new Blob(
                [response.data],
                {
                    type:
                        response.headers[
                            "content-type"
                        ] || "text/csv",
                }
            );

            const fileUrl =
                window.URL.createObjectURL(
                    fileBlob
                );

            const downloadLink =
                document.createElement("a");

            downloadLink.href = fileUrl;

            downloadLink.download =
                getDownloadFileName(
                    response.headers[
                        "content-disposition"
                    ]
                );

            document.body.appendChild(
                downloadLink
            );

            downloadLink.click();
            downloadLink.remove();

            window.URL.revokeObjectURL(
                fileUrl
            );
        } catch (error) {
            console.error(
                "Expense download error:",
                error.response?.data ||
                error.message
            );

            window.alert(
                "Expense report download করা সম্ভব হয়নি।"
            );
        } finally {
            setDownloading(false);
        }
    };

    const handlePageChange = (page) => {
        if (
            page < 1 ||
            page > pagination.last_page
        ) {
            return;
        }

        fetchExpenses(page);
    };

    return (
        <div className="min-h-screen bg-[#f7f7f8] p-[28px]">
            <div className="mx-auto max-w-[1600px]">
                <div className="flex items-end justify-between gap-[20px]">
                    <div>
                        <h1 className="text-[21px] font-semibold tracking-[-0.02em] text-[#111111]">
                            Your expenses
                        </h1>

                        <p className="mt-[4px] text-[14px] text-[#6e6e6e]">
                            Costs you paid yourself. Recorded for your own records — they do not affect what the marketplace owes you.
                        </p>
                    </div>

                    <div className="flex items-center gap-[12px]">
                        <button
                            type="button"
                            disabled={downloading}
                            onClick={handleDownload}
                            className="flex h-[42px] items-center gap-[8px] rounded-[12px] border border-[#dedede] bg-white px-[17px] text-[14px] font-medium text-[#171717] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-60"
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
                            onClick={openModal}
                            className="flex h-[42px] items-center gap-[8px] rounded-[12px] bg-[#2467d5] px-[18px] text-[14px] font-semibold text-white transition hover:bg-[#1e59ba]"
                        >
                            <Plus size={18} />
                            Record expense
                        </button>
                    </div>
                </div>

                <section className="mt-[16px] rounded-[16px] border border-[#dedede] bg-white p-[16px] shadow-sm">
                    <div className="overflow-hidden rounded-[14px] border border-[#dedede]">
                        <div className="grid grid-cols-[180px_minmax(300px,1fr)_260px_200px_70px] border-b border-[#dedede] bg-white px-[18px] py-[15px] text-[13px] font-semibold text-[#171717]">
                            <span>Date</span>
                            <span>Description</span>
                            <span>Category</span>
                            <span>Amount</span>
                            <span />
                        </div>

                        {pageError && (
                            <div className="border-b border-red-200 bg-red-50 px-[18px] py-[12px] text-[13px] text-red-600">
                                {pageError}
                            </div>
                        )}

                        {loading ? (
                            <ExpenseLoading />
                        ) : expenses.length === 0 ? (
                            <ExpenseEmptyState />
                        ) : (
                            expenses.map((expense) => (
                                <div
                                    key={expense.id}
                                    className="grid min-h-[68px] grid-cols-[180px_minmax(300px,1fr)_260px_200px_70px] items-center border-b border-[#e8e8e8] px-[18px] text-[13px] text-[#333333] last:border-b-0 hover:bg-[#fafafa]"
                                >
                                    <span>
                                        {formatDate(
                                            expense.expense_date
                                        )}
                                    </span>

                                    <div className="min-w-0 pr-[20px]">
                                        <p className="truncate font-medium text-[#202020]">
                                            {expense.description}
                                        </p>

                                        {expense.paid_to && (
                                            <p className="mt-[3px] truncate text-[11px] text-[#858585]">
                                                Paid to{" "}
                                                {expense.paid_to}
                                            </p>
                                        )}
                                    </div>

                                    <span className="capitalize text-[#555555]">
                                        {categories[
                                            expense.category
                                        ] ||
                                            formatCategory(
                                                expense.category
                                            )}
                                    </span>

                                    <span className="font-semibold text-[#171717]">
                                        {formatMoney(
                                            expense.amount,
                                            expense.currency
                                        )}
                                    </span>

                                    <button
                                        type="button"
                                        disabled={
                                            deletingId ===
                                            expense.id
                                        }
                                        onClick={() =>
                                            handleDelete(
                                                expense
                                            )
                                        }
                                        className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] border border-[#e1e1e1] text-[#777777] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                                        title="Delete expense"
                                    >
                                        {deletingId ===
                                        expense.id ? (
                                            <LoaderCircle
                                                size={15}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Trash2 size={15} />
                                        )}
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {!loading &&
                        pagination.total > 0 && (
                            <ExpensePagination
                                pagination={
                                    pagination
                                }
                                onPageChange={
                                    handlePageChange
                                }
                            />
                        )}
                </section>
            </div>

            {modalOpen && (
                <RecordExpenseModal
                    form={form}
                    categories={categories}
                    formErrors={formErrors}
                    submitting={submitting}
                    onChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

const ExpenseLoading = () => {
    return (
        <div className="flex min-h-[180px] flex-col items-center justify-center">
            <LoaderCircle
                size={28}
                className="animate-spin text-[#2467d5]"
            />

            <p className="mt-[10px] text-[13px] text-[#777777]">
                Loading expenses...
            </p>
        </div>
    );
};

const ExpenseEmptyState = () => {
    return (
        <div className="flex min-h-[145px] flex-col items-center justify-center px-[20px] text-center">
            <ReceiptText
                size={32}
                strokeWidth={1.6}
                className="text-[#7b7b7b]"
            />

            <p className="mt-[14px] text-[13px] text-[#6f6f6f]">
                No expenses recorded yet. Rent, salaries and advertising are the costs nothing else in the app can see.
            </p>
        </div>
    );
};

const ExpensePagination = ({
    pagination,
    onPageChange,
}) => {
    return (
        <div className="mt-[18px] flex items-center justify-between px-[4px]">
            <p className="text-[13px] text-[#686868]">
                Showing {pagination.from || 0} to{" "}
                {pagination.to || 0} of{" "}
                {pagination.total || 0} results
            </p>

            <div className="flex items-center gap-[8px]">
                <button
                    type="button"
                    disabled={
                        pagination.current_page <= 1
                    }
                    onClick={() =>
                        onPageChange(
                            pagination.current_page - 1
                        )
                    }
                    className="h-[36px] rounded-[9px] border border-[#dedede] bg-white px-[14px] text-[13px] text-[#555555] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Previous
                </button>

                <span className="flex h-[36px] min-w-[36px] items-center justify-center rounded-[9px] bg-[#2467d5] px-[10px] text-[13px] font-semibold text-white">
                    {pagination.current_page}
                </span>

                <button
                    type="button"
                    disabled={
                        pagination.current_page >=
                        pagination.last_page
                    }
                    onClick={() =>
                        onPageChange(
                            pagination.current_page + 1
                        )
                    }
                    className="h-[36px] rounded-[9px] border border-[#dedede] bg-white px-[14px] text-[13px] text-[#555555] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

const RecordExpenseModal = ({
    form,
    categories,
    formErrors,
    submitting,
    onChange,
    onSubmit,
    onClose,
}) => {
    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-[20px] py-[25px]"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <form
                onSubmit={onSubmit}
                className="w-full max-w-[575px] overflow-hidden rounded-[17px] bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between px-[28px] pb-[14px] pt-[25px]">
                    <div>
                        <h2 className="text-[21px] font-semibold text-[#202020]">
                            Record expense
                        </h2>

                        <p className="mt-[4px] max-w-[475px] text-[14px] leading-[1.55] text-[#777777]">
                            Costs you paid yourself. Recorded for your own records — they do not affect what the marketplace owes you.
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={submitting}
                        onClick={onClose}
                        className="ml-[14px] flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-full text-[#555555] transition hover:bg-[#f2f2f2]"
                    >
                        <X size={19} />
                    </button>
                </div>

                <div className="px-[28px] pb-[6px]">
                    {formErrors.general && (
                        <div className="mb-[14px] rounded-[10px] border border-red-200 bg-red-50 px-[13px] py-[10px] text-[12px] text-red-600">
                            {formErrors.general}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-x-[14px] gap-y-[13px]">
                        <ExpenseField
                            label="Date"
                            name="expense_date"
                            type="date"
                            value={form.expense_date}
                            error={
                                formErrors.expense_date
                            }
                            onChange={onChange}
                        />

                        <ExpenseField
                            label="Amount"
                            name="amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.amount}
                            placeholder="USD"
                            error={formErrors.amount}
                            onChange={onChange}
                        />

                        <div className="col-span-2">
                            <ExpenseField
                                label="Description"
                                name="description"
                                value={form.description}
                                placeholder="Enter expense description"
                                error={
                                    formErrors.description
                                }
                                onChange={onChange}
                            />
                        </div>

                        <ExpenseSelect
                            label="Category"
                            name="category"
                            value={form.category}
                            error={formErrors.category}
                            onChange={onChange}
                            options={categories}
                        />

                        <ExpenseField
                            label="Paid to"
                            name="paid_to"
                            value={form.paid_to}
                            placeholder="Optional"
                            error={formErrors.paid_to}
                            onChange={onChange}
                        />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-[10px] px-[28px] pb-[26px] pt-[18px]">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={onClose}
                        className="h-[42px] rounded-[11px] border border-[#dedede] bg-white px-[20px] text-[14px] font-semibold text-[#252525] transition hover:bg-[#f7f7f7] disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex h-[42px] min-w-[158px] items-center justify-center gap-[8px] rounded-[11px] bg-[#2467d5] px-[20px] text-[14px] font-semibold text-white transition hover:bg-[#1e59ba] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting && (
                            <LoaderCircle
                                size={17}
                                className="animate-spin"
                            />
                        )}

                        Record expense
                    </button>
                </div>
            </form>
        </div>
    );
};

const ExpenseField = ({
    label,
    error,
    ...inputProps
}) => {
    const message = getErrorMessage(error);

    return (
        <label className="block">
            <span className="mb-[7px] block text-[13px] font-medium text-[#222222]">
                {label}
            </span>

            <input
                {...inputProps}
                className={`h-[42px] w-full rounded-[12px] border bg-[#fafafa] px-[14px] text-[14px] text-[#202020] outline-none transition placeholder:text-[#999999] focus:bg-white ${
                    message
                        ? "border-red-400 focus:border-red-500"
                        : "border-[#dedede] focus:border-[#2467d5]"
                }`}
            />

            {message && (
                <span className="mt-[5px] block text-[11px] text-red-600">
                    {message}
                </span>
            )}
        </label>
    );
};

const ExpenseSelect = ({
    label,
    options,
    error,
    ...selectProps
}) => {
    const message = getErrorMessage(error);

    return (
        <label className="block">
            <span className="mb-[7px] block text-[13px] font-medium text-[#222222]">
                {label}
            </span>

            <select
                {...selectProps}
                className={`h-[42px] w-full rounded-[12px] border bg-[#fafafa] px-[14px] text-[14px] text-[#202020] outline-none transition focus:bg-white ${
                    message
                        ? "border-red-400"
                        : "border-[#dedede] focus:border-[#2467d5]"
                }`}
            >
                {Object.entries(options).map(
                    ([value, label]) => (
                        <option
                            key={value}
                            value={value}
                        >
                            {label}
                        </option>
                    )
                )}
            </select>

            {message && (
                <span className="mt-[5px] block text-[11px] text-red-600">
                    {message}
                </span>
            )}
        </label>
    );
};

const validateExpenseForm = (form) => {
    const errors = {};

    if (!form.expense_date) {
        errors.expense_date =
            "Expense date প্রয়োজন।";
    }

    if (
        !form.amount ||
        Number(form.amount) <= 0
    ) {
        errors.amount =
            "Valid expense amount দিন।";
    }

    if (!form.description.trim()) {
        errors.description =
            "Expense description প্রয়োজন।";
    }

    if (!form.category) {
        errors.category =
            "Expense category নির্বাচন করুন।";
    }

    return errors;
};

const getErrorMessage = (error) => {
    if (Array.isArray(error)) {
        return error[0];
    }

    return error || "";
};

const formatDate = (value) => {
    if (!value) {
        return "-";
    }

    const normalizedValue =
        String(value).slice(0, 10);

    return new Date(
        `${normalizedValue}T00:00:00`
    ).toLocaleDateString(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
        }
    );
};

const formatMoney = (
    value,
    currency = "USD"
) => {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: currency || "USD",
        }
    ).format(
        Number(value || 0)
    );
};

const formatCategory = (value) => {
    if (!value) {
        return "Other";
    }

    return value
        .replaceAll("_", " ")
        .replace(/\b\w/g, (letter) =>
            letter.toUpperCase()
        );
};

const getDownloadFileName = (
    contentDisposition
) => {
    if (!contentDisposition) {
        return `vendor-expenses-${getToday()}.csv`;
    }

    const match = contentDisposition.match(
        /filename="?([^"]+)"?/i
    );

    return match?.[1] ||
        `vendor-expenses-${getToday()}.csv`;
};

export default VendorExpenses;