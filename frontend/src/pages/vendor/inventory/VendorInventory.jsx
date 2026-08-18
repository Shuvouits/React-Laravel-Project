import {
    Boxes,
    ChevronLeft,
    ChevronRight,
    CircleOff,
    LoaderCircle,
    MapPin,
    Package,
    Search,
    TriangleAlert,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import api from "../../../api/axios";


const tabs = [
    {
        key: "all",
        label: "All",
    },
    {
        key: "in_stock",
        label: "In Stock",
    },
    {
        key: "low_stock",
        label: "Low Stock",
    },
    {
        key: "out_of_stock",
        label: "Out of Stock",
    },
];


const VendorInventory = () => {
    const [inventory, setInventory] =
        useState([]);

    const [stats, setStats] =
        useState({
            tracked_skus: 0,
            low_stock_skus: 0,
            out_of_stock_skus: 0,
            on_hand_units: 0,
            active_locations: 0,
        });

    const [locations, setLocations] =
        useState([]);

    const [pagination, setPagination] =
        useState({
            current_page: 1,
            last_page: 1,
            per_page: 15,
            total: 0,
            from: null,
            to: null,
        });

    const [activeTab, setActiveTab] =
        useState("all");

    const [locationId, setLocationId] =
        useState("");

    const [searchInput, setSearchInput] =
        useState("");

    const [search, setSearch] =
        useState("");

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");


    useEffect(() => {
        fetchInventory(1);
    }, [
        activeTab,
        locationId,
        search,
    ]);


    const fetchInventory = async (
        page = 1
    ) => {
        try {
            setLoading(true);
            setError("");

            const response =
                await api.get(
                    "/vendor/inventory",
                    {
                        params: {
                            tab:
                                activeTab,

                            location_id:
                                locationId ||
                                undefined,

                            search:
                                search ||
                                undefined,

                            page,

                            per_page: 15,
                        },
                    }
                );

            const data =
                response.data?.inventory;

            setInventory(
                data?.data ||
                []
            );

            setStats(
                response.data?.stats || {
                    tracked_skus: 0,
                    low_stock_skus: 0,
                    out_of_stock_skus: 0,
                    on_hand_units: 0,
                    active_locations: 0,
                }
            );

            setLocations(
                response.data?.locations ||
                []
            );

            setPagination({
                current_page:
                    data?.current_page ||
                    1,

                last_page:
                    data?.last_page ||
                    1,

                per_page:
                    data?.per_page ||
                    15,

                total:
                    data?.total ||
                    0,

                from:
                    data?.from ||
                    null,

                to:
                    data?.to ||
                    null,
            });

        } catch (error) {
            console.error(
                "Vendor inventory fetch error:",
                error
            );

            setError(
                error.response?.data?.message ||
                "Unable to load inventory."
            );

        } finally {
            setLoading(false);
        }
    };


    const handleSearch = (
        event
    ) => {
        event.preventDefault();

        setSearch(
            searchInput.trim()
        );
    };


    const handleTabChange = (
        tab
    ) => {
        setActiveTab(
            tab
        );
    };


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
            Number(
                updatedRow.on_hand ||
                0
            ) -
            Number(
                originalItem.on_hand ||
                0
            );


        setInventory(
            (current) =>
                current.map(
                    (row) => {
                        if (
                            getRowKey(row) !==
                            getRowKey(
                                originalItem
                            )
                        ) {
                            return row;
                        }

                        return updatedRow;
                    }
                )
        );


        setStats(
            (current) => {
                let lowStockSkus =
                    Number(
                        current
                            .low_stock_skus ||
                        0
                    );

                let outOfStockSkus =
                    Number(
                        current
                            .out_of_stock_skus ||
                        0
                    );


                if (
                    oldStatus ===
                        "low_stock" &&
                    newStatus !==
                        "low_stock"
                ) {
                    lowStockSkus =
                        Math.max(
                            0,
                            lowStockSkus -
                                1
                        );
                }


                if (
                    oldStatus !==
                        "low_stock" &&
                    newStatus ===
                        "low_stock"
                ) {
                    lowStockSkus += 1;
                }


                if (
                    oldStatus ===
                        "out_of_stock" &&
                    newStatus !==
                        "out_of_stock"
                ) {
                    outOfStockSkus =
                        Math.max(
                            0,
                            outOfStockSkus -
                                1
                        );
                }


                if (
                    oldStatus !==
                        "out_of_stock" &&
                    newStatus ===
                        "out_of_stock"
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
                                current
                                    .on_hand_units ||
                                0
                            ) +
                            onHandDifference
                        ),
                };
            }
        );
    };


    return (
        <div className="min-h-full bg-[#f6f7fb] px-6 py-6">
            <div className="mx-auto w-full max-w-[1600px]">

                <StatsGrid
                    stats={stats}
                />


                <section className="mt-5 overflow-hidden rounded-[15px] border border-[#dedfe3] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">

                    <div className="flex items-center justify-between px-5 py-[18px]">
                        <h1 className="text-[20px] font-semibold tracking-[-0.3px] text-[#171717]">
                            Inventory
                        </h1>

                        <button
                            type="button"
                            disabled
                            className="h-[36px] rounded-full border border-[#e2e2e2] bg-[#f8f8f8] px-4 text-[12px] font-medium text-[#999]"
                        >
                            Print barcode labels
                        </button>
                    </div>


                    <div className="mx-5 overflow-hidden rounded-[12px] border border-[#dedfe3]">

                        <div className="border-b border-[#e6e6e6] px-5">

                            <div className="flex items-center justify-between">

                                <div className="flex gap-6">

                                    {tabs.map(
                                        (tab) => (
                                            <button
                                                key={
                                                    tab.key
                                                }
                                                type="button"
                                                onClick={() =>
                                                    handleTabChange(
                                                        tab.key
                                                    )
                                                }
                                                className={`relative py-[15px] text-[13px] font-medium transition ${
                                                    activeTab ===
                                                    tab.key
                                                        ? "text-[#171717]"
                                                        : "text-[#737373] hover:text-[#333]"
                                                }`}
                                            >
                                                {
                                                    tab.label
                                                }

                                                {activeTab ===
                                                    tab.key && (
                                                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#171717]" />
                                                )}
                                            </button>
                                        )
                                    )}

                                </div>

                            </div>

                        </div>


                        <div className="flex flex-col gap-3 border-b border-[#e6e6e6] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">

                            <form
                                onSubmit={
                                    handleSearch
                                }
                                className="relative w-full max-w-[500px]"
                            >
                                <Search
                                    size={16}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888]"
                                />

                                <input
                                    type="text"
                                    value={
                                        searchInput
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setSearchInput(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Search products..."
                                    className="h-[38px] w-full rounded-[9px] border border-[#d9dce2] bg-white pl-9 pr-4 text-[13px] text-[#222] outline-none transition placeholder:text-[#888] focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10"
                                />
                            </form>


                            <div className="flex flex-wrap items-center gap-2">

                                <select
                                    value={
                                        locationId
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        setLocationId(
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    className="h-[36px] min-w-[150px] rounded-[9px] border border-[#dedfe3] bg-white px-3 text-[12px] text-[#444] outline-none"
                                >
                                    <option value="">
                                        All locations
                                    </option>

                                    {locations.map(
                                        (
                                            location
                                        ) => (
                                            <option
                                                key={
                                                    location.id
                                                }
                                                value={
                                                    location.id
                                                }
                                            >
                                                {
                                                    location.name
                                                }

                                                {location.is_default
                                                    ? " (Default)"
                                                    : ""}
                                            </option>
                                        )
                                    )}
                                </select>


                                <button
                                    type="button"
                                    className="h-[36px] rounded-[9px] border border-[#dedfe3] bg-white px-4 text-[12px] font-medium text-[#333] transition hover:bg-[#f8f8f8]"
                                >
                                    Import / Export
                                </button>


                                <button
                                    type="button"
                                    className="h-[36px] rounded-[9px] border border-[#dedfe3] bg-white px-4 text-[12px] font-medium text-[#333] transition hover:bg-[#f8f8f8]"
                                >
                                    Filter
                                </button>

                            </div>

                        </div>


                        {error && (
                            <div className="m-4 rounded-[9px] border border-red-200 bg-red-50 px-4 py-3 text-[12px] text-red-700">
                                {error}
                            </div>
                        )}


                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[1050px] table-fixed border-collapse">

                                <colgroup>
                                    <col className="w-[300px]" />
                                    <col className="w-[230px]" />
                                    <col className="w-[150px]" />
                                    <col className="w-[120px]" />
                                    <col className="w-[120px]" />
                                    <col className="w-[120px]" />
                                    <col className="w-[120px]" />
                                </colgroup>


                                <thead>
                                    <tr className="h-[44px] border-b border-[#e6e6e6] bg-white">

                                        <TableHead>
                                            Product
                                        </TableHead>

                                        <TableHead>
                                            SKU
                                        </TableHead>

                                        <TableHead>
                                            Barcode
                                        </TableHead>

                                        <TableHead className="text-center">
                                            Unavailable
                                        </TableHead>

                                        <TableHead className="text-center">
                                            Committed
                                        </TableHead>

                                        <TableHead className="text-center">
                                            Available
                                        </TableHead>

                                        <TableHead className="text-center">
                                            On hand
                                        </TableHead>

                                    </tr>
                                </thead>


                                <tbody>

                                    {loading ? (
                                        <LoadingRows />
                                    ) : inventory.length ===
                                      0 ? (
                                        <EmptyState />
                                    ) : (
                                        inventory.map(
                                            (
                                                item
                                            ) => (
                                                <InventoryRow
                                                    key={
                                                        getRowKey(
                                                            item
                                                        )
                                                    }
                                                    item={
                                                        item
                                                    }
                                                    locationId={
                                                        editableLocationId
                                                    }
                                                    onInventoryUpdated={
                                                        handleInventoryUpdated
                                                    }
                                                />
                                            )
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>


                        {!loading &&
                            pagination.total >
                                0 && (
                            <div className="flex items-center justify-between border-t border-[#e6e6e6] px-5 py-4">

                                <p className="text-[12px] text-[#737373]">
                                    Showing{" "}
                                    {pagination.from ||
                                        0}{" "}
                                    to{" "}
                                    {pagination.to ||
                                        0}{" "}
                                    of{" "}
                                    {
                                        pagination.total
                                    }{" "}
                                    results
                                </p>


                                <div className="flex items-center gap-2">

                                    <button
                                        type="button"
                                        disabled={
                                            pagination.current_page <=
                                            1
                                        }
                                        onClick={() =>
                                            fetchInventory(
                                                pagination.current_page -
                                                    1
                                            )
                                        }
                                        className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#dedfe3] bg-white text-[#555] transition hover:bg-[#f7f7f8] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft
                                            size={
                                                15
                                            }
                                        />
                                    </button>


                                    <div className="flex h-[34px] min-w-[34px] items-center justify-center rounded-full bg-[#2065D1] px-3 text-[12px] font-semibold text-white">
                                        {
                                            pagination.current_page
                                        }
                                    </div>


                                    <button
                                        type="button"
                                        disabled={
                                            pagination.current_page >=
                                            pagination.last_page
                                        }
                                        onClick={() =>
                                            fetchInventory(
                                                pagination.current_page +
                                                    1
                                            )
                                        }
                                        className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-[#dedfe3] bg-white text-[#555] transition hover:bg-[#f7f7f8] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronRight
                                            size={
                                                15
                                            }
                                        />
                                    </button>

                                </div>

                            </div>
                        )}

                    </div>


                    <div className="h-5" />

                </section>

            </div>
        </div>
    );
};


const StatsGrid = ({
    stats,
}) => {
    const cards = [
        {
            label:
                "Tracked SKUs",

            value:
                stats.tracked_skus ||
                0,

            description:
                "Product variants in your catalog",

            icon:
                Boxes,

            iconClass:
                "bg-[#e8f0ff] text-[#2065D1]",
        },

        {
            label:
                "Low stock",

            value:
                stats.low_stock_skus ||
                0,

            description:
                "SKUs with 10 or fewer units",

            icon:
                TriangleAlert,

            iconClass:
                "bg-[#fff3d4] text-[#d77c00]",
        },

        {
            label:
                "Out of stock",

            value:
                stats.out_of_stock_skus ||
                0,

            description:
                "SKUs currently unavailable",

            icon:
                CircleOff,

            iconClass:
                "bg-[#ffe7e9] text-[#e04455]",
        },

        {
            label:
                "On hand units",

            value:
                stats.on_hand_units ||
                0,

            description:
                "Total units across your products",

            icon:
                Package,

            iconClass:
                "bg-[#eee8ff] text-[#7446df]",
        },

        {
            label:
                "Locations",

            value:
                stats.active_locations ||
                0,

            description:
                "Active inventory locations",

            icon:
                MapPin,

            iconClass:
                "bg-[#def8fa] text-[#0899aa]",
        },
    ];


    return (
        <div className="grid overflow-hidden rounded-[15px] border border-[#dedfe3] bg-white lg:grid-cols-5">

            {cards.map(
                (card) => {
                    const Icon =
                        card.icon;

                    return (
                        <div
                            key={
                                card.label
                            }
                            className="min-h-[126px] border-b border-[#e5e5e5] px-5 py-[18px] last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0"
                        >
                            <div className="flex items-start justify-between gap-3">

                                <div>
                                    <p className="text-[13px] font-medium text-[#333]">
                                        {
                                            card.label
                                        }
                                    </p>

                                    <p className="mt-[6px] text-[24px] font-semibold leading-none tracking-[-0.5px] text-[#111]">
                                        {
                                            card.value
                                        }
                                    </p>

                                    <p className="mt-[10px] text-[12px] text-[#777]">
                                        {
                                            card.description
                                        }
                                    </p>
                                </div>


                                <div
                                    className={`flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full ${card.iconClass}`}
                                >
                                    <Icon
                                        size={
                                            18
                                        }
                                        strokeWidth={
                                            1.8
                                        }
                                    />
                                </div>

                            </div>
                        </div>
                    );
                }
            )}

        </div>
    );
};


const InventoryRow = ({
    item,
    locationId,
    onInventoryUpdated,
}) => {
    const [savedOnHand, setSavedOnHand] =
        useState(
            Number(
                item.on_hand ||
                0
            )
        );

    const [onHandInput, setOnHandInput] =
        useState(
            String(
                Number(
                    item.on_hand ||
                    0
                )
            )
        );

    const [savingOnHand, setSavingOnHand] =
        useState(false);

    const [onHandError, setOnHandError] =
        useState("");


    useEffect(() => {
        const nextValue =
            Number(
                item.on_hand ||
                0
            );

        setSavedOnHand(
            nextValue
        );

        setOnHandInput(
            String(
                nextValue
            )
        );
    }, [
        item.on_hand,
    ]);


    const productLabel =
        item.product_name ||
        "Product";

    const parsedInput =
        Number(
            onHandInput
        );

    const draftOnHand =
        onHandInput !== "" &&
        Number.isInteger(
            parsedInput
        ) &&
        parsedInput >= 0
            ? parsedInput
            : savedOnHand;

    const available =
        Math.max(
            0,
            draftOnHand -
                Number(
                    item.committed ||
                    0
                ) -
                Number(
                    item.unavailable ||
                    0
                )
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
                String(
                    savedOnHand
                )
            );

            return;
        }


        if (
            onHandInput === "" ||
            !Number.isInteger(
                parsedInput
            ) ||
            parsedInput < 0
        ) {
            setOnHandError(
                "On hand must be a whole number of 0 or more."
            );

            setOnHandInput(
                String(
                    savedOnHand
                )
            );

            return;
        }


        if (
            parsedInput ===
            savedOnHand
        ) {
            setOnHandError("");
            return;
        }


        try {
            setSavingOnHand(
                true
            );

            setOnHandError("");


            const response =
                await api.post(
                    "/vendor/inventory/on-hand",
                    {
                        location_id:
                            Number(
                                locationId
                            ),

                        product_id:
                            item.product_id,

                        variant_id:
                            item.variant_id ||
                            null,

                        on_hand:
                            parsedInput,

                        note:
                            "Updated from vendor inventory table",
                    }
                );


            const updatedInventory =
                response.data?.inventory;


            const nextOnHand =
                Number(
                    updatedInventory?.on_hand ??
                    parsedInput
                );


            setSavedOnHand(
                nextOnHand
            );

            setOnHandInput(
                String(
                    nextOnHand
                )
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

        } catch (error) {
            console.error(
                "Vendor on hand update error:",
                error
            );

            setOnHandError(
                error.response?.data?.message ||
                "Unable to update on hand inventory."
            );

            setOnHandInput(
                String(
                    savedOnHand
                )
            );

        } finally {
            setSavingOnHand(
                false
            );
        }
    };


    const handleOnHandKeyDown = (
        event
    ) => {
        if (
            event.key ===
            "Enter"
        ) {
            event.preventDefault();
            event.currentTarget.blur();
        }


        if (
            event.key ===
            "Escape"
        ) {
            event.preventDefault();

            setOnHandInput(
                String(
                    savedOnHand
                )
            );

            setOnHandError("");

            event.currentTarget.blur();
        }
    };


    return (
        <tr className="h-[68px] border-b border-[#e7e7e7] bg-white last:border-b-0 hover:bg-[#fcfcfc]">

            <td className="px-5 py-2.5 align-middle">

                <div className="flex min-w-0 items-center gap-3">

                    <div className="flex h-[44px] w-[44px] shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-[#f5f5f5]">

                        {item.image_url ? (
                            <img
                                src={
                                    item.image_url
                                }
                                alt={
                                    item.product_name ||
                                    "Product"
                                }
                                className="h-full w-full object-contain p-[3px]"
                            />
                        ) : (
                            <Package
                                size={
                                    18
                                }
                                className="text-[#aaa]"
                            />
                        )}

                    </div>


                    <div className="min-w-0">

                        <p className="truncate text-[13px] font-medium text-[#222]">
                            {
                                productLabel
                            }
                        </p>

                        {item.variant_name && (
                            <p className="mt-[2px] truncate text-[11px] text-[#777]">
                                {
                                    item.variant_name
                                }
                            </p>
                        )}

                    </div>

                </div>

            </td>


            <td className="px-5 py-2.5 align-middle">
                <span className="block truncate text-[12px] text-[#333]">
                    {item.sku ||
                        "—"}
                </span>
            </td>


            <td className="px-5 py-2.5 align-middle">
                <span className="block truncate text-[12px] text-[#555]">
                    {item.barcode ||
                        "—"}
                </span>
            </td>


            <NumberCell
                value={
                    item.unavailable
                }
            />


            <NumberCell
                value={
                    item.committed
                }
            />


            <AvailableCell
                value={
                    available
                }
            />


            <OnHandCell
                value={
                    onHandInput
                }

                disabled={
                    !locationId
                }

                saving={
                    savingOnHand
                }

                error={
                    onHandError
                }

                onChange={
                    setOnHandInput
                }

                onBlur={
                    saveOnHand
                }

                onKeyDown={
                    handleOnHandKeyDown
                }
            />

        </tr>
    );
};


const NumberCell = ({
    value,
}) => {
    return (
        <td className="px-5 py-2.5 text-center align-middle">
            <span className="text-[12px] tabular-nums text-[#666]">
                {Number(
                    value ||
                    0
                )}
            </span>
        </td>
    );
};


const AvailableCell = ({
    value,
}) => {
    return (
        <td className="px-5 py-2.5 text-center align-middle">

            <div className="mx-auto flex h-[32px] w-[78px] items-center justify-center rounded-full border border-[#dedfe3] bg-white text-[12px] font-medium tabular-nums text-[#333]">
                {Number(
                    value ||
                    0
                )}
            </div>

        </td>
    );
};


const OnHandCell = ({
    value,
    disabled,
    saving,
    error,
    onChange,
    onBlur,
    onKeyDown,
}) => {
    return (
        <td className="px-5 py-2.5 text-center align-middle">

            <div
                className="relative mx-auto w-[78px]"
                title={
                    disabled
                        ? "Select a location before editing stock."
                        : error ||
                          ""
                }
            >

                <input
                    type="number"
                    min="0"
                    step="1"
                    value={
                        value
                    }
                    disabled={
                        disabled ||
                        saving
                    }
                    onChange={(
                        event
                    ) =>
                        onChange(
                            event.target.value
                        )
                    }
                    onBlur={
                        onBlur
                    }
                    onKeyDown={
                        onKeyDown
                    }
                    className={`h-[32px] w-full rounded-full border bg-white px-3 text-center text-[12px] font-medium tabular-nums text-[#333] outline-none transition ${
                        error
                            ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-50"
                            : "border-[#dedfe3] hover:border-[#c7c7c7] focus:border-[#9f9f9f] focus:ring-2 focus:ring-[#f1f1f1]"
                    } disabled:cursor-not-allowed disabled:bg-[#f7f7f7] disabled:text-[#999]`}
                />


                {saving && (
                    <div className="pointer-events-none absolute inset-y-0 right-[7px] flex items-center">

                        <LoaderCircle
                            size={
                                12
                            }
                            className="animate-spin text-[#777]"
                        />

                    </div>
                )}

            </div>

        </td>
    );
};


const TableHead = ({
    children,
    className = "",
}) => {
    return (
        <th
            className={`whitespace-nowrap px-5 py-[10px] text-left text-[12px] font-medium text-[#666] ${className}`}
        >
            {children}
        </th>
    );
};


const LoadingRows = () => {
    return Array.from({
        length: 7,
    }).map(
        (_, index) => (
            <tr
                key={
                    index
                }
                className="h-[68px] border-b border-[#e8e8e8]"
            >
                {Array.from({
                    length: 7,
                }).map(
                    (
                        __,
                        cellIndex
                    ) => (
                        <td
                            key={
                                cellIndex
                            }
                            className="px-5 py-3"
                        >
                            <div className="h-4 animate-pulse rounded bg-[#f1f1f1]" />
                        </td>
                    )
                )}
            </tr>
        )
    );
};


const EmptyState = () => {
    return (
        <tr>
            <td
                colSpan="7"
                className="px-6 py-16 text-center"
            >

                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f3f3] text-[#777]">
                    <Boxes
                        size={
                            21
                        }
                    />
                </div>

                <h3 className="mt-4 text-[14px] font-semibold text-[#222]">
                    No inventory found
                </h3>

                <p className="mt-1 text-[12px] text-[#777]">
                    Inventory for your products will appear here.
                </p>

            </td>
        </tr>
    );
};


const getRowKey = (
    item
) => {
    return `${item.product_id}-${item.variant_id || "product"}`;
};


const getInventoryStatusFromValues = (
    available,
    threshold,
    trackQuantity
) => {
    if (!trackQuantity) {
        return "not_tracked";
    }

    if (available <= 0) {
        return "out_of_stock";
    }

    if (
        available <=
        threshold
    ) {
        return "low_stock";
    }

    return "in_stock";
};


const getInventoryStatusFromRow = (
    item
) => {
    const available =
        Math.max(
            0,
            Number(
                item.on_hand ||
                0
            ) -
                Number(
                    item.committed ||
                    0
                ) -
                Number(
                    item.unavailable ||
                    0
                )
        );

    return getInventoryStatusFromValues(
        available,

        Number(
            item.low_stock_threshold ||
            10
        ),

        Boolean(
            item.track_quantity
        )
    );
};


export default VendorInventory;