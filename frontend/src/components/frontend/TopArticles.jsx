import {
    ArrowLeft,
    ArrowRight,
    CalendarDays,
    FileText,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    Link,
} from "react-router-dom";

import api from "../../api/axios";

const TopArticles = () => {
    const [section, setSection] =
        useState(null);

    const [articles, setArticles] =
        useState([]);

    const [active, setActive] =
        useState(false);

    const [loading, setLoading] =
        useState(true);

    const [currentPage, setCurrentPage] =
        useState(0);

    const [screenWidth, setScreenWidth] =
        useState(
            typeof window !==
                "undefined"
                ? window.innerWidth
                : 1440
        );

    useEffect(() => {
        loadArticles();
    }, []);

    useEffect(() => {
        const handleResize = () => {
            setScreenWidth(
                window.innerWidth
            );
        };

        window.addEventListener(
            "resize",
            handleResize
        );

        return () => {
            window.removeEventListener(
                "resize",
                handleResize
            );
        };
    }, []);

    const loadArticles = async () => {
        try {
            setLoading(true);

            const response = await api.get(
                "/home/top-articles"
            );

            setActive(
                Boolean(
                    response.data?.active
                )
            );

            setSection(
                response.data?.section
                    || null
            );

            setArticles(
                Array.isArray(
                    response.data
                        ?.articles
                )
                    ? response.data
                          .articles
                    : []
            );
        } catch (error) {
            console.error(
                "Top Articles error:",
                error
            );

            setActive(false);
            setSection(null);
            setArticles([]);
        } finally {
            setLoading(false);
        }
    };

    const desktopColumns = Math.min(
        Math.max(
            Number(
                section?.desktop_columns
                    || 4
            ),
            2
        ),
        4
    );

    const cardsPerPage =
        screenWidth < 640
            ? 1
            : screenWidth < 1024
              ? 2
              : desktopColumns;

    const totalPages = Math.max(
        Math.ceil(
            articles.length /
                cardsPerPage
        ),
        1
    );

    useEffect(() => {
        setCurrentPage((previous) =>
            Math.min(
                previous,
                totalPages - 1
            )
        );
    }, [
        totalPages,
        cardsPerPage,
    ]);

    const visibleArticles =
        useMemo(() => {
            const start =
                currentPage *
                cardsPerPage;

            return articles.slice(
                start,
                start +
                    cardsPerPage
            );
        }, [
            articles,
            currentPage,
            cardsPerPage,
        ]);

    const goPrevious = () => {
        setCurrentPage(
            (previous) =>
                previous > 0
                    ? previous - 1
                    : totalPages - 1
        );
    };

    const goNext = () => {
        setCurrentPage(
            (previous) =>
                previous <
                totalPages - 1
                    ? previous + 1
                    : 0
        );
    };

    if (!loading && !active) {
        return null;
    }

    if (
        !loading &&
        articles.length === 0
    ) {
        return null;
    }

    return (
        <section className="bg-white py-[70px]">
            <div className="mx-auto w-full max-w-[1500px] px-5 sm:px-7 lg:px-10">
                <div className="mb-[30px] flex items-center justify-between gap-5">
                    <h2 className="text-[28px] font-bold tracking-[-0.5px] text-[#202124]">
                        {section?.title ||
                            "Top Articles"}
                    </h2>

                    {!loading && (
                        <div className="flex items-center gap-3">
                            <Link
                                to="/blog"
                                className="hidden items-center gap-3 text-[14px] font-semibold text-[#242528] transition hover:text-[#2167d9] sm:flex"
                            >
                                All Articles

                                <ArrowRight
                                    size={18}
                                />
                            </Link>

                            {totalPages > 1 && (
                                <div className="ml-2 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={
                                            goPrevious
                                        }
                                        aria-label="Previous articles"
                                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e1e3e6] bg-white text-[#9a9ca2] transition hover:border-[#2167d9] hover:text-[#2167d9]"
                                    >
                                        <ArrowLeft
                                            size={
                                                17
                                            }
                                        />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={
                                            goNext
                                        }
                                        aria-label="Next articles"
                                        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e1e3e6] bg-white text-[#55585e] transition hover:border-[#2167d9] hover:text-[#2167d9]"
                                    >
                                        <ArrowRight
                                            size={
                                                17
                                            }
                                        />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {loading ? (
                    <ArticleSkeletonGrid
                        count={
                            desktopColumns
                        }
                    />
                ) : (
                    <div
                        className="grid grid-cols-1 gap-5 sm:grid-cols-2"
                        style={{
                            gridTemplateColumns:
                                screenWidth >=
                                1024
                                    ? `repeat(${desktopColumns}, minmax(0, 1fr))`
                                    : undefined,
                        }}
                    >
                        {visibleArticles.map(
                            (article) => (
                                <ArticleCard
                                    key={
                                        article.id
                                    }
                                    article={
                                        article
                                    }
                                />
                            )
                        )}
                    </div>
                )}

                {!loading &&
                    totalPages > 1 && (
                        <div className="mt-6 flex justify-center gap-1.5">
                            {Array.from({
                                length:
                                    totalPages,
                            }).map(
                                (
                                    _,
                                    index
                                ) => (
                                    <button
                                        key={
                                            index
                                        }
                                        type="button"
                                        onClick={() =>
                                            setCurrentPage(
                                                index
                                            )
                                        }
                                        aria-label={`Go to article page ${index + 1}`}
                                        className={`h-1.5 rounded-full transition-all ${
                                            currentPage ===
                                            index
                                                ? "w-7 bg-[#2167d9]"
                                                : "w-1.5 bg-[#d7d9dd]"
                                        }`}
                                    />
                                )
                            )}
                        </div>
                    )}
            </div>
        </section>
    );
};

const ArticleCard = ({
    article,
}) => {
    const publishedDate =
        formatArticleDate(
            article.published_at
        );

    return (
        <article className="group flex h-full min-w-0 flex-col overflow-hidden rounded-[15px] border border-[#e1e3e6] bg-white transition duration-200 hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(0,0,0,0.09)]">
            <Link
                to={`/blog/${article.slug}`}
                className="block overflow-hidden bg-[#f3f4f5]"
            >
                {article.featured_image_url ? (
                    <img
                        src={
                            article.featured_image_url
                        }
                        alt={
                            article.featured_image_alt ||
                            article.title
                        }
                        className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-[1.035]"
                    />
                ) : (
                    <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-[#eef4ff] to-[#f7f9fc] text-[#7da5ea]">
                        <FileText
                            size={38}
                            strokeWidth={
                                1.5
                            }
                        />
                    </div>
                )}
            </Link>

            <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
                <Link
                    to={`/blog/${article.slug}`}
                    className="line-clamp-2 text-[19px] font-bold leading-[1.35] tracking-[-0.2px] text-[#202124] transition hover:text-[#2167d9]"
                >
                    {article.title}
                </Link>

                {article.excerpt && (
                    <p className="mt-4 line-clamp-3 text-[14px] leading-[1.7] text-[#74777e]">
                        {article.excerpt}
                    </p>
                )}

                <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                    <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-[#292b2f]">
                            {article.author
                                ?.name ||
                                "Storify Admin"}
                        </p>

                        <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#92959c]">
                            <CalendarDays
                                size={12}
                            />

                            {publishedDate}
                        </p>
                    </div>

                    <Link
                        to={`/blog/${article.slug}`}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-[#242528] px-4 text-[12px] font-semibold text-[#242528] transition hover:bg-[#242528] hover:text-white"
                    >
                        Read More

                        <ArrowRight
                            size={14}
                        />
                    </Link>
                </div>
            </div>
        </article>
    );
};

const ArticleSkeletonGrid = ({
    count = 4,
}) => {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({
                length: count,
            }).map((_, index) => (
                <div
                    key={index}
                    className="overflow-hidden rounded-[15px] border border-[#e5e6e8] bg-white"
                >
                    <div className="aspect-[16/9] animate-pulse bg-[#eceef1]" />

                    <div className="p-5">
                        <div className="h-5 w-4/5 animate-pulse rounded bg-[#eceef1]" />
                        <div className="mt-2 h-5 w-3/5 animate-pulse rounded bg-[#eceef1]" />

                        <div className="mt-5 h-3 w-full animate-pulse rounded bg-[#f0f1f3]" />
                        <div className="mt-2 h-3 w-5/6 animate-pulse rounded bg-[#f0f1f3]" />

                        <div className="mt-7 h-8 w-28 animate-pulse rounded-full bg-[#eceef1]" />
                    </div>
                </div>
            ))}
        </div>
    );
};

const formatArticleDate = (
    value
) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric",
        }
    ).format(date);
};

export default TopArticles;