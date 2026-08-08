export const EMPTY_BRAND_FORM = {
  name: "",
  description: "",
  website: "",
  status: "active",
  is_featured: false,
  display_order: 0,
  seo_title: "",
  seo_description: "",
  slug: "",
};


export const AI_TONES = [
  {
    value: "default",
    label: "Default tone",
  },
  {
    value: "friendly",
    label: "Friendly",
  },
  {
    value: "professional",
    label: "Professional",
  },
  {
    value: "luxury",
    label: "Luxury",
  },
  {
    value: "playful",
    label: "Playful",
  },
  {
    value: "supportive",
    label: "Supportive",
  },
];


export const slugify = (value) => {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};