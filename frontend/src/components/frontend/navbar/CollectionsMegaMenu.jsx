import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import api from "../../../api/axios";

const CollectionsMegaMenu = ({ onOpen }) => {
    const location = useLocation();
    const closeTimer = useRef(null);

    const [open, setOpen] = useState(false);
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);

    const isActive = location.pathname.startsWith("/collections");

    useEffect(() => {
        fetchCollections();

        return () => {
            if (closeTimer.current) {
                clearTimeout(closeTimer.current);
            }
        };
    }, []);

    // Fetch collections
    const fetchCollections = async () => {
        try {
            setLoading(true);

            const response = await api.get("/collection-menu");

            setCollections(
                response.data?.collections || []
            );
        } catch (error) {
            console.error(
                "Collection menu error:",
                error.response?.data || error.message
            );

            setCollections([]);
        } finally {
            setLoading(false);
        }
    };

    // Open menu
    const openMenu = () => {
        if (closeTimer.current) {
            clearTimeout(closeTimer.current);
        }

        setOpen(true);

        if (onOpen) {
            onOpen();
        }
    };

    // Close menu
    const closeMenu = () => {
        closeTimer.current = setTimeout(() => {
            setOpen(false);
        }, 150);
    };

    return (
        <div
            onMouseEnter={openMenu}
            onMouseLeave={closeMenu}
            className="relative"
        >

            {/* Trigger */}
            <Link
                to="/collections"
                className={getTriggerClass(isActive)}
            >
                Collections
                <ChevronDown open={open} />
            </Link>

            {/* Dropdown */}
            {open && (
                <div className="absolute left-0 top-full z-[1000] pt-[14px]">

                    <div className="w-[740px] rounded-b-[16px] bg-white px-[22px] py-[18px] shadow-[0_18px_45px_rgba(0,0,0,0.12)]">

                        {loading ? (
                            <MenuLoader />
                        ) : (
                            <CollectionGrid
                                collections={collections}
                                onNavigate={() => setOpen(false)}
                            />
                        )}

                    </div>

                </div>
            )}

        </div>
    );
};

// Collection grid
const CollectionGrid = ({
    collections,
    onNavigate,
}) => {
    if (!collections.length) {
        return (
            <div className="flex min-h-[150px] items-center justify-center">
                <p className="text-[13px] text-[#888888]">
                    No collections available.
                </p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-3 gap-x-[28px] gap-y-[16px]">

            {collections.map((collection) => (
                <CollectionItem
                    key={collection.id}
                    collection={collection}
                    onNavigate={onNavigate}
                />
            ))}

        </div>
    );
};

// Collection item
const CollectionItem = ({
    collection,
    onNavigate,
}) => {
    return (
        <Link
            to={`/collections/${collection.slug}`}
            onClick={onNavigate}
            className="group flex min-w-0 items-center gap-[12px]"
        >

            <CollectionImage collection={collection} />

            <div className="min-w-0">

                <p className="truncate text-[14px] font-semibold text-[#222222] transition-colors group-hover:text-[#2065D1]">
                    {collection.title}
                </p>

                <p className="mt-[3px] truncate text-[12px] text-[#888888]">
                    {getDescription(collection)}
                </p>

            </div>

        </Link>
    );
};

// Collection image
const CollectionImage = ({ collection }) => {
    const [imageError, setImageError] = useState(false);

    const image = getImageUrl(collection.image);

    if (image && !imageError) {
        return (
            <div className="h-[54px] w-[54px] shrink-0 overflow-hidden rounded-[12px] bg-[#f5f5f5]">
                <img
                    src={image}
                    alt={collection.title}
                    onError={() => setImageError(true)}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
            </div>
        );
    }

    return (
        <div className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[12px] bg-[#f7f7f7]">
            <CollectionPlaceholder />
        </div>
    );
};

// Loader
const MenuLoader = () => {
    return (
        <div className="grid min-h-[210px] grid-cols-3 gap-x-[28px] gap-y-[16px]">

            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((item) => (
                <div
                    key={item}
                    className="flex items-center gap-[12px]"
                >
                    <div className="h-[54px] w-[54px] shrink-0 animate-pulse rounded-[12px] bg-[#eeeeee]" />

                    <div className="flex-1">
                        <div className="h-[12px] w-[85%] animate-pulse rounded bg-[#eeeeee]" />
                        <div className="mt-[8px] h-[10px] w-[65%] animate-pulse rounded bg-[#f2f2f2]" />
                    </div>
                </div>
            ))}

        </div>
    );
};

// Description
const getDescription = (collection) => {
    if (!collection.description) {
        return "Explore this collection";
    }

    return collection.description;
};

// Trigger class
const getTriggerClass = (active) => {
    if (active) {
        return "flex items-center gap-[4px] whitespace-nowrap text-[14px] font-semibold text-[#2065D1] transition-colors duration-200";
    }

    return "flex items-center gap-[4px] whitespace-nowrap text-[14px] font-semibold text-[#222222] transition-colors duration-200 hover:text-[#2065D1]";
};

// Chevron
const ChevronDown = ({ open }) => {
    const rotateClass = open
        ? "rotate-180"
        : "";

    return (
        <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform duration-200 ${rotateClass}`}
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
};

// Placeholder
const CollectionPlaceholder = () => {
    return (
        <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#777777"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m12 2 8 4-8 4-8-4 8-4Z" />
            <path d="m4 10 8 4 8-4" />
            <path d="m4 14 8 4 8-4" />
        </svg>
    );
};

// Image URL
const getImageUrl = (path) => {
    if (!path) {
        return "";
    }

    if (
        path.startsWith("http://") ||
        path.startsWith("https://")
    ) {
        return path;
    }

    const apiBase = api.defaults.baseURL || "";
    const backendBase = apiBase.replace(/\/api\/?$/, "");

    return `${backendBase}/${path.replace(/^\/+/, "")}`;
};

export default CollectionsMegaMenu;