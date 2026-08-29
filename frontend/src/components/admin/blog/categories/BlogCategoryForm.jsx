import {
    useEffect,
    useState,
} from "react";

import {
    AlertCircle,
    ArrowLeft,
    CheckCircle2,
    LoaderCircle,
} from "lucide-react";

import {
    useNavigate,
} from "react-router-dom";

import api from "../../../../api/axios";

import {
    EMPTY_BLOG_CATEGORY_FORM,
    firstError,
    getErrorMessage,
    getValidationErrors,
    normalizeBlogCategory,
    slugify,
} from "./blogCategoryConfig";

const BlogCategoryForm = ({
    mode = "create",
    initialData = null,
}) => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        ...EMPTY_BLOG_CATEGORY_FORM,
    });

    const [slugEdited, setSlugEdited] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    const [errors, setErrors] =
        useState({});

    const [errorMessage, setErrorMessage] =
        useState("");

    const [successMessage, setSuccessMessage] =
        useState("");

    const isEdit = mode === "edit";

    useEffect(() => {
        if (!initialData) {
            return;
        }

        setForm(
            normalizeBlogCategory(initialData)
        );

        setSlugEdited(
            Boolean(initialData?.slug)
        );
    }, [initialData]);

    const clearFeedback = (field = null) => {
        setErrorMessage("");
        setSuccessMessage("");

        if (!field) {
            return;
        }

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

    const handleNameChange = (event) => {
        const value = event.target.value;

        setForm((previous) => ({
            ...previous,
            name: value,
            slug: slugEdited
                ? previous.slug
                : slugify(value),
        }));

        clearFeedback("name");

        if (!slugEdited) {
            clearFeedback("slug");
        }
    };

    const handleSlugChange = (event) => {
        const value = slugify(
            event.target.value
        );

        setSlugEdited(true);

        setForm((previous) => ({
            ...previous,
            slug: value,
        }));

        clearFeedback("slug");
    };

    const handleChange = (event) => {
        const {
            name,
            value,
        } = event.target;

        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));

        clearFeedback(name);
    };

    const toggleActive = () => {
        setForm((previous) => ({
            ...previous,
            is_active: !previous.is_active,
        }));

        clearFeedback("is_active");
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!form.name.trim()) {
            nextErrors.name = [
                "Category name is required.",
            ];
        }

        if (!form.slug.trim()) {
            nextErrors.slug = [
                "URL handle is required.",
            ];
        }

        if (
            Number(form.display_order) < 0
        ) {
            nextErrors.display_order = [
                "Display order cannot be negative.",
            ];
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors)
            .length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setErrorMessage("");
        setSuccessMessage("");

        if (!validateForm()) {
            setErrorMessage(
                "Please correct the highlighted fields."
            );

            return;
        }

        setSaving(true);
        setErrors({});

        const payload = {
            name: form.name.trim(),
            slug:
                form.slug.trim() ||
                slugify(form.name),
            description:
                form.description.trim() ||
                null,
            is_active: form.is_active,
            display_order: Number(
                form.display_order || 0
            ),
        };

        try {
            const response = isEdit
                ? await api.post(
                      `/admin/blog-categories/${initialData.id}/update`,
                      payload
                  )
                : await api.post(
                      "/admin/blog-categories",
                      payload
                  );

            setSuccessMessage(
                response.data?.message ||
                    (
                        isEdit
                            ? "Blog category updated successfully."
                            : "Blog category created successfully."
                    )
            );

            window.setTimeout(() => {
                navigate(
                    "/admin/content/blog-categories"
                );
            }, 700);
        } catch (error) {
            setErrors(
                getValidationErrors(error)
            );

            setErrorMessage(
                getErrorMessage(
                    error,
                    isEdit
                        ? "Failed to update blog category."
                        : "Failed to create blog category."
                )
            );
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        navigate(
            "/admin/content/blog-categories"
        );
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="min-h-full bg-[#f6f6f7]"
        >
            {/* Header */}
            <div className="sticky top-0 z-20 flex min-h-[66px] items-center justify-between border-b border-[#e2e3e5] bg-[#f6f6f7]/95 px-7 backdrop-blur">
                <div className="flex items-center gap-3">
                    <h1 className="text-[20px] font-semibold tracking-[-0.02em] text-[#111214]">
                        {isEdit
                            ? "Edit category"
                            : "Add blog category"}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="submit"
                        disabled={saving}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2167d9] px-5 text-[14px] font-semibold text-white transition hover:bg-[#1859c2] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving && (
                            <LoaderCircle
                                size={16}
                                className="animate-spin"
                            />
                        )}

                        {saving
                            ? "Saving..."
                            : "Save"}
                    </button>

                    <button
                        type="button"
                        onClick={handleBack}
                        disabled={saving}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#dedfe2] bg-white px-4 text-[14px] font-medium text-[#202124] shadow-sm transition hover:bg-[#f8f8f9] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>
                </div>
            </div>

            <div className="p-7">
                {/* Messages */}
                {errorMessage && (
                    <div className="mb-5 flex items-start gap-3 rounded-[12px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                        <AlertCircle
                            size={18}
                            className="mt-0.5 shrink-0"
                        />

                        <span>
                            {errorMessage}
                        </span>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-5 flex items-start gap-3 rounded-[12px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-700">
                        <CheckCircle2
                            size={18}
                            className="mt-0.5 shrink-0"
                        />

                        <span>
                            {successMessage}
                        </span>
                    </div>
                )}

                <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
                    {/* Details */}
                    <section className="rounded-[18px] border border-[#dfe1e4] bg-white p-6 shadow-[0_2px_7px_rgba(0,0,0,0.04)]">
                        <h2 className="mb-5 text-[17px] font-semibold text-[#111214]">
                            Details
                        </h2>

                        <div className="space-y-5">
                            {/* Name */}
                            <div>
                                <label
                                    htmlFor="blog-category-name"
                                    className="mb-2 block text-[14px] font-medium text-[#17181a]"
                                >
                                    Name
                                    <span className="ml-1 text-red-500">
                                        *
                                    </span>
                                </label>

                                <input
                                    id="blog-category-name"
                                    type="text"
                                    value={form.name}
                                    onChange={
                                        handleNameChange
                                    }
                                    placeholder="e.g. Electronics Accessories"
                                    className={`
                                        h-11
                                        w-full
                                        rounded-[12px]
                                        border
                                        bg-white
                                        px-4
                                        text-[14px]
                                        text-[#151619]
                                        outline-none
                                        transition
                                        placeholder:text-[#a1a4aa]
                                        focus:ring-2
                                        focus:ring-blue-100
                                        ${
                                            firstError(
                                                errors,
                                                "name"
                                            )
                                                ? "border-red-400 focus:border-red-400"
                                                : "border-[#dfe1e5] focus:border-[#76a9ff]"
                                        }
                                    `}
                                />

                                {firstError(
                                    errors,
                                    "name"
                                ) && (
                                    <p className="mt-1.5 text-[12px] text-red-600">
                                        {firstError(
                                            errors,
                                            "name"
                                        )}
                                    </p>
                                )}
                            </div>

                            {/* URL handle */}
                            <div>
                                <label
                                    htmlFor="blog-category-slug"
                                    className="mb-2 block text-[14px] font-medium text-[#17181a]"
                                >
                                    URL handle
                                </label>

                                <div
                                    className={`
                                        flex
                                        min-h-11
                                        items-center
                                        overflow-hidden
                                        rounded-[12px]
                                        border
                                        bg-white
                                        transition
                                        focus-within:ring-2
                                        focus-within:ring-blue-100
                                        ${
                                            firstError(
                                                errors,
                                                "slug"
                                            )
                                                ? "border-red-400"
                                                : "border-[#dfe1e5] focus-within:border-[#76a9ff]"
                                        }
                                    `}
                                >
                                    <span className="border-r border-[#e4e5e7] bg-[#f8f8f9] px-3 py-3 text-[13px] text-[#777b83]">
                                        /blog/category/
                                    </span>

                                    <input
                                        id="blog-category-slug"
                                        type="text"
                                        value={form.slug}
                                        onChange={
                                            handleSlugChange
                                        }
                                        placeholder="category-handle"
                                        className="h-10 min-w-0 flex-1 bg-transparent px-3 text-[14px] text-[#151619] outline-none placeholder:text-[#a1a4aa]"
                                    />
                                </div>

                                <p className="mt-1.5 text-[12px] text-[#858890]">
                                    Automatically generated
                                    from the category name.
                                    You can edit it manually.
                                </p>

                                {firstError(
                                    errors,
                                    "slug"
                                ) && (
                                    <p className="mt-1.5 text-[12px] text-red-600">
                                        {firstError(
                                            errors,
                                            "slug"
                                        )}
                                    </p>
                                )}
                            </div>

                            {/* Description */}
                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <label
                                        htmlFor="blog-category-description"
                                        className="text-[14px] font-medium text-[#17181a]"
                                    >
                                        Description
                                    </label>

                                    <span className="text-[11px] text-[#92959c]">
                                        Optional
                                    </span>
                                </div>

                                <textarea
                                    id="blog-category-description"
                                    name="description"
                                    value={
                                        form.description
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    rows={5}
                                    maxLength={5000}
                                    placeholder="Describe what readers will find in this category..."
                                    className={`
                                        w-full
                                        resize-y
                                        rounded-[12px]
                                        border
                                        bg-white
                                        px-4
                                        py-3
                                        text-[14px]
                                        leading-6
                                        text-[#151619]
                                        outline-none
                                        transition
                                        placeholder:text-[#a1a4aa]
                                        focus:ring-2
                                        focus:ring-blue-100
                                        ${
                                            firstError(
                                                errors,
                                                "description"
                                            )
                                                ? "border-red-400 focus:border-red-400"
                                                : "border-[#dfe1e5] focus:border-[#76a9ff]"
                                        }
                                    `}
                                />

                                <div className="mt-1 flex justify-between">
                                    <div>
                                        {firstError(
                                            errors,
                                            "description"
                                        ) && (
                                            <p className="text-[12px] text-red-600">
                                                {firstError(
                                                    errors,
                                                    "description"
                                                )}
                                            </p>
                                        )}
                                    </div>

                                    <span className="text-[11px] text-[#92959c]">
                                        {
                                            form
                                                .description
                                                .length
                                        }
                                        /5000
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Settings */}
                    <section className="rounded-[18px] border border-[#dfe1e4] bg-white p-6 shadow-[0_2px_7px_rgba(0,0,0,0.04)]">
                        <h2 className="mb-5 text-[17px] font-semibold text-[#111214]">
                            Settings
                        </h2>

                        <div className="space-y-5">
                            {/* Active */}
                            <div className="flex min-h-[52px] items-center justify-between rounded-[13px] border border-[#dfe1e5] px-4">
                                <div>
                                    <p className="text-[14px] font-medium text-[#17181a]">
                                        Active
                                    </p>

                                    <p className="mt-0.5 text-[11px] text-[#858890]">
                                        Show this category
                                        on the storefront.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={
                                        form.is_active
                                    }
                                    onClick={
                                        toggleActive
                                    }
                                    className={`
                                        relative
                                        h-[24px]
                                        w-[42px]
                                        shrink-0
                                        rounded-full
                                        transition-colors
                                        ${
                                            form.is_active
                                                ? "bg-[#2167d9]"
                                                : "bg-[#d9dadd]"
                                        }
                                    `}
                                >
                                    <span
                                        className={`
                                            absolute
                                            top-[3px]
                                            h-[18px]
                                            w-[18px]
                                            rounded-full
                                            bg-white
                                            shadow-sm
                                            transition-transform
                                            ${
                                                form.is_active
                                                    ? "translate-x-[21px]"
                                                    : "translate-x-[3px]"
                                            }
                                        `}
                                    />
                                </button>
                            </div>

                            {/* Display order */}
                            <div>
                                <label
                                    htmlFor="blog-category-display-order"
                                    className="mb-2 block text-[14px] font-medium text-[#17181a]"
                                >
                                    Display order
                                </label>

                                <input
                                    id="blog-category-display-order"
                                    type="number"
                                    name="display_order"
                                    min="0"
                                    max="999999"
                                    value={
                                        form.display_order
                                    }
                                    onChange={
                                        handleChange
                                    }
                                    className={`
                                        h-11
                                        w-full
                                        rounded-[12px]
                                        border
                                        bg-white
                                        px-4
                                        text-[14px]
                                        text-[#151619]
                                        outline-none
                                        transition
                                        focus:ring-2
                                        focus:ring-blue-100
                                        ${
                                            firstError(
                                                errors,
                                                "display_order"
                                            )
                                                ? "border-red-400 focus:border-red-400"
                                                : "border-[#dfe1e5] focus:border-[#76a9ff]"
                                        }
                                    `}
                                />

                                <p className="mt-1.5 text-[12px] leading-5 text-[#858890]">
                                    Lower numbers appear
                                    first in the category
                                    list.
                                </p>

                                {firstError(
                                    errors,
                                    "display_order"
                                ) && (
                                    <p className="mt-1.5 text-[12px] text-red-600">
                                        {firstError(
                                            errors,
                                            "display_order"
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </form>
    );
};

export default BlogCategoryForm;