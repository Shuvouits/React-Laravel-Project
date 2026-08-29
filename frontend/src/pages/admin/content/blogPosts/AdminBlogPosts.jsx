import {
    Archive,
    ArrowDownUp,
    CalendarClock,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    ExternalLink,
    Eye,
    FileEdit,
    FileText,
    LoaderCircle,
    MessageCircle,
    Pencil,
    Plus,
    Search,
    Star,
    Tags,
    Trash2,
    X,
} from "lucide-react";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
    useNavigate,
} from "react-router-dom";

import api from "../../../../api/axios";

import {
    BLOG_POST_TABS,
    formatBlogDate,
    getErrorMessage,
    getPostStatusClass,
    getPostStatusLabel,
} from "../../../../components/admin/blog/posts/blogPostConfig";

const DEFAULT_STATS = {
    total: 0,
    published: 0,
    draft: 0,
    scheduled: 0,
    archived: 0,
    total_views: 0,
};

const AdminBlogPosts = () => {
    const navigate = useNavigate();

    const [posts, setPosts] = useState([]);
    const [stats, setStats] = useState(
        DEFAULT_STATS
    );

    const [activeTab, setActiveTab] =
        useState("all");

    const [searchInput, setSearchInput] =
        useState("");

    const [search, setSearch] = useState("");

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] =
        useState(20);

    const [pagination, setPagination] =
        useState({
            current_page: 1,
            last_page: 1,
            per_page: 20,
            total: 0,
            from: 0,
            to: 0,
        });

    const [loading, setLoading] =
        useState(true);

    const [deleting, setDeleting] =
        useState(false);

    const [error, setError] =
        useState("");

    const [deletePost, setDeletePost] =
        useState(null);

    useEffect(() => {
        const timeout = window.setTimeout(
            () => {
                setSearch(searchInput.trim());
                setPage(1);
            },
            450
        );

        return () => {
            window.clearTimeout(timeout);
        };
    }, [searchInput]);

    const loadPosts = useCallback(
        async () => {
            setLoading(true);
            setError("");

            try {
                const params = {
                    page,
                    per_page: perPage,
                };

                if (search) {
                    params.search = search;
                }

                if (activeTab !== "all") {
                    params.status = activeTab;
                }

                const response = await api.get(
                    "/admin/blog-posts",
                    {
                        params,
                    }
                );

                const responseData =
                    response.data?.data ||
                    response.data ||
                    {};

                const postsContainer =
                    responseData.posts ||
                    responseData;

                const rows = Array.isArray(
                    postsContainer?.data
                )
                    ? postsContainer.data
                    : Array.isArray(
                        responseData.posts
                    )
                        ? responseData.posts
                        : Array.isArray(
                            responseData.data
                        )
                            ? responseData.data
                            : [];

                setPosts(rows);

                const statistics =
                    responseData.stats ||
                    responseData.statistics ||
                    response.data?.stats ||
                    {};

                setStats({
                    total: Number(
                        statistics.total ??
                        statistics.total_posts ??
                        0
                    ),
                    published: Number(
                        statistics.published ?? 0
                    ),
                    draft: Number(
                        statistics.draft ??
                        statistics.drafts ??
                        0
                    ),
                    scheduled: Number(
                        statistics.scheduled ?? 0
                    ),
                    archived: Number(
                        statistics.archived ?? 0
                    ),
                    total_views: Number(
                        statistics.total_views ??
                        statistics.views ??
                        0
                    ),
                });

                setPagination({
                    current_page: Number(
                        postsContainer.current_page ??
                        page
                    ),
                    last_page: Number(
                        postsContainer.last_page ??
                        1
                    ),
                    per_page: Number(
                        postsContainer.per_page ??
                        perPage
                    ),
                    total: Number(
                        postsContainer.total ??
                        rows.length
                    ),
                    from: Number(
                        postsContainer.from ??
                        (rows.length
                            ? (page - 1) *
                            perPage +
                            1
                            : 0)
                    ),
                    to: Number(
                        postsContainer.to ??
                        (rows.length
                            ? (page - 1) *
                            perPage +
                            rows.length
                            : 0)
                    ),
                });
            } catch (requestError) {
                setPosts([]);

                setError(
                    getErrorMessage(
                        requestError,
                        "Unable to load blog posts."
                    )
                );
            } finally {
                setLoading(false);
            }
        },
        [
            activeTab,
            page,
            perPage,
            search,
        ]
    );

    useEffect(() => {
        loadPosts();
    }, [loadPosts]);

    const handleTabChange = (status) => {
        setActiveTab(status);
        setPage(1);
    };

    const handlePerPageChange = (
        event
    ) => {
        setPerPage(
            Number(event.target.value)
        );

        setPage(1);
    };

    const handleDeleteConfirm =
        async () => {
            if (!deletePost?.id) {
                return;
            }

            setDeleting(true);

            try {
                await api.delete(
                    `/admin/blog-posts/${deletePost.id}`
                );

                setDeletePost(null);

                if (
                    posts.length === 1 &&
                    page > 1
                ) {
                    setPage(
                        (previous) =>
                            previous - 1
                    );
                } else {
                    await loadPosts();
                }
            } catch (requestError) {
                setError(
                    getErrorMessage(
                        requestError,
                        "Unable to delete the blog post."
                    )
                );

                setDeletePost(null);
            } finally {
                setDeleting(false);
            }
        };

    const pageNumbers = useMemo(() => {
        const lastPage = Math.max(
            pagination.last_page,
            1
        );

        const start = Math.max(
            1,
            Math.min(
                pagination.current_page - 2,
                lastPage - 4
            )
        );

        const end = Math.min(
            lastPage,
            start + 4
        );

        const numbers = [];

        for (
            let current = start;
            current <= end;
            current += 1
        ) {
            numbers.push(current);
        }

        return numbers;
    }, [
        pagination.current_page,
        pagination.last_page,
    ]);

    const statItems = [
        {
            label: "Total posts",
            value: stats.total,
            description: "All blog posts",
            icon: FileText,
            iconClass:
                "bg-[#e8f1ff] text-[#246bdb]",
        },
        {
            label: "Published",
            value: stats.published,
            description: "Live on storefront",
            icon: CheckCircle2,
            iconClass:
                "bg-[#ddf8e9] text-[#10a566]",
        },
        {
            label: "Drafts",
            value: stats.draft,
            description: "Unpublished posts",
            icon: FileEdit,
            iconClass:
                "bg-[#fff2c8] text-[#df8d00]",
        },
        {
            label: "Scheduled",
            value: stats.scheduled,
            description: "Auto-publish later",
            icon: CalendarClock,
            iconClass:
                "bg-[#e9edff] text-[#4d5fe8]",
        },
        {
            label: "Total views",
            value: stats.total_views,
            description: "Across all posts",
            icon: Eye,
            iconClass:
                "bg-[#eee8ff] text-[#7849e8]",
        },
    ];

    return (
        <>
            <div
                className="
                    min-h-full
                    bg-[#f6f7f8]
                    px-5
                    py-6
                "
            >
                <div
                    className="
                        mx-auto
                        max-w-[1600px]
                    "
                >
                    {error && (
                        <div
                            className="
                                mb-5
                                flex
                                items-start
                                justify-between
                                gap-4
                                rounded-[13px]
                                border
                                border-[#fecaca]
                                bg-[#fff1f2]
                                px-4
                                py-3
                                text-[13px]
                                text-[#c62828]
                            "
                        >
                            <span>{error}</span>

                            <button
                                type="button"
                                onClick={() =>
                                    setError("")
                                }
                                className="
                                    shrink-0
                                    text-[#c62828]
                                "
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    <div
                        className="
                            mb-5
                            grid
                            overflow-hidden
                            rounded-[16px]
                            border
                            border-[#dfe1e5]
                            bg-white
                            shadow-[0_2px_7px_rgba(0,0,0,0.04)]
                            sm:grid-cols-2
                            xl:grid-cols-5
                        "
                    >
                        {statItems.map(
                            (
                                item,
                                index
                            ) => {
                                const Icon =
                                    item.icon;

                                return (
                                    <div
                                        key={
                                            item.label
                                        }
                                        className={`
                                            flex
                                            min-h-[126px]
                                            items-start
                                            justify-between
                                            gap-4
                                            px-6
                                            py-5
                                            ${index >
                                                0
                                                ? "border-t border-[#e3e4e7] sm:border-l xl:border-t-0"
                                                : ""
                                            }
                                        `}
                                    >
                                        <div>
                                            <p
                                                className="
                                                    text-[15px]
                                                    font-medium
                                                    text-[#25272a]
                                                "
                                            >
                                                {
                                                    item.label
                                                }
                                            </p>

                                            <p
                                                className="
                                                    mt-2
                                                    text-[25px]
                                                    font-semibold
                                                    leading-none
                                                    text-[#111214]
                                                "
                                            >
                                                {Number(
                                                    item.value
                                                ).toLocaleString()}
                                            </p>

                                            <p
                                                className="
                                                    mt-3
                                                    text-[12px]
                                                    text-[#777b83]
                                                "
                                            >
                                                {
                                                    item.description
                                                }
                                            </p>
                                        </div>

                                        <div
                                            className={`
                                                flex
                                                h-10
                                                w-10
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-full
                                                ${item.iconClass}
                                            `}
                                        >
                                            <Icon
                                                size={
                                                    19
                                                }
                                                strokeWidth={
                                                    1.9
                                                }
                                            />
                                        </div>
                                    </div>
                                );
                            }
                        )}
                    </div>

                    <div
                        className="
                            overflow-hidden
                            rounded-[16px]
                            border
                            border-[#dfe1e5]
                            bg-white
                            shadow-[0_2px_7px_rgba(0,0,0,0.04)]
                        "
                    >
                        <div
                            className="
                                flex
                                flex-col
                                gap-4
                                border-b
                                border-[#e3e4e7]
                                px-6
                                py-5
                                lg:flex-row
                                lg:items-center
                                lg:justify-between
                            "
                        >
                            <h1
                                className="
                                    text-[20px]
                                    font-semibold
                                    text-[#141518]
                                "
                            >
                                Blog posts
                            </h1>

                            <div
                                className="
                                    flex
                                    flex-wrap
                                    items-center
                                    gap-2
                                "
                            >
                                <Link
                                    to="/admin/content/blog-categories"
                                    className="
                                        flex
                                        h-[38px]
                                        items-center
                                        gap-2
                                        rounded-full
                                        border
                                        border-[#dfe1e5]
                                        bg-white
                                        px-4
                                        text-[13px]
                                        font-medium
                                        text-[#292b2f]
                                        transition
                                        hover:bg-[#f7f8f9]
                                    "
                                >
                                    <Tags
                                        size={15}
                                        strokeWidth={
                                            1.8
                                        }
                                    />

                                    Manage categories
                                </Link>

                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(
                                            "/admin/content/blog-comments"
                                        )
                                    }
                                    className="
                                        flex
                                        h-[38px]
                                        items-center
                                        gap-2
                                        rounded-full
                                        border
                                        border-[#dfe1e5]
                                        bg-white
                                        px-4
                                        text-[13px]
                                        font-medium
                                        text-[#292b2f]
                                        transition
                                        hover:bg-[#f7f8f9]
                                    "
                                >
                                    <MessageCircle
                                        size={15}
                                        strokeWidth={
                                            1.8
                                        }
                                    />

                                    Manage comments
                                </button>

                                <Link
                                    to="/admin/content/blog-posts/new"
                                    className="
                                        flex
                                        h-[38px]
                                        items-center
                                        gap-2
                                        rounded-full
                                        bg-[#246bdb]
                                        px-4
                                        text-[13px]
                                        font-semibold
                                        text-white
                                        transition
                                        hover:bg-[#195fc9]
                                    "
                                >
                                    <Plus
                                        size={16}
                                        strokeWidth={2}
                                    />

                                    Add Blog Post
                                </Link>
                            </div>
                        </div>

                        <div
                            className="
                                flex
                                items-center
                                justify-between
                                gap-4
                                border-b
                                border-[#e3e4e7]
                                px-5
                            "
                        >
                            <div
                                className="
                                    flex
                                    min-w-0
                                    items-center
                                    overflow-x-auto
                                "
                            >
                                {BLOG_POST_TABS.map(
                                    (tab) => (
                                        <button
                                            key={
                                                tab.value
                                            }
                                            type="button"
                                            onClick={() =>
                                                handleTabChange(
                                                    tab.value
                                                )
                                            }
                                            className={`
                                                relative
                                                h-[56px]
                                                shrink-0
                                                px-3
                                                text-[13px]
                                                font-medium
                                                transition
                                                ${activeTab ===
                                                    tab.value
                                                    ? "text-[#141518]"
                                                    : "text-[#686c74] hover:text-[#222]"
                                                }
                                            `}
                                        >
                                            {
                                                tab.label
                                            }

                                            {activeTab ===
                                                tab.value && (
                                                    <span
                                                        className="
                                                        absolute
                                                        bottom-0
                                                        left-3
                                                        right-3
                                                        h-[2px]
                                                        rounded-full
                                                        bg-[#15171a]
                                                    "
                                                    />
                                                )}
                                        </button>
                                    )
                                )}
                            </div>

                            <ArrowDownUp
                                size={17}
                                className="
                                    shrink-0
                                    text-[#777b83]
                                "
                            />
                        </div>

                        <div
                            className="
                                border-b
                                border-[#e3e4e7]
                                px-5
                                py-4
                            "
                        >
                            <div
                                className="
                                    relative
                                    max-w-[500px]
                                "
                            >
                                <Search
                                    size={17}
                                    className="
                                        pointer-events-none
                                        absolute
                                        left-3.5
                                        top-1/2
                                        -translate-y-1/2
                                        text-[#8a8e96]
                                    "
                                />

                                <input
                                    type="search"
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
                                    placeholder="Search posts..."
                                    className="
                                        h-[42px]
                                        w-full
                                        rounded-[13px]
                                        border
                                        border-[#dfe1e5]
                                        bg-white
                                        pl-10
                                        pr-4
                                        text-[13px]
                                        text-[#25272a]
                                        outline-none
                                        transition
                                        placeholder:text-[#8d9199]
                                        focus:border-[#8bb2ff]
                                        focus:ring-2
                                        focus:ring-[#e5edff]
                                    "
                                />
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table
                                className="
                                    w-full
                                    min-w-[1050px]
                                    border-collapse
                                "
                            >
                                <thead>
                                    <tr
                                        className="
                                            border-b
                                            border-[#e3e4e7]
                                            text-left
                                        "
                                    >
                                        <th
                                            className="
                                                w-[46px]
                                                px-5
                                                py-4
                                            "
                                        >
                                            <input
                                                type="checkbox"
                                                disabled
                                                className="
                                                    h-4
                                                    w-4
                                                    rounded
                                                    border-[#d9dce1]
                                                "
                                            />
                                        </th>

                                        <th
                                            className="
                                                px-3
                                                py-4
                                                text-[12px]
                                                font-medium
                                                text-[#6e727a]
                                            "
                                        >
                                            Title
                                        </th>

                                        <th
                                            className="
                                                px-3
                                                py-4
                                                text-[12px]
                                                font-medium
                                                text-[#6e727a]
                                            "
                                        >
                                            Author
                                        </th>

                                        <th
                                            className="
                                                px-3
                                                py-4
                                                text-[12px]
                                                font-medium
                                                text-[#6e727a]
                                            "
                                        >
                                            Status
                                        </th>

                                        <th
                                            className="
                                                px-3
                                                py-4
                                                text-[12px]
                                                font-medium
                                                text-[#6e727a]
                                            "
                                        >
                                            Date
                                        </th>

                                        <th
                                            className="
                                                px-3
                                                py-4
                                                text-[12px]
                                                font-medium
                                                text-[#6e727a]
                                            "
                                        >
                                            Stats
                                        </th>

                                        <th
                                            className="
                                                px-5
                                                py-4
                                                text-right
                                                text-[12px]
                                                font-medium
                                                text-[#6e727a]
                                            "
                                        >
                                            Actions
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    7
                                                }
                                                className="
                                                    px-5
                                                    py-20
                                                    text-center
                                                "
                                            >
                                                <LoaderCircle
                                                    size={
                                                        28
                                                    }
                                                    className="
                                                        mx-auto
                                                        animate-spin
                                                        text-[#246bdb]
                                                    "
                                                />

                                                <p
                                                    className="
                                                        mt-3
                                                        text-[13px]
                                                        text-[#777b83]
                                                    "
                                                >
                                                    Loading
                                                    blog
                                                    posts...
                                                </p>
                                            </td>
                                        </tr>
                                    ) : posts.length ===
                                        0 ? (
                                        <tr>
                                            <td
                                                colSpan={
                                                    7
                                                }
                                                className="
                                                    px-5
                                                    py-20
                                                    text-center
                                                "
                                            >
                                                <div
                                                    className="
                                                        mx-auto
                                                        flex
                                                        h-12
                                                        w-12
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        bg-[#f1f4f8]
                                                        text-[#828790]
                                                    "
                                                >
                                                    <FileText
                                                        size={
                                                            22
                                                        }
                                                    />
                                                </div>

                                                <h3
                                                    className="
                                                        mt-4
                                                        text-[15px]
                                                        font-semibold
                                                        text-[#25272a]
                                                    "
                                                >
                                                    No blog
                                                    posts
                                                    found
                                                </h3>

                                                <p
                                                    className="
                                                        mt-1
                                                        text-[12px]
                                                        text-[#777b83]
                                                    "
                                                >
                                                    {search
                                                        ? "Try a different search term."
                                                        : "Create your first blog post to get started."}
                                                </p>

                                                {!search && (
                                                    <Link
                                                        to="/admin/content/blog-posts/new"
                                                        className="
                                                            mt-4
                                                            inline-flex
                                                            h-[38px]
                                                            items-center
                                                            gap-2
                                                            rounded-full
                                                            bg-[#246bdb]
                                                            px-4
                                                            text-[13px]
                                                            font-semibold
                                                            text-white
                                                        "
                                                    >
                                                        <Plus
                                                            size={
                                                                15
                                                            }
                                                        />

                                                        Add
                                                        Blog
                                                        Post
                                                    </Link>
                                                )}
                                            </td>
                                        </tr>
                                    ) : (
                                        posts.map(
                                            (
                                                post
                                            ) => (
                                                <BlogPostRow
                                                    key={
                                                        post.id
                                                    }
                                                    post={
                                                        post
                                                    }
                                                    onEdit={() =>
                                                        navigate(
                                                            `/admin/content/blog-posts/${post.id}/edit`
                                                        )
                                                    }
                                                    onDelete={() =>
                                                        setDeletePost(
                                                            post
                                                        )
                                                    }
                                                />
                                            )
                                        )
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {!loading &&
                            pagination.total >
                            0 && (
                                <div
                                    className="
                                        flex
                                        flex-col
                                        gap-4
                                        border-t
                                        border-[#e3e4e7]
                                        px-5
                                        py-4
                                        sm:flex-row
                                        sm:items-center
                                        sm:justify-between
                                    "
                                >
                                    <p
                                        className="
                                            text-[12px]
                                            text-[#6f737b]
                                        "
                                    >
                                        Showing{" "}
                                        {
                                            pagination.from
                                        }{" "}
                                        to{" "}
                                        {
                                            pagination.to
                                        }{" "}
                                        of{" "}
                                        {
                                            pagination.total
                                        }{" "}
                                        results
                                    </p>

                                    <div
                                        className="
                                            flex
                                            flex-wrap
                                            items-center
                                            gap-2
                                        "
                                    >
                                        <span
                                            className="
                                                text-[12px]
                                                text-[#6f737b]
                                            "
                                        >
                                            Rows per
                                            page
                                        </span>

                                        <select
                                            value={
                                                perPage
                                            }
                                            onChange={
                                                handlePerPageChange
                                            }
                                            className="
                                                h-9
                                                rounded-[10px]
                                                border
                                                border-[#dfe1e5]
                                                bg-white
                                                px-3
                                                text-[12px]
                                                outline-none
                                            "
                                        >
                                            <option
                                                value={
                                                    10
                                                }
                                            >
                                                10
                                            </option>

                                            <option
                                                value={
                                                    20
                                                }
                                            >
                                                20
                                            </option>

                                            <option
                                                value={
                                                    50
                                                }
                                            >
                                                50
                                            </option>
                                        </select>

                                        <PaginationButton
                                            disabled={
                                                pagination.current_page <=
                                                1
                                            }
                                            onClick={() =>
                                                setPage(
                                                    1
                                                )
                                            }
                                        >
                                            <ChevronsLeft
                                                size={
                                                    15
                                                }
                                            />
                                        </PaginationButton>

                                        <PaginationButton
                                            disabled={
                                                pagination.current_page <=
                                                1
                                            }
                                            onClick={() =>
                                                setPage(
                                                    (
                                                        previous
                                                    ) =>
                                                        previous -
                                                        1
                                                )
                                            }
                                        >
                                            <ChevronLeft
                                                size={
                                                    15
                                                }
                                            />
                                        </PaginationButton>

                                        {pageNumbers.map(
                                            (
                                                pageNumber
                                            ) => (
                                                <button
                                                    key={
                                                        pageNumber
                                                    }
                                                    type="button"
                                                    onClick={() =>
                                                        setPage(
                                                            pageNumber
                                                        )
                                                    }
                                                    className={`
                                                        flex
                                                        h-9
                                                        min-w-9
                                                        items-center
                                                        justify-center
                                                        rounded-full
                                                        px-2
                                                        text-[12px]
                                                        font-medium
                                                        transition
                                                        ${pageNumber ===
                                                            pagination.current_page
                                                            ? "bg-[#246bdb] text-white"
                                                            : "border border-[#dfe1e5] bg-white text-[#555960] hover:bg-[#f6f7f8]"
                                                        }
                                                    `}
                                                >
                                                    {
                                                        pageNumber
                                                    }
                                                </button>
                                            )
                                        )}

                                        <PaginationButton
                                            disabled={
                                                pagination.current_page >=
                                                pagination.last_page
                                            }
                                            onClick={() =>
                                                setPage(
                                                    (
                                                        previous
                                                    ) =>
                                                        previous +
                                                        1
                                                )
                                            }
                                        >
                                            <ChevronRight
                                                size={
                                                    15
                                                }
                                            />
                                        </PaginationButton>

                                        <PaginationButton
                                            disabled={
                                                pagination.current_page >=
                                                pagination.last_page
                                            }
                                            onClick={() =>
                                                setPage(
                                                    pagination.last_page
                                                )
                                            }
                                        >
                                            <ChevronsRight
                                                size={
                                                    15
                                                }
                                            />
                                        </PaginationButton>
                                    </div>
                                </div>
                            )}
                    </div>
                </div>
            </div>

            <BlogPostDeleteModal
                post={deletePost}
                deleting={deleting}
                onClose={() => {
                    if (!deleting) {
                        setDeletePost(null);
                    }
                }}
                onConfirm={
                    handleDeleteConfirm
                }
            />
        </>
    );
};

const BlogPostRow = ({
    post,
    onEdit,
    onDelete,
}) => {
    const authorName =
        post?.author?.name ||
        post?.author_name ||
        "Admin";

    const imageUrl =
        post?.featured_image_url ||
        post?.featured_image ||
        "";

    const postDate =
        post?.published_at ||
        post?.scheduled_at ||
        post?.created_at;

    const views = Number(
        post?.views_count || 0
    );

    const comments = Number(
        post?.comments_count || 0
    );

    const storefrontUrl =
        post?.frontend_url ||
        `/blog/${post.slug}`;

    return (
        <tr
            className="
                border-b
                border-[#e8e9ec]
                transition
                last:border-b-0
                hover:bg-[#fafbfc]
            "
        >
            <td className="px-5 py-4">
                <input
                    type="checkbox"
                    className="
                        h-4
                        w-4
                        rounded
                        border-[#d9dce1]
                    "
                />
            </td>

            <td className="px-3 py-4">
                <div
                    className="
                        flex
                        min-w-0
                        items-center
                        gap-3
                    "
                >
                    <div
                        className="
                            flex
                            h-11
                            w-11
                            shrink-0
                            items-center
                            justify-center
                            overflow-hidden
                            rounded-[12px]
                            bg-[#f0f2f5]
                        "
                    >
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt={
                                    post?.featured_image_alt ||
                                    post?.title ||
                                    ""
                                }
                                className="
                                    h-full
                                    w-full
                                    object-cover
                                "
                            />
                        ) : (
                            <FileText
                                size={19}
                                className="text-[#92969e]"
                            />
                        )}
                    </div>

                    <div className="min-w-0">
                        <p
                            className="
                                max-w-[430px]
                                truncate
                                text-[13px]
                                font-semibold
                                text-[#17181b]
                            "
                        >
                            {post.title}
                        </p>

                        <p
                            className="
                                mt-1
                                max-w-[430px]
                                truncate
                                text-[11px]
                                text-[#777b83]
                            "
                        >
                            /{post.slug}
                        </p>
                    </div>
                </div>
            </td>

            <td
                className="
                    whitespace-nowrap
                    px-3
                    py-4
                    text-[12px]
                    text-[#4e5259]
                "
            >
                {authorName}
            </td>

            <td className="px-3 py-4">
                <span
                    className={`
                        inline-flex
                        rounded-full
                        px-2.5
                        py-1
                        text-[10px]
                        font-medium
                        ${getPostStatusClass(
                        post.status
                    )}
                    `}
                >
                    {getPostStatusLabel(
                        post.status
                    )}
                </span>
            </td>

            <td
                className="
                    whitespace-nowrap
                    px-3
                    py-4
                    text-[12px]
                    text-[#6b6f77]
                "
            >
                {formatBlogDate(postDate)}
            </td>

            <td className="px-3 py-4">
                <div
                    className="
                        flex
                        items-center
                        gap-3
                        whitespace-nowrap
                        text-[11px]
                        text-[#6f737b]
                    "
                >
                    <span
                        className="
                            flex
                            items-center
                            gap-1
                        "
                    >
                        <Eye size={13} />

                        {views.toLocaleString()}
                    </span>

                    <span>
                        {comments.toLocaleString()}{" "}
                        {comments === 1
                            ? "comment"
                            : "comments"}
                    </span>
                </div>
            </td>

            <td className="px-5 py-4">
                <div
                    className="
                        flex
                        items-center
                        justify-end
                    "
                >
                    <div
                        className="
                            inline-flex
                            overflow-hidden
                            rounded-[10px]
                            border
                            border-[#dfe1e5]
                            bg-white
                        "
                    >
                        <a
                            href={storefrontUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="View post"
                            className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                border-r
                                border-[#dfe1e5]
                                text-[#71757d]
                                transition
                                hover:bg-[#f5f7fa]
                                hover:text-[#246bdb]
                            "
                        >
                            <ExternalLink
                                size={15}
                            />
                        </a>

                        <button
                            type="button"
                            onClick={onEdit}
                            title="Edit post"
                            className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                border-r
                                border-[#dfe1e5]
                                text-[#71757d]
                                transition
                                hover:bg-[#f5f7fa]
                                hover:text-[#246bdb]
                            "
                        >
                            <Pencil
                                size={15}
                            />
                        </button>

                        <span
                            title={
                                post.is_featured
                                    ? "Featured post"
                                    : "Not featured"
                            }
                            className={`
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                border-r
                                border-[#dfe1e5]
                                ${post.is_featured
                                    ? "bg-[#fff9e8] text-[#e3a008]"
                                    : "text-[#9a9da4]"
                                }
                            `}
                        >
                            <Star
                                size={15}
                                fill={
                                    post.is_featured
                                        ? "currentColor"
                                        : "none"
                                }
                            />
                        </span>

                        <button
                            type="button"
                            onClick={onDelete}
                            title="Delete post"
                            className="
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                text-[#8b8e95]
                                transition
                                hover:bg-[#fff1f2]
                                hover:text-[#e11d48]
                            "
                        >
                            <Trash2
                                size={15}
                            />
                        </button>
                    </div>
                </div>
            </td>
        </tr>
    );
};

const PaginationButton = ({
    children,
    disabled,
    onClick,
}) => {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                border
                border-[#dfe1e5]
                bg-white
                text-[#666a72]
                transition
                hover:bg-[#f6f7f8]
                disabled:cursor-not-allowed
                disabled:opacity-40
            "
        >
            {children}
        </button>
    );
};

const BlogPostDeleteModal = ({
    post,
    deleting,
    onClose,
    onConfirm,
}) => {
    useEffect(() => {
        if (!post) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (
                event.key === "Escape" &&
                !deleting
            ) {
                onClose();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        const previousOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

            document.body.style.overflow =
                previousOverflow;
        };
    }, [
        post,
        deleting,
        onClose,
    ]);

    if (!post) {
        return null;
    }

    return (
        <div
            className="
                fixed
                inset-0
                z-[200]
                flex
                items-center
                justify-center
                bg-black/55
                px-4
                backdrop-blur-[3px]
            "
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !deleting
                ) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-post-title"
                className="
                    relative
                    w-full
                    max-w-[505px]
                    overflow-hidden
                    rounded-[22px]
                    border
                    border-[#e4e5e8]
                    border-t-[3px]
                    border-t-[#ef3340]
                    bg-white
                    shadow-[0_24px_70px_rgba(0,0,0,0.24)]
                "
            >
                <button
                    type="button"
                    onClick={onClose}
                    disabled={deleting}
                    className="
                        absolute
                        right-4
                        top-4
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-full
                        text-[#9699a0]
                        transition
                        hover:bg-[#f3f4f5]
                        hover:text-[#303238]
                        disabled:cursor-not-allowed
                    "
                >
                    <X size={17} />
                </button>

                <div
                    className="
                        px-7
                        pb-6
                        pt-7
                        text-center
                    "
                >
                    <div
                        className="
                            mx-auto
                            flex
                            h-14
                            w-14
                            items-center
                            justify-center
                            rounded-full
                            bg-[#ffe8ea]
                            text-[#ef233c]
                        "
                    >
                        <Trash2
                            size={23}
                            strokeWidth={2}
                        />
                    </div>

                    <h2
                        id="delete-post-title"
                        className="
                            mt-5
                            text-[20px]
                            font-semibold
                            text-[#17181b]
                        "
                    >
                        Delete post?
                    </h2>

                    <p
                        className="
                            mx-auto
                            mt-2
                            max-w-[390px]
                            text-[13px]
                            leading-6
                            text-[#73777f]
                        "
                    >
                        “{post.title}” will be
                        permanently removed. This
                        action cannot be undone.
                    </p>
                </div>

                <div
                    className="
                        grid
                        grid-cols-2
                        gap-3
                        border-t
                        border-[#e8e9ec]
                        px-7
                        py-5
                    "
                >
                    <button
                        type="button"
                        disabled={deleting}
                        onClick={onClose}
                        className="
                            h-[43px]
                            rounded-[13px]
                            border
                            border-[#dfe1e5]
                            bg-white
                            text-[13px]
                            font-semibold
                            text-[#33363b]
                            transition
                            hover:bg-[#f7f8f9]
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={deleting}
                        onClick={onConfirm}
                        className="
                            flex
                            h-[43px]
                            items-center
                            justify-center
                            gap-2
                            rounded-[13px]
                            bg-[#ef0712]
                            text-[13px]
                            font-semibold
                            text-white
                            transition
                            hover:bg-[#d9000b]
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        {deleting && (
                            <LoaderCircle
                                size={16}
                                className="animate-spin"
                            />
                        )}

                        {deleting
                            ? "Deleting..."
                            : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminBlogPosts;