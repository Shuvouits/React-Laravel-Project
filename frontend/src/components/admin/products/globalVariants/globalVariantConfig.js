/* ==========================================================================
   GLOBAL VARIANT CONFIG
============================================================================ */

export const GLOBAL_VARIANT_API = {
  index:
    "/admin/global-variants",

  create:
    "/admin/global-variants",

  show: (id) =>
    `/admin/global-variants/${id}`,

  update: (id) =>
    `/admin/global-variants/${id}/update`,

  delete: (id) =>
    `/admin/global-variants/${id}`,

  reorder:
    "/admin/global-variants/reorder",
};


/* ==========================================================================
   FRONTEND ROUTES
============================================================================ */

export const GLOBAL_VARIANT_ROUTES = {
  index:
    "/admin/products/global-variants",
};


/* ==========================================================================
   VISUAL OPTIONS
============================================================================ */

export const VISUAL_OPTIONS = [
  {
    value: "rectangle",
    label: "Rectangle",
  },
  {
    value: "circle",
    label: "Circle",
  },
  {
    value: "pill",
    label: "Pill",
  },
  {
    value: "color",
    label: "Color",
  },
];


/* ==========================================================================
   EMPTY VARIANT
============================================================================ */

export const EMPTY_VARIANT = {
  name: "",
  visual_type: "rectangle",
  sort_order: 0,
  values: [],
};


/* ==========================================================================
   COLOR HELPER
============================================================================ */

export const isColorVariant = (
  variant
) => {

  if (
    variant?.is_color === true ||
    variant?.is_color === 1 ||
    variant?.is_color === "1"
  ) {
    return true;
  }


  const name =
    String(
      variant?.name || ""
    )
      .trim()
      .toLowerCase();


  return (
    name === "color" ||
    name === "colour"
  );
};


/* ==========================================================================
   NORMALIZE VARIANT
============================================================================ */

export const normalizeVariant = (
  variant
) => {

  return {
    ...EMPTY_VARIANT,
    ...variant,

    sort_order:
      Number(
        variant?.sort_order
      ) || 0,

    values:
      Array.isArray(
        variant?.values
      )
        ? variant.values.map(
            (
              value,
              index
            ) => ({
              ...value,

              sort_order:
                Number(
                  value.sort_order
                ) || index,
            })
          )
        : [],
  };
};