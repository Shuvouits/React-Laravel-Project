export const COLLECTION_API = {
  index: "/admin/collections",
  create: "/admin/collections",

  show: (id) =>
    `/admin/collections/${id}`,

  update: (id) =>
    `/admin/collections/${id}/update`,

  delete: (id) =>
    `/admin/collections/${id}`,

  productSearch:
    "/admin/collections/products/search",

  reorderProducts: (id) =>
    `/admin/collections/${id}/products/reorder`,

  ai:
    "/admin/ai/collection-content",
};


export const COLLECTION_ROUTES = {
  index:
    "/admin/products/collections",

  create:
    "/admin/products/collections/new",

  edit: (id) =>
    `/admin/products/collections/${id}/edit`,
};


export const EMPTY_COLLECTION = {
  title: "",
  slug: "",
  description: "",

  status: "active",

  online_store: true,
  point_of_sale: false,

  collection_type: "manual",

  sort_order: "manual",
  display_position: 0,

  seo_title: "",
  seo_description: "",
};


export const SORT_OPTIONS = [
  {
    value: "manual",
    label: "Manual",
  },
  {
    value: "best_selling",
    label: "Best selling",
  },
  {
    value: "alpha_asc",
    label: "Alphabetically, A-Z",
  },
  {
    value: "alpha_desc",
    label: "Alphabetically, Z-A",
  },
  {
    value: "price_asc",
    label: "Price, low to high",
  },
  {
    value: "price_desc",
    label: "Price, high to low",
  },
  {
    value: "newest",
    label: "Newest",
  },
  {
    value: "oldest",
    label: "Oldest",
  },
];


export const normalizeBoolean = (
  value
) =>
  value === true ||
  value === 1 ||
  value === "1" ||
  value === "true";


export const slugify = (
  value
) =>
  String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");