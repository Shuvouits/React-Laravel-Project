export const EMPTY_BLOG_CATEGORY_FORM = {
    name: "",
    slug: "",
    description: "",
    is_active: true,
    display_order: 0,
};

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

export const normalizeBlogCategory = (
    category = {}
) => {
    return {
        name: category?.name || "",
        slug: category?.slug || "",
        description:
            category?.description || "",
        is_active: normalizeBoolean(
            category?.is_active,
            true
        ),
        display_order: Number(
            category?.display_order || 0
        ),
    };
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

export const firstError = (
    errors,
    field
) => {
    const fieldErrors = errors?.[field];

    if (!Array.isArray(fieldErrors)) {
        return "";
    }

    return fieldErrors[0] || "";
};