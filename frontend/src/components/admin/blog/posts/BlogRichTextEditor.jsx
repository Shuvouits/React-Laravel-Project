import {
    useEffect,
} from "react";

import {
    EditorContent,
    useEditor,
} from "@tiptap/react";

import StarterKit
    from "@tiptap/starter-kit";

import Link
    from "@tiptap/extension-link";

import Underline
    from "@tiptap/extension-underline";

import TextAlign
    from "@tiptap/extension-text-align";

import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    Braces,
    Code2,
    Heading2,
    Heading3,
    Italic,
    Link2,
    List,
    ListOrdered,
    Pilcrow,
    Quote,
    Redo2,
    RemoveFormatting,
    Sparkles,
    Strikethrough,
    Underline as UnderlineIcon,
    Undo2,
    Unlink,
} from "lucide-react";

const ToolbarButton = ({
    active = false,
    disabled = false,
    title,
    onClick,
    children,
}) => {
    return (
        <button
            type="button"
            title={title}
            disabled={disabled}
            onClick={onClick}
            className={`
                flex
                h-9
                min-w-9
                items-center
                justify-center
                rounded-[8px]
                px-2
                text-[#5f636b]
                transition
                hover:bg-[#f0f2f5]
                hover:text-[#17181a]
                disabled:cursor-not-allowed
                disabled:opacity-35
                ${
                    active
                        ? "bg-[#eaf2ff] text-[#1769df]"
                        : ""
                }
            `}
        >
            {children}
        </button>
    );
};

const ToolbarDivider = () => {
    return (
        <div className="mx-1 h-6 w-px shrink-0 bg-[#e0e2e5]" />
    );
};

const BlogRichTextEditor = ({
    value = "",
    onChange,
    onAI,
    aiLoading = false,
    disabled = false,
    error = "",
}) => {
    const editor = useEditor({
        immediatelyRender: false,

        editable: !disabled,

        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [
                        2,
                        3,
                    ],
                },
            }),

            Underline,

            Link.configure({
                openOnClick: false,
                autolink: true,
                linkOnPaste: true,
                HTMLAttributes: {
                    target: "_blank",
                    rel:
                        "noopener noreferrer nofollow",
                    class:
                        "text-[#1769df] underline",
                },
            }),

            TextAlign.configure({
                types: [
                    "heading",
                    "paragraph",
                ],
            }),
        ],

        content: value || "",

        editorProps: {
            attributes: {
                class:
                    "min-h-[330px] px-5 py-5 text-[15px] leading-7 text-[#25272b] outline-none",
                spellcheck: "true",
            },
        },

        onUpdate: ({
            editor: currentEditor,
        }) => {
            onChange?.(
                currentEditor.getHTML()
            );
        },
    });

    useEffect(() => {
        if (!editor) {
            return;
        }

        editor.setEditable(
            !disabled
        );
    }, [
        editor,
        disabled,
    ]);

    useEffect(() => {
        if (!editor) {
            return;
        }

        const currentContent =
            editor.getHTML();

        const nextContent =
            value || "";

        if (
            currentContent === nextContent
        ) {
            return;
        }

        editor.commands.setContent(
            nextContent,
            {
                emitUpdate: false,
            }
        );
    }, [
        editor,
        value,
    ]);

    const setLink = () => {
        if (!editor) {
            return;
        }

        const previousUrl =
            editor.getAttributes(
                "link"
            )?.href || "";

        const url = window.prompt(
            "Enter link URL",
            previousUrl
        );

        if (url === null) {
            return;
        }

        if (!url.trim()) {
            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .unsetLink()
                .run();

            return;
        }

        editor
            .chain()
            .focus()
            .extendMarkRange("link")
            .setLink({
                href: url.trim(),
            })
            .run();
    };

    if (!editor) {
        return (
            <div className="flex min-h-[420px] items-center justify-center rounded-[14px] border border-[#dfe1e5] bg-white text-[13px] text-[#858890]">
                Loading editor...
            </div>
        );
    }

    return (
        <div>
            <div
                className={`
                    overflow-hidden
                    rounded-[14px]
                    border
                    bg-white
                    transition
                    ${
                        error
                            ? "border-red-400"
                            : "border-[#dfe1e5] focus-within:border-[#83aeff] focus-within:ring-2 focus-within:ring-blue-100"
                    }
                `}
            >
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-0.5 border-b border-[#e5e6e8] bg-[#fcfcfd] px-3 py-2">
                    <ToolbarButton
                        title="Undo"
                        disabled={
                            !editor.can()
                                .chain()
                                .focus()
                                .undo()
                                .run()
                        }
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .undo()
                                .run()
                        }
                    >
                        <Undo2 size={16} />
                    </ToolbarButton>

                    <ToolbarButton
                        title="Redo"
                        disabled={
                            !editor.can()
                                .chain()
                                .focus()
                                .redo()
                                .run()
                        }
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .redo()
                                .run()
                        }
                    >
                        <Redo2 size={16} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    <ToolbarButton
                        title="Paragraph"
                        active={editor.isActive(
                            "paragraph"
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .setParagraph()
                                .run()
                        }
                    >
                        <Pilcrow size={16} />
                    </ToolbarButton>

                    <ToolbarButton
                        title="Heading 2"
                        active={editor.isActive(
                            "heading",
                            {
                                level: 2,
                            }
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({
                                    level: 2,
                                })
                                .run()
                        }
                    >
                        <Heading2 size={17} />
                    </ToolbarButton>

                    <ToolbarButton
                        title="Heading 3"
                        active={editor.isActive(
                            "heading",
                            {
                                level: 3,
                            }
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleHeading({
                                    level: 3,
                                })
                                .run()
                        }
                    >
                        <Heading3 size={17} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    <ToolbarButton
                        title="Bold"
                        active={editor.isActive(
                            "bold"
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleBold()
                                .run()
                        }
                    >
                        <Bold size={16} />
                    </ToolbarButton>

                    <ToolbarButton
                        title="Italic"
                        active={editor.isActive(
                            "italic"
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleItalic()
                                .run()
                        }
                    >
                        <Italic size={16} />
                    </ToolbarButton>

                    <ToolbarButton
                        title="Underline"
                        active={editor.isActive(
                            "underline"
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleUnderline()
                                .run()
                        }
                    >
                        <UnderlineIcon
                            size={16}
                        />
                    </ToolbarButton>

                    <ToolbarButton
                        title="Strike"
                        active={editor.isActive(
                            "strike"
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleStrike()
                                .run()
                        }
                    >
                        <Strikethrough
                            size={16}
                        />
                    </ToolbarButton>

                    <ToolbarDivider />

                    <ToolbarButton
                        title="Bullet list"
                        active={editor.isActive(
                            "bulletList"
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleBulletList()
                                .run()
                        }
                    >
                        <List size={17} />
                    </ToolbarButton>

                    <ToolbarButton
                        title="Numbered list"
                        active={editor.isActive(
                            "orderedList"
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleOrderedList()
                                .run()
                        }
                    >
                        <ListOrdered
                            size={17}
                        />
                    </ToolbarButton>

                    <ToolbarButton
                        title="Blockquote"
                        active={editor.isActive(
                            "blockquote"
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleBlockquote()
                                .run()
                        }
                    >
                        <Quote size={17} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    <ToolbarButton
                        title="Inline code"
                        active={editor.isActive(
                            "code"
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleCode()
                                .run()
                        }
                    >
                        <Code2 size={16} />
                    </ToolbarButton>

                    <ToolbarButton
                        title="Code block"
                        active={editor.isActive(
                            "codeBlock"
                        )}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .toggleCodeBlock()
                                .run()
                        }
                    >
                        <Braces size={16} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    <ToolbarButton
                        title="Add or edit link"
                        active={editor.isActive(
                            "link"
                        )}
                        onClick={setLink}
                    >
                        <Link2 size={16} />
                    </ToolbarButton>

                    <ToolbarButton
                        title="Remove link"
                        disabled={
                            !editor.isActive(
                                "link"
                            )
                        }
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .unsetLink()
                                .run()
                        }
                    >
                        <Unlink size={16} />
                    </ToolbarButton>

                    <ToolbarDivider />

                    <ToolbarButton
                        title="Align left"
                        active={editor.isActive({
                            textAlign: "left",
                        })}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .setTextAlign(
                                    "left"
                                )
                                .run()
                        }
                    >
                        <AlignLeft size={16} />
                    </ToolbarButton>

                    <ToolbarButton
                        title="Align center"
                        active={editor.isActive({
                            textAlign: "center",
                        })}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .setTextAlign(
                                    "center"
                                )
                                .run()
                        }
                    >
                        <AlignCenter
                            size={16}
                        />
                    </ToolbarButton>

                    <ToolbarButton
                        title="Align right"
                        active={editor.isActive({
                            textAlign: "right",
                        })}
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .setTextAlign(
                                    "right"
                                )
                                .run()
                        }
                    >
                        <AlignRight
                            size={16}
                        />
                    </ToolbarButton>

                    <ToolbarDivider />

                    <ToolbarButton
                        title="Clear formatting"
                        onClick={() =>
                            editor
                                .chain()
                                .focus()
                                .clearNodes()
                                .unsetAllMarks()
                                .run()
                        }
                    >
                        <RemoveFormatting
                            size={16}
                        />
                    </ToolbarButton>

                    {onAI && (
                        <>
                            <div className="flex-1" />

                            <button
                                type="button"
                                onClick={onAI}
                                disabled={
                                    aiLoading ||
                                    disabled
                                }
                                className="ml-2 inline-flex h-9 items-center justify-center gap-2 rounded-[9px] bg-gradient-to-r from-[#8155ff] via-[#4c8dff] to-[#20c8c0] px-3 text-[12px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <Sparkles
                                    size={15}
                                    className={
                                        aiLoading
                                            ? "animate-pulse"
                                            : ""
                                    }
                                />

                                {aiLoading
                                    ? "Generating..."
                                    : "AI Write"}
                            </button>
                        </>
                    )}
                </div>

                {/* Editor */}
                <div
                    className="
                        [&_.tiptap]:min-h-[330px]
                        [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none
                        [&_.tiptap_p.is-editor-empty:first-child::before]:float-left
                        [&_.tiptap_p.is-editor-empty:first-child::before]:h-0
                        [&_.tiptap_p.is-editor-empty:first-child::before]:text-[#a0a3aa]
                        [&_.tiptap_h2]:mb-3
                        [&_.tiptap_h2]:mt-7
                        [&_.tiptap_h2]:text-[24px]
                        [&_.tiptap_h2]:font-semibold
                        [&_.tiptap_h2]:leading-tight
                        [&_.tiptap_h3]:mb-2
                        [&_.tiptap_h3]:mt-6
                        [&_.tiptap_h3]:text-[19px]
                        [&_.tiptap_h3]:font-semibold
                        [&_.tiptap_p]:my-3
                        [&_.tiptap_ul]:my-4
                        [&_.tiptap_ul]:list-disc
                        [&_.tiptap_ul]:pl-7
                        [&_.tiptap_ol]:my-4
                        [&_.tiptap_ol]:list-decimal
                        [&_.tiptap_ol]:pl-7
                        [&_.tiptap_li]:my-1
                        [&_.tiptap_blockquote]:my-5
                        [&_.tiptap_blockquote]:border-l-4
                        [&_.tiptap_blockquote]:border-[#cbdcff]
                        [&_.tiptap_blockquote]:bg-[#f7f9ff]
                        [&_.tiptap_blockquote]:px-4
                        [&_.tiptap_blockquote]:py-2
                        [&_.tiptap_blockquote]:italic
                        [&_.tiptap_pre]:my-5
                        [&_.tiptap_pre]:overflow-x-auto
                        [&_.tiptap_pre]:rounded-[10px]
                        [&_.tiptap_pre]:bg-[#17181b]
                        [&_.tiptap_pre]:p-4
                        [&_.tiptap_pre]:text-[13px]
                        [&_.tiptap_pre]:text-white
                        [&_.tiptap_code]:rounded
                        [&_.tiptap_code]:bg-[#f0f1f3]
                        [&_.tiptap_code]:px-1
                        [&_.tiptap_code]:py-0.5
                        [&_.tiptap_a]:cursor-pointer
                        [&_.tiptap_a]:text-[#1769df]
                        [&_.tiptap_a]:underline
                    "
                >
                    <EditorContent
                        editor={editor}
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-[#e5e6e8] bg-[#fcfcfd] px-4 py-2.5">
                    <span className="text-[11px] text-[#8b8e95]">
                        Rich-text content
                    </span>

                    <span className="text-[11px] text-[#8b8e95]">
                        {
                            editor.storage
                                .characterCount
                                ?.characters?.() ||
                            editor
                                .getText()
                                .length
                        }{" "}
                        characters
                    </span>
                </div>
            </div>

            {error && (
                <p className="mt-1.5 text-[12px] text-red-600">
                    {error}
                </p>
            )}
        </div>
    );
};

export default BlogRichTextEditor;