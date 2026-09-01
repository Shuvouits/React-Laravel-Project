import {
    ChevronDown,
    LocateFixed,
    MapPin,
    Search,
    X,
} from "lucide-react";
import { useState } from "react";

const ProductCatalogSidebar = ({
    state,
    filters,
    appliedCount = 0,
    onToggleCategory,
    onToggleCollection,
    onToggleLocation,
    onPriceChange,
    onStockChange,
    onClear,
}) => {
    const [categoryExpanded, setCategoryExpanded] =
        useState(false);

    const [collectionExpanded, setCollectionExpanded] =
        useState(false);

    const [locationSearch, setLocationSearch] =
        useState("");

    const categories =
        filters.categories || [];

    const collections =
        filters.collections || [];

    const locations =
        filters.locations || [];

    const visibleCategories =
        categoryExpanded
            ? categories
            : categories.slice(0, 10);

    const visibleCollections =
        collectionExpanded
            ? collections
            : collections.slice(0, 8);

    const visibleLocations =
        locations.filter((location) => {
            const keyword =
                locationSearch
                    .trim()
                    .toLowerCase();

            if (!keyword) {
                return true;
            }

            return String(
                location.label ||
                location.name ||
                ""
            )
                .toLowerCase()
                .includes(keyword);
        });

    return (
        <aside className="w-full lg:w-[292px] lg:shrink-0">
            <div className="flex min-h-[42px] items-center justify-between border-b border-[#e4e4e4] pb-[13px]">
                <span className="text-[13px] text-[#777]">
                    {appliedCount > 0
                        ? `${appliedCount} ${
                              appliedCount === 1
                                  ? "filter"
                                  : "filters"
                          } applied`
                        : "No filters applied"}
                </span>

                {appliedCount > 0 && (
                    <button
                        type="button"
                        onClick={onClear}
                        className="flex items-center gap-[5px] text-[12px] font-medium text-[#1769e8] transition hover:text-[#0f55c2]"
                    >
                        <X size={13} />
                        Clear all
                    </button>
                )}
            </div>

            <FilterSection
                title="Location"
                defaultOpen
            >
                <div className="flex items-start gap-[9px]">
                    <MapPin
                        size={17}
                        strokeWidth={1.8}
                        className="mt-[1px] shrink-0 text-[#777]"
                    />

                    <div>
                        <p className="text-[13px] text-[#555]">
                            All locations
                        </p>

                        <p className="mt-[5px] text-[12px] text-[#888]">
                            Products available by inventory location
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    disabled
                    title="Latitude and longitude are not configured"
                    className="mt-[14px] flex h-[38px] w-full items-center gap-[8px] rounded-full border border-[#dedede] px-[12px] text-[12px] text-[#777] opacity-60"
                >
                    <LocateFixed
                        size={15}
                        strokeWidth={1.8}
                    />

                    Use my current location
                </button>

                <div className="relative mt-[10px]">
                    <Search
                        size={15}
                        strokeWidth={1.8}
                        className="pointer-events-none absolute left-[12px] top-1/2 -translate-y-1/2 text-[#999]"
                    />

                    <input
                        type="text"
                        value={locationSearch}
                        onChange={(event) =>
                            setLocationSearch(
                                event.target.value
                            )
                        }
                        placeholder="Search city..."
                        className="h-[38px] w-full rounded-full border border-[#dedede] pl-[35px] pr-[12px] text-[12px] text-[#333] outline-none transition placeholder:text-[#999] focus:border-[#7da4ec] focus:ring-2 focus:ring-[#e1eaff]"
                    />
                </div>

                <div className="mt-[12px] max-h-[210px] space-y-[10px] overflow-y-auto pr-[3px]">
                    {visibleLocations.map(
                        (location) => (
                            <FilterCheckbox
                                key={location.id}
                                checked={state.locations
                                    .map(String)
                                    .includes(
                                        String(
                                            location.id
                                        )
                                    )}
                                label={
                                    location.label ||
                                    location.name
                                }
                                count={
                                    location.products_count
                                }
                                onChange={() =>
                                    onToggleLocation(
                                        location.id
                                    )
                                }
                            />
                        )
                    )}

                    {visibleLocations.length === 0 && (
                        <p className="py-2 text-[12px] text-[#999]">
                            No locations found.
                        </p>
                    )}
                </div>
            </FilterSection>

            <FilterSection
                title="Price"
                defaultOpen
            >
                <div className="mb-[14px] h-[3px] rounded-full bg-[#2b6de0]" />

                <div className="grid grid-cols-2 gap-[12px]">
                    <PriceField
                        label="Min price"
                        value={state.minPrice}
                        placeholder={
                            filters.price_range?.min ?? 0
                        }
                        onChange={(value) =>
                            onPriceChange(
                                "minPrice",
                                value
                            )
                        }
                    />

                    <PriceField
                        label="Max price"
                        value={state.maxPrice}
                        placeholder={
                            filters.price_range?.max ??
                            1000
                        }
                        onChange={(value) =>
                            onPriceChange(
                                "maxPrice",
                                value
                            )
                        }
                    />
                </div>

                <label className="mt-[15px] flex cursor-pointer items-center gap-[9px]">
                    <input
                        type="checkbox"
                        checked={state.inStock}
                        onChange={(event) =>
                            onStockChange(
                                event.target.checked
                            )
                        }
                        className="h-[17px] w-[17px] rounded-[4px] border-[#d6d8dc] accent-[#2065D1]"
                    />

                    <span className="text-[13px] text-[#444]">
                        In-stock products only
                    </span>
                </label>
            </FilterSection>

            <FilterSection
                title="Categories"
                count={state.categories.length}
                defaultOpen
            >
                <div className="space-y-[11px]">
                    {visibleCategories.map(
                        (category) => (
                            <FilterCheckbox
                                key={category.id}
                                checked={state.categories.includes(
                                    String(
                                        category.slug
                                    )
                                )}
                                label={category.name}
                                count={
                                    category.products_count
                                }
                                onChange={() =>
                                    onToggleCategory(
                                        category.slug
                                    )
                                }
                            />
                        )
                    )}
                </div>

                {categories.length > 10 && (
                    <button
                        type="button"
                        onClick={() =>
                            setCategoryExpanded(
                                (previous) =>
                                    !previous
                            )
                        }
                        className="mt-[15px] text-[12px] font-medium text-[#1769e8] hover:text-[#0f55c2]"
                    >
                        {categoryExpanded
                            ? "Show less"
                            : "View all categories"}
                    </button>
                )}
            </FilterSection>

            <FilterSection
                title="Collections"
                count={state.collections.length}
                defaultOpen
            >
                <div className="space-y-[11px]">
                    {visibleCollections.map(
                        (collection) => (
                            <FilterCheckbox
                                key={collection.id}
                                checked={state.collections.includes(
                                    String(
                                        collection.slug
                                    )
                                )}
                                label={collection.title}
                                count={
                                    collection.products_count
                                }
                                onChange={() =>
                                    onToggleCollection(
                                        collection.slug
                                    )
                                }
                            />
                        )
                    )}
                </div>

                {collections.length > 8 && (
                    <button
                        type="button"
                        onClick={() =>
                            setCollectionExpanded(
                                (previous) =>
                                    !previous
                            )
                        }
                        className="mt-[15px] text-[12px] font-medium text-[#1769e8] hover:text-[#0f55c2]"
                    >
                        {collectionExpanded
                            ? "Show less"
                            : "View all collections"}
                    </button>
                )}
            </FilterSection>
        </aside>
    );
};

const FilterSection = ({
    title,
    count = 0,
    defaultOpen = false,
    children,
}) => {
    const [open, setOpen] =
        useState(defaultOpen);

    return (
        <section className="border-b border-[#e5e5e5] py-[18px]">
            <button
                type="button"
                onClick={() =>
                    setOpen(
                        (previous) =>
                            !previous
                    )
                }
                className="flex w-full items-center justify-between gap-4 text-left"
            >
                <div className="flex items-center gap-[8px]">
                    <h3 className="text-[14px] font-semibold text-[#282828]">
                        {title}
                    </h3>

                    {count > 0 && (
                        <span className="flex h-[21px] min-w-[21px] items-center justify-center rounded-full bg-[#2b6de0] px-[6px] text-[10px] font-semibold text-white">
                            {count}
                        </span>
                    )}
                </div>

                <ChevronDown
                    size={15}
                    strokeWidth={1.8}
                    className={`text-[#666] transition-transform ${
                        open
                            ? "rotate-180"
                            : ""
                    }`}
                />
            </button>

            {open && (
                <div className="mt-[16px]">
                    {children}
                </div>
            )}
        </section>
    );
};

const FilterCheckbox = ({
    checked,
    label,
    count,
    onChange,
}) => {
    return (
        <label className="flex cursor-pointer items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-[9px]">
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={onChange}
                    className="h-[17px] w-[17px] shrink-0 rounded-[4px] border-[#d6d8dc] accent-[#2065D1]"
                />

                <span className="truncate text-[13px] text-[#3f3f3f]">
                    {label}
                </span>
            </div>

            {Number.isFinite(Number(count)) && (
                <span className="shrink-0 text-[11px] text-[#999]">
                    {count}
                </span>
            )}
        </label>
    );
};

const PriceField = ({
    label,
    value,
    placeholder,
    onChange,
}) => {
    return (
        <label>
            <span className="mb-[7px] block text-[11px] text-[#777]">
                {label}
            </span>

            <div className="flex h-[39px] items-center rounded-full border border-[#dedede] bg-white px-[12px] focus-within:border-[#7da4ec] focus-within:ring-2 focus-within:ring-[#e1eaff]">
                <span className="mr-[7px] text-[13px] text-[#777]">
                    $
                </span>

                <input
                    type="number"
                    min="0"
                    value={value}
                    placeholder={String(
                        placeholder
                    )}
                    onChange={(event) =>
                        onChange(
                            event.target.value
                        )
                    }
                    className="h-full min-w-0 flex-1 border-0 bg-transparent text-[13px] text-[#333] outline-none placeholder:text-[#999]"
                />
            </div>
        </label>
    );
};

export default ProductCatalogSidebar;