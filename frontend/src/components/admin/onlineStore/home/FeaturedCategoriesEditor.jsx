const FeaturedCategoriesEditor = ({
  value,
  onChange,
}) => {

  return (

    <div
      className="
        rounded-[14px]

        border
        border-[#e2e3e6]

        bg-[#fcfcfc]

        px-[16px]
        py-[16px]
      "
    >

      {/* =====================================================
          SECTION TITLE
      ====================================================== */}

      <div>

        <label
          className="
            block

            mb-[8px]

            text-[11px]
            font-semibold

            tracking-[0.20em]
            uppercase

            text-[#686d75]
          "
        >
          Section Title
        </label>


        <input
          type="text"

          value={
            value.title
          }

          onChange={(event) =>
            onChange(
              "title",
              event.target.value
            )
          }

          placeholder="Featured Categories"

          className="
            w-full
            max-w-[580px]

            h-[40px]

            rounded-full

            border
            border-[#dedfe2]

            bg-white

            px-[15px]

            text-[14px]
            text-[#222]

            outline-none

            focus:border-[#2065D1]
            focus:ring-2
            focus:ring-[#2065D1]/10
          "
        />

      </div>


      {/* =====================================================
          SETTINGS GRID
      ====================================================== */}

      <div
        className="
          mt-[18px]

          grid
          grid-cols-1
          lg:grid-cols-2

          gap-[14px]
        "
      >

        {/* CATEGORY SOURCE */}

        <div>

          <label
            className="
              block

              mb-[8px]

              text-[11px]
              font-semibold

              tracking-[0.20em]
              uppercase

              text-[#686d75]
            "
          >
            Category Source
          </label>


          <select
            value={
              value.category_source
            }

            onChange={(event) =>
              onChange(
                "category_source",
                event.target.value
              )
            }

            className="
              w-full
              h-[40px]

              rounded-full

              border
              border-[#dedfe2]

              bg-white

              px-[14px]

              text-[14px]
              text-[#222]

              outline-none

              focus:border-[#2065D1]
              focus:ring-2
              focus:ring-[#2065D1]/10
            "
          >

            <option value="featured">
              Featured categories
            </option>

            <option value="top_level">
              Top-level categories
            </option>

          </select>


          <p
            className="
              mt-[8px]

              max-w-[610px]

              text-[12px]
              leading-[1.5]

              text-[#777b83]
            "
          >

            {value.category_source ===
            "featured"
              ? "Shows categories you have marked as Featured. Falls back to top-level categories when none are flagged."
              : "Shows active root categories that do not have a parent category."}

          </p>

        </div>


        {/* MAX CATEGORIES */}

        <div>

          <label
            className="
              block

              mb-[8px]

              text-[11px]
              font-semibold

              tracking-[0.20em]
              uppercase

              text-[#686d75]
            "
          >
            Max Categories
          </label>


          <input
            type="number"

            min="1"
            max="20"

            value={
              value.max_categories
            }

            onChange={(event) => {

              const number =
                Number(
                  event.target.value
                );


              onChange(
                "max_categories",
                number
              );

            }}

            className="
              w-full
              h-[40px]

              rounded-full

              border
              border-[#dedfe2]

              bg-white

              px-[15px]

              text-[14px]
              text-[#222]

              outline-none

              focus:border-[#2065D1]
              focus:ring-2
              focus:ring-[#2065D1]/10
            "
          />

        </div>

      </div>

    </div>

  );

};


export default FeaturedCategoriesEditor;