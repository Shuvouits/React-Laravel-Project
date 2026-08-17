import {
    ArrowDown,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    CirclePause,
    Filter,
    Image as ImageIcon,
    LoaderCircle,
    MessageSquareReply,
    MoreHorizontal,
    Search,
    Star,
    Trash2,
    X,
    XCircle,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../../../api/axios";

const tabs = [
    {
        key: "all",
        label: "All",
    },
    {
        key: "published",
        label: "Published",
    },
    {
        key: "on_hold",
        label: "On hold",
    },
    {
        key: "replied",
        label: "Replied",
    },
    {
        key: "awaiting_reply",
        label: "Awaiting reply",
    },
];

const emptySummary = {
    average_rating: 0,
    total_reviews: 0,
    rating_counts: {
        5: 0,
        4: 0,
        3: 0,
        2: 0,
        1: 0,
    },
    performance: {
        key: "no_reviews",
        label: "No reviews",
    },
};

const emptyTabCounts = {
    all: 0,
    published: 0,
    on_hold: 0,
    replied: 0,
    awaiting_reply: 0,
};

export default function AdminReviews() {
    const navigate = useNavigate();
    const filterRef = useRef(null);

    const [reviews, setReviews] =
        useState([]);

    const [summary, setSummary] =
        useState(emptySummary);

    const [tabCounts, setTabCounts] =
        useState(emptyTabCounts);

    const [pagination, setPagination] =
        useState({
            current_page: 1,
            last_page: 1,
            total: 0,
            from: null,
            to: null,
        });

    const [activeTab, setActiveTab] =
        useState("all");

    const [searchInput, setSearchInput] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [rating, setRating] =
        useState("");

    const [sort, setSort] =
        useState("recent");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [message, setMessage] =
        useState("");

    const [messageType, setMessageType] =
        useState("success");

    const [filterOpen, setFilterOpen] =
        useState(false);

    const [selectedIds, setSelectedIds] =
        useState([]);

    const [manageReview, setManageReview] =
        useState(null);

    const [deleteReview, setDeleteReview] =
        useState(null);

    useEffect(() => {
        fetchReviews(1);
    }, [
        activeTab,
        search,
        rating,
        sort,
    ]);

    useEffect(() => {
        const handleOutside = (
            event
        ) => {
            if (
                filterRef.current &&
                !filterRef.current.contains(
                    event.target
                )
            ) {
                setFilterOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleOutside
            );
        };
    }, []);

    const fetchReviews = async (
        page = 1
    ) => {
        setLoading(true);
        setError("");

        try {
            const response =
                await api.get(
                    "/admin/reviews",
                    {
                        params: {
                            tab: activeTab,
                            search:
                                search ||
                                undefined,
                            rating:
                                rating ||
                                undefined,
                            sort,
                            page,
                            per_page: 15,
                        },
                    }
                );

            const data =
                response.data?.reviews;

            setReviews(
                data?.data || []
            );

            setSummary(
                response.data?.summary ||
                emptySummary
            );

            setTabCounts(
                response.data?.tab_counts ||
                emptyTabCounts
            );

            setPagination({
                current_page:
                    data?.current_page ||
                    1,

                last_page:
                    data?.last_page ||
                    1,

                total:
                    data?.total ||
                    0,

                from:
                    data?.from ||
                    null,

                to:
                    data?.to ||
                    null,
            });

            setSelectedIds([]);
        } catch (err) {
            console.error(
                "Admin reviews fetch error:",
                err
            );

            setError(
                err.response?.data
                    ?.message ||
                "Unable to load reviews."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (
        event
    ) => {
        event.preventDefault();

        setSearch(
            searchInput.trim()
        );
    };

    const handleTabChange = (
        tab
    ) => {
        setActiveTab(tab);
        setSelectedIds([]);
    };

    const handleReviewUpdated = (
        updatedReview,
        nextSummary,
        nextTabCounts
    ) => {
        if (nextSummary) {
            setSummary(
                nextSummary
            );
        }

        if (nextTabCounts) {
            setTabCounts(
                nextTabCounts
            );
        }

        if (
            activeTab === "all"
        ) {
            setReviews(
                (current) =>
                    current.map(
                        (review) =>
                            review.id ===
                            updatedReview.id
                                ? updatedReview
                                : review
                    )
            );
        } else {
            fetchReviews(
                pagination.current_page
            );
        }

        setManageReview(
            updatedReview
        );
    };

    const showMessage = (
        type,
        text
    ) => {
        setMessageType(type);
        setMessage(text);
    };

    const allVisibleSelected =
        reviews.length > 0 &&
        reviews.every((review) =>
            selectedIds.includes(
                review.id
            )
        );

    const toggleAll = () => {
        if (
            allVisibleSelected
        ) {
            setSelectedIds([]);
            return;
        }

        setSelectedIds(
            reviews.map(
                (review) =>
                    review.id
            )
        );
    };

    const toggleSelected = (
        reviewId
    ) => {
        setSelectedIds(
            (current) =>
                current.includes(
                    reviewId
                )
                    ? current.filter(
                        (id) =>
                            id !==
                            reviewId
                    )
                    : [
                        ...current,
                        reviewId,
                    ]
        );
    };

    const handleViewProduct = (
        review
    ) => {
        const slug =
            review?.product?.slug;

        if (!slug) {
            return;
        }

        navigate(
            `/products/${slug}`
        );
    };

    return (
        <div className="min-h-screen bg-[#f6f6f7]">
            <div className="mx-auto w-full max-w-[1600px] px-6 py-6">
                {message && (
                    <MessageBanner
                        type={
                            messageType
                        }
                        message={
                            message
                        }
                        onClose={() =>
                            setMessage(
                                ""
                            )
                        }
                    />
                )}

                <ReviewOverview
                    summary={
                        summary
                    }
                />

                <section className="mt-4 rounded-[16px] border border-[#dedede] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                    <div className="px-6 pt-6">
                        <h1 className="text-[21px] font-semibold tracking-[-0.3px] text-[#171717]">
                            Reviews
                        </h1>
                    </div>

                    <div className="mx-6 mt-5 overflow-hidden rounded-[13px] border border-[#e2e2e2]">
                        <div className="flex items-center justify-between border-b border-[#e5e5e5] px-5">
                            <div className="flex min-w-0 gap-6 overflow-x-auto">
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
                                            className={`relative whitespace-nowrap py-[15px] text-[13px] font-medium transition ${
                                                activeTab ===
                                                tab.key
                                                    ? "text-[#171717]"
                                                    : "text-[#666] hover:text-[#222]"
                                            }`}
                                        >
                                            {tab.label}

                                            {tabCounts[
                                                tab
                                                    .key
                                            ] >
                                                0 && (
                                                <span className="ml-1.5 text-[11px] text-[#999]">
                                                    {
                                                        tabCounts[
                                                            tab
                                                                .key
                                                        ]
                                                    }
                                                </span>
                                            )}

                                            {activeTab ===
                                                tab.key && (
                                                <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#171717]" />
                                            )}
                                        </button>
                                    )
                                )}
                            </div>

                            <ArrowDown
                                size={15}
                                className="shrink-0 text-[#777]"
                            />
                        </div>

                        <div className="flex flex-col gap-3 border-b border-[#e5e5e5] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
                            <form
                                onSubmit={
                                    handleSearch
                                }
                                className="relative w-full max-w-[515px]"
                            >
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]"
                                />

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
                                    placeholder="Search reviews"
                                    className="h-[38px] w-full rounded-[10px] border border-[#d9d9d9] bg-white pl-10 pr-4 text-[13px] text-[#222] outline-none transition placeholder:text-[#8a8a8a] focus:border-[#2f6fed] focus:ring-1 focus:ring-[#2f6fed]"
                                />
                            </form>

                            <div
                                ref={
                                    filterRef
                                }
                                className="relative"
                            >
                                <button
                                    type="button"
                                    onClick={() =>
                                        setFilterOpen(
                                            !filterOpen
                                        )
                                    }
                                    className={`flex h-[38px] items-center gap-2 rounded-[9px] border bg-white px-3.5 text-[12px] font-medium transition ${
                                        rating
                                            ? "border-[#9ebaf8] text-[#2065D1]"
                                            : "border-[#dedede] text-[#333] hover:bg-[#f8f8f8]"
                                    }`}
                                >
                                    <Filter
                                        size={
                                            15
                                        }
                                    />
                                    Filter

                                    {rating && (
                                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2065D1] px-1 text-[10px] text-white">
                                            1
                                        </span>
                                    )}
                                </button>

                                {filterOpen && (
                                    <FilterMenu
                                        rating={
                                            rating
                                        }
                                        sort={
                                            sort
                                        }
                                        onRatingChange={
                                            setRating
                                        }
                                        onSortChange={
                                            setSort
                                        }
                                        onClose={() =>
                                            setFilterOpen(
                                                false
                                            )
                                        }
                                    />
                                )}
                            </div>
                        </div>

                        {selectedIds.length >
                            0 && (
                                <div className="border-b border-[#e6e6e6] bg-[#f8fbff] px-5 py-2.5 text-[12px] text-[#315f9f]">
                                    {
                                        selectedIds.length
                                    }{" "}
                                    review
                                    {selectedIds.length ===
                                    1
                                        ? ""
                                        : "s"}{" "}
                                    selected
                                </div>
                            )}

                        {error && (
                            <div className="m-4 rounded-[9px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-600">
                                {error}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1180px] table-fixed border-collapse">
                                <colgroup>
                                    <col className="w-[48px]" />
                                    <col className="w-[300px]" />
                                    <col className="w-[245px]" />
                                    <col className="w-[390px]" />
                                    <col className="w-[145px]" />
                                    <col className="w-[135px]" />
                                    <col className="w-[55px]" />
                                </colgroup>

                                <thead>
                                    <tr className="h-[48px] border-b border-[#e4e4e4] bg-[#fff]">
                                        <th className="px-4 text-left">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    allVisibleSelected
                                                }
                                                onChange={
                                                    toggleAll
                                                }
                                                className="h-[16px] w-[16px] rounded border-[#d7d7d7]"
                                            />
                                        </th>

                                        <TableHead>
                                            Product
                                        </TableHead>

                                        <TableHead>
                                            Reviewer
                                        </TableHead>

                                        <TableHead>
                                            Review
                                        </TableHead>

                                        <TableHead>
                                            Date
                                        </TableHead>

                                        <TableHead>
                                            Status
                                        </TableHead>

                                        <TableHead />
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <LoadingRows />
                                    ) : reviews.length ===
                                      0 ? (
                                        <EmptyReviews />
                                    ) : (
                                        reviews.map(
                                            (
                                                review
                                            ) => (
                                                <ReviewRow
                                                    key={
                                                        review.id
                                                    }
                                                    review={
                                                        review
                                                    }
                                                    selected={selectedIds.includes(
                                                        review.id
                                                    )}
                                                    onToggleSelected={() =>
                                                        toggleSelected(
                                                            review.id
                                                        )
                                                    }
                                                    onManage={() =>
                                                        setManageReview(
                                                            review
                                                        )
                                                    }
                                                    onViewProduct={() =>
                                                        handleViewProduct(
                                                            review
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
                                <Pagination
                                    pagination={
                                        pagination
                                    }
                                    onPageChange={
                                        fetchReviews
                                    }
                                />
                            )}
                    </div>

                    <div className="h-6" />
                </section>
            </div>

            {manageReview &&
                createPortal(
                    <ReviewManageModal
                        review={
                            manageReview
                        }
                        onClose={() =>
                            setManageReview(
                                null
                            )
                        }
                        onUpdated={
                            handleReviewUpdated
                        }
                        onMessage={
                            showMessage
                        }
                        onDelete={() => {
                            setDeleteReview(
                                manageReview
                            );

                            setManageReview(
                                null
                            );
                        }}
                    />,
                    document.body
                )}

            {deleteReview &&
                createPortal(
                    <DeleteReviewModal
                        review={
                            deleteReview
                        }
                        onClose={() =>
                            setDeleteReview(
                                null
                            )
                        }
                        onDeleted={async (
                            message
                        ) => {
                            setDeleteReview(
                                null
                            );

                            showMessage(
                                "success",
                                message
                            );

                            await fetchReviews(
                                pagination.current_page
                            );
                        }}
                    />,
                    document.body
                )}
        </div>
    );
}

function ReviewOverview({
    summary,
}) {
    const total =
        Number(
            summary.total_reviews || 0
        );

    const average =
        Number(
            summary.average_rating || 0
        );

    const counts =
        summary.rating_counts ||
        emptySummary.rating_counts;

    const performance =
        summary.performance ||
        emptySummary.performance;

    const maxCount = Math.max(
        1,
        ...[5, 4, 3, 2, 1].map(
            (rating) =>
                Number(
                    counts[rating] ||
                    0
                )
        )
    );

    return (
        <section className="rounded-[15px] border border-[#dce3ee] bg-white px-5 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
            <div className="grid gap-7 lg:grid-cols-[210px_1fr] lg:items-center">
                <div>
                    <div className="flex items-center gap-1 text-[#11213d]">
                        {[1, 2, 3].map(
                            (star) => (
                                <Star
                                    key={
                                        star
                                    }
                                    size={
                                        star ===
                                        2
                                            ? 16
                                            : 13
                                    }
                                    fill="#11213d"
                                    strokeWidth={
                                        0
                                    }
                                />
                            )
                        )}

                        <Star
                            size={11}
                        />
                        <Star
                            size={9}
                        />
                    </div>

                    <div className="mt-3 text-[37px] font-semibold leading-none tracking-[-1px] text-[#10213d]">
                        {average.toFixed(
                            2
                        )}
                    </div>

                    <div className="mt-2 text-[13px] text-[#355171]">
                        — of {total}{" "}
                        {total === 1
                            ? "review"
                            : "reviews"}
                    </div>
                </div>

                <div>
                    <div className="space-y-[7px]">
                        {[5, 4, 3, 2, 1].map(
                            (rating) => {
                                const count =
                                    Number(
                                        counts[
                                            rating
                                        ] ||
                                        0
                                    );

                                const width =
                                    (
                                        count /
                                        maxCount
                                    ) *
                                    100;

                                return (
                                    <div
                                        key={
                                            rating
                                        }
                                        className="grid grid-cols-[110px_minmax(0,1fr)_24px] items-center gap-4"
                                    >
                                        <div className="flex items-center gap-[2px]">
                                            {[
                                                1,
                                                2,
                                                3,
                                                4,
                                                5,
                                            ].map(
                                                (
                                                    star
                                                ) => (
                                                    <Star
                                                        key={
                                                            star
                                                        }
                                                        size={
                                                            15
                                                        }
                                                        fill={
                                                            star <=
                                                            rating
                                                                ? "#2f6fed"
                                                                : "#dfe3e8"
                                                        }
                                                        color={
                                                            star <=
                                                            rating
                                                                ? "#2f6fed"
                                                                : "#dfe3e8"
                                                        }
                                                        strokeWidth={
                                                            0
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>

                                        <div className="h-[8px] overflow-hidden rounded-full bg-[#e5e8ec]">
                                            <div
                                                className="h-full rounded-full bg-[#2f6fed]"
                                                style={{
                                                    width: `${width}%`,
                                                }}
                                            />
                                        </div>

                                        <span className="text-right text-[12px] text-[#49617c]">
                                            {count}
                                        </span>
                                    </div>
                                );
                            }
                        )}
                    </div>

                    <div className="mt-2 flex items-center justify-end gap-2 text-[12px] text-[#40536c]">
                        <span>
                            Overall
                            performance
                        </span>

                        <PerformanceBadge
                            performance={
                                performance
                            }
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

function ReviewRow({
    review,
    selected,
    onToggleSelected,
    onManage,
    onViewProduct,
}) {
    const product =
        review.product || {};

    const reviewer =
        review.reviewer || {};

    const images =
        Array.isArray(
            review.images
        )
            ? review.images
            : [];

    return (
        <tr className="border-b border-[#ececec] last:border-b-0 transition hover:bg-[#fcfcfc]">
            <td className="px-4 py-4 align-top">
                <input
                    type="checkbox"
                    checked={
                        selected
                    }
                    onChange={
                        onToggleSelected
                    }
                    className="mt-[2px] h-[16px] w-[16px] rounded border-[#d7d7d7]"
                />
            </td>

            <td className="px-4 py-4 align-top">
                <button
                    type="button"
                    onClick={
                        onViewProduct
                    }
                    className="flex min-w-0 items-center gap-3 text-left"
                >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-[#f3f3f3]">
                        {product.image_url ? (
                            <img
                                src={
                                    product.image_url
                                }
                                alt={
                                    product.title ||
                                    "Product"
                                }
                                className="h-full w-full object-contain p-[2px]"
                            />
                        ) : (
                            <ImageIcon
                                size={16}
                                className="text-[#999]"
                            />
                        )}
                    </div>

                    <span className="truncate text-[13px] font-medium text-[#171717] hover:text-[#2065D1]">
                        {product.title ||
                            "Product"}
                    </span>
                </button>
            </td>

            <td className="px-4 py-4 align-top">
                <div className="flex min-w-0 items-start gap-3">
                    <ReviewerAvatar
                        reviewer={
                            reviewer
                        }
                    />

                    <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-[#171717]">
                            {reviewer.name ||
                                "Customer"}
                        </div>

                        <div className="mt-[2px] truncate text-[11px] text-[#888]">
                            {reviewer.email ||
                                "No email"}
                        </div>

                        {review.is_verified_purchase && (
                            <div className="mt-[4px] flex items-center gap-1 text-[10px] font-medium text-[#15916a]">
                                <CheckCircle2
                                    size={
                                        11
                                    }
                                />
                                Verified
                                customer
                            </div>
                        )}
                    </div>
                </div>
            </td>

            <td className="px-4 py-4 align-top">
                <button
                    type="button"
                    onClick={
                        onManage
                    }
                    className="block w-full text-left"
                >
                    <ReviewStars
                        rating={
                            review.rating
                        }
                    />

                    {review.title && (
                        <div className="mt-[5px] truncate text-[13px] font-semibold text-[#171717]">
                            {
                                review.title
                            }
                        </div>
                    )}

                    <p className="mt-[3px] line-clamp-1 text-[12px] text-[#666]">
                        {review.review}
                    </p>

                    {review.admin_reply && (
                        <div className="mt-[9px] flex items-start gap-2">
                            <MessageSquareReply
                                size={
                                    13
                                }
                                className="mt-[2px] shrink-0 text-[#555]"
                            />

                            <div className="min-w-0">
                                <div className="text-[11px] font-medium text-[#444]">
                                    You replied
                                    with
                                </div>

                                <p className="mt-[3px] line-clamp-1 border-l border-[#d9e2f3] pl-3 text-[11px] text-[#697386]">
                                    {
                                        review.admin_reply
                                    }
                                </p>
                            </div>
                        </div>
                    )}
                </button>
            </td>

            <td className="px-4 py-4 align-top">
                <span className="whitespace-nowrap text-[12px] text-[#222]">
                    {review.created_at_formatted ||
                        "—"}
                </span>
            </td>

            <td className="px-4 py-4 align-top">
                <ReviewStatusBadge
                    review={
                        review
                    }
                />
            </td>

            <td className="px-3 py-4 align-top">
                <button
                    type="button"
                    onClick={
                        onManage
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[#777] transition hover:bg-[#f1f1f1] hover:text-[#222]"
                    aria-label="Manage review"
                >
                    <MoreHorizontal
                        size={17}
                    />
                </button>
            </td>
        </tr>
    );
}

function ReviewManageModal({
    review,
    onClose,
    onUpdated,
    onMessage,
    onDelete,
}) {
    const [reply, setReply] =
        useState(
            review.admin_reply ||
            ""
        );

    const [saving, setSaving] =
        useState(false);

    const [actionLoading, setActionLoading] =
        useState("");

    const [error, setError] =
        useState("");

    const images =
        Array.isArray(
            review.images
        )
            ? review.images
            : [];

    const callAction = async (
        method,
        endpoint,
        payload = undefined
    ) => {
        setActionLoading(
            endpoint
        );

        setError("");

        try {
            const response =
                method === "delete"
                    ? await api.delete(
                        endpoint
                    )
                    : await api.post(
                        endpoint,
                        payload
                    );

            onUpdated(
                response.data
                    ?.review,
                response.data
                    ?.summary,
                response.data
                    ?.tab_counts
            );

            onMessage(
                "success",
                response.data
                    ?.message ||
                "Review updated successfully."
            );
        } catch (err) {
            setError(
                firstApiError(
                    err
                ) ||
                "Unable to update review."
            );
        } finally {
            setActionLoading(
                ""
            );
        }
    };

    const saveReply = async () => {
        const value =
            reply.trim();

        if (!value) {
            setError(
                "Reply is required."
            );
            return;
        }

        setSaving(true);
        setError("");

        try {
            const response =
                await api.post(
                    `/admin/reviews/${review.id}/reply`,
                    {
                        reply: value,
                    }
                );

            onUpdated(
                response.data
                    ?.review,
                response.data
                    ?.summary,
                response.data
                    ?.tab_counts
            );

            onMessage(
                "success",
                response.data
                    ?.message ||
                "Reply saved successfully."
            );
        } catch (err) {
            setError(
                firstApiError(
                    err
                ) ||
                "Unable to save reply."
            );
        } finally {
            setSaving(false);
        }
    };

    const deleteReply = async () => {
        await callAction(
            "delete",
            `/admin/reviews/${review.id}/reply`
        );

        setReply("");
    };

    return (
        <div
            className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4 py-6"
            onMouseDown={(
                event
            ) => {
                if (
                    event.target ===
                    event.currentTarget &&
                    !saving &&
                    !actionLoading
                ) {
                    onClose();
                }
            }}
        >
            <div className="relative flex max-h-[92vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
                <div className="shrink-0 border-b border-[#e8e8e8] px-6 py-5">
                    <h2 className="text-[20px] font-semibold text-[#171717]">
                        Review details
                    </h2>

                    <p className="mt-1 text-[12px] text-[#777]">
                        Manage status
                        and reply to
                        this customer
                        review.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={
                        onClose
                    }
                    disabled={
                        saving ||
                        Boolean(
                            actionLoading
                        )
                    }
                    className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-[#777] transition hover:bg-[#f3f3f3] disabled:opacity-50"
                >
                    <X size={18} />
                </button>

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
                    <div className="flex items-start justify-between gap-5">
                        <div className="min-w-0">
                            <div className="text-[12px] font-medium text-[#777]">
                                {
                                    review.product
                                        ?.title
                                }
                            </div>

                            <div className="mt-2">
                                <ReviewStars
                                    rating={
                                        review.rating
                                    }
                                    size={
                                        17
                                    }
                                />
                            </div>

                            {review.title && (
                                <h3 className="mt-3 text-[17px] font-semibold text-[#171717]">
                                    {
                                        review.title
                                    }
                                </h3>
                            )}
                        </div>

                        <ReviewStatusBadge
                            review={
                                review
                            }
                        />
                    </div>

                    <p className="mt-4 whitespace-pre-line text-[13px] leading-6 text-[#555]">
                        {review.review}
                    </p>

                    {images.length >
                        0 && (
                        <div className="mt-5 flex flex-wrap gap-3">
                            {images.map(
                                (
                                    image
                                ) => (
                                    <a
                                        key={
                                            image.id
                                        }
                                        href={
                                            image.url
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="h-[86px] w-[86px] overflow-hidden rounded-[10px] border border-[#e3e3e3] bg-[#f8f8f8]"
                                    >
                                        <img
                                            src={
                                                image.url
                                            }
                                            alt="Review"
                                            className="h-full w-full object-cover"
                                        />
                                    </a>
                                )
                            )}
                        </div>
                    )}

                    <div className="mt-5 rounded-[12px] border border-[#e7e7e7] bg-[#fafafa] p-4">
                        <div className="flex items-center gap-3">
                            <ReviewerAvatar
                                reviewer={
                                    review.reviewer ||
                                    {}
                                }
                            />

                            <div>
                                <div className="text-[13px] font-medium text-[#222]">
                                    {review
                                        .reviewer
                                        ?.name ||
                                        "Customer"}
                                </div>

                                <div className="mt-[1px] text-[11px] text-[#888]">
                                    {review
                                        .reviewer
                                        ?.email ||
                                        "No email"}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <label className="text-[13px] font-semibold text-[#333]">
                            Your reply
                        </label>

                        <textarea
                            value={
                                reply
                            }
                            disabled={
                                saving
                            }
                            onChange={(
                                event
                            ) =>
                                setReply(
                                    event
                                        .target
                                        .value
                                )
                            }
                            rows={4}
                            maxLength={
                                2000
                            }
                            placeholder="Write a reply to this review"
                            className="mt-2 w-full resize-y rounded-[10px] border border-[#dcdcdc] px-3.5 py-3 text-[13px] leading-5 text-[#222] outline-none transition focus:border-[#2065D1] focus:ring-2 focus:ring-blue-100 disabled:bg-[#f7f7f7]"
                        />

                        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
                            <span className="text-[11px] text-[#999]">
                                {reply.length}
                                /2000
                            </span>

                            <div className="flex gap-2">
                                {review.admin_reply && (
                                    <button
                                        type="button"
                                        disabled={
                                            Boolean(
                                                actionLoading
                                            )
                                        }
                                        onClick={
                                            deleteReply
                                        }
                                        className="h-9 rounded-[9px] border border-[#dedede] px-3.5 text-[12px] font-medium text-[#555] transition hover:bg-[#f7f7f7] disabled:opacity-50"
                                    >
                                        Remove
                                        reply
                                    </button>
                                )}

                                <button
                                    type="button"
                                    disabled={
                                        saving ||
                                        !reply.trim()
                                    }
                                    onClick={
                                        saveReply
                                    }
                                    className="flex h-9 min-w-[108px] items-center justify-center gap-2 rounded-[9px] bg-[#2065D1] px-4 text-[12px] font-semibold text-white transition hover:bg-[#1959bd] disabled:cursor-not-allowed disabled:bg-[#94afe0]"
                                >
                                    {saving && (
                                        <LoaderCircle
                                            size={
                                                14
                                            }
                                            className="animate-spin"
                                        />
                                    )}

                                    {saving
                                        ? "Saving..."
                                        : review.admin_reply
                                            ? "Update reply"
                                            : "Reply"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 rounded-[9px] border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12px] text-red-600">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#e8e8e8] bg-[#fafafa] px-6 py-4">
                    <button
                        type="button"
                        onClick={
                            onDelete
                        }
                        disabled={
                            saving ||
                            Boolean(
                                actionLoading
                            )
                        }
                        className="flex h-9 items-center gap-2 rounded-[9px] px-3 text-[12px] font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                    >
                        <Trash2
                            size={14}
                        />
                        Delete review
                    </button>

                    <div className="flex flex-wrap items-center justify-end gap-2">
                        {review.is_on_hold ? (
                            <ActionButton
                                loading={
                                    actionLoading.includes(
                                        "release-hold"
                                    )
                                }
                                disabled={
                                    saving ||
                                    Boolean(
                                        actionLoading
                                    )
                                }
                                icon={
                                    CheckCircle2
                                }
                                label="Release hold"
                                onClick={() =>
                                    callAction(
                                        "post",
                                        `/admin/reviews/${review.id}/release-hold`
                                    )
                                }
                            />
                        ) : (
                            <ActionButton
                                loading={
                                    actionLoading.includes(
                                        "/hold"
                                    )
                                }
                                disabled={
                                    saving ||
                                    Boolean(
                                        actionLoading
                                    )
                                }
                                icon={
                                    CirclePause
                                }
                                label="Put on hold"
                                onClick={() =>
                                    callAction(
                                        "post",
                                        `/admin/reviews/${review.id}/hold`
                                    )
                                }
                            />
                        )}

                        {review.status !==
                            "approved" && (
                            <ActionButton
                                loading={
                                    actionLoading.includes(
                                        "/publish"
                                    )
                                }
                                disabled={
                                    saving ||
                                    Boolean(
                                        actionLoading
                                    )
                                }
                                icon={
                                    CheckCircle2
                                }
                                label="Publish"
                                primary
                                onClick={() =>
                                    callAction(
                                        "post",
                                        `/admin/reviews/${review.id}/publish`
                                    )
                                }
                            />
                        )}

                        {review.status !==
                            "rejected" && (
                            <ActionButton
                                loading={
                                    actionLoading.includes(
                                        "/reject"
                                    )
                                }
                                disabled={
                                    saving ||
                                    Boolean(
                                        actionLoading
                                    )
                                }
                                icon={
                                    XCircle
                                }
                                label="Reject"
                                danger
                                onClick={() =>
                                    callAction(
                                        "post",
                                        `/admin/reviews/${review.id}/reject`
                                    )
                                }
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function DeleteReviewModal({
    review,
    onClose,
    onDeleted,
}) {
    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");

    const handleDelete = async () => {
        setLoading(true);
        setError("");

        try {
            const response =
                await api.delete(
                    `/admin/reviews/${review.id}`
                );

            await onDeleted(
                response.data
                    ?.message ||
                "Review deleted successfully."
            );
        } catch (err) {
            setError(
                firstApiError(
                    err
                ) ||
                "Unable to delete review."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/45 px-4">
            <div className="relative w-full max-w-[440px] overflow-hidden rounded-[18px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <div className="h-1 w-full bg-red-500" />

                <button
                    type="button"
                    disabled={
                        loading
                    }
                    onClick={
                        onClose
                    }
                    className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-[#888] transition hover:bg-[#f3f3f3] disabled:opacity-50"
                >
                    <X size={18} />
                </button>

                <div className="px-6 pb-6 pt-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <Trash2
                            size={
                                21
                            }
                        />
                    </div>

                    <h2 className="mt-5 text-[20px] font-semibold text-[#222]">
                        Delete Review
                    </h2>

                    <p className="mt-2 text-[14px] leading-6 text-[#666]">
                        Delete the review
                        from{" "}
                        <span className="font-semibold text-[#222]">
                            {review
                                .reviewer
                                ?.name ||
                                "this customer"}
                        </span>
                        ? This action
                        cannot be
                        undone.
                    </p>

                    {error && (
                        <div className="mt-4 rounded-[9px] border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-600">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex gap-3 border-t border-[#eeeeee] bg-[#fafafa] px-6 py-4">
                    <button
                        type="button"
                        disabled={
                            loading
                        }
                        onClick={
                            onClose
                        }
                        className="h-11 flex-1 rounded-[11px] border border-[#d8d8d8] bg-white px-4 text-[13px] font-semibold text-[#444] transition hover:bg-[#f5f5f5] disabled:opacity-60"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={
                            loading
                        }
                        onClick={
                            handleDelete
                        }
                        className="h-11 flex-1 rounded-[11px] bg-red-600 px-4 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                        {loading
                            ? "Deleting..."
                            : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
}

function FilterMenu({
    rating,
    sort,
    onRatingChange,
    onSortChange,
    onClose,
}) {
    return (
        <div className="absolute right-0 top-[46px] z-30 w-[250px] rounded-[12px] border border-[#dedede] bg-white p-4 shadow-[0_14px_35px_rgba(0,0,0,0.14)]">
            <div>
                <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#777]">
                    Rating
                </label>

                <select
                    value={
                        rating
                    }
                    onChange={(
                        event
                    ) =>
                        onRatingChange(
                            event.target
                                .value
                        )
                    }
                    className="mt-2 h-10 w-full rounded-[9px] border border-[#dedede] bg-white px-3 text-[12px] text-[#333] outline-none"
                >
                    <option value="">
                        All ratings
                    </option>

                    {[5, 4, 3, 2, 1].map(
                        (
                            value
                        ) => (
                            <option
                                key={
                                    value
                                }
                                value={
                                    value
                                }
                            >
                                {
                                    value
                                }{" "}
                                star
                                {value ===
                                1
                                    ? ""
                                    : "s"}
                            </option>
                        )
                    )}
                </select>
            </div>

            <div className="mt-4">
                <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#777]">
                    Sort
                </label>

                <select
                    value={
                        sort
                    }
                    onChange={(
                        event
                    ) =>
                        onSortChange(
                            event.target
                                .value
                        )
                    }
                    className="mt-2 h-10 w-full rounded-[9px] border border-[#dedede] bg-white px-3 text-[12px] text-[#333] outline-none"
                >
                    <option value="recent">
                        Most recent
                    </option>

                    <option value="oldest">
                        Oldest
                    </option>

                    <option value="highest">
                        Highest rated
                    </option>

                    <option value="lowest">
                        Lowest rated
                    </option>
                </select>
            </div>

            <div className="mt-4 flex justify-between gap-2">
                <button
                    type="button"
                    onClick={() => {
                        onRatingChange(
                            ""
                        );
                        onSortChange(
                            "recent"
                        );
                    }}
                    className="h-9 rounded-[8px] px-3 text-[12px] font-medium text-[#666] transition hover:bg-[#f5f5f5]"
                >
                    Clear
                </button>

                <button
                    type="button"
                    onClick={
                        onClose
                    }
                    className="h-9 rounded-[8px] bg-[#171717] px-4 text-[12px] font-semibold text-white transition hover:bg-black"
                >
                    Done
                </button>
            </div>
        </div>
    );
}

function ActionButton({
    icon: Icon,
    label,
    onClick,
    loading,
    disabled,
    primary = false,
    danger = false,
}) {
    let className =
        "border-[#d9d9d9] bg-white text-[#333] hover:bg-[#f7f7f7]";

    if (primary) {
        className =
            "border-[#2065D1] bg-[#2065D1] text-white hover:bg-[#1959bd]";
    }

    if (danger) {
        className =
            "border-red-200 bg-white text-red-600 hover:bg-red-50";
    }

    return (
        <button
            type="button"
            disabled={
                disabled
            }
            onClick={
                onClick
            }
            className={`flex h-9 items-center gap-2 rounded-[9px] border px-3.5 text-[12px] font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
        >
            {loading ? (
                <LoaderCircle
                    size={14}
                    className="animate-spin"
                />
            ) : (
                <Icon
                    size={14}
                />
            )}

            {label}
        </button>
    );
}

function ReviewStars({
    rating = 0,
    size = 14,
}) {
    const value =
        Number(
            rating || 0
        );

    return (
        <div className="flex gap-[1px]">
            {[1, 2, 3, 4, 5].map(
                (star) => (
                    <Star
                        key={
                            star
                        }
                        size={
                            size
                        }
                        fill={
                            star <=
                            value
                                ? "#10213d"
                                : "#d6d9dd"
                        }
                        color={
                            star <=
                            value
                                ? "#10213d"
                                : "#d6d9dd"
                        }
                        strokeWidth={
                            0
                        }
                    />
                )
            )}
        </div>
    );
}

function ReviewStatusBadge({
    review,
}) {
    const status =
        review.display_status ||
        review.status ||
        "pending";

    if (
        status ===
        "published"
    ) {
        return (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#d8faea] px-2.5 py-[5px] text-[10px] font-medium text-[#12875f]">
                <CheckCircle2
                    size={11}
                />
                Published
            </span>
        );
    }

    if (
        status ===
        "on_hold"
    ) {
        return (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#fff1cf] px-2.5 py-[5px] text-[10px] font-medium text-[#a56b00]">
                <CirclePause
                    size={11}
                />
                On hold
            </span>
        );
    }

    if (
        status ===
        "rejected"
    ) {
        return (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-red-50 px-2.5 py-[5px] text-[10px] font-medium text-red-600">
                <XCircle
                    size={11}
                />
                Rejected
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#f1f1f1] px-2.5 py-[5px] text-[10px] font-medium text-[#666]">
            Pending
        </span>
    );
}

function PerformanceBadge({
    performance,
}) {
    const key =
        performance?.key ||
        "no_reviews";

    let className =
        "bg-[#f0f0f0] text-[#666]";

    if (
        key ===
        "excellent"
    ) {
        className =
            "bg-[#d8faea] text-[#148460]";
    } else if (
        key === "good"
    ) {
        className =
            "bg-[#e4f2ff] text-[#2765a8]";
    } else if (
        key === "average"
    ) {
        className =
            "bg-[#fff1cf] text-[#996300]";
    } else if (
        key ===
        "needs_attention" ||
        key === "poor"
    ) {
        className =
            "bg-red-50 text-red-600";
    }

    return (
        <span
            className={`rounded-full px-2.5 py-[4px] text-[10px] font-medium ${className}`}
        >
            {performance?.label ||
                "No reviews"}
        </span>
    );
}

function ReviewerAvatar({
    reviewer,
}) {
    const initials =
        getInitials(
            reviewer?.name
        );

    return (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#f2f2f2] text-[12px] font-medium text-[#555]">
            {reviewer?.avatar_url ? (
                <img
                    src={
                        reviewer.avatar_url
                    }
                    alt={
                        reviewer.name ||
                        "Reviewer"
                    }
                    className="h-full w-full object-cover"
                />
            ) : (
                initials
            )}
        </div>
    );
}

function Pagination({
    pagination,
    onPageChange,
}) {
    return (
        <div className="flex items-center justify-between border-t border-[#e5e5e5] px-5 py-3.5">
            <div className="text-[11px] text-[#777]">
                Showing{" "}
                {pagination.from ||
                    0}
                {" - "}
                {pagination.to ||
                    0}
                {" of "}
                {pagination.total}
            </div>

            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={
                        pagination.current_page <=
                        1
                    }
                    onClick={() =>
                        onPageChange(
                            pagination.current_page -
                            1
                        )
                    }
                    className="flex h-8 items-center gap-1 rounded-[8px] border border-[#dedede] px-2.5 text-[11px] font-medium text-[#555] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft
                        size={14}
                    />
                    Previous
                </button>

                <div className="flex h-8 min-w-[48px] items-center justify-center rounded-[8px] border border-[#e2e2e2] px-2.5 text-[11px] font-medium text-[#444]">
                    {pagination.current_page}
                    {" / "}
                    {pagination.last_page}
                </div>

                <button
                    type="button"
                    disabled={
                        pagination.current_page >=
                        pagination.last_page
                    }
                    onClick={() =>
                        onPageChange(
                            pagination.current_page +
                            1
                        )
                    }
                    className="flex h-8 items-center gap-1 rounded-[8px] border border-[#dedede] px-2.5 text-[11px] font-medium text-[#555] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    Next
                    <ChevronRight
                        size={14}
                    />
                </button>
            </div>
        </div>
    );
}

function TableHead({
    children,
}) {
    return (
        <th className="px-4 py-3 text-left text-[11px] font-medium text-[#666]">
            {children}
        </th>
    );
}

function LoadingRows() {
    return Array.from({
        length: 5,
    }).map((_, index) => (
        <tr
            key={
                index
            }
            className="border-b border-[#ececec] last:border-b-0"
        >
            {Array.from({
                length: 7,
            }).map(
                (
                    __,
                    cellIndex
                ) => (
                    <td
                        key={
                            cellIndex
                        }
                        className="px-4 py-5"
                    >
                        <div className="h-4 animate-pulse rounded bg-[#f0f0f0]" />
                    </td>
                )
            )}
        </tr>
    ));
}

function EmptyReviews() {
    return (
        <tr>
            <td
                colSpan="7"
                className="px-6 py-16 text-center"
            >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f3f3] text-[#777]">
                    <Star
                        size={21}
                    />
                </div>

                <h3 className="mt-4 text-[14px] font-semibold text-[#222]">
                    No reviews found
                </h3>

                <p className="mt-1 text-[12px] text-[#777]">
                    Reviews matching
                    this filter will
                    appear here.
                </p>
            </td>
        </tr>
    );
}

function MessageBanner({
    type,
    message,
    onClose,
}) {
    const success =
        type ===
        "success";

    return (
        <div
            className={`mb-4 rounded-[10px] border px-4 py-3 text-[12px] ${
                success
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
            }`}
        >
            <div className="flex items-center justify-between gap-4">
                <span>
                    {message}
                </span>

                <button
                    type="button"
                    onClick={
                        onClose
                    }
                    className="rounded p-1 hover:bg-black/5"
                >
                    <X size={14} />
                </button>
            </div>
        </div>
    );
}

function getInitials(
    name
) {
    const parts =
        String(
            name || "C"
        )
            .trim()
            .split(/\s+/)
            .filter(Boolean);

    if (
        parts.length === 1
    ) {
        return parts[0]
            .slice(0, 1)
            .toUpperCase();
    }

    return (
        parts[0]
            .slice(0, 1) +
        parts[
            parts.length - 1
        ]
            .slice(0, 1)
    ).toUpperCase();
}

function firstApiError(
    error
) {
    const errors =
        error.response?.data
            ?.errors;

    if (errors) {
        const first =
            Object.values(
                errors
            )
                .flat()
                .find(Boolean);

        if (first) {
            return first;
        }
    }

    return (
        error.response?.data
            ?.message ||
        ""
    );
}
