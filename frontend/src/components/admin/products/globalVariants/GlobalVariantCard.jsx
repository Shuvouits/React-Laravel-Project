import {
  Pencil,
} from "lucide-react";

import {
  isColorVariant,
} from "./globalVariantConfig";


/* ==========================================================================
   GLOBAL VARIANT CARD
============================================================================ */

const GlobalVariantCard = ({
  variant,
  onEdit,
}) => {

  const colorVariant =
    isColorVariant(
      variant
    );


  return (
    <div
      className="
        min-h-[68px]

        rounded-[18px]

        border
        border-[#dedfe3]

        bg-white

        px-[19px]
        py-[14px]

        flex
        items-center
        justify-between
        gap-5

        shadow-[0_2px_6px_rgba(0,0,0,0.025)]

        transition-all
        duration-200

        hover:border-[#d4d6da]
        hover:shadow-[0_3px_10px_rgba(0,0,0,0.04)]
      "
    >

      {/* =====================================================
          LEFT
      ====================================================== */}

      <div
        className="
          min-w-0

          flex
          items-center
          gap-[14px]
        "
      >

        {/* VARIANT NAME */}

        <h3
          className="
            min-w-fit

            text-[15px]
            leading-none
            font-semibold

            text-[#111827]
          "
        >
          {variant.name}
        </h3>


        {/* VALUES */}

        <div
          className="
            flex
            items-center
            flex-wrap

            gap-[6px]
          "
        >

          {variant.values?.map(
            (item) => (

              <VariantValuePill
                key={
                  item.id ||
                  `${variant.id}-${item.value}`
                }

                item={
                  item
                }

                colorVariant={
                  colorVariant
                }
              />

            )
          )}

        </div>

      </div>


      {/* =====================================================
          EDIT
      ====================================================== */}

      <button
        type="button"

        onClick={() =>
          onEdit(
            variant
          )
        }

        title={`Edit ${variant.name}`}

        aria-label={`Edit ${variant.name}`}

        className="
          w-[34px]
          h-[34px]

          rounded-[8px]

          flex
          items-center
          justify-center

          shrink-0

          text-[#72767d]

          hover:bg-[#f4f5f6]
          hover:text-[#2065D1]

          transition-colors
        "
      >

        <Pencil
          size={15}
          strokeWidth={1.8}
        />

      </button>

    </div>
  );

};


/* ==========================================================================
   VALUE PILL
============================================================================ */

const VariantValuePill = ({
  item,
  colorVariant,
}) => {

  return (
    <span
      className="
        min-h-[26px]

        rounded-full

        bg-[#f4f5f6]

        px-[10px]

        inline-flex
        items-center
        justify-center
        gap-[6px]

        text-[11px]
        font-medium

        text-[#666b73]

        whitespace-nowrap
      "
    >

      {colorVariant && (

        <span
          className="
            w-[8px]
            h-[8px]

            rounded-full

            border
            border-black/5

            shrink-0
          "

          style={{
            backgroundColor:
              item.color_code ||
              "#d1d5db",
          }}
        />

      )}


      {item.value}

    </span>
  );

};


export default GlobalVariantCard;