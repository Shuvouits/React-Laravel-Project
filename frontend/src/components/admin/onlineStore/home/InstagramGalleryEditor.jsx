import {
    Eye,
    EyeOff,
    GripVertical,
    ImagePlus,
    Plus,
    Trash2,
    Upload,
} from "lucide-react";

const createImageItem = () => ({
    id: `instagram-image-${Date.now()}-${Math.random()}`,
    image: null,
    image_url: "",
    saved_image_url: "",
    image_alt: "",
    link: "",
    is_active: true,
    uploading: false,
});

const InstagramGalleryEditor = ({
    draft,
    onChange,
}) => {
    const images = Array.isArray(draft?.images)
        ? draft.images
        : [];

    const updateImages = (nextImages) => {
        onChange("images", nextImages);
    };

    const handleImageChange = (
        index,
        field,
        value
    ) => {
        const nextImages = images.map(
            (item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                return {
                    ...item,
                    [field]: value,
                };
            }
        );

        updateImages(nextImages);
    };

    const handleFileChange = (
        index,
        event
    ) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
        ];

        if (!allowedTypes.includes(file.type)) {
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            event.target.value = "";
            return;
        }

        const previewUrl =
            URL.createObjectURL(file);

        const nextImages = images.map(
            (item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                if (
                    item.image_url &&
                    item.image_url.startsWith("blob:")
                ) {
                    URL.revokeObjectURL(
                        item.image_url
                    );
                }

                return {
                    ...item,
                    image: file,
                    image_url: previewUrl,
                    image_alt:
                        item.image_alt ||
                        file.name
                            .replace(
                                /\.[^/.]+$/,
                                ""
                            )
                            .replace(
                                /[-_]+/g,
                                " "
                            ),
                };
            }
        );

        updateImages(nextImages);
        event.target.value = "";
    };

    const handleAddImage = () => {
        updateImages([
            ...images,
            createImageItem(),
        ]);
    };

    const handleRemoveImage = (index) => {
        const item = images[index];

        if (
            item?.image_url &&
            item.image_url.startsWith("blob:")
        ) {
            URL.revokeObjectURL(
                item.image_url
            );
        }

        updateImages(
            images.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            )
        );
    };

    const handleToggleImage = (index) => {
        const nextImages = images.map(
            (item, itemIndex) => {
                if (itemIndex !== index) {
                    return item;
                }

                return {
                    ...item,
                    is_active:
                        item.is_active === false,
                };
            }
        );

        updateImages(nextImages);
    };

    return (
        <div className="rounded-[12px] border border-[#e2e3e6] bg-[#fafafa] p-[16px]">
            <div className="grid grid-cols-1 gap-[16px]">
                <div>
                    <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#62656c]">
                        Title
                    </label>

                    <input
                        type="text"
                        value={draft?.title || ""}
                        onChange={(event) =>
                            onChange(
                                "title",
                                event.target.value
                            )
                        }
                        placeholder="From Instagram"
                        className="h-[46px] w-full rounded-[11px] border border-[#dfe1e5] bg-white px-[14px] text-[14px] text-[#1b1c1f] outline-none transition focus:border-[#1769ff] focus:ring-2 focus:ring-[#1769ff]/10"
                    />
                </div>

                <div className="grid grid-cols-1 gap-[14px] md:grid-cols-2">
                    <div>
                        <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#62656c]">
                            Limit
                        </label>

                        <input
                            type="number"
                            min="1"
                            max="30"
                            value={draft?.limit || 10}
                            onChange={(event) =>
                                onChange(
                                    "limit",
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                            className="h-[46px] w-full rounded-[11px] border border-[#dfe1e5] bg-white px-[14px] text-[14px] text-[#1b1c1f] outline-none transition focus:border-[#1769ff] focus:ring-2 focus:ring-[#1769ff]/10"
                        />

                        <p className="mt-[6px] text-[11px] text-[#7a7d84]">
                            Choose between 1 and 30 gallery images.
                        </p>
                    </div>

                    <div>
                        <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[0.16em] text-[#62656c]">
                            Desktop Columns
                        </label>

                        <select
                            value={
                                draft?.desktop_columns ||
                                5
                            }
                            onChange={(event) =>
                                onChange(
                                    "desktop_columns",
                                    Number(
                                        event.target.value
                                    )
                                )
                            }
                            className="h-[46px] w-full rounded-[11px] border border-[#dfe1e5] bg-white px-[14px] text-[14px] text-[#1b1c1f] outline-none transition focus:border-[#1769ff] focus:ring-2 focus:ring-[#1769ff]/10"
                        >
                            <option value={3}>
                                3 columns
                            </option>

                            <option value={4}>
                                4 columns
                            </option>

                            <option value={5}>
                                5 columns
                            </option>

                            <option value={6}>
                                6 columns
                            </option>
                        </select>

                        <p className="mt-[6px] text-[11px] text-[#7a7d84]">
                            Extra images will appear through the slider.
                        </p>
                    </div>
                </div>

                <div>
                    <div className="mb-[10px] flex items-center justify-between gap-[12px]">
                        <div>
                            <h3 className="text-[14px] font-semibold text-[#17181a]">
                                Gallery Images
                            </h3>

                            <p className="mt-[2px] text-[11px] text-[#7a7d84]">
                                Add images, alt text and clickable Instagram links.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleAddImage}
                            className="inline-flex h-[38px] items-center justify-center gap-[6px] rounded-[10px] border border-[#d9e3f8] bg-white px-[13px] text-[12px] font-semibold text-[#1769ff] transition hover:border-[#b8cff8] hover:bg-[#f2f7ff]"
                        >
                            <Plus size={15} />
                            Add Image
                        </button>
                    </div>

                    {images.length === 0 ? (
                        <button
                            type="button"
                            onClick={handleAddImage}
                            className="flex min-h-[150px] w-full flex-col items-center justify-center rounded-[12px] border border-dashed border-[#cfd3d9] bg-white px-[20px] text-center transition hover:border-[#8eb5ff] hover:bg-[#f8fbff]"
                        >
                            <span className="flex h-[44px] w-[44px] items-center justify-center rounded-full bg-[#edf4ff] text-[#1769ff]">
                                <ImagePlus size={21} />
                            </span>

                            <span className="mt-[10px] text-[13px] font-semibold text-[#202124]">
                                Add your first gallery image
                            </span>

                            <span className="mt-[3px] text-[11px] text-[#7a7d84]">
                                JPG, PNG, WebP or GIF. Maximum 5 MB.
                            </span>
                        </button>
                    ) : (
                        <div className="space-y-[10px]">
                            {images.map(
                                (item, index) => (
                                    <div
                                        key={
                                            item.id ||
                                            index
                                        }
                                        className={`overflow-hidden rounded-[12px] border bg-white transition ${
                                            item.is_active ===
                                            false
                                                ? "border-[#e1e2e5] opacity-60"
                                                : "border-[#dfe1e5]"
                                        }`}
                                    >
                                        <div className="flex min-h-[54px] items-center justify-between gap-[12px] border-b border-[#ececef] px-[12px]">
                                            <div className="flex min-w-0 items-center gap-[9px]">
                                                <GripVertical
                                                    size={17}
                                                    className="shrink-0 text-[#989ba1]"
                                                />

                                                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center overflow-hidden rounded-[8px] bg-[#f1f2f4]">
                                                    {item.image_url ? (
                                                        <img
                                                            src={
                                                                item.image_url
                                                            }
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <ImagePlus
                                                            size={
                                                                16
                                                            }
                                                            className="text-[#8b8e94]"
                                                        />
                                                    )}
                                                </div>

                                                <span className="truncate text-[13px] font-semibold text-[#202124]">
                                                    Image{" "}
                                                    {index +
                                                        1}
                                                </span>

                                                {item.is_active ===
                                                    false && (
                                                    <span className="rounded-full bg-[#eeeeef] px-[7px] py-[2px] text-[9px] font-semibold uppercase text-[#777a80]">
                                                        Hidden
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-[5px]">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleToggleImage(
                                                            index
                                                        )
                                                    }
                                                    title={
                                                        item.is_active ===
                                                        false
                                                            ? "Show image"
                                                            : "Hide image"
                                                    }
                                                    className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-[#e1e3e6] text-[#666a71] transition hover:bg-[#f4f5f6]"
                                                >
                                                    {item.is_active ===
                                                    false ? (
                                                        <EyeOff
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    ) : (
                                                        <Eye
                                                            size={
                                                                15
                                                            }
                                                        />
                                                    )}
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleRemoveImage(
                                                            index
                                                        )
                                                    }
                                                    title="Remove image"
                                                    className="flex h-[32px] w-[32px] items-center justify-center rounded-full border border-[#f0d7d9] text-[#e23c46] transition hover:bg-[#fff1f2]"
                                                >
                                                    <Trash2
                                                        size={
                                                            15
                                                        }
                                                    />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 gap-[14px] p-[13px] lg:grid-cols-[190px_minmax(0,1fr)]">
                                            <label className="group relative flex min-h-[156px] cursor-pointer items-center justify-center overflow-hidden rounded-[11px] border border-dashed border-[#cfd3d9] bg-[#fafafa] transition hover:border-[#8eb5ff]">
                                                {item.image_url ? (
                                                    <>
                                                        <img
                                                            src={
                                                                item.image_url
                                                            }
                                                            alt={
                                                                item.image_alt ||
                                                                ""
                                                            }
                                                            className="h-[156px] w-full object-cover"
                                                        />

                                                        <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/35 group-hover:opacity-100">
                                                            <span className="flex items-center gap-[6px] rounded-full bg-white px-[12px] py-[7px] text-[11px] font-semibold text-[#202124] shadow">
                                                                <Upload
                                                                    size={
                                                                        14
                                                                    }
                                                                />
                                                                Replace
                                                            </span>
                                                        </span>
                                                    </>
                                                ) : (
                                                    <span className="flex flex-col items-center px-[12px] text-center">
                                                        <span className="flex h-[40px] w-[40px] items-center justify-center rounded-full bg-[#edf4ff] text-[#1769ff]">
                                                            <Upload
                                                                size={
                                                                    18
                                                                }
                                                            />
                                                        </span>

                                                        <span className="mt-[8px] text-[11px] font-semibold text-[#303238]">
                                                            Upload image
                                                        </span>

                                                        <span className="mt-[2px] text-[10px] text-[#868990]">
                                                            Maximum 5 MB
                                                        </span>
                                                    </span>
                                                )}

                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                                    onChange={(
                                                        event
                                                    ) =>
                                                        handleFileChange(
                                                            index,
                                                            event
                                                        )
                                                    }
                                                    className="hidden"
                                                />
                                            </label>

                                            <div className="grid content-start gap-[12px]">
                                                <div>
                                                    <label className="mb-[6px] block text-[10px] font-semibold uppercase tracking-[0.13em] text-[#676a70]">
                                                        Image Alt
                                                        Text
                                                    </label>

                                                    <input
                                                        type="text"
                                                        value={
                                                            item.image_alt ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleImageChange(
                                                                index,
                                                                "image_alt",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="Describe this image"
                                                        className="h-[42px] w-full rounded-[10px] border border-[#dfe1e5] bg-white px-[12px] text-[13px] outline-none transition focus:border-[#1769ff] focus:ring-2 focus:ring-[#1769ff]/10"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-[6px] block text-[10px] font-semibold uppercase tracking-[0.13em] text-[#676a70]">
                                                        Instagram
                                                        Link
                                                    </label>

                                                    <input
                                                        type="url"
                                                        value={
                                                            item.link ||
                                                            ""
                                                        }
                                                        onChange={(
                                                            event
                                                        ) =>
                                                            handleImageChange(
                                                                index,
                                                                "link",
                                                                event
                                                                    .target
                                                                    .value
                                                            )
                                                        }
                                                        placeholder="https://www.instagram.com/p/..."
                                                        className="h-[42px] w-full rounded-[10px] border border-[#dfe1e5] bg-white px-[12px] text-[13px] outline-none transition focus:border-[#1769ff] focus:ring-2 focus:ring-[#1769ff]/10"
                                                    />

                                                    <p className="mt-[5px] text-[10px] text-[#85888e]">
                                                        Leave empty if the image should not be clickable.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InstagramGalleryEditor;