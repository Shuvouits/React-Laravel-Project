import { useRef } from "react";
import {
    Image as ImageIcon,
    LoaderCircle,
    UploadCloud,
} from "lucide-react";

const BecomeVendorEditor = ({
    value,
    onChange,
    onImageSelect,
}) => {
    const imageInputRef = useRef(null);

    const imageUrl =
        value?.image_url ||
        value?.saved_image_url ||
        "";

    const uploading =
        value?.uploading === true;

    const handleImageChange = (event) => {
        const file =
            event.target.files?.[0];

        if (!file) {
            return;
        }

        onImageSelect?.(file);

        event.target.value = "";
    };

    return (
        <div
            className="
                overflow-hidden
                rounded-[16px]
                !border
                !border-solid
                !border-[#e2e3e6]
                bg-[#fbfbfc]
            "
        >
            <div className="p-[18px]">
                {/* IMAGE */}

                <div>
                    <label className="mb-3 block text-[12px] font-semibold uppercase tracking-[0.22em] text-[#656970]">
                        Image
                    </label>

                    <input
                        ref={imageInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleImageChange}
                        className="hidden"
                    />

                    <button
                        type="button"
                        onClick={() => {
                            if (!uploading) {
                                imageInputRef.current?.click();
                            }
                        }}
                        disabled={uploading}
                        className="
                            group
                            relative
                            flex
                            min-h-[420px]
                            w-full
                            items-center
                            justify-center
                            overflow-hidden
                            rounded-[18px]
                            !border
                            !border-solid
                            !border-[#e1e3e7]
                            bg-[#f7f7f8]
                            p-0
                            text-left
                            transition
                            hover:!border-[#b9cff5]
                            disabled:cursor-wait
                        "
                    >
                        {imageUrl ? (
                            <>
                                <img
                                    src={imageUrl}
                                    alt={
                                        value?.image_alt ||
                                        "Become a vendor"
                                    }
                                    className="
                                        h-full
                                        max-h-[560px]
                                        min-h-[420px]
                                        w-full
                                        object-contain
                                        transition
                                        duration-300
                                        group-hover:scale-[1.01]
                                    "
                                />

                                <div
                                    className="
                                        absolute
                                        inset-0
                                        flex
                                        items-center
                                        justify-center
                                        bg-black/0
                                        opacity-0
                                        transition
                                        duration-200
                                        group-hover:bg-black/20
                                        group-hover:opacity-100
                                    "
                                >
                                    <span
                                        className="
                                            flex
                                            h-11
                                            items-center
                                            gap-2
                                            rounded-full
                                            bg-white
                                            px-5
                                            text-[13px]
                                            font-semibold
                                            text-[#202126]
                                            shadow-[0_8px_24px_rgba(0,0,0,0.18)]
                                        "
                                    >
                                        <UploadCloud
                                            size={17}
                                            strokeWidth={1.9}
                                        />

                                        Replace image
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                                <span
                                    className="
                                        flex
                                        h-14
                                        w-14
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-[#eaf2ff]
                                        text-[#2065d1]
                                    "
                                >
                                    <ImageIcon
                                        size={24}
                                        strokeWidth={1.7}
                                    />
                                </span>

                                <p className="mt-4 text-[14px] font-semibold text-[#202126]">
                                    Upload section image
                                </p>

                                <p className="mt-2 max-w-[340px] text-[12px] leading-5 text-[#858890]">
                                    Use a wide JPG, PNG or WebP image.
                                    Maximum file size is 5MB.
                                </p>

                                <span
                                    className="
                                        mt-5
                                        flex
                                        h-10
                                        items-center
                                        gap-2
                                        rounded-full
                                        bg-[#2065d1]
                                        px-5
                                        text-[13px]
                                        font-semibold
                                        text-white
                                    "
                                >
                                    <UploadCloud
                                        size={16}
                                        strokeWidth={1.9}
                                    />

                                    Choose image
                                </span>
                            </div>
                        )}

                        {uploading && (
                            <div
                                className="
                                    absolute
                                    inset-0
                                    flex
                                    flex-col
                                    items-center
                                    justify-center
                                    bg-white/85
                                    backdrop-blur-[2px]
                                "
                            >
                                <LoaderCircle
                                    size={28}
                                    className="animate-spin text-[#2065d1]"
                                />

                                <p className="mt-3 text-[13px] font-medium text-[#555861]">
                                    Uploading image...
                                </p>
                            </div>
                        )}

                        <span
                            className="
                                absolute
                                bottom-4
                                right-4
                                flex
                                h-9
                                w-9
                                items-center
                                justify-center
                                rounded-full
                                bg-white
                                text-[#555861]
                                shadow-[0_3px_12px_rgba(0,0,0,0.10)]
                            "
                        >
                            <ImageIcon
                                size={16}
                                strokeWidth={1.8}
                            />
                        </span>
                    </button>
                </div>

                {/* IMAGE ALT */}

                <div className="mt-5">
                    <EditorLabel
                        htmlFor="become-vendor-image-alt"
                    >
                        Image alt text
                    </EditorLabel>

                    <input
                        id="become-vendor-image-alt"
                        type="text"
                        value={value?.image_alt || ""}
                        onChange={(event) =>
                            onChange(
                                "image_alt",
                                event.target.value
                            )
                        }
                        placeholder="Seller managing products from a laptop"
                        className={inputClass}
                    />
                </div>

                {/* TITLE AND BUTTON LABEL */}

                <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                        <EditorLabel
                            htmlFor="become-vendor-title"
                        >
                            Title
                        </EditorLabel>

                        <input
                            id="become-vendor-title"
                            type="text"
                            value={value?.title || ""}
                            onChange={(event) =>
                                onChange(
                                    "title",
                                    event.target.value
                                )
                            }
                            placeholder="Start Selling With Us Today"
                            className={inputClass}
                        />
                    </div>

                    <div>
                        <EditorLabel
                            htmlFor="become-vendor-button-label"
                        >
                            Button label
                        </EditorLabel>

                        <input
                            id="become-vendor-button-label"
                            type="text"
                            value={
                                value?.button_label || ""
                            }
                            onChange={(event) =>
                                onChange(
                                    "button_label",
                                    event.target.value
                                )
                            }
                            placeholder="Become a Vendor"
                            className={inputClass}
                        />
                    </div>
                </div>

                {/* SUBTITLE */}

                <div className="mt-5">
                    <EditorLabel
                        htmlFor="become-vendor-subtitle"
                    >
                        Subtitle
                    </EditorLabel>

                    <textarea
                        id="become-vendor-subtitle"
                        rows={3}
                        value={value?.subtitle || ""}
                        onChange={(event) =>
                            onChange(
                                "subtitle",
                                event.target.value
                            )
                        }
                        placeholder="Join our marketplace, manage products easily, accept secure payments, and grow your business faster."
                        className="
                            block
                            min-h-[82px]
                            w-full
                            resize-y
                            rounded-[14px]
                            !border
                            !border-solid
                            !border-[#dfe1e5]
                            bg-white
                            px-4
                            py-3
                            text-[14px]
                            leading-6
                            text-[#202126]
                            outline-none
                            transition
                            placeholder:text-[#a0a3aa]
                            focus:!border-[#5d93e8]
                            focus:!ring-4
                            focus:!ring-[#2065d1]/10
                        "
                    />
                </div>

                {/* BUTTON LINK */}

                <div className="mt-5">
                    <EditorLabel
                        htmlFor="become-vendor-button-link"
                    >
                        Button link
                    </EditorLabel>

                    <input
                        id="become-vendor-button-link"
                        type="text"
                        value={
                            value?.button_link || ""
                        }
                        onChange={(event) =>
                            onChange(
                                "button_link",
                                event.target.value
                            )
                        }
                        placeholder="/become-vendor"
                        className={inputClass}
                    />

                    <p className="mt-2 text-[11px] text-[#92959c]">
                        Use an internal path such as
                        {" "}
                        <span className="font-medium text-[#656970]">
                            /become-vendor
                        </span>
                        {" "}
                        or a complete external URL.
                    </p>
                </div>
            </div>
        </div>
    );
};

const EditorLabel = ({
    htmlFor,
    children,
}) => {
    return (
        <label
            htmlFor={htmlFor}
            className="
                mb-2
                block
                text-[12px]
                font-semibold
                uppercase
                tracking-[0.22em]
                text-[#656970]
            "
        >
            {children}
        </label>
    );
};

const inputClass = `
    block
    h-[46px]
    w-full
    rounded-[14px]
    !border
    !border-solid
    !border-[#dfe1e5]
    bg-white
    px-4
    text-[14px]
    text-[#202126]
    outline-none
    transition
    placeholder:text-[#a0a3aa]
    focus:!border-[#5d93e8]
    focus:!ring-4
    focus:!ring-[#2065d1]/10
`;

export default BecomeVendorEditor;