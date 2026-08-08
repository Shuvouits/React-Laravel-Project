export const EMPTY_CATEGORY_FORM = {
  name: "",
  description: "",
  parent_id: "",
  status: "active",
  is_featured: false,
  display_order: 0,
  seo_title: "",
  seo_description: "",
  slug: "",
  tags: [],
};


export const normalizeBoolean = (value) => {
  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );
};


export const slugify = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};