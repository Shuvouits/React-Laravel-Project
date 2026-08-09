import {
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";

import {
  useRef,
} from "react";


/* ==========================================================================
   PROMOTION CARD LABELS
============================================================================ */

const CARD_LABELS = [
  "Tall left",
  "Tall middle",
  "Square top-right",
  "Square top-right (with arrow)",
  "Wide bottom banner",
];


/* ==========================================================================
   COMPONENT
============================================================================ */

const PromotionsOffersEditor = ({
  value,
  onChange,
  onImageSelect,
  onOpenAi,
}) => {

  const inputRefs =
    useRef([]);


  const cards =
    Array.isArray(
      value?.cards
    )
      ? value.cards
      : [];


  /* ==========================================================================
     UPDATE CARD
  ============================================================================ */

  const updateCard = (
    index,
    field,
    fieldValue
  ) => {

    const nextCards =
      [...cards];


    nextCards[index] = {

      ...nextCards[index],

      [field]:
        fieldValue,

    };


    onChange(
      "cards",
      nextCards
    );

  };


  /* ==========================================================================
     FILE SELECT
  ============================================================================ */

  const handleFileSelect = (
    index,
    event
  ) => {

    const file =
      event.target
        .files?.[0];


    if (!file) {
      return;
    }


    onImageSelect?.(
      index,
      file
    );


    event.target.value =
      "";

  };


  /* ==========================================================================
     UI
  ============================================================================ */

  return (

    <div
      className="
        rounded-[14px]

        border
        border-[#e0e1e4]

        bg-[#fbfbfc]

        p-[12px]
      "
    >

      {/* =====================================================
          SECTION TITLE
      ====================================================== */}

      <div
        className="
          mb-[15px]
        "
      >

        <label
          className="
            block

            mb-[6px]

            text-[11px]
            font-semibold

            tracking-[2px]

            text-[#676b72]

            uppercase
          "
        >
          Section Title
        </label>


        <input
          type="text"

          value={
            value?.title || ""
          }

          onChange={(
            event
          ) =>
            onChange(
              "title",
              event.target.value
            )
          }

          placeholder="Promotions & Offers"

          className="
            w-full
            h-[40px]

            rounded-[10px]

            border
            border-[#dedfe3]

            bg-white

            px-[13px]

            text-[13px]

            outline-none

            focus:border-[#2065D1]
            focus:ring-2
            focus:ring-[#2065D1]/10
          "
        />

      </div>


      {/* =====================================================
          CARDS GRID
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-1

          xl:grid-cols-2

          gap-[12px]
        "
      >

        {CARD_LABELS.map(
          (
            label,
            index
          ) => {

            const card =
              cards[index] || {};


            return (

              <div
                key={
                  label
                }

                className="
                  min-h-[250px]

                  rounded-[14px]

                  border
                  border-[#dedfe3]

                  bg-white

                  p-[12px]
                "
              >

                {/* =============================================
                    CARD HEADER
                ============================================== */}

                <div
                  className="
                    flex
                    items-center
                    justify-between

                    gap-[10px]
                  "
                >

                  <span
                    className="
                      inline-flex

                      rounded-full

                      bg-[#8b5cf6]

                      px-[9px]
                      py-[4px]

                      text-[10px]
                      font-semibold

                      text-white
                    "
                  >
                    {label}
                  </span>


                  {/* AI STUDIO */}

                  <button
                    type="button"

                    onClick={() =>
                      onOpenAi?.(
                        index
                      )
                    }

                    className="
                      h-[30px]

                      px-[10px]

                      rounded-[7px]

                      bg-gradient-to-r
                      from-[#ff3fc8]
                      via-[#ff8a3d]
                      to-[#3bd9e7]

                      flex
                      items-center
                      justify-center

                      gap-[4px]

                      text-[11px]
                      font-semibold

                      text-white

                      shadow-sm

                      hover:opacity-90
                    "
                  >

                    <Sparkles
                      size={12}
                    />

                    AI Studio

                  </button>

                </div>


                {/* =============================================
                    IMAGE
                ============================================== */}

                <div
                  className="
                    mt-[15px]

                    flex
                    items-start

                    gap-[12px]
                  "
                >

                  <button
                    type="button"

                    onClick={() =>
                      inputRefs
                        .current[index]
                        ?.click()
                    }

                    className="
                      relative

                      w-[115px]
                      h-[115px]

                      shrink-0

                      overflow-hidden

                      rounded-[12px]

                      border
                      border-[#dedfe3]

                      bg-[#f5f6f7]

                      flex
                      items-center
                      justify-center

                      group
                    "
                  >

                    {card.image_url ? (

                      <img
                        src={
                          card.image_url
                        }

                        alt={
                          card.image_alt ||
                          label
                        }

                        className="
                          w-full
                          h-full

                          object-cover
                        "
                      />

                    ) : (

                      <div
                        className="
                          flex
                          flex-col
                          items-center

                          gap-[5px]

                          text-[#8b8f96]
                        "
                      >

                        <ImageIcon
                          size={23}
                        />

                        <span
                          className="
                            text-[10px]
                          "
                        >
                          Add image
                        </span>

                      </div>

                    )}


                    {card.image_url && (

                      <div
                        className="
                          absolute
                          inset-0

                          bg-black/35

                          opacity-0

                          group-hover:opacity-100

                          flex
                          items-center
                          justify-center

                          transition-opacity
                        "
                      >

                        <ImageIcon
                          size={20}

                          className="
                            text-white
                          "
                        />

                      </div>

                    )}

                  </button>


                  <input
                    ref={(
                      element
                    ) => {

                      inputRefs
                        .current[index] =
                        element;

                    }}

                    type="file"

                    accept="
                      image/jpeg,
                      image/png,
                      image/webp
                    "

                    onChange={(
                      event
                    ) =>
                      handleFileSelect(
                        index,
                        event
                      )
                    }

                    className="
                      hidden
                    "
                  />


                  {/* ===========================================
                      CARD SETTINGS
                  ============================================ */}

                  <div
                    className="
                      flex-1

                      min-w-0
                    "
                  >

                    {/* ALT */}

                    <label
                      className="
                        block

                        mb-[5px]

                        text-[10px]
                        font-medium

                        text-[#666]
                      "
                    >
                      Image alt
                    </label>


                    <input
                      type="text"

                      value={
                        card.image_alt ||
                        ""
                      }

                      onChange={(
                        event
                      ) =>
                        updateCard(
                          index,
                          "image_alt",
                          event.target.value
                        )
                      }

                      placeholder="Promotion image"

                      className="
                        w-full
                        h-[36px]

                        rounded-[9px]

                        border
                        border-[#dedfe3]

                        bg-white

                        px-[11px]

                        text-[12px]

                        outline-none

                        focus:border-[#2065D1]
                      "
                    />


                    {/* LINK */}

                    <label
                      className="
                        block

                        mt-[10px]
                        mb-[5px]

                        text-[10px]
                        font-medium

                        text-[#666]
                      "
                    >
                      Destination link
                    </label>


                    <input
                      type="text"

                      value={
                        card.link ||
                        ""
                      }

                      onChange={(
                        event
                      ) =>
                        updateCard(
                          index,
                          "link",
                          event.target.value
                        )
                      }

                      placeholder="/products"

                      className="
                        w-full
                        h-[36px]

                        rounded-[9px]

                        border
                        border-[#dedfe3]

                        bg-white

                        px-[11px]

                        text-[12px]

                        outline-none

                        focus:border-[#2065D1]
                      "
                    />

                  </div>

                </div>

              </div>

            );

          }
        )}

      </div>

    </div>

  );

};


export default PromotionsOffersEditor;