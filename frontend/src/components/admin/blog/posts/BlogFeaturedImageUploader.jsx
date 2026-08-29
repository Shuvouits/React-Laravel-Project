import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    Image as ImageIcon,
    Sparkles,
    Trash2,
    Upload,
} from "lucide-react";

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
];

const MAX_FILE_SIZE =
    5 * 1024 * 1024;

const BlogFeaturedImageUploader = ({
    file = null,
    imageUrl = "",
    altText = "",
    onFileChange,
    onAltTextChange,
    onRemove,
    onOpenAI,
    disabled = false,
    error = "",
    altError = "",
}) => {
    const inputRef = useRef(null);

    const [dragging, setDragging] =
        useState(false);

    const [localError, setLocalError] =
        useState("");

    const [localPreview, setLocalPreview] =
        useState("");

    useEffect(() => {
        if (!file) {
            setLocalPreview("");
            return;
        }

        const objectUrl =
            URL.createObjectURL(file);

        setLocalPreview(objectUrl);

        return () => {
            URL.revokeObjectURL(
                objectUrl
            );
        };
    }, [file]);

    const preview =
        localPreview || imageUrl || "";

    const processFile = (
        selectedFile
    ) => {
        setLocalError("");

        if (
            !selectedFile ||
            disabled
        ) {
            return;
        }

        if (
            !ALLOWED_TYPES.includes(
                selectedFile.type
            )
        ) {
            setLocalError(
                "Only JPG, PNG, WebP, and GIF images are allowed."
            );

            return;
        }

        if (
            selectedFile.size >
            MAX_FILE_SIZE
        ) {
            setLocalError(
                "Image size cannot exceed 5 MB."
            );

            return;
        }

        onFileChange?.(
            selectedFile
        );
    };

    const handleInputChange = (
        event
    ) => {
        const selectedFile =
            event.target.files?.[0];

        processFile(
            selectedFile
        );

        event.target.value = "";
    };

    const handleDragOver = (
        event
    ) => {
        event.preventDefault();

        if (!disabled) {
            setDragging(true);
        }
    };

    const handleDragLeave = (
        event
    ) => {
        event.preventDefault();

        setDragging(false);
    };

    const handleDrop = (
        event
    ) => {
        event.preventDefault();
        setDragging(false);

        if (disabled) {
            return;
        }

        const selectedFile =
            event.dataTransfer
                ?.files?.[0];

        processFile(
            selectedFile
        );
    };

    const handlePaste = (
        event
    ) => {
        if (disabled) {
            return;
        }

        const clipboardItems =
            Array.from(
                event.clipboardData
                    ?.items || []
            );

        const imageItem =
            clipboardItems.find(
                (item) =>
                    item.type.startsWith(
                        "image/"
                    )
            );

        if (!imageItem) {
            return;
        }

        event.preventDefault();

        processFile(
            imageItem.getAsFile()
        );
    };

    const handleRemove = () => {
        setLocalError("");
        setLocalPreview("");

        if (inputRef.current) {
            inputRef.current.value = "";
        }

        onRemove?.();
    };

    const imageError =
        localError || error;

    return (
        <section className="rounded-[18px] border border-[#dfe1e4] bg-white p-6 shadow-[0_2px_7px_rgba(0,0,0,0.04)]">
            <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-[17px] font-semibold text-[#151619]">
                        Featured image
                    </h2>

                    <p className="mt-1 text-[12px] text-[#858890]">
                        Used on blog cards,
                        social previews, and
                        the post page.
                    </p>
                </div>

                {onOpenAI && (
                    <button
                        type="button"
                        onClick={onOpenAI}
                        disabled={disabled}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#ffb347] via-[#ff68ac] to-[#45c8ed] px-3 text-[12px] font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Sparkles
                            size={15}
                        />

                        AI Studio
                    </button>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={
                    handleInputChange
                }
                disabled={disabled}
                className="hidden"
            />

            {preview ? (
                <div
                    className={`
                        overflow-hidden
                        rounded-[16px]
                        border
                        bg-[#f5f6f7]
                        ${
                            imageError
                                ? "border-red-400"
                                : "border-[#dfe1e5]"
                        }
                    `}
                >
                    <div className="relative aspect-[16/8] overflow-hidden bg-[#f3f4f5]">
                        <img
                            src={preview}
                            alt={
                                altText ||
                                "Blog featured preview"
                            }
                            className="h-full w-full object-cover"
                        />

                        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/65 via-black/25 to-transparent px-4 pb-4 pt-12">
                            <button
                                type="button"
                                onClick={() =>
                                    inputRef.current?.click()
                                }
                                disabled={
                                    disabled
                                }
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-white px-4 text-[12px] font-semibold text-[#292b2f] shadow-sm transition hover:bg-[#f6f6f7] disabled:opacity-50"
                            >
                                <Upload
                                    size={15}
                                />

                                Replace image
                            </button>

                            <button
                                type="button"
                                onClick={
                                    handleRemove
                                }
                                disabled={
                                    disabled
                                }
                                title="Remove featured image"
                                className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white text-red-600 shadow-sm transition hover:bg-red-50 disabled:opacity-50"
                            >
                                <Trash2
                                    size={16}
                                />
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                        inputRef.current?.click()
                    }
                    onDragOver={
                        handleDragOver
                    }
                    onDragLeave={
                        handleDragLeave
                    }
                    onDrop={handleDrop}
                    onPaste={
                        handlePaste
                    }
                    className={`
                        flex
                        min-h-[190px]
                        w-full
                        flex-col
                        items-center
                        justify-center
                        rounded-[16px]
                        border
                        border-dashed
                        px-6
                        py-8
                        text-center
                        outline-none
                        transition
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                        ${
                            imageError
                                ? "border-red-400 bg-red-50/30"
                                : dragging
                                  ? "border-[#2167d9] bg-[#f1f6ff]"
                                  : "border-[#cfd2d7] bg-[#fcfcfd] hover:border-[#89aff4] hover:bg-[#f8fbff]"
                        }
                    `}
                >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f0f2f5] text-[#73767e]">
                        {dragging ? (
                            <ImageIcon
                                size={22}
                            />
                        ) : (
                            <Upload
                                size={22}
                            />
                        )}
                    </span>

                    <span className="mt-4 text-[14px] font-semibold text-[#292b30]">
                        {dragging
                            ? "Drop image here"
                            : "Drag and drop files here, or click to browse"}
                    </span>

                    <span className="mt-1.5 text-[12px] text-[#858890]">
                        JPG, PNG, WebP or
                        GIF. Maximum 5 MB.
                    </span>

                    <span className="mt-1 text-[11px] text-[#a0a3aa]">
                        You can also paste an
                        image with Ctrl+V.
                    </span>
                </button>
            )}

            {imageError && (
                <p className="mt-2 text-[12px] text-red-600">
                    {imageError}
                </p>
            )}

            <div className="mt-5">
                <label
                    htmlFor="blog-featured-image-alt"
                    className="mb-2 block text-[13px] font-medium text-[#25272b]"
                >
                    Image alt text
                </label>

                <input
                    id="blog-featured-image-alt"
                    type="text"
                    value={altText}
                    onChange={(event) =>
                        onAltTextChange?.(
                            event.target.value
                        )
                    }
                    maxLength={255}
                    disabled={disabled}
                    placeholder="Describe the image"
                    className={`
                        h-11
                        w-full
                        rounded-[12px]
                        border
                        bg-white
                        px-4
                        text-[13px]
                        text-[#25272b]
                        outline-none
                        transition
                        placeholder:text-[#a0a3aa]
                        focus:ring-2
                        focus:ring-blue-100
                        disabled:bg-[#f5f5f6]
                        ${
                            altError
                                ? "border-red-400 focus:border-red-400"
                                : "border-[#dfe1e5] focus:border-[#79a8ff]"
                        }
                    `}
                />

                <div className="mt-1.5 flex items-start justify-between gap-3">
                    <div>
                        {altError && (
                            <p className="text-[12px] text-red-600">
                                {altError}
                            </p>
                        )}
                    </div>

                    <span className="text-[11px] text-[#94979e]">
                        {altText.length}/255
                    </span>
                </div>
            </div>
        </section>
    );
};

export default BlogFeaturedImageUploader;