export const PRODUCT_CATALOG_API = {
    products: "/products",
    filters: "/product-catalog/filters",
};

export const PRODUCT_CATALOG_ROUTE =
    "/products";

export const PRODUCT_SORT_OPTIONS = [
    {
        value: "default",
        label: "Featured",
    },
    {
        value: "newest",
        label: "Newest",
    },
    {
        value: "price_asc",
        label: "Price, low to high",
    },
    {
        value: "price_desc",
        label: "Price, high to low",
    },
    {
        value: "title_asc",
        label: "Alphabetically, A-Z",
    },
    {
        value: "title_desc",
        label: "Alphabetically, Z-A",
    },
];

export const EMPTY_CATALOG_FILTERS = {
    categories: [],
    collections: [],
    brands: [],
    locations: [],

    price_range: {
        min: 0,
        max: 1000,
    },

    location_radius_available: false,
};

export const DEFAULT_CATALOG_STATE = {
    search: "",
    categories: [],
    collections: [],
    brands: [],
    locations: [],
    minPrice: "",
    maxPrice: "",
    inStock: false,
    sort: "default",
    page: 1,
    perPage: 12,
};

export const getArrayQueryValue = (
    searchParams,
    key
) => {
    const value =
        searchParams.get(key);

    if (!value) {
        return [];
    }

    return value
        .split(",")
        .map((item) =>
            item.trim()
        )
        .filter(Boolean);
};

export const getInitialCatalogState = (
    searchParams
) => {
    return {
        search:
            searchParams.get(
                "search"
            ) || "",

        categories:
            getArrayQueryValue(
                searchParams,
                "category"
            ),

        collections:
            getArrayQueryValue(
                searchParams,
                "collection"
            ),

        brands:
            getArrayQueryValue(
                searchParams,
                "brand"
            ),

        locations:
            getArrayQueryValue(
                searchParams,
                "location"
            ),

        minPrice:
            searchParams.get(
                "min_price"
            ) || "",

        maxPrice:
            searchParams.get(
                "max_price"
            ) || "",

        inStock:
            searchParams.get(
                "in_stock"
            ) === "1",

        sort:
            searchParams.get(
                "sort"
            ) || "default",

        page: Math.max(
            1,
            Number(
                searchParams.get(
                    "page"
                )
            ) || 1
        ),

        perPage: 12,
    };
};

export const buildCatalogApiParams = (
    state
) => {
    const params = {
        page: state.page,
        per_page: state.perPage,
    };

    if (state.search.trim()) {
        params.search =
            state.search.trim();
    }

    if (state.categories.length) {
        params.category =
            state.categories.join(",");
    }

    if (state.collections.length) {
        params.collection =
            state.collections.join(",");
    }

    if (state.brands.length) {
        params.brand =
            state.brands.join(",");
    }

    if (state.locations.length) {
        params.location =
            state.locations.join(",");
    }

    if (
        state.minPrice !== "" &&
        state.minPrice !== null
    ) {
        params.min_price =
            state.minPrice;
    }

    if (
        state.maxPrice !== "" &&
        state.maxPrice !== null
    ) {
        params.max_price =
            state.maxPrice;
    }

    if (state.inStock) {
        params.in_stock = 1;
    }

    if (
        state.sort &&
        state.sort !== "default"
    ) {
        params.sort = state.sort;
    }

    return params;
};

export const buildCatalogSearchParams = (
    state
) => {
    const params =
        new URLSearchParams();

    if (state.search.trim()) {
        params.set(
            "search",
            state.search.trim()
        );
    }

    if (state.categories.length) {
        params.set(
            "category",
            state.categories.join(",")
        );
    }

    if (state.collections.length) {
        params.set(
            "collection",
            state.collections.join(",")
        );
    }

    if (state.brands.length) {
        params.set(
            "brand",
            state.brands.join(",")
        );
    }

    if (state.locations.length) {
        params.set(
            "location",
            state.locations.join(",")
        );
    }

    if (state.minPrice !== "") {
        params.set(
            "min_price",
            state.minPrice
        );
    }

    if (state.maxPrice !== "") {
        params.set(
            "max_price",
            state.maxPrice
        );
    }

    if (state.inStock) {
        params.set(
            "in_stock",
            "1"
        );
    }

    if (
        state.sort &&
        state.sort !== "default"
    ) {
        params.set(
            "sort",
            state.sort
        );
    }

    if (state.page > 1) {
        params.set(
            "page",
            String(state.page)
        );
    }

    return params;
};

export const toggleFilterValue = (
    values,
    value
) => {
    const normalizedValue =
        String(value);

    if (
        values
            .map(String)
            .includes(
                normalizedValue
            )
    ) {
        return values.filter(
            (item) =>
                String(item) !==
                normalizedValue
        );
    }

    return [
        ...values,
        normalizedValue,
    ];
};

export const getAppliedFilterCount = (
    state
) => {
    let count = 0;

    if (state.search.trim()) {
        count += 1;
    }

    count +=
        state.categories.length;

    count +=
        state.collections.length;

    count +=
        state.brands.length;

    count +=
        state.locations.length;

    if (
        state.minPrice !== "" ||
        state.maxPrice !== ""
    ) {
        count += 1;
    }

    if (state.inStock) {
        count += 1;
    }

    return count;
};