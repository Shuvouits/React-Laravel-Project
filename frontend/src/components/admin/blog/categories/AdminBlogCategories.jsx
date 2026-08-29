import {
    useCallback,
    useEffect,
    useState,
} from "react";

import {
    AlertCircle,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    LoaderCircle,
    Pencil,
    Plus,
    RefreshCw,
    Search,
    Trash2,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import api from "../../../../api/axios";

import BlogCategoryDeleteModal
    from "../../../../components/admin/blog/categories/BlogCategoryDeleteModal";

import {
    getErrorMessage,
} from "../../../../components/admin/blog/categories/blogCategoryConfig";

const EMPTY_PAGINATION = {
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
    from: null,
    to: null,
};

const AdminBlogCategories = () => {
    const navigate = useNavigate();

    const [categories, setCategories] =
        useState([]);

    const [pagination, setPagination] =
        useState(EMPTY_PAGINATION);

    const [page, setPage] =
        useState(1);

    const [perPage, setPerPage] =
        useState(20);

    const [searchInput, setSearchInput] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    const [
        deleteCategory,
        setDeleteCategory,
    ] = useState(null);

    const [deleting, setDeleting] =
        useState(false);

    useEffect(() => {
        const timer = window.setTimeout(
            () => {
                setPage(1);
                setSearch(
                    searchInput.trim()
                );
            },
            350
        );

        return () => {
            window.clearTimeout(timer);
        };
    }, [searchInput]);

    const fetchCategories = useCallback(
        async () => {
            setLoading(true);
            setErrorMessage("");

            try {
                const response = await api.get(
                    "/admin/blog-categories",
                    {
                        params: {
                            page,
                            per_page: perPage,
                            search:
                                search ||
                                undefined,
                        },
                    }
                );

                setCategories(
                    response.data?.categories ||
                        []
                );

                setPagination({
                    ...EMPTY_PAGINATION,
                    ...(
                        response.data
                            ?.pagination || {}
                    ),
                });
            } catch (error) {
                setCategories([]);

                setErrorMessage(
                    getErrorMessage(
                        error,
                        "Failed to load blog categories."
                    )
                );
            } finally {
                setLoading(false);
            }
        },
        [
            page,
            perPage,
            search,
        ]
    );

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => {
        if (!successMessage) {
            return;
        }

        const timer = window.setTimeout(
            () => {
                setSuccessMessage("");
            },
            3500
        );

        return () => {
            window.clearTimeout(timer);
        };
    }, [successMessage]);

    const goToPage = (nextPage) => {
        const safePage = Math.min(
            Math.max(
                Number(nextPage),
                1
            ),
            pagination.last_page || 1
        );

        setPage(safePage);
    };

    const handlePerPageChange = (
        event
    ) => {
        setPerPage(
            Number(event.target.value)
        );

        setPage(1);
    };

    const handleDelete = async () => {
        if (!deleteCategory) {
            return;
        }

        setDeleting(true);
        setErrorMessage("");

        try {
            const response =
                await api.delete(
                    `/admin/blog-categories/${deleteCategory.id}`
                );

            setDeleteCategory(null);

            setSuccessMessage(
                response.data?.message ||
                    "Blog category deleted successfully."
            );

            if (
                categories.length === 1 &&
                page > 1
            ) {
                setPage(
                    (previous) =>
                        previous - 1
                );
            } else {
                await fetchCategories();
            }
        } catch (error) {
            setDeleteCategory(null);

            setErrorMessage(
                getErrorMessage(
                    error,
                    "Failed to delete blog category."
                )
            );
        } finally {
            setDeleting(false);
        }
    };

    const hasResults =
        categories.length > 0;

    return (
        <div className="min-h-full bg-[#f6f6f7] p-6 lg:p-7">
            {/* Notifications */}
            {successMessage && (
                <div className="fixed right-6 top-6 z-[250] flex max-w-[380px] items-start gap-3 rounded-[13px] border border-emerald-200 bg-white px-4 py-3 text-[13px] text-emerald-700 shadow-[0_16px_45px_rgba(0,0,0,0.12)]">
                    <CheckCircle2
                        size={18}
                        className="mt-0.5 shrink-0"
                    />

                    <span>
                        {successMessage}
                    </span>
                </div>
            )}

            <section className="mx-auto overflow-hidden rounded-[18px] border border-[#dfe1e4] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                {/* Header */}
                <div className="flex flex-col gap-4 border-b border-[#e5e6e8] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-[#111214]">
                            Blog categories
                        </h1>

                        <p className="mt-1 text-[13px] text-[#7b7e86]">
                            Organize blog posts
                            into categories for
                            easier discovery.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            navigate(
                                "/admin/content/blog-categories/new"
                            )
                        }
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2167d9] px-5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#1859c2]"
                    >
                        <Plus
                            size={17}
                            strokeWidth={2}
                        />

                        Add Category
                    </button>
                </div>

                {/* Search */}
                <div className="border-b border-[#e5e6e8] px-6 py-4">
                    <div className="relative max-w-[560px]">
                        <Search
                            size={17}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#95989f]"
                        />

                        <input
                            type="search"
                            value={searchInput}
                            onChange={(event) =>
                                setSearchInput(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="Search categories..."
                            className="h-11 w-full rounded-[12px] border border-[#dfe1e5] bg-white pl-11 pr-4 text-[14px] text-[#17181a] outline-none transition placeholder:text-[#9a9da4] focus:border-[#76a9ff] focus:ring-2 focus:ring-blue-100"
                        />
                    </div>
                </div>

                {/* Error */}
                {errorMessage && (
                    <div className="mx-6 mt-5 flex items-start justify-between gap-4 rounded-[13px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                        <div className="flex items-start gap-3">
                            <AlertCircle
                                size={18}
                                className="mt-0.5 shrink-0"
                            />

                            <span>
                                {errorMessage}
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={
                                fetchCategories
                            }
                            className="inline-flex shrink-0 items-center gap-1.5 font-semibold hover:text-red-900"
                        >
                            <RefreshCw
                                size={14}
                            />
                            Retry
                        </button>
                    </div>
                )}

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] border-collapse">
                        <thead>
                            <tr className="border-b border-[#e5e6e8] bg-[#fcfcfc] text-left">
                                <th className="px-7 py-4 text-[13px] font-medium text-[#666a72]">
                                    Name
                                </th>

                                <th className="w-[170px] px-5 py-4 text-[13px] font-medium text-[#666a72]">
                                    Posts
                                </th>

                                <th className="w-[190px] px-5 py-4 text-[13px] font-medium text-[#666a72]">
                                    Status
                                </th>

                                <th className="w-[150px] px-7 py-4 text-right text-[13px] font-medium text-[#666a72]">
                                    Actions
                                </th>
                            </tr>
                        </thead>

                        <tbody>
                            {loading ? (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="h-[300px] text-center"
                                    >
                                        <div className="flex flex-col items-center justify-center">
                                            <LoaderCircle
                                                size={28}
                                                className="animate-spin text-[#2167d9]"
                                            />

                                            <span className="mt-3 text-[13px] text-[#7b7e86]">
                                                Loading
                                                blog
                                                categories...
                                            </span>
                                        </div>
                                    </td>
                                </tr>
                            ) : hasResults ? (
                                categories.map(
                                    (
                                        category
                                    ) => (
                                        <tr
                                            key={
                                                category.id
                                            }
                                            className="border-b border-[#ececef] transition last:border-b-0 hover:bg-[#fbfbfc]"
                                        >
                                            <td className="px-7 py-5">
                                                <div className="max-w-[580px]">
                                                    <p className="text-[14px] font-semibold text-[#151619]">
                                                        {
                                                            category.name
                                                        }
                                                    </p>

                                                    <p className="mt-1 text-[12px] text-[#7b7e86]">
                                                        /
                                                        {
                                                            category.slug
                                                        }
                                                    </p>

                                                    {category.description && (
                                                        <p className="mt-1.5 line-clamp-1 text-[12px] text-[#999ca3]">
                                                            {
                                                                category.description
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="px-5 py-5">
                                                <span className="text-[14px] font-medium text-[#33353a]">
                                                    {Number(
                                                        category.posts_count ||
                                                            0
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-5 py-5">
                                                <span
                                                    className={`
                                                        inline-flex
                                                        min-w-[62px]
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        px-3
                                                        py-1
                                                        text-[11px]
                                                        font-semibold
                                                        ${
                                                            category.is_active
                                                                ? "bg-[#2167d9] text-white"
                                                                : "bg-[#ededee] text-[#72757c]"
                                                        }
                                                    `}
                                                >
                                                    {category.is_active
                                                        ? "Active"
                                                        : "Inactive"}
                                                </span>
                                            </td>

                                            <td className="px-7 py-5">
                                                <div className="flex justify-end">
                                                    <div className="inline-flex overflow-hidden rounded-[11px] border border-[#dfe1e4] bg-white">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                navigate(
                                                                    `/admin/content/blog-categories/${category.id}/edit`
                                                                )
                                                            }
                                                            title={`Edit ${category.name}`}
                                                            className="flex h-9 w-10 items-center justify-center text-[#686b72] transition hover:bg-[#f4f6f9] hover:text-[#2167d9]"
                                                        >
                                                            <Pencil
                                                                size={
                                                                    16
                                                                }
                                                                strokeWidth={
                                                                    1.8
                                                                }
                                                            />
                                                        </button>

                                                        <div className="w-px bg-[#dfe1e4]" />

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setDeleteCategory(
                                                                    category
                                                                )
                                                            }
                                                            title={`Delete ${category.name}`}
                                                            className="flex h-9 w-10 items-center justify-center text-[#777a81] transition hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <Trash2
                                                                size={
                                                                    16
                                                                }
                                                                strokeWidth={
                                                                    1.8
                                                                }
                                                            />
                                                        </button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )
                            ) : (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="h-[320px] px-6 text-center"
                                    >
                                        <div className="mx-auto max-w-[360px]">
                                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f1f5ff] text-[#2167d9]">
                                                <Search
                                                    size={
                                                        23
                                                    }
                                                />
                                            </div>

                                            <h3 className="mt-4 text-[16px] font-semibold text-[#17181a]">
                                                {search
                                                    ? "No matching categories"
                                                    : "No blog categories yet"}
                                            </h3>

                                            <p className="mt-2 text-[13px] leading-6 text-[#7b7e86]">
                                                {search
                                                    ? `No category matched “${search}”. Try another search term.`
                                                    : "Create the first category to organize your blog posts."}
                                            </p>

                                            {!search && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            "/admin/content/blog-categories/new"
                                                        )
                                                    }
                                                    className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2167d9] px-5 text-[13px] font-semibold text-white transition hover:bg-[#1859c2]"
                                                >
                                                    <Plus
                                                        size={
                                                            16
                                                        }
                                                    />
                                                    Add
                                                    Category
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!loading && (
                    <div className="flex flex-col gap-4 border-t border-[#e5e6e8] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-[13px] text-[#73767e]">
                            {pagination.total > 0
                                ? `Showing ${pagination.from} to ${pagination.to} of ${pagination.total} results`
                                : "Showing 0 results"}
                        </p>

                        <div className="flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 text-[13px] text-[#73767e]">
                                Rows per page

                                <select
                                    value={
                                        perPage
                                    }
                                    onChange={
                                        handlePerPageChange
                                    }
                                    className="h-10 rounded-[11px] border border-[#dfe1e4] bg-white px-3 text-[13px] text-[#24262a] outline-none focus:border-[#76a9ff]"
                                >
                                    <option value="10">
                                        10
                                    </option>
                                    <option value="20">
                                        20
                                    </option>
                                    <option value="50">
                                        50
                                    </option>
                                    <option value="100">
                                        100
                                    </option>
                                </select>
                            </label>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() =>
                                        goToPage(
                                            1
                                        )
                                    }
                                    disabled={
                                        pagination.current_page <=
                                        1
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e0e2e5] bg-white text-[#666970] transition hover:bg-[#f5f6f7] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronsLeft
                                        size={16}
                                    />
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        goToPage(
                                            pagination.current_page -
                                                1
                                        )
                                    }
                                    disabled={
                                        pagination.current_page <=
                                        1
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e0e2e5] bg-white text-[#666970] transition hover:bg-[#f5f6f7] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft
                                        size={16}
                                    />
                                </button>

                                <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#2167d9] px-3 text-[13px] font-semibold text-white">
                                    {
                                        pagination.current_page
                                    }
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        goToPage(
                                            pagination.current_page +
                                                1
                                        )
                                    }
                                    disabled={
                                        pagination.current_page >=
                                        pagination.last_page
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e0e2e5] bg-white text-[#666970] transition hover:bg-[#f5f6f7] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronRight
                                        size={16}
                                    />
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        goToPage(
                                            pagination.last_page
                                        )
                                    }
                                    disabled={
                                        pagination.current_page >=
                                        pagination.last_page
                                    }
                                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e0e2e5] bg-white text-[#666970] transition hover:bg-[#f5f6f7] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronsRight
                                        size={16}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </section>

            <BlogCategoryDeleteModal
                open={Boolean(
                    deleteCategory
                )}
                category={deleteCategory}
                deleting={deleting}
                onClose={() => {
                    if (!deleting) {
                        setDeleteCategory(
                            null
                        );
                    }
                }}
                onConfirm={
                    handleDelete
                }
            />
        </div>
    );
};

export default AdminBlogCategories;