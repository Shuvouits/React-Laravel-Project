import {
    LoaderCircle,
    Trash2,
    X,
} from "lucide-react";

const BlogCategoryDeleteModal = ({
    open,
    category,
    deleting = false,
    onClose,
    onConfirm,
}) => {
    if (!open || !category) {
        return null;
    }

    const handleBackdropClick = (
        event
    ) => {
        if (
            event.target ===
            event.currentTarget
        ) {
            onClose?.();
        }
    };

    return (
        <div
            onMouseDown={
                handleBackdropClick
            }
            className="
                fixed
                inset-0
                z-[200]
                flex
                items-center
                justify-center
                bg-black/55
                px-4
                backdrop-blur-[3px]
            "
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-blog-category-title"
                className="
                    relative
                    w-full
                    max-w-[500px]
                    overflow-hidden
                    rounded-[22px]
                    bg-white
                    shadow-[0_25px_80px_rgba(0,0,0,0.25)]
                "
            >
                {/* Red accent */}
                <div className="h-[3px] w-full bg-[#ef3340]" />

                {/* Close */}
                <button
                    type="button"
                    onClick={onClose}
                    disabled={deleting}
                    aria-label="Close"
                    className="
                        absolute
                        right-4
                        top-5
                        flex
                        h-9
                        w-9
                        items-center
                        justify-center
                        rounded-full
                        text-[#8a8d94]
                        transition
                        hover:bg-[#f4f4f5]
                        hover:text-[#222326]
                        disabled:cursor-not-allowed
                        disabled:opacity-50
                    "
                >
                    <X
                        size={18}
                        strokeWidth={1.8}
                    />
                </button>

                {/* Body */}
                <div className="px-7 pb-7 pt-8 text-center">
                    <div
                        className="
                            mx-auto
                            flex
                            h-[58px]
                            w-[58px]
                            items-center
                            justify-center
                            rounded-full
                            bg-[#fff0f1]
                            text-[#ed1c2e]
                        "
                    >
                        <Trash2
                            size={25}
                            strokeWidth={1.9}
                        />
                    </div>

                    <h2
                        id="delete-blog-category-title"
                        className="
                            mt-5
                            text-[21px]
                            font-semibold
                            tracking-[-0.025em]
                            text-[#151619]
                        "
                    >
                        Delete category?
                    </h2>

                    <p
                        className="
                            mx-auto
                            mt-2
                            max-w-[380px]
                            text-[14px]
                            leading-6
                            text-[#73767e]
                        "
                    >
                        <span className="font-medium text-[#3a3c41]">
                            “{category.name}”
                        </span>{" "}
                        will be removed. This
                        action cannot be undone.
                    </p>

                    {Number(
                        category.posts_count || 0
                    ) > 0 && (
                        <div
                            className="
                                mt-4
                                rounded-[12px]
                                border
                                border-[#f5d6d9]
                                bg-[#fff7f7]
                                px-4
                                py-3
                                text-left
                                text-[12px]
                                leading-5
                                text-[#a13b43]
                            "
                        >
                            This category is
                            currently assigned to{" "}
                            <strong>
                                {
                                    category.posts_count
                                }{" "}
                                {Number(
                                    category.posts_count
                                ) === 1
                                    ? "post"
                                    : "posts"}
                            </strong>
                            . The posts will remain,
                            but this category will be
                            removed from them.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div
                    className="
                        grid
                        grid-cols-2
                        gap-3
                        border-t
                        border-[#ececef]
                        bg-[#fafafa]
                        px-7
                        py-5
                    "
                >
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={deleting}
                        className="
                            flex
                            h-12
                            items-center
                            justify-center
                            rounded-[13px]
                            border
                            border-[#dcdee2]
                            bg-white
                            text-[14px]
                            font-semibold
                            text-[#313338]
                            transition
                            hover:bg-[#f5f5f6]
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={deleting}
                        className="
                            flex
                            h-12
                            items-center
                            justify-center
                            gap-2
                            rounded-[13px]
                            bg-[#ed0014]
                            text-[14px]
                            font-semibold
                            text-white
                            transition
                            hover:bg-[#d90012]
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                        "
                    >
                        {deleting ? (
                            <>
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                                Deleting...
                            </>
                        ) : (
                            <>
                                <Trash2
                                    size={16}
                                    strokeWidth={1.9}
                                />
                                Delete
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BlogCategoryDeleteModal;