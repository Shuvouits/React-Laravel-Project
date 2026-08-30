import {
    ImagePlus,
    LoaderCircle,
    Upload,
    X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

const NavbarLogoEditor = ({
    open,
    currentLogo,
    currentAlt = "Storify",
    saving = false,
    onClose,
    onSave,
}) => {
    const inputRef = useRef(null);

    const [logoFile, setLogoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [altText, setAltText] = useState(currentAlt);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        setLogoFile(null);
        setPreviewUrl(currentLogo || "");
        setAltText(currentAlt || "Storify");
        setError("");
    }, [open, currentLogo, currentAlt]);

    useEffect(() => {
        return () => {
            if (
                previewUrl &&
                previewUrl.startsWith("blob:")
            ) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [previewUrl]);

    if (!open) {
        return null;
    }

    const handleFileChange = (event) => {
        const file = event.target.files?.[0];

        if (!file) {
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        if (!allowedTypes.includes(file.type)) {
            setError(
                "Please select a JPG, PNG, or WebP image."
            );
            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setError(
                "Logo image must not exceed 5 MB."
            );
            event.target.value = "";
            return;
        }

        if (
            previewUrl &&
            previewUrl.startsWith("blob:")
        ) {
            URL.revokeObjectURL(previewUrl);
        }

        setLogoFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setError("");
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!logoFile) {
            setError(
                "Please select a new logo image."
            );
            return;
        }

        onSave({
            file: logoFile,
            alt: altText.trim() || "Storify",
        });
    };

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/45 px-4 py-6">
            <button
                type="button"
                aria-label="Close logo editor"
                className="absolute inset-0 cursor-default"
                onClick={() => {
                    if (!saving) {
                        onClose();
                    }
                }}
            />

            <form
                onSubmit={handleSubmit}
                className="relative z-[1] w-full max-w-[520px] overflow-hidden rounded-[18px] border border-[#e2e4e8] bg-white shadow-[0_24px_70px_rgba(0,0,0,0.22)]"
            >
                <div className="h-[4px] bg-gradient-to-r from-[#2b73ee] via-[#7958ed] to-[#c04ee8]" />

                <div className="flex items-start justify-between gap-5 border-b border-[#ececef] px-6 py-5">
                    <div>
                        <h2 className="text-[18px] font-semibold text-[#171717]">
                            Change navbar logo
                        </h2>

                        <p className="mt-1 text-[12px] leading-[18px] text-[#777b83]">
                            Upload the logo displayed in the storefront navbar.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-[#e2e4e7] text-[#666] transition hover:bg-[#f5f5f6] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X size={17} />
                    </button>
                </div>

                <div className="space-y-5 px-6 py-5">
                    <div>
                        <p className="mb-2 text-[12px] font-semibold text-[#40434a]">
                            Logo image
                        </p>

                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            className="flex min-h-[190px] w-full items-center justify-center overflow-hidden rounded-[14px] border border-dashed border-[#cfd4dc] bg-[#fafbfc] p-5 transition hover:border-[#8eacf0] hover:bg-[#f7f9ff]"
                        >
                            {previewUrl ? (
                                <img
                                    src={previewUrl}
                                    alt={altText || "Navbar logo preview"}
                                    className="max-h-[120px] max-w-full object-contain"
                                />
                            ) : (
                                <div className="text-center">
                                    <div className="mx-auto flex h-[52px] w-[52px] items-center justify-center rounded-full bg-[#edf3ff] text-[#3978ed]">
                                        <ImagePlus size={23} />
                                    </div>

                                    <p className="mt-3 text-[13px] font-semibold text-[#25272b]">
                                        Click to select a logo
                                    </p>

                                    <p className="mt-1 text-[11px] text-[#8a8d94]">
                                        JPG, PNG or WebP. Maximum 5 MB.
                                    </p>
                                </div>
                            )}
                        </button>

                        <input
                            ref={inputRef}
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="navbar-logo-alt"
                            className="mb-2 block text-[12px] font-semibold text-[#40434a]"
                        >
                            Logo alt text
                        </label>

                        <input
                            id="navbar-logo-alt"
                            type="text"
                            value={altText}
                            maxLength={255}
                            onChange={(event) => {
                                setAltText(event.target.value);
                                setError("");
                            }}
                            placeholder="Storify"
                            className="h-[44px] w-full rounded-[11px] border border-[#dfe1e5] px-[13px] text-[13px] text-[#333] outline-none transition placeholder:text-[#aaa] focus:border-[#7ea4ef] focus:ring-2 focus:ring-[#dce7ff]"
                        />
                    </div>

                    {error && (
                        <div className="rounded-[10px] border border-[#ffc5c5] bg-[#fff3f3] px-3 py-2 text-[12px] text-[#d93636]">
                            {error}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 border-t border-[#ececef] bg-[#fafafa] px-6 py-4">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="h-[40px] rounded-[10px] border border-[#dfe1e5] bg-white px-5 text-[13px] font-semibold text-[#45484e] transition hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        disabled={saving || !logoFile}
                        className="flex h-[40px] items-center gap-2 rounded-[10px] bg-[#246be0] px-5 text-[13px] font-semibold text-white transition hover:bg-[#175dcc] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {saving ? (
                            <LoaderCircle
                                size={15}
                                className="animate-spin"
                            />
                        ) : (
                            <Upload size={15} />
                        )}

                        {saving ? "Uploading..." : "Save Logo"}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default NavbarLogoEditor;