import {
    useEffect,
    useMemo,
    useState,
} from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";

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
        key: "banned",
        label: "Banned",
    },
];

const loyaltyOptions = [
    {
        value: "",
        label: "All loyalty tiers",
    },
    {
        value: "bronze",
        label: "Bronze",
    },
    {
        value: "silver",
        label: "Silver",
    },
    {
        value: "gold",
        label: "Gold",
    },
    {
        value: "platinum",
        label: "Platinum",
    },
];

const sortOptions = [
    {
        value: "recent",
        label: "Most recent",
    },
    {
        value: "oldest",
        label: "Oldest",
    },
    {
        value: "name_asc",
        label: "Name A-Z",
    },
    {
        value: "name_desc",
        label: "Name Z-A",
    },
    {
        value: "spent_high",
        label: "Highest spend",
    },
    {
        value: "orders_high",
        label: "Most orders",
    },
];

const emptyStats = {
    total_customers: 0,
    active_accounts: 0,
    vip_customers: 0,
    customer_spend: 0,
    average_spend_per_customer: 0,
};

const emptyCounts = {
    all: 0,
    active: 0,
    inactive: 0,
    banned: 0,
};

const defaultAddForm = {
    name: "",
    email: "",
    phone: "",
    account_status: "active",
};

function AdminCustomers() {
    const navigate = useNavigate();

    const [loading, setLoading] =
        useState(true);

    const [customers, setCustomers] =
        useState([]);

    const [stats, setStats] =
        useState(emptyStats);

    const [tabCounts, setTabCounts] =
        useState(emptyCounts);

    const [activeTab, setActiveTab] =
        useState("all");

    const [search, setSearch] =
        useState("");

    const [searchInput, setSearchInput] =
        useState("");

    const [loyaltyTier, setLoyaltyTier] =
        useState("");

    const [sort, setSort] =
        useState("recent");

    const [showFilter, setShowFilter] =
        useState(false);

    const [page, setPage] =
        useState(1);

    const [pagination, setPagination] =
        useState({
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 0,
            from: 0,
            to: 0,
        });

    const [error, setError] =
        useState("");

    const [showAddModal, setShowAddModal] =
        useState(false);

    const [addForm, setAddForm] =
        useState(defaultAddForm);

    const [addErrors, setAddErrors] =
        useState({});

    const [addingCustomer, setAddingCustomer] =
        useState(false);

    const [deleteCustomer, setDeleteCustomer] =
        useState(null);

    const [deleting, setDeleting] =
        useState(false);

    useEffect(() => {
        loadCustomers();
    }, [
        activeTab,
        search,
        loyaltyTier,
        sort,
        page,
    ]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(
                searchInput.trim()
            );

            setPage(1);
        }, 400);

        return () => {
            clearTimeout(timeout);
        };
    }, [searchInput]);

    const loadCustomers = async () => {
        setLoading(true);
        setError("");

        try {
            const response =
                await api.get(
                    "/admin/customers",
                    {
                        params: {
                            tab: activeTab,
                            search:
                                search ||
                                undefined,
                            loyalty_tier:
                                loyaltyTier ||
                                undefined,
                            sort,
                            page,
                            per_page: 15,
                        },
                    }
                );

            const data =
                response.data;

            setCustomers(
                data.customers?.data || []
            );

            setStats(
                data.stats ||
                emptyStats
            );

            setTabCounts(
                data.tab_counts ||
                emptyCounts
            );

            setPagination({
                current_page:
                    data.customers
                        ?.current_page || 1,

                last_page:
                    data.customers
                        ?.last_page || 1,

                per_page:
                    data.customers
                        ?.per_page || 15,

                total:
                    data.customers
                        ?.total || 0,

                from:
                    data.customers
                        ?.from || 0,

                to:
                    data.customers
                        ?.to || 0,
            });
        } catch (requestError) {
            setError(
                requestError.response
                    ?.data?.message ||
                "Unable to load customers."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (
        tab
    ) => {
        setActiveTab(tab);
        setPage(1);
    };

    const handleFilterChange = (
        event
    ) => {
        setLoyaltyTier(
            event.target.value
        );

        setPage(1);
    };

    const handleSortChange = (
        event
    ) => {
        setSort(
            event.target.value
        );

        setPage(1);
    };

    const clearFilters = () => {
        setLoyaltyTier("");
        setSort("recent");
        setPage(1);
    };

    const handleAddInput = (
        event
    ) => {
        const {
            name,
            value,
        } = event.target;

        setAddForm(
            (previous) => ({
                ...previous,
                [name]: value,
            })
        );

        if (addErrors[name]) {
            setAddErrors(
                (previous) => ({
                    ...previous,
                    [name]: null,
                })
            );
        }
    };

    const openAddModal = () => {
        setAddForm(
            defaultAddForm
        );

        setAddErrors({});
        setShowAddModal(true);
    };

    const closeAddModal = () => {
        if (addingCustomer) {
            return;
        }

        setShowAddModal(false);
        setAddErrors({});
    };

    const createCustomer =
        async (event) => {
            event.preventDefault();

            setAddingCustomer(true);
            setAddErrors({});

            try {
                await api.post(
                    "/admin/customers",
                    {
                        name:
                            addForm.name.trim(),

                        email:
                            addForm.email.trim(),

                        phone:
                            addForm.phone.trim() ||
                            null,

                        account_status:
                            addForm.account_status,
                    }
                );

                setShowAddModal(false);
                setAddForm(
                    defaultAddForm
                );

                setActiveTab("all");
                setPage(1);

                await loadCustomers();
            } catch (requestError) {
                const validationErrors =
                    requestError.response
                        ?.data?.errors;

                if (validationErrors) {
                    const formatted = {};

                    Object.keys(
                        validationErrors
                    ).forEach(
                        (key) => {
                            formatted[key] =
                                validationErrors[
                                    key
                                ][0];
                        }
                    );

                    setAddErrors(
                        formatted
                    );
                } else {
                    setAddErrors({
                        general:
                            requestError
                                .response
                                ?.data
                                ?.message ||
                            "Unable to create customer.",
                    });
                }
            } finally {
                setAddingCustomer(false);
            }
        };

    const confirmDelete = (
        customer
    ) => {
        setDeleteCustomer(
            customer
        );
    };

    const closeDeleteModal = () => {
        if (deleting) {
            return;
        }

        setDeleteCustomer(null);
    };

    const handleDelete =
        async () => {
            if (!deleteCustomer) {
                return;
            }

            setDeleting(true);

            try {
                await api.delete(
                    `/admin/customers/${deleteCustomer.id}`
                );

                setDeleteCustomer(null);

                if (
                    customers.length ===
                        1 &&
                    page > 1
                ) {
                    setPage(
                        (current) =>
                            current - 1
                    );

                    return;
                }

                await loadCustomers();
            } catch (requestError) {
                alert(
                    requestError.response
                        ?.data?.message ||
                    "Unable to delete customer."
                );
            } finally {
                setDeleting(false);
            }
        };

    const exportCustomers = () => {
        if (
            !Array.isArray(customers) ||
            customers.length === 0
        ) {
            return;
        }

        const rows = customers.map(
            (customer) => ({
                Name:
                    customer.name || "",

                Email:
                    customer.email || "",

                Phone:
                    customer.phone || "",

                Status:
                    customer.account_label ||
                    "",

                "Loyalty Tier":
                    customer.loyalty_tier ||
                    "bronze",

                Orders:
                    customer.orders_count ||
                    0,

                Spent:
                    customer.spent || 0,

                Points:
                    customer.loyalty_points ||
                    0,

                Tags:
                    Array.isArray(
                        customer.tags
                    )
                        ? customer.tags.join(
                            ", "
                        )
                        : "",
            })
        );

        const headers =
            Object.keys(rows[0]);

        const escapeCell = (
            value
        ) => {
            const stringValue =
                String(
                    value ?? ""
                );

            return `"${stringValue.replace(
                /"/g,
                '""'
            )}"`;
        };

        const csv = [
            headers
                .map(escapeCell)
                .join(","),

            ...rows.map(
                (row) =>
                    headers
                        .map(
                            (header) =>
                                escapeCell(
                                    row[
                                        header
                                    ]
                                )
                        )
                        .join(",")
            ),
        ].join("\n");

        const blob =
            new Blob(
                [csv],
                {
                    type:
                        "text/csv;charset=utf-8;",
                }
            );

        const url =
            URL.createObjectURL(
                blob
            );

        const anchor =
            document.createElement(
                "a"
            );

        anchor.href = url;
        anchor.download =
            "customers.csv";

        document.body.appendChild(
            anchor
        );

        anchor.click();
        anchor.remove();

        URL.revokeObjectURL(
            url
        );
    };

    const hasActiveFilter =
        useMemo(
            () =>
                loyaltyTier !== "" ||
                sort !== "recent",
            [
                loyaltyTier,
                sort,
            ]
        );

    return (
        <div className="min-h-full bg-[#f7f7f8] px-6 py-6">
            <div className="mx-auto max-w-[1600px]">
                <CustomerStats
                    stats={stats}
                />

                <div className="mt-5 overflow-hidden rounded-[14px] border border-[#e5e5e5] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                    <div className="flex items-center justify-between px-6 py-5">
                        <h1 className="text-[22px] font-semibold text-[#151515]">
                            Customers
                        </h1>

                        <button
                            type="button"
                            onClick={
                                openAddModal
                            }
                            className="rounded-[10px] bg-[#2563d9] px-5 py-[11px] text-[14px] font-semibold text-white transition hover:bg-[#1f56c3]"
                        >
                            Add Customer
                        </button>
                    </div>

                    <div className="mx-6 mb-6 overflow-hidden rounded-[12px] border border-[#e3e3e3]">
                        <div className="border-b border-[#e5e5e5] px-5">
                            <div className="flex gap-7">
                                {tabs.map(
                                    (tab) => (
                                        <button
                                            key={
                                                tab.key
                                            }
                                            type="button"
                                            onClick={() =>
                                                handleTabChange(
                                                    tab.key
                                                )
                                            }
                                            className={`relative py-[17px] text-[14px] transition ${
                                                activeTab ===
                                                tab.key
                                                    ? "font-semibold text-[#111111]"
                                                    : "font-medium text-[#6d6d6d] hover:text-[#222222]"
                                            }`}
                                        >
                                            {
                                                tab.label
                                            }

                                            <span className="ml-1 text-[12px] text-[#8a8a8a]">
                                                {
                                                    tabCounts[
                                                        tab
                                                            .key
                                                    ]
                                                }
                                            </span>

                                            {activeTab ===
                                                tab.key && (
                                                <span className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-[#111111]" />
                                            )}
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e5e5] px-4 py-3">
                            <div className="w-full max-w-[500px]">
                                <input
                                    type="text"
                                    value={
                                        searchInput
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearchInput(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Search by name or email"
                                    className="h-[42px] w-full rounded-[9px] border border-[#bfc4cb] bg-white px-4 text-[14px] text-[#222222] outline-none transition placeholder:text-[#969696] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]"
                                />
                            </div>

                            <div className="relative flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={
                                        exportCustomers
                                    }
                                    className="h-[40px] rounded-[9px] border border-[#dddddd] bg-white px-4 text-[13px] font-medium text-[#252525] transition hover:bg-[#f8f8f8]"
                                >
                                    Export
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowFilter(
                                            (
                                                current
                                            ) =>
                                                !current
                                        )
                                    }
                                    className={`h-[40px] rounded-[9px] border px-4 text-[13px] font-medium transition ${
                                        hasActiveFilter
                                            ? "border-[#2563eb] bg-[#eff6ff] text-[#1d4ed8]"
                                            : "border-[#dddddd] bg-white text-[#252525] hover:bg-[#f8f8f8]"
                                    }`}
                                >
                                    Filter
                                </button>

                                {showFilter && (
                                    <div className="absolute right-0 top-[48px] z-30 w-[280px] rounded-[12px] border border-[#e1e1e1] bg-white p-4 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
                                        <div>
                                            <label className="mb-2 block text-[12px] font-semibold text-[#424242]">
                                                Loyalty
                                                tier
                                            </label>

                                            <select
                                                value={
                                                    loyaltyTier
                                                }
                                                onChange={
                                                    handleFilterChange
                                                }
                                                className="h-[40px] w-full rounded-[8px] border border-[#dddddd] bg-white px-3 text-[13px] outline-none focus:border-[#2563eb]"
                                            >
                                                {loyaltyOptions.map(
                                                    (
                                                        option
                                                    ) => (
                                                        <option
                                                            key={
                                                                option.value
                                                            }
                                                            value={
                                                                option.value
                                                            }
                                                        >
                                                            {
                                                                option.label
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div className="mt-4">
                                            <label className="mb-2 block text-[12px] font-semibold text-[#424242]">
                                                Sort
                                                by
                                            </label>

                                            <select
                                                value={
                                                    sort
                                                }
                                                onChange={
                                                    handleSortChange
                                                }
                                                className="h-[40px] w-full rounded-[8px] border border-[#dddddd] bg-white px-3 text-[13px] outline-none focus:border-[#2563eb]"
                                            >
                                                {sortOptions.map(
                                                    (
                                                        option
                                                    ) => (
                                                        <option
                                                            key={
                                                                option.value
                                                            }
                                                            value={
                                                                option.value
                                                            }
                                                        >
                                                            {
                                                                option.label
                                                            }
                                                        </option>
                                                    )
                                                )}
                                            </select>
                                        </div>

                                        <div className="mt-4 flex justify-end">
                                            <button
                                                type="button"
                                                onClick={
                                                    clearFilters
                                                }
                                                className="text-[13px] font-medium text-[#2563eb] hover:underline"
                                            >
                                                Clear
                                                filters
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div className="border-b border-[#f3cccc] bg-[#fff5f5] px-5 py-3 text-[13px] text-[#c62828]">
                                {error}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1050px] border-collapse">
                                <thead>
                                    <tr className="border-b border-[#e7e7e7] bg-white">
                                        <th className="w-[46px] px-4 py-[14px] text-left">
                                            <input
                                                type="checkbox"
                                                disabled
                                                className="h-4 w-4 rounded border-[#d6d6d6]"
                                            />
                                        </th>

                                        <TableHeader>
                                            Customer
                                        </TableHeader>

                                        <TableHeader>
                                            Account
                                        </TableHeader>

                                        <TableHeader>
                                            Loyalty
                                            tier
                                        </TableHeader>

                                        <TableHeader>
                                            Orders
                                        </TableHeader>

                                        <TableHeader>
                                            Spent
                                        </TableHeader>

                                        <TableHeader>
                                            Last active
                                        </TableHeader>

                                        <TableHeader>
                                            Points
                                        </TableHeader>

                                        <TableHeader>
                                            Tags
                                        </TableHeader>

                                        <TableHeader
                                            align="right"
                                        >
                                            Actions
                                        </TableHeader>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <LoadingRows />
                                    ) : customers.length >
                                      0 ? (
                                        customers.map(
                                            (
                                                customer
                                            ) => (
                                                <CustomerRow
                                                    key={
                                                        customer.id
                                                    }
                                                    customer={
                                                        customer
                                                    }
                                                    onEdit={() =>
                                                        navigate(
                                                            `/admin/customers/${customer.id}/edit`
                                                        )
                                                    }
                                                    onDelete={() =>
                                                        confirmDelete(
                                                            customer
                                                        )
                                                    }
                                                />
                                            )
                                        )
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={
                                                    10
                                                }
                                                className="px-5 py-16 text-center"
                                            >
                                                <div className="text-[15px] font-semibold text-[#242424]">
                                                    No
                                                    customers
                                                    found
                                                </div>

                                                <div className="mt-1 text-[13px] text-[#858585]">
                                                    Try
                                                    changing
                                                    your
                                                    search
                                                    or
                                                    filters.
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            pagination={
                                pagination
                            }
                            loading={
                                loading
                            }
                            onPrevious={() =>
                                setPage(
                                    (
                                        current
                                    ) =>
                                        Math.max(
                                            1,
                                            current -
                                                1
                                        )
                                )
                            }
                            onNext={() =>
                                setPage(
                                    (
                                        current
                                    ) =>
                                        Math.min(
                                            pagination.last_page,
                                            current +
                                                1
                                        )
                                )
                            }
                        />
                    </div>
                </div>
            </div>

            {showAddModal && (
                <AddCustomerModal
                    form={addForm}
                    errors={addErrors}
                    saving={
                        addingCustomer
                    }
                    onChange={
                        handleAddInput
                    }
                    onSubmit={
                        createCustomer
                    }
                    onClose={
                        closeAddModal
                    }
                />
            )}

            {deleteCustomer && (
                <DeleteCustomerModal
                    customer={
                        deleteCustomer
                    }
                    deleting={
                        deleting
                    }
                    onClose={
                        closeDeleteModal
                    }
                    onDelete={
                        handleDelete
                    }
                />
            )}
        </div>
    );
}

function CustomerStats({
    stats,
}) {
    const cards = [
        {
            label:
                "Total Customers",
            value:
                formatNumber(
                    stats.total_customers
                ),
            description:
                "All customer profiles",
        },
        {
            label:
                "Active Accounts",
            value:
                formatNumber(
                    stats.active_accounts
                ),
            description:
                "Able to place orders",
        },
        {
            label:
                "VIP Customers",
            value:
                formatNumber(
                    stats.vip_customers
                ),
            description:
                "Gold and platinum tiers",
        },
        {
            label:
                "Customer Spend",
            value:
                formatCurrency(
                    stats.customer_spend
                ),
            description:
                "Lifetime total spending",
        },
        {
            label:
                "Avg Spend / Customer",
            value:
                formatCurrency(
                    stats.average_spend_per_customer
                ),
            description:
                "Average customer value",
        },
    ];

    return (
        <div className="grid overflow-hidden rounded-[14px] border border-[#e4e4e4] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)] md:grid-cols-2 xl:grid-cols-5">
            {cards.map(
                (
                    card,
                    index
                ) => (
                    <div
                        key={
                            card.label
                        }
                        className={`min-h-[126px] px-6 py-5 ${
                            index <
                            cards.length -
                                1
                                ? "border-b border-[#e5e5e5] md:border-r xl:border-b-0"
                                : ""
                        }`}
                    >
                        <div className="text-[15px] font-medium text-[#222222]">
                            {
                                card.label
                            }
                        </div>

                        <div className="mt-2 text-[25px] font-semibold leading-none tracking-[-0.02em] text-[#111111]">
                            {
                                card.value
                            }
                        </div>

                        <div className="mt-3 text-[13px] text-[#777777]">
                            {
                                card.description
                            }
                        </div>
                    </div>
                )
            )}
        </div>
    );
}

function CustomerRow({
    customer,
    onEdit,
    onDelete,
}) {
    const tags =
        Array.isArray(
            customer.tags
        )
            ? customer.tags
            : [];

    return (
        <tr className="border-b border-[#e8e8e8] transition last:border-b-0 hover:bg-[#fafafa]">
            <td className="px-4 py-[14px]">
                <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#d6d6d6]"
                />
            </td>

            <td className="px-3 py-[14px]">
                <div className="flex min-w-[220px] items-center gap-3">
                    <CustomerAvatar
                        customer={
                            customer
                        }
                    />

                    <div className="min-w-0">
                        <div className="truncate text-[14px] font-semibold text-[#171717]">
                            {customer.name ||
                                "Customer"}
                        </div>

                        <div className="mt-[2px] truncate text-[12px] text-[#7d7d7d]">
                            {
                                customer.email
                            }
                        </div>
                    </div>
                </div>
            </td>

            <td className="px-3 py-[14px]">
                <StatusBadge
                    status={
                        customer.account_status
                    }
                    label={
                        customer.account_label
                    }
                />
            </td>

            <td className="px-3 py-[14px]">
                <LoyaltyBadge
                    tier={
                        customer.loyalty_tier
                    }
                />
            </td>

            <td className="px-3 py-[14px] text-[14px] text-[#242424]">
                {formatNumber(
                    customer.orders_count
                )}
            </td>

            <td className="px-3 py-[14px] text-[14px] font-medium text-[#242424]">
                {formatCurrency(
                    customer.spent
                )}
            </td>

            <td className="px-3 py-[14px] text-[13px] text-[#343434]">
                {customer.last_active_formatted ||
                    "—"}
            </td>

            <td className="px-3 py-[14px] text-[14px] text-[#242424]">
                {formatNumber(
                    customer.loyalty_points
                )}
            </td>

            <td className="max-w-[190px] px-3 py-[14px]">
                {tags.length >
                0 ? (
                    <div className="flex flex-wrap gap-1">
                        {tags
                            .slice(
                                0,
                                2
                            )
                            .map(
                                (
                                    tag
                                ) => (
                                    <span
                                        key={
                                            tag
                                        }
                                        className="rounded-full bg-[#f1f1f1] px-2 py-1 text-[11px] font-medium text-[#555555]"
                                    >
                                        {
                                            tag
                                        }
                                    </span>
                                )
                            )}

                        {tags.length >
                            2 && (
                            <span className="rounded-full bg-[#f1f1f1] px-2 py-1 text-[11px] font-medium text-[#555555]">
                                +
                                {tags.length -
                                    2}
                            </span>
                        )}
                    </div>
                ) : (
                    <span className="text-[13px] text-[#777777]">
                        -
                    </span>
                )}
            </td>

            <td className="px-4 py-[14px]">
                <div className="flex justify-end">
                    <div className="inline-flex overflow-hidden rounded-[8px] border border-[#dddddd] bg-white">
                        <button
                            type="button"
                            onClick={
                                onEdit
                            }
                            className="border-r border-[#dddddd] px-3 py-[7px] text-[12px] font-medium text-[#373737] transition hover:bg-[#f5f5f5]"
                        >
                            Edit
                        </button>

                        <button
                            type="button"
                            onClick={
                                onDelete
                            }
                            className="px-3 py-[7px] text-[12px] font-medium text-[#dc2626] transition hover:bg-[#fff4f4]"
                        >
                            Delete
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
}

function CustomerAvatar({
    customer,
}) {
    if (
        customer.photo_url
    ) {
        return (
            <img
                src={
                    customer.photo_url
                }
                alt={
                    customer.name ||
                    "Customer"
                }
                className="h-[40px] w-[40px] shrink-0 rounded-full border border-[#eeeeee] object-cover"
            />
        );
    }

    return (
        <div className="flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full bg-[#f3f3f3] text-[13px] font-medium text-[#353535]">
            {getInitials(
                customer.name
            )}
        </div>
    );
}

function StatusBadge({
    status,
    label,
}) {
    const styles = {
        active:
            "bg-[#eafaf1] text-[#138a4a]",

        banned:
            "bg-[#fff0f0] text-[#d62828]",

        suspended:
            "bg-[#fff6e5] text-[#a76a00]",

        pending_activation:
            "bg-[#f3f3f3] text-[#666666]",
    };

    return (
        <span
            className={`inline-flex rounded-full px-[10px] py-[4px] text-[11px] font-semibold ${
                styles[
                    status
                ] ||
                "bg-[#f3f3f3] text-[#666666]"
            }`}
        >
            {label ||
                "Inactive"}
        </span>
    );
}

function LoyaltyBadge({
    tier,
}) {
    const value =
        String(
            tier ||
                "bronze"
        ).toLowerCase();

    const styles = {
        bronze:
            "bg-[#f7f2ff] text-[#665075]",

        silver:
            "bg-[#f1f3f5] text-[#606872]",

        gold:
            "bg-[#fff6d8] text-[#9a6700]",

        platinum:
            "bg-[#eaf7f7] text-[#27706f]",
    };

    return (
        <span
            className={`inline-flex rounded-full px-[10px] py-[4px] text-[11px] font-medium capitalize ${
                styles[value] ||
                styles.bronze
            }`}
        >
            {value}
        </span>
    );
}

function TableHeader({
    children,
    align = "left",
}) {
    return (
        <th
            className={`whitespace-nowrap px-3 py-[14px] text-[12px] font-medium text-[#666666] ${
                align ===
                "right"
                    ? "text-right"
                    : "text-left"
            }`}
        >
            {children}
        </th>
    );
}

function LoadingRows() {
    return Array.from({
        length: 5,
    }).map(
        (_, index) => (
            <tr
                key={
                    index
                }
                className="border-b border-[#eeeeee]"
            >
                <td
                    colSpan={
                        10
                    }
                    className="px-4 py-4"
                >
                    <div className="h-[42px] animate-pulse rounded-[8px] bg-[#f3f3f3]" />
                </td>
            </tr>
        )
    );
}

function Pagination({
    pagination,
    loading,
    onPrevious,
    onNext,
}) {
    const previousDisabled =
        loading ||
        pagination.current_page <=
            1;

    const nextDisabled =
        loading ||
        pagination.current_page >=
            pagination.last_page;

    return (
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e5e5e5] px-5 py-4">
            <div className="text-[12px] text-[#747474]">
                Showing{" "}
                {pagination.total >
                0
                    ? pagination.from
                    : 0}
                {" - "}
                {pagination.total >
                0
                    ? pagination.to
                    : 0}
                {" of "}
                {
                    pagination.total
                }
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={
                        previousDisabled
                    }
                    onClick={
                        onPrevious
                    }
                    className="h-[36px] rounded-[8px] border border-[#dddddd] bg-white px-4 text-[12px] font-medium text-[#555555] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Previous
                </button>

                <div className="flex h-[36px] min-w-[52px] items-center justify-center rounded-[8px] border border-[#dddddd] bg-white px-3 text-[12px] font-medium text-[#333333]">
                    {
                        pagination.current_page
                    }
                    {" / "}
                    {
                        pagination.last_page
                    }
                </div>

                <button
                    type="button"
                    disabled={
                        nextDisabled
                    }
                    onClick={
                        onNext
                    }
                    className="h-[36px] rounded-[8px] border border-[#dddddd] bg-white px-4 text-[12px] font-medium text-[#555555] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

function AddCustomerModal({
    form,
    errors,
    saving,
    onChange,
    onSubmit,
    onClose,
}) {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-[520px] overflow-hidden rounded-[16px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
                <div className="flex items-start justify-between border-b border-[#eeeeee] px-6 py-5">
                    <div>
                        <h2 className="text-[20px] font-semibold text-[#171717]">
                            Add
                            customer
                        </h2>

                        <p className="mt-1 text-[13px] text-[#777777]">
                            Create a
                            new
                            customer
                            account.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onClose
                        }
                        className="text-[22px] leading-none text-[#777777] hover:text-[#222222]"
                    >
                        ×
                    </button>
                </div>

                <form
                    onSubmit={
                        onSubmit
                    }
                >
                    <div className="space-y-4 px-6 py-5">
                        {errors.general && (
                            <div className="rounded-[8px] bg-[#fff2f2] px-4 py-3 text-[13px] text-[#c62828]">
                                {
                                    errors.general
                                }
                            </div>
                        )}

                        <FormField
                            label="Full name"
                            required
                            error={
                                errors.name
                            }
                        >
                            <input
                                type="text"
                                name="name"
                                value={
                                    form.name
                                }
                                onChange={
                                    onChange
                                }
                                placeholder="Customer name"
                                className={
                                    inputClass
                                }
                            />
                        </FormField>

                        <FormField
                            label="Email"
                            required
                            error={
                                errors.email
                            }
                        >
                            <input
                                type="email"
                                name="email"
                                value={
                                    form.email
                                }
                                onChange={
                                    onChange
                                }
                                placeholder="customer@example.com"
                                className={
                                    inputClass
                                }
                            />
                        </FormField>

                        <FormField
                            label="Phone"
                            error={
                                errors.phone
                            }
                        >
                            <input
                                type="text"
                                name="phone"
                                value={
                                    form.phone
                                }
                                onChange={
                                    onChange
                                }
                                placeholder="e.g. +1 555 0123"
                                className={
                                    inputClass
                                }
                            />
                        </FormField>

                        <FormField
                            label="Account status"
                            error={
                                errors.account_status
                            }
                        >
                            <select
                                name="account_status"
                                value={
                                    form.account_status
                                }
                                onChange={
                                    onChange
                                }
                                className={
                                    inputClass
                                }
                            >
                                <option value="active">
                                    Active
                                </option>

                                <option value="pending_activation">
                                    Inactive
                                </option>

                                <option value="suspended">
                                    Suspended
                                </option>

                                <option value="banned">
                                    Banned
                                </option>
                            </select>
                        </FormField>
                    </div>

                    <div className="flex justify-end gap-3 border-t border-[#eeeeee] px-6 py-4">
                        <button
                            type="button"
                            disabled={
                                saving
                            }
                            onClick={
                                onClose
                            }
                            className="h-[40px] rounded-[9px] border border-[#dddddd] bg-white px-5 text-[13px] font-semibold text-[#444444] hover:bg-[#f8f8f8]"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                saving
                            }
                            className="h-[40px] rounded-[9px] bg-[#2563d9] px-5 text-[13px] font-semibold text-white transition hover:bg-[#1f56c3] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving
                                ? "Creating..."
                                : "Add Customer"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeleteCustomerModal({
    customer,
    deleting,
    onClose,
    onDelete,
}) {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="relative w-full max-w-[450px] overflow-hidden rounded-[16px] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
                <div className="h-[4px] bg-[#dc2626]" />

                <button
                    type="button"
                    onClick={
                        onClose
                    }
                    className="absolute right-5 top-5 text-[22px] leading-none text-[#888888] hover:text-[#222222]"
                >
                    ×
                </button>

                <div className="px-7 pb-6 pt-7">
                    <div className="mb-4 flex h-[48px] w-[48px] items-center justify-center rounded-full bg-[#fff0f0] text-[20px] font-semibold text-[#dc2626]">
                        !
                    </div>

                    <h2 className="text-[20px] font-semibold text-[#171717]">
                        Delete
                        Customer
                    </h2>

                    <p className="mt-3 text-[14px] leading-6 text-[#5f5f5f]">
                        Are you
                        sure you
                        want to
                        delete{" "}
                        <span className="font-semibold text-[#222222]">
                            {customer.name}
                        </span>
                        ?
                    </p>

                    <p className="mt-1 text-[13px] text-[#8a8a8a]">
                        This
                        action
                        cannot be
                        undone.
                    </p>

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            disabled={
                                deleting
                            }
                            onClick={
                                onClose
                            }
                            className="h-[40px] rounded-[9px] border border-[#dddddd] bg-white px-5 text-[13px] font-semibold text-[#444444] hover:bg-[#f8f8f8]"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            disabled={
                                deleting
                            }
                            onClick={
                                onDelete
                            }
                            className="h-[40px] rounded-[9px] bg-[#dc2626] px-5 text-[13px] font-semibold text-white transition hover:bg-[#c51f1f] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {deleting
                                ? "Deleting..."
                                : "Delete Customer"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FormField({
    label,
    required = false,
    error,
    children,
}) {
    return (
        <div>
            <label className="mb-2 block text-[13px] font-medium text-[#292929]">
                {label}

                {required && (
                    <span className="ml-1 text-[#dc2626]">
                        *
                    </span>
                )}
            </label>

            {children}

            {error && (
                <p className="mt-1 text-[12px] text-[#dc2626]">
                    {error}
                </p>
            )}
        </div>
    );
}

const inputClass =
    "h-[42px] w-full rounded-[9px] border border-[#dddddd] bg-white px-3 text-[14px] text-[#222222] outline-none placeholder:text-[#999999] focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]";

function formatCurrency(
    value
) {
    const number =
        Number(value || 0);

    return new Intl.NumberFormat(
        "en-US",
        {
            style:
                "currency",
            currency:
                "USD",
            minimumFractionDigits:
                2,
            maximumFractionDigits:
                2,
        }
    ).format(number);
}

function formatNumber(
    value
) {
    return new Intl.NumberFormat(
        "en-US"
    ).format(
        Number(
            value || 0
        )
    );
}

function getInitials(
    name
) {
    const value =
        String(
            name || ""
        ).trim();

    if (!value) {
        return "C";
    }

    const parts =
        value
            .split(/\s+/)
            .filter(
                Boolean
            );

    if (
        parts.length ===
        1
    ) {
        return parts[0]
            .slice(
                0,
                1
            )
            .toUpperCase();
    }

    return (
        parts[0]
            .slice(
                0,
                1
            ) +
        parts[
            parts.length -
                1
        ]
            .slice(
                0,
                1
            )
    ).toUpperCase();
}

export default AdminCustomers;