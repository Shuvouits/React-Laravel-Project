const ProductsOnSaleEditor = ({
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

        px-[18px]
        py-[18px]
      "
    >

      {/* =====================================================
          TITLE + SUBTITLE
      ====================================================== */}

      <div
        className="
          grid
          grid-cols-1
          lg:grid-cols-2

          gap-[14px]
        "
      >

        {/* SECTION TITLE */}

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

            placeholder="Product On Sale"

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


        {/* SECTION SUBTITLE */}

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
            Section Subtitle
          </label>


          <input
            type="text"

            value={
              value.subtitle
            }

            onChange={(event) =>
              onChange(
                "subtitle",
                event.target.value
              )
            }

            placeholder="Optional subtitle"

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


      {/* =====================================================
          PRODUCT SETTINGS
      ====================================================== */}

      <div
        className="
          mt-[18px]

          grid
          grid-cols-1
          lg:grid-cols-3

          gap-[14px]
        "
      >

        {/* =================================================
            PRODUCT SOURCE
        ================================================== */}

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
            Product Source
          </label>


          <select
            value={
              value.product_source
            }

            onChange={(event) =>
              onChange(
                "product_source",
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

            <option value="on_sale">
              Discounted / On Sale (compare-at price)
            </option>

            <option value="latest">
              Latest products
            </option>

            <option value="featured">
              Featured products
            </option>

          </select>


          <p
            className="
              mt-[8px]

              text-[12px]
              leading-[1.5]

              text-[#777b83]
            "
          >

            {value.product_source ===
            "on_sale"
              ? "Automatically shows products whose compare-at price is higher than their price. Variant sale prices can also be included later."
              : value.product_source ===
                "featured"
              ? "Shows products that are marked as Featured."
              : "Shows the most recently created active products."}

          </p>

        </div>


        {/* =================================================
            MAX PRODUCTS
        ================================================== */}

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
            Max Products
          </label>


          <input
            type="number"

            min="1"
            max="24"

            value={
              value.max_products
            }

            onChange={(event) => {

              onChange(
                "max_products",
                Number(
                  event.target.value
                )
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

              outline-none

              focus:border-[#2065D1]
              focus:ring-2
              focus:ring-[#2065D1]/10
            "
          />


          <p
            className="
              mt-[8px]

              text-[12px]
              leading-[1.5]

              text-[#777b83]
            "
          >
            If no products match this rule, the latest products can be used as a fallback.
          </p>

        </div>


        {/* =================================================
            DESKTOP CARDS
        ================================================== */}

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
            Desktop Cards Per Row
          </label>


          <input
            type="number"

            min="2"
            max="6"

            value={
              value.desktop_cards_per_row
            }

            onChange={(event) => {

              onChange(
                "desktop_cards_per_row",
                Number(
                  event.target.value
                )
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

              outline-none

              focus:border-[#2065D1]
              focus:ring-2
              focus:ring-[#2065D1]/10
            "
          />


          <p
            className="
              mt-[8px]

              text-[12px]
              leading-[1.5]

              text-[#777b83]
            "
          >
            Mobile and tablet card widths stay responsive automatically.
          </p>

        </div>

      </div>

    </div>

  );

};


export default ProductsOnSaleEditor;