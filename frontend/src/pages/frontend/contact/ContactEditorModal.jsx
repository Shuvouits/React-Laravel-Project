import { useEffect, useMemo, useState } from "react";
import {
    ImagePlus,
    LoaderCircle,
    Trash2,
    Upload,
    X,
} from "lucide-react";

const ContactEditorModal = ({
    open,
    section,
    saving,
    error,
    onClose,
    onSave,
    onHeroImageUpload,
    onHeroImageRemove,
}) => {
    const [form, setForm] = useState({});
    const [selectedImage, setSelectedImage] =
        useState(null);

    useEffect(() => {
        if (!open || !section) {
            return;
        }

        setForm({
            ...section,
        });

        setSelectedImage(null);
    }, [open, section]);

    const fields = useMemo(
        () => getSectionFields(section?.key),
        [section?.key]
    );

    if (!open || !section) {
        return null;
    }

    const updateField = (event) => {
        const { name, value, type } =
            event.target;

        setForm((previous) => ({
            ...previous,
            [name]:
                type === "number"
                    ? Number(value)
                    : value,
        }));
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        const payload = {
            ...form,
            key: section.key,
        };

        delete payload.background_image_url;

        onSave(payload);
    };

    const handleImageUpload = () => {
        if (!selectedImage) {
            return;
        }

        onHeroImageUpload(selectedImage);
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-[#07111f]/70 px-4 py-6 backdrop-blur-[3px]">
            <div className="relative flex max-h-[92vh] w-full max-w-[720px] flex-col overflow-hidden rounded-[18px] bg-white shadow-[0_30px_90px_rgba(0,0,0,0.28)]">
                <div className="h-[4px] w-full bg-[#2065D1]" />

                <div className="flex items-start justify-between border-b border-[#eceef1] px-[24px] py-[20px] sm:px-[30px]">
                    <div>
                        <h2 className="text-[20px] font-bold text-[#161616]">
                            {section.editor_title ||
                                "Edit Contact Section"}
                        </h2>

                        <p className="mt-[5px] text-[12px] text-[#777]">
                            Update the content displayed on
                            the contact page.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={saving}
                        className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#e4e4e4] text-[#666] transition hover:bg-[#f5f5f5] hover:text-[#111]"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="flex min-h-0 flex-1 flex-col"
                >
                    <div className="flex-1 overflow-y-auto px-[24px] py-[24px] sm:px-[30px]">
                        {section.key === "hero" && (
                            <HeroImageEditor
                                form={form}
                                selectedImage={
                                    selectedImage
                                }
                                saving={saving}
                                onImageSelect={
                                    setSelectedImage
                                }
                                onUpload={
                                    handleImageUpload
                                }
                                onRemove={
                                    onHeroImageRemove
                                }
                            />
                        )}

                        <div className="grid gap-[18px] sm:grid-cols-2">
                            {fields.map((field) => (
                                <EditorField
                                    key={field.name}
                                    field={field}
                                    value={
                                        form[
                                            field.name
                                        ] ?? ""
                                    }
                                    onChange={
                                        updateField
                                    }
                                />
                            ))}
                        </div>

                        {error && (
                            <div className="mt-[20px] rounded-[9px] border border-red-200 bg-red-50 px-[14px] py-[12px] text-[13px] text-red-600">
                                {error}
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-end gap-[12px] border-t border-[#eceef1] bg-[#fafafa] px-[24px] py-[17px] sm:px-[30px]">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={saving}
                            className="h-[43px] rounded-[8px] border border-[#dcdfe4] bg-white px-[22px] text-[13px] font-semibold text-[#333] transition hover:bg-[#f5f5f5]"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={saving}
                            className="flex h-[43px] min-w-[130px] items-center justify-center gap-[8px] rounded-[8px] bg-[#2065D1] px-[22px] text-[13px] font-semibold text-white transition hover:bg-[#1858ba] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving && (
                                <LoaderCircle
                                    size={16}
                                    className="animate-spin"
                                />
                            )}

                            {saving
                                ? "Saving..."
                                : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const HeroImageEditor = ({
    form,
    selectedImage,
    saving,
    onImageSelect,
    onUpload,
    onRemove,
}) => {
    const preview = selectedImage
        ? URL.createObjectURL(selectedImage)
        : form.background_image_url;

    return (
        <div className="mb-[24px]">
            <label className="mb-[8px] block text-[13px] font-semibold text-[#222]">
                Background image
            </label>

            <div className="overflow-hidden rounded-[12px] border border-[#e1e4e8] bg-[#f5f6f8]">
                <div className="relative flex min-h-[190px] items-center justify-center overflow-hidden">
                    {preview ? (
                        <img
                            src={preview}
                            alt="Contact hero preview"
                            className="h-[220px] w-full object-cover"
                        />
                    ) : (
                        <div className="flex flex-col items-center py-[45px] text-[#8a8a8a]">
                            <ImagePlus size={31} />

                            <span className="mt-2 text-[12px]">
                                No background image
                            </span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-[10px] border-t border-[#e1e4e8] bg-white p-[12px]">
                    <label className="flex h-[38px] cursor-pointer items-center gap-[7px] rounded-[7px] border border-[#dcdfe4] px-[14px] text-[12px] font-semibold text-[#333] hover:bg-[#f6f6f6]">
                        <ImagePlus size={15} />
                        Choose image

                        <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(event) =>
                                onImageSelect(
                                    event.target
                                        .files?.[0] ||
                                        null
                                )
                            }
                            className="hidden"
                        />
                    </label>

                    {selectedImage && (
                        <button
                            type="button"
                            onClick={onUpload}
                            disabled={saving}
                            className="flex h-[38px] items-center gap-[7px] rounded-[7px] bg-[#2065D1] px-[14px] text-[12px] font-semibold text-white"
                        >
                            <Upload size={15} />
                            Upload image
                        </button>
                    )}

                    {form.background_image_url && (
                        <button
                            type="button"
                            onClick={onRemove}
                            disabled={saving}
                            className="ml-auto flex h-[38px] items-center gap-[7px] rounded-[7px] border border-red-200 bg-red-50 px-[14px] text-[12px] font-semibold text-red-600 hover:bg-red-100"
                        >
                            <Trash2 size={15} />
                            Remove
                        </button>
                    )}
                </div>
            </div>

            <p className="mt-[7px] text-[11px] text-[#888]">
                Recommended size: 1920 × 700 pixels.
                Maximum file size: 5 MB.
            </p>
        </div>
    );
};

const EditorField = ({
    field,
    value,
    onChange,
}) => {
    const widthClass = field.fullWidth
        ? "sm:col-span-2"
        : "";

    return (
        <div className={widthClass}>
            <label className="mb-[7px] block text-[12px] font-semibold text-[#333]">
                {field.label}
            </label>

            {field.type === "textarea" ? (
                <textarea
                    name={field.name}
                    value={value}
                    onChange={onChange}
                    rows={field.rows || 4}
                    required={field.required}
                    placeholder={field.placeholder}
                    className="w-full resize-y rounded-[8px] border border-[#dfe2e6] px-[13px] py-[11px] text-[13px] text-[#222] outline-none focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10"
                />
            ) : (
                <input
                    type={field.type || "text"}
                    name={field.name}
                    value={value}
                    onChange={onChange}
                    required={field.required}
                    min={field.min}
                    max={field.max}
                    placeholder={field.placeholder}
                    className="h-[42px] w-full rounded-[8px] border border-[#dfe2e6] px-[13px] text-[13px] text-[#222] outline-none focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10"
                />
            )}

            {field.help && (
                <p className="mt-[6px] text-[11px] leading-[1.5] text-[#888]">
                    {field.help}
                </p>
            )}
        </div>
    );
};

const getSectionFields = (sectionKey) => {
    if (sectionKey === "hero") {
        return [
            {
                name: "title",
                label: "Hero title",
                required: true,
                fullWidth: true,
            },
            {
                name: "subtitle",
                label: "Hero subtitle",
                type: "textarea",
                rows: 3,
                fullWidth: true,
            },
            {
                name: "overlay_opacity",
                label: "Image overlay opacity",
                type: "number",
                min: 0,
                max: 100,
                help: "Use a value between 0 and 100.",
            },
        ];
    }

    if (sectionKey === "contact_information") {
        return [
            {
                name: "title",
                label: "Section title",
                required: true,
                fullWidth: true,
            },
            {
                name: "description",
                label: "Section description",
                type: "textarea",
                rows: 3,
                fullWidth: true,
            },
            {
                name: "address_title",
                label: "Address heading",
                required: true,
            },
            {
                name: "address",
                label: "Office address",
                required: true,
            },
            {
                name: "email_title",
                label: "Email heading",
                required: true,
            },
            {
                name: "email",
                label: "Email address",
                type: "email",
                required: true,
            },
            {
                name: "phone_title",
                label: "Phone heading",
                required: true,
            },
            {
                name: "phone",
                label: "Phone number",
                required: true,
            },
            {
                name: "hours_title",
                label: "Hours heading",
                required: true,
            },
            {
                name: "hours",
                label: "Support hours",
                required: true,
            },
        ];
    }

    if (sectionKey === "form_content") {
        return [
            {
                name: "title",
                label: "Form title",
                required: true,
                fullWidth: true,
            },
            {
                name: "description",
                label: "Form description",
                type: "textarea",
                rows: 3,
                fullWidth: true,
            },
            {
                name: "name_label",
                label: "Name label",
                required: true,
            },
            {
                name: "name_placeholder",
                label: "Name placeholder",
            },
            {
                name: "company_label",
                label: "Company label",
                required: true,
            },
            {
                name: "company_placeholder",
                label: "Company placeholder",
            },
            {
                name: "phone_label",
                label: "Phone label",
                required: true,
            },
            {
                name: "phone_placeholder",
                label: "Phone placeholder",
            },
            {
                name: "email_label",
                label: "Email label",
                required: true,
            },
            {
                name: "email_placeholder",
                label: "Email placeholder",
            },
            {
                name: "subject_label",
                label: "Subject label",
                required: true,
            },
            {
                name: "subject_placeholder",
                label: "Subject placeholder",
            },
            {
                name: "message_label",
                label: "Message label",
                required: true,
            },
            {
                name: "message_placeholder",
                label: "Message placeholder",
            },
            {
                name: "button_text",
                label: "Button text",
                required: true,
            },
            {
                name: "success_message",
                label: "Success message",
                required: true,
                fullWidth: true,
            },
        ];
    }

    if (sectionKey === "map_content") {
        return [
            {
                name: "title",
                label: "Section title",
                required: true,
                fullWidth: true,
            },
            {
                name: "description",
                label: "Section description",
                type: "textarea",
                rows: 3,
                fullWidth: true,
            },
            {
                name: "map_embed_url",
                label: "Google Maps embed URL",
                type: "url",
                fullWidth: true,
                help: "Google Maps থেকে Share → Embed a map → iframe-এর src URL দিন।",
            },
            {
                name: "google_maps_url",
                label: "Open in Google Maps URL",
                type: "url",
                fullWidth: true,
            },
            {
                name: "link_text",
                label: "Map link text",
                required: true,
            },
        ];
    }

    return [];
};

export default ContactEditorModal;