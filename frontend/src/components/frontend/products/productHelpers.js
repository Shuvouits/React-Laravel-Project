/*
|--------------------------------------------------------------------------
| NUMBER
|--------------------------------------------------------------------------
*/

export const toNumber = (
  value,
  fallback = 0
) => {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : fallback;

};


/*
|--------------------------------------------------------------------------
| CURRENCY
|--------------------------------------------------------------------------
*/

export const formatPrice = (
  value
) => {

  const amount =
    toNumber(value);

  return new Intl.NumberFormat(
    "en-US",
    {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }
  ).format(amount);

};


/*
|--------------------------------------------------------------------------
| PRODUCT IMAGE
|--------------------------------------------------------------------------
*/

export const getProductImage = (
  product
) => {

  if (!product) {
    return null;
  }


  if (
    product.cover_image_url
  ) {
    return product.cover_image_url;
  }


  if (
    product.image_url
  ) {
    return product.image_url;
  }


  if (
    product.featured_image_url
  ) {
    return product.featured_image_url;
  }


  if (
    product.cover_image
  ) {
    return product.cover_image;
  }


  if (
    Array.isArray(product.images) &&
    product.images.length > 0
  ) {

    return (
      product.images[0].image_url ||
      product.images[0].url ||
      product.images[0].image ||
      null
    );

  }


  if (
    Array.isArray(product.media) &&
    product.media.length > 0
  ) {

    return (
      product.media[0].image_url ||
      product.media[0].url ||
      product.media[0].image ||
      null
    );

  }


  return null;

};


/*
|--------------------------------------------------------------------------
| PRODUCT PRICE
|--------------------------------------------------------------------------
*/

export const getProductPrice = (
  product
) => {

  if (!product) {
    return 0;
  }


  if (
    product.price !== null &&
    product.price !== undefined
  ) {

    return toNumber(
      product.price
    );

  }


  if (
    product.min_price !== undefined
  ) {

    return toNumber(
      product.min_price
    );

  }


  if (
    Array.isArray(
      product.variants
    ) &&
    product.variants.length > 0
  ) {

    const prices =
      product.variants
        .map(
          (variant) =>
            toNumber(
              variant.price,
              NaN
            )
        )
        .filter(
          (price) =>
            Number.isFinite(price)
        );


    if (prices.length) {

      return Math.min(
        ...prices
      );

    }

  }


  return 0;

};


/*
|--------------------------------------------------------------------------
| COMPARE PRICE
|--------------------------------------------------------------------------
*/

export const getCompareAtPrice = (
  product
) => {

  if (!product) {
    return 0;
  }


  if (
    product.compare_at_price !== null &&
    product.compare_at_price !== undefined
  ) {

    return toNumber(
      product.compare_at_price
    );

  }


  if (
    product.max_compare_at_price !==
    undefined
  ) {

    return toNumber(
      product.max_compare_at_price
    );

  }


  if (
    Array.isArray(
      product.variants
    )
  ) {

    const saleVariant =
      product.variants.find(
        (variant) =>
          toNumber(
            variant.compare_at_price
          ) >
          toNumber(
            variant.price
          )
      );


    if (saleVariant) {

      return toNumber(
        saleVariant.compare_at_price
      );

    }

  }


  return 0;

};


/*
|--------------------------------------------------------------------------
| DISCOUNT PERCENTAGE
|--------------------------------------------------------------------------
*/

export const getDiscountPercent = (
  product
) => {

  const price =
    getProductPrice(
      product
    );


  const comparePrice =
    getCompareAtPrice(
      product
    );


  if (
    !price ||
    !comparePrice ||
    comparePrice <= price
  ) {

    return 0;

  }


  return Math.round(
    (
      (
        comparePrice -
        price
      ) /
      comparePrice
    ) *
    100
  );

};


/*
|--------------------------------------------------------------------------
| PRODUCT SUBTITLE
|--------------------------------------------------------------------------
*/

export const getProductSubtitle = (
  product
) => {

  return (
    product?.variant_label ||
    product?.subtitle ||
    product?.short_variant ||
    product?.type ||
    ""
  );

};


/*
|--------------------------------------------------------------------------
| STORE NAME
|--------------------------------------------------------------------------
*/

export const getStoreName = (
  product
) => {

  return (
    product?.store_name ||
    product?.storeName ||
    product?.vendor?.store_name ||
    product?.vendor?.name ||
    "Storify"
  );

};


/*
|--------------------------------------------------------------------------
| FEATURED
|--------------------------------------------------------------------------
*/

export const isProductFeatured = (
  product
) => {

  return (
    product?.is_featured === true ||
    product?.is_featured === 1 ||
    product?.is_featured === "1" ||
    product?.is_featured === "true"
  );

};


/*
|--------------------------------------------------------------------------
| DERIVE OPTIONS
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| PRODUCT OPTIONS
|--------------------------------------------------------------------------
*/

export const getProductOptions = (
  product
) => {

  if (!product) {
    return [];
  }


  /*
  |--------------------------------------------------------------------------
  | DIRECT PRODUCT OPTIONS
  |--------------------------------------------------------------------------
  */

  if (
    Array.isArray(
      product.options
    ) &&
    product.options.length > 0
  ) {

    return product.options;

  }


  /*
  |--------------------------------------------------------------------------
  | BUILD OPTIONS FROM VARIANTS
  |--------------------------------------------------------------------------
  */

  const variants =
    Array.isArray(
      product.variants
    )
      ? product.variants
      : [];


  const optionGroups =
    new Map();


  variants.forEach(
    (variant) => {

      const options =
        Array.isArray(
          variant.options
        )
          ? variant.options
          : [];


      options.forEach(
        (option) => {

          const name =
            option.global_variant_name ||
            option.name;


          const value =
            option.value;


          if (
            !name ||
            value === null ||
            value === undefined
          ) {
            return;
          }


          /*
          |--------------------------------------------------------------------------
          | CREATE GROUP
          |--------------------------------------------------------------------------
          */

          if (
            !optionGroups.has(
              name
            )
          ) {

            optionGroups.set(
              name,
              {
                name,
                values: [],
                items: [],
              }
            );

          }


          const group =
            optionGroups.get(
              name
            );


          /*
          |--------------------------------------------------------------------------
          | UNIQUE VALUES
          |--------------------------------------------------------------------------
          */

          if (
            !group.values.includes(
              String(value)
            )
          ) {

            group.values.push(
              String(value)
            );


            group.items.push({

              value:
                String(value),

              option_id:
                option.option_id,

              color_code:
                option.color_code ||
                null,

              image_path:
                option.image_path ||
                null,

            });

          }

        }
      );

    }
  );


  return Array.from(
    optionGroups.values()
  );

};


/*
|--------------------------------------------------------------------------
| SWATCH COLOR
|--------------------------------------------------------------------------
*/

export const getSwatchColor = (
  value
) => {

  const name =
    String(value)
      .toLowerCase()
      .trim();


  const colors = {

    black:
      "#171717",

    white:
      "#f5f5f5",

    red:
      "#ef4444",

    blue:
      "#3b82f6",

    green:
      "#22c55e",

    yellow:
      "#eab308",

    orange:
      "#f97316",

    purple:
      "#8b5cf6",

    pink:
      "#ec4899",

    gray:
      "#9ca3af",

    grey:
      "#9ca3af",

    silver:
      "#a8adb5",

    gold:
      "#d6aa54",

    brown:
      "#92400e",

    navy:
      "#1e3a8a",

  };


  return (
    colors[name] ||
    "#9ca3af"
  );

};


/*
|--------------------------------------------------------------------------
| COLOR OPTION?
|--------------------------------------------------------------------------
*/

export const isColorOption = (
  name
) => {

  const normalized =
    String(name)
      .toLowerCase();


  return (
    normalized === "color" ||
    normalized === "colour"
  );

};