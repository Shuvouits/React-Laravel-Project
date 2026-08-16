import {
    Boxes,
    ChevronLeft,
    ChevronRight,
    CircleOff,
    Eye,
    LoaderCircle,
    MapPin,
    MoreHorizontal,
    Package,
    Search,
    TriangleAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import api from "../../../api/axios";

const tabs = [
    { key: "all", label: "All" },
    { key: "in_stock", label: "In stock" },
    { key: "low_stock", label: "Low stock" },
    { key: "out_of_stock", label: "Out of stock" },
];

export default function AdminInventory() {
    const navigate = useNavigate();
    const menuButtonRefs = useRef({});

    const [inventory, setInventory] = useState([]);
    const [stats, setStats] = useState({
        tracked_skus: 0,
        low_stock_skus: 0,
        out_of_stock_skus: 0,
        on_hand_units: 0,
        active_locations: 0,
    });
    const [locations, setLocations] = useState([]);
    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0,
        from: null,
        to: null,
    });

    const [activeTab, setActiveTab] = useState("all");
    const [locationId, setLocationId] = useState("");
    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openMenuKey, setOpenMenuKey] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null);

    useEffect(() => {
        fetchInventory(1);
    }, [activeTab, locationId, search]);

    useEffect(() => {
        const closeFloatingMenu = () => {
            closeMenu();
        };

        window.addEventListener("scroll", closeFloatingMenu, true);
        window.addEventListener("resize", closeFloatingMenu);

        return () => {
            window.removeEventListener("scroll", closeFloatingMenu, true);
            window.removeEventListener("resize", closeFloatingMenu);
        };
    }, []);

    const fetchInventory = async (page = 1) => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get("/admin/inventory", {
                params: {
                    tab: activeTab,
                    location_id: locationId || undefined,
                    search,
                    page,
                    per_page: 15,
                },
            });

            const data = response.data?.inventory;

            setInventory(data?.data || []);
            setStats(response.data?.stats || {
                tracked_skus: 0,
                low_stock_skus: 0,
                out_of_stock_skus: 0,
                on_hand_units: 0,
                active_locations: 0,
            });
            setLocations(response.data?.locations || []);

            setPagination({
                current_page: data?.current_page || 1,
                last_page: data?.last_page || 1,
                per_page: data?.per_page || 15,
                total: data?.total || 0,
                from: data?.from || null,
                to: data?.to || null,
            });
        } catch (err) {
            console.error("Inventory fetch error:", err);
            setError(
                err.response?.data?.message ||
                "Unable to load inventory."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event) => {
        event.preventDefault();
        setSearch(searchInput.trim());
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        closeMenu();
    };

    const closeMenu = () => {
        setOpenMenuKey(null);
        setMenuPosition(null);
    };

    const getRowKey = (item) => {
        return `${item.product_id}-${item.variant_id || "product"}`;
    };

    const toggleMenu = (item) => {
        const rowKey = getRowKey(item);

        if (openMenuKey === rowKey) {
            closeMenu();
            return;
        }

        const button = menuButtonRefs.current[rowKey];

        if (!button) {
            return;
        }

        const rect = button.getBoundingClientRect();
        const menuWidth = 178;
        const menuHeight = 58;
        const gap = 7;
        const padding = 12;

        let left = rect.right - menuWidth;
        let top = rect.bottom + gap;

        if (top + menuHeight > window.innerHeight - padding) {
            top = Math.max(
                padding,
                rect.top - menuHeight - gap
            );
        }

        left = Math.max(
            padding,
            Math.min(
                left,
                window.innerWidth - menuWidth - padding
            )
        );

        setOpenMenuKey(rowKey);
        setMenuPosition({ top, left });
    };


    const handleViewProduct = (item) => {
        closeMenu();

        if (!item?.product_slug) {
            return;
        }

        navigate(
            `/products/${item.product_slug}`
        );
    };



    const selectedMenuItem =
        inventory.find(
            (item) => getRowKey(item) === openMenuKey
        ) || null;

    const editableLocationId =
        locationId ||
        (
            locations.length === 1
                ? locations[0].id
                : ""
        );

    const handleInventoryUpdated = (
        originalItem,
        updatedInventory
    ) => {
        const oldStatus =
            originalItem.status;

        const updatedRow = {
            ...originalItem,
            ...updatedInventory,
        };

        updatedRow.status =
            getInventoryStatusFromRow(
                updatedRow
            );

        const newStatus =
            updatedRow.status;

        const onHandDifference =
            Number(updatedRow.on_hand || 0) -
            Number(originalItem.on_hand || 0);

        setInventory((current) =>
            current.map((row) => {
                if (
                    getRowKey(row) !==
                    getRowKey(originalItem)
                ) {
                    return row;
                }

                return updatedRow;
            })
        );

        setStats((current) => {
            let lowStockSkus =
                Number(
                    current.low_stock_skus || 0
                );

            let outOfStockSkus =
                Number(
                    current.out_of_stock_skus || 0
                );

            if (
                oldStatus === "low_stock" &&
                newStatus !== "low_stock"
            ) {
                lowStockSkus = Math.max(
                    0,
                    lowStockSkus - 1
                );
            }

            if (
                oldStatus !== "low_stock" &&
                newStatus === "low_stock"
            ) {
                lowStockSkus += 1;
            }

            if (
                oldStatus === "out_of_stock" &&
                newStatus !== "out_of_stock"
            ) {
                outOfStockSkus = Math.max(
                    0,
                    outOfStockSkus - 1
                );
            }

            if (
                oldStatus !== "out_of_stock" &&
                newStatus === "out_of_stock"
            ) {
                outOfStockSkus += 1;
            }

            return {
                ...current,
                low_stock_skus:
                    lowStockSkus,
                out_of_stock_skus:
                    outOfStockSkus,
                on_hand_units:
                    Math.max(
                        0,
                        Number(
                            current.on_hand_units || 0
                        ) +
                        onHandDifference
                    ),
            };
        });
    };

    return (
        <div className="min-h-screen bg-[#f6f6f7]">
            <div className="mx-auto w-full max-w-[1600px] px-6 py-7">
                <div className="mb-6">
                    <h1 className="text-[24px] font-semibold tracking-[-0.4px] text-[#171717]">
                        Inventory
                    </h1>

                    <p className="mt-1 text-[14px] text-[#737373]">
                        Track stock levels, availability, and inventory across all active locations.
                    </p>
                </div>

                <StatsGrid stats={stats} />

                <section className="mt-5 overflow-hidden rounded-[18px] border border-[#dedede] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="border-b border-[#e5e5e5] px-5">
                        <div className="flex gap-6 overflow-x-auto">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.key}
                                    type="button"
                                    onClick={() => handleTabChange(tab.key)}
                                    className={`relative whitespace-nowrap py-[15px] text-[13px] font-medium transition ${activeTab === tab.key
                                        ? "text-[#171717]"
                                        : "text-[#737373] hover:text-[#333]"
                                        }`}
                                >
                                    {tab.label}

                                    {activeTab === tab.key && (
                                        <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[#171717]" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 border-b border-[#e5e5e5] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <form
                            onSubmit={handleSearch}
                            className="relative w-full max-w-[360px]"
                        >
                            <Search
                                size={17}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#777]"
                            />

                            <input
                                type="text"
                                value={searchInput}
                                onChange={(event) =>
                                    setSearchInput(event.target.value)
                                }
                                placeholder="Search product, SKU or barcode"
                                className="h-[38px] w-full rounded-[10px] border border-[#d9d9d9] bg-white pl-10 pr-4 text-[13px] text-[#222] outline-none transition placeholder:text-[#8a8a8a] focus:border-[#b7b7b7] focus:ring-2 focus:ring-[#f3f3f3]"
                            />
                        </form>

                        <div className="flex items-center gap-3">
                            <select
                                value={locationId}
                                onChange={(event) =>
                                    setLocationId(event.target.value)
                                }
                                className="h-[38px] min-w-[180px] rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[13px] text-[#333] outline-none transition focus:border-[#b7b7b7]"
                            >
                                <option value="">
                                    All locations
                                </option>

                                {locations.map((location) => (
                                    <option
                                        key={location.id}
                                        value={location.id}
                                    >
                                        {location.name}
                                        {location.is_default
                                            ? " (Default)"
                                            : ""}
                                    </option>
                                ))}
                            </select>

                            <div className="whitespace-nowrap text-[13px] text-[#737373]">
                                {pagination.total}{" "}
                                {pagination.total === 1
                                    ? "item"
                                    : "items"}
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="m-5 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1250px] table-fixed border-collapse">
                            <colgroup>
                                <col className="w-[300px]" />
                                <col className="w-[165px]" />
                                <col className="w-[170px]" />
                                <col className="w-[130px]" />
                                <col className="w-[120px]" />
                                <col className="w-[120px]" />
                                <col className="w-[120px]" />
                                <col className="w-[145px]" />
                                <col className="w-[75px]" />
                            </colgroup>

                            <thead>
                                <tr className="h-[42px] border-b border-[#dedede] bg-[#fafafa] text-left">
                                    <TableHead>Product</TableHead>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Barcode</TableHead>
                                    <TableHead className="text-right">
                                        Unavailable
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Committed
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Available
                                    </TableHead>
                                    <TableHead className="text-right">
                                        On hand
                                    </TableHead>
                                    <TableHead>Status</TableHead>
                                    
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <LoadingRows />
                                ) : inventory.length === 0 ? (
                                    <EmptyState />
                                ) : (
                                    inventory.map((item) => (
                                        <InventoryRow
                                            key={getRowKey(item)}
                                            item={item}
                                            rowKey={getRowKey(item)}
                                            locationId={editableLocationId}
                                            menuButtonRefs={menuButtonRefs}
                                            toggleMenu={toggleMenu}
                                            onInventoryUpdated={handleInventoryUpdated}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading && pagination.total > 0 && (
                        <div className="flex items-center justify-between border-t border-[#dedede] bg-white px-5 py-3.5">
                            <div className="text-[12px] text-[#737373]">
                                Showing {pagination.from || 0}
                                {" - "}
                                {pagination.to || 0}
                                {" of "}
                                {pagination.total}
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={pagination.current_page <= 1}
                                    onClick={() =>
                                        fetchInventory(
                                            pagination.current_page - 1
                                        )
                                    }
                                    className="flex h-9 items-center gap-1.5 rounded-[9px] border border-[#d9d9d9] bg-white px-3 text-[12px] font-medium text-[#444] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    <ChevronLeft size={15} />
                                    Previous
                                </button>

                                <div className="flex h-9 min-w-[56px] items-center justify-center rounded-[9px] border border-[#e2e2e2] bg-white px-3 text-[12px] font-medium text-[#333]">
                                    {pagination.current_page}
                                    {" / "}
                                    {pagination.last_page}
                                </div>

                                <button
                                    type="button"
                                    disabled={
                                        pagination.current_page >=
                                        pagination.last_page
                                    }
                                    onClick={() =>
                                        fetchInventory(
                                            pagination.current_page + 1
                                        )
                                    }
                                    className="flex h-9 items-center gap-1.5 rounded-[9px] border border-[#d9d9d9] bg-white px-3 text-[12px] font-medium text-[#444] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                    <ChevronRight size={15} />
                                </button>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            {openMenuKey &&
                menuPosition &&
                selectedMenuItem &&
                createPortal(
                    <ActionMenu
                        item={selectedMenuItem}
                        position={menuPosition}
                        onView={handleViewProduct}
                        onClose={closeMenu}
                    />,
                    document.body
                )}
        </div>
    );
}

function StatsGrid({ stats }) {
    const cards = [
        {
            label: "Tracked SKUs",
            value: stats.tracked_skus || 0,
            icon: Boxes,
        },
        {
            label: "Low Stock SKUs",
            value: stats.low_stock_skus || 0,
            icon: TriangleAlert,
        },
        {
            label: "Out of Stock",
            value: stats.out_of_stock_skus || 0,
            icon: CircleOff,
        },
        {
            label: "On Hand Units",
            value: stats.on_hand_units || 0,
            icon: Package,
        },
        {
            label: "Active Locations",
            value: stats.active_locations || 0,
            icon: MapPin,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.label}
                        className="rounded-[16px] border border-[#dedede] bg-white px-5 py-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.035)]"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="text-[13px] font-medium text-[#737373]">
                                    {card.label}
                                </div>

                                <div className="mt-[5px] text-[24px] font-semibold leading-[30px] tracking-[-0.4px] text-[#171717]">
                                    {card.value}
                                </div>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#f3f3f3] text-[#555]">
                                <Icon size={18} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

function InventoryRow({
    item,
    rowKey,
    locationId,
    menuButtonRefs,
    toggleMenu,
    onInventoryUpdated,
}) {
    const [savedOnHand, setSavedOnHand] = useState(
        Number(item.on_hand || 0)
    );

    const [onHandInput, setOnHandInput] = useState(
        String(
            Number(item.on_hand || 0)
        )
    );

    const [savingOnHand, setSavingOnHand] =
        useState(false);

    const [onHandError, setOnHandError] =
        useState("");

    useEffect(() => {
        const nextValue =
            Number(item.on_hand || 0);

        setSavedOnHand(nextValue);
        setOnHandInput(
            String(nextValue)
        );
    }, [item.on_hand]);

    const productLabel = item.variant_name
        ? `${item.product_name} / ${item.variant_name}`
        : item.product_name;

    const parsedInput =
        Number(onHandInput);

    const draftOnHand =
        onHandInput !== "" &&
            Number.isInteger(parsedInput) &&
            parsedInput >= 0
            ? parsedInput
            : savedOnHand;

    const available = Math.max(
        0,
        draftOnHand -
        Number(item.committed || 0) -
        Number(item.unavailable || 0)
    );

    const saveOnHand = async () => {
        if (savingOnHand) {
            return;
        }

        if (!locationId) {
            setOnHandError(
                "Select a location before editing stock."
            );

            setOnHandInput(
                String(savedOnHand)
            );

            return;
        }

        if (
            onHandInput === "" ||
            !Number.isInteger(parsedInput) ||
            parsedInput < 0
        ) {
            setOnHandError(
                "On hand must be a whole number of 0 or more."
            );

            setOnHandInput(
                String(savedOnHand)
            );

            return;
        }

        if (parsedInput === savedOnHand) {
            setOnHandError("");
            return;
        }

        setSavingOnHand(true);
        setOnHandError("");

        try {
            const response = await api.post(
                "/admin/inventory/on-hand",
                {
                    location_id:
                        Number(locationId),

                    product_id:
                        item.product_id,

                    variant_id:
                        item.variant_id || null,

                    on_hand:
                        parsedInput,

                    note:
                        "Updated from inventory table",
                }
            );

            const updatedInventory =
                response.data?.inventory;

            const nextOnHand =
                Number(
                    updatedInventory?.on_hand ??
                    parsedInput
                );

            setSavedOnHand(nextOnHand);

            setOnHandInput(
                String(nextOnHand)
            );

            if (
                updatedInventory &&
                onInventoryUpdated
            ) {
                onInventoryUpdated(
                    item,
                    updatedInventory
                );
            }
        } catch (err) {
            console.error(
                "On hand update error:",
                err
            );

            setOnHandError(
                err.response?.data?.message ||
                "Unable to update on hand inventory."
            );

            setOnHandInput(
                String(savedOnHand)
            );
        } finally {
            setSavingOnHand(false);
        }
    };

    const handleOnHandKeyDown = (
        event
    ) => {
        if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
        }

        if (event.key === "Escape") {
            event.preventDefault();

            setOnHandInput(
                String(savedOnHand)
            );

            setOnHandError("");

            event.currentTarget.blur();
        }
    };

    return (
        <tr className="h-[62px] border-b border-[#e8e8e8] bg-white last:border-b-0 transition hover:bg-[#fcfcfc]">
            <td className="px-5 py-2.5 align-middle">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[8px] border border-[#e4e4e4] bg-[#f7f7f7]">
                        {item.image_url ? (
                            <img
                                src={item.image_url}
                                alt={
                                    item.product_name ||
                                    "Product"
                                }
                                className="h-full w-full object-contain p-[3px]"
                            />
                        ) : (
                            <Package
                                size={18}
                                className="text-[#aaa]"
                            />
                        )}
                    </div>

                    <div className="min-w-0">
                        <div className="truncate text-[13px] font-medium text-[#222]">
                            {productLabel}
                        </div>

                        <div className="mt-[2px] text-[11px] text-[#888]">
                            {item.locations_count || 0}{" "}
                            {(item.locations_count || 0) ===
                                1
                                ? "location"
                                : "locations"}
                        </div>
                    </div>
                </div>
            </td>

            <td className="px-5 py-2.5 align-middle">
                <span className="block truncate text-[13px] text-[#444]">
                    {item.sku || "—"}
                </span>
            </td>

            <td className="px-5 py-2.5 align-middle">
                <span className="block truncate text-[13px] text-[#555]">
                    {item.barcode || "—"}
                </span>
            </td>

            <NumberCell
                value={item.unavailable}
            />

            <NumberCell
                value={item.committed}
            />

            <AvailableCell
                value={available}
            />

            <OnHandCell
                value={onHandInput}
                disabled={!locationId}
                saving={savingOnHand}
                error={onHandError}
                onChange={setOnHandInput}
                onBlur={saveOnHand}
                onKeyDown={
                    handleOnHandKeyDown
                }
            />

            <td className="px-5 py-2.5 align-middle">
                <InventoryStatus
                    status={
                        getInventoryStatusFromValues(
                            available,
                            Number(
                                item.low_stock_threshold ||
                                10
                            ),
                            Boolean(
                                item.track_quantity
                            )
                        )
                    }
                />
            </td>

          
        </tr>
    );
}

function AvailableCell({ value }) {
    return (
        <td className="px-5 py-2.5 text-right align-middle">
            <div className="ml-auto flex h-[32px] w-[78px] items-center justify-center rounded-full border border-[#dedede] bg-white text-[13px] font-medium tabular-nums text-[#333]">
                {Number(value || 0)}
            </div>
        </td>
    );
}

function OnHandCell({
    value,
    disabled,
    saving,
    error,
    onChange,
    onBlur,
    onKeyDown,
}) {
    return (
        <td className="px-5 py-2.5 text-right align-middle">
            <div
                className="relative ml-auto w-[78px]"
                title={
                    disabled
                        ? "Select a location to edit on hand inventory."
                        : error || ""
                }
            >
                <input
                    type="number"
                    min="0"
                    step="1"
                    value={value}
                    disabled={
                        disabled ||
                        saving
                    }
                    onChange={(event) =>
                        onChange(
                            event.target.value
                        )
                    }
                    onBlur={onBlur}
                    onKeyDown={onKeyDown}
                    className={`h-[32px] w-full rounded-full border bg-white px-3 text-center text-[13px] font-medium tabular-nums text-[#333] outline-none transition ${error
                        ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50"
                        : "border-[#dedede] hover:border-[#c7c7c7] focus:border-[#9f9f9f] focus:ring-2 focus:ring-[#f1f1f1]"
                        } disabled:cursor-not-allowed disabled:bg-[#f7f7f7] disabled:text-[#999]`}
                />

                {saving && (
                    <div className="pointer-events-none absolute inset-y-0 right-[7px] flex items-center">
                        <LoaderCircle
                            size={13}
                            className="animate-spin text-[#777]"
                        />
                    </div>
                )}
            </div>
        </td>
    );
}

function NumberCell({ value, strong = false }) {
    return (
        <td className="px-5 py-2.5 text-right align-middle">
            <span
                className={`text-[13px] tabular-nums ${strong
                    ? "font-semibold text-[#171717]"
                    : "text-[#555]"
                    }`}
            >
                {Number(value || 0)}
            </span>
        </td>
    );
}

function getInventoryStatusFromValues(
    available,
    threshold,
    trackQuantity
) {
    if (!trackQuantity) {
        return "not_tracked";
    }

    if (available <= 0) {
        return "out_of_stock";
    }

    if (available <= threshold) {
        return "low_stock";
    }

    return "in_stock";
}

function getInventoryStatusFromRow(
    item
) {
    const available = Math.max(
        0,
        Number(item.on_hand || 0) -
        Number(item.committed || 0) -
        Number(item.unavailable || 0)
    );

    return getInventoryStatusFromValues(
        available,
        Number(
            item.low_stock_threshold || 10
        ),
        Boolean(
            item.track_quantity
        )
    );
}

function InventoryStatus({ status }) {
    const value = String(status || "").toLowerCase();

    let label = "Not tracked";
    let className =
        "border-[#d8d8d8] bg-[#f7f7f7] text-[#666]";

    if (value === "in_stock") {
        label = "In stock";
        className =
            "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (value === "low_stock") {
        label = "Low stock";
        className =
            "border-amber-200 bg-amber-50 text-amber-700";
    }

    if (value === "out_of_stock") {
        label = "Out of stock";
        className =
            "border-red-200 bg-red-50 text-red-700";
    }

    return (
        <span
            className={`inline-flex min-h-[24px] items-center whitespace-nowrap rounded-full border px-2.5 py-[3px] text-[11px] font-medium leading-none ${className}`}
        >
            {label}
        </span>
    );
}

function ActionMenu({
    item,
    position,
    onView,
    onClose,
}) {
    return (
        <>
            <div
                className="fixed inset-0 z-[9997]"
                onClick={onClose}
            />


        </>
    );
}

function TableHead({
    children,
    className = "",
}) {
    return (
        <th
            className={`whitespace-nowrap px-5 py-[10px] text-[11px] font-semibold uppercase tracking-[0.035em] text-[#666] ${className}`}
        >
            {children}
        </th>
    );
}

function LoadingRows() {
    return Array.from({
        length: 7,
    }).map((_, index) => (
        <tr
            key={index}
            className="h-[62px] border-b border-[#e8e8e8] last:border-b-0"
        >
            {Array.from({
                length: 9,
            }).map((__, cellIndex) => (
                <td
                    key={cellIndex}
                    className="px-5 py-3"
                >
                    <div className="h-4 animate-pulse rounded bg-[#f1f1f1]" />
                </td>
            ))}
        </tr>
    ));
}

function EmptyState() {
    return (
        <tr>
            <td
                colSpan="9"
                className="px-6 py-16 text-center"
            >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f3f3] text-[#777]">
                    <Boxes size={21} />
                </div>

                <h3 className="mt-4 text-[14px] font-semibold text-[#222]">
                    No inventory found
                </h3>

                <p className="mt-1 text-[13px] text-[#777]">
                    Inventory matching this filter will appear here.
                </p>
            </td>
        </tr>
    );
}
