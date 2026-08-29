import {
    Check,
    LoaderCircle,
    Plus,
    Tag,
    X,
} from "lucide-react";

import {
    useState,
} from "react";

const BlogPostOrganization = ({
    categories = [],
    selectedCategories = [],
    tags = [],
    loading = false,
    disabled = false,
    errors = {},
    onCategoriesChange,
    onTagsChange,
    onManageCategories,
}) => {
    const [tagInput, setTagInput] =
        useState("");

    const categoryError =
        errors?.category_ids?.[0] || "";

    const tagsError =
        errors?.tags?.[0] || "";

    const normalizedSelectedCategories =
        Array.isArray(selectedCategories)
            ? selectedCategories.map(
                  (id) => Number(id)
              )
            : [];

    const normalizedTags =
        Array.isArray(tags)
            ? tags
            : [];

    const isCategorySelected = (
        categoryId
    ) => {
        return normalizedSelectedCategories.includes(
            Number(categoryId)
        );
    };

    const toggleCategory = (
        categoryId
    ) => {
        if (disabled) {
            return;
        }

        const normalizedId =
            Number(categoryId);

        let nextCategories;

        if (
            normalizedSelectedCategories.includes(
                normalizedId
            )
        ) {
            nextCategories =
                normalizedSelectedCategories.filter(
                    (id) =>
                        id !== normalizedId
                );
        } else {
            nextCategories = [
                ...normalizedSelectedCategories,
                normalizedId,
            ];
        }

        onCategoriesChange?.(
            nextCategories
        );
    };

    const addTag = (
        value = tagInput
    ) => {
        const newTags = String(value)
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean);

        if (
            disabled ||
            newTags.length === 0
        ) {
            return;
        }

        const nextTags = [
            ...new Set([
                ...normalizedTags,
                ...newTags,
            ]),
        ].slice(0, 30);

        onTagsChange?.(nextTags);
        setTagInput("");
    };

    const removeTag = (
        tagToRemove
    ) => {
        if (disabled) {
            return;
        }

        onTagsChange?.(
            normalizedTags.filter(
                (tag) =>
                    tag !== tagToRemove
            )
        );
    };

    const handleTagKeyDown = (
        event
    ) => {
        if (
            event.key === "Enter" ||
            event.key === ","
        ) {
            event.preventDefault();
            addTag();
        }

        if (
            event.key === "Backspace" &&
            !tagInput &&
            normalizedTags.length > 0
        ) {
            removeTag(
                normalizedTags[
                    normalizedTags.length - 1
                ]
            );
        }
    };

    return (
        <section className="overflow-hidden rounded-[18px] border border-[#dfe1e5] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <div className="border-b border-[#eceef1] px-5 py-5">
                <h2 className="text-[17px] font-semibold text-[#17181b]">
                    Organization
                </h2>

                <p className="mt-1 text-[12px] leading-[1.5] text-[#858890]">
                    Group this post using
                    categories and tags.
                </p>
            </div>

            <div className="px-5 py-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#eef5ff] text-[#246bdb]">
                            <Tag size={14} />
                        </span>

                        <label className="text-[13px] font-medium text-[#292b30]">
                            Categories
                        </label>
                    </div>

                    <button
                        type="button"
                        onClick={
                            onManageCategories
                        }
                        disabled={disabled}
                        className="text-[12px] font-medium text-[#1769df] transition hover:text-[#0f52b7] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Manage
                    </button>
                </div>

                <div
                    className={`
                        mt-3
                        max-h-[260px]
                        overflow-y-auto
                        rounded-[13px]
                        border
                        bg-[#fcfcfd]
                        p-2
                        ${
                            categoryError
                                ? "border-red-400"
                                : "border-[#dfe1e5]"
                        }
                    `}
                >
                    {loading ? (
                        <div className="flex min-h-[120px] flex-col items-center justify-center text-[#858890]">
                            <LoaderCircle
                                size={22}
                                className="animate-spin text-[#246bdb]"
                            />

                            <p className="mt-2 text-[12px]">
                                Loading categories...
                            </p>
                        </div>
                    ) : categories.length === 0 ? (
                        <div className="flex min-h-[130px] flex-col items-center justify-center px-4 text-center">
                            <p className="text-[13px] font-medium text-[#44474e]">
                                No categories found
                            </p>

                            <p className="mt-1 text-[11px] text-[#92959c]">
                                Create a category to
                                organize this post.
                            </p>

                            <button
                                type="button"
                                onClick={
                                    onManageCategories
                                }
                                className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-[9px] bg-[#2167d9] px-3 text-[11px] font-semibold text-white"
                            >
                                <Plus size={13} />
                                Add category
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {categories.map(
                                (category) => {
                                    const selected =
                                        isCategorySelected(
                                            category.id
                                        );

                                    return (
                                        <label
                                            key={
                                                category.id
                                            }
                                            className={`
                                                flex
                                                min-h-[44px]
                                                cursor-pointer
                                                items-center
                                                gap-3
                                                rounded-[10px]
                                                border
                                                px-3
                                                transition
                                                ${
                                                    selected
                                                        ? "border-[#bdd3fb] bg-[#eff5ff]"
                                                        : "border-transparent bg-white hover:border-[#e3e5e8] hover:bg-[#f8f9fa]"
                                                }
                                                ${
                                                    disabled
                                                        ? "pointer-events-none opacity-60"
                                                        : ""
                                                }
                                            `}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selected
                                                }
                                                disabled={
                                                    disabled
                                                }
                                                onChange={() =>
                                                    toggleCategory(
                                                        category.id
                                                    )
                                                }
                                                className="sr-only"
                                            />

                                            <span
                                                className={`
                                                    flex
                                                    h-[19px]
                                                    w-[19px]
                                                    shrink-0
                                                    items-center
                                                    justify-center
                                                    rounded-[5px]
                                                    border
                                                    transition
                                                    ${
                                                        selected
                                                            ? "border-[#2167d9] bg-[#2167d9] text-white"
                                                            : "border-[#b9bdc4] bg-white text-transparent"
                                                    }
                                                `}
                                            >
                                                <Check
                                                    size={
                                                        13
                                                    }
                                                    strokeWidth={
                                                        2.5
                                                    }
                                                />
                                            </span>

                                            <span className="min-w-0 flex-1 truncate text-[13px] text-[#34363b]">
                                                {
                                                    category.name
                                                }
                                            </span>

                                            {selected && (
                                                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#2167d9]">
                                                    Selected
                                                </span>
                                            )}
                                        </label>
                                    );
                                }
                            )}
                        </div>
                    )}
                </div>

                {categoryError && (
                    <p className="mt-2 text-[12px] text-red-600">
                        {categoryError}
                    </p>
                )}

                <div className="my-5 border-t border-[#eceef1]" />

                <label className="text-[13px] font-medium text-[#292b30]">
                    Tags
                </label>

                <div
                    className={`
                        mt-2
                        min-h-[46px]
                        rounded-[12px]
                        border
                        bg-white
                        px-2.5
                        py-2
                        transition
                        focus-within:ring-2
                        focus-within:ring-blue-100
                        ${
                            tagsError
                                ? "border-red-400"
                                : "border-[#dfe1e5] focus-within:border-[#79a8ff]"
                        }
                    `}
                >
                    <div className="flex flex-wrap items-center gap-1.5">
                        {normalizedTags.map(
                            (tag) => (
                                <span
                                    key={tag}
                                    className="inline-flex h-7 max-w-full items-center gap-1.5 rounded-[8px] bg-[#eef4ff] px-2.5 text-[11px] font-medium text-[#2464c8]"
                                >
                                    <span className="max-w-[180px] truncate">
                                        {tag}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeTag(
                                                tag
                                            )
                                        }
                                        disabled={
                                            disabled
                                        }
                                        className="flex h-4 w-4 items-center justify-center rounded-full transition hover:bg-[#dce8ff]"
                                    >
                                        <X
                                            size={
                                                11
                                            }
                                        />
                                    </button>
                                </span>
                            )
                        )}

                        <input
                            type="text"
                            value={tagInput}
                            onChange={(event) =>
                                setTagInput(
                                    event.target.value
                                )
                            }
                            onKeyDown={
                                handleTagKeyDown
                            }
                            onBlur={() =>
                                addTag()
                            }
                            disabled={disabled}
                            placeholder={
                                normalizedTags.length
                                    ? "Add another tag"
                                    : "Type a tag and press Enter"
                            }
                            className="h-7 min-w-[150px] flex-1 border-0 bg-transparent px-1 text-[12px] text-[#33363b] outline-none placeholder:text-[#a0a3aa]"
                        />
                    </div>
                </div>

                <div className="mt-1.5 flex items-start justify-between gap-3">
                    <div>
                        {tagsError && (
                            <p className="text-[12px] text-red-600">
                                {tagsError}
                            </p>
                        )}
                    </div>

                    <span className="text-[10px] text-[#999ca3]">
                        Press Enter or comma
                        to add ·{" "}
                        {normalizedTags.length}
                        /30
                    </span>
                </div>
            </div>
        </section>
    );
};

export default BlogPostOrganization;