import {
  Box,
  MapPin,
} from "lucide-react";


const ProductCommerce = ({
  form,
  updateField,
  variants = [],
  locations = [],
  inventoryByLocation = {},
  updateLocationQuantity,
}) => {
  const hasVariants =
    variants.length > 0;


  const variantInventory =
    variants.reduce(
      (total, variant) =>
        total +
        Number(
          variant.quantity || 0
        ),
      0
    );


  const locationInventoryTotal =
    locations.reduce(
      (total, location) =>
        total +
        Number(
          inventoryByLocation[
            location.id
          ] || 0
        ),
      0
    );


  return (
    <>

      {/* PRODUCT FORMAT */}

      <Card>

        <h2 className="text-[15px] font-bold">
          Product format
        </h2>


        <button
          type="button"
          onClick={() =>
            updateField(
              "product_format",
              "physical"
            )
          }
          className="
            mt-[14px]
            w-[340px]
            max-w-full
            min-h-[78px]
            rounded-[13px]
            border-2
            border-[#2065D1]
            bg-[#f8fbff]
            px-[13px]
            flex
            items-start
            gap-[11px]
            text-left
          "
        >
          <Box
            size={19}
            className="mt-[3px] text-[#2065D1]"
          />


          <div>
            <p className="text-[13px] font-semibold">
              Physical product
            </p>

            <p className="mt-[3px] text-[10px] leading-[1.45] text-[#777]">
              Shipped to the customer. Weight and customs details are set in the Shipping section.
            </p>
          </div>
        </button>

      </Card>


      {/* PREORDER */}

      <Card>

        <h2 className="mb-[13px] text-[15px] font-bold">
          Pre-orders
        </h2>


        <ToggleRow
          label="Enable pre-orders"
          active={
            form.preorder_enabled
          }
          onClick={() =>
            updateField(
              "preorder_enabled",
              !form.preorder_enabled
            )
          }
        />

      </Card>


      {/* PRICING */}

      <Card>

        <h2 className="mb-[15px] text-[15px] font-bold">
          Pricing
        </h2>


        <div className="grid grid-cols-1 gap-[12px] md:grid-cols-3">

          <MoneyInput
            label="Price"
            value={
              form.price
            }
            onChange={(value) =>
              updateField(
                "price",
                value
              )
            }
          />


          <MoneyInput
            label="Compare-at price"
            value={
              form.compare_at_price
            }
            onChange={(value) =>
              updateField(
                "compare_at_price",
                value
              )
            }
          />


          <MoneyInput
            label="Cost per item"
            value={
              form.cost_per_item
            }
            onChange={(value) =>
              updateField(
                "cost_per_item",
                value
              )
            }
          />

        </div>

      </Card>


      {/* INVENTORY */}

      <Card>

        <h2 className="mb-[15px] text-[15px] font-bold">
          Inventory
        </h2>


        {hasVariants ? (

          <div
            className="
              mb-[14px]
              rounded-[11px]
              border
              border-dashed
              border-[#d4d6da]
              bg-[#fafbfc]
              px-[14px]
              py-[14px]
            "
          >
            <p className="text-[12px] font-semibold text-[#2c2c2c]">
              Inventory is managed in Variants
            </p>

            <p className="mt-[5px] text-[11px] leading-[1.5] text-[#777]">
              SKU, Barcode and Quantity are edited separately for each variant.
            </p>

            <p className="mt-[5px] text-[10px] text-[#999]">
              Total quantity: {variantInventory} across {variants.length} variant{variants.length === 1 ? "" : "s"}.
            </p>
          </div>

        ) : (

          <>
            <div className="mb-[18px] grid grid-cols-1 gap-[12px] md:grid-cols-2">

              <TextInput
                label="SKU"
                value={
                  form.sku
                }
                placeholder="Auto-generated if empty"
                onChange={(value) =>
                  updateField(
                    "sku",
                    value
                  )
                }
              />


              <TextInput
                label="Barcode"
                value={
                  form.barcode
                }
                placeholder="Auto-generated if empty"
                onChange={(value) =>
                  updateField(
                    "barcode",
                    value
                  )
                }
              />

            </div>


            <div className="mb-[14px]">

              <div className="mb-[12px] flex items-center justify-between gap-[12px]">

                <div className="flex items-center gap-[8px]">
                  <MapPin
                    size={16}
                    className="text-[#777]"
                  />

                  <h3 className="text-[13px] font-semibold text-[#252525]">
                    Inventory by Location
                  </h3>
                </div>


                <span
                  className="
                    rounded-full
                    bg-[#f1f3ff]
                    px-[10px]
                    py-[4px]
                    text-[10px]
                    font-semibold
                    text-[#333]
                  "
                >
                  Total: {locationInventoryTotal}
                </span>

              </div>


              {locations.length > 0 ? (

                <div className="space-y-[9px]">

                  {locations.map(
                    (location) => (
                      <InventoryLocationRow
                        key={
                          location.id
                        }
                        location={
                          location
                        }
                        quantity={
                          inventoryByLocation[
                            location.id
                          ] || 0
                        }
                        onChange={(value) =>
                          updateLocationQuantity?.(
                            location.id,
                            value
                          )
                        }
                      />
                    )
                  )}

                </div>

              ) : (

                <div
                  className="
                    rounded-[11px]
                    border
                    border-dashed
                    border-[#d5d7db]
                    bg-[#fafbfc]
                    px-[14px]
                    py-[16px]
                  "
                >
                  <p className="text-[12px] font-semibold text-[#444]">
                    No inventory locations available
                  </p>

                  <p className="mt-[4px] text-[10px] leading-[1.5] text-[#888]">
                    Add an active location first, then return here to assign inventory.
                  </p>
                </div>

              )}

            </div>

          </>

        )}


        <ToggleRow
          label="Track quantity"
          active={
            form.track_quantity
          }
          onClick={() =>
            updateField(
              "track_quantity",
              !form.track_quantity
            )
          }
        />


        <ToggleRow
          label="Continue selling when out of stock"
          active={
            form.continue_selling_when_out_of_stock
          }
          onClick={() =>
            updateField(
              "continue_selling_when_out_of_stock",
              !form.continue_selling_when_out_of_stock
            )
          }
          className="mt-[10px]"
        />

      </Card>


      {/* SHIPPING */}

      <Card>

        <div className="mb-[16px] flex items-center justify-between">

          <h2 className="text-[15px] font-bold">
            Shipping
          </h2>

          <span className="text-[11px]">
            Shipping and delivery
          </span>

        </div>


        <div className="grid grid-cols-1 gap-[12px] md:grid-cols-[1fr_120px]">

          <TextInput
            label="Weight"
            type="number"
            value={
              form.weight
            }
            onChange={(value) =>
              updateField(
                "weight",
                value
              )
            }
          />


          <div>

            <label className="mb-[7px] block text-[12px] font-medium">
              Unit
            </label>


            <select
              value={
                form.weight_unit
              }
              onChange={(event) =>
                updateField(
                  "weight_unit",
                  event.target.value
                )
              }
              className="
                h-[39px]
                w-full
                rounded-[11px]
                border
                border-[#dedfe2]
                bg-white
                px-[11px]
                text-[12px]
              "
            >
              <option value="kg">
                kg
              </option>

              <option value="g">
                g
              </option>

              <option value="lb">
                lb
              </option>

              <option value="oz">
                oz
              </option>
            </select>

          </div>

        </div>


        <div className="mt-[14px] grid grid-cols-1 gap-[12px] md:grid-cols-2">

          <TextInput
            label="Country of origin"
            value={
              form.country_of_origin
            }
            placeholder="Country"
            onChange={(value) =>
              updateField(
                "country_of_origin",
                value
              )
            }
          />


          <TextInput
            label="HS code"
            value={
              form.hs_code
            }
            placeholder="HS code"
            onChange={(value) =>
              updateField(
                "hs_code",
                value
              )
            }
          />

        </div>


        <div className="mt-[14px]">

          <TextInput
            label="Customs description"
            value={
              form.customs_description
            }
            placeholder="Short description for customs forms"
            onChange={(value) =>
              updateField(
                "customs_description",
                value
              )
            }
          />

        </div>

      </Card>

    </>
  );
};


const InventoryLocationRow = ({
  location,
  quantity,
  onChange,
}) => {
  const subtitle =
    location.city ||
    location.address_line1 ||
    location.state ||
    "";


  return (
    <div
      className="
        min-h-[58px]
        rounded-[12px]
        border
        border-[#dedfe2]
        bg-white
        px-[13px]
        py-[10px]
        flex
        items-center
        justify-between
        gap-[15px]
      "
    >

      <div className="min-w-0">

        <div className="flex flex-wrap items-center gap-[7px]">

          <span className="text-[12px] font-semibold text-[#202124]">
            {location.name}
          </span>


          {location.is_default && (
            <span
              className="
                rounded-full
                border
                border-[#dadde2]
                bg-white
                px-[7px]
                py-[2px]
                text-[9px]
                font-medium
                text-[#333]
              "
            >
              Default
            </span>
          )}

        </div>


        {subtitle && (
          <p className="mt-[3px] max-w-[360px] truncate text-[9px] text-[#8a8a8a]">
            {subtitle}
          </p>
        )}

      </div>


      <div className="flex shrink-0 items-center gap-[8px]">

        <span className="text-[10px] text-[#777]">
          Qty:
        </span>


        <input
          type="number"
          min="0"
          step="1"
          value={
            quantity ?? 0
          }
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          className="
            h-[37px]
            w-[105px]
            rounded-[11px]
            border
            border-[#dedfe2]
            bg-white
            px-[12px]
            text-[12px]
            outline-none
            transition
            focus:border-[#9ab5e4]
            focus:ring-2
            focus:ring-[#edf4ff]
          "
        />

      </div>

    </div>
  );
};


const Card = ({
  children,
}) => (
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
    {children}
  </div>
);


const ToggleRow = ({
  label,
  active,
  onClick,
  className = "",
}) => (
  <div
    className={`
      min-h-[44px]
      rounded-[11px]
      border
      border-[#dedfe2]
      px-[12px]
      flex
      items-center
      justify-between
      ${className}
    `}
  >

    <span className="text-[12px] font-medium">
      {label}
    </span>


    <button
      type="button"
      onClick={onClick}
      className={`
        relative
        h-[19px]
        w-[34px]
        rounded-full
        ${
          active
            ? "bg-[#2065D1]"
            : "bg-[#e1e3e6]"
        }
      `}
    >

      <span
        className={`
          absolute
          top-[3px]
          h-[13px]
          w-[13px]
          rounded-full
          bg-white
          transition-all
          ${
            active
              ? "left-[18px]"
              : "left-[3px]"
          }
        `}
      />

    </button>

  </div>
);


const TextInput = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder = "",
}) => (
  <div>

    <label className="mb-[7px] block text-[12px] font-medium">
      {label}
    </label>


    <input
      type={type}
      value={
        value ?? ""
      }
      placeholder={
        placeholder
      }
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      className="
        h-[39px]
        w-full
        rounded-[11px]
        border
        border-[#dedfe2]
        px-[12px]
        text-[12px]
        outline-none
      "
    />

  </div>
);


const MoneyInput = ({
  label,
  value,
  onChange,
}) => (
  <div>

    <label className="mb-[7px] block text-[12px] font-medium">
      {label}
    </label>


    <div
      className="
        h-[39px]
        rounded-[11px]
        border
        border-[#dedfe2]
        flex
        items-center
      "
    >

      <span className="pl-[12px] text-[12px] text-[#777]">
        $
      </span>


      <input
        type="number"
        step="0.01"
        min="0"
        value={
          value ?? ""
        }
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="
          h-full
          min-w-0
          flex-1
          px-[7px]
          text-[12px]
          outline-none
        "
      />

    </div>

  </div>
);


export default ProductCommerce;