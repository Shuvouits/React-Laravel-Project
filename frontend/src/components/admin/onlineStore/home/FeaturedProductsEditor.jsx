const SOURCE_OPTIONS = [
  { value: "all_products", label: "All products (browse with infinite scroll)" },
  { value: "featured", label: "Featured products" },
  { value: "latest", label: "Latest products" },
  { value: "on_sale", label: "Discounted / On Sale (compare-at price)" },
  { value: "hand_picked", label: "Hand-picked products" },
];

const SOURCE_HELP = {
  all_products: "Shows every active product and lazy-loads more as the shopper scrolls. Category tabs, price and sort filter across all products.",
  featured: "Shows active products that have been marked as Featured.",
  latest: "Shows the most recently created active products first.",
  on_sale: "Shows active products whose sale price is lower than their compare-at price.",
  hand_picked: "Lets you manually choose the exact products that appear in this section.",
};

const FeaturedProductsEditor = ({ value, onChange }) => {
  return (
    <div className="rounded-[14px] border border-[#e0e1e4] bg-[#fbfbfc] p-[14px]">
      <div>
        <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[2px] text-[#676b72]">
          Featured Products Heading
        </label>

        <input
          type="text"
          value={value?.title || ""}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="Leave empty for default text"
          className="h-[40px] w-full rounded-[10px] border border-[#dedfe3] bg-white px-[13px] text-[13px] outline-none focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10"
        />
      </div>

      <div className="mt-[14px] max-w-[530px]">
        <label className="mb-[7px] block text-[11px] font-semibold uppercase tracking-[2px] text-[#676b72]">
          Product Source
        </label>

        <select
          value={value?.product_source || "all_products"}
          onChange={(e) => onChange("product_source", e.target.value)}
          className="h-[40px] w-full cursor-pointer rounded-[10px] border border-[#dedfe3] bg-white px-[12px] text-[13px] outline-none focus:border-[#2065D1] focus:ring-2 focus:ring-[#2065D1]/10"
        >
          {SOURCE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <p className="mt-[8px] text-[11px] leading-[1.5] text-[#767b83]">
          {SOURCE_HELP[value?.product_source || "all_products"]}
        </p>
      </div>

      {value?.product_source === "hand_picked" && (
        <div className="mt-[15px] rounded-[10px] border border-dashed border-[#d5d7dc] bg-white px-[14px] py-[16px] text-[12px] text-[#777]">
          Product picker will appear here.
        </div>
      )}
    </div>
  );
};

export default FeaturedProductsEditor;