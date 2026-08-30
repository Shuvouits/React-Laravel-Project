import {
    Link2,
    Mail,
    MapPin,
    Phone,
    Plus,
    Save,
    Trash2,
    X,
} from "lucide-react";
import {
    useEffect,
    useState,
} from "react";

const createLink = () => ({
    id: `footer-link-${Date.now()}-${Math.random()}`,
    label: "",
    url: "",
});

const FooterEditorModal = ({
    open,
    section,
    onClose,
    onSave,
}) => {
    const [draft, setDraft] =
        useState(null);

    useEffect(() => {
        if (!open || !section) {
            return;
        }

        setDraft(
            JSON.parse(
                JSON.stringify(section)
            )
        );
    }, [
        open,
        section,
    ]);

    if (
        !open ||
        !section ||
        !draft
    ) {
        return null;
    }

    const handleFieldChange = (
        field,
        value
    ) => {
        setDraft((previous) => ({
            ...previous,
            [field]: value,
        }));
    };

    const handleLinkChange = (
        index,
        field,
        value
    ) => {
        setDraft((previous) => ({
            ...previous,
            links: previous.links.map(
                (item, itemIndex) => {
                    if (itemIndex !== index) {
                        return item;
                    }

                    return {
                        ...item,
                        [field]: value,
                    };
                }
            ),
        }));
    };

    const handleAddLink = () => {
        setDraft((previous) => ({
            ...previous,
            links: [
                ...(previous.links || []),
                createLink(),
            ],
        }));
    };

    const handleRemoveLink = (
        index
    ) => {
        setDraft((previous) => ({
            ...previous,
            links: previous.links.filter(
                (_, itemIndex) =>
                    itemIndex !== index
            ),
        }));
    };

    const handleSubmit = (
        event
    ) => {
        event.preventDefault();
        onSave(draft);
    };

    const renderStoreFields = () => (
        <div className="space-y-[15px]">
            <div>
                <label className="mb-[7px] block text-[12px] font-semibold text-[#34373c]">
                    Store name
                </label>

                <input
                    type="text"
                    value={
                        draft.store_name ||
                        ""
                    }
                    onChange={(event) =>
                        handleFieldChange(
                            "store_name",
                            event.target.value
                        )
                    }
                    className="h-[44px] w-full rounded-[10px] border border-[#dfe1e5] px-[13px] text-[13px] outline-none transition focus:border-[#1769ff] focus:ring-2 focus:ring-[#1769ff]/10"
                />
            </div>

            <div>
                <label className="mb-[7px] block text-[12px] font-semibold text-[#34373c]">
                    Description
                </label>

                <textarea
                    value={
                        draft.description ||
                        ""
                    }
                    onChange={(event) =>
                        handleFieldChange(
                            "description",
                            event.target.value
                        )
                    }
                    rows={4}
                    className="w-full resize-none rounded-[10px] border border-[#dfe1e5] px-[13px] py-[11px] text-[13px] leading-[1.55] outline-none transition focus:border-[#1769ff] focus:ring-2 focus:ring-[#1769ff]/10"
                />
            </div>

            <div>
                <label className="mb-[7px] block text-[12px] font-semibold text-[#34373c]">
                    Contact heading
                </label>

                <input
                    type="text"
                    value={
                        draft.contact_title ||
                        ""
                    }
                    onChange={(event) =>
                        handleFieldChange(
                            "contact_title",
                            event.target.value
                        )
                    }
                    className="h-[44px] w-full rounded-[10px] border border-[#dfe1e5] px-[13px] text-[13px] outline-none transition focus:border-[#1769ff] focus:ring-2 focus:ring-[#1769ff]/10"
                />
            </div>

            <div className="relative">
                <Phone
                    size={16}
                    className="absolute left-[13px] top-[14px] text-[#7d828a]"
                />

                <input
                    type="text"
                    value={
                        draft.phone || ""
                    }
                    onChange={(event) =>
                        handleFieldChange(
                            "phone",
                            event.target.value
                        )
                    }
                    placeholder="Phone number"
                    className="h-[44px] w-full rounded-[10px] border border-[#dfe1e5] pl-[40px] pr-[13px] text-[13px] outline-none transition focus:border-[#1769ff] focus:ring-2 focus:ring-[#1769ff]/10"
                />
            </div>

            <div className="relative">
                <Mail
                    size={16}
                    className="absolute left-[13px] top-[14px] text-[#7d828a]"
                />

                <input
                    type="email"
                    value={
                        draft.email || ""
                    }
                    onChange={(event) =>
                        handleFieldChange(
                            "email",
                            event.target.value
                        )
                    }
                    placeholder="Email address"
                    className="h-[44px] w-full rounded-[10px] border border-[#dfe1e5] pl-[40px] pr-[13px] text-[13px] outline-none transition focus:border-[#1769ff] focus:ring-2 focus:ring-[#1769ff]/10"
                />
            </div>

            <div className="relative">
                <MapPin
                    size={16}
                    className="absolute left-[13px] top-[14px] text-[#7d828a]"
                />

                <input
                    type="text"
                    value={
                        draft.address || ""
                    }
                    onChange={(event) =>
                        handleFieldChange(
                            "address",
                            event.target.value
                        )
                    }
                    placeholder="Store address"
                    className="h-[44px] w-full rounded-[10px] border border-[#dfe1e5] pl-[40px] pr-[13px] text-[13px] outline-none transition focus:border-[#1769ff] focus:ring-2 focus:ring-[#1769ff]/10"
                />
            </div>
        </div>
    );

    const renderLinksFields = () => (
        <div>
            <div>
                <label className="mb-[7px] block text-[12px] font-semibold text-[#34373c]">
                    Section title
                </label>

                <input
                    type="text"
                    value={
                        draft.title || ""
                    }
                    onChange={(event) =>
                        handleFieldChange(
                            "title",
                            event.target.value
                        )
                    }
                    className="h-[44px] w-full rounded-[10px] border border-[#dfe1e5] px-[13px] text-[13px] outline-none transition focus:border-[#1769ff] focus:ring-2 focus:ring-[#1769ff]/10"
                />
            </div>

            <div className="mt-[18px] flex items-center justify-between">
                <div>
                    <h4 className="text-[13px] font-semibold text-[#292c31]">
                        Menu links
                    </h4>

                    <p className="mt-[2px] text-[11px] text-[#81858c]">
                        Change labels and destination URLs.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={
                        handleAddLink
                    }
                    className="flex h-[34px] items-center gap-[5px] rounded-[8px] border border-[#d7e3fa] bg-[#f5f9ff] px-[10px] text-[11px] font-semibold text-[#1769ff] transition hover:bg-[#eaf3ff]"
                >
                    <Plus size={14} />
                    Add Link
                </button>
            </div>

            <div className="mt-[12px] space-y-[10px]">
                {(draft.links || []).map(
                    (item, index) => (
                        <div
                            key={
                                item.id ||
                                index
                            }
                            className="rounded-[11px] border border-[#e1e3e7] bg-[#fafafa] p-[11px]"
                        >
                            <div className="grid grid-cols-1 gap-[9px] sm:grid-cols-[0.85fr_1.5fr_34px]">
                                <input
                                    type="text"
                                    value={
                                        item.label ||
                                        ""
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        handleLinkChange(
                                            index,
                                            "label",
                                            event
                                                .target
                                                .value
                                        )
                                    }
                                    placeholder="Label"
                                    className="h-[39px] rounded-[8px] border border-[#dfe1e5] bg-white px-[11px] text-[12px] outline-none focus:border-[#1769ff]"
                                />

                                <div className="relative">
                                    <Link2
                                        size={14}
                                        className="absolute left-[10px] top-[13px] text-[#858990]"
                                    />

                                    <input
                                        type="text"
                                        value={
                                            item.url ||
                                            ""
                                        }
                                        onChange={(
                                            event
                                        ) =>
                                            handleLinkChange(
                                                index,
                                                "url",
                                                event
                                                    .target
                                                    .value
                                            )
                                        }
                                        placeholder="/page or https://..."
                                        className="h-[39px] w-full rounded-[8px] border border-[#dfe1e5] bg-white pl-[32px] pr-[10px] text-[12px] outline-none focus:border-[#1769ff]"
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        handleRemoveLink(
                                            index
                                        )
                                    }
                                    title="Remove link"
                                    className="flex h-[34px] w-[34px] items-center justify-center self-center rounded-full text-[#df3f48] transition hover:bg-[#ffedef]"
                                >
                                    <Trash2
                                        size={15}
                                    />
                                </button>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );

    const renderCopyrightField = () => (
        <div>
            <label className="mb-[7px] block text-[12px] font-semibold text-[#34373c]">
                Copyright text
            </label>

            <input
                type="text"
                value={
                    draft.text || ""
                }
                onChange={(event) =>
                    handleFieldChange(
                        "text",
                        event.target.value
                    )
                }
                placeholder="© 2026 Storify. All rights reserved."
                className="h-[44px] w-full rounded-[10px] border border-[#dfe1e5] px-[13px] text-[13px] outline-none transition focus:border-[#1769ff] focus:ring-2 focus:ring-[#1769ff]/10"
            />
        </div>
    );

    return (
        <div
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-[#101216]/50 px-4 py-6 backdrop-blur-[2px]"
            onMouseDown={(event) => {
                if (
                    event.target ===
                    event.currentTarget
                ) {
                    onClose();
                }
            }}
        >
            <form
                onSubmit={
                    handleSubmit
                }
                className="flex max-h-[88vh] w-full max-w-[650px] flex-col overflow-hidden rounded-[18px] border border-[#e2e4e8] bg-white shadow-[0_28px_80px_rgba(0,0,0,0.24)]"
            >
                <div className="flex items-start justify-between border-b border-[#eceef1] px-[20px] py-[17px]">
                    <div>
                        <h3 className="text-[18px] font-semibold text-[#181a1e]">
                            Edit{" "}
                            {draft.editor_title ||
                                draft.title ||
                                "Footer Section"}
                        </h3>

                        <p className="mt-[3px] text-[12px] text-[#777c84]">
                            Update the text and links shown in this footer section.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#747980] transition hover:bg-[#f1f2f4] hover:text-[#111]"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="overflow-y-auto px-[20px] py-[18px]">
                    {draft.type ===
                        "store" &&
                        renderStoreFields()}

                    {draft.type ===
                        "menu" &&
                        renderLinksFields()}

                    {draft.type ===
                        "social" &&
                        renderLinksFields()}

                    {draft.type ===
                        "copyright" &&
                        renderCopyrightField()}
                </div>

                <div className="flex items-center justify-end gap-[9px] border-t border-[#eceef1] bg-[#fafafa] px-[20px] py-[14px]">
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-[40px] rounded-[9px] border border-[#dadde2] bg-white px-[17px] text-[12px] font-semibold text-[#45484e] transition hover:bg-[#f4f5f6]"
                    >
                        Cancel
                    </button>

                    <button
                        type="submit"
                        className="flex h-[40px] items-center gap-[7px] rounded-[9px] bg-[#2065D1] px-[18px] text-[12px] font-semibold text-white transition hover:bg-[#1858bb]"
                    >
                        <Save size={15} />
                        Apply Changes
                    </button>
                </div>
            </form>
        </div>
    );
};

export default FooterEditorModal;