import {
  Eye,
  EyeOff,
  GripVertical,
  LoaderCircle,
  Pencil,
} from "lucide-react";


const PageBuilderItem = ({
  section,

  onEdit,
  onToggle,

  toggling = false,

  editor = null,

  editorOpen = false,
}) => {

  return (

    <div
      className={`
        bg-white
        border
        rounded-[14px]

        shadow-[0_2px_7px_rgba(0,0,0,0.025)]

        transition-all
        duration-200

        ${
          section.is_active
            ? "border-[#e2e3e6] opacity-100"
            : "border-[#e2e3e6] opacity-60 bg-[#fafafa]"
        }
      `}
    >

      {/* =====================================================
          SECTION HEADER
      ====================================================== */}

      <div
        className="
          min-h-[96px]

          px-[18px]
          py-[17px]

          flex
          items-center
          justify-between

          gap-5
        "
      >

        {/* LEFT */}

        <div
          className="
            flex
            items-center

            gap-[12px]

            min-w-0
          "
        >

          <button
            type="button"

            className="
              text-[#8b8e94]

              cursor-grab
              active:cursor-grabbing

              shrink-0
            "
          >

            <GripVertical
              size={19}
              strokeWidth={2}
            />

          </button>


          <div className="min-w-0">

            <div
              className="
                flex
                items-center
                gap-2
              "
            >

              <h2
                className="
                  text-[16px]
                  font-semibold

                  leading-[1.25]

                  text-[#111]
                "
              >
                {section.title}
              </h2>


              {!section.is_active && (

                <span
                  className="
                    px-[7px]
                    py-[2px]

                    rounded-full

                    bg-[#eeeeee]

                    text-[#777]
                    text-[9px]
                    font-semibold
                    uppercase
                  "
                >
                  Hidden
                </span>

              )}

            </div>


            <p
              className="
                mt-[3px]

                text-[12px]
                leading-[1.3]

                text-[#777b83]
              "
            >
              {section.description}
            </p>

          </div>

        </div>


        {/* =====================================================
            ACTIONS
        ====================================================== */}

        <div
          className="
            flex
            items-center

            gap-[7px]

            shrink-0
          "
        >

          {/* VISIBILITY */}

          <button
            type="button"

            onClick={onToggle}

            disabled={toggling}

            title={
              section.is_active
                ? `Hide ${section.title}`
                : `Show ${section.title}`
            }

            className={`
              w-[37px]
              h-[37px]

              rounded-full

              border

              flex
              items-center
              justify-center

              transition-all

              disabled:opacity-50
              disabled:cursor-not-allowed

              ${
                section.is_active
                  ? `
                    border-[#e2e4e7]
                    bg-[#fafafa]
                    text-[#11a875]

                    hover:bg-[#f3fbf8]
                    hover:border-[#bfe6d8]
                  `
                  : `
                    border-[#e2e4e7]
                    bg-[#f4f4f4]
                    text-[#888]

                    hover:bg-[#eeeeee]
                  `
              }
            `}
          >

            {toggling ? (

              <LoaderCircle
                size={17}
                className="animate-spin"
              />

            ) : section.is_active ? (

              <Eye
                size={17}
                strokeWidth={1.9}
              />

            ) : (

              <EyeOff
                size={17}
                strokeWidth={1.9}
              />

            )}

          </button>


          {/* EDIT */}

          <button
            type="button"

            onClick={onEdit}

            title={`Edit ${section.title}`}

            className={`
              w-[37px]
              h-[37px]

              rounded-full

              border

              flex
              items-center
              justify-center

              text-[#1769ff]

              transition-all

              ${
                editorOpen
                  ? `
                    border-[#cbdcff]
                    bg-[#eef5ff]
                  `
                  : `
                    border-[#e2e4e7]
                    bg-[#fafafa]

                    hover:bg-[#f3f7ff]
                    hover:border-[#cbdcff]
                  `
              }
            `}
          >

            <Pencil
              size={17}
              strokeWidth={1.9}
            />

          </button>

        </div>

      </div>


      {/* =====================================================
          INLINE EDITOR
      ====================================================== */}

      {editorOpen && editor && (

        <div
          className="
            px-[14px]
            pb-[14px]
          "
        >
          {editor}
        </div>

      )}

    </div>

  );

};


export default PageBuilderItem;