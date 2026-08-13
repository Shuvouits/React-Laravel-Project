import { useEffect, useRef, useState } from "react";
import {
    ChevronRight,
    Pencil,
    Smartphone,
} from "lucide-react";

import api from "../../../api/axios";

const CategoryMegaMenu = ({ isOpen, isAdmin = false }) => {
    const fileInputRef = useRef(null);

    const [categories, setCategories] = useState([]);
    const [activeParent, setActiveParent] = useState(null);
    const [activeChild, setActiveChild] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchCategories();
    }, []);

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await api.get("/category-mega-menu");
            const items = response.data?.categories || [];

            setCategories(items);

            if (items.length > 0) {
                setActiveParent(items[0]);

                if (items[0].children?.length > 0) {
                    setActiveChild(items[0].children[0]);
                }
            }
        } catch (error) {
            console.error("Unable to load mega menu.", error);
        }
    };

    // Select parent
    const selectParent = (category) => {
        setActiveParent(category);

        if (category.children?.length > 0) {
            setActiveChild(category.children[0]);
            return;
        }

        setActiveChild(null);
    };

    // Select child
    const selectChild = (category) => {
        setActiveChild(category);
    };

    // Open image picker
    const openImagePicker = () => {
        if (!isAdmin) {
            return;
        }

        fileInputRef.current?.click();
    };

    // Upload mega menu image
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];

        if (!file || !activeParent) {
            return;
        }

        try {
            setUploading(true);

            const data = new FormData();
            data.append("image", file);

            await api.post(
                `/admin/categories/${activeParent.id}/mega-menu-image`,
                data
            );

            await fetchCategories();
        } catch (error) {
            console.error("Unable to update mega menu image.", error);
        } finally {
            setUploading(false);
            e.target.value = "";
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="absolute left-0 top-full z-[1000] w-full bg-white shadow-[0_20px_45px_rgba(0,0,0,0.12)]">
            <div className="mx-auto grid max-w-[1280px] grid-cols-[250px_255px_1fr_280px]">

                {/* Parent categories */}
                <div className="border-r border-[#ececec] p-[14px]">
                    {categories.map((category) => (
                        <button
                            key={category.id}
                            type="button"
                            onMouseEnter={() => selectParent(category)}
                            onClick={() => selectParent(category)}
                            className={getParentClass(activeParent?.id === category.id)}
                        >
                            <span className="flex items-center gap-[12px]">
                                <Smartphone size={18} />
                                {category.name}
                            </span>

                            <ChevronRight size={15} />
                        </button>
                    ))}

                    <a
                        href="/categories"
                        className="mt-[10px] flex items-center justify-center gap-[6px] py-[12px] text-[13px] font-medium text-[#2065D1]"
                    >
                        View All
                        <ChevronRight size={14} />
                    </a>
                </div>

                {/* Child categories */}
                <div className="border-r border-[#ececec] px-[20px] py-[18px]">
                    <p className="mb-[12px] text-[11px] font-semibold uppercase tracking-[0.08em] text-[#777]">
                        {activeParent?.name}
                    </p>

                    <div className="space-y-[4px]">
                        {activeParent?.children?.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                onMouseEnter={() => selectChild(category)}
                                onClick={() => selectChild(category)}
                                className={getChildClass(activeChild?.id === category.id)}
                            >
                                <span>{category.name}</span>
                                <ChevronRight size={14} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grandchild categories */}
                <div className="px-[28px] py-[18px]">
                    <div className="flex items-center justify-between border-b border-[#eeeeee] pb-[12px]">
                        <h3 className="text-[14px] font-semibold text-[#222]">
                            {activeChild?.name || activeParent?.name}
                        </h3>

                        {activeChild && (
                            <a
                                href={`/products?category=${activeChild.slug}`}
                                className="flex items-center gap-[5px] text-[12px] font-medium text-[#2065D1]"
                            >
                                View all
                                <ChevronRight size={13} />
                            </a>
                        )}
                    </div>

                    <div className="mt-[18px] grid grid-cols-2 gap-x-[40px] gap-y-[18px]">
                        {activeChild?.children?.map((category) => (
                            <a
                                key={category.id}
                                href={`/products?category=${category.slug}`}
                                className="text-[13px] text-[#555] transition hover:text-[#2065D1]"
                            >
                                {category.name}
                            </a>
                        ))}
                    </div>
                </div>

                {/* Mega menu image */}
                <div className="relative p-[18px]">
                    <div className="relative h-[310px] overflow-hidden rounded-[18px] bg-[#f4f4f4]">

                        {activeParent?.mega_menu_image && (
                            <img
                                src={getImageUrl(activeParent.mega_menu_image)}
                                alt={activeParent.name}
                                className="h-full w-full object-cover"
                            />
                        )}

                        {isAdmin && (
                            <button
                                type="button"
                                onClick={openImagePicker}
                                disabled={uploading}
                                className="absolute right-[12px] top-[12px] flex h-[38px] w-[38px] items-center justify-center rounded-full bg-white text-[#2065D1] shadow-md transition hover:bg-[#2065D1] hover:text-white disabled:opacity-50"
                            >
                                <Pencil size={16} />
                            </button>
                        )}

                        {uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                <div className="h-[28px] w-[28px] animate-spin rounded-full border-2 border-white/40 border-t-white" />
                            </div>
                        )}

                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleImageUpload}
                        className="hidden"
                    />
                </div>

            </div>
        </div>
    );
};

// Parent category class
const getParentClass = (active) => {
    if (active) {
        return "mb-[4px] flex w-full items-center justify-between rounded-[12px] bg-[#edf4ff] px-[14px] py-[12px] text-left text-[13px] font-medium text-[#2065D1]";
    }

    return "mb-[4px] flex w-full items-center justify-between rounded-[12px] px-[14px] py-[12px] text-left text-[13px] text-[#555] transition hover:bg-[#f5f5f5]";
};

// Child category class
const getChildClass = (active) => {
    if (active) {
        return "flex w-full items-center justify-between rounded-[10px] bg-[#edf4ff] px-[12px] py-[10px] text-left text-[13px] font-medium text-[#2065D1]";
    }

    return "flex w-full items-center justify-between rounded-[10px] px-[12px] py-[10px] text-left text-[13px] text-[#555] transition hover:bg-[#f5f5f5]";
};

// Image URL
const getImageUrl = (path) => {
    if (!path) {
        return "";
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    const apiBase = api.defaults.baseURL || "";
    const backendBase = apiBase.replace(/\/api\/?$/, "");

    return `${backendBase}/${path.replace(/^\/+/, "")}`;
};

export default CategoryMegaMenu;