import {
  useEffect,
  useRef,
} from "react";

import {
  Bold,
  Code2,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";


const RichTextEditor = ({
  value = "",
  onChange,
  minHeight = 260,
}) => {

  const editorRef =
    useRef(null);


  useEffect(() => {
    if (
      editorRef.current &&
      editorRef.current.innerHTML !== value
    ) {
      editorRef.current.innerHTML =
        value || "";
    }
  }, [value]);


  const execute = (
    command,
    commandValue = null
  ) => {
    editorRef.current?.focus();

    document.execCommand(
      command,
      false,
      commandValue
    );

    onChange(
      editorRef.current?.innerHTML || ""
    );
  };


  return (
    <div
      className="
        rounded-[12px]
        border
        border-[#dedfe2]
        bg-white
        overflow-hidden
      "
    >

      <div
        className="
          min-h-[48px]

          px-[10px]
          py-[7px]

          border-b
          border-[#e6e7e9]

          flex
          items-center
          gap-[3px]
          flex-wrap
        "
      >

        <Tool
          icon={<Undo2 size={14} />}
          onClick={() =>
            execute("undo")
          }
        />

        <Tool
          icon={<Redo2 size={14} />}
          onClick={() =>
            execute("redo")
          }
        />

        <Divider />


        <Tool
          text="H2"
          onClick={() =>
            execute(
              "formatBlock",
              "h2"
            )
          }
        />

        <Tool
          text="H3"
          onClick={() =>
            execute(
              "formatBlock",
              "h3"
            )
          }
        />

        <Tool
          text="¶"
          onClick={() =>
            execute(
              "formatBlock",
              "p"
            )
          }
        />

        <Divider />


        <Tool
          icon={<Bold size={15} />}
          onClick={() =>
            execute("bold")
          }
        />

        <Tool
          icon={<Italic size={15} />}
          onClick={() =>
            execute("italic")
          }
        />

        <Tool
          icon={<Underline size={15} />}
          onClick={() =>
            execute("underline")
          }
        />

        <Tool
          icon={
            <Strikethrough size={15} />
          }
          onClick={() =>
            execute("strikeThrough")
          }
        />

        <Divider />


        <Tool
          icon={<List size={15} />}
          onClick={() =>
            execute(
              "insertUnorderedList"
            )
          }
        />

        <Tool
          icon={
            <ListOrdered size={15} />
          }
          onClick={() =>
            execute(
              "insertOrderedList"
            )
          }
        />

        <Divider />


        <Tool
          icon={<Code2 size={15} />}
          onClick={() =>
            execute(
              "formatBlock",
              "pre"
            )
          }
        />

      </div>


      <div
        ref={editorRef}

        contentEditable
        suppressContentEditableWarning

        onInput={(event) =>
          onChange(
            event.currentTarget
              .innerHTML
          )
        }

        style={{
          minHeight,
        }}

        className="
          px-[16px]
          py-[14px]

          text-[14px]
          leading-[1.7]

          outline-none

          [&_h2]:text-[24px]
          [&_h2]:font-bold
          [&_h2]:mb-3

          [&_h3]:text-[18px]
          [&_h3]:font-semibold

          [&_ul]:list-disc
          [&_ul]:pl-6

          [&_ol]:list-decimal
          [&_ol]:pl-6

          [&_p]:mb-3
        "
      />

    </div>
  );
};


const Tool = ({
  icon,
  text,
  onClick,
}) => (
  <button
    type="button"
    onMouseDown={(event) =>
      event.preventDefault()
    }
    onClick={onClick}
    className="
      min-w-[31px]
      h-[31px]

      rounded-[6px]

      flex
      items-center
      justify-center

      px-[6px]

      text-[12px]

      hover:bg-[#f1f2f4]
    "
  >
    {icon || text}
  </button>
);


const Divider = () => (
  <div
    className="
      w-px
      h-[23px]
      bg-[#dedfe2]
      mx-[3px]
    "
  />
);


export default RichTextEditor;