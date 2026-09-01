export const GLOBAL_VARIANT_API = {
    index: "/admin/global-variants",
    create: "/admin/global-variants",

    show: (id) =>
        `/admin/global-variants/${id}`,

    update: (id) =>
        `/admin/global-variants/${id}/update`,

    delete: (id) =>
        `/admin/global-variants/${id}`,

    reorder: "/admin/global-variants/reorder",
};

export const GLOBAL_VARIANT_ROUTES = {
    index: "/admin/products/global-variants",
};

export const VISUAL_OPTIONS = [
    {
        value: "rectangle",
        label: "Rectangle",
    },
    {
        value: "circle",
        label: "Circle",
    },
    {
        value: "pill",
        label: "Pill",
    },
    {
        value: "color",
        label: "Color",
    },
];

export const DEFAULT_COLOR_CODE = "#D1D5DB";

export const EMPTY_VARIANT = {
    name: "",
    visual_type: "rectangle",
    sort_order: 0,
    values: [],
};

export const isColorVariant = (variant) => {
    if (
        variant?.is_color === true ||
        variant?.is_color === 1 ||
        variant?.is_color === "1"
    ) {
        return true;
    }

    const name = String(
        variant?.name || ""
    )
        .trim()
        .toLowerCase();

    return (
        name === "color" ||
        name === "colour"
    );
};

export const normalizeColorCode = (colorCode) => {
    const value = String(
        colorCode || ""
    ).trim();

    if (!value) {
        return null;
    }

    const normalized = value.startsWith("#")
        ? value
        : `#${value}`;

    if (/^#[0-9a-fA-F]{3}$/.test(normalized)) {
        const red = normalized[1];
        const green = normalized[2];
        const blue = normalized[3];

        return `#${red}${red}${green}${green}${blue}${blue}`
            .toUpperCase();
    }

    if (/^#[0-9a-fA-F]{6}$/.test(normalized)) {
        return normalized.toUpperCase();
    }

    return null;
};

export const getColorPickerValue = (colorCode) => {
    return (
        normalizeColorCode(colorCode) ||
        DEFAULT_COLOR_CODE
    );
};

export const normalizeVariant = (variant) => {
    return {
        ...EMPTY_VARIANT,
        ...variant,

        sort_order:
            Number(variant?.sort_order) || 0,

        values: Array.isArray(variant?.values)
            ? variant.values.map(
                (value, index) => ({
                    ...value,

                    value: String(
                        value?.value || ""
                    ),

                    color_code:
                        normalizeColorCode(
                            value?.color_code
                        ),

                    sort_order:
                        Number(
                            value?.sort_order
                        ) || index,
                })
            )
            : [],
    };
};