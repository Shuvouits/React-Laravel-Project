import { useEffect, useMemo, useState } from "react";
import {
    Building2,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Inbox,
    LoaderCircle,
    Mail,
    MailOpen,
    MessageSquare,
    MoreHorizontal,
    Phone,
    RefreshCw,
    Search,
    Send,
    ShieldAlert,
    Trash2,
    User,
    X,
} from "lucide-react";

import api from "../../../api/axios";

const STATUS_OPTIONS = [
    {
        value: "",
        label: "All statuses",
    },
    {
        value: "new",
        label: "New",
    },
    {
        value: "in_progress",
        label: "In progress",
    },
    {
        value: "resolved",
        label: "Resolved",
    },
    {
        value: "spam",
        label: "Spam",
    },
];

const READ_OPTIONS = [
    {
        value: "",
        label: "All messages",
    },
    {
        value: "0",
        label: "Unread",
    },
    {
        value: "1",
        label: "Read",
    },
];

const AdminContactInbox = () => {
    const [messages, setMessages] = useState([]);
    const [stats, setStats] = useState(
        getEmptyStats()
    );
    const [pagination, setPagination] =
        useState(getEmptyPagination());

    const [selectedMessage, setSelectedMessage] =
        useState(null);

    const [messageToDelete, setMessageToDelete] =
        useState(null);

    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] =
        useState("");

    const [status, setStatus] = useState("");
    const [readFilter, setReadFilter] =
        useState("");

    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] =
        useState(false);
    const [actionLoading, setActionLoading] =
        useState(false);
    const [deleting, setDeleting] =
        useState(false);

    const [error, setError] = useState("");
    const [toast, setToast] = useState("");

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(search.trim());
        }, 350);

        return () => {
            window.clearTimeout(timer);
        };
    }, [search]);

    useEffect(() => {
        fetchMessages(1);
    }, [
        debouncedSearch,
        status,
        readFilter,
    ]);

    const fetchMessages = async (
        page = 1,
        preserveSelection = false
    ) => {
        try {
            setLoading(true);
            setError("");

            const params = {
                page,
                per_page: 15,
            };

            if (debouncedSearch) {
                params.search =
                    debouncedSearch;
            }

            if (status) {
                params.status = status;
            }

            if (readFilter !== "") {
                params.is_read =
                    readFilter;
            }

            const response = await api.get(
                "/admin/contact-messages",
                {
                    params,
                }
            );

            const paginationData =
                response.data?.messages || {};

            setMessages(
                paginationData.data || []
            );

            setStats(
                response.data?.stats ||
                    getEmptyStats()
            );

            setPagination({
                currentPage:
                    paginationData.current_page || 1,
                lastPage:
                    paginationData.last_page || 1,
                total:
                    paginationData.total || 0,
                from:
                    paginationData.from || 0,
                to:
                    paginationData.to || 0,
            });

            notifyUnreadCount(
                response.data?.stats?.unread || 0
            );

            if (!preserveSelection) {
                setSelectedMessage(null);
            }
        } catch (requestError) {
            console.error(
                "Contact messages error:",
                requestError
            );

            setError(
                requestError.response?.data
                    ?.message ||
                    "Unable to load contact messages."
            );
        } finally {
            setLoading(false);
        }
    };

    const openMessage = async (message) => {
        try {
            setDetailLoading(true);
            setError("");

            const response = await api.get(
                `/admin/contact-messages/${message.id}`
            );

            const openedMessage =
                response.data?.message;

            setSelectedMessage(
                openedMessage || message
            );

            updateMessageInList(
                openedMessage || {
                    ...message,
                    is_read: true,
                }
            );

            if (response.data?.stats) {
                setStats(
                    response.data.stats
                );

                notifyUnreadCount(
                    response.data.stats.unread
                );
            }
        } catch (requestError) {
            setError(
                requestError.response?.data
                    ?.message ||
                    "Unable to open this message."
            );
        } finally {
            setDetailLoading(false);
        }
    };

    const updateStatus = async (
        nextStatus
    ) => {
        if (
            !selectedMessage ||
            actionLoading
        ) {
            return;
        }

        try {
            setActionLoading(true);

            const response = await api.put(
                `/admin/contact-messages/${selectedMessage.id}/status`,
                {
                    status: nextStatus,
                }
            );

            const updatedMessage =
                response.data
                    ?.contact_message;

            setSelectedMessage(
                updatedMessage
            );

            updateMessageInList(
                updatedMessage
            );

            if (response.data?.stats) {
                setStats(
                    response.data.stats
                );
            }

            showToast(
                response.data?.message ||
                    "Message status updated."
            );
        } catch (requestError) {
            setError(
                getRequestError(
                    requestError
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    const toggleReadStatus = async () => {
        if (
            !selectedMessage ||
            actionLoading
        ) {
            return;
        }

        const action =
            selectedMessage.is_read
                ? "unread"
                : "read";

        try {
            setActionLoading(true);

            const response = await api.put(
                `/admin/contact-messages/${selectedMessage.id}/${action}`
            );

            const updatedMessage =
                response.data
                    ?.contact_message;

            setSelectedMessage(
                updatedMessage
            );

            updateMessageInList(
                updatedMessage
            );

            if (response.data?.stats) {
                setStats(
                    response.data.stats
                );

                notifyUnreadCount(
                    response.data.stats.unread
                );
            }

            showToast(
                response.data?.message ||
                    "Message updated."
            );
        } catch (requestError) {
            setError(
                getRequestError(
                    requestError
                )
            );
        } finally {
            setActionLoading(false);
        }
    };

    const deleteMessage = async () => {
        if (
            !messageToDelete ||
            deleting
        ) {
            return;
        }

        try {
            setDeleting(true);

            const response = await api.delete(
                `/admin/contact-messages/${messageToDelete.id}`
            );

            if (
                selectedMessage?.id ===
                messageToDelete.id
            ) {
                setSelectedMessage(null);
            }

            setMessageToDelete(null);

            if (response.data?.stats) {
                setStats(
                    response.data.stats
                );

                notifyUnreadCount(
                    response.data.stats.unread
                );
            }

            showToast(
                response.data?.message ||
                    "Contact message deleted."
            );

            await fetchMessages(
                pagination.currentPage,
                true
            );
        } catch (requestError) {
            setError(
                getRequestError(
                    requestError
                )
            );
        } finally {
            setDeleting(false);
        }
    };

    const updateMessageInList = (
        updatedMessage
    ) => {
        if (!updatedMessage?.id) {
            return;
        }

        setMessages((current) =>
            current.map((message) =>
                message.id ===
                updatedMessage.id
                    ? updatedMessage
                    : message
            )
        );
    };

    const showToast = (message) => {
        setToast(message);

        window.setTimeout(() => {
            setToast("");
        }, 3200);
    };

    const hasFilters = Boolean(
        debouncedSearch ||
            status ||
            readFilter !== ""
    );

    return (
        <div className="min-h-full bg-[#f6f7f9] px-[18px] py-[22px] sm:px-[26px] lg:px-[34px]">
            <div className="mx-auto max-w-[1500px]">
                <InboxHeader
                    loading={loading}
                    onRefresh={() =>
                        fetchMessages(
                            pagination.currentPage,
                            true
                        )
                    }
                />

                <StatsGrid stats={stats} />

                {error && (
                    <ErrorAlert
                        message={error}
                        onClose={() =>
                            setError("")
                        }
                    />
                )}

                <div className="mt-[22px] overflow-hidden rounded-[16px] border border-[#e5e7eb] bg-white shadow-[0_8px_28px_rgba(15,23,42,0.05)]">
                    <InboxFilters
                        search={search}
                        status={status}
                        readFilter={
                            readFilter
                        }
                        onSearch={setSearch}
                        onStatus={setStatus}
                        onReadFilter={
                            setReadFilter
                        }
                    />

                    <div className="grid min-h-[590px] lg:grid-cols-[440px_minmax(0,1fr)]">
                        <MessageList
                            messages={messages}
                            loading={loading}
                            selectedId={
                                selectedMessage?.id
                            }
                            hasFilters={
                                hasFilters
                            }
                            onOpen={openMessage}
                        />

                        <MessageDetail
                            message={
                                selectedMessage
                            }
                            loading={
                                detailLoading
                            }
                            actionLoading={
                                actionLoading
                            }
                            onStatus={
                                updateStatus
                            }
                            onToggleRead={
                                toggleReadStatus
                            }
                            onDelete={() =>
                                setMessageToDelete(
                                    selectedMessage
                                )
                            }
                        />
                    </div>

                    <Pagination
                        pagination={pagination}
                        loading={loading}
                        onPage={(page) =>
                            fetchMessages(
                                page,
                                true
                            )
                        }
                    />
                </div>
            </div>

            {toast && (
                <SuccessToast
                    message={toast}
                />
            )}

            <DeleteMessageModal
                open={Boolean(
                    messageToDelete
                )}
                message={messageToDelete}
                deleting={deleting}
                onClose={() => {
                    if (!deleting) {
                        setMessageToDelete(
                            null
                        );
                    }
                }}
                onConfirm={deleteMessage}
            />
        </div>
    );
};

const InboxHeader = ({
    loading,
    onRefresh,
}) => {
    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <div className="flex items-center gap-[10px]">
                    <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[11px] bg-[#eaf1ff] text-[#2065D1]">
                        <Inbox size={21} />
                    </div>

                    <div>
                        <h1 className="text-[25px] font-bold tracking-[-0.6px] text-[#15171a]">
                            Contact Inbox
                        </h1>

                        <p className="mt-[2px] text-[13px] text-[#777d87]">
                            View and manage customer contact requests.
                        </p>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="flex h-[41px] items-center justify-center gap-[8px] rounded-[9px] border border-[#dfe2e7] bg-white px-[16px] text-[13px] font-semibold text-[#414751] transition hover:bg-[#f7f8fa] disabled:opacity-60"
            >
                <RefreshCw
                    size={16}
                    className={
                        loading
                            ? "animate-spin"
                            : ""
                    }
                />
                Refresh
            </button>
        </div>
    );
};

const StatsGrid = ({ stats }) => {
    const items = [
        {
            label: "Total messages",
            value: stats.total,
            icon: MessageSquare,
            color: "blue",
        },
        {
            label: "Unread",
            value: stats.unread,
            icon: Mail,
            color: "red",
        },
        {
            label: "In progress",
            value: stats.in_progress,
            icon: Clock3,
            color: "amber",
        },
        {
            label: "Resolved",
            value: stats.resolved,
            icon: CheckCircle2,
            color: "green",
        },
    ];

    return (
        <div className="mt-[22px] grid gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
            {items.map((item) => (
                <StatCard
                    key={item.label}
                    {...item}
                />
            ))}
        </div>
    );
};

const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
}) => {
    const styles = {
        blue: {
            icon: "bg-[#eaf1ff] text-[#2065D1]",
        },
        red: {
            icon: "bg-[#fff0f0] text-[#e5484d]",
        },
        amber: {
            icon: "bg-[#fff6df] text-[#d88a00]",
        },
        green: {
            icon: "bg-[#eaf8ef] text-[#199653]",
        },
    };

    return (
        <div className="flex items-center justify-between rounded-[14px] border border-[#e6e8ec] bg-white px-[18px] py-[17px] shadow-[0_5px_18px_rgba(15,23,42,0.035)]">
            <div>
                <p className="text-[12px] font-medium text-[#7b8089]">
                    {label}
                </p>

                <p className="mt-[5px] text-[25px] font-bold text-[#181a1f]">
                    {value || 0}
                </p>
            </div>

            <div
                className={`flex h-[42px] w-[42px] items-center justify-center rounded-[11px] ${styles[color].icon}`}
            >
                <Icon size={20} />
            </div>
        </div>
    );
};

const InboxFilters = ({
    search,
    status,
    readFilter,
    onSearch,
    onStatus,
    onReadFilter,
}) => {
    return (
        <div className="flex flex-col gap-[12px] border-b border-[#e8eaee] px-[16px] py-[15px] md:flex-row md:items-center">
            <div className="relative flex-1">
                <Search
                    size={17}
                    className="absolute left-[13px] top-1/2 -translate-y-1/2 text-[#8a9099]"
                />

                <input
                    type="search"
                    value={search}
                    onChange={(event) =>
                        onSearch(
                            event.target.value
                        )
                    }
                    placeholder="Search name, email, subject or message..."
                    className="h-[42px] w-full rounded-[9px] border border-[#dfe2e7] bg-white pl-[40px] pr-[14px] text-[13px] outline-none transition focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10"
                />
            </div>

            <select
                value={status}
                onChange={(event) =>
                    onStatus(
                        event.target.value
                    )
                }
                className="h-[42px] min-w-[155px] rounded-[9px] border border-[#dfe2e7] bg-white px-[12px] text-[13px] text-[#444a53] outline-none focus:border-[#2065D1]"
            >
                {STATUS_OPTIONS.map(
                    (option) => (
                        <option
                            key={
                                option.value
                            }
                            value={
                                option.value
                            }
                        >
                            {option.label}
                        </option>
                    )
                )}
            </select>

            <select
                value={readFilter}
                onChange={(event) =>
                    onReadFilter(
                        event.target.value
                    )
                }
                className="h-[42px] min-w-[150px] rounded-[9px] border border-[#dfe2e7] bg-white px-[12px] text-[13px] text-[#444a53] outline-none focus:border-[#2065D1]"
            >
                {READ_OPTIONS.map(
                    (option) => (
                        <option
                            key={
                                option.value
                            }
                            value={
                                option.value
                            }
                        >
                            {option.label}
                        </option>
                    )
                )}
            </select>
        </div>
    );
};

const MessageList = ({
    messages,
    loading,
    selectedId,
    hasFilters,
    onOpen,
}) => {
    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center border-r border-[#e8eaee]">
                <LoaderCircle
                    size={27}
                    className="animate-spin text-[#2065D1]"
                />
            </div>
        );
    }

    if (!messages.length) {
        return (
            <div className="flex min-h-[500px] flex-col items-center justify-center border-r border-[#e8eaee] px-6 text-center">
                <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-[#f1f4f8] text-[#79808a]">
                    <Inbox size={25} />
                </div>

                <h3 className="mt-[15px] text-[15px] font-semibold text-[#25282e]">
                    {hasFilters
                        ? "No matching messages"
                        : "Your inbox is empty"}
                </h3>

                <p className="mt-[6px] max-w-[270px] text-[12px] leading-[1.6] text-[#858b94]">
                    {hasFilters
                        ? "Try changing your search or filter options."
                        : "New contact form submissions will appear here."}
                </p>
            </div>
        );
    }

    return (
        <div className="max-h-[590px] overflow-y-auto border-r border-[#e8eaee]">
            {messages.map((message) => (
                <MessageListItem
                    key={message.id}
                    message={message}
                    active={
                        selectedId === message.id
                    }
                    onClick={() =>
                        onOpen(message)
                    }
                />
            ))}
        </div>
    );
};

const MessageListItem = ({
    message,
    active,
    onClick,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative w-full border-b border-[#eceef1] px-[18px] py-[16px] text-left transition ${
                active
                    ? "bg-[#edf4ff]"
                    : message.is_read
                      ? "bg-white hover:bg-[#f8f9fb]"
                      : "bg-[#fbfdff] hover:bg-[#f3f7ff]"
            }`}
        >
            {!message.is_read && (
                <span className="absolute left-0 top-0 h-full w-[3px] bg-[#2065D1]" />
            )}

            <div className="flex items-start gap-[12px]">
                <div
                    className={`flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                        message.is_read
                            ? "bg-[#f0f1f3] text-[#626873]"
                            : "bg-[#2065D1] text-white"
                    }`}
                >
                    {getInitials(
                        message.name
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                        <p
                            className={`truncate text-[13px] text-[#202329] ${
                                message.is_read
                                    ? "font-medium"
                                    : "font-bold"
                            }`}
                        >
                            {message.name}
                        </p>

                        <span className="shrink-0 text-[10px] text-[#90959d]">
                            {formatListDate(
                                message.created_at
                            )}
                        </span>
                    </div>

                    <p
                        className={`mt-[4px] truncate text-[12px] ${
                            message.is_read
                                ? "font-medium text-[#535962]"
                                : "font-semibold text-[#303640]"
                        }`}
                    >
                        {message.subject}
                    </p>

                    <p className="mt-[5px] line-clamp-2 text-[11px] leading-[1.5] text-[#848a93]">
                        {message.message}
                    </p>

                    <div className="mt-[9px] flex items-center justify-between">
                        <StatusBadge
                            status={
                                message.status
                            }
                        />

                        {!message.is_read && (
                            <span className="h-[7px] w-[7px] rounded-full bg-[#2065D1]" />
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
};

const MessageDetail = ({
    message,
    loading,
    actionLoading,
    onStatus,
    onToggleRead,
    onDelete,
}) => {
    if (loading) {
        return (
            <div className="flex min-h-[500px] items-center justify-center">
                <LoaderCircle
                    size={27}
                    className="animate-spin text-[#2065D1]"
                />
            </div>
        );
    }

    if (!message) {
        return (
            <div className="flex min-h-[500px] flex-col items-center justify-center px-6 text-center">
                <div className="flex h-[64px] w-[64px] items-center justify-center rounded-full bg-[#eef3fb] text-[#6b7d99]">
                    <MailOpen size={27} />
                </div>

                <h3 className="mt-[16px] text-[16px] font-semibold text-[#262a31]">
                    Select a message
                </h3>

                <p className="mt-[6px] max-w-[320px] text-[12px] leading-[1.6] text-[#858b94]">
                    Choose a contact request from the
                    inbox to view its full details.
                </p>
            </div>
        );
    }

    return (
        <div className="min-w-0 bg-white">
            <div className="flex flex-col gap-[13px] border-b border-[#e8eaee] px-[22px] py-[18px] xl:flex-row xl:items-center xl:justify-between">
                <div className="flex items-center gap-[10px]">
                    <StatusBadge
                        status={message.status}
                    />

                    <span className="text-[11px] text-[#8b9098]">
                        {formatFullDate(
                            message.created_at
                        )}
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-[8px]">
                    <button
                        type="button"
                        onClick={onToggleRead}
                        disabled={actionLoading}
                        className="flex h-[37px] items-center gap-[7px] rounded-[8px] border border-[#dfe2e7] px-[12px] text-[12px] font-semibold text-[#4c525c] hover:bg-[#f6f7f9]"
                    >
                        {message.is_read ? (
                            <Mail size={15} />
                        ) : (
                            <MailOpen size={15} />
                        )}

                        {message.is_read
                            ? "Mark unread"
                            : "Mark read"}
                    </button>

                    <select
                        value={message.status}
                        onChange={(event) =>
                            onStatus(
                                event.target.value
                            )
                        }
                        disabled={actionLoading}
                        className="h-[37px] rounded-[8px] border border-[#dfe2e7] bg-white px-[10px] text-[12px] font-semibold text-[#4c525c] outline-none"
                    >
                        {STATUS_OPTIONS.filter(
                            (option) =>
                                option.value
                        ).map((option) => (
                            <option
                                key={
                                    option.value
                                }
                                value={
                                    option.value
                                }
                            >
                                {
                                    option.label
                                }
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={onDelete}
                        disabled={actionLoading}
                        className="flex h-[37px] w-[37px] items-center justify-center rounded-[8px] border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>

            <div className="max-h-[520px] overflow-y-auto px-[24px] py-[24px] sm:px-[30px]">
                <div className="flex items-start gap-[14px]">
                    <div className="flex h-[48px] w-[48px] shrink-0 items-center justify-center rounded-full bg-[#2065D1] text-[15px] font-bold text-white">
                        {getInitials(
                            message.name
                        )}
                    </div>

                    <div className="min-w-0">
                        <h2 className="text-[18px] font-bold text-[#191c21]">
                            {message.name}
                        </h2>

                        <a
                            href={`mailto:${message.email}`}
                            className="mt-[3px] block break-all text-[12px] text-[#2065D1] hover:underline"
                        >
                            {message.email}
                        </a>
                    </div>
                </div>

                <h3 className="mt-[28px] text-[22px] font-bold leading-[1.35] tracking-[-0.4px] text-[#17191d]">
                    {message.subject}
                </h3>

                <div className="mt-[22px] rounded-[12px] border border-[#e5e7eb] bg-[#fafbfc] px-[18px] py-[17px]">
                    <p className="whitespace-pre-wrap text-[14px] leading-[1.8] text-[#454b54]">
                        {message.message}
                    </p>
                </div>

                <div className="mt-[26px] grid gap-[12px] sm:grid-cols-2">
                    <DetailItem
                        icon={User}
                        label="Name"
                        value={message.name}
                    />

                    <DetailItem
                        icon={Mail}
                        label="Email"
                        value={message.email}
                        href={`mailto:${message.email}`}
                    />

                    <DetailItem
                        icon={Phone}
                        label="Phone"
                        value={
                            message.phone ||
                            "Not provided"
                        }
                        href={
                            message.phone
                                ? `tel:${message.phone.replace(
                                      /[^\d+]/g,
                                      ""
                                  )}`
                                : null
                        }
                    />

                    <DetailItem
                        icon={Building2}
                        label="Company"
                        value={
                            message.company ||
                            "Not provided"
                        }
                    />
                </div>
            </div>
        </div>
    );
};

const DetailItem = ({
    icon: Icon,
    label,
    value,
    href,
}) => {
    return (
        <div className="flex items-start gap-[11px] rounded-[10px] border border-[#e7e9ed] px-[14px] py-[13px]">
            <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[8px] bg-[#eef3fb] text-[#2065D1]">
                <Icon size={16} />
            </div>

            <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[#91969f]">
                    {label}
                </p>

                {href ? (
                    <a
                        href={href}
                        className="mt-[3px] block break-all text-[12px] font-medium text-[#30343b] hover:text-[#2065D1]"
                    >
                        {value}
                    </a>
                ) : (
                    <p className="mt-[3px] break-words text-[12px] font-medium text-[#30343b]">
                        {value}
                    </p>
                )}
            </div>
        </div>
    );
};

const StatusBadge = ({ status }) => {
    const config = {
        new: {
            label: "New",
            className:
                "bg-[#eaf1ff] text-[#2065D1]",
        },
        in_progress: {
            label: "In progress",
            className:
                "bg-[#fff4d8] text-[#a96a00]",
        },
        resolved: {
            label: "Resolved",
            className:
                "bg-[#e7f8ed] text-[#168348]",
        },
        spam: {
            label: "Spam",
            className:
                "bg-[#fff0f0] text-[#d93c43]",
        },
    };

    const item =
        config[status] || config.new;

    return (
        <span
            className={`inline-flex rounded-full px-[9px] py-[4px] text-[10px] font-semibold ${item.className}`}
        >
            {item.label}
        </span>
    );
};

const Pagination = ({
    pagination,
    loading,
    onPage,
}) => {
    if (pagination.total === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-3 border-t border-[#e8eaee] px-[18px] py-[14px] sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-[#838891]">
                Showing {pagination.from} to{" "}
                {pagination.to} of{" "}
                {pagination.total} messages
            </p>

            <div className="flex items-center gap-[7px]">
                <button
                    type="button"
                    disabled={
                        loading ||
                        pagination.currentPage <= 1
                    }
                    onClick={() =>
                        onPage(
                            pagination.currentPage -
                                1
                        )
                    }
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-[#dfe2e7] text-[#555b64] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={16} />
                </button>

                <span className="min-w-[76px] text-center text-[11px] font-medium text-[#60656e]">
                    Page{" "}
                    {pagination.currentPage} of{" "}
                    {pagination.lastPage}
                </span>

                <button
                    type="button"
                    disabled={
                        loading ||
                        pagination.currentPage >=
                            pagination.lastPage
                    }
                    onClick={() =>
                        onPage(
                            pagination.currentPage +
                                1
                        )
                    }
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-[8px] border border-[#dfe2e7] text-[#555b64] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

const DeleteMessageModal = ({
    open,
    message,
    deleting,
    onClose,
    onConfirm,
}) => {
    if (!open || !message) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center bg-[#111827]/60 px-4 backdrop-blur-[2px]">
            <div className="relative w-full max-w-[470px] overflow-hidden rounded-[16px] bg-white shadow-[0_30px_80px_rgba(0,0,0,0.28)]">
                <div className="h-[4px] w-full bg-red-500" />

                <button
                    type="button"
                    onClick={onClose}
                    disabled={deleting}
                    className="absolute right-[17px] top-[18px] flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#737780] hover:bg-[#f3f4f6]"
                >
                    <X size={18} />
                </button>

                <div className="px-[28px] pb-[26px] pt-[30px] text-center">
                    <div className="mx-auto flex h-[62px] w-[62px] items-center justify-center rounded-full bg-red-50 text-red-600">
                        <Trash2 size={26} />
                    </div>

                    <h2 className="mt-[18px] text-[21px] font-bold text-[#17191e]">
                        Delete Message
                    </h2>

                    <p className="mx-auto mt-[9px] max-w-[360px] text-[13px] leading-[1.7] text-[#737780]">
                        Delete the message from{" "}
                        <span className="font-semibold text-[#30343a]">
                            {message.name}
                        </span>
                        ? This action cannot be undone.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-[12px] border-t border-[#eceef1] bg-[#fafafa] px-[22px] py-[18px]">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="h-[44px] rounded-[9px] border border-[#d9dde3] bg-white text-[13px] font-semibold text-[#41464e] hover:bg-[#f5f6f7]"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleting}
                        className="flex h-[44px] items-center justify-center gap-[8px] rounded-[9px] bg-red-600 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                    >
                        {deleting ? (
                            <LoaderCircle
                                size={16}
                                className="animate-spin"
                            />
                        ) : (
                            <Trash2 size={16} />
                        )}

                        {deleting
                            ? "Deleting..."
                            : "Delete"}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ErrorAlert = ({
    message,
    onClose,
}) => {
    return (
        <div className="mt-[18px] flex items-start justify-between gap-4 rounded-[10px] border border-red-200 bg-red-50 px-[15px] py-[12px] text-[12px] text-red-700">
            <div className="flex items-start gap-[9px]">
                <ShieldAlert
                    size={17}
                    className="mt-[1px] shrink-0"
                />
                <span>{message}</span>
            </div>

            <button
                type="button"
                onClick={onClose}
            >
                <X size={15} />
            </button>
        </div>
    );
};

const SuccessToast = ({ message }) => {
    return (
        <div className="fixed bottom-6 right-6 z-[2200] flex max-w-[360px] items-center gap-[10px] rounded-[10px] border border-emerald-200 bg-white px-[16px] py-[13px] text-[12px] font-semibold text-emerald-700 shadow-[0_16px_40px_rgba(15,23,42,0.16)]">
            <CheckCircle2 size={17} />
            {message}
        </div>
    );
};

const getEmptyStats = () => ({
    total: 0,
    unread: 0,
    new: 0,
    in_progress: 0,
    resolved: 0,
    spam: 0,
});

const getEmptyPagination = () => ({
    currentPage: 1,
    lastPage: 1,
    total: 0,
    from: 0,
    to: 0,
});

const getInitials = (name) => {
    return String(name || "U")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();
};

const formatListDate = (value) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    const now = new Date();

    if (
        date.toDateString() ===
        now.toDateString()
    ) {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    return date.toLocaleDateString([], {
        month: "short",
        day: "numeric",
    });
};

const formatFullDate = (value) => {
    if (!value) {
        return "";
    }

    return new Date(value).toLocaleString([], {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const notifyUnreadCount = (count) => {
    window.dispatchEvent(
        new CustomEvent(
            "contact-unread-updated",
            {
                detail: Number(count) || 0,
            }
        )
    );
};

const getRequestError = (error) => {
    const errors =
        error.response?.data?.errors || {};

    const firstError = Object.values(errors)
        .flat()
        .find(Boolean);

    return (
        firstError ||
        error.response?.data?.message ||
        "Something went wrong. Please try again."
    );
};

export default AdminContactInbox;