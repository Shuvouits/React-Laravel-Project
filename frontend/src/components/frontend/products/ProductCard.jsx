import {
  Heart,
  Maximize2,
  ShoppingBag,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import {
  formatPrice,
  getCompareAtPrice,
  getDiscountPercent,
  getProductImage,
  getProductOptions,
  getProductPrice,
  getProductSubtitle,
  getSwatchColor,
  isColorOption,
  isProductFeatured,
} from "./productHelpers";


const ProductCard = ({
  product,
  onQuickView,
  onChooseOptions,
}) => {

  const image =
    getProductImage(
      product
    );


  const price =
    getProductPrice(
      product
    );


  const comparePrice =
    getCompareAtPrice(
      product
    );


  const discount =
    getDiscountPercent(
      product
    );


  const featured =
    isProductFeatured(
      product
    );


  const options =
    getProductOptions(
      product
    );


  const colorOption =
    options.find(
      (option) =>
        isColorOption(
          option.name
        )
    );


  const colors =
    colorOption
      ?.values
      ?.slice(
        0,
        4
      ) || [];


  const slug =
    product.slug ||
    product.id;


  return (

    <div
      className="
        group/card
        min-w-0
      "
    >

      {/* =====================================================
          IMAGE AREA
      ====================================================== */}

      <div
        className="
          relative

          w-full
          aspect-[1/1]

          rounded-[12px]

          bg-[#f3f3f4]

          overflow-hidden
        "
      >

        {/* DISCOUNT */}

        {discount > 0 && (

          <span
            className="
              absolute
              left-[10px]
              top-[10px]

              z-20

              min-w-[43px]
              h-[25px]

              px-[8px]

              rounded-full

              bg-white

              border
              border-[#e1e1e1]

              shadow-sm

              flex
              items-center
              justify-center

              text-[12px]
              font-semibold
              text-[#ef1b28]
            "
          >
            -{discount}%
          </span>

        )}


        {/* FEATURED */}

        {featured && (

          <span
            className="
              absolute
              left-[10px]
              top-[42px]

              z-20

              px-[10px]
              py-[4px]

              rounded-full

              bg-[#2065D1]

              text-white
              text-[11px]
              font-semibold
            "
          >
            Featured
          </span>

        )}


        {/* WISHLIST */}

        <button
          type="button"

          title="Add to wishlist"

          className="
            absolute
            right-[10px]
            top-[10px]

            z-20

            w-[37px]
            h-[37px]

            rounded-full

            border
            border-[#e5e5e5]

            bg-white

            flex
            items-center
            justify-center

            text-[#777]

            opacity-0
            translate-y-[-5px]

            group-hover/card:opacity-100
            group-hover/card:translate-y-0

            hover:text-[#111]

            transition-all
            duration-200
          "
        >

          <Heart
            size={19}
            strokeWidth={1.8}
          />

        </button>


        {/* PRODUCT IMAGE */}

        <Link
          to={`/products/${slug}`}

          className="
            absolute
            inset-0

            flex
            items-center
            justify-center

            p-[28px]
          "
        >

          {image ? (

            <img
              src={image}
              alt={product.title}

              loading="lazy"

              className="
                max-w-full
                max-h-full

                w-auto
                h-auto

                object-contain

                transition-transform
                duration-300

                group-hover/card:scale-[1.035]
              "
            />

          ) : (

            <div
              className="
                text-[12px]
                text-[#999]
              "
            >
              No image
            </div>

          )}

        </Link>


        {/* =================================================
            HOVER ACTIONS
        ================================================== */}

        <div
          className="
            absolute

            left-[10px]
            right-[10px]
            bottom-[10px]

            z-30

            flex
            items-center

            gap-[7px]

            opacity-0
            translate-y-[10px]

            pointer-events-none

            group-hover/card:opacity-100
            group-hover/card:translate-y-0
            group-hover/card:pointer-events-auto

            transition-all
            duration-200
          "
        >

          <button
            type="button"

            onClick={() =>
              onChooseOptions?.(
                product
              )
            }

            className="
              flex-1

              h-[40px]

              rounded-full

              bg-[#171717]
              text-white

              flex
              items-center
              justify-center

              gap-[7px]

              text-[12px]
              font-semibold

              hover:bg-black

              transition-colors
            "
          >

            <ShoppingBag
              size={15}
            />

            Choose options

          </button>


          <button
            type="button"

            onClick={() =>
              onQuickView?.(
                product
              )
            }

            className="
              flex-1

              h-[40px]

              rounded-full

              bg-white
              text-[#202020]

              border
              border-[#e5e5e5]

              flex
              items-center
              justify-center

              gap-[7px]

              text-[12px]
              font-semibold

              hover:bg-[#fafafa]

              transition-colors
            "
          >

            <Maximize2
              size={14}
            />

            Quick view

          </button>

        </div>

      </div>


      {/* =====================================================
          SWATCHES
      ====================================================== */}

      <div
        className="
          mt-[10px]

          h-[16px]

          flex
          items-center

          gap-[5px]
        "
      >

        {colors.length > 0 ? (

          colors.map(
            (color) => (

              <span
                key={color}

                title={color}

                className="
                  w-[16px]
                  h-[16px]

                  rounded-full

                  border
                  border-white

                  ring-1
                  ring-[#dedede]
                "

                style={{
                  backgroundColor:
                    getSwatchColor(
                      color
                    ),
                }}
              />

            )
          )

        ) : (

          <>
            <span className="w-[16px] h-[16px] rounded-full bg-[#171717]" />
            <span className="w-[16px] h-[16px] rounded-full bg-[#e5d5dd]" />
            <span className="w-[16px] h-[16px] rounded-full bg-[#b8bbc2]" />
          </>

        )}

      </div>


      {/* =====================================================
          TITLE
      ====================================================== */}

      <Link
        to={`/products/${slug}`}

        className="
          block

          mt-[7px]

          text-[14px]
          leading-[1.3]

          font-semibold

          text-[#171717]

          truncate

          hover:text-[#2065D1]

          transition-colors
        "
      >
        {product.title}
      </Link>


      {/* SUBTITLE */}

      <p
        className="
          mt-[5px]

          min-h-[18px]

          text-[12px]
          text-[#777]

          truncate
        "
      >
        {getProductSubtitle(
          product
        )}
      </p>


      {/* =====================================================
          PRICE + RATING
      ====================================================== */}

      <div
        className="
          mt-[9px]

          flex
          items-center
          justify-between

          gap-2
        "
      >

        <div
          className="
            flex
            items-center

            gap-[8px]

            min-w-0
          "
        >

          <span
            className="
              h-[25px]

              px-[9px]

              rounded-[4px]

              border
              border-[#00b777]

              text-[#009d66]
              text-[13px]
              font-bold

              flex
              items-center
            "
          >
            {formatPrice(
              price
            )}
          </span>


          {comparePrice > price && (

            <span
              className="
                text-[12px]
                text-[#777]

                line-through

                whitespace-nowrap
              "
            >
              {formatPrice(
                comparePrice
              )}
            </span>

          )}

        </div>


        {product.rating && (

          <div
            className="
              flex
              items-center

              gap-[4px]

              text-[12px]
              font-medium
            "
          >

            <span
              className="
                text-[#f6b800]
              "
            >
              ★
            </span>

            {Number(
              product.rating
            ).toFixed(1)}

          </div>

        )}

      </div>

    </div>

  );

};


export default ProductCard;