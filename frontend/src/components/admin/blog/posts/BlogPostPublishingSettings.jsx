import {
    CalendarClock,
    Check,
    Eye,
    MessageCircle,
    Star,
} from "lucide-react";

import {
    BLOG_POST_STATUSES,
    BLOG_POST_VISIBILITIES,
    firstError,
} from "./blogPostConfig";

const Switch = ({
    checked,
    onChange,
    disabled = false,
}) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`
                relative
                h-[22px]
                w-[38px]
                shrink-0
                rounded-full
                transition-colors
                duration-200
                disabled:cursor-not-allowed
                disabled:opacity-50
                ${checked
                    ? "bg-[#246bdb]"
                    : "bg-[#dfe1e5]"
                }
            `}
        >
            <span
                className={`
                    absolute
                    top-[3px]
                    flex
                    h-4
                    w-4
                    items-center
                    justify-center
                    rounded-full
                    bg-white
                    shadow-sm
                    transition-transform
                    duration-200
                    ${checked
                        ? "translate-x-[19px]"
                        : "translate-x-[3px]"
                    }
                `}
            >
                {checked && (
                    <Check
                        size={10}
                        strokeWidth={3}
                        className="text-[#246bdb]"
                    />
                )}
            </span>
        </button>
    );
};

const getMinimumScheduleDate = () => {
    const date = new Date();
    date.setMinutes(
        date.getMinutes() - date.getTimezoneOffset()
    );

    return date.toISOString().slice(0, 16);
};

const BlogPostPublishingSettings = ({
    status = "draft",
    visibility = "public",
    isFeatured = false,
    allowComments = true,
    scheduledAt = "",
    onChange,
    disabled = false,
    errors = {},
}) => {
    const statusError = firstError(
        errors.status
    );

    const visibilityError = firstError(
        errors.visibility
    );

    const scheduledAtError = firstError(
        errors.scheduled_at
    );

    return (
        <div
            className="
                overflow-hidden
                rounded-[18px]
                border
                border-[#e1e3e7]
                bg-white
                shadow-[0_2px_7px_rgba(0,0,0,0.04)]
            "
        >
            <div className="px-5 pb-5 pt-5">
                <div className="mb-4">
                    <h2
                        className="
                            text-[16px]
                            font-semibold
                            text-[#161719]
                        "
                    >
                        Visibility
                    </h2>

                    <p
                        className="
                            mt-1
                            text-[12px]
                            leading-5
                            text-[#858890]
                        "
                    >
                        Control when and how this post
                        appears.
                    </p>
                </div>

                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="blog-post-status"
                            className="
                                mb-2
                                block
                                text-[13px]
                                font-medium
                                text-[#25272a]
                            "
                        >
                            Status
                        </label>

                        <select
                            id="blog-post-status"
                            value={status}
                            disabled={disabled}
                            onChange={(event) =>
                                onChange?.(
                                    "status",
                                    event.target.value
                                )
                            }
                            className={`
                                h-[44px]
                                w-full
                                rounded-[13px]
                                border
                                bg-white
                                px-3.5
                                text-[14px]
                                text-[#24262a]
                                outline-none
                                transition
                                focus:border-[#85afff]
                                focus:ring-2
                                focus:ring-[#e4edff]
                                disabled:cursor-not-allowed
                                disabled:bg-[#f5f6f7]
                                ${statusError
                                    ? "border-[#ef4444]"
                                    : "border-[#dfe1e5]"
                                }
                            `}
                        >
                            {BLOG_POST_STATUSES.map(
                                (option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                )
                            )}
                        </select>

                        {statusError && (
                            <p className="mt-1.5 text-[12px] text-[#dc2626]">
                                {statusError}
                            </p>
                        )}
                    </div>

                    <div>
                        <label
                            htmlFor="blog-post-visibility"
                            className="
                                mb-2
                                block
                                text-[13px]
                                font-medium
                                text-[#25272a]
                            "
                        >
                            Visibility
                        </label>

                        <select
                            id="blog-post-visibility"
                            value={visibility}
                            disabled={disabled}
                            onChange={(event) =>
                                onChange?.(
                                    "visibility",
                                    event.target.value
                                )
                            }
                            className={`
                                h-[44px]
                                w-full
                                rounded-[13px]
                                border
                                bg-white
                                px-3.5
                                text-[14px]
                                text-[#24262a]
                                outline-none
                                transition
                                focus:border-[#85afff]
                                focus:ring-2
                                focus:ring-[#e4edff]
                                disabled:cursor-not-allowed
                                disabled:bg-[#f5f6f7]
                                ${visibilityError
                                    ? "border-[#ef4444]"
                                    : "border-[#dfe1e5]"
                                }
                            `}
                        >
                            {BLOG_POST_VISIBILITIES.map(
                                (option) => (
                                    <option
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </option>
                                )
                            )}
                        </select>

                        {visibilityError && (
                            <p className="mt-1.5 text-[12px] text-[#dc2626]">
                                {visibilityError}
                            </p>
                        )}
                    </div>

                    {status === "scheduled" && (
                        <div
                            className="
                                rounded-[14px]
                                border
                                border-[#dbe6ff]
                                bg-[#f7faff]
                                p-3.5
                            "
                        >
                            <label
                                htmlFor="blog-post-scheduled-at"
                                className="
                                    mb-2
                                    flex
                                    items-center
                                    gap-2
                                    text-[13px]
                                    font-medium
                                    text-[#25272a]
                                "
                            >
                                <CalendarClock
                                    size={16}
                                    className="text-[#246bdb]"
                                />

                                Publish date and time
                            </label>

                            <input
                                id="blog-post-scheduled-at"
                                type="datetime-local"
                                value={scheduledAt || ""}
                                min={getMinimumScheduleDate()}
                                disabled={disabled}
                                onChange={(event) =>
                                    onChange?.(
                                        "scheduled_at",
                                        event.target.value
                                    )
                                }
                                className={`
                                    h-[44px]
                                    w-full
                                    rounded-[12px]
                                    border
                                    bg-white
                                    px-3.5
                                    text-[14px]
                                    text-[#24262a]
                                    outline-none
                                    transition
                                    focus:border-[#85afff]
                                    focus:ring-2
                                    focus:ring-[#e4edff]
                                    disabled:cursor-not-allowed
                                    disabled:bg-[#f5f6f7]
                                    ${scheduledAtError
                                        ? "border-[#ef4444]"
                                        : "border-[#cfdcff]"
                                    }
                                `}
                            />

                            {scheduledAtError ? (
                                <p className="mt-1.5 text-[12px] text-[#dc2626]">
                                    {scheduledAtError}
                                </p>
                            ) : (
                                <p className="mt-2 text-[11px] text-[#737780]">
                                    The post will publish
                                    automatically at this time.
                                </p>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="border-t border-[#eceef1]">
                <div
                    className="
                        flex
                        items-center
                        justify-between
                        gap-4
                        px-5
                        py-4
                    "
                >
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-[#fff7e5]
                                text-[#d68a00]
                            "
                        >
                            <Star
                                size={17}
                                strokeWidth={1.8}
                            />
                        </div>

                        <div className="min-w-0">
                            <p
                                className="
                                    text-[13px]
                                    font-medium
                                    text-[#232529]
                                "
                            >
                                Featured post
                            </p>

                            <p className="mt-0.5 text-[11px] text-[#858890]">
                                Highlight this post on the
                                storefront.
                            </p>
                        </div>
                    </div>

                    <Switch
                        checked={Boolean(isFeatured)}
                        disabled={disabled}
                        onChange={(value) =>
                            onChange?.(
                                "is_featured",
                                value
                            )
                        }
                    />
                </div>

                <div
                    className="
                        flex
                        items-center
                        justify-between
                        gap-4
                        border-t
                        border-[#eceef1]
                        px-5
                        py-4
                    "
                >
                    <div className="flex min-w-0 items-center gap-3">
                        <div
                            className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-full
                                bg-[#edf5ff]
                                text-[#246bdb]
                            "
                        >
                            <MessageCircle
                                size={17}
                                strokeWidth={1.8}
                            />
                        </div>

                        <div className="min-w-0">
                            <p
                                className="
                                    text-[13px]
                                    font-medium
                                    text-[#232529]
                                "
                            >
                                Allow comments
                            </p>

                            <p className="mt-0.5 text-[11px] text-[#858890]">
                                Let customers comment on this
                                post.
                            </p>
                        </div>
                    </div>

                    <Switch
                        checked={Boolean(allowComments)}
                        disabled={disabled}
                        onChange={(value) =>
                            onChange?.(
                                "allow_comments",
                                value
                            )
                        }
                    />
                </div>
            </div>

            <div
                className="
                    flex
                    items-start
                    gap-2.5
                    border-t
                    border-[#eceef1]
                    bg-[#fafbfc]
                    px-5
                    py-3.5
                "
            >
                <Eye
                    size={15}
                    strokeWidth={1.8}
                    className="mt-0.5 shrink-0 text-[#777b83]"
                />

                <p className="text-[11px] leading-5 text-[#777b83]">
                    {visibility === "private"
                        ? "Only authorized users can view this post."
                        : "This post will be visible to everyone when published."}
                </p>
            </div>
        </div>
    );
};

export default BlogPostPublishingSettings;