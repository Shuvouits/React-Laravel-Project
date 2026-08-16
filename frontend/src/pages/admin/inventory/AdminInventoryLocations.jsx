import {
    Check,
    ChevronLeft,
    ChevronRight,
    Edit3,
    MapPin,
    MoreHorizontal,
    Plus,
    Search,
    Star,
    Trash2,
    X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import api from "../../../api/axios";

export default function AdminInventoryLocations() {
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
        per_page: 15,
        total: 0,
        from: null,
        to: null,
    });

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openMenuId, setOpenMenuId] = useState(null);
    const [menuPosition, setMenuPosition] = useState(null);

    const [formModal, setFormModal] = useState({
        open: false,
        mode: "create",
        item: null,
    });

    const [deleteModal, setDeleteModal] = useState({
        open: false,
        item: null,
    });

    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("success");

    useEffect(() => {
        fetchLocations(1);
    }, [search]);

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

    const fetchLocations = async (page = 1) => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get(
                "/admin/inventory/locations",
                {
                    params: {
                        search,
                        page,
                        per_page: 15,
                    },
                }
            );

            const data = response.data?.locations;

            setLocations(data?.data || []);
            setStats(
                response.data?.stats || {
                    total: 0,
                    active: 0,
                    inactive: 0,
                }
            );

            setPagination({
                current_page: data?.current_page || 1,
                last_page: data?.last_page || 1,
                per_page: data?.per_page || 15,
                total: data?.total || 0,
                from: data?.from || null,
                to: data?.to || null,
            });
        } catch (err) {
            console.error(
                "Inventory locations fetch error:",
                err
            );

            setError(
                err.response?.data?.message ||
                "Unable to load inventory locations."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (event) => {
        event.preventDefault();
        setSearch(searchInput.trim());
    };

    const closeMenu = () => {
        setOpenMenuId(null);
        setMenuPosition(null);
    };

    const toggleMenu = (item) => {
        if (openMenuId === item.id) {
            closeMenu();
            return;
        }

        const button = menuButtonRefs.current[item.id];

        if (!button) {
            return;
        }

        const rect = button.getBoundingClientRect();
        const menuWidth = 190;
        const menuHeight = 176;
        const gap = 7;
        const padding = 12;

        let left = rect.right - menuWidth;
        let top = rect.bottom + gap;

        if (
            top + menuHeight >
            window.innerHeight - padding
        ) {
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

        setOpenMenuId(item.id);
        setMenuPosition({
            top,
            left,
        });
    };

    const openCreateModal = () => {
        closeMenu();

        setFormModal({
            open: true,
            mode: "create",
            item: null,
        });
    };

    const openEditModal = (item) => {
        closeMenu();

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
    };

    const openDeleteModal = (item) => {
        closeMenu();

        setDeleteModal({
            open: true,
            item,
        });
    };

    const closeDeleteModal = () => {
        if (actionLoading) {
            return;
        }

        setDeleteModal({
            open: false,
            item: null,
        });
    };

    const handleSetDefault = async (item) => {
        closeMenu();

        setActionLoading(true);
        setMessage("");

        try {
            const response = await api.post(
                `/admin/inventory/locations/${item.id}/default`
            );

            setMessageType("success");
            setMessage(
                response.data?.message ||
                "Default inventory location updated."
            );

            await fetchLocations(
                pagination.current_page
            );
        } catch (err) {
            setMessageType("error");
            setMessage(
                err.response?.data?.message ||
                "Unable to set default location."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleToggleStatus = async (item) => {
        closeMenu();

        setActionLoading(true);
        setMessage("");

        try {
            const response = await api.post(
                `/admin/inventory/locations/${item.id}/toggle-status`
            );

            setMessageType("success");
            setMessage(
                response.data?.message ||
                "Inventory location updated."
            );

            await fetchLocations(
                pagination.current_page
            );
        } catch (err) {
            setMessageType("error");
            setMessage(
                err.response?.data?.message ||
                "Unable to update location status."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = async () => {
        const item = deleteModal.item;

        if (!item) {
            return;
        }

        setActionLoading(true);
        setMessage("");

        try {
            const response = await api.delete(
                `/admin/inventory/locations/${item.id}`
            );

            setDeleteModal({
                open: false,
                item: null,
            });

            setMessageType("success");
            setMessage(
                response.data?.message ||
                "Inventory location deleted."
            );

            await fetchLocations(
                pagination.current_page
            );
        } catch (err) {
            setMessageType("error");
            setMessage(
                err.response?.data?.message ||
                "Unable to delete inventory location."
            );
        } finally {
            setActionLoading(false);
        }
    };

    const selectedMenuItem =
        locations.find(
            (item) => item.id === openMenuId
        ) || null;

    return (
        <div className="min-h-screen bg-[#f6f6f7]">
            <div className="mx-auto w-full max-w-[1600px] px-6 py-7">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h1 className="text-[24px] font-semibold tracking-[-0.4px] text-[#171717]">
                            Inventory locations
                        </h1>

                        <p className="mt-1 text-[14px] text-[#737373]">
                            Manage warehouses, stores, and other places where inventory is stocked.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openCreateModal}
                        className="flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#171717] px-4 text-[13px] font-semibold text-white transition hover:bg-[#2a2a2a]"
                    >
                        <Plus size={16} />
                        Add location
                    </button>
                </div>

                {message && (
                    <div
                        className={`mb-5 rounded-[10px] border px-4 py-3 text-[13px] ${
                            messageType === "success"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-red-200 bg-red-50 text-red-700"
                        }`}
                    >
                        <div className="flex items-center justify-between gap-4">
                            <span>{message}</span>

                            <button
                                type="button"
                                onClick={() => setMessage("")}
                                className="rounded-md p-1 hover:bg-black/5"
                            >
                                <X size={15} />
                            </button>
                        </div>
                    </div>
                )}

                <StatsGrid stats={stats} />

                <section className="mt-5 overflow-hidden rounded-[18px] border border-[#dedede] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
                    <div className="flex flex-col gap-3 border-b border-[#e5e5e5] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
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
                                    setSearchInput(
                                        event.target.value
                                    )
                                }
                                placeholder="Search locations"
                                className="h-[38px] w-full rounded-[10px] border border-[#d9d9d9] bg-white pl-10 pr-4 text-[13px] text-[#222] outline-none transition placeholder:text-[#8a8a8a] focus:border-[#b7b7b7] focus:ring-2 focus:ring-[#f3f3f3]"
                            />
                        </form>

                        <div className="whitespace-nowrap text-[13px] text-[#737373]">
                            {pagination.total}{" "}
                            {pagination.total === 1
                                ? "location"
                                : "locations"}
                        </div>
                    </div>

                    {error && (
                        <div className="m-5 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] table-fixed border-collapse">
                            <colgroup>
                                <col className="w-[260px]" />
                                <col className="w-[135px]" />
                                <col className="w-[300px]" />
                                <col className="w-[135px]" />
                                <col className="w-[135px]" />
                                <col className="w-[135px]" />
                                <col className="w-[75px]" />
                            </colgroup>

                            <thead>
                                <tr className="h-[42px] border-b border-[#dedede] bg-[#fafafa] text-left">
                                    <TableHead>
                                        Location
                                    </TableHead>

                                    <TableHead>
                                        Code
                                    </TableHead>

                                    <TableHead>
                                        Address
                                    </TableHead>

                                    <TableHead className="text-right">
                                        Inventory items
                                    </TableHead>

                                    <TableHead className="text-right">
                                        On hand units
                                    </TableHead>

                                    <TableHead>
                                        Status
                                    </TableHead>

                                    <TableHead className="text-center">
                                        Actions
                                    </TableHead>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <LoadingRows />
                                ) : locations.length === 0 ? (
                                    <EmptyState />
                                ) : (
                                    locations.map((item) => (
                                        <LocationRow
                                            key={item.id}
                                            item={item}
                                            menuButtonRefs={
                                                menuButtonRefs
                                            }
                                            toggleMenu={
                                                toggleMenu
                                            }
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
                                    disabled={
                                        pagination.current_page <= 1
                                    }
                                    onClick={() =>
                                        fetchLocations(
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
                                        fetchLocations(
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

            {openMenuId &&
                menuPosition &&
                selectedMenuItem &&
                createPortal(
                    <ActionMenu
                        item={selectedMenuItem}
                        position={menuPosition}
                        onEdit={openEditModal}
                        onDefault={handleSetDefault}
                        onToggleStatus={handleToggleStatus}
                        onDelete={openDeleteModal}
                        onClose={closeMenu}
                    />,
                    document.body
                )}

            {formModal.open && (
                <LocationFormModal
                    mode={formModal.mode}
                    item={formModal.item}
                    loading={actionLoading}
                    setLoading={setActionLoading}
                    onClose={closeFormModal}
                    onSaved={async (message) => {
                        setMessageType("success");
                        setMessage(message);

                        setFormModal({
                            open: false,
                            mode: "create",
                            item: null,
                        });

                        await fetchLocations(
                            pagination.current_page
                        );
                    }}
                />
            )}

            {deleteModal.open &&
                deleteModal.item && (
                <DeleteLocationModal
                    item={deleteModal.item}
                    loading={actionLoading}
                    onClose={closeDeleteModal}
                    onDelete={handleDelete}
                />
            )}
        </div>
    );
}

function StatsGrid({ stats }) {
    const cards = [
        {
            label: "Total Locations",
            value: stats.total || 0,
        },
        {
            label: "Active Locations",
            value: stats.active || 0,
        },
        {
            label: "Inactive Locations",
            value: stats.inactive || 0,
        },
    ];

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="rounded-[16px] border border-[#dedede] bg-white px-5 py-[18px] shadow-[0_1px_2px_rgba(0,0,0,0.035)]"
                >
                    <div className="text-[13px] font-medium text-[#737373]">
                        {card.label}
                    </div>

                    <div className="mt-[5px] text-[24px] font-semibold leading-[30px] tracking-[-0.4px] text-[#171717]">
                        {card.value}
                    </div>
                </div>
            ))}
        </div>
    );
}

function LocationRow({
    item,
    menuButtonRefs,
    toggleMenu,
}) {
    const address = [
        item.address_line1,
        item.city,
        item.state,
        item.country,
    ]
        .filter(Boolean)
        .join(", ");

    return (
        <tr className="h-[62px] border-b border-[#e8e8e8] bg-white last:border-b-0 transition hover:bg-[#fcfcfc]">
            <td className="px-5 py-2.5 align-middle">
                <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[#f3f3f3] text-[#555]">
                        <MapPin size={18} />
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-semibold text-[#222]">
                                {item.name}
                            </span>

                            {item.is_default && (
                                <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-[2px] text-[10px] font-medium text-amber-700">
                                    <Star size={10} />
                                    Default
                                </span>
                            )}
                        </div>

                        <div className="mt-[2px] truncate text-[11px] text-[#888]">
                            {item.email ||
                                item.phone ||
                                "No contact details"}
                        </div>
                    </div>
                </div>
            </td>

            <td className="px-5 py-2.5 align-middle">
                <span className="text-[13px] font-medium text-[#444]">
                    {item.code}
                </span>
            </td>

            <td className="px-5 py-2.5 align-middle">
                <span className="block truncate text-[13px] text-[#555]">
                    {address || "No address"}
                </span>
            </td>

            <NumberCell
                value={item.inventory_levels_count}
            />

            <NumberCell
                value={item.on_hand_units}
            />

            <td className="px-5 py-2.5 align-middle">
                <StatusBadge
                    active={item.is_active}
                />
            </td>

            <td className="px-5 py-2.5 align-middle">
                <div className="flex justify-center">
                    <button
                        ref={(element) => {
                            menuButtonRefs.current[
                                item.id
                            ] = element;
                        }}
                        type="button"
                        onClick={() => toggleMenu(item)}
                        className="flex h-8 w-8 items-center justify-center rounded-full border border-[#dedede] bg-[#fafafa] text-[#444] shadow-sm transition hover:bg-[#f2f2f2]"
                    >
                        <MoreHorizontal size={17} />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function ActionMenu({
    item,
    position,
    onEdit,
    onDefault,
    onToggleStatus,
    onDelete,
    onClose,
}) {
    return (
        <>
            <div
                className="fixed inset-0 z-[9997]"
                onClick={onClose}
            />

            <div
                className="fixed z-[9998] w-[190px] overflow-hidden rounded-[11px] border border-[#dedede] bg-white py-1 shadow-[0_12px_34px_rgba(0,0,0,0.15)]"
                style={{
                    top: position.top,
                    left: position.left,
                }}
            >
                <button
                    type="button"
                    onClick={() => onEdit(item)}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#333] transition hover:bg-[#f5f5f5]"
                >
                    <Edit3
                        size={15}
                        className="text-[#777]"
                    />
                    Edit location
                </button>

                {!item.is_default && item.is_active && (
                    <button
                        type="button"
                        onClick={() => onDefault(item)}
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#333] transition hover:bg-[#f5f5f5]"
                    >
                        <Star
                            size={15}
                            className="text-[#777]"
                        />
                        Set as default
                    </button>
                )}

                {!item.is_default && (
                    <button
                        type="button"
                        onClick={() =>
                            onToggleStatus(item)
                        }
                        className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-[#333] transition hover:bg-[#f5f5f5]"
                    >
                        <Check
                            size={15}
                            className="text-[#777]"
                        />
                        {item.is_active
                            ? "Deactivate"
                            : "Activate"}
                    </button>
                )}

                {!item.is_default && (
                    <>
                        <div className="my-1 border-t border-[#eeeeee]" />

                        <button
                            type="button"
                            onClick={() => onDelete(item)}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[13px] text-red-600 transition hover:bg-red-50"
                        >
                            <Trash2 size={15} />
                            Delete location
                        </button>
                    </>
                )}
            </div>
        </>
    );
}

function LocationFormModal({
    mode,
    item,
    loading,
    setLoading,
    onClose,
    onSaved,
}) {
    const [form, setForm] = useState({
        name: item?.name || "",
        code: item?.code || "",
        phone: item?.phone || "",
        email: item?.email || "",
        address_line1:
            item?.address_line1 || "",
        address_line2:
            item?.address_line2 || "",
        city: item?.city || "",
        state: item?.state || "",
        postal_code:
            item?.postal_code || "",
        country: item?.country || "",
        is_default:
            Boolean(item?.is_default),
        is_active:
            item
                ? Boolean(item.is_active)
                : true,
    });

    const [formError, setFormError] =
        useState("");

    const updateField = (
        field,
        value
    ) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));
    };

    const handleSubmit = async (
        event
    ) => {
        event.preventDefault();

        if (
            !form.name.trim() ||
            !form.code.trim()
        ) {
            setFormError(
                "Location name and code are required."
            );
            return;
        }

        setLoading(true);
        setFormError("");

        try {
            let response;

            if (mode === "edit") {
                response = await api.put(
                    `/admin/inventory/locations/${item.id}`,
                    {
                        ...form,
                        name:
                            form.name.trim(),
                        code:
                            form.code.trim(),
                    }
                );
            } else {
                response = await api.post(
                    "/admin/inventory/locations",
                    {
                        ...form,
                        name:
                            form.name.trim(),
                        code:
                            form.code.trim(),
                    }
                );
            }

            await onSaved(
                response.data?.message ||
                (
                    mode === "edit"
                        ? "Inventory location updated."
                        : "Inventory location created."
                )
            );
        } catch (err) {
            setFormError(
                err.response?.data?.message ||
                "Unable to save inventory location."
            );
        } finally {
            setLoading(false);
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4 py-6">
            <div className="relative max-h-[92vh] w-full max-w-[680px] overflow-y-auto rounded-[18px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <button
                    type="button"
                    disabled={loading}
                    onClick={onClose}
                    className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full text-[#666] transition hover:bg-[#f3f3f3]"
                >
                    <X size={18} />
                </button>

                <form
                    onSubmit={handleSubmit}
                    className="p-7"
                >
                    <h2 className="text-[21px] font-semibold tracking-[-0.25px] text-[#222]">
                        {mode === "edit"
                            ? "Edit location"
                            : "Add location"}
                    </h2>

                    <p className="mt-1 text-[13px] text-[#777]">
                        Add the basic information for this inventory location.
                    </p>

                    <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <Field
                            label="Location name"
                            required
                            value={form.name}
                            onChange={(value) =>
                                updateField(
                                    "name",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Location code"
                            required
                            value={form.code}
                            onChange={(value) =>
                                updateField(
                                    "code",
                                    value.toUpperCase()
                                )
                            }
                        />

                        <Field
                            label="Phone"
                            value={form.phone}
                            onChange={(value) =>
                                updateField(
                                    "phone",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Email"
                            type="email"
                            value={form.email}
                            onChange={(value) =>
                                updateField(
                                    "email",
                                    value
                                )
                            }
                        />

                        <div className="sm:col-span-2">
                            <Field
                                label="Address line 1"
                                value={
                                    form.address_line1
                                }
                                onChange={(value) =>
                                    updateField(
                                        "address_line1",
                                        value
                                    )
                                }
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <Field
                                label="Address line 2"
                                value={
                                    form.address_line2
                                }
                                onChange={(value) =>
                                    updateField(
                                        "address_line2",
                                        value
                                    )
                                }
                            />
                        </div>

                        <Field
                            label="City"
                            value={form.city}
                            onChange={(value) =>
                                updateField(
                                    "city",
                                    value
                                )
                            }
                        />

                        <Field
                            label="State"
                            value={form.state}
                            onChange={(value) =>
                                updateField(
                                    "state",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Postal code"
                            value={form.postal_code}
                            onChange={(value) =>
                                updateField(
                                    "postal_code",
                                    value
                                )
                            }
                        />

                        <Field
                            label="Country"
                            value={form.country}
                            onChange={(value) =>
                                updateField(
                                    "country",
                                    value
                                )
                            }
                        />
                    </div>

                    <div className="mt-5 space-y-3 rounded-[12px] border border-[#e3e3e3] bg-[#fafafa] p-4">
                        <ToggleRow
                            label="Active location"
                            description="Allow this location to hold and manage inventory."
                            checked={
                                form.is_active
                            }
                            onChange={(value) =>
                                updateField(
                                    "is_active",
                                    value
                                )
                            }
                        />

                        <ToggleRow
                            label="Default location"
                            description="Use this as the primary inventory location."
                            checked={
                                form.is_default
                            }
                            onChange={(value) =>
                                updateField(
                                    "is_default",
                                    value
                                )
                            }
                        />
                    </div>

                    {formError && (
                        <div className="mt-4 rounded-[9px] border border-red-200 bg-red-50 px-3 py-2.5 text-[12px] text-red-600">
                            {formError}
                        </div>
                    )}

                    <div className="mt-6 flex justify-end gap-3">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={onClose}
                            className="h-10 rounded-[10px] border border-[#dedede] bg-white px-4 text-[13px] font-medium text-[#333] transition hover:bg-[#f8f8f8] disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="h-10 min-w-[120px] rounded-[10px] bg-[#171717] px-4 text-[13px] font-semibold text-white transition hover:bg-[#2a2a2a] disabled:opacity-60"
                        >
                            {loading
                                ? "Saving..."
                                : mode === "edit"
                                    ? "Save changes"
                                    : "Add location"}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
}

function DeleteLocationModal({
    item,
    loading,
    onClose,
    onDelete,
}) {
    return createPortal(
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/45 px-4">
            <div className="relative w-full max-w-[440px] overflow-hidden rounded-[18px] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
                <div className="h-1 w-full bg-red-500" />

                <button
                    type="button"
                    disabled={loading}
                    onClick={onClose}
                    className="absolute right-4 top-5 flex h-8 w-8 items-center justify-center rounded-lg text-[#888] transition hover:bg-[#f3f3f3]"
                >
                    <X size={18} />
                </button>

                <div className="px-6 pb-6 pt-7">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <Trash2 size={21} />
                    </div>

                    <h2 className="mt-5 text-[20px] font-semibold text-[#222]">
                        Delete Location
                    </h2>

                    <p className="mt-2 text-[14px] leading-6 text-[#666]">
                        Delete{" "}
                        <span className="font-semibold text-[#222]">
                            {item.name}
                        </span>
                        ? This action cannot be undone.
                    </p>
                </div>

                <div className="flex gap-3 border-t border-[#eeeeee] bg-[#fafafa] px-6 py-4">
                    <button
                        type="button"
                        disabled={loading}
                        onClick={onClose}
                        className="h-11 flex-1 rounded-[11px] border border-[#d8d8d8] bg-white px-4 text-[13px] font-semibold text-[#444] transition hover:bg-[#f5f5f5] disabled:opacity-60"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        disabled={loading}
                        onClick={onDelete}
                        className="h-11 flex-1 rounded-[11px] bg-red-600 px-4 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                    >
                        {loading
                            ? "Deleting..."
                            : "Delete"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

function Field({
    label,
    required = false,
    type = "text",
    value,
    onChange,
}) {
    return (
        <label className="block">
            <span className="text-[12px] font-medium text-[#444]">
                {label}
                {required && (
                    <span className="ml-1 text-red-500">
                        *
                    </span>
                )}
            </span>

            <input
                type={type}
                value={value}
                onChange={(event) =>
                    onChange(
                        event.target.value
                    )
                }
                className="mt-1.5 h-10 w-full rounded-[10px] border border-[#d9d9d9] bg-white px-3 text-[13px] text-[#222] outline-none transition focus:border-[#b7b7b7] focus:ring-2 focus:ring-[#f3f3f3]"
            />
        </label>
    );
}

function ToggleRow({
    label,
    description,
    checked,
    onChange,
}) {
    return (
        <div className="flex items-center justify-between gap-4">
            <div>
                <div className="text-[13px] font-medium text-[#333]">
                    {label}
                </div>

                <div className="mt-[2px] text-[11px] text-[#888]">
                    {description}
                </div>
            </div>

            <button
                type="button"
                onClick={() =>
                    onChange(!checked)
                }
                className={`relative h-6 w-11 rounded-full transition ${
                    checked
                        ? "bg-[#171717]"
                        : "bg-[#d9d9d9]"
                }`}
            >
                <span
                    className={`absolute top-[3px] h-[18px] w-[18px] rounded-full bg-white shadow-sm transition ${
                        checked
                            ? "left-[23px]"
                            : "left-[3px]"
                    }`}
                />
            </button>
        </div>
    );
}

function NumberCell({ value }) {
    return (
        <td className="px-5 py-2.5 text-right align-middle">
            <span className="text-[13px] font-medium tabular-nums text-[#333]">
                {Number(value || 0)}
            </span>
        </td>
    );
}

function StatusBadge({ active }) {
    return (
        <span
            className={`inline-flex min-h-[24px] items-center whitespace-nowrap rounded-full border px-2.5 py-[3px] text-[11px] font-medium leading-none ${
                active
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-gray-50 text-gray-600"
            }`}
        >
            {active
                ? "Active"
                : "Inactive"}
        </span>
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
        length: 6,
    }).map((_, index) => (
        <tr
            key={index}
            className="h-[62px] border-b border-[#e8e8e8] last:border-b-0"
        >
            {Array.from({
                length: 7,
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
                colSpan="7"
                className="px-6 py-16 text-center"
            >
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#f3f3f3] text-[#777]">
                    <MapPin size={21} />
                </div>

                <h3 className="mt-4 text-[14px] font-semibold text-[#222]">
                    No locations found
                </h3>

                <p className="mt-1 text-[13px] text-[#777]">
                    Inventory locations will appear here.
                </p>
            </td>
        </tr>
    );
}
