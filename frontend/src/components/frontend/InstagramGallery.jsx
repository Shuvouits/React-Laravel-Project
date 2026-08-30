import {
    ChevronLeft,
    ChevronRight,
    LoaderCircle,
} from "lucide-react";
import {
    useEffect,
    useMemo,
    useState,
} from "react";
import api from "../../api/axios";

const InstagramIcon = ({
    size = 20,
    className = "",
}) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="5"
                stroke="currentColor"
                strokeWidth="2"
            />

            <circle
                cx="12"
                cy="12"
                r="4"
                stroke="currentColor"
                strokeWidth="2"
            />

            <circle
                cx="17.5"
                cy="6.5"
                r="1.1"
                fill="currentColor"
            />
        </svg>
    );
};

const getResponsiveColumns = (
    desktopColumns
) => {
    if (typeof window === "undefined") {
        return desktopColumns;
    }

    if (window.innerWidth < 640) {
        return 2;
    }

    if (window.innerWidth < 1024) {
        return 3;
    }

    return desktopColumns;
};

const InstagramGallery = () => {
    const [gallery, setGallery] = useState({
        active: false,
        title: "From Instagram",
        settings: {
            limit: 10,
            desktop_columns: 5,
        },
        images: [],
    });

    const [loading, setLoading] =
        useState(true);

    const [currentPage, setCurrentPage] =
        useState(0);

    const [columns, setColumns] =
        useState(5);

    useEffect(() => {
        let mounted = true;

        const fetchGallery = async () => {
            try {
                setLoading(true);

                const response = await api.get(
                    "/home/instagram-gallery"
                );

                if (!mounted) {
                    return;
                }

                const data =
                    response.data || {};

                const desktopColumns = Math.min(
                    Math.max(
                        Number(
                            data?.settings
                                ?.desktop_columns
                        ) || 5,
                        3
                    ),
                    6
                );

                setGallery({
                    active:
                        data.active === true,
                    title:
                        data.title ||
                        "From Instagram",
                    settings: {
                        limit:
                            Number(
                                data?.settings
                                    ?.limit
                            ) || 10,
                        desktop_columns:
                            desktopColumns,
                    },
                    images:
                        Array.isArray(
                            data.images
                        )
                            ? data.images
                            : [],
                });

                setColumns(
                    getResponsiveColumns(
                        desktopColumns
                    )
                );
            } catch (error) {
                console.error(
                    "Instagram gallery error:",
                    error
                );

                if (mounted) {
                    setGallery(
                        (previous) => ({
                            ...previous,
                            active: false,
                            images: [],
                        })
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchGallery();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            const nextColumns =
                getResponsiveColumns(
                    gallery.settings
                        .desktop_columns
                );

            setColumns(nextColumns);
            setCurrentPage(0);
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
    }, [
        gallery.settings.desktop_columns,
    ]);

    const pages = useMemo(() => {
        const result = [];

        for (
            let index = 0;
            index < gallery.images.length;
            index += columns
        ) {
            result.push(
                gallery.images.slice(
                    index,
                    index + columns
                )
            );
        }

        return result;
    }, [
        gallery.images,
        columns,
    ]);

    useEffect(() => {
        if (
            currentPage >
            pages.length - 1
        ) {
            setCurrentPage(
                Math.max(
                    pages.length - 1,
                    0
                )
            );
        }
    }, [
        currentPage,
        pages.length,
    ]);

    const canSlide =
        pages.length > 1;

    const handlePrevious = () => {
        setCurrentPage((previous) => {
            if (previous <= 0) {
                return pages.length - 1;
            }

            return previous - 1;
        });
    };

    const handleNext = () => {
        setCurrentPage((previous) => {
            if (
                previous >=
                pages.length - 1
            ) {
                return 0;
            }

            return previous + 1;
        });
    };

    if (loading) {
        return (
            <section className="bg-white py-[58px]">
                <div className="mx-auto flex max-w-[1490px] items-center justify-center px-5 lg:px-8">
                    <LoaderCircle
                        size={25}
                        className="animate-spin text-[#2065D1]"
                    />
                </div>
            </section>
        );
    }

    if (
        !gallery.active ||
        gallery.images.length === 0
    ) {
        return null;
    }

    return (
        <section className="overflow-hidden bg-white py-[64px] md:py-[76px]">
            <div className="mx-auto max-w-[1490px] px-5 lg:px-8">
                <div className="mb-[24px] flex items-center justify-between gap-5">
                    <div className="flex items-center gap-[10px]">
                        <span className="flex h-[36px] w-[36px] items-center justify-center rounded-full bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white">
                           <InstagramIcon size={18} />
                        </span>

                        <h2 className="text-[24px] font-bold leading-[1.2] tracking-[-0.5px] text-[#1e1f22] md:text-[29px]">
                            {gallery.title}
                        </h2>
                    </div>

                    {canSlide && (
                        <div className="flex items-center gap-[8px]">
                            <button
                                type="button"
                                onClick={
                                    handlePrevious
                                }
                                aria-label="Previous Instagram images"
                                className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#e2e3e6] bg-white text-[#585b62] transition hover:border-[#c8cbd0] hover:bg-[#f7f7f8] hover:text-[#111]"
                            >
                                <ChevronLeft
                                    size={19}
                                />
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleNext
                                }
                                aria-label="Next Instagram images"
                                className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-[#e2e3e6] bg-white text-[#585b62] transition hover:border-[#c8cbd0] hover:bg-[#f7f7f8] hover:text-[#111]"
                            >
                                <ChevronRight
                                    size={19}
                                />
                            </button>
                        </div>
                    )}
                </div>

                <div className="overflow-hidden">
                    <div
                        className="flex transition-transform duration-500 ease-out"
                        style={{
                            transform: `translateX(-${
                                currentPage * 100
                            }%)`,
                        }}
                    >
                        {pages.map(
                            (
                                pageImages,
                                pageIndex
                            ) => (
                                <div
                                    key={
                                        pageIndex
                                    }
                                    className="w-full shrink-0"
                                >
                                    <div
                                        className="grid gap-[14px] md:gap-[18px]"
                                        style={{
                                            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                                        }}
                                    >
                                        {pageImages.map(
                                            (
                                                image,
                                                imageIndex
                                            ) => {
                                                const content = (
                                                    <div className="group relative aspect-square overflow-hidden rounded-[16px] border border-[#e6e7e9] bg-[#f7f7f7]">
                                                        <img
                                                            src={
                                                                image.image_url
                                                            }
                                                            alt={
                                                                image.image_alt ||
                                                                `Instagram gallery image ${
                                                                    pageIndex *
                                                                        columns +
                                                                    imageIndex +
                                                                    1
                                                                }`
                                                            }
                                                            loading="lazy"
                                                            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]"
                                                        />

                                                        {image.link && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition duration-300 group-hover:bg-black/25 group-hover:opacity-100">
                                                                <span className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white/95 text-[#1f2023] shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
                                                                    <Instagram
                                                                        size={
                                                                            21
                                                                        }
                                                                    />
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );

                                                if (
                                                    !image.link
                                                ) {
                                                    return (
                                                        <div
                                                            key={
                                                                image.id ||
                                                                imageIndex
                                                            }
                                                        >
                                                            {
                                                                content
                                                            }
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <a
                                                        key={
                                                            image.id ||
                                                            imageIndex
                                                        }
                                                        href={
                                                            image.link
                                                        }
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        aria-label={
                                                            image.image_alt ||
                                                            "View Instagram post"
                                                        }
                                                        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2065D1] focus-visible:ring-offset-2"
                                                    >
                                                        {
                                                            content
                                                        }
                                                    </a>
                                                );
                                            }
                                        )}
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {canSlide && (
                    <div className="mt-[22px] flex items-center justify-center gap-[7px]">
                        {pages.map(
                            (_, pageIndex) => (
                                <button
                                    key={
                                        pageIndex
                                    }
                                    type="button"
                                    onClick={() =>
                                        setCurrentPage(
                                            pageIndex
                                        )
                                    }
                                    aria-label={`Go to gallery slide ${
                                        pageIndex +
                                        1
                                    }`}
                                    className={`h-[7px] rounded-full transition-all ${
                                        currentPage ===
                                        pageIndex
                                            ? "w-[24px] bg-[#2065D1]"
                                            : "w-[7px] bg-[#cfd2d7] hover:bg-[#aeb2b9]"
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

export default InstagramGallery;