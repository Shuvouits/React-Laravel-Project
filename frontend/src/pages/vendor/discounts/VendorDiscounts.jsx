import {
    BadgePercent,
    CalendarClock,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    LoaderCircle,
    Pencil,
    Plus,
    Search,
    Tag,
    Trash2,
    TrendingUp,
    X,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import api from "../../../api/axios";

const initialForm = {
    code: "",
    label: "",
    status: "active",
    type: "percentage",
    value: "",
    minimum_order_amount: "",
    maximum_discount_cap: "",
    total_usage_limit: "",
    per_customer_usage_limit: "",
    starts_at: getToday(),
    ends_at: "",
    description: "",
};

const VendorDiscounts = () => {
    const [discounts, setDiscounts] = useState([]);

    const [statistics, setStatistics] = useState({
        total_discounts: 0,
        active_discounts: 0,
        total_redemptions: 0,
        expiring_in_seven_days: 0,
    });

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    });

    const [activeTab, setActiveTab] = useState("all");
    const [search, setSearch] = useState("");
    const [perPage, setPerPage] = useState(10);

    const [loading, setLoading] = useState(true);
    const [pageError, setPageError] = useState("");

    const [modalOpen, setModalOpen] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [formErrors, setFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchDiscounts(1);
        }, search.trim() ? 400 : 0);

        return () => {
            clearTimeout(timer);
        };
    }, [activeTab, search, perPage]);

    useEffect(() => {
        if (!modalOpen) {
            return;
        }

        const handleEscape = (event) => {
            if (event.key === "Escape" && !submitting) {
                closeModal();
            }
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", handleEscape);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", handleEscape);
        };
    }, [modalOpen, submitting]);

    const fetchDiscounts = async (page = 1) => {
        try {
            setLoading(true);
            setPageError("");

            const params = {
                page,
                per_page: perPage,
                search: search.trim(),
            };

            if (activeTab !== "all") {
                params.status = activeTab;
            }

            const response = await api.get(
                "/vendor/discounts",
                {
                    params,
                }
            );

            const data = response.data || {};
            const discountResponse = data.discounts || {};

            setDiscounts(discountResponse.data || []);

            setStatistics({
                total_discounts:
                    data.statistics?.total_discounts || 0,

                active_discounts:
                    data.statistics?.active_discounts || 0,

                total_redemptions:
                    data.statistics?.total_redemptions || 0,

                expiring_in_seven_days:
                    data.statistics?.expiring_in_seven_days || 0,
            });

            setPagination({
                current_page:
                    discountResponse.current_page || 1,

                last_page:
                    discountResponse.last_page || 1,

                per_page:
                    discountResponse.per_page || perPage,

                total:
                    discountResponse.total || 0,

                from:
                    discountResponse.from || 0,

                to:
                    discountResponse.to || 0,
            });
        } catch (error) {
            console.error(
                "Discount fetch error:",
                error.response?.data || error.message
            );

            setPageError(
                error.response?.data?.message ||
                "Discount list load করা সম্ভব হয়নি।"
            );

            setDiscounts([]);
        } finally {
            setLoading(false);
        }
    };

    const openCreateModal = () => {
        setEditingDiscount(null);
        setForm({
            ...initialForm,
            starts_at: getToday(),
        });
        setFormErrors({});
        setModalOpen(true);
    };

    const openEditModal = (discount) => {
        setEditingDiscount(discount);

        setForm({
            code: discount.code || "",
            label: discount.label || "",
            status: discount.status || "active",
            type: discount.type || "percentage",
            value: discount.value || "",
            minimum_order_amount:
                discount.minimum_order_amount || "",
            maximum_discount_cap:
                discount.maximum_discount_cap || "",
            total_usage_limit:
                discount.total_usage_limit || "",
            per_customer_usage_limit:
                discount.per_customer_usage_limit || "",
            starts_at:
                formatDateForInput(discount.starts_at),
            ends_at:
                formatDateForInput(discount.ends_at),
            description:
                discount.description || "",
        });

        setFormErrors({});
        setModalOpen(true);
    };

    const closeModal = () => {
        if (submitting) {
            return;
        }

        setModalOpen(false);
        setEditingDiscount(null);
        setForm(initialForm);
        setFormErrors({});
    };

    const handleInputChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        let nextValue = value;

        if (name === "code") {
            nextValue = value
                .toUpperCase()
                .replace(/[^A-Z0-9_-]/g, "");
        }

        setForm((previous) => ({
            ...previous,
            [name]: nextValue,
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

        const clientErrors = validateForm(form);

        if (Object.keys(clientErrors).length > 0) {
            setFormErrors(clientErrors);
            return;
        }

        try {
            setSubmitting(true);
            setFormErrors({});

            const payload = {
                code: form.code.trim(),
                label: form.label.trim() || null,
                status: form.status,
                type: form.type,
                value: Number(form.value),
                minimum_order_amount:
                    form.minimum_order_amount === ""
                        ? 0
                        : Number(form.minimum_order_amount),
                maximum_discount_cap:
                    form.maximum_discount_cap === ""
                        ? null
                        : Number(form.maximum_discount_cap),
                total_usage_limit:
                    form.total_usage_limit === ""
                        ? null
                        : Number(form.total_usage_limit),
                per_customer_usage_limit:
                    form.per_customer_usage_limit === ""
                        ? null
                        : Number(form.per_customer_usage_limit),
                starts_at: form.starts_at,
                ends_at: form.ends_at || null,
                description:
                    form.description.trim() || null,
            };

            if (editingDiscount) {
                await api.put(
                    `/vendor/discounts/${editingDiscount.id}`,
                    payload
                );
            } else {
                await api.post(
                    "/vendor/discounts",
                    payload
                );
            }

            closeModal();
            await fetchDiscounts(
                editingDiscount
                    ? pagination.current_page
                    : 1
            );
        } catch (error) {
            console.error(
                "Discount save error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 422) {
                setFormErrors(
                    error.response.data.errors || {}
                );
                return;
            }

            setFormErrors({
                general:
                    error.response?.data?.message ||
                    "Discount save করা সম্ভব হয়নি।",
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (discount) => {
        const confirmed = window.confirm(
            `"${discount.code}" discount-টি delete করতে চান?`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingId(discount.id);

            await api.delete(
                `/vendor/discounts/${discount.id}`
            );

            const nextPage =
                discounts.length === 1 &&
                pagination.current_page > 1
                    ? pagination.current_page - 1
                    : pagination.current_page;

            await fetchDiscounts(nextPage);
        } catch (error) {
            console.error(
                "Discount delete error:",
                error.response?.data || error.message
            );

            window.alert(
                error.response?.data?.message ||
                "Discount delete করা সম্ভব হয়নি।"
            );
        } finally {
            setDeletingId(null);
        }
    };

    const handlePageChange = (page) => {
        if (page < 1 || page > pagination.last_page) {
            return;
        }

        fetchDiscounts(page);
    };

    const tabs = [
        {
            key: "all",
            label: "All",
        },
        {
            key: "active",
            label: "Active",
        },
        {
            key: "inactive",
            label: "Inactive",
        },
        {
            key: "expired",
            label: "Expired",
        },
    ];

    return (
        <div className="min-h-screen bg-[#f7f7f8] p-[24px]">
            <div className="mx-auto max-w-[1600px]">
                <DiscountStatistics
                    statistics={statistics}
                />

                <section className="mt-[16px] rounded-[16px] border border-[#dedede] bg-white">
                    <div className="flex items-center justify-between px-[24px] py-[22px]">
                        <h1 className="text-[22px] font-semibold text-[#171717]">
                            Discounts
                        </h1>

                        <button
                            type="button"
                            onClick={openCreateModal}
                            className="flex h-[42px] items-center gap-[8px] rounded-[10px] bg-[#2467d5] px-[18px] text-[14px] font-semibold text-white transition hover:bg-[#1d59bc]"
                        >
                            <Plus size={18} />
                            Add Discount
                        </button>
                    </div>

                    <div className="mx-[24px] mb-[24px] overflow-hidden rounded-[14px] border border-[#dedede]">
                        <div className="flex h-[66px] items-end gap-[30px] border-b border-[#e7e7e7] px-[22px]">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => setActiveTab(tab.key)}
                                    className={`relative h-full px-[2px] pt-[4px] text-[14px] transition ${
                                        activeTab === tab.key
                                            ? "font-semibold text-[#171717]"
                                            : "font-medium text-[#666666] hover:text-[#222222]"
                                    }`}
                                >
                                    {tab.label}

                                    {activeTab === tab.key && (
                                        <span className="absolute bottom-0 left-0 h-[2px] w-full bg-[#171717]" />
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center justify-between border-b border-[#e7e7e7] px-[18px] py-[14px]">
                            <div className="relative w-full max-w-[585px]">
                                <Search
                                    size={17}
                                    className="absolute left-[14px] top-1/2 -translate-y-1/2 text-[#777777]"
                                />

                                <input
                                    type="text"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search code, label, or description"
                                    className="h-[42px] w-full rounded-[12px] border border-[#dedede] bg-[#fafafa] pl-[42px] pr-[14px] text-[14px] outline-none transition placeholder:text-[#777777] focus:border-[#2467d5] focus:bg-white"
                                />
                            </div>

                            <select
                                value={perPage}
                                onChange={(event) =>
                                    setPerPage(
                                        Number(event.target.value)
                                    )
                                }
                                className="ml-[16px] h-[40px] rounded-[10px] border border-[#dedede] bg-white px-[14px] text-[13px] outline-none"
                            >
                                <option value="10">
                                    10 rows
                                </option>
                                <option value="20">
                                    20 rows
                                </option>
                                <option value="50">
                                    50 rows
                                </option>
                            </select>
                        </div>

                        {pageError && (
                            <div className="border-b border-[#e7e7e7] bg-red-50 px-[20px] py-[12px] text-[13px] text-red-600">
                                {pageError}
                            </div>
                        )}

                        <DiscountTable
                            discounts={discounts}
                            loading={loading}
                            deletingId={deletingId}
                            onEdit={openEditModal}
                            onDelete={handleDelete}
                        />
                    </div>

                    <Pagination
                        pagination={pagination}
                        onPageChange={handlePageChange}
                    />
                </section>
            </div>

            {modalOpen && (
                <DiscountModal
                    form={form}
                    formErrors={formErrors}
                    submitting={submitting}
                    editing={Boolean(editingDiscount)}
                    onChange={handleInputChange}
                    onSubmit={handleSubmit}
                    onClose={closeModal}
                />
            )}
        </div>
    );
};

const DiscountStatistics = ({
    statistics,
}) => {
    const cards = [
        {
            label: "Total Discounts",
            value: statistics.total_discounts,
            description: "All configured discount codes",
            icon: BadgePercent,
            iconColor: "text-[#2563eb]",
            iconBackground: "bg-[#e5efff]",
        },
        {
            label: "Active Discounts",
            value: statistics.active_discounts,
            description: "Available at checkout",
            icon: TrendingUp,
            iconColor: "text-[#159947]",
            iconBackground: "bg-[#dcf9e7]",
        },
        {
            label: "Total Redemptions",
            value: statistics.total_redemptions,
            description: "Times used in orders",
            icon: CircleDollarSign,
            iconColor: "text-[#7c3aed]",
            iconBackground: "bg-[#eee8ff]",
        },
        {
            label: "Expiring in 7 Days",
            value: statistics.expiring_in_seven_days,
            description: "Codes ending soon",
            icon: CalendarClock,
            iconColor: "text-[#d97706]",
            iconBackground: "bg-[#fff3cf]",
        },
    ];

    return (
        <section className="grid grid-cols-4 overflow-hidden rounded-[16px] border border-[#dedede] bg-white">
            {cards.map((card, index) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.label}
                        className={`relative min-h-[148px] px-[27px] py-[25px] ${
                            index > 0
                                ? "border-l border-[#e2e2e2]"
                                : ""
                        }`}
                    >
                        <div
                            className={`absolute right-[26px] top-[18px] flex h-[47px] w-[47px] items-center justify-center rounded-full ${card.iconBackground}`}
                        >
                            <Icon
                                size={23}
                                className={card.iconColor}
                            />
                        </div>

                        <p className="text-[16px] font-medium text-[#222222]">
                            {card.label}
                        </p>

                        <p className="mt-[10px] text-[27px] font-semibold leading-none text-[#111111]">
                            {formatNumber(card.value)}
                        </p>

                        <p className="mt-[12px] text-[13px] text-[#707070]">
                            {card.description}
                        </p>
                    </div>
                );
            })}
        </section>
    );
};

const DiscountTable = ({
    discounts,
    loading,
    deletingId,
    onEdit,
    onDelete,
}) => {
    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse">
                <thead>
                    <tr className="border-b border-[#e7e7e7] text-left">
                        <th className="w-[48px] px-[20px] py-[15px]">
                            <input
                                type="checkbox"
                                disabled
                                className="h-[16px] w-[16px] rounded border-[#d7d7d7]"
                            />
                        </th>

                        <TableHeading>
                            Discount
                        </TableHeading>

                        <TableHeading>
                            Type
                        </TableHeading>

                        <TableHeading>
                            Value
                        </TableHeading>

                        <TableHeading>
                            Status
                        </TableHeading>

                        <TableHeading>
                            Usage
                        </TableHeading>

                        <TableHeading>
                            Schedule
                        </TableHeading>

                        <th className="px-[20px] py-[15px] text-right text-[13px] font-medium text-[#666666]">
                            Actions
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {loading ? (
                        <tr>
                            <td
                                colSpan="8"
                                className="h-[180px] text-center"
                            >
                                <LoaderCircle
                                    size={28}
                                    className="mx-auto animate-spin text-[#2467d5]"
                                />

                                <p className="mt-[10px] text-[13px] text-[#777777]">
                                    Loading discounts...
                                </p>
                            </td>
                        </tr>
                    ) : discounts.length === 0 ? (
                        <tr>
                            <td
                                colSpan="8"
                                className="h-[190px] text-center"
                            >
                                <Tag
                                    size={34}
                                    className="mx-auto text-[#b5b5b5]"
                                />

                                <p className="mt-[12px] text-[14px] font-medium text-[#555555]">
                                    No discounts found
                                </p>

                                <p className="mt-[4px] text-[12px] text-[#888888]">
                                    Create a discount to display it here.
                                </p>
                            </td>
                        </tr>
                    ) : (
                        discounts.map((discount) => (
                            <tr
                                key={discount.id}
                                className="border-b border-[#ededed] last:border-b-0 hover:bg-[#fafafa]"
                            >
                                <td className="px-[20px] py-[16px]">
                                    <input
                                        type="checkbox"
                                        className="h-[16px] w-[16px] rounded border-[#d7d7d7]"
                                    />
                                </td>

                                <td className="px-[20px] py-[16px]">
                                    <p className="text-[14px] font-semibold text-[#202020]">
                                        {discount.code}
                                    </p>

                                    <p className="mt-[2px] max-w-[250px] truncate text-[12px] text-[#777777]">
                                        {discount.label ||
                                            discount.description ||
                                            "No label"}
                                    </p>
                                </td>

                                <td className="px-[20px] py-[16px]">
                                    <span className="inline-flex items-center gap-[5px] rounded-full border border-[#d9d9d9] bg-white px-[9px] py-[4px] text-[11px] font-medium capitalize text-[#333333]">
                                        <BadgePercent size={12} />
                                        {discount.type}
                                    </span>
                                </td>

                                <td className="px-[20px] py-[16px] text-[14px] font-medium text-[#222222]">
                                    {discount.type === "percentage"
                                        ? `${formatDecimal(discount.value)}%`
                                        : formatMoney(discount.value)}
                                </td>

                                <td className="px-[20px] py-[16px]">
                                    <StatusBadge
                                        status={
                                            discount.effective_status ||
                                            discount.status
                                        }
                                    />
                                </td>

                                <td className="px-[20px] py-[16px] text-[13px] text-[#333333]">
                                    {formatNumber(discount.used_count)}
                                    {" / "}
                                    {discount.total_usage_limit
                                        ? formatNumber(
                                              discount.total_usage_limit
                                          )
                                        : "∞"}
                                </td>

                                <td className="px-[20px] py-[16px] text-[12px] text-[#626262]">
                                    {formatSchedule(discount)}
                                </td>

                                <td className="px-[20px] py-[16px]">
                                    <div className="flex justify-end">
                                        <div className="inline-flex overflow-hidden rounded-[10px] border border-[#dddddd] bg-white">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    onEdit(discount)
                                                }
                                                className="flex h-[36px] w-[38px] items-center justify-center border-r border-[#dddddd] text-[#666666] transition hover:bg-[#f3f4f6] hover:text-[#2467d5]"
                                                title="Edit discount"
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                disabled={
                                                    deletingId ===
                                                    discount.id
                                                }
                                                onClick={() =>
                                                    onDelete(discount)
                                                }
                                                className="flex h-[36px] w-[38px] items-center justify-center text-[#777777] transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                                title="Delete discount"
                                            >
                                                {deletingId ===
                                                discount.id ? (
                                                    <LoaderCircle
                                                        size={16}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

const TableHeading = ({
    children,
}) => {
    return (
        <th className="px-[20px] py-[15px] text-[13px] font-medium text-[#666666]">
            {children}
        </th>
    );
};

const StatusBadge = ({
    status,
}) => {
    const styles = {
        active: "bg-[#2467d5] text-white",
        inactive: "bg-[#eeeeee] text-[#555555]",
        expired: "bg-[#fee2e2] text-[#b42318]",
        scheduled: "bg-[#fff1cc] text-[#9a6700]",
        limit_reached: "bg-[#f3e8ff] text-[#7e22ce]",
    };

    const labels = {
        active: "Active",
        inactive: "Inactive",
        expired: "Expired",
        scheduled: "Scheduled",
        limit_reached: "Limit reached",
    };

    return (
        <span
            className={`inline-flex rounded-full px-[10px] py-[4px] text-[11px] font-semibold ${
                styles[status] ||
                styles.inactive
            }`}
        >
            {labels[status] || status}
        </span>
    );
};

const Pagination = ({
    pagination,
    onPageChange,
}) => {
    return (
        <div className="flex items-center justify-between px-[24px] pb-[25px]">
            <p className="text-[13px] text-[#666666]">
                Showing {pagination.from || 0} to{" "}
                {pagination.to || 0} of{" "}
                {pagination.total || 0} results
            </p>

            <div className="flex items-center gap-[8px]">
                <button
                    type="button"
                    disabled={pagination.current_page <= 1}
                    onClick={() =>
                        onPageChange(
                            pagination.current_page - 1
                        )
                    }
                    className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#e5e5e5] text-[#777777] transition hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={17} />
                </button>

                <span className="flex h-[36px] min-w-[36px] items-center justify-center rounded-full bg-[#2467d5] px-[10px] text-[13px] font-semibold text-white">
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
                    className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#e5e5e5] text-[#777777] transition hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronRight size={17} />
                </button>
            </div>
        </div>
    );
};

const DiscountModal = ({
    form,
    formErrors,
    submitting,
    editing,
    onChange,
    onSubmit,
    onClose,
}) => {
    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 px-[20px] py-[25px]"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            <form
                onSubmit={onSubmit}
                className="flex max-h-[calc(100vh-50px)] w-full max-w-[755px] flex-col overflow-hidden rounded-[18px] bg-white shadow-2xl"
            >
                <div className="flex items-start justify-between px-[28px] pb-[10px] pt-[24px]">
                    <div>
                        <h2 className="text-[22px] font-semibold text-[#202020]">
                            {editing
                                ? "Edit Discount"
                                : "Create Discount"}
                        </h2>

                        <p className="mt-[4px] text-[14px] text-[#777777]">
                            Configure discount rules similar to Shopify coupon settings.
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={submitting}
                        onClick={onClose}
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#666666] transition hover:bg-[#f3f3f3]"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="overflow-y-auto px-[28px] pb-[20px]">
                    {formErrors.general && (
                        <div className="mb-[14px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[11px] text-[13px] text-red-600">
                            {formErrors.general}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-x-[18px] gap-y-[14px]">
                        <FormField
                            label="Code"
                            name="code"
                            value={form.code}
                            placeholder="SUMMER10"
                            error={formErrors.code}
                            onChange={onChange}
                        />

                        <FormField
                            label="Label"
                            name="label"
                            value={form.label}
                            placeholder="Flash Sale"
                            error={formErrors.label}
                            onChange={onChange}
                        />

                        <SelectField
                            label="Status"
                            name="status"
                            value={form.status}
                            error={formErrors.status}
                            onChange={onChange}
                            options={[
                                {
                                    value: "active",
                                    label: "Active",
                                },
                                {
                                    value: "inactive",
                                    label: "Inactive",
                                },
                            ]}
                        />

                        <SelectField
                            label="Type"
                            name="type"
                            value={form.type}
                            error={formErrors.type}
                            onChange={onChange}
                            options={[
                                {
                                    value: "percentage",
                                    label: "Percentage",
                                },
                                {
                                    value: "fixed",
                                    label: "Fixed amount",
                                },
                            ]}
                        />

                        <FormField
                            label="Value"
                            name="value"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.value}
                            placeholder={
                                form.type === "percentage"
                                    ? "% 10"
                                    : "$ 20.00"
                            }
                            error={formErrors.value}
                            onChange={onChange}
                        />

                        <FormField
                            label="Minimum order amount"
                            name="minimum_order_amount"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.minimum_order_amount}
                            placeholder="$ 0.00"
                            error={
                                formErrors.minimum_order_amount
                            }
                            onChange={onChange}
                        />

                        <FormField
                            label="Maximum discount cap"
                            name="maximum_discount_cap"
                            type="number"
                            min="0"
                            step="0.01"
                            value={form.maximum_discount_cap}
                            placeholder="$ Optional"
                            error={
                                formErrors.maximum_discount_cap
                            }
                            onChange={onChange}
                        />

                        <FormField
                            label="Total usage limit"
                            name="total_usage_limit"
                            type="number"
                            min="1"
                            step="1"
                            value={form.total_usage_limit}
                            placeholder="Optional"
                            error={
                                formErrors.total_usage_limit
                            }
                            onChange={onChange}
                        />

                        <FormField
                            label="Per-customer usage limit"
                            name="per_customer_usage_limit"
                            type="number"
                            min="1"
                            step="1"
                            value={
                                form.per_customer_usage_limit
                            }
                            placeholder="Optional"
                            error={
                                formErrors.per_customer_usage_limit
                            }
                            onChange={onChange}
                        />

                        <FormField
                            label="Start date"
                            name="starts_at"
                            type="date"
                            value={form.starts_at}
                            error={formErrors.starts_at}
                            onChange={onChange}
                        />

                        <FormField
                            label="End date"
                            name="ends_at"
                            type="date"
                            value={form.ends_at}
                            error={formErrors.ends_at}
                            onChange={onChange}
                        />

                        <div className="col-span-2">
                            <FormField
                                label="Description"
                                name="description"
                                value={form.description}
                                placeholder="Optional internal note for this discount"
                                error={formErrors.description}
                                onChange={onChange}
                            />
                        </div>
                    </div>

                    <div className="mt-[18px] rounded-[12px] border border-[#e2e2e2] bg-[#fafafa] px-[15px] py-[12px] text-[12px] leading-[1.8] text-[#747474]">
                        <p>
                            • Code will be normalized to uppercase.
                        </p>

                        <p>
                            • Tax is calculated after discount during checkout.
                        </p>

                        <p>
                            • Usage limits are optional.
                        </p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-[10px] border-t border-[#e7e7e7] bg-white px-[28px] py-[18px]">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={onClose}
                        className="h-[42px] rounded-[11px] border border-[#dedede] bg-white px-[19px] text-[14px] font-semibold text-[#222222] transition hover:bg-[#f7f7f7] disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex h-[42px] min-w-[148px] items-center justify-center gap-[8px] rounded-[11px] bg-[#2467d5] px-[20px] text-[14px] font-semibold text-white transition hover:bg-[#1d59bc] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {submitting && (
                            <LoaderCircle
                                size={17}
                                className="animate-spin"
                            />
                        )}

                        {editing
                            ? "Update Discount"
                            : "Create Discount"}
                    </button>
                </div>
            </form>
        </div>
    );
};

const FormField = ({
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
                className={`h-[42px] w-full rounded-[12px] border bg-[#fafafa] px-[14px] text-[14px] text-[#222222] outline-none transition placeholder:text-[#888888] focus:bg-white ${
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

const SelectField = ({
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
                className={`h-[42px] w-full rounded-[12px] border bg-[#fafafa] px-[14px] text-[14px] text-[#222222] outline-none transition focus:bg-white ${
                    message
                        ? "border-red-400"
                        : "border-[#dedede] focus:border-[#2467d5]"
                }`}
            >
                {options.map((option) => (
                    <option
                        key={option.value}
                        value={option.value}
                    >
                        {option.label}
                    </option>
                ))}
            </select>

            {message && (
                <span className="mt-[5px] block text-[11px] text-red-600">
                    {message}
                </span>
            )}
        </label>
    );
};

const validateForm = (form) => {
    const errors = {};

    if (!form.code.trim()) {
        errors.code = "Discount code প্রয়োজন।";
    }

    if (!form.value || Number(form.value) <= 0) {
        errors.value = "Valid discount value দিন।";
    }

    if (
        form.type === "percentage" &&
        Number(form.value) > 100
    ) {
        errors.value =
            "Percentage discount 100%-এর বেশি হতে পারবে না।";
    }

    if (!form.starts_at) {
        errors.starts_at = "Start date প্রয়োজন।";
    }

    if (
        form.starts_at &&
        form.ends_at &&
        form.ends_at <= form.starts_at
    ) {
        errors.ends_at =
            "End date অবশ্যই start date-এর পরে হতে হবে।";
    }

    return errors;
};

const getErrorMessage = (error) => {
    if (Array.isArray(error)) {
        return error[0];
    }

    return error || "";
};


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

const formatDateForInput = (value) => {
    if (!value) {
        return "";
    }

    return String(value).slice(0, 10);
};

const formatSchedule = (discount) => {
    const start = formatShortDate(discount.starts_at);
    const end = discount.ends_at
        ? formatShortDate(discount.ends_at)
        : "No expiry";

    return `${start} - ${end}`;
};

const formatShortDate = (value) => {
    if (!value) {
        return "-";
    }

    return new Date(value).toLocaleDateString(
        "en-US",
        {
            month: "numeric",
            day: "numeric",
            year: "numeric",
        }
    );
};

const formatMoney = (value) => {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD",
        }
    ).format(Number(value || 0));
};

const formatNumber = (value) => {
    return new Intl.NumberFormat(
        "en-US"
    ).format(Number(value || 0));
};

const formatDecimal = (value) => {
    const number = Number(value || 0);

    return Number.isInteger(number)
        ? number
        : number.toFixed(2);
};

export default VendorDiscounts;