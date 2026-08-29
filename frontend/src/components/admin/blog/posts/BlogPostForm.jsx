import {
    ArrowLeft,
    LoaderCircle,
    Save,
    Sparkles,
} from "lucide-react";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

import {
    useNavigate,
} from "react-router-dom";



import api from "../../../../api/axios";

import BrandAITexterPopup from "../../brands/BrandAITexterPopup";

import BlogFeaturedImageUploader from "./BlogFeaturedImageUploader";
import BlogPostOrganization from "./BlogPostOrganization";
import BlogPostPublishingSettings from "./BlogPostPublishingSettings";
import BlogPostSeoCard from "./BlogPostSeoCard";
import BlogRichTextEditor from "./BlogRichTextEditor";

import {
    EMPTY_BLOG_POST_FORM,
    buildBlogPostFormData,
    firstError,
    normalizeBlogPost,
    slugify,
} from "./blogPostConfig";

const BlogPostForm = ({
    mode = "create",
    postId = null,
}) => {
    const navigate = useNavigate();

    const aiPopupRef = useRef(null);

    const [form, setForm] = useState({
        ...EMPTY_BLOG_POST_FORM,
    });

    const [categories, setCategories] = useState([]);

    const [loading, setLoading] = useState(
        mode === "edit"
    );

    const [optionsLoading, setOptionsLoading] =
        useState(true);

    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});
    const [generalError, setGeneralError] =
        useState("");

    const [slugEdited, setSlugEdited] =
        useState(false);

    const [seoTitleEdited, setSeoTitleEdited] =
        useState(false);

    const [
        metaDescriptionEdited,
        setMetaDescriptionEdited,
    ] = useState(false);

    const [aiTarget, setAiTarget] =
        useState(null);

    const [aiPrompt, setAiPrompt] =
        useState("");

    const [aiTone, setAiTone] =
        useState("default");

    const [aiToneOpen, setAiToneOpen] =
        useState(false);

    const [aiLoading, setAiLoading] =
        useState(null);

    const [aiError, setAiError] =
        useState("");

    const [aiMessage, setAiMessage] =
        useState("");

    const isEditMode = mode === "edit";

    const selectedCategoryNames = useMemo(() => {
        return categories
            .filter((category) =>
                form.category_ids.some(
                    (categoryId) =>
                        Number(categoryId) ===
                        Number(category.id)
                )
            )
            .map((category) => category.name)
            .filter(Boolean);
    }, [
        categories,
        form.category_ids,
    ]);

    const statusLabel = useMemo(() => {
        const labels = {
            draft: "Draft",
            published: "Published",
            scheduled: "Scheduled",
            archived: "Archived",
        };

        return labels[form.status] || "Draft";
    }, [form.status]);

    const statusClassName = useMemo(() => {
        const classes = {
            draft:
                "border-[#dfe1e5] bg-white text-[#555960]",
            published:
                "border-[#bcebd5] bg-[#ecfbf4] text-[#13875b]",
            scheduled:
                "border-[#cbdcff] bg-[#eff5ff] text-[#246bdb]",
            archived:
                "border-[#e1e2e5] bg-[#f3f4f5] text-[#777b83]",
        };

        return (
            classes[form.status] ||
            classes.draft
        );
    }, [form.status]);

    useEffect(() => {
        loadFormOptions();

        if (isEditMode && postId) {
            loadPost();
        }
    }, [
        isEditMode,
        postId,
    ]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                aiPopupRef.current &&
                !aiPopupRef.current.contains(
                    event.target
                )
            ) {
                closeAI();
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
        };
    }, []);

    const loadFormOptions = async () => {
        setOptionsLoading(true);

        try {
            const response = await api.get(
                "/admin/blog-posts/form-options"
            );

            const responseData =
                response.data?.data ||
                response.data ||
                {};

            const categoryRows =
                responseData.categories || [];

            setCategories(
                Array.isArray(categoryRows)
                    ? categoryRows
                    : []
            );
        } catch (error) {
            setGeneralError(
                error.response?.data?.message ||
                    "Unable to load blog categories."
            );
        } finally {
            setOptionsLoading(false);
        }
    };

    const loadPost = async () => {
        setLoading(true);
        setGeneralError("");

        try {
            const response = await api.get(
                `/admin/blog-posts/${postId}`
            );

            const responseData =
                response.data?.data ||
                response.data?.post ||
                response.data;

            const normalizedPost =
                normalizeBlogPost(responseData);

            setForm({
                ...EMPTY_BLOG_POST_FORM,
                ...normalizedPost,
            });

            setSlugEdited(
                Boolean(normalizedPost.slug)
            );

            setSeoTitleEdited(
                Boolean(
                    normalizedPost.seo_title
                )
            );

            setMetaDescriptionEdited(
                Boolean(
                    normalizedPost.meta_description
                )
            );
        } catch (error) {
            setGeneralError(
                error.response?.data?.message ||
                    "Unable to load the blog post."
            );
        } finally {
            setLoading(false);
        }
    };

    const clearFieldError = (field) => {
        setErrors((previous) => {
            if (!previous[field]) {
                return previous;
            }

            const nextErrors = {
                ...previous,
            };

            delete nextErrors[field];

            return nextErrors;
        });
    };

    const handleChange = (
        field,
        value
    ) => {
        setForm((previous) => {
            const next = {
                ...previous,
                [field]: value,
            };

            if (field === "title") {
                if (!slugEdited) {
                    next.slug = slugify(value);
                }

                if (!seoTitleEdited) {
                    next.seo_title = String(
                        value
                    ).slice(0, 70);
                }
            }

            if (
                field === "excerpt" &&
                !metaDescriptionEdited
            ) {
                next.meta_description =
                    String(value).slice(
                        0,
                        320
                    );
            }

            if (
                field === "status" &&
                value !== "scheduled"
            ) {
                next.scheduled_at = "";
            }

            return next;
        });

        if (field === "slug") {
            setSlugEdited(true);
        }

        if (field === "seo_title") {
            setSeoTitleEdited(true);
        }

        if (
            field ===
            "meta_description"
        ) {
            setMetaDescriptionEdited(true);
        }

        clearFieldError(field);
        setGeneralError("");
        setAiMessage("");
    };

    const openAI = (target) => {
        setAiTarget(target);
        setAiPrompt("");
        setAiTone("default");
        setAiToneOpen(false);
        setAiError("");
        setAiMessage("");
    };

    const closeAI = () => {
        if (aiLoading) {
            return;
        }

        setAiTarget(null);
        setAiPrompt("");
        setAiToneOpen(false);
    };

    const generateAI = async ({
        target,
        prompt = "",
        tone = "default",
    }) => {
        if (!form.title.trim()) {
            setAiError(
                "Please enter a blog post title first."
            );

            return false;
        }

        try {
            setAiLoading(target);
            setAiError("");
            setAiMessage("");

            const response = await api.post(
                "/admin/ai/blog-post-content",
                {
                    title: form.title.trim(),
                    slug: form.slug,
                    excerpt: form.excerpt,
                    content: form.content,
                    category_names:
                        selectedCategoryNames,
                    tags: form.tags,
                    prompt,
                    tone,
                    target,
                }
            );

            const generated =
                response.data?.data;

            if (!generated) {
                throw new Error(
                    "Invalid AI response."
                );
            }

            setForm((previous) => {
                const next = {
                    ...previous,
                };

                if (
                    target === "excerpt" ||
                    target === "all"
                ) {
                    if (
                        generated.excerpt !==
                        undefined
                    ) {
                        next.excerpt = String(
                            generated.excerpt
                        ).slice(0, 500);

                        if (
                            !metaDescriptionEdited &&
                            !generated.meta_description
                        ) {
                            next.meta_description =
                                String(
                                    generated.excerpt
                                ).slice(
                                    0,
                                    320
                                );
                        }
                    }
                }

                if (
                    target === "content" ||
                    target === "all"
                ) {
                    if (
                        generated.content !==
                        undefined
                    ) {
                        next.content =
                            generated.content;
                    }
                }

                if (
                    target === "seo" ||
                    target === "all"
                ) {
                    if (
                        generated.seo_title !==
                        undefined
                    ) {
                        next.seo_title =
                            String(
                                generated.seo_title
                            ).slice(0, 70);
                    }

                    if (
                        generated.meta_description !==
                        undefined
                    ) {
                        next.meta_description =
                            String(
                                generated.meta_description
                            ).slice(0, 320);
                    }

                    if (generated.slug) {
                        next.slug = slugify(
                            generated.slug
                        );
                    }
                }

                if (
                    target === "all" &&
                    generated.title
                ) {
                    next.title = String(
                        generated.title
                    ).trim();
                }

                if (
                    target === "all" &&
                    Array.isArray(
                        generated.tags
                    )
                ) {
                    next.tags = [
                        ...new Set(
                            generated.tags
                                .map((tag) =>
                                    String(
                                        tag
                                    ).trim()
                                )
                                .filter(Boolean)
                        ),
                    ].slice(0, 30);
                }

                return next;
            });

            if (
                target === "seo" ||
                target === "all"
            ) {
                if (generated.slug) {
                    setSlugEdited(true);
                }

                if (
                    generated.seo_title
                ) {
                    setSeoTitleEdited(true);
                }

                if (
                    generated.meta_description
                ) {
                    setMetaDescriptionEdited(
                        true
                    );
                }
            }

            setAiMessage(
                target === "excerpt"
                    ? "Excerpt generated successfully."
                    : target === "content"
                      ? "Blog content generated successfully."
                      : target === "seo"
                        ? "SEO content generated successfully."
                        : "Blog content generated successfully."
            );

            setAiTarget(null);
            setAiPrompt("");
            setAiToneOpen(false);

            return true;
        } catch (error) {
            setAiError(
                error.response?.data?.message ||
                    error.message ||
                    "Unable to generate AI content."
            );

            return false;
        } finally {
            setAiLoading(null);
        }
    };

    const runCurrentAI = async (
        customPrompt = ""
    ) => {
        if (!aiTarget) {
            return;
        }

        await generateAI({
            target: aiTarget,
            prompt: customPrompt,
            tone: aiTone,
        });
    };

    const handleImageChange = (file) => {
        setForm((previous) => ({
            ...previous,
            featured_image: file,
            remove_featured_image: false,
        }));

        clearFieldError(
            "featured_image"
        );
    };

    const handleRemoveImage = () => {
        setForm((previous) => ({
            ...previous,
            featured_image: null,
            featured_image_url: "",
            remove_featured_image: true,
        }));

        clearFieldError(
            "featured_image"
        );
    };

    const validateForm = () => {
        const validationErrors = {};

        if (!form.title.trim()) {
            validationErrors.title = [
                "The post title is required.",
            ];
        }

        if (!form.slug.trim()) {
            validationErrors.slug = [
                "The URL handle is required.",
            ];
        }

        const plainContent = String(
            form.content || ""
        )
            .replace(/<[^>]*>/g, "")
            .replace(/&nbsp;/g, " ")
            .trim();

        if (!plainContent) {
            validationErrors.content = [
                "The blog content is required.",
            ];
        }

        if (
            form.status === "scheduled" &&
            !form.scheduled_at
        ) {
            validationErrors.scheduled_at = [
                "Select the publishing date and time.",
            ];
        }

        setErrors(validationErrors);

        return (
            Object.keys(
                validationErrors
            ).length === 0
        );
    };

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        if (
            saving ||
            Boolean(aiLoading)
        ) {
            return;
        }

        if (!validateForm()) {
            setGeneralError(
                "Please complete the required fields."
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });

            return;
        }

        try {
            setSaving(true);
            setErrors({});
            setGeneralError("");

            const payload =
                buildBlogPostFormData(form);

            let response;

            if (
                isEditMode &&
                postId
            ) {
                response = await api.post(
                    `/admin/blog-posts/${postId}/update`,
                    payload,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data",
                        },
                    }
                );
            } else {
                response = await api.post(
                    "/admin/blog-posts",
                    payload,
                    {
                        headers: {
                            "Content-Type":
                                "multipart/form-data",
                        },
                    }
                );
            }

          

            navigate(
                "/admin/content/blog-posts"
            );
        } catch (error) {
            const responseErrors =
                error.response?.data
                    ?.errors || {};

            setErrors(responseErrors);

            setGeneralError(
                error.response?.data?.message ||
                    "Unable to save the blog post."
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[420px] items-center justify-center">
                <div className="text-center">
                    <LoaderCircle
                        size={30}
                        className="mx-auto animate-spin text-[#246bdb]"
                    />

                    <p className="mt-3 text-[13px] text-[#777b83]">
                        Loading blog post...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="min-h-full bg-[#f6f7f8]"
        >
            <div className="sticky top-0 z-30 border-b border-[#e1e3e7] bg-[#f6f7f8]/95 backdrop-blur-md">
                <div className="mx-auto flex min-h-[64px] max-w-[1300px] items-center justify-between gap-4 px-5">
                    <div className="flex min-w-0 items-center gap-2.5">
                        <h1 className="truncate text-[19px] font-semibold text-[#151619]">
                            {isEditMode
                                ? "Edit blog post"
                                : "Add blog post"}
                        </h1>

                        <span
                            className={`
                                shrink-0
                                rounded-full
                                border
                                px-2.5
                                py-1
                                text-[10px]
                                font-medium
                                ${statusClassName}
                            `}
                        >
                            {statusLabel}
                        </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="submit"
                            disabled={
                                saving ||
                                Boolean(
                                    aiLoading
                                )
                            }
                            className="flex h-[40px] items-center justify-center gap-2 rounded-full bg-[#246bdb] px-5 text-[13px] font-semibold text-white transition hover:bg-[#195fc9] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                />
                            ) : (
                                <Save
                                    size={15}
                                    strokeWidth={2}
                                />
                            )}

                            {saving
                                ? "Saving..."
                                : "Save"}
                        </button>

                        <button
                            type="button"
                            disabled={saving}
                            onClick={() =>
                                navigate(
                                    "/admin/content/blog-posts"
                                )
                            }
                            className="flex h-[40px] items-center justify-center gap-2 rounded-full border border-[#dfe1e5] bg-white px-4 text-[13px] font-medium text-[#303238] transition hover:bg-[#f7f8f9] disabled:opacity-60"
                        >
                            <ArrowLeft
                                size={15}
                            />

                            Back
                        </button>
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-[1300px] px-5 py-7">
                {generalError && (
                    <Message
                        error
                        text={generalError}
                    />
                )}

                {aiError && (
                    <Message
                        error
                        text={aiError}
                    />
                )}

                {aiMessage && (
                    <Message
                        text={aiMessage}
                    />
                )}

                <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-5">
                        <div className="rounded-[18px] border border-[#e1e3e7] bg-white p-5 shadow-[0_2px_7px_rgba(0,0,0,0.04)]">
                            <div className="mb-5 flex items-start justify-between gap-4">
                                <div>
                                    <h2 className="text-[16px] font-semibold text-[#17181a]">
                                        Title and content
                                    </h2>

                                    <p className="mt-1 text-[12px] text-[#777b83]">
                                        Write the main
                                        content for your
                                        blog post.
                                    </p>
                                </div>

                                <div
                                    ref={
                                        aiTarget ===
                                        "all"
                                            ? aiPopupRef
                                            : null
                                    }
                                    className="relative"
                                >
                                    <button
                                        type="button"
                                        disabled={
                                            saving ||
                                            Boolean(
                                                aiLoading
                                            )
                                        }
                                        onClick={() => {
                                            if (
                                                aiTarget ===
                                                "all"
                                            ) {
                                                closeAI();
                                            } else {
                                                openAI(
                                                    "all"
                                                );
                                            }
                                        }}
                                        className="flex h-9 items-center gap-2 rounded-[10px] bg-gradient-to-r from-[#ff4fa3] via-[#9a65ff] to-[#23d9d1] px-3 text-[12px] font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                                    >
                                        {aiLoading ===
                                        "all" ? (
                                            <LoaderCircle
                                                size={
                                                    15
                                                }
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Sparkles
                                                size={
                                                    15
                                                }
                                            />
                                        )}

                                        AI Studio
                                    </button>

                                    {aiTarget ===
                                        "all" && (
                                        <BrandAITexterPopup
                                            prompt={
                                                aiPrompt
                                            }
                                            setPrompt={
                                                setAiPrompt
                                            }
                                            tone={
                                                aiTone
                                            }
                                            setTone={
                                                setAiTone
                                            }
                                            toneOpen={
                                                aiToneOpen
                                            }
                                            setToneOpen={
                                                setAiToneOpen
                                            }
                                            placeholder="Describe the complete blog post you want to generate..."
                                            loading={
                                                aiLoading ===
                                                "all"
                                            }
                                            onGenerate={() =>
                                                runCurrentAI(
                                                    aiPrompt
                                                )
                                            }
                                            onAutoGenerate={() =>
                                                runCurrentAI(
                                                    ""
                                                )
                                            }
                                            className="right-0 top-[45px]"
                                        />
                                    )}
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="blog-title"
                                    className="mb-2 block text-[13px] font-medium text-[#24262a]"
                                >
                                    Title{" "}
                                    <span className="text-[#dc2626]">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="blog-title"
                                    type="text"
                                    value={form.title}
                                    disabled={saving}
                                    placeholder="A compelling headline"
                                    onChange={(event) =>
                                        handleChange(
                                            "title",
                                            event.target
                                                .value
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
                                        outline-none
                                        focus:border-[#85afff]
                                        focus:ring-2
                                        focus:ring-[#e4edff]
                                        ${
                                            firstError(
                                                errors,
                                                "title"
                                            )
                                                ? "border-[#ef4444]"
                                                : "border-[#dfe1e5]"
                                        }
                                    `}
                                />

                                <FieldError
                                    errors={errors}
                                    field="title"
                                />
                            </div>

                            <div className="mt-4">
                                <label
                                    htmlFor="blog-slug"
                                    className="mb-2 block text-[13px] font-medium text-[#24262a]"
                                >
                                    URL handle
                                </label>

                                <div className="flex">
                                    <span className="flex h-[44px] items-center rounded-l-[13px] border border-r-0 border-[#dfe1e5] bg-[#f7f8f9] px-3 text-[13px] text-[#777b83]">
                                        blog/
                                    </span>

                                    <input
                                        id="blog-slug"
                                        type="text"
                                        value={form.slug}
                                        disabled={
                                            saving
                                        }
                                        placeholder="my-post"
                                        onChange={(
                                            event
                                        ) =>
                                            handleChange(
                                                "slug",
                                                slugify(
                                                    event
                                                        .target
                                                        .value
                                                )
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
                                            outline-none
                                            focus:border-[#85afff]
                                            focus:ring-2
                                            focus:ring-[#e4edff]
                                            ${
                                                firstError(
                                                    errors,
                                                    "slug"
                                                )
                                                    ? "border-[#ef4444]"
                                                    : "border-[#dfe1e5]"
                                            }
                                        `}
                                    />
                                </div>

                                <p className="mt-1.5 text-[11px] text-[#777b83]">
                                    Auto-generated from
                                    the title. Edit to set
                                    a custom handle.
                                </p>

                                <FieldError
                                    errors={errors}
                                    field="slug"
                                />
                            </div>

                            <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <label
                                        htmlFor="blog-excerpt"
                                        className="text-[13px] font-medium text-[#24262a]"
                                    >
                                        Excerpt
                                    </label>

                                    <div
                                        ref={
                                            aiTarget ===
                                            "excerpt"
                                                ? aiPopupRef
                                                : null
                                        }
                                        className="relative"
                                    >
                                        <button
                                            type="button"
                                            disabled={
                                                saving ||
                                                Boolean(
                                                    aiLoading
                                                )
                                            }
                                            onClick={() => {
                                                if (
                                                    aiTarget ===
                                                    "excerpt"
                                                ) {
                                                    closeAI();
                                                } else {
                                                    openAI(
                                                        "excerpt"
                                                    );
                                                }
                                            }}
                                            className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#ff4fa3] via-[#9a65ff] to-[#23d9d1] text-white disabled:opacity-50"
                                        >
                                            {aiLoading ===
                                            "excerpt" ? (
                                                <LoaderCircle
                                                    size={
                                                        14
                                                    }
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <Sparkles
                                                    size={
                                                        14
                                                    }
                                                />
                                            )}
                                        </button>

                                        {aiTarget ===
                                            "excerpt" && (
                                            <BrandAITexterPopup
                                                prompt={
                                                    aiPrompt
                                                }
                                                setPrompt={
                                                    setAiPrompt
                                                }
                                                tone={
                                                    aiTone
                                                }
                                                setTone={
                                                    setAiTone
                                                }
                                                toneOpen={
                                                    aiToneOpen
                                                }
                                                setToneOpen={
                                                    setAiToneOpen
                                                }
                                                placeholder="Describe the excerpt you want..."
                                                loading={
                                                    aiLoading ===
                                                    "excerpt"
                                                }
                                                onGenerate={() =>
                                                    runCurrentAI(
                                                        aiPrompt
                                                    )
                                                }
                                                onAutoGenerate={() =>
                                                    runCurrentAI(
                                                        ""
                                                    )
                                                }
                                                className="right-0 top-[36px]"
                                            />
                                        )}
                                    </div>
                                </div>

                                <textarea
                                    id="blog-excerpt"
                                    value={form.excerpt}
                                    maxLength={500}
                                    rows={3}
                                    disabled={saving}
                                    placeholder="Short summary for previews and SEO..."
                                    onChange={(event) =>
                                        handleChange(
                                            "excerpt",
                                            event.target
                                                .value
                                        )
                                    }
                                    className="min-h-[80px] w-full resize-y rounded-[13px] border border-[#dfe1e5] px-3.5 py-3 text-[14px] outline-none focus:border-[#85afff] focus:ring-2 focus:ring-[#e4edff]"
                                />

                                <div className="mt-1.5 flex justify-between">
                                    <span className="text-[11px] text-[#777b83]">
                                        {
                                            form.excerpt
                                                .length
                                        }
                                        /500 characters
                                    </span>
                                </div>

                                <FieldError
                                    errors={errors}
                                    field="excerpt"
                                />
                            </div>

                            <div className="mt-4">
                                <div className="mb-2 flex items-center justify-between">
                                    <label className="text-[13px] font-medium text-[#24262a]">
                                        Content{" "}
                                        <span className="text-[#dc2626]">
                                            *
                                        </span>
                                    </label>

                                    <div
                                        ref={
                                            aiTarget ===
                                            "content"
                                                ? aiPopupRef
                                                : null
                                        }
                                        className="relative"
                                    >
                                        <button
                                            type="button"
                                            disabled={
                                                saving ||
                                                Boolean(
                                                    aiLoading
                                                )
                                            }
                                            onClick={() => {
                                                if (
                                                    aiTarget ===
                                                    "content"
                                                ) {
                                                    closeAI();
                                                } else {
                                                    openAI(
                                                        "content"
                                                    );
                                                }
                                            }}
                                            className="flex h-7 w-7 items-center justify-center rounded-[8px] bg-gradient-to-br from-[#ff4fa3] via-[#9a65ff] to-[#23d9d1] text-white disabled:opacity-50"
                                        >
                                            {aiLoading ===
                                            "content" ? (
                                                <LoaderCircle
                                                    size={
                                                        14
                                                    }
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <Sparkles
                                                    size={
                                                        14
                                                    }
                                                />
                                            )}
                                        </button>

                                        {aiTarget ===
                                            "content" && (
                                            <BrandAITexterPopup
                                                prompt={
                                                    aiPrompt
                                                }
                                                setPrompt={
                                                    setAiPrompt
                                                }
                                                tone={
                                                    aiTone
                                                }
                                                setTone={
                                                    setAiTone
                                                }
                                                toneOpen={
                                                    aiToneOpen
                                                }
                                                setToneOpen={
                                                    setAiToneOpen
                                                }
                                                placeholder="Describe the blog content you want..."
                                                loading={
                                                    aiLoading ===
                                                    "content"
                                                }
                                                onGenerate={() =>
                                                    runCurrentAI(
                                                        aiPrompt
                                                    )
                                                }
                                                onAutoGenerate={() =>
                                                    runCurrentAI(
                                                        ""
                                                    )
                                                }
                                                className="right-0 top-[36px]"
                                            />
                                        )}
                                    </div>
                                </div>

                                <BlogRichTextEditor
                                    value={form.content}
                                    disabled={saving}
                                    error={firstError(
                                        errors,
                                        "content"
                                    )}
                                    onChange={(value) =>
                                        handleChange(
                                            "content",
                                            value
                                        )
                                    }
                                />
                            </div>
                        </div>

                        <BlogFeaturedImageUploader
                            file={
                                form.featured_image
                            }
                            imageUrl={
                                form.featured_image_url
                            }
                            altText={
                                form.featured_image_alt
                            }
                            disabled={saving}
                            error={firstError(
                                errors,
                                "featured_image"
                            )}
                            onFileChange={
                                handleImageChange
                            }
                            onRemove={
                                handleRemoveImage
                            }
                            onAltTextChange={(
                                value
                            ) =>
                                handleChange(
                                    "featured_image_alt",
                                    value
                                )
                            }
                        />

                        <div
                            ref={
                                aiTarget === "seo"
                                    ? aiPopupRef
                                    : null
                            }
                            className="relative"
                        >
                            <BlogPostSeoCard
                                title={form.title}
                                excerpt={form.excerpt}
                                slug={form.slug}
                                seoTitle={
                                    form.seo_title
                                }
                                metaDescription={
                                    form.meta_description
                                }
                                disabled={saving}
                                errors={errors}
                                storeName="Storify"
                                websiteUrl={
                                    window.location
                                        .origin
                                }
                                onChange={
                                    handleChange
                                }
                                onOpenAI={() => {
                                    if (
                                        aiTarget ===
                                        "seo"
                                    ) {
                                        closeAI();
                                    } else {
                                        openAI("seo");
                                    }
                                }}
                            />

                            {aiTarget ===
                                "seo" && (
                                <BrandAITexterPopup
                                    prompt={
                                        aiPrompt
                                    }
                                    setPrompt={
                                        setAiPrompt
                                    }
                                    tone={
                                        aiTone
                                    }
                                    setTone={
                                        setAiTone
                                    }
                                    toneOpen={
                                        aiToneOpen
                                    }
                                    setToneOpen={
                                        setAiToneOpen
                                    }
                                    placeholder="Describe the SEO content you want, including keywords and search intent..."
                                    loading={
                                        aiLoading ===
                                        "seo"
                                    }
                                    onGenerate={() =>
                                        runCurrentAI(
                                            aiPrompt
                                        )
                                    }
                                    onAutoGenerate={() =>
                                        runCurrentAI(
                                            ""
                                        )
                                    }
                                    className="right-[58px] top-[68px]"
                                />
                            )}
                        </div>
                    </div>

                    <aside className="space-y-5 xl:sticky xl:top-[86px]">
                        <BlogPostPublishingSettings
                            status={form.status}
                            visibility={
                                form.visibility
                            }
                            isFeatured={
                                form.is_featured
                            }
                            allowComments={
                                form.allow_comments
                            }
                            scheduledAt={
                                form.scheduled_at
                            }
                            disabled={saving}
                            errors={errors}
                            onChange={handleChange}
                        />

                        <BlogPostOrganization
                            categories={categories}
                            selectedCategories={
                                form.category_ids
                            }
                            tags={form.tags}
                            loading={
                                optionsLoading
                            }
                            disabled={saving}
                            errors={errors}
                            onCategoriesChange={(
                                value
                            ) =>
                                handleChange(
                                    "category_ids",
                                    value
                                )
                            }
                            onTagsChange={(
                                value
                            ) =>
                                handleChange(
                                    "tags",
                                    value
                                )
                            }
                            onManageCategories={() =>
                                navigate(
                                    "/admin/content/blog-categories"
                                )
                            }
                        />
                    </aside>
                </div>
            </div>
        </form>
    );
};

const FieldError = ({
    errors,
    field,
}) => {
    const message = firstError(
        errors,
        field
    );

    if (!message) {
        return null;
    }

    return (
        <p className="mt-1.5 text-[12px] text-[#dc2626]">
            {message}
        </p>
    );
};

const Message = ({
    text,
    error = false,
}) => {
    if (!text) {
        return null;
    }

    return (
        <div
            className={`
                mb-5
                rounded-[13px]
                border
                px-4
                py-3
                text-[13px]
                ${
                    error
                        ? "border-[#fecaca] bg-[#fff1f2] text-[#c62828]"
                        : "border-[#bdebd5] bg-[#effbf5] text-[#15724e]"
                }
            `}
        >
            {text}
        </div>
    );
};

export default BlogPostForm;