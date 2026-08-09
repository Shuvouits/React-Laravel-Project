/* ==========================================================================
   SECTION DESCRIPTIONS
============================================================================ */

export const sectionDescriptions = {
  hero:
    "Cover image slider",

  featured_categories:
    "Top-level categories grid",

  products_on_sale:
    "Latest products section title",

  promotions:
    "Bento grid of feature cards and offers",

  featured_products:
    "Product discovery section heading",

  top_vendors:
    "Showcase highest-rated approved vendors",

  become_a_vendor:
    "Vendor call-to-action with image, headline & button",

  top_articles:
    "Latest published blog posts carousel",

  from_instagram:
    "Showcase Instagram posts with clickable image cards",
};


/* ==========================================================================
   FEATURED CATEGORIES SETTINGS
============================================================================ */

export const getFeaturedCategoriesSettings = (
  section
) => {

  return {

    title:
      section?.title ||
      "Featured Categories",

    category_source:
      section?.settings
        ?.category_source ||
      "featured",

    max_categories:
      Number(
        section?.settings
          ?.max_categories
      ) || 8,

  };

};


/* ==========================================================================
   PRODUCTS ON SALE SETTINGS
============================================================================ */

export const getProductsOnSaleSettings = (
  section
) => {

  return {

    title:
      section?.title ||
      "Product On Sale",

    subtitle:
      section?.settings
        ?.subtitle ||
      "",

    product_source:
      section?.settings
        ?.product_source ||
      "on_sale",

    max_products:
      Number(
        section?.settings
          ?.max_products
      ) || 8,

    desktop_cards_per_row:
      Number(
        section?.settings
          ?.desktop_cards_per_row
      ) || 4,

  };

};


/* ==========================================================================
   PROMOTIONS & OFFERS SETTINGS
============================================================================ */

/* ==========================================================================
   PROMOTIONS & OFFERS SETTINGS
============================================================================ */

export const getPromotionsSettings = (
  section
) => {

  /*
  |--------------------------------------------------------------------------
  | SAVED CARDS
  |--------------------------------------------------------------------------
  */

  const savedCards =
    Array.isArray(
      section?.settings?.cards
    )
      ? section.settings.cards
      : [];


  /*
  |--------------------------------------------------------------------------
  | DEFAULT CARDS
  |--------------------------------------------------------------------------
  */

  const defaultCards = [

    {
      layout:
        "tall_left",

      image_url:
        "",

      image_alt:
        "",

      link:
        "/products",
    },

    {
      layout:
        "tall_middle",

      image_url:
        "",

      image_alt:
        "",

      link:
        "/products",
    },

    {
      layout:
        "square_top_right",

      image_url:
        "",

      image_alt:
        "",

      link:
        "/products",
    },

    {
      layout:
        "square_top_right_arrow",

      image_url:
        "",

      image_alt:
        "",

      link:
        "/products",
    },

    /*
    |--------------------------------------------------------------------------
    | 5TH CARD
    |--------------------------------------------------------------------------
    */

    {
      layout:
        "wide_bottom_banner",

      image_url:
        "",

      image_alt:
        "",

      link:
        "/products",
    },

  ];


  /*
  |--------------------------------------------------------------------------
  | RESPONSE
  |--------------------------------------------------------------------------
  */

  return {

    title:
      section?.title ||
      "Promotions & Offers",

    cards:
      defaultCards.map(
        (
          defaultCard,
          index
        ) => {

          const savedCard =
            savedCards[index] ||
            {};


          return {

            ...defaultCard,

            ...savedCard,

            saved_image_url:
              savedCard?.image_url ||
              "",

          };

        }
      ),

  };

};