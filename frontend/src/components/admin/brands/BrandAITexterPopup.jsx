import {
  ArrowUp,
  Check,
  ChevronDown,
  LoaderCircle,
  Plus,
  RefreshCw,
} from "lucide-react";

import {
  AI_TONES,
} from "./brandConfig";


const BrandAITexterPopup = ({
  prompt,
  setPrompt,

  tone,
  setTone,

  toneOpen,
  setToneOpen,

  placeholder,

  loading,

  onGenerate,
  onAutoGenerate,

  className = "",
}) => {

  const selectedTone =
    AI_TONES.find(
      (item) =>
        item.value === tone
    );


  return (
    <div
      className={`
        absolute
        z-[300]

        w-[430px]
        max-w-[calc(100vw-60px)]

        rounded-[15px]

        bg-gradient-to-br
        from-[#ff58c7]
        via-[#ffcf55]
        to-[#24d7d1]

        p-[2px]

        shadow-[0_16px_35px_rgba(0,0,0,0.17)]

        ${className}
      `}
    >

      <div
        className="
          rounded-[13px]
          bg-white
        "
      >

        {/* PROMPT */}

        <textarea
          value={prompt}

          onChange={(e) =>
            setPrompt(
              e.target.value
            )
          }

          placeholder={placeholder}

          className="
            block
            w-full
            h-[92px]

            rounded-t-[13px]

            border-0

            px-[14px]
            py-[13px]

            text-[13px]
            leading-[1.5]

            text-[#444]

            outline-none
            resize-none

            placeholder:text-[#777]
          "
        />


        {/* TOOLBAR */}

        <div
          className="
            relative

            min-h-[54px]

            border-t
            border-[#eeeeef]

            px-[10px]

            flex
            items-center
            justify-between
            gap-[8px]
          "
        >

          {/* LEFT */}

          <div
            className="
              flex
              items-center
              gap-[6px]
            "
          >

            <button
              type="button"

              className="
                w-[29px]
                h-[29px]

                rounded-full

                flex
                items-center
                justify-center

                hover:bg-[#f4f4f5]
              "
            >
              <Plus size={17} />
            </button>


            <span
              className="
                text-[10px]
                text-[#777]
              "
            >
              Tone
            </span>


            <div className="relative">

              <button
                type="button"

                onClick={() =>
                  setToneOpen(
                    (prev) => !prev
                  )
                }

                className="
                  h-[31px]
                  px-[10px]

                  rounded-[10px]

                  bg-[#f3f3f4]

                  flex
                  items-center
                  gap-[5px]

                  text-[11px]
                  text-[#333]
                "
              >

                {selectedTone?.label ||
                  "Default tone"}


                <ChevronDown
                  size={12}
                />

              </button>


              {/* TONE DROPDOWN */}

              {toneOpen && (

                <div
                  className="
                    absolute
                    left-0
                    top-[36px]

                    z-[500]

                    w-[145px]

                    rounded-[11px]

                    border
                    border-[#dedfe2]

                    bg-white

                    p-[5px]

                    shadow-[0_10px_25px_rgba(0,0,0,0.15)]
                  "
                >

                  {AI_TONES.map(
                    (item) => {

                      const selected =
                        item.value ===
                        tone;


                      return (
                        <button
                          key={item.value}

                          type="button"

                          onClick={() => {

                            setTone(
                              item.value
                            );

                            setToneOpen(
                              false
                            );

                          }}

                          className={`
                            w-full
                            min-h-[34px]

                            px-[9px]

                            rounded-[7px]

                            flex
                            items-center
                            justify-between

                            text-[12px]

                            ${
                              selected
                                ? "bg-[#eef3ff] text-[#2065D1]"
                                : "text-[#333] hover:bg-[#f5f5f5]"
                            }
                          `}
                        >

                          {item.label}


                          {selected && (

                            <Check
                              size={13}
                            />

                          )}

                        </button>
                      );

                    }
                  )}

                </div>

              )}

            </div>

          </div>


          {/* RIGHT */}

          <div
            className="
              flex
              items-center
              gap-[10px]
            "
          >

            <button
              type="button"

              disabled={loading}

              onClick={
                onAutoGenerate
              }

              className="
                flex
                items-center
                gap-[5px]

                text-[11px]
                font-semibold

                text-[#111]

                disabled:opacity-50
              "
            >

              <RefreshCw
                size={13}
              />

              Auto Generate

            </button>


            <button
              type="button"

              disabled={loading}

              onClick={
                onGenerate
              }

              className="
                w-[32px]
                h-[32px]

                rounded-full

                bg-[#181818]
                text-white

                flex
                items-center
                justify-center

                hover:bg-black

                disabled:opacity-50
              "
            >

              {loading ? (

                <LoaderCircle
                  size={15}
                  className="animate-spin"
                />

              ) : (

                <ArrowUp
                  size={16}
                />

              )}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
};


export default BrandAITexterPopup;