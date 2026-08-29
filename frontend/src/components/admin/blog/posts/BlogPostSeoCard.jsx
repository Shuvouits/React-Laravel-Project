import { useMemo, useState } from "react";

import {
    Check,
    ChevronDown,
    ChevronUp,
    Circle,
    Pencil,
    Sparkles,
} from "lucide-react";

import {
    firstError,
    slugify,
} from "./blogPostConfig";

const BlogPostSeoCard = ({
    title = "",
    excerpt = "",
    slug = "",
    seoTitle = "",
    metaDescription = "",
    onChange,
    onOpenAI,
    disabled = false,
    errors = {},
    websiteUrl = "https://yourstore.com",
    storeName = "Storify",
}) => {
    const [editorOpen, setEditorOpen] = useState(true);
    const [checklistOpen, setChecklistOpen] = useState(false);

    const previewTitle = (
        seoTitle ||
        title ||
        "Post title"
    ).trim();

    const previewDescription = (
        metaDescription ||
        excerpt ||
        "Add a meta description to improve search results."
    ).trim();

    const previewSlug = (
        slug ||
        slugify(title) ||
        "post-slug"
    ).trim();

    const cleanWebsiteUrl = String(websiteUrl)
        .replace(/\/+$/, "");

    const seoTitleError = firstError(
        errors.seo_title
    );

    const metaDescriptionError = firstError(
        errors.meta_description
    );

    const slugError = firstError(
        errors.slug
    );

    const seoChecks = useMemo(() => {
        const finalTitle = String(
            seoTitle || title || ""
        ).trim();

        const finalDescription = String(
            metaDescription || excerpt || ""
        ).trim();

        const finalSlug = String(
            slug || slugify(title) || ""
        ).trim();

        return [
            {
                id: "title-exists",
                label: "SEO title has been added",
                passed: finalTitle.length > 0,
                points: 20,
            },
            {
                id: "title-length",
                label: "SEO title is between 30 and 60 characters",
                passed:
                    finalTitle.length >= 30 &&
                    finalTitle.length <= 60,
                points: 20,
            },
            {
                id: "description-exists",
                label: "Meta description has been added",
                passed: finalDescription.length > 0,
                points: 20,
            },
            {
                id: "description-length",
                label: "Meta description is between 120 and 160 characters",
                passed:
                    finalDescription.length >= 120 &&
                    finalDescription.length <= 160,
                points: 20,
            },
            {
                id: "slug",
                label: "URL handle is clear and readable",
                passed:
                    finalSlug.length >= 3 &&
                    finalSlug.length <= 75 &&
                    !finalSlug.includes(" "),
                points: 20,
            },
        ];
    }, [
        title,
        excerpt,
        slug,
        seoTitle,
        metaDescription,
    ]);

    const seoScore = seoChecks.reduce(
        (total, item) =>
            total + (item.passed ? item.points : 0),
        0
    );

    const scoreColor =
        seoScore >= 80
            ? "#16a269"
            : seoScore >= 50
                ? "#e69a13"
                : "#ef4444";

    const handleSlugChange = (value) => {
        const normalizedValue = slugify(value);

        onChange?.("slug", normalizedValue);
    };

    return (
        <div
            className="
                overflow-hidden
                rounded-[18px]
                border
                border-[#e1e3e7]
                bg-white
                shadow-[0_2px_7px_rgba(0,0,0,0.04)]
            "
        >
            <div
                className="
                    flex
                    items-start
                    justify-between
                    gap-4
                    border-b
                    border-[#e7e8eb]
                    px-5
                    py-5
                "
            >
                <div className="min-w-0">
                    <h2
                        className="
                            text-[16px]
                            font-semibold
                            text-[#17181a]
                        "
                    >
                        Search Engine Listing
                    </h2>

                    <p
                        className="
                            mt-1
                            text-[12px]
                            leading-5
                            text-[#777b83]
                        "
                    >
                        Auto-filled from title and excerpt.
                        Customize to override.
                    </p>
                </div>

                <div
                    className="
                        flex
                        shrink-0
                        items-center
                        gap-2
                    "
                >
                    <button
                        type="button"
                        disabled={disabled}
                        onClick={() => onOpenAI?.("seo")}
                        title="Generate SEO content with AI"
                        className="
                            flex
                            h-9
                            w-9
                            items-center
                            justify-center
                            rounded-[10px]
                            bg-gradient-to-br
                            from-[#ff4fa3]
                            via-[#9a65ff]
                            to-[#23d9d1]
                            text-white
                            shadow-sm
                            transition
                            hover:scale-[1.03]
                            disabled:cursor-not-allowed
                            disabled:opacity-50
                        "
                    >
                        <Sparkles
                            size={17}
                            strokeWidth={2}
                        />
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setEditorOpen(
                                (previous) => !previous
                            )
                        }
                        className="
                            flex
                            h-9
                            items-center
                            gap-2
                            rounded-[10px]
                            border
                            border-[#dfe1e5]
                            bg-white
                            px-3
                            text-[12px]
                            font-medium
                            text-[#5f636b]
                            transition
                            hover:bg-[#f6f7f8]
                        "
                    >
                        <Pencil
                            size={14}
                            strokeWidth={1.8}
                        />

                        {editorOpen
                            ? "Hide SEO"
                            : "Edit SEO"}
                    </button>
                </div>
            </div>

            <div className="p-5">
                <div
                    className="
                        rounded-[14px]
                        border
                        border-[#dde0e5]
                        bg-[#f8f9fa]
                        px-4
                        py-4
                    "
                >
                    <div
                        className="
                            flex
                            items-center
                            gap-2
                        "
                    >
                        <div
                            className="
                                flex
                                h-5
                                w-5
                                items-center
                                justify-center
                                rounded-[5px]
                                bg-gradient-to-br
                                from-[#5a8cff]
                                to-[#1769ff]
                                text-[10px]
                                font-bold
                                text-white
                            "
                        >
                            S
                        </div>

                        <span
                            className="
                                text-[13px]
                                font-semibold
                                text-[#27292d]
                            "
                        >
                            {storeName}
                        </span>
                    </div>

                    <p
                        className="
                            mt-1.5
                            truncate
                            text-[12px]
                            text-[#656a72]
                        "
                    >
                        {cleanWebsiteUrl} › blog ›{" "}
                        {previewSlug}
                    </p>

                    <p
                        className="
                            mt-1
                            line-clamp-2
                            text-[18px]
                            font-medium
                            leading-[1.35]
                            text-[#1a0dab]
                        "
                    >
                        {previewTitle}
                    </p>

                    <p
                        className="
                            mt-1
                            line-clamp-2
                            text-[13px]
                            leading-5
                            text-[#656a72]
                        "
                    >
                        {previewDescription}
                    </p>
                </div>

                {editorOpen && (
                    <div
                        className="
                            mt-5
                            border-t
                            border-[#e7e8eb]
                            pt-5
                        "
                    >
                        <div>
                            <div
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                "
                            >
                                <label
                                    htmlFor="blog-seo-title"
                                    className="
                                        text-[13px]
                                        font-medium
                                        text-[#24262a]
                                    "
                                >
                                    Page title
                                </label>

                                <span
                                    className={`
                                        text-[11px]
                                        ${seoTitle.length > 70
                                            ? "text-[#dc2626]"
                                            : "text-[#858890]"
                                        }
                                    `}
                                >
                                    {seoTitle.length}/70
                                </span>
                            </div>

                            <input
                                id="blog-seo-title"
                                type="text"
                                value={seoTitle}
                                maxLength={70}
                                disabled={disabled}
                                placeholder="Enter page title"
                                onChange={(event) =>
                                    onChange?.(
                                        "seo_title",
                                        event.target.value
                                    )
                                }
                                className={`
                                    h-[44px]
                                    w-full
                                    rounded-[13px]
                                    border
                                    bg-white
                                    px-3.5
                                    text-[14px]
                                    text-[#24262a]
                                    outline-none
                                    transition
                                    placeholder:text-[#979ba3]
                                    focus:border-[#85afff]
                                    focus:ring-2
                                    focus:ring-[#e4edff]
                                    disabled:cursor-not-allowed
                                    disabled:bg-[#f5f6f7]
                                    ${seoTitleError
                                        ? "border-[#ef4444]"
                                        : "border-[#dfe1e5]"
                                    }
                                `}
                            />

                            {seoTitleError && (
                                <p
                                    className="
                                        mt-1.5
                                        text-[12px]
                                        text-[#dc2626]
                                    "
                                >
                                    {seoTitleError}
                                </p>
                            )}
                        </div>

                        <div className="mt-4">
                            <div
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    justify-between
                                    gap-3
                                "
                            >
                                <label
                                    htmlFor="blog-meta-description"
                                    className="
                                        text-[13px]
                                        font-medium
                                        text-[#24262a]
                                    "
                                >
                                    Meta description
                                </label>

                                <span
                                    className={`
                                        text-[11px]
                                        ${metaDescription.length >
                                            320
                                            ? "text-[#dc2626]"
                                            : "text-[#858890]"
                                        }
                                    `}
                                >
                                    {metaDescription.length}/320
                                </span>
                            </div>

                            <textarea
                                id="blog-meta-description"
                                value={metaDescription}
                                maxLength={320}
                                rows={3}
                                disabled={disabled}
                                placeholder="Enter meta description for search engines"
                                onChange={(event) =>
                                    onChange?.(
                                        "meta_description",
                                        event.target.value
                                    )
                                }
                                className={`
                                    min-h-[78px]
                                    w-full
                                    resize-y
                                    rounded-[13px]
                                    border
                                    bg-white
                                    px-3.5
                                    py-3
                                    text-[14px]
                                    leading-5
                                    text-[#24262a]
                                    outline-none
                                    transition
                                    placeholder:text-[#979ba3]
                                    focus:border-[#85afff]
                                    focus:ring-2
                                    focus:ring-[#e4edff]
                                    disabled:cursor-not-allowed
                                    disabled:bg-[#f5f6f7]
                                    ${metaDescriptionError
                                        ? "border-[#ef4444]"
                                        : "border-[#dfe1e5]"
                                    }
                                `}
                            />

                            {metaDescriptionError && (
                                <p
                                    className="
                                        mt-1.5
                                        text-[12px]
                                        text-[#dc2626]
                                    "
                                >
                                    {metaDescriptionError}
                                </p>
                            )}
                        </div>

                        <div className="mt-4">
                            <label
                                htmlFor="blog-seo-slug"
                                className="
                                    mb-2
                                    block
                                    text-[13px]
                                    font-medium
                                    text-[#24262a]
                                "
                            >
                                URL handle
                            </label>

                            <div className="flex items-center">
                                <span
                                    className="
                                        flex
                                        h-[44px]
                                        shrink-0
                                        items-center
                                        rounded-l-[13px]
                                        border
                                        border-r-0
                                        border-[#dfe1e5]
                                        bg-[#f7f8f9]
                                        px-3
                                        text-[13px]
                                        text-[#777b83]
                                    "
                                >
                                    blog/
                                </span>

                                <input
                                    id="blog-seo-slug"
                                    type="text"
                                    value={slug}
                                    disabled={disabled}
                                    placeholder="my-post"
                                    onChange={(event) =>
                                        handleSlugChange(
                                            event.target.value
                                        )
                                    }
                                    className={`
                                        h-[44px]
                                        min-w-0
                                        flex-1
                                        rounded-r-[13px]
                                        border
                                        bg-white
                                        px-3.5
                                        text-[14px]
                                        text-[#24262a]
                                        outline-none
                                        transition
                                        placeholder:text-[#979ba3]
                                        focus:border-[#85afff]
                                        focus:ring-2
                                        focus:ring-[#e4edff]
                                        disabled:cursor-not-allowed
                                        disabled:bg-[#f5f6f7]
                                        ${slugError
                                            ? "border-[#ef4444]"
                                            : "border-[#dfe1e5]"
                                        }
                                    `}
                                />
                            </div>

                            {slugError ? (
                                <p
                                    className="
                                        mt-1.5
                                        text-[12px]
                                        text-[#dc2626]
                                    "
                                >
                                    {slugError}
                                </p>
                            ) : (
                                <p
                                    className="
                                        mt-2
                                        break-all
                                        text-[11px]
                                        text-[#777b83]
                                    "
                                >
                                    {cleanWebsiteUrl}/blog/
                                    {previewSlug}
                                </p>
                            )}
                        </div>
                    </div>
                )}

                <div
                    className="
                        mt-5
                        overflow-hidden
                        rounded-[13px]
                        border
                        border-[#e1e3e7]
                    "
                >
                    <button
                        type="button"
                        onClick={() =>
                            setChecklistOpen(
                                (previous) => !previous
                            )
                        }
                        className="
                            flex
                            w-full
                            items-center
                            justify-between
                            gap-4
                            bg-white
                            px-4
                            py-3
                            text-left
                            transition
                            hover:bg-[#fafafa]
                        "
                    >
                        <div
                            className="
                                flex
                                min-w-0
                                items-center
                                gap-2
                            "
                        >
                            <span
                                className="
                                    h-2
                                    w-2
                                    shrink-0
                                    rounded-full
                                "
                                style={{
                                    backgroundColor:
                                        scoreColor,
                                }}
                            />

                            <span
                                className="
                                    text-[13px]
                                    font-medium
                                    text-[#25272a]
                                "
                            >
                                SEO checklist
                            </span>

                            <span
                                className="
                                    text-[11px]
                                    text-[#777b83]
                                "
                            >
                                Score: {seoScore}/100
                            </span>
                        </div>

                        {checklistOpen ? (
                            <ChevronUp
                                size={16}
                                className="text-[#777b83]"
                            />
                        ) : (
                            <ChevronDown
                                size={16}
                                className="text-[#777b83]"
                            />
                        )}
                    </button>

                    {checklistOpen && (
                        <div
                            className="
                                space-y-3
                                border-t
                                border-[#e7e8eb]
                                bg-[#fafbfc]
                                px-4
                                py-4
                            "
                        >
                            {seoChecks.map((item) => (
                                <div
                                    key={item.id}
                                    className="
                                        flex
                                        items-start
                                        gap-2.5
                                    "
                                >
                                    {item.passed ? (
                                        <span
                                            className="
                                                mt-0.5
                                                flex
                                                h-4
                                                w-4
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-full
                                                bg-[#daf7e9]
                                                text-[#12915f]
                                            "
                                        >
                                            <Check
                                                size={11}
                                                strokeWidth={3}
                                            />
                                        </span>
                                    ) : (
                                        <Circle
                                            size={16}
                                            strokeWidth={1.6}
                                            className="
                                                mt-0.5
                                                shrink-0
                                                text-[#b1b4ba]
                                            "
                                        />
                                    )}

                                    <p
                                        className={`
                                            text-[12px]
                                            leading-5
                                            ${item.passed
                                                ? "text-[#4d5157]"
                                                : "text-[#777b83]"
                                            }
                                        `}
                                    >
                                        {item.label}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BlogPostSeoCard;