import {
    ArrowUp,
    ArrowUpDown,
    Check,
    ChevronLeft,
    ChevronRight,
    List,
    LoaderCircle,
    MapPin,
    MapPinned,
    MoreHorizontal,
    Pencil,
    Plus,
    Search,
    X,
} from "lucide-react";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    createPortal,
} from "react-dom";

import api from "../../../api/axios";

const emptyForm = {
    name: "",
    address: "",
    pickup_enabled: false,
    shipping_enabled: true,
    is_default: false,
};

const VendorLocations = () => {
    const menuButtonRefs = useRef({});

    const [locations, setLocations] = useState([]);

    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        inactive: 0,
    });

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        from: null,
        to: null,
    });

    const [activeTab, setActiveTab] = useState("all");

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [searchOpen, setSearchOpen] = useState(false);

    const [sortDirection, setSortDirection] = useState("asc");

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null);

    const [formModal, setFormModal] = useState({
        open: false,
        mode: "create",
        item: null,
    });

    const [form, setForm] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});

    useEffect(() => {
        fetchLocations(1);
    }, [activeTab, search]);

    useEffect(() => {
        const closeMenu = () => {
            setOpenMenuId(null);
            setMenuPosition(null);
        };

        window.addEventListener(
            "scroll",
            closeMenu,
            true
        );

        window.addEventListener(
            "resize",
            closeMenu
        );

        return () => {
            window.removeEventListener(
                "scroll",
                closeMenu,
                true
            );

            window.removeEventListener(
                "resize",
                closeMenu
            );
        };
    }, []);

    const fetchLocations = async (page = 1) => {
        setLoading(true);
        setMessage("");

        try {
            const response = await api.get(
                "/vendor/inventory/locations",
                {
                    params: {
                        tab: activeTab,
                        search,
                        page,
                        per_page: 15,
                    },
                }
            );

            const data =
                response.data?.locations;

            setLocations(
                data?.data || []
            );

            setStats(
                response.data?.tab_counts ||
                response.data?.stats || {
                    total: 0,
                    active: 0,
                    inactive: 0,
                }
            );

            setPagination({
                current_page:
                    data?.current_page || 1,

                last_page:
                    data?.last_page || 1,

                total:
                    data?.total || 0,

                from:
                    data?.from || null,

                to:
                    data?.to || null,
            });
        } catch (error) {
            setMessageType("error");

            setMessage(
                error.response?.data?.message ||
                "Unable to load locations."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (event) => {
        event.preventDefault();

        setSearch(
            searchInput.trim()
        );
    };

    const clearSearch = () => {
        setSearchInput("");
        setSearch("");
        setSearchOpen(false);
    };

    const openCreateModal = () => {
        setForm({
            ...emptyForm,
        });

        setFormErrors({});

        setFormModal({
            open: true,
            mode: "create",
            item: null,
        });
    };

    const openEditModal = (item) => {
        setOpenMenuId(null);
        setMenuPosition(null);

        setForm({
            name:
                item.name || "",

            address:
                item.address_line1 ||
                item.address ||
                "",

            pickup_enabled:
                Boolean(
                    item.pickup_enabled
                ),

            shipping_enabled:
                Boolean(
                    item.shipping_enabled
                ),

            is_default:
                Boolean(
                    item.is_default
                ),
        });

        setFormErrors({});

        setFormModal({
            open: true,
            mode: "edit",
            item,
        });
    };

    const closeFormModal = () => {
        if (actionLoading) {
            return;
        }

        setFormModal({
            open: false,
            mode: "create",
            item: null,
        });

        setForm({
            ...emptyForm,
        });

        setFormErrors({});
    };

    const updateForm = (
        field,
        value
    ) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setFormErrors((current) => ({
            ...current,
            [field]: null,
        }));
    };

    const handleSaveLocation = async () => {
        setActionLoading(true);
        setFormErrors({});
        setMessage("");

        try {
            const payload = {
                name:
                    form.name.trim(),

                address:
                    form.address.trim(),

                pickup_enabled:
                    form.pickup_enabled,

                shipping_enabled:
                    form.shipping_enabled,

                is_default:
                    form.is_default,
            };

            let response;

            if (
                formModal.mode === "edit" &&
                formModal.item
            ) {
                response = await api.put(
                    `/vendor/inventory/locations/${formModal.item.id}`,
                    payload
                );
            } else {
                response = await api.post(
                    "/vendor/inventory/locations",
                    payload
                );
            }

            setMessageType("success");

            setMessage(
                response.data?.message ||
                (
                    formModal.mode === "edit"
                        ? "Location updated successfully."
                        : "Location added successfully."
                )
            );

            closeFormModal();

            await fetchLocations(
                pagination.current_page
            );
        } catch (error) {
            if (
                error.response?.status === 422 &&
                error.response?.data?.errors
            ) {
                setFormErrors(
                    error.response.data.errors
                );

                return;
            }

            setMessageType("error");

            setMessage(
                error.response?.data?.message ||
                "Unable to save location."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (
        item
    ) => {
        setOpenMenuId(null);
        setMenuPosition(null);

        setActionLoading(true);
        setMessage("");

        try {
            const response = await api.post(
                `/vendor/inventory/locations/${item.id}/toggle-status`
            );

            setMessageType("success");

            setMessage(
                response.data?.message ||
                (
                    item.is_active
                        ? "Location deactivated."
                        : "Location activated."
                )
            );

            await fetchLocations(
                pagination.current_page
            );
        } catch (error) {
            setMessageType("error");

            setMessage(
                error.response?.data?.message ||
                "Unable to update location status."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleShipSooner = async (
        item
    ) => {
        setOpenMenuId(null);
        setMenuPosition(null);

        setActionLoading(true);
        setMessage("");

        try {
            const response = await api.post(
                `/vendor/inventory/locations/${item.id}/ship-sooner`
            );

            setMessageType("success");

            setMessage(
                response.data?.message ||
                "Shipping priority updated."
            );

            await fetchLocations(
                pagination.current_page
            );
        } catch (error) {
            setMessageType("error");

            setMessage(
                error.response?.data?.message ||
                "Unable to update shipping priority."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const toggleMenu = (
        item
    ) => {
        if (
            openMenuId === item.id
        ) {
            setOpenMenuId(null);
            setMenuPosition(null);

            return;
        }

        const button =
            menuButtonRefs.current[
                item.id
            ];

        if (!button) {
            return;
        }

        const rect =
            button.getBoundingClientRect();

        const menuWidth = 205;

        let left =
            rect.right -
            menuWidth;

        if (left < 12) {
            left = 12;
        }

        setMenuPosition({
            top:
                rect.bottom + 7,

            left,
        });

        setOpenMenuId(
            item.id
        );
    };

    const sortedLocations = [
        ...locations,
    ].sort(
        (a, b) => {
            const first =
                String(
                    a.name || ""
                ).toLowerCase();

            const second =
                String(
                    b.name || ""
                ).toLowerCase();

            if (
                sortDirection === "asc"
            ) {
                return first.localeCompare(
                    second
                );
            }

            return second.localeCompare(
                first
            );
        }
    );

    const selectedMenuItem =
        locations.find(
            (item) =>
                item.id ===
                openMenuId
        ) || null;

    return (
        <div className="min-h-full bg-[#f7f7f8] p-[22px]">
            <div className="mx-auto w-full max-w-[1500px]">
                {message && (
                    <div
                        className={`mb-4 flex items-center justify-between rounded-[10px] border px-4 py-3 text-[13px] ${
                            messageType === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                        }`}
                    >
                        <span>
                            {message}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                setMessage("")
                            }
                        >
                            <X size={15} />
                        </button>
                    </div>
                )}

                <div className="overflow-hidden rounded-[15px] border border-[#e1e3e7] bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                    <div className="flex flex-col gap-4 border-b border-[#ececef] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-[#f1f5ff] text-[#2463eb]">
                                <MapPinned
                                    size={18}
                                    strokeWidth={2}
                                />
                            </div>

                            <h1 className="text-[18px] font-semibold tracking-[-0.02em] text-[#202124]">
                                Locations
                            </h1>
                        </div>

                        <button
                            type="button"
                            onClick={
                                openCreateModal
                            }
                            className="flex h-[40px] items-center justify-center gap-2 rounded-[9px] bg-[#2563eb] px-4 text-[13px] font-semibold text-white transition hover:bg-[#1d56cc]"
                        >
                            <Plus
                                size={16}
                                strokeWidth={2.2}
                            />

                            Add Location
                        </button>
                    </div>

                    <div className="flex flex-col gap-4 border-b border-[#ececef] px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-2">
                            <TabButton
                                active={
                                    activeTab ===
                                    "all"
                                }
                                label="All"
                                count={
                                    stats.total ||
                                    stats.all ||
                                    0
                                }
                                onClick={() =>
                                    setActiveTab(
                                        "all"
                                    )
                                }
                            />

                            <TabButton
                                active={
                                    activeTab ===
                                    "active"
                                }
                                label="Active"
                                count={
                                    stats.active ||
                                    0
                                }
                                onClick={() =>
                                    setActiveTab(
                                        "active"
                                    )
                                }
                            />

                            <TabButton
                                active={
                                    activeTab ===
                                    "inactive"
                                }
                                label="Inactive"
                                count={
                                    stats.inactive ||
                                    0
                                }
                                onClick={() =>
                                    setActiveTab(
                                        "inactive"
                                    )
                                }
                            />
                        </div>

                        <div className="flex items-center justify-end gap-2">
                            {searchOpen && (
                                <form
                                    onSubmit={
                                        handleSearchSubmit
                                    }
                                    className="relative"
                                >
                                    <Search
                                        size={15}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a8a]"
                                    />

                                    <input
                                        autoFocus
                                        type="text"
                                        value={
                                            searchInput
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            setSearchInput(
                                                event.target.value
                                            )
                                        }
                                        placeholder="Search locations"
                                        className="h-[36px] w-[210px] rounded-[8px] border border-[#dfe1e5] bg-white pl-9 pr-8 text-[13px] text-[#333] outline-none transition focus:border-[#aeb4c0] focus:ring-2 focus:ring-[#eef2ff]"
                                    />

                                    <button
                                        type="button"
                                        onClick={
                                            clearSearch
                                        }
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8b8b8b]"
                                    >
                                        <X
                                            size={
                                                14
                                            }
                                        />
                                    </button>
                                </form>
                            )}

                            {!searchOpen && (
                                <ToolbarButton
                                    title="Search"
                                    onClick={() =>
                                        setSearchOpen(
                                            true
                                        )
                                    }
                                >
                                    <Search
                                        size={
                                            17
                                        }
                                    />
                                </ToolbarButton>
                            )}

                            <ToolbarButton
                                title="List view"
                                onClick={() => {}}
                            >
                                <List
                                    size={
                                        17
                                    }
                                />
                            </ToolbarButton>

                            <ToolbarButton
                                title="Sort"
                                onClick={() =>
                                    setSortDirection(
                                        (
                                            current
                                        ) =>
                                            current ===
                                            "asc"
                                                ? "desc"
                                                : "asc"
                                    )
                                }
                            >
                                <ArrowUpDown
                                    size={
                                        17
                                    }
                                />
                            </ToolbarButton>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px] border-collapse">
                            <thead>
                                <tr className="border-b border-[#ececef] bg-[#fafafa]">
                                    <th className="w-[42%] px-6 py-[13px] text-left text-[12px] font-medium text-[#707070]">
                                        Name
                                    </th>

                                    <th className="w-[30%] px-5 py-[13px] text-left text-[12px] font-medium text-[#707070]">
                                        Dispatch
                                    </th>

                                    <th className="w-[18%] px-5 py-[13px] text-left text-[12px] font-medium text-[#707070]">
                                        Status
                                    </th>

                                    <th className="w-[10%] px-6 py-[13px] text-right text-[12px] font-medium text-[#707070]">
                                        Actions
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <LoadingRows />
                                ) : sortedLocations.length ===
                                  0 ? (
                                    <EmptyState
                                        onAdd={
                                            openCreateModal
                                        }
                                    />
                                ) : (
                                    sortedLocations.map(
                                        (item) => (
                                            <LocationRow
                                                key={
                                                    item.id
                                                }
                                                item={
                                                    item
                                                }
                                                buttonRef={(
                                                    element
                                                ) => {
                                                    menuButtonRefs.current[
                                                        item.id
                                                    ] =
                                                        element;
                                                }}
                                                onMenu={() =>
                                                    toggleMenu(
                                                        item
                                                    )
                                                }
                                            />
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>

                    {!loading &&
                        pagination.last_page >
                            1 && (
                            <div className="flex items-center justify-between border-t border-[#ececef] px-6 py-4">
                                <p className="text-[12px] text-[#777]">
                                    Showing{" "}
                                    {pagination.from ||
                                        0}
                                    {" - "}
                                    {pagination.to ||
                                        0}
                                    {" of "}
                                    {pagination.total}
                                </p>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        disabled={
                                            pagination.current_page <=
                                            1
                                        }
                                        onClick={() =>
                                            fetchLocations(
                                                pagination.current_page -
                                                    1
                                            )
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#dedfe3] bg-white text-[#555] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft
                                            size={
                                                16
                                            }
                                        />
                                    </button>

                                    <span className="text-[12px] text-[#666]">
                                        {
                                            pagination.current_page
                                        }{" "}
                                        /{" "}
                                        {
                                            pagination.last_page
                                        }
                                    </span>

                                    <button
                                        type="button"
                                        disabled={
                                            pagination.current_page >=
                                            pagination.last_page
                                        }
                                        onClick={() =>
                                            fetchLocations(
                                                pagination.current_page +
                                                    1
                                            )
                                        }
                                        className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#dedfe3] bg-white text-[#555] hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronRight
                                            size={
                                                16
                                            }
                                        />
                                    </button>
                                </div>
                            </div>
                        )}
                </div>
            </div>

            {openMenuId &&
                menuPosition &&
                selectedMenuItem &&
                createPortal(
                    <LocationMenu
                        item={
                            selectedMenuItem
                        }
                        position={
                            menuPosition
                        }
                        onEdit={() =>
                            openEditModal(
                                selectedMenuItem
                            )
                        }
                        onShipSooner={() =>
                            handleShipSooner(
                                selectedMenuItem
                            )
                        }
                        onToggleStatus={() =>
                            handleToggleStatus(
                                selectedMenuItem
                            )
                        }
                    />,
                    document.body
                )}

            {formModal.open && (
                <LocationFormModal
                    mode={
                        formModal.mode
                    }
                    item={
                        formModal.item
                    }
                    form={
                        form
                    }
                    errors={
                        formErrors
                    }
                    saving={
                        actionLoading
                    }
                    onChange={
                        updateForm
                    }
                    onClose={
                        closeFormModal
                    }
                    onSave={
                        handleSaveLocation
                    }
                />
            )}
        </div>
    );
};

const TabButton = ({
    active,
    label,
    count,
    onClick,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`flex h-[34px] items-center gap-2 rounded-[8px] px-3 text-[13px] font-medium transition ${
                active
                    ? "bg-[#eef3ff] text-[#245fda]"
                    : "text-[#5f6368] hover:bg-[#f5f5f5]"
            }`}
        >
            <span>
                {label}
            </span>

            <span
                className={`rounded-full px-[7px] py-[1px] text-[11px] ${
                    active
                        ? "bg-white text-[#245fda]"
                        : "bg-[#f0f0f1] text-[#777]"
                }`}
            >
                {count}
            </span>
        </button>
    );
};

const ToolbarButton = ({
    title,
    children,
    onClick,
}) => {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            className="flex h-[36px] w-[36px] items-center justify-center rounded-[8px] border border-[#e0e1e4] bg-white text-[#636363] transition hover:bg-[#f7f7f8]"
        >
            {children}
        </button>
    );
};

const LocationRow = ({
    item,
    buttonRef,
    onMenu,
}) => {
    const locationSubtitle =
        item.city ||
        item.address_line1 ||
        item.state ||
        item.country ||
        "";

    const shippingNumber =
        Number(
            item.shipping_priority ||
            0
        ) + 1;

    return (
        <tr className="border-b border-[#efeff1] last:border-b-0 hover:bg-[#fcfcfd]">
            <td className="px-6 py-[15px]">
                <div className="flex items-center gap-3">
                    <div className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[#f1f3f4] text-[#666]">
                        <MapPin
                            size={17}
                            strokeWidth={2}
                        />
                    </div>

                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[13px] font-semibold text-[#282828]">
                                {item.name}
                            </span>

                            {item.is_default && (
                                <span className="rounded-[5px] bg-[#eef0f3] px-2 py-[2px] text-[10px] font-medium text-[#555]">
                                    Default
                                </span>
                            )}
                        </div>

                        {locationSubtitle && (
                            <p className="mt-[3px] max-w-[300px] truncate text-[12px] text-[#888]">
                                {
                                    locationSubtitle
                                }
                            </p>
                        )}
                    </div>
                </div>
            </td>

            <td className="px-5 py-[15px]">
                <div className="flex flex-wrap items-center gap-2">
                    {item.shipping_enabled && (
                        <span className="inline-flex items-center rounded-[6px] bg-[#f1f3f5] px-[9px] py-[5px] text-[11px] font-medium text-[#565656]">
                            Ships #
                            {shippingNumber}
                        </span>
                    )}

                    {item.pickup_enabled && (
                        <span className="inline-flex items-center rounded-[6px] bg-[#f1f3f5] px-[9px] py-[5px] text-[11px] font-medium text-[#565656]">
                            Pickup
                        </span>
                    )}

                    {!item.shipping_enabled &&
                        !item.pickup_enabled && (
                            <span className="text-[12px] text-[#999]">
                                No dispatch
                            </span>
                        )}
                </div>
            </td>

            <td className="px-5 py-[15px]">
                <span
                    className={`inline-flex items-center gap-[6px] rounded-full px-[9px] py-[4px] text-[11px] font-medium ${
                        item.is_active
                            ? "bg-[#eaf1ff] text-[#2864d7]"
                            : "bg-[#f1f1f1] text-[#777]"
                    }`}
                >
                    <span
                        className={`h-[6px] w-[6px] rounded-full ${
                            item.is_active
                                ? "bg-[#3974df]"
                                : "bg-[#999]"
                        }`}
                    />

                    {item.is_active
                        ? "Active"
                        : "Inactive"}
                </span>
            </td>

            <td className="px-6 py-[15px] text-right">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={onMenu}
                    className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-[7px] text-[#666] transition hover:bg-[#f0f0f1]"
                >
                    <MoreHorizontal
                        size={18}
                    />
                </button>
            </td>
        </tr>
    );
};

const LocationMenu = ({
    item,
    position,
    onEdit,
    onShipSooner,
    onToggleStatus,
}) => {
    const canShipSooner =
        item.is_active &&
        item.shipping_enabled;

    return (
        <div
            className="fixed z-[9999] w-[205px] overflow-hidden rounded-[10px] border border-[#e3e3e5] bg-white py-[6px] shadow-[0_8px_30px_rgba(0,0,0,0.13)]"
            style={{
                top:
                    position.top,

                left:
                    position.left,
            }}
        >
            <button
                type="button"
                onClick={onEdit}
                className="flex w-full items-center gap-3 px-[13px] py-[10px] text-left text-[13px] text-[#333] transition hover:bg-[#f6f6f7]"
            >
                <Pencil
                    size={15}
                    className="text-[#666]"
                />

                Edit
            </button>

            <button
                type="button"
                disabled={!canShipSooner}
                onClick={
                    onShipSooner
                }
                className="flex w-full items-start gap-3 px-[13px] py-[10px] text-left text-[13px] text-[#333] transition hover:bg-[#f6f6f7] disabled:cursor-not-allowed disabled:opacity-40"
            >
                <ArrowUp
                    size={15}
                    className="mt-[1px] shrink-0 text-[#666]"
                />

                <span className="leading-[17px]">
                    Ship from here
                    sooner
                </span>
            </button>

            <div className="my-[5px] border-t border-[#eeeeef]" />

            <button
                type="button"
                onClick={
                    onToggleStatus
                }
                className="flex w-full items-center gap-3 px-[13px] py-[10px] text-left text-[13px] text-[#333] transition hover:bg-[#f6f6f7]"
            >
                <Check
                    size={15}
                    className="text-[#666]"
                />

                {item.is_active
                    ? "Deactivate"
                    : "Activate"}
            </button>
        </div>
    );
};

const LocationFormModal = ({
    mode,
    item,
    form,
    errors,
    saving,
    onChange,
    onClose,
    onSave,
}) => {
    const isEdit =
        mode === "edit";

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 px-4 py-6">
            <div className="w-full max-w-[470px] overflow-hidden rounded-[14px] bg-white shadow-[0_20px_70px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between px-6 pb-4 pt-6">
                    <div>
                        <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-[#202124]">
                            {isEdit
                                ? "Edit Location"
                                : "Add Location"}
                        </h2>

                        <p className="mt-[5px] max-w-[380px] text-[12px] leading-[18px] text-[#7a7a7a]">
                            {isEdit
                                ? "Update this warehouse, shop, or collection point."
                                : "Add a warehouse, shop, or collection point for your store"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-8 w-8 items-center justify-center rounded-[7px] text-[#777] transition hover:bg-[#f3f3f4]"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-6 pb-5">
                    <div>
                        <label className="mb-[7px] block text-[12px] font-medium text-[#444]">
                            Name
                        </label>

                        <input
                            type="text"
                            value={
                                form.name
                            }
                            onChange={(
                                event
                            ) =>
                                onChange(
                                    "name",
                                    event.target.value
                                )
                            }
                            placeholder="e.g. Main Store"
                            className={`h-[42px] w-full rounded-[8px] border bg-white px-3 text-[13px] text-[#333] outline-none transition ${
                                errors.name
                                    ? "border-red-400"
                                    : "border-[#dcdfe3] focus:border-[#9da7ba] focus:ring-2 focus:ring-[#eef2ff]"
                            }`}
                        />

                        <FieldError
                            error={
                                errors.name
                            }
                        />
                    </div>

                    <div className="mt-4">
                        <label className="mb-[7px] block text-[12px] font-medium text-[#444]">
                            Address
                        </label>

                        <textarea
                            rows="3"
                            value={
                                form.address
                            }
                            onChange={(
                                event
                            ) =>
                                onChange(
                                    "address",
                                    event.target.value
                                )
                            }
                            placeholder="Enter the location address"
                            className={`w-full resize-none rounded-[8px] border bg-white px-3 py-[10px] text-[13px] leading-[19px] text-[#333] outline-none transition ${
                                errors.address
                                    ? "border-red-400"
                                    : "border-[#dcdfe3] focus:border-[#9da7ba] focus:ring-2 focus:ring-[#eef2ff]"
                            }`}
                        />

                        <FieldError
                            error={
                                errors.address
                            }
                        />
                    </div>

                    <div className="mt-5 rounded-[10px] border border-[#e4e5e8]">
                        <ToggleSetting
                            label="Customers can collect here"
                            description="Off for a warehouse. On for a shop the public can walk into."
                            checked={
                                form.pickup_enabled
                            }
                            onChange={() =>
                                onChange(
                                    "pickup_enabled",
                                    !form.pickup_enabled
                                )
                            }
                        />

                        <div className="mx-4 border-t border-[#eeeeef]" />

                        <ToggleSetting
                            label="Ship online orders from here"
                            description="Off for a counter that only hands over what is brought to it. Delivery orders draw stock from the first branch in your list that has it."
                            checked={
                                form.shipping_enabled
                            }
                            onChange={() =>
                                onChange(
                                    "shipping_enabled",
                                    !form.shipping_enabled
                                )
                            }
                        />
                    </div>

                    <div className="mt-4 rounded-[10px] border border-[#e4e5e8]">
                        <ToggleSetting
                            label="Default Location"
                            description="New POS orders will use this location by default"
                            checked={
                                form.is_default
                            }
                            disabled={
                                Boolean(
                                    isEdit &&
                                    item?.is_default
                                )
                            }
                            onChange={() =>
                                onChange(
                                    "is_default",
                                    !form.is_default
                                )
                            }
                        />
                    </div>

                    {isEdit &&
                        item?.is_default && (
                            <p className="mt-2 text-[11px] leading-[17px] text-[#888]">
                                To change the default,
                                set another location as
                                default first.
                            </p>
                        )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-[#ececef] px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="h-[40px] rounded-[8px] border border-[#d9dce1] bg-white px-5 text-[13px] font-semibold text-[#444] transition hover:bg-[#f8f8f8] disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onSave}
                        disabled={
                            saving ||
                            !form.name.trim()
                        }
                        className="flex h-[40px] min-w-[112px] items-center justify-center gap-2 rounded-[8px] bg-[#2563eb] px-5 text-[13px] font-semibold text-white transition hover:bg-[#1d56cc] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {saving && (
                            <LoaderCircle
                                size={15}
                                className="animate-spin"
                            />
                        )}

                        {saving
                            ? "Saving..."
                            : isEdit
                              ? "Save Changes"
                              : "Add Location"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

const ToggleSetting = ({
    label,
    description,
    checked,
    disabled = false,
    onChange,
}) => {
    return (
        <div className="flex items-start justify-between gap-5 px-4 py-4">
            <div>
                <p className="text-[13px] font-medium text-[#313131]">
                    {label}
                </p>

                <p className="mt-[4px] max-w-[340px] text-[11px] leading-[17px] text-[#7d7d7d]">
                    {description}
                </p>
            </div>

            <button
                type="button"
                disabled={disabled}
                onClick={onChange}
                className={`relative mt-[2px] h-[22px] w-[39px] shrink-0 rounded-full transition ${
                    checked
                        ? "bg-[#2563eb]"
                        : "bg-[#d4d6da]"
                } ${
                    disabled
                        ? "cursor-not-allowed opacity-50"
                        : ""
                }`}
            >
                <span
                    className={`absolute top-[3px] h-[16px] w-[16px] rounded-full bg-white shadow-sm transition ${
                        checked
                            ? "left-[20px]"
                            : "left-[3px]"
                    }`}
                />
            </button>
        </div>
    );
};

const FieldError = ({
    error,
}) => {
    if (!error) {
        return null;
    }

    const message =
        Array.isArray(error)
            ? error[0]
            : error;

    return (
        <p className="mt-[5px] text-[11px] text-red-500">
            {message}
        </p>
    );
};

const LoadingRows = () => {
    return Array.from({
        length: 3,
    }).map((_, index) => (
        <tr
            key={index}
            className="border-b border-[#efeff1]"
        >
            <td className="px-6 py-5">
                <div className="flex animate-pulse items-center gap-3">
                    <div className="h-[38px] w-[38px] rounded-full bg-[#eeeeef]" />

                    <div>
                        <div className="h-3 w-28 rounded bg-[#eeeeef]" />
                        <div className="mt-2 h-2 w-20 rounded bg-[#f1f1f2]" />
                    </div>
                </div>
            </td>

            <td className="px-5 py-5">
                <div className="h-6 w-24 animate-pulse rounded bg-[#eeeeef]" />
            </td>

            <td className="px-5 py-5">
                <div className="h-6 w-16 animate-pulse rounded bg-[#eeeeef]" />
            </td>

            <td className="px-6 py-5">
                <div className="ml-auto h-7 w-7 animate-pulse rounded bg-[#eeeeef]" />
            </td>
        </tr>
    ));
};

const EmptyState = ({
    onAdd,
}) => {
    return (
        <tr>
            <td
                colSpan="4"
                className="px-6 py-16 text-center"
            >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f2f3f4] text-[#777]">
                    <MapPin
                        size={21}
                    />
                </div>

                <h3 className="mt-4 text-[14px] font-semibold text-[#333]">
                    No locations found
                </h3>

                <p className="mt-1 text-[12px] text-[#888]">
                    Add your first store,
                    warehouse, or pickup
                    location.
                </p>

                <button
                    type="button"
                    onClick={onAdd}
                    className="mt-4 inline-flex h-[36px] items-center gap-2 rounded-[8px] bg-[#2563eb] px-4 text-[12px] font-semibold text-white"
                >
                    <Plus
                        size={15}
                    />

                    Add Location
                </button>
            </td>
        </tr>
    );
};

export default VendorLocations;