import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    AlertCircle,
    Check,
    LoaderCircle,
    RefreshCw,
    Sparkles,
    X,
} from "lucide-react";

import api from "../../../../api/axios";

import {
    BLOG_AI_TONES,
    getErrorMessage,
} from "./blogPostConfig";

const TARGET_LABELS = {
    title: "Generate title",
    excerpt: "Generate excerpt",
    content: "Write blog content",
    seo: "Generate SEO content",
    tags: "Generate tags",
    all: "Generate complete post",
};

const stripHtml = (value = "") => {
    return String(value)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const BlogPostAIPopup = ({
    open,
    target = "content",
    title = "",
    excerpt = "",
    content = "",
    categories = [],
    tags = [],
    onClose,
    onApply,
}) => {
    const [prompt, setPrompt] =
        useState("");

    const [tone, setTone] =
        useState("professional");

    const [audience, setAudience] =
        useState(
            "Online shoppers and general readers"
        );

    const [keywords, setKeywords] =
        useState("");

    const [loading, setLoading] =
        useState(false);

    const [errorMessage, setErrorMessage] =
        useState("");

    const [result, setResult] =
        useState(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        setPrompt("");
        setTone("professional");
        setAudience(
            "Online shoppers and general readers"
        );
        setKeywords(
            Array.isArray(tags)
                ? tags.join(", ")
                : ""
        );
        setLoading(false);
        setErrorMessage("");
        setResult(null);
    }, [
        open,
        target,
        tags,
    ]);

    const categoryNames = useMemo(() => {
        if (!Array.isArray(categories)) {
            return [];
        }

        return categories
            .map((category) => {
                if (
                    typeof category ===
                    "string"
                ) {
                    return category;
                }

                return category?.name || "";
            })
            .filter(Boolean);
    }, [categories]);

    const parsedKeywords = useMemo(() => {
        return [
            ...new Set(
                keywords
                    .split(",")
                    .map((keyword) =>
                        keyword.trim()
                    )
                    .filter(Boolean)
            ),
        ];
    }, [keywords]);

    if (!open) {
        return null;
    }

    const handleGenerate = async () => {
        if (!title.trim()) {
            setErrorMessage(
                "Enter the blog post title before using AI."
            );

            return;
        }

        setLoading(true);
        setErrorMessage("");
        setResult(null);

        try {
            const response = await api.post(
                "/admin/ai/blog-post-content",
                {
                    title: title.trim(),
                    excerpt,
                    content,
                    category_names:
                        categoryNames,
                    keywords:
                        parsedKeywords,
                    prompt:
                        prompt.trim() ||
                        null,
                    tone,
                    audience:
                        audience.trim() ||
                        null,
                    target,
                }
            );

            setResult(
                response.data?.data ||
                null
            );
        } catch (error) {
            setErrorMessage(
                getErrorMessage(
                    error,
                    "AI content generation failed."
                )
            );
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (!result) {
            return;
        }

        onApply?.(
            result,
            target
        );

        onClose?.();
    };

    const handleBackdropClick = (
        event
    ) => {
        if (
            event.target ===
            event.currentTarget &&
            !loading
        ) {
            onClose?.();
        }
    };

    return (
        <div
            onMouseDown={
                handleBackdropClick
            }
            className="
                fixed
                inset-0
                z-[250]
                flex
                items-center
                justify-center
                bg-black/55
                px-4
                py-6
                backdrop-blur-[3px]
            "
        >
            <div
                role="dialog"
                aria-modal="true"
                className="
                    flex
                    max-h-[calc(100vh-48px)]
                    w-full
                    max-w-[620px]
                    flex-col
                    overflow-hidden
                    rounded-[22px]
                    bg-white
                    shadow-[0_25px_80px_rgba(0,0,0,0.28)]
                "
            >
                {/* Header */}
                <div className="flex shrink-0 items-start justify-between border-b border-[#e5e6e8] px-6 py-5">
                    <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#8255ff] via-[#4b8cff] to-[#20c9bf] text-white shadow-sm">
                            <Sparkles
                                size={19}
                            />
                        </div>

                        <div>
                            <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[#151619]">
                                {TARGET_LABELS[
                                    target
                                ] ||
                                    "AI blog assistant"}
                            </h2>

                            <p className="mt-1 text-[12px] text-[#7c7f87]">
                                Add guidance and
                                generate content for
                                this blog post.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="flex h-9 w-9 items-center justify-center rounded-full text-[#777a82] transition hover:bg-[#f3f4f5] hover:text-[#222326] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto px-6 py-5">
                    {errorMessage && (
                        <div className="mb-5 flex items-start gap-3 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] leading-5 text-red-700">
                            <AlertCircle
                                size={17}
                                className="mt-0.5 shrink-0"
                            />

                            <span>
                                {errorMessage}
                            </span>
                        </div>
                    )}

                    {!result ? (
                        <div className="space-y-5">
                            {/* Current title */}
                            <div>
                                <label className="mb-2 block text-[13px] font-medium text-[#25272b]">
                                    Blog post
                                </label>

                                <div className="rounded-[12px] border border-[#e0e2e5] bg-[#f8f9fa] px-4 py-3">
                                    <p className="text-[13px] font-medium text-[#303238]">
                                        {title ||
                                            "No title entered"}
                                    </p>

                                    {categoryNames.length >
                                        0 && (
                                            <p className="mt-1 text-[11px] text-[#898c93]">
                                                {
                                                    categoryNames.join(
                                                        " · "
                                                    )
                                                }
                                            </p>
                                        )}
                                </div>
                            </div>

                            {/* Prompt */}
                            <div>
                                <label
                                    htmlFor="blog-ai-prompt"
                                    className="mb-2 block text-[13px] font-medium text-[#25272b]"
                                >
                                    What should AI
                                    write?
                                </label>

                                <textarea
                                    id="blog-ai-prompt"
                                    rows={4}
                                    value={prompt}
                                    onChange={(
                                        event
                                    ) =>
                                        setPrompt(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Add specific instructions, key points, writing direction, or details that should be included..."
                                    className="w-full resize-y rounded-[12px] border border-[#dfe1e5] bg-white px-4 py-3 text-[13px] leading-6 text-[#25272b] outline-none transition placeholder:text-[#a0a3aa] focus:border-[#79a8ff] focus:ring-2 focus:ring-blue-100"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                {/* Tone */}
                                <div>
                                    <label
                                        htmlFor="blog-ai-tone"
                                        className="mb-2 block text-[13px] font-medium text-[#25272b]"
                                    >
                                        Tone
                                    </label>

                                    <select
                                        id="blog-ai-tone"
                                        value={tone}
                                        onChange={(
                                            event
                                        ) =>
                                            setTone(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="h-11 w-full rounded-[12px] border border-[#dfe1e5] bg-white px-3 text-[13px] text-[#25272b] outline-none focus:border-[#79a8ff] focus:ring-2 focus:ring-blue-100"
                                    >
                                        {BLOG_AI_TONES.map(
                                            (
                                                item
                                            ) => (
                                                <option
                                                    key={
                                                        item.value
                                                    }
                                                    value={
                                                        item.value
                                                    }
                                                >
                                                    {
                                                        item.label
                                                    }
                                                </option>
                                            )
                                        )}
                                    </select>
                                </div>

                                {/* Audience */}
                                <div>
                                    <label
                                        htmlFor="blog-ai-audience"
                                        className="mb-2 block text-[13px] font-medium text-[#25272b]"
                                    >
                                        Audience
                                    </label>

                                    <input
                                        id="blog-ai-audience"
                                        type="text"
                                        value={
                                            audience
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setAudience(
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        className="h-11 w-full rounded-[12px] border border-[#dfe1e5] bg-white px-3 text-[13px] text-[#25272b] outline-none focus:border-[#79a8ff] focus:ring-2 focus:ring-blue-100"
                                    />
                                </div>
                            </div>

                            {/* Keywords */}
                            <div>
                                <label
                                    htmlFor="blog-ai-keywords"
                                    className="mb-2 block text-[13px] font-medium text-[#25272b]"
                                >
                                    Keywords
                                    <span className="ml-1 font-normal text-[#92959c]">
                                        (optional)
                                    </span>
                                </label>

                                <input
                                    id="blog-ai-keywords"
                                    type="text"
                                    value={keywords}
                                    onChange={(
                                        event
                                    ) =>
                                        setKeywords(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="ecommerce, online shopping, product tips"
                                    className="h-11 w-full rounded-[12px] border border-[#dfe1e5] bg-white px-4 text-[13px] text-[#25272b] outline-none placeholder:text-[#a0a3aa] focus:border-[#79a8ff] focus:ring-2 focus:ring-blue-100"
                                />

                                <p className="mt-1.5 text-[11px] text-[#92959c]">
                                    Separate multiple
                                    keywords with commas.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <AIResultPreview
                            target={target}
                            result={result}
                        />
                    )}
                </div>

                {/* Footer */}
                <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#e5e6e8] bg-[#fafafa] px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="inline-flex h-11 items-center justify-center rounded-[12px] border border-[#dcdee2] bg-white px-5 text-[13px] font-semibold text-[#3b3d42] transition hover:bg-[#f4f5f6] disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    {!result ? (
                        <button
                            type="button"
                            onClick={
                                handleGenerate
                            }
                            disabled={loading}
                            className="inline-flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#7657f6] via-[#4a83ed] to-[#22bdb5] px-5 text-[13px] font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <LoaderCircle
                                        size={17}
                                        className="animate-spin"
                                    />
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <Sparkles
                                        size={16}
                                    />
                                    Generate
                                </>
                            )}
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={
                                    handleGenerate
                                }
                                disabled={loading}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] border border-[#d9dce1] bg-white px-4 text-[13px] font-semibold text-[#4e5158] transition hover:bg-[#f3f4f6] disabled:opacity-60"
                            >
                                {loading ? (
                                    <LoaderCircle
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <RefreshCw
                                        size={16}
                                    />
                                )}

                                Regenerate
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleApply
                                }
                                disabled={loading}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-[12px] bg-[#2167d9] px-5 text-[13px] font-semibold text-white transition hover:bg-[#1859c2]"
                            >
                                <Check size={16} />
                                Apply
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const AIResultPreview = ({
    target,
    result,
}) => {
    const previewContent =
        stripHtml(
            result?.content || ""
        );

    return (
        <div>
            <div className="mb-4 flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <Check size={15} />
                </div>

                <p className="text-[13px] font-semibold text-[#25272b]">
                    Content generated
                </p>
            </div>

            <div className="space-y-4">
                {(target === "title" ||
                    target === "all") && (
                        <PreviewField
                            label="Title"
                            value={
                                result?.title
                            }
                        />
                    )}

                {(target === "title" ||
                    target === "seo" ||
                    target === "all") && (
                        <PreviewField
                            label="URL handle"
                            value={
                                result?.slug
                            }
                        />
                    )}

                {(target === "excerpt" ||
                    target === "all") && (
                        <PreviewField
                            label="Excerpt"
                            value={
                                result?.excerpt
                            }
                        />
                    )}

                {(target === "content" ||
                    target === "all") && (
                        <PreviewField
                            label="Content preview"
                            value={
                                previewContent
                            }
                            large
                        />
                    )}

                {(target === "seo" ||
                    target === "all") && (
                        <>
                            <PreviewField
                                label="SEO title"
                                value={
                                    result?.seo_title
                                }
                            />

                            <PreviewField
                                label="Meta description"
                                value={
                                    result?.meta_description
                                }
                            />
                        </>
                    )}

                {(target === "tags" ||
                    target === "all") && (
                        <div>
                            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#858890]">
                                Tags
                            </p>

                            <div className="flex flex-wrap gap-2">
                                {(
                                    result?.tags || []
                                ).map((tag) => (
                                    <span
                                        key={tag}
                                        className="rounded-full border border-[#dce5f8] bg-[#f4f7ff] px-3 py-1.5 text-[11px] font-medium text-[#315fae]"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
            </div>
        </div>
    );
};

const PreviewField = ({
    label,
    value,
    large = false,
}) => {
    return (
        <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#858890]">
                {label}
            </p>

            <div
                className={`
                    overflow-y-auto
                    rounded-[12px]
                    border
                    border-[#e0e2e5]
                    bg-[#fafbfc]
                    px-4
                    py-3
                    text-[13px]
                    leading-6
                    text-[#34363b]
                    ${large
                        ? "max-h-[240px]"
                        : "max-h-[140px]"
                    }
                `}
            >
                {value || "No content generated."}
            </div>
        </div>
    );
};

export default BlogPostAIPopup;