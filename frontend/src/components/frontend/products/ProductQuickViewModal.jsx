import {
  Heart,
  Minus,
  Plus,
  ShoppingCart,
  X,
  Zap,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  formatPrice,
  getCompareAtPrice,
  getProductImage,
  getProductOptions,
  getProductPrice,
  getStoreName,
  getSwatchColor,
  isColorOption,
} from "./productHelpers";


const ProductQuickViewModal = ({
  product,
  open,
  onClose,
}) => {

  const navigate =
    useNavigate();


  const [
    quantity,
    setQuantity,
  ] = useState(1);


  const [
    selections,
    setSelections,
  ] = useState({});


  /*
  |--------------------------------------------------------------------------
  | PRODUCT OPTIONS
  |--------------------------------------------------------------------------
  */

  const options =
    useMemo(
      () =>
        getProductOptions(
          product
        ),
      [product]
    );


  /*
  |--------------------------------------------------------------------------
  | RESET WHEN OPEN
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (
      !open ||
      !product
    ) {
      return;
    }


    setQuantity(1);


    /*
    |--------------------------------------------------------------------------
    | USE DEFAULT VARIANT FIRST
    |--------------------------------------------------------------------------
    */

    const variants =
      Array.isArray(
        product.variants
      )
        ? product.variants
        : [];


    const defaultVariant =
      variants.find(
        (variant) =>
          variant.is_default
      ) ||
      variants[0] ||
      null;


    const defaults = {};


    /*
    |--------------------------------------------------------------------------
    | DEFAULT FROM ACTUAL VARIANT
    |--------------------------------------------------------------------------
    */

    if (
      defaultVariant &&
      Array.isArray(
        defaultVariant.options
      )
    ) {

      defaultVariant.options.forEach(
        (option) => {

          const name =
            option.global_variant_name ||
            option.option_name ||
            option.name;


          if (
            name &&
            option.value !== null &&
            option.value !== undefined
          ) {

            defaults[name] =
              String(
                option.value
              );

          }

        }
      );

    }


    /*
    |--------------------------------------------------------------------------
    | FALLBACK TO FIRST OPTION VALUE
    |--------------------------------------------------------------------------
    */

    options.forEach(
      (option) => {

        if (
          defaults[
            option.name
          ] === undefined &&
          option.values?.length
        ) {

          defaults[
            option.name
          ] =
            option.values[0];

        }

      }
    );


    setSelections(
      defaults
    );

  }, [
    open,
    product,
    options,
  ]);


  /*
  |--------------------------------------------------------------------------
  | ESC + BODY LOCK
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!open) {
      return;
    }


    const oldOverflow =
      document.body.style
        .overflow;


    document.body.style
      .overflow =
      "hidden";


    const handleEscape = (
      event
    ) => {

      if (
        event.key ===
        "Escape"
      ) {

        onClose?.();

      }

    };


    window.addEventListener(
      "keydown",
      handleEscape
    );


    return () => {

      document.body.style
        .overflow =
        oldOverflow;


      window.removeEventListener(
        "keydown",
        handleEscape
      );

    };

  }, [
    open,
    onClose,
  ]);


  /*
  |--------------------------------------------------------------------------
  | SELECTED VARIANT
  |--------------------------------------------------------------------------
  */

  const selectedVariant =
    useMemo(
      () => {

        const variants =
          Array.isArray(
            product?.variants
          )
            ? product.variants
            : [];


        if (
          variants.length === 0
        ) {
          return null;
        }


        /*
        |--------------------------------------------------------------------------
        | FIND EXACT MATCH
        |--------------------------------------------------------------------------
        */

        const exactMatch =
          variants.find(
            (variant) => {

              const variantOptions =
                Array.isArray(
                  variant.options
                )
                  ? variant.options
                  : [];


              return Object.entries(
                selections
              ).every(
                ([
                  selectedName,
                  selectedValue,
                ]) => {

                  return variantOptions.some(
                    (option) => {

                      const name =
                        option.global_variant_name ||
                        option.option_name ||
                        option.name;


                      return (
                        String(name) ===
                          String(
                            selectedName
                          ) &&
                        String(
                          option.value
                        ) ===
                          String(
                            selectedValue
                          )
                      );

                    }
                  );

                }
              );

            }
          );


        if (exactMatch) {
          return exactMatch;
        }


        /*
        |--------------------------------------------------------------------------
        | DEFAULT FALLBACK
        |--------------------------------------------------------------------------
        */

        return (
          variants.find(
            (variant) =>
              variant.is_default
          ) ||
          variants[0]
        );

      },
      [
        product,
        selections,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | PRICE
  |--------------------------------------------------------------------------
  */

  const price =
    selectedVariant
      ?.price !== undefined &&
    selectedVariant
      ?.price !== null

      ? Number(
          selectedVariant.price
        )

      : getProductPrice(
          product
        );


  /*
  |--------------------------------------------------------------------------
  | COMPARE PRICE
  |--------------------------------------------------------------------------
  */

  const comparePrice =
    selectedVariant
      ?.compare_at_price !==
      undefined &&
    selectedVariant
      ?.compare_at_price !==
      null

      ? Number(
          selectedVariant
            .compare_at_price
        )

      : getCompareAtPrice(
          product
        );


  /*
  |--------------------------------------------------------------------------
  | IMAGE
  |--------------------------------------------------------------------------
  |
  | THIS IS THE MAIN FIX
  |
  |--------------------------------------------------------------------------
  */

  const image =
    selectedVariant
      ?.image_url ||
    getProductImage(
      product
    );


  /*
  |--------------------------------------------------------------------------
  | STOCK
  |--------------------------------------------------------------------------
  */

  const availableQuantity =
    selectedVariant
      ? Number(
          selectedVariant
            .quantity || 0
        )
      : Number(
          product
            ?.quantity || 0
        );


  /*
  |--------------------------------------------------------------------------
  | DISCOUNT
  |--------------------------------------------------------------------------
  */

  const discount =
    comparePrice > price &&
    comparePrice > 0 &&
    price > 0

      ? Math.round(
          (
            (
              comparePrice -
              price
            ) /
            comparePrice
          ) *
          100
        )

      : 0;


  /*
  |--------------------------------------------------------------------------
  | NOT OPEN
  |--------------------------------------------------------------------------
  */

  if (
    !open ||
    !product
  ) {
    return null;
  }


  /*
  |--------------------------------------------------------------------------
  | SELECT OPTION
  |--------------------------------------------------------------------------
  */

  const selectOption = (
    optionName,
    value
  ) => {

    setSelections(
      (previous) => ({
        ...previous,

        [optionName]:
          String(value),
      })
    );

  };


  /*
  |--------------------------------------------------------------------------
  | ADD TO CART
  |--------------------------------------------------------------------------
  */

  const handleAddToCart =
    () => {

      const existingCart =
        JSON.parse(
          localStorage.getItem(
            "cart"
          ) || "[]"
        );


      const cartItem = {
        product_id:
          product.id,

        variant_id:
          selectedVariant
            ?.id || null,

        title:
          product.title,

        slug:
          product.slug,

        image:
          image,

        price:
          price,

        quantity:
          quantity,

        options:
          selections,
      };


      existingCart.push(
        cartItem
      );


      localStorage.setItem(
        "cart",
        JSON.stringify(
          existingCart
        )
      );


      window.dispatchEvent(
        new Event(
          "cart:updated"
        )
      );


      onClose?.();

    };


  /*
  |--------------------------------------------------------------------------
  | BUY NOW
  |--------------------------------------------------------------------------
  */

  const handleBuyNow =
    () => {

      const existingCart =
        JSON.parse(
          localStorage.getItem(
            "cart"
          ) || "[]"
        );


      existingCart.push({
        product_id:
          product.id,

        variant_id:
          selectedVariant
            ?.id || null,

        title:
          product.title,

        slug:
          product.slug,

        image:
          image,

        price:
          price,

        quantity:
          quantity,

        options:
          selections,
      });


      localStorage.setItem(
        "cart",
        JSON.stringify(
          existingCart
        )
      );


      window.dispatchEvent(
        new Event(
          "cart:updated"
        )
      );


      onClose?.();


      navigate(
        "/cart"
      );

    };


  return (

    <div
      className="
        fixed
        inset-0

        z-[9999]

        flex
        items-center
        justify-center

        p-4
      "
    >

      {/* =====================================================
          OVERLAY
      ====================================================== */}

      <button
        type="button"

        aria-label="Close quick view"

        onClick={
          onClose
        }

        className="
          absolute
          inset-0

          bg-black/50

          backdrop-blur-[2px]
        "
      />


      {/* =====================================================
          MODAL
      ====================================================== */}

      <div
        className="
          relative
          z-10

          w-full
          max-w-[950px]

          max-h-[92vh]

          overflow-y-auto

          rounded-[22px]

          bg-white

          shadow-[0_30px_80px_rgba(0,0,0,0.25)]

          grid
          grid-cols-1
          md:grid-cols-[1.05fr_1fr]
        "
      >

        {/* ===================================================
            LEFT IMAGE
        ==================================================== */}

        <div
          className="
            relative

            min-h-[500px]

            bg-[#f7f7f7]

            flex
            items-center
            justify-center

            p-[55px]

            rounded-t-[22px]

            md:rounded-l-[22px]
            md:rounded-tr-none
          "
        >

          {/* DISCOUNT */}

          {discount > 0 && (

            <span
              className="
                absolute

                top-[20px]
                left-[20px]

                z-10

                px-[13px]
                py-[5px]

                rounded-full

                bg-[#ed0712]

                text-white
                text-[13px]
                font-bold
              "
            >
              -{discount}%
            </span>

          )}


          {/* WISHLIST */}

          <button
            type="button"

            className="
              absolute

              top-[18px]
              right-[18px]

              z-10

              w-[40px]
              h-[40px]

              rounded-full

              border
              border-[#e4e4e4]

              bg-white

              shadow-sm

              flex
              items-center
              justify-center

              text-[#777]

              hover:text-[#111]
            "
          >
            <Heart
              size={20}
            />
          </button>


          {/* IMAGE */}

          {image ? (

            <img
              key={
                selectedVariant
                  ?.id ||
                image
              }

              src={
                image
              }

              alt={
                product.title
              }

              className="
                max-w-full
                max-h-[420px]

                object-contain

                animate-[fadeIn_.18s_ease-in-out]
              "
            />

          ) : (

            <span
              className="
                text-[13px]
                text-[#999]
              "
            >
              No image
            </span>

          )}

        </div>


        {/* ===================================================
            RIGHT CONTENT
        ==================================================== */}

        <div
          className="
            relative

            px-[30px]
            py-[30px]
          "
        >

          {/* CLOSE */}

          <button
            type="button"

            onClick={
              onClose
            }

            className="
              absolute

              top-[16px]
              right-[16px]

              w-[37px]
              h-[37px]

              rounded-full

              border
              border-[#e5e5e5]

              flex
              items-center
              justify-center

              text-[#777]

              hover:bg-[#f7f7f7]
              hover:text-[#111]
            "
          >
            <X
              size={18}
            />
          </button>


          {/* STORE */}

          <p
            className="
              pr-[45px]

              text-[13px]

              text-[#777]
            "
          >
            {getStoreName(
              product
            )}
          </p>


          {/* TITLE */}

          <h2
            className="
              mt-[6px]

              pr-[45px]

              text-[27px]
              leading-[1.2]

              font-bold

              tracking-[-0.4px]

              text-[#171717]
            "
          >
            {product.title}
          </h2>


          {/* =================================================
              PRICE
          ================================================== */}

          <div
            className="
              mt-[22px]

              flex
              items-center

              gap-[11px]
            "
          >

            {comparePrice > price && (

              <span
                className="
                  text-[16px]

                  text-[#777]

                  line-through
                "
              >
                {formatPrice(
                  comparePrice
                )}
              </span>

            )}


            <span
              className="
                text-[23px]

                font-bold

                text-[#f35a00]
              "
            >
              {formatPrice(
                price
              )}
            </span>

          </div>


          {/* =================================================
              OPTIONS
          ================================================== */}

          {options.length > 0 && (

            <div
              className="
                mt-[26px]

                space-y-[20px]
              "
            >

              {options.map(
                (option) => {

                  const colorOption =
                    isColorOption(
                      option.name
                    );


                  return (

                    <div
                      key={
                        option.name
                      }
                    >

                      {/* LABEL */}

                      <p
                        className="
                          mb-[10px]

                          text-[14px]

                          font-medium

                          text-[#222]
                        "
                      >
                        {option.name}:
                      </p>


                      {/* ==========================================
                          COLOR
                      =========================================== */}

                      {colorOption ? (

                        <div
                          className="
                            flex
                            flex-wrap

                            gap-[10px]
                          "
                        >

                          {option.values.map(
                            (value) => {

                              const active =
                                String(
                                  selections[
                                    option.name
                                  ]
                                ) ===
                                String(value);


                              const item =
                                option.items
                                  ?.find(
                                    (
                                      optionItem
                                    ) =>
                                      String(
                                        optionItem
                                          .value
                                      ) ===
                                      String(
                                        value
                                      )
                                  );


                              const color =
                                item
                                  ?.color_code ||
                                getSwatchColor(
                                  value
                                );


                              return (

                                <button
                                  key={
                                    value
                                  }

                                  type="button"

                                  title={
                                    value
                                  }

                                  onClick={() =>
                                    selectOption(
                                      option.name,
                                      value
                                    )
                                  }

                                  className={`
                                    relative

                                    w-[38px]
                                    h-[38px]

                                    rounded-full

                                    border-[3px]
                                    border-white

                                    transition-all

                                    ${
                                      active
                                        ? "ring-2 ring-[#171717]"
                                        : "ring-1 ring-[#d9d9d9] hover:ring-[#999]"
                                    }
                                  `}

                                  style={{
                                    backgroundColor:
                                      color,
                                  }}
                                />

                              );

                            }
                          )}

                        </div>

                      ) : (

                        /* ========================================
                           NORMAL OPTIONS
                        ========================================= */

                        <div
                          className="
                            flex
                            flex-wrap

                            gap-[8px]
                          "
                        >

                          {option.values.map(
                            (value) => {

                              const active =
                                String(
                                  selections[
                                    option.name
                                  ]
                                ) ===
                                String(value);


                              return (

                                <button
                                  key={
                                    value
                                  }

                                  type="button"

                                  onClick={() =>
                                    selectOption(
                                      option.name,
                                      value
                                    )
                                  }

                                  className={`
                                    min-h-[38px]

                                    px-[15px]

                                    rounded-[12px]

                                    border

                                    text-[13px]
                                    font-medium

                                    transition-all

                                    ${
                                      active

                                        ? "border-[#171717] bg-[#171717] text-white"

                                        : "border-[#dedede] bg-white text-[#444] hover:border-[#999]"
                                    }
                                  `}
                                >
                                  {value}
                                </button>

                              );

                            }
                          )}

                        </div>

                      )}

                    </div>

                  );

                }
              )}

            </div>

          )}


          {/* =================================================
              STOCK
          ================================================== */}

          {selectedVariant && (

            <div
              className="
                mt-[20px]

                text-[12px]

                text-[#707070]
              "
            >

              {availableQuantity > 0 ? (

                <span>
                  {availableQuantity} available
                </span>

              ) : (

                <span
                  className="
                    text-red-500
                  "
                >
                  Out of stock
                </span>

              )}

            </div>

          )}


          {/* =================================================
              DIVIDER
          ================================================== */}

          <div
            className="
              mt-[27px]

              border-t
              border-[#e5e5e5]
            "
          />


          {/* =================================================
              CART ROW
          ================================================== */}

          <div
            className="
              mt-[18px]

              flex
              items-center

              gap-[12px]
            "
          >

            {/* QUANTITY */}

            <div
              className="
                h-[45px]

                rounded-[13px]

                border
                border-[#dedede]

                flex
                items-center

                overflow-hidden
              "
            >

              <button
                type="button"

                onClick={() =>
                  setQuantity(
                    (
                      previous
                    ) =>
                      Math.max(
                        1,
                        previous - 1
                      )
                  )
                }

                className="
                  w-[39px]
                  h-full

                  flex
                  items-center
                  justify-center

                  hover:bg-[#f7f7f7]
                "
              >
                <Minus
                  size={14}
                />
              </button>


              <div
                className="
                  min-w-[35px]

                  text-center

                  text-[13px]
                  font-medium
                "
              >
                {quantity}
              </div>


              <button
                type="button"

                onClick={() =>
                  setQuantity(
                    (
                      previous
                    ) =>
                      previous + 1
                  )
                }

                className="
                  w-[39px]
                  h-full

                  flex
                  items-center
                  justify-center

                  hover:bg-[#f7f7f7]
                "
              >
                <Plus
                  size={14}
                />
              </button>

            </div>


            {/* ADD CART */}

            <button
              type="button"

              disabled={
                selectedVariant &&
                availableQuantity <= 0
              }

              onClick={
                handleAddToCart
              }

              className="
                flex-1

                h-[45px]

                rounded-[13px]

                bg-[#171717]

                text-white

                flex
                items-center
                justify-center

                gap-[8px]

                text-[14px]
                font-semibold

                hover:bg-black

                disabled:bg-[#aaa]
                disabled:cursor-not-allowed
              "
            >
              <ShoppingCart
                size={17}
              />

              Add to Cart
            </button>

          </div>


          {/* =================================================
              BUY NOW
          ================================================== */}

          <button
            type="button"

            disabled={
              selectedVariant &&
              availableQuantity <= 0
            }

            onClick={
              handleBuyNow
            }

            className="
              mt-[12px]

              w-full
              h-[45px]

              rounded-[13px]

              bg-[#2065D1]

              text-white

              flex
              items-center
              justify-center

              gap-[8px]

              text-[14px]
              font-semibold

              hover:bg-[#1858bb]

              disabled:bg-[#8caee2]
              disabled:cursor-not-allowed
            "
          >
            <Zap
              size={17}
            />

            Buy Now
          </button>


          {/* =================================================
              FULL DETAILS
          ================================================== */}

          <div
            className="
              mt-[31px]

              text-center
            "
          >

            <Link
              to={
                `/products/${product.slug}`
              }

              onClick={
                onClose
              }

              className="
                text-[13px]

                font-medium

                text-[#2065D1]

                hover:underline
              "
            >
              View full details
            </Link>

          </div>

        </div>

      </div>

    </div>

  );

};


export default ProductQuickViewModal;