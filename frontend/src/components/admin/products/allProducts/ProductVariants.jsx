import {
  useEffect,
  useState,
} from "react";

import {
  ChevronDown,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import {
  useParams,
} from "react-router-dom";

import {
  buildVariantCombinations,
} from "./productConfig";

import VariantImageUploader from "./VariantImageUploader";


const ProductVariants = ({
  productId,

  context = "admin",

  globalVariants = [],

  options = [],
  setOptions,

  variants = [],
  setVariants,
}) => {

  /*
  |--------------------------------------------------------------------------
  | ROUTE PRODUCT ID
  |--------------------------------------------------------------------------
  */

  const {
    id: routeProductId,
  } = useParams();


  /*
  |--------------------------------------------------------------------------
  | RESOLVED PRODUCT ID
  |--------------------------------------------------------------------------
  |
  | ProductForm থেকে productId pass করলে সেটা use করবে।
  | না করলে /admin/products/4/edit থেকে 4 নেবে।
  |
  */

  const resolvedProductId =
    productId ||
    routeProductId ||
    null;


  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    adding,
    setAdding,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | COMBINATION KEY
  |--------------------------------------------------------------------------
  */

  const makeCombinationKey = (
    variant
  ) => {

    const ids =
      variant
        ?.global_variant_value_ids;


    if (
      Array.isArray(ids) &&
      ids.length > 0
    ) {

      return ids
        .map(Number)
        .sort(
          (a, b) =>
            a - b
        )
        .join("-");

    }


    /*
    |--------------------------------------------------------------------------
    | SECOND FALLBACK
    |--------------------------------------------------------------------------
    */

    if (
      variant
        ?.combination_key
    ) {

      return String(
        variant
          .combination_key
      );

    }


    /*
    |--------------------------------------------------------------------------
    | TITLE FALLBACK
    |--------------------------------------------------------------------------
    */

    return String(
      variant?.title ||
      variant?.name ||
      ""
    )
      .trim()
      .toLowerCase();

  };


  /*
  |--------------------------------------------------------------------------
  | REBUILD VARIANT COMBINATIONS
  |--------------------------------------------------------------------------
  |
  | Important:
  | Existing database variant ID, image, product_media_id etc. preserve করবে।
  |
  */

  useEffect(() => {

    const rebuilt =
      buildVariantCombinations(
        options,
        variants
      );


    /*
    |--------------------------------------------------------------------------
    | PRESERVE EXISTING SAVED DATA
    |--------------------------------------------------------------------------
    */

    const merged =
      rebuilt.map(
        (newVariant) => {

          const newKey =
            makeCombinationKey(
              newVariant
            );


          const existing =
            variants.find(
              (oldVariant) => {

                const oldKey =
                  makeCombinationKey(
                    oldVariant
                  );


                return (
                  oldKey &&
                  newKey &&
                  oldKey ===
                    newKey
                );

              }
            );


          if (!existing) {

            return newVariant;

          }


          /*
          |--------------------------------------------------------------------------
          | MERGE
          |--------------------------------------------------------------------------
          */

          return {

            ...newVariant,

            /*
            |--------------------------------------------------------------------------
            | DATABASE ID
            |--------------------------------------------------------------------------
            */

            id:
              existing.id ??
              newVariant.id ??
              null,


            /*
            |--------------------------------------------------------------------------
            | TITLE
            |--------------------------------------------------------------------------
            */

            title:
              existing.title ||
              newVariant.title,

            name:
              existing.name ||
              newVariant.name,


            /*
            |--------------------------------------------------------------------------
            | SAVED PRICING
            |--------------------------------------------------------------------------
            */

            price:
              existing.price ??
              newVariant.price ??
              "",

            compare_at_price:
              existing
                .compare_at_price ??
              newVariant
                .compare_at_price ??
              "",


            /*
            |--------------------------------------------------------------------------
            | INVENTORY
            |--------------------------------------------------------------------------
            */

            quantity:
              existing.quantity ??
              newVariant.quantity ??
              0,

            sku:
              existing.sku ??
              newVariant.sku ??
              "",

            barcode:
              existing.barcode ??
              newVariant.barcode ??
              "",


            /*
            |--------------------------------------------------------------------------
            | VARIANT IMAGE
            |--------------------------------------------------------------------------
            |
            | This is important.
            |
            */

            product_media_id:
              existing
                .product_media_id ??
              newVariant
                .product_media_id ??
              null,

            image_url:
              existing.image_url ||
              newVariant.image_url ||
              null,

            media:
              existing.media ||
              newVariant.media ||
              null,

            pending_image_file:
              existing
                .pending_image_file ??
              newVariant
                .pending_image_file ??
              null,

            pending_image_preview:
              existing
                .pending_image_preview ||
              newVariant
                .pending_image_preview ||
              null,


            /*
            |--------------------------------------------------------------------------
            | FLAGS
            |--------------------------------------------------------------------------
            */

            is_active:
              existing
                .is_active ??
              newVariant
                .is_active ??
              true,

          };

        }
      );


    /*
    |--------------------------------------------------------------------------
    | CHECK IF ACTUAL CHANGE EXISTS
    |--------------------------------------------------------------------------
    */

    const currentKeys =
      variants
        .map(
          makeCombinationKey
        )
        .join("|");


    const mergedKeys =
      merged
        .map(
          makeCombinationKey
        )
        .join("|");


    if (
      currentKeys !==
        mergedKeys ||
      merged.length !==
        variants.length
    ) {

      setVariants(
        merged
      );

    }

  }, [options]);


  /*
  |--------------------------------------------------------------------------
  | ADD OPTION
  |--------------------------------------------------------------------------
  */

  const addOption = (
    globalVariant
  ) => {

    const exists =
      options.some(
        (option) =>
          Number(
            option
              .global_variant_id
          ) ===
          Number(
            globalVariant.id
          )
      );


    if (exists) {

      setAdding(false);

      return;

    }


    setOptions([

      ...options,

      {

        global_variant_id:
          globalVariant.id,

        name:
          globalVariant.name,

        visual_type:
          globalVariant
            .visual_type ||
          globalVariant
            .visual ||
          "rectangle",

        sort_order:
          options.length,

        values: [],

      },

    ]);


    setAdding(false);

  };


  /*
  |--------------------------------------------------------------------------
  | TOGGLE OPTION VALUE
  |--------------------------------------------------------------------------
  */

  const toggleValue = (
    optionIndex,
    sourceValue
  ) => {

    const next =
      [...options];


    const option = {

      ...next[
        optionIndex
      ],

      values: [
        ...(
          next[
            optionIndex
          ].values || []
        ),
      ],

    };


    const valueId =
      Number(
        sourceValue.id
      );


    const exists =
      option.values.some(
        (value) =>
          Number(
            value
              .global_variant_value_id
          ) ===
          valueId
      );


    /*
    |--------------------------------------------------------------------------
    | REMOVE
    |--------------------------------------------------------------------------
    */

    if (exists) {

      option.values =
        option.values.filter(
          (value) =>
            Number(
              value
                .global_variant_value_id
            ) !==
            valueId
        );

    }

    /*
    |--------------------------------------------------------------------------
    | ADD
    |--------------------------------------------------------------------------
    */

    else {

      option.values.push({

        global_variant_value_id:
          sourceValue.id,

        value:
          sourceValue.value,

        color_code:
          sourceValue
            .color_code ||
          null,

        sort_order:
          option.values.length,

      });

    }


    next[
      optionIndex
    ] =
      option;


    setOptions(
      next
    );

  };


  /*
  |--------------------------------------------------------------------------
  | REMOVE OPTION
  |--------------------------------------------------------------------------
  */

  const removeOption = (
    index
  ) => {

    const next =
      options

        .filter(
          (
            _,
            itemIndex
          ) =>
            itemIndex !==
            index
        )

        .map(
          (
            option,
            itemIndex
          ) => ({

            ...option,

            sort_order:
              itemIndex,

          })
        );


    setOptions(
      next
    );

  };


  /*
  |--------------------------------------------------------------------------
  | UPDATE VARIANT
  |--------------------------------------------------------------------------
  */

  const updateVariant = (
    index,
    field,
    value
  ) => {

    setVariants(
      (previous) =>
        previous.map(
          (
            variant,
            itemIndex
          ) =>

            itemIndex ===
            index

              ? {

                  ...variant,

                  [field]:
                    value,

                }

              : variant
        )
    );

  };


  /*
  |--------------------------------------------------------------------------
  | VARIANT IMAGE UPDATED
  |--------------------------------------------------------------------------
  */

  const handleVariantImageUpdated = (
    index,
    updatedVariant
  ) => {

    setVariants(
      (previous) =>
        previous.map(
          (
            variant,
            itemIndex
          ) => {

            if (
              itemIndex !==
              index
            ) {

              return variant;

            }


            return {

              ...variant,

              ...updatedVariant,

              id:
                updatedVariant
                  ?.id ??
                variant.id,

              product_media_id:
                updatedVariant
                  ?.product_media_id ??
                variant
                  ?.product_media_id ??
                null,

              image_url:
                updatedVariant
                  ?.image_url ??
                variant
                  ?.image_url ??
                null,

            };

          }
        )
    );

  };


  /*
  |--------------------------------------------------------------------------
  | ROW KEY
  |--------------------------------------------------------------------------
  */

  const getVariantKey = (
    variant,
    index
  ) => {

    if (variant?.id) {

      return `saved-${variant.id}`;

    }


    const combinationKey =
      makeCombinationKey(
        variant
      );


    return (
      combinationKey ||
      `variant-${index}`
    );

  };


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (

    <div
      className="
        rounded-[15px]
        border
        border-[#dedfe2]
        bg-white
        p-[20px]
        shadow-[0_2px_7px_rgba(0,0,0,0.035)]
      "
    >

      {/* =====================================================
          TITLE
      ====================================================== */}

      <h2
        className="
          text-[15px]
          font-bold
        "
      >
        Variants
      </h2>


      {/* =====================================================
          OPTIONS
      ====================================================== */}

      <div
        className="
          mt-[14px]
          space-y-[9px]
        "
      >

        {options.map(
          (
            option,
            optionIndex
          ) => {

            const source =
              globalVariants.find(
                (item) =>
                  Number(
                    item.id
                  ) ===
                  Number(
                    option
                      .global_variant_id
                  )
              );


            return (

              <div
                key={
                  option
                    .global_variant_id
                }

                className="
                  rounded-[11px]
                  border
                  border-[#dedfe2]
                  px-[12px]
                  py-[10px]
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-[10px]
                  "
                >

                  {/* OPTION NAME */}

                  <span
                    className="
                      min-w-[80px]
                      text-[13px]
                      font-semibold
                    "
                  >
                    {option.name}
                  </span>


                  {/* VALUES */}

                  <div
                    className="
                      flex-1
                      flex
                      flex-wrap
                      gap-[6px]
                    "
                  >

                    {source
                      ?.values
                      ?.map(
                        (value) => {

                          const selected =
                            (
                              option.values ||
                              []
                            ).some(
                              (
                                selectedValue
                              ) =>
                                Number(
                                  selectedValue
                                    .global_variant_value_id
                                ) ===
                                Number(
                                  value.id
                                )
                            );


                          return (

                            <button
                              key={
                                value.id
                              }

                              type="button"

                              onClick={() =>
                                toggleValue(
                                  optionIndex,
                                  value
                                )
                              }

                              className={`
                                h-[27px]

                                rounded-full

                                px-[9px]

                                flex
                                items-center

                                gap-[5px]

                                text-[10px]

                                transition-colors

                                ${
                                  selected

                                    ? "bg-[#8554ef] text-white"

                                    : "bg-[#f3f4f5] text-[#555] hover:bg-[#e9eaec]"
                                }
                              `}
                            >

                              {value
                                .color_code && (

                                <span
                                  className="
                                    w-[8px]
                                    h-[8px]

                                    rounded-full

                                    border
                                    border-black/10
                                  "

                                  style={{
                                    backgroundColor:
                                      value
                                        .color_code,
                                  }}
                                />

                              )}


                              {
                                value.value
                              }


                              {selected && (

                                <X
                                  size={9}
                                />

                              )}

                            </button>

                          );

                        }
                      )}

                  </div>


                  {/* DELETE OPTION */}

                  <button
                    type="button"

                    onClick={() =>
                      removeOption(
                        optionIndex
                      )
                    }

                    title="Remove option"

                    className="
                      w-[28px]
                      h-[28px]

                      rounded-[6px]

                      flex
                      items-center
                      justify-center

                      text-[#777]

                      hover:bg-red-50
                      hover:text-red-500
                    "
                  >

                    <Trash2
                      size={13}
                    />

                  </button>

                </div>

              </div>

            );

          }
        )}

      </div>


      {/* =====================================================
          ADD OPTION
      ====================================================== */}

      <div
        className="
          relative
          mt-[13px]
        "
      >

        <button
          type="button"

          onClick={() =>
            setAdding(
              !adding
            )
          }

          className="
            flex
            items-center

            gap-[6px]

            text-[12px]
            font-medium

            hover:text-[#2065D1]
          "
        >

          <Plus
            size={14}
          />

          Add another option

        </button>


        {adding && (

          <div
            className="
              absolute

              left-0
              top-[28px]

              z-40

              w-[260px]

              rounded-[11px]

              border
              border-[#dedfe2]

              bg-white

              p-[6px]

              shadow-[0_10px_30px_rgba(0,0,0,0.12)]
            "
          >

            {globalVariants.map(
              (globalVariant) => {

                const alreadyAdded =
                  options.some(
                    (option) =>
                      Number(
                        option
                          .global_variant_id
                      ) ===
                      Number(
                        globalVariant.id
                      )
                  );


                return (

                  <button
                    key={
                      globalVariant.id
                    }

                    type="button"

                    disabled={
                      alreadyAdded
                    }

                    onClick={() =>
                      addOption(
                        globalVariant
                      )
                    }

                    className="
                      w-full

                      rounded-[7px]

                      px-[10px]
                      py-[9px]

                      text-left
                      text-[12px]

                      hover:bg-[#f4f5f7]

                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    {globalVariant.name}
                  </button>

                );

              }
            )}

          </div>

        )}

      </div>


      {/* =====================================================
          VARIANT TABLE
      ====================================================== */}

      {variants.length > 0 && (

        <div
          className="
            mt-[20px]

            border-t
            border-[#e6e7e9]

            pt-[17px]
          "
        >

          {/* TOP */}

          <div
            className="
              mb-[10px]

              flex
              items-center
              justify-between
            "
          >

            <span
              className="
                text-[11px]
                text-[#777]
              "
            >
              Group by
            </span>


            <span
              className="
                text-[11px]
                text-[#777]
              "
            >
              {variants.length} variants
            </span>

          </div>


          {/* TABLE */}

          <div
            className="
              rounded-[11px]

              border
              border-[#dedfe2]

              overflow-x-auto
            "
          >

            <table
              className="
                w-full
                min-w-[980px]

                border-collapse
              "
            >

              {/* HEADER */}

              <thead>

                <tr
                  className="
                    border-b
                    border-[#dedfe2]

                    bg-[#fafafa]
                  "
                >

                  <TableHeading
                    className="
                      w-[95px]
                    "
                  >
                    Image
                  </TableHeading>


                  <TableHeading>
                    Variant
                  </TableHeading>


                  <TableHeading>
                    Price
                  </TableHeading>


                  <TableHeading>
                    SKU
                  </TableHeading>


                  <TableHeading>
                    Available
                  </TableHeading>


                  <TableHeading>
                    Active
                  </TableHeading>

                </tr>

              </thead>


              {/* BODY */}

              <tbody>

                {variants.map(
                  (
                    variant,
                    index
                  ) => {

                    const hasSavedId =
                      Boolean(
                        variant?.id
                      );


                    return (

                      <tr
                        key={
                          getVariantKey(
                            variant,
                            index
                          )
                        }

                        className="
                          border-b
                          border-[#e8e9eb]

                          last:border-0

                          hover:bg-[#fcfcfd]
                        "
                      >

                        {/* =========================================
                            IMAGE
                        ========================================== */}

                        <td
                          className="
                            w-[95px]

                            px-[10px]
                            py-[9px]

                            align-middle
                          "
                        >

                          <VariantImageUploader
                            productId={
                              resolvedProductId
                            }

                            context={
                              context
                            }

                            variant={
                              variant
                            }

                            onUpdated={(
                              updatedVariant
                            ) =>
                              handleVariantImageUpdated(
                                index,
                                updatedVariant
                              )
                            }
                          />

                        </td>


                        {/* =========================================
                            VARIANT
                        ========================================== */}

                        <td
                          className="
                            min-w-[180px]

                            px-[12px]
                            py-[10px]

                            align-middle
                          "
                        >

                          <div
                            className="
                              flex
                              items-center

                              gap-[7px]
                            "
                          >

                            <span
                              className="
                                whitespace-nowrap

                                text-[12px]
                                font-medium

                                text-[#252525]
                              "
                            >
                              {
                                variant.title ||
                                variant.name ||
                                "Variant"
                              }
                            </span>


                            <ChevronDown
                              size={12}

                              className="
                                text-[#777]
                              "
                            />

                          </div>


                          {/* SAVED STATUS */}

                          {!hasSavedId && (

                            <p
                              className="
                                mt-[4px]

                                text-[9px]
                                text-[#999]
                              "
                            >
                              Select an image now. It will upload when the product is saved.
                            </p>

                          )}


                          {hasSavedId &&
                            variant
                              ?.image_url && (

                            <p
                              className="
                                mt-[4px]

                                text-[9px]
                                text-[#28a36a]
                              "
                            >
                              Variant image assigned
                            </p>

                          )}

                        </td>


                        {/* =========================================
                            PRICE
                        ========================================== */}

                        <td
                          className="
                            px-[10px]
                            py-[9px]

                            align-middle
                          "
                        >

                          <input
                            type="number"

                            step="0.01"

                            min="0"

                            value={
                              variant.price ??
                              ""
                            }

                            onChange={(
                              event
                            ) =>
                              updateVariant(
                                index,
                                "price",
                                event
                                  .target
                                  .value
                              )
                            }

                            className="
                              w-[135px]
                              h-[36px]

                              rounded-[10px]

                              border
                              border-[#dedfe2]

                              bg-white

                              px-[10px]

                              text-[12px]

                              outline-none

                              focus:border-[#2065D1]
                              focus:ring-2
                              focus:ring-[#2065D1]/10
                            "
                          />

                        </td>


                        {/* =========================================
                            SKU
                        ========================================== */}

                        <td
                          className="
                            px-[10px]
                            py-[9px]

                            align-middle
                          "
                        >

                          <input
                            type="text"

                            value={
                              variant.sku ??
                              ""
                            }

                            onChange={(
                              event
                            ) =>
                              updateVariant(
                                index,
                                "sku",
                                event
                                  .target
                                  .value
                              )
                            }

                            placeholder="SKU"

                            className="
                              w-[155px]
                              h-[36px]

                              rounded-[10px]

                              border
                              border-[#dedfe2]

                              bg-white

                              px-[10px]

                              text-[12px]

                              outline-none

                              focus:border-[#2065D1]
                              focus:ring-2
                              focus:ring-[#2065D1]/10
                            "
                          />

                        </td>


                        {/* =========================================
                            QUANTITY
                        ========================================== */}

                        <td
                          className="
                            px-[10px]
                            py-[9px]

                            align-middle
                          "
                        >

                          <input
                            type="number"

                            min="0"

                            value={
                              variant.quantity ??
                              0
                            }

                            onChange={(
                              event
                            ) =>
                              updateVariant(
                                index,
                                "quantity",
                                event
                                  .target
                                  .value
                              )
                            }

                            className="
                              w-[90px]
                              h-[36px]

                              rounded-[10px]

                              border
                              border-[#dedfe2]

                              bg-white

                              px-[10px]

                              text-[12px]

                              outline-none

                              focus:border-[#2065D1]
                              focus:ring-2
                              focus:ring-[#2065D1]/10
                            "
                          />

                        </td>


                        {/* =========================================
                            ACTIVE
                        ========================================== */}

                        <td
                          className="
                            px-[10px]
                            py-[9px]

                            align-middle
                          "
                        >

                          <button
                            type="button"

                            onClick={() =>
                              updateVariant(
                                index,
                                "is_active",
                                !(
                                  variant
                                    .is_active ??
                                  true
                                )
                              )
                            }

                            className={`
                              relative

                              w-[38px]
                              h-[21px]

                              rounded-full

                              transition-colors

                              ${
                                variant
                                  .is_active ??
                                true

                                  ? "bg-[#2065D1]"

                                  : "bg-[#dedfe2]"
                              }
                            `}
                          >

                            <span
                              className={`
                                absolute

                                top-[3px]

                                w-[15px]
                                h-[15px]

                                rounded-full

                                bg-white

                                shadow-sm

                                transition-all

                                ${
                                  variant
                                    .is_active ??
                                  true

                                    ? "left-[20px]"

                                    : "left-[3px]"
                                }
                              `}
                            />

                          </button>

                        </td>

                      </tr>

                    );

                  }
                )}

              </tbody>

            </table>

          </div>


          {/* =================================================
              HELP
          ================================================== */}

          <p
            className="
              mt-[10px]

              text-[10px]
              leading-[1.5]

              text-[#888]
            "
          >
            Assign an image to each saved variant so the storefront image can
            change when a customer selects a different color or option.
          </p>

        </div>

      )}

    </div>

  );

};


/*
|--------------------------------------------------------------------------
| TABLE HEADING
|--------------------------------------------------------------------------
*/

const TableHeading = ({
  children,
  className = "",
}) => {

  return (

    <th
      className={`
        px-[12px]
        py-[10px]

        text-left

        text-[11px]
        font-medium

        text-[#555]

        whitespace-nowrap

        ${className}
      `}
    >
      {children}
    </th>

  );

};


export default ProductVariants;