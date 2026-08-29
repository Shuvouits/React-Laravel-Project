export const EMPTY_BLOG_POST_FORM = {
    title: "",
    slug: "",
    excerpt: "",
    content: "",

    featured_image: null,
    featured_image_url: "",
    featured_image_alt: "",
    remove_featured_image: false,

    status: "draft",
    visibility: "public",
    is_featured: false,
    allow_comments: true,
    scheduled_at: "",

    category_ids: [],
    tags: [],

    seo_title: "",
    meta_description: "",
};

export const BLOG_POST_TABS = [
    {
        value: "all",
        label: "All",
    },
    {
        value: "published",
        label: "Published",
    },
    {
        value: "draft",
        label: "Drafts",
    },
    {
        value: "scheduled",
        label: "Scheduled",
    },
    {
        value: "archived",
        label: "Archived",
    },
];

export const BLOG_POST_STATUSES = [
    {
        value: "draft",
        label: "Draft",
    },
    {
        value: "published",
        label: "Published",
    },
    {
        value: "scheduled",
        label: "Scheduled",
    },
    {
        value: "archived",
        label: "Archived",
    },
];

export const BLOG_POST_VISIBILITIES = [
    {
        value: "public",
        label: "Public",
    },
    {
        value: "private",
        label: "Private",
    },
];

// পুরোনো component-এ BLOG_VISIBILITIES ব্যবহার করা থাকলে
// সেটিও কাজ করবে।
export const BLOG_VISIBILITIES =
    BLOG_POST_VISIBILITIES;

export const BLOG_AI_TONES = [
    {
        value: "professional",
        label: "Professional",
    },
    {
        value: "friendly",
        label: "Friendly",
    },
    {
        value: "informative",
        label: "Informative",
    },
    {
        value: "persuasive",
        label: "Persuasive",
    },
    {
        value: "conversational",
        label: "Conversational",
    },
];

export const slugify = (value = "") => {
    return String(value)
        .trim()
        .toLowerCase()
        .replace(/['’]/g, "")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
};

export const normalizeBoolean = (
    value,
    fallback = false
) => {
    if (
        value === true ||
        value === 1 ||
        value === "1" ||
        value === "true"
    ) {
        return true;
    }

    if (
        value === false ||
        value === 0 ||
        value === "0" ||
        value === "false"
    ) {
        return false;
    }

    return fallback;
};

export const normalizeNumberArray = (values) => {
    if (!Array.isArray(values)) {
        return [];
    }

    return [
        ...new Set(
            values
                .map((value) => Number(value))
                .filter(
                    (value) =>
                        Number.isInteger(value) &&
                        value > 0
                )
        ),
    ];
};

export const normalizeStringArray = (values) => {
    if (!Array.isArray(values)) {
        return [];
    }

    return [
        ...new Set(
            values
                .map((value) =>
                    String(value).trim()
                )
                .filter(Boolean)
        ),
    ];
};

export const toDateTimeLocal = (value) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const offset =
        date.getTimezoneOffset() * 60 * 1000;

    return new Date(date.getTime() - offset)
        .toISOString()
        .slice(0, 16);
};

export const normalizeBlogPost = (
    post = {}
) => {
    return {
        title: post?.title || "",
        slug: post?.slug || "",
        excerpt: post?.excerpt || "",
        content: post?.content || "",

        featured_image: null,
        featured_image_url:
            post?.featured_image_url ||
            post?.featured_image ||
            "",
        featured_image_alt:
            post?.featured_image_alt || "",
        remove_featured_image: false,

        status: post?.status || "draft",
        visibility:
            post?.visibility || "public",

        is_featured: normalizeBoolean(
            post?.is_featured,
            false
        ),

        allow_comments: normalizeBoolean(
            post?.allow_comments,
            true
        ),

        category_ids: normalizeNumberArray(
            post?.category_ids ||
                post?.categories?.map(
                    (category) => category.id
                ) ||
                []
        ),

        tags: normalizeStringArray(
            post?.tags || []
        ),

        seo_title: post?.seo_title || "",

        meta_description:
            post?.meta_description || "",

        scheduled_at: toDateTimeLocal(
            post?.scheduled_at
        ),
    };
};

export const getPostStatusLabel = (status) => {
    const match = BLOG_POST_STATUSES.find(
        (item) => item.value === status
    );

    return match?.label || "Draft";
};

export const getPostStatusClass = (status) => {
    switch (status) {
        case "published":
            return "bg-[#2167d9] text-white";

        case "scheduled":
            return "bg-[#eef1ff] text-[#4056d6]";

        case "archived":
            return "bg-[#ececef] text-[#666970]";

        default:
            return "border border-[#dfe1e4] bg-white text-[#55585f]";
    }
};

export const getValidationErrors = (
    error
) => {
    if (
        error?.response?.status === 422 &&
        error?.response?.data?.errors
    ) {
        return error.response.data.errors;
    }

    return {};
};

export const getErrorMessage = (
    error,
    fallback =
        "Something went wrong. Please try again."
) => {
    return (
        error?.response?.data?.message ||
        error?.message ||
        fallback
    );
};

/*
|--------------------------------------------------------------------------
| FIRST VALIDATION ERROR
|--------------------------------------------------------------------------
|
| দুইভাবেই ব্যবহার করা যাবে:
|
| firstError(errors, "title")
| firstError(errors.title)
|
*/

export const firstError = (
    errorsOrFieldErrors,
    field = null
) => {
    const fieldErrors = field
        ? errorsOrFieldErrors?.[field]
        : errorsOrFieldErrors;

    if (Array.isArray(fieldErrors)) {
        return fieldErrors[0] || "";
    }

    if (typeof fieldErrors === "string") {
        return fieldErrors;
    }

    return "";
};

export const formatBlogDate = (value) => {
    if (!value) {
        return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return new Intl.DateTimeFormat(
        "en-US",
        {
            year: "numeric",
            month: "short",
            day: "numeric",
        }
    ).format(date);
};

/*
|--------------------------------------------------------------------------
| BUILD BLOG POST FORM DATA
|--------------------------------------------------------------------------
|
| দুইভাবেই ব্যবহার করা যাবে:
|
| buildBlogPostFormData(form)
|
| অথবা:
|
| buildBlogPostFormData({
|     form,
|     featuredImage,
|     removeFeaturedImage,
| })
|
*/

export const buildBlogPostFormData = (
    input
) => {
    const wrappedInput =
        input?.form &&
        typeof input.form === "object";

    const form = wrappedInput
        ? input.form
        : input;

    const featuredImage = wrappedInput
        ? input.featuredImage
        : form?.featured_image;

    const removeFeaturedImage = wrappedInput
        ? Boolean(input.removeFeaturedImage)
        : Boolean(
              form?.remove_featured_image
          );

    const formData = new FormData();

    formData.append(
        "title",
        String(form?.title || "").trim()
    );

    formData.append(
        "slug",
        String(
            form?.slug ||
                slugify(form?.title || "")
        ).trim()
    );

    formData.append(
        "excerpt",
        String(form?.excerpt || "").trim()
    );

    formData.append(
        "content",
        String(form?.content || "")
    );

    formData.append(
        "featured_image_alt",
        String(
            form?.featured_image_alt || ""
        ).trim()
    );

    formData.append(
        "status",
        form?.status || "draft"
    );

    formData.append(
        "visibility",
        form?.visibility || "public"
    );

    formData.append(
        "is_featured",
        form?.is_featured ? "1" : "0"
    );

    formData.append(
        "allow_comments",
        form?.allow_comments ? "1" : "0"
    );

    normalizeNumberArray(
        form?.category_ids
    ).forEach((categoryId) => {
        formData.append(
            "category_ids[]",
            String(categoryId)
        );
    });

    normalizeStringArray(
        form?.tags
    ).forEach((tag) => {
        formData.append(
            "tags[]",
            tag
        );
    });

    formData.append(
        "seo_title",
        String(form?.seo_title || "").trim()
    );

    formData.append(
        "meta_description",
        String(
            form?.meta_description || ""
        ).trim()
    );

    if (
        form?.status === "scheduled" &&
        form?.scheduled_at
    ) {
        formData.append(
            "scheduled_at",
            form.scheduled_at
        );
    } else {
        formData.append(
            "scheduled_at",
            ""
        );
    }

    if (featuredImage instanceof File) {
        formData.append(
            "featured_image",
            featuredImage
        );
    }

    formData.append(
        "remove_featured_image",
        removeFeaturedImage ? "1" : "0"
    );

    return formData;
};