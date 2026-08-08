export const PRODUCT_API = {
  index: "/admin/products",
  create: "/admin/products",
  formOptions: "/admin/products/form-options",

  show: (id) =>
    `/admin/products/${id}`,

  update: (id) =>
    `/admin/products/${id}/update`,

  delete: (id) =>
    `/admin/products/${id}`,

  toggleFeatured: (id) =>
    `/admin/products/${id}/toggle-featured`,

  reorderMedia: (id) =>
    `/admin/products/${id}/media/reorder`,

  setCover: (productId, mediaId) =>
    `/admin/products/${productId}/media/${mediaId}/cover`,

  deleteMedia: (productId, mediaId) =>
    `/admin/products/${productId}/media/${mediaId}`,

  ai: "/admin/ai/product-content",
};


export const PRODUCT_ROUTES = {
  index: "/admin/products",
  create: "/admin/products/new",

  edit: (id) =>
    `/admin/products/${id}/edit`,
};


export const EMPTY_PRODUCT = {
  title: "",
  slug: "",

  summary: "",
  description: "",
  specifications: "",

  status: "active",
  is_featured: false,

  online_store: true,
  point_of_sale: true,

  category_id: "",
  brand_id: "",
  type: "",

  tags: [],
  collection_ids: [],

  product_format: "physical",

  preorder_enabled: false,

  price: "",
  compare_at_price: "",
  cost_per_item: "",

  sku: "",
  barcode: "",
  quantity: 0,

  track_quantity: true,
  continue_selling_when_out_of_stock: false,

  weight: 0,
  weight_unit: "kg",
  country_of_origin: "",
  hs_code: "",
  customs_description: "",

  seo_title: "",
  seo_description: "",
};


export const normalizeBoolean = (value) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  value === "true";


export const slugify = (value) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");


export const money = (value) => {
  const number = Number(value);

  if (Number.isNaN(number)) {
    return "$0.00";
  }

  return `$${number.toFixed(2)}`;
};


export const buildVariantCombinations = (
  selectedOptions = [],
  previousVariants = []
) => {
  const validOptions =
    selectedOptions.filter(
      (option) =>
        Array.isArray(option.values) &&
        option.values.length > 0
    );


  if (!validOptions.length) {
    return [];
  }


  let combinations = [[]];


  validOptions.forEach((option) => {
    const next = [];

    combinations.forEach((combination) => {
      option.values.forEach((value) => {
        next.push([
          ...combination,
          {
            optionId:
              option.global_variant_id,

            optionName:
              option.name,

            valueId:
              value.global_variant_value_id,

            value:
              value.value,

            color_code:
              value.color_code || null,
          },
        ]);
      });
    });

    combinations = next;
  });


  return combinations.map(
    (combination, index) => {
      const ids = combination
        .map((item) =>
          Number(item.valueId)
        )
        .sort((a, b) => a - b);


      const key =
        ids.join("-");


      const existing =
        previousVariants.find((variant) => {
          const existingIds =
            (
              variant.global_variant_value_ids ||
              []
            )
              .map(Number)
              .sort((a, b) => a - b);

          return (
            existingIds.join("-") ===
            key
          );
        });


      return {
        id:
          existing?.id || null,

        title:
          combination
            .map(
              (item) =>
                item.value
            )
            .join(" / "),

        combination,

        global_variant_value_ids:
          ids,

        price:
          existing?.price ?? "",

        compare_at_price:
          existing?.compare_at_price ??
          "",

        cost_per_item:
          existing?.cost_per_item ??
          "",

        sku:
          existing?.sku || "",

        barcode:
          existing?.barcode || "",

        quantity:
          Number(
            existing?.quantity ?? 0
          ),

        is_active:
          existing
            ? normalizeBoolean(
                existing.is_active
              )
            : true,

        product_media_id:
          existing?.product_media_id ||
          null,

        sort_order:
          index,
      };
    }
  );
};