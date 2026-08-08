import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ChevronDown,
  GripVertical,
  LoaderCircle,
  Plus,
  Square,
  Trash2,
} from "lucide-react";

import {
  EMPTY_VARIANT,
  VISUAL_OPTIONS,
  normalizeVariant,
} from "./globalVariantConfig";


/* ==========================================================================
   GLOBAL VARIANT FORM
============================================================================ */

const GlobalVariantForm = ({
  mode = "create",
  variant = null,

  saving = false,

  onSave,
  onDelete,
  onCancel,
}) => {

  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  const [
    form,
    setForm,
  ] = useState({
    ...EMPTY_VARIANT,
  });


  /*
  |--------------------------------------------------------------------------
  | NEW VALUE
  |--------------------------------------------------------------------------
  */

  const [
    newValue,
    setNewValue,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | ERRORS
  |--------------------------------------------------------------------------
  */

  const [
    errors,
    setErrors,
  ] = useState({});


  const [
    message,
    setMessage,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (
      mode === "edit" &&
      variant
    ) {

      setForm(
        normalizeVariant(
          variant
        )
      );

    } else {

      setForm({
        ...EMPTY_VARIANT,
      });

    }


    setNewValue("");

    setErrors({});

    setMessage("");

  }, [
    mode,
    variant,
  ]);


  /*
  |--------------------------------------------------------------------------
  | COLOR VARIANT
  |--------------------------------------------------------------------------
  */

  const isColor =
    useMemo(
      () => {

        const name =
          String(
            form.name || ""
          )
            .trim()
            .toLowerCase();


        return (
          name === "color" ||
          name === "colour"
        );

      },
      [
        form.name,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (
    field,
    value
  ) => {

    setForm(
      (prev) => ({
        ...prev,
        [field]: value,
      })
    );


    setErrors(
      (prev) => ({
        ...prev,
        [field]: null,
      })
    );

  };


  /*
  |--------------------------------------------------------------------------
  | UPDATE EXISTING VALUE
  |--------------------------------------------------------------------------
  */

  const updateValue = (
    index,
    value
  ) => {

    setForm(
      (prev) => {

        const values = [
          ...prev.values,
        ];


        values[index] = {
          ...values[index],
          value,
        };


        return {
          ...prev,
          values,
        };

      }
    );

  };


  /*
  |--------------------------------------------------------------------------
  | DELETE OPTION VALUE
  |--------------------------------------------------------------------------
  */

  const removeValue = (
    index
  ) => {

    setForm(
      (prev) => ({
        ...prev,

        values:
          prev.values.filter(
            (
              _,
              valueIndex
            ) =>
              valueIndex !==
              index
          ),
      })
    );

  };


  /*
  |--------------------------------------------------------------------------
  | ADD VALUE
  |--------------------------------------------------------------------------
  */

  const addValue = () => {

    const value =
      newValue.trim();


    if (!value) {

      return;

    }


    /*
    |--------------------------------------------------------------------------
    | PREVENT DUPLICATE
    |--------------------------------------------------------------------------
    */

    const exists =
      form.values.some(
        (item) =>
          String(
            item.value
          )
            .trim()
            .toLowerCase() ===
          value.toLowerCase()
      );


    if (exists) {

      setMessage(
        `"${value}" already exists.`
      );

      return;

    }


    setForm(
      (prev) => ({
        ...prev,

        values: [
          ...prev.values,

          {
            value,

            sort_order:
              prev.values.length,
          },
        ],
      })
    );


    setNewValue("");

    setMessage("");

  };


  /*
  |--------------------------------------------------------------------------
  | KEYBOARD ADD
  |--------------------------------------------------------------------------
  */

  const handleNewValueKeyDown = (
    event
  ) => {

    if (
      event.key === "Enter"
    ) {

      event.preventDefault();

      addValue();

    }

  };


  /*
  |--------------------------------------------------------------------------
  | BUILD PAYLOAD
  |--------------------------------------------------------------------------
  */

  const buildPayload = () => {

    let values =
      form.values
        .map(
          (
            item,
            index
          ) => {

            const data = {

              value:
                String(
                  item.value || ""
                ).trim(),

              sort_order:
                index,

            };


            /*
            |--------------------------------------------------------------------------
            | KEEP EXISTING VALUE ID
            |--------------------------------------------------------------------------
            */

            if (item.id) {

              data.id =
                item.id;

            }


            return data;

          }
        )
        .filter(
          (item) =>
            item.value
        );


    /*
    |--------------------------------------------------------------------------
    | IF USER TYPED VALUE BUT DID NOT PRESS +
    |--------------------------------------------------------------------------
    */

    const pendingValue =
      newValue.trim();


    if (pendingValue) {

      const exists =
        values.some(
          (item) =>
            item.value
              .toLowerCase() ===
            pendingValue
              .toLowerCase()
        );


      if (!exists) {

        values.push({

          value:
            pendingValue,

          sort_order:
            values.length,

        });

      }

    }


    return {

      name:
        form.name.trim(),

      visual_type:
        form.visual_type ||
        "rectangle",

      sort_order:
        Number(
          form.sort_order
        ) || 0,

      values,

    };

  };


  /*
  |--------------------------------------------------------------------------
  | SUBMIT
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();


      if (saving) {
        return;
      }


      setErrors({});

      setMessage("");


      const payload =
        buildPayload();


      /*
      |--------------------------------------------------------------------------
      | FRONTEND VALIDATION
      |--------------------------------------------------------------------------
      */

      const validationErrors =
        {};


      if (
        !payload.name
      ) {

        validationErrors.name =
          "Variant name is required.";

      }


      if (
        payload.values.length ===
        0
      ) {

        validationErrors.values =
          "Add at least one option value.";

      }


      /*
      |--------------------------------------------------------------------------
      | DUPLICATE CHECK
      |--------------------------------------------------------------------------
      */

      const normalizedValues =
        payload.values.map(
          (item) =>
            item.value.toLowerCase()
        );


      const uniqueValues =
        new Set(
          normalizedValues
        );


      if (
        normalizedValues.length !==
        uniqueValues.size
      ) {

        validationErrors.values =
          "Duplicate option values are not allowed.";

      }


      if (
        Object.keys(
          validationErrors
        ).length
      ) {

        setErrors(
          validationErrors
        );

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | SAVE
      |--------------------------------------------------------------------------
      */

      const result =
        await onSave(
          payload
        );


      if (
        result?.success ===
        false
      ) {

        setErrors(
          result.errors ||
          {}
        );


        setMessage(
          result.message ||
          "Unable to save variant."
        );

      }

    };


  return (
    <form
      onSubmit={
        handleSubmit
      }

      className="
        rounded-[20px]

        border
        border-[#dedfe3]

        bg-white

        px-[24px]
        py-[22px]

        shadow-[0_2px_7px_rgba(0,0,0,0.04)]
      "
    >

      {/* =====================================================
          TOP GRID
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-1
          md:grid-cols-2

          gap-[20px]
        "
      >

        {/* ===================================================
            VARIANT NAME
        ==================================================== */}

        <div>

          <label
            className="
              block

              mb-[7px]

              text-[13px]
              font-semibold

              text-[#111827]
            "
          >
            Variant Name
          </label>


          <input
            type="text"

            value={
              form.name
            }

            onChange={(e) =>
              handleChange(
                "name",
                e.target.value
              )
            }

            placeholder="e.g. Color, Size, Storage"

            className={`
              w-full
              h-[43px]

              rounded-[22px]

              border

              ${
                errors.name
                  ? "border-red-400"
                  : "border-[#dfe1e5]"
              }

              bg-white

              px-[14px]

              text-[13px]

              outline-none

              transition-all

              focus:border-[#2065D1]
              focus:ring-2
              focus:ring-[#2065D1]/10

              placeholder:text-[#91959d]
            `}
          />


          {errors.name && (

            <p
              className="
                mt-[5px]

                text-[11px]
                text-red-500
              "
            >
              {
                Array.isArray(
                  errors.name
                )
                  ? errors.name[0]
                  : errors.name
              }
            </p>

          )}


          <p
            className="
              mt-[7px]

              max-w-[350px]

              text-[11px]
              leading-[1.4]

              text-[#747982]
            "
          >
            Name it “Color” or “Colour” to get color swatches automatically.
          </p>

        </div>


        {/* ===================================================
            VISUAL
        ==================================================== */}

        <div>

          <label
            className="
              block

              mb-[7px]

              text-[13px]
              font-semibold

              text-[#111827]
            "
          >
            Visual
          </label>


          <div
            className="
              relative
            "
          >

            <Square
              size={14}

              className="
                absolute

                left-[14px]
                top-1/2

                -translate-y-1/2

                text-[#666b73]

                pointer-events-none
              "
            />


            <select
              value={
                form.visual_type
              }

              onChange={(e) =>
                handleChange(
                  "visual_type",
                  e.target.value
                )
              }

              className="
                w-full
                h-[43px]

                appearance-none

                rounded-[22px]

                border
                border-[#dfe1e5]

                bg-white

                pl-[38px]
                pr-[40px]

                text-[13px]

                outline-none

                cursor-pointer

                focus:border-[#2065D1]
              "
            >

              {VISUAL_OPTIONS.map(
                (option) => (

                  <option
                    key={
                      option.value
                    }

                    value={
                      option.value
                    }
                  >
                    {
                      option.label
                    }
                  </option>

                )
              )}

            </select>


            <ChevronDown
              size={15}

              className="
                absolute

                right-[14px]
                top-1/2

                -translate-y-1/2

                text-[#8b8f96]

                pointer-events-none
              "
            />

          </div>

        </div>

      </div>


      {/* =====================================================
          OPTION VALUES
      ====================================================== */}

      <div
        className="
          mt-[20px]
        "
      >

        <label
          className="
            block

            mb-[10px]

            text-[13px]
            font-semibold

            text-[#111827]
          "
        >
          Option Values
        </label>


        {/* ===================================================
            EXISTING VALUES
        ==================================================== */}

        <div
          className="
            space-y-[8px]
          "
        >

          {form.values.map(
            (
              item,
              index
            ) => (

              <div
                key={
                  item.id ||
                  `new-value-${index}`
                }

                className="
                  flex
                  items-center
                  gap-[8px]
                "
              >

                {/* DRAG */}

                <div
                  className="
                    w-[18px]

                    shrink-0

                    flex
                    items-center
                    justify-center

                    text-[#a1a4aa]

                    cursor-grab
                  "
                >

                  <GripVertical
                    size={15}
                  />

                </div>


                {/* INPUT */}

                <div
                  className="
                    relative
                    flex-1
                  "
                >

                  {isColor &&
                    item.color_code && (

                    <span
                      className="
                        absolute

                        left-[14px]
                        top-1/2

                        -translate-y-1/2

                        w-[10px]
                        h-[10px]

                        rounded-full

                        border
                        border-black/5
                      "

                      style={{
                        backgroundColor:
                          item.color_code,
                      }}
                    />

                  )}


                  <input
                    type="text"

                    value={
                      item.value
                    }

                    onChange={(e) =>
                      updateValue(
                        index,
                        e.target.value
                      )
                    }

                    className={`
                      w-full
                      h-[43px]

                      rounded-[22px]

                      border
                      border-[#dfe1e5]

                      ${
                        isColor &&
                        item.color_code
                          ? "pl-[34px]"
                          : "px-[14px]"
                      }

                      pr-[14px]

                      text-[13px]

                      outline-none

                      focus:border-[#2065D1]
                    `}
                  />

                </div>


                {/* DELETE VALUE */}

                <button
                  type="button"

                  onClick={() =>
                    removeValue(
                      index
                    )
                  }

                  title="Delete option value"

                  className="
                    w-[34px]
                    h-[34px]

                    rounded-[8px]

                    flex
                    items-center
                    justify-center

                    shrink-0

                    text-[#73777e]

                    hover:bg-red-50
                    hover:text-red-500

                    transition-colors
                  "
                >

                  <Trash2
                    size={15}
                  />

                </button>

              </div>

            )
          )}

        </div>


        {/* ===================================================
            ADD VALUE
        ==================================================== */}

        <div
          className="
            mt-[10px]

            flex
            items-center
            gap-[8px]
          "
        >

          {/* spacer for drag icon */}

          {form.values.length > 0 && (

            <div
              className="
                w-[18px]
                shrink-0
              "
            />

          )}


          <input
            type="text"

            value={
              newValue
            }

            onChange={(e) => {

              setNewValue(
                e.target.value
              );

              setMessage("");

            }}

            onKeyDown={
              handleNewValueKeyDown
            }

            placeholder="Add another value"

            className="
              flex-1
              h-[43px]

              rounded-[22px]

              border
              border-[#dfe1e5]

              px-[14px]

              text-[13px]

              outline-none

              placeholder:text-[#858a92]

              focus:border-[#2065D1]
            "
          />


          <button
            type="button"

            onClick={
              addValue
            }

            title="Add option value"

            className="
              w-[43px]
              h-[43px]

              rounded-full

              border
              border-[#dfe1e5]

              bg-white

              flex
              items-center
              justify-center

              shrink-0

              text-[#6f747c]

              hover:border-[#2065D1]
              hover:text-[#2065D1]

              transition-colors
            "
          >

            <Plus
              size={18}
            />

          </button>

        </div>


        {/* ===================================================
            VALUE ERROR
        ==================================================== */}

        {errors.values && (

          <p
            className="
              mt-[7px]

              text-[11px]
              text-red-500
            "
          >
            {
              Array.isArray(
                errors.values
              )
                ? errors.values[0]
                : errors.values
            }
          </p>

        )}


        {message && (

          <p
            className="
              mt-[7px]

              text-[11px]
              text-red-500
            "
          >
            {message}
          </p>

        )}

      </div>


      {/* =====================================================
          FOOTER
      ====================================================== */}

      <div
        className="
          mt-[25px]

          flex
          items-center
          justify-between

          gap-4
        "
      >

        {/* ===================================================
            DELETE / CLOSE
        ==================================================== */}

        <button
          type="button"

          disabled={
            saving
          }

          onClick={() => {

            if (
              mode === "edit"
            ) {

              onDelete?.(
                variant
              );

            } else {

              onCancel?.();

            }

          }}

          className="
            min-w-[90px]
            h-[37px]

            rounded-[19px]

            border
            border-red-300

            bg-white

            px-[18px]

            text-[12px]
            font-medium

            text-red-500

            hover:bg-red-50

            disabled:opacity-50

            transition-colors
          "
        >
          Delete
        </button>


        {/* SAVE */}

        <button
          type="submit"

          disabled={
            saving
          }

          className="
            min-w-[96px]
            h-[37px]

            rounded-[19px]

            bg-[#2065D1]
            text-white

            px-[20px]

            flex
            items-center
            justify-center
            gap-[6px]

            text-[12px]
            font-semibold

            hover:bg-[#1958bb]

            disabled:opacity-60
            disabled:cursor-not-allowed

            transition-colors
          "
        >

          {saving && (

            <LoaderCircle
              size={14}

              className="
                animate-spin
              "
            />

          )}

          Save

        </button>

      </div>

    </form>
  );

};


export default GlobalVariantForm;