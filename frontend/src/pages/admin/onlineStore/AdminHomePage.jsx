import {
  useEffect,
  useState,
} from "react";

import {
  ExternalLink,
  LoaderCircle,
  Save,
} from "lucide-react";

import api from "../../../api/axios";

import PageBuilderItem from "../../../components/admin/onlineStore/home/PageBuilderItem";

import FeaturedCategoriesEditor from "../../../components/admin/onlineStore/home/FeaturedCategoriesEditor";

import ProductsOnSaleEditor from "../../../components/admin/onlineStore/home/ProductsOnSaleEditor";

import HeroSliderEditor from "../../../components/admin/onlineStore/home/HeroSliderEditor";

import PromotionsOffersEditor from "../../../components/admin/onlineStore/home/PromotionsOffersEditor";

import {
  getFeaturedCategoriesSettings,
  getProductsOnSaleSettings,
  getPromotionsSettings,
  sectionDescriptions,
} from "../../../components/admin/onlineStore/home/homeSectionConfig";


const AdminHomePage = () => {

  /* ==========================================================================
     ACTIVE EDITOR
  ============================================================================ */

  const [
    activeEditor,
    setActiveEditor,
  ] = useState(null);


  /* ==========================================================================
     HOME SECTIONS
  ============================================================================ */

  const [
    sections,
    setSections,
  ] = useState([]);


  const [
    sectionsLoading,
    setSectionsLoading,
  ] = useState(true);


  const [
    sectionError,
    setSectionError,
  ] = useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");


  const [
    togglingSection,
    setTogglingSection,
  ] = useState(null);


  /* ==========================================================================
     SAVE STATE
  ============================================================================ */

  const [
    saving,
    setSaving,
  ] = useState(false);


  /* ==========================================================================
     FEATURED CATEGORIES DRAFT
  ============================================================================ */

  const [
    featuredDraft,
    setFeaturedDraft,
  ] = useState({

    title:
      "Featured Categories",

    category_source:
      "featured",

    max_categories:
      8,

  });


  /* ==========================================================================
     PRODUCTS ON SALE DRAFT
  ============================================================================ */

  const [
    productsOnSaleDraft,
    setProductsOnSaleDraft,
  ] = useState({

    title:
      "Product On Sale",

    subtitle:
      "",

    product_source:
      "on_sale",

    max_products:
      8,

    desktop_cards_per_row:
      4,

  });


  /* ==========================================================================
     PROMOTIONS & OFFERS DRAFT
  ============================================================================ */

  const [
    promotionsDraft,
    setPromotionsDraft,
  ] = useState({

    title:
      "Promotions & Offers",

    cards: [],

  });


  /* ==========================================================================
     PROMOTION AI TARGET
  ============================================================================ */

  const [
    promotionAiTarget,
    setPromotionAiTarget,
  ] = useState(null);


  /* ==========================================================================
     FETCH HOME SECTIONS
  ============================================================================ */

  const fetchSections =
    async () => {

      try {

        setSectionsLoading(
          true
        );

        setSectionError("");


        const response =
          await api.get(
            "/admin/home-sections"
          );


        const apiSections =
          response.data
            ?.sections ||
          [];


        const formattedSections =
          [...apiSections]

            .sort(
              (a, b) =>
                Number(
                  a.sort_order
                ) -
                Number(
                  b.sort_order
                )
            )

            .map(
              (section) => ({

                ...section,

                is_active:
                  section.is_active ===
                    true ||
                  section.is_active ===
                    1 ||
                  section.is_active ===
                    "1",

                settings:
                  section.settings ||
                  {},

                description:
                  sectionDescriptions[
                    section.section_key
                  ] || "",

              })
            );


        setSections(
          formattedSections
        );

      } catch (error) {

        console.error(
          "Home sections error:",
          error
        );


        setSectionError(
          error.response
            ?.data
            ?.message ||
          "Unable to load homepage sections."
        );

      } finally {

        setSectionsLoading(
          false
        );

      }

    };


  /* ==========================================================================
     INITIAL LOAD
  ============================================================================ */

  useEffect(() => {

    fetchSections();

  }, []);


  /* ==========================================================================
     TOGGLE SECTION VISIBILITY
  ============================================================================ */

  const handleToggleSection =
    async (
      section
    ) => {

      if (
        togglingSection
      ) {
        return;
      }


      try {

        setTogglingSection(
          section.section_key
        );


        setSectionError("");

        setSuccessMessage("");


        const response =
          await api.post(
            `/admin/home-sections/${section.section_key}/toggle`
          );


        const updatedSection =
          response.data
            ?.section;


        setSections(
          (previous) =>
            previous.map(
              (item) => {

                if (
                  item.section_key !==
                  section.section_key
                ) {

                  return item;

                }


                return {

                  ...item,

                  ...updatedSection,

                  is_active:
                    updatedSection
                      ?.is_active ===
                      true ||
                    updatedSection
                      ?.is_active ===
                      1 ||
                    updatedSection
                      ?.is_active ===
                      "1",

                  description:
                    item.description,

                };

              }
            )
        );

      } catch (error) {

        console.error(
          "Toggle section error:",
          error
        );


        setSectionError(
          error.response
            ?.data
            ?.message ||
          "Unable to update section visibility."
        );

      } finally {

        setTogglingSection(
          null
        );

      }

    };


  /* ==========================================================================
     EDIT SECTION
  ============================================================================ */

 const handleEditSection = (section) => {
  setSuccessMessage("");
  setSectionError("");

  /*
  |--------------------------------------------------------------------------
  | HERO
  |--------------------------------------------------------------------------
  */

  if (section.section_key === "hero") {
    setActiveEditor("hero");
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | FEATURED CATEGORIES
  |--------------------------------------------------------------------------
  */

  if (section.section_key === "featured_categories") {
    if (activeEditor === "featured_categories") {
      setActiveEditor(null);
      return;
    }

    setFeaturedDraft(
      getFeaturedCategoriesSettings(section)
    );

    setActiveEditor("featured_categories");
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | PRODUCTS ON SALE
  |--------------------------------------------------------------------------
  */

  if (section.section_key === "products_on_sale") {
    if (activeEditor === "products_on_sale") {
      setActiveEditor(null);
      return;
    }

    setProductsOnSaleDraft(
      getProductsOnSaleSettings(section)
    );

    setActiveEditor("products_on_sale");
    return;
  }

  /*
  |--------------------------------------------------------------------------
  | PROMOTIONS & OFFERS
  |--------------------------------------------------------------------------
  */

  if (section.section_key === "promotions") {
    if (activeEditor === "promotions") {
      setActiveEditor(null);
      return;
    }

    setPromotionsDraft(
      getPromotionsSettings(section)
    );

    setActiveEditor("promotions");

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    */

    setSectionError("");

    return;
  }

  /*
  |--------------------------------------------------------------------------
  | FUTURE SECTIONS
  |--------------------------------------------------------------------------
  |
  | Do not show a global red error just because the editor has not been
  | implemented yet.
  |
  |--------------------------------------------------------------------------
  */

  console.log(
    `Editor not added yet: ${section.section_key}`
  );
};


  /* ==========================================================================
     FEATURED CATEGORIES CHANGE
  ============================================================================ */

  const handleFeaturedChange = (
    field,
    value
  ) => {

    setFeaturedDraft(
      (previous) => ({

        ...previous,

        [field]:
          value,

      })
    );

  };


  /* ==========================================================================
     PRODUCTS ON SALE CHANGE
  ============================================================================ */

  const handleProductsOnSaleChange = (
    field,
    value
  ) => {

    setProductsOnSaleDraft(
      (previous) => ({

        ...previous,

        [field]:
          value,

      })
    );

  };


  /* ==========================================================================
     PROMOTIONS CHANGE
  ============================================================================ */

  const handlePromotionsChange = (
    field,
    value
  ) => {

    setPromotionsDraft(
      (previous) => ({

        ...previous,

        [field]:
          value,

      })
    );

  };


  /* ==========================================================================
     PROMOTION IMAGE SELECT
  ============================================================================ */

const handlePromotionImageSelect =
  async (index, file) => {
    if (!file) {
      return;
    }

    setSectionError("");
    setSuccessMessage("");

    /*
    |--------------------------------------------------------------------------
    | TEMPORARY PREVIEW
    |--------------------------------------------------------------------------
    */

    const temporaryPreview =
      URL.createObjectURL(file);

    setPromotionsDraft((previous) => {
      const cards = [
        ...(previous.cards || []),
      ];

      cards[index] = {
        ...(cards[index] || {}),

        image_url:
          temporaryPreview,

        uploading:
          true,
      };

      return {
        ...previous,
        cards,
      };
    });

    try {
      /*
      |--------------------------------------------------------------------------
      | FORM DATA
      |--------------------------------------------------------------------------
      */

      const formData =
        new FormData();

      formData.append(
        "image",
        file
      );

      /*
      |--------------------------------------------------------------------------
      | UPLOAD
      |--------------------------------------------------------------------------
      */

      const response =
        await api.post(
          `/admin/home-sections/promotions/cards/${index}/image`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      /*
      |--------------------------------------------------------------------------
      | SAVED CARD
      |--------------------------------------------------------------------------
      */

      const savedCard =
        response.data?.card || {};

      const savedImageUrl =
        response.data?.image_url ||
        savedCard?.image_url ||
        "";

      /*
      |--------------------------------------------------------------------------
      | UPDATE LOCAL CARD
      |--------------------------------------------------------------------------
      */

      setPromotionsDraft((previous) => {
        const cards = [
          ...(previous.cards || []),
        ];

        cards[index] = {
          ...(cards[index] || {}),
          ...savedCard,

          image_url:
            savedImageUrl,

          saved_image_url:
            savedImageUrl,

          image_file:
            null,

          temporary_preview:
            false,

          uploading:
            false,
        };

        return {
          ...previous,
          cards,
        };
      });

      /*
      |--------------------------------------------------------------------------
      | CLEAR ERROR
      |--------------------------------------------------------------------------
      */

      setSectionError("");

      /*
      |--------------------------------------------------------------------------
      | SUCCESS
      |--------------------------------------------------------------------------
      */

      setSuccessMessage(
        response.data?.message ||
        "Promotion image uploaded successfully."
      );
    } catch (error) {
      console.error(
        "Promotion image upload error:",
        error
      );

      /*
      |--------------------------------------------------------------------------
      | ERROR
      |--------------------------------------------------------------------------
      */

      setSectionError(
        error.response?.data?.message ||
          error.response?.data?.errors?.image?.[0] ||
          "Unable to upload promotion image."
      );

      /*
      |--------------------------------------------------------------------------
      | STOP LOADING
      |--------------------------------------------------------------------------
      */

      setPromotionsDraft((previous) => {
        const cards = [
          ...(previous.cards || []),
        ];

        cards[index] = {
          ...(cards[index] || {}),

          uploading:
            false,

          image_url:
            cards[index]
              ?.saved_image_url ||
            "",
        };

        return {
          ...previous,
          cards,
        };
      });
    } finally {
      URL.revokeObjectURL(
        temporaryPreview
      );
    }
  };


  /* ==========================================================================
     PROMOTION AI STUDIO
  ============================================================================ */

  const handlePromotionAiOpen = (
    index
  ) => {

    setPromotionAiTarget(
      index
    );


    /*
    |--------------------------------------------------------------------------
    | AI IMAGE STUDIO
    |--------------------------------------------------------------------------
    |
    | Existing Brand AI Studio এখানে reuse করা হবে।
    | promotionAiTarget = কোন promotion card edit হচ্ছে।
    |
    |--------------------------------------------------------------------------
    */

    console.log(
      "Promotion AI Studio card:",
      index
    );

  };


  /* ==========================================================================
     UPDATE PROMOTION FROM AI
  ============================================================================ */

  const handlePromotionAiImageUpdated = (
    imageUrl
  ) => {

    if (
      promotionAiTarget ===
        null ||
      !imageUrl
    ) {

      return;

    }


    setPromotionsDraft(
      (previous) => {

        const cards =
          [...previous.cards];


        cards[
          promotionAiTarget
        ] = {

          ...cards[
            promotionAiTarget
          ],

          image_url:
            imageUrl,

          image_file:
            null,

          temporary_preview:
            false,

        };


        return {

          ...previous,

          cards,

        };

      }
    );


    setPromotionAiTarget(
      null
    );

  };


  /* ==========================================================================
     UPDATE LOCAL SECTION
  ============================================================================ */

  const updateLocalSection = (
    sectionKey,
    updatedSection
  ) => {

    setSections(
      (previous) =>
        previous.map(
          (section) => {

            if (
              section.section_key !==
              sectionKey
            ) {

              return section;

            }


            return {

              ...section,

              ...updatedSection,

              settings:
                updatedSection
                  ?.settings ||
                section.settings ||
                {},

              description:
                section.description,

            };

          }
        )
    );

  };


  /* ==========================================================================
     SAVE FEATURED CATEGORIES
  ============================================================================ */

  const saveFeaturedCategories =
    async () => {

      /*
      |--------------------------------------------------------------------------
      | TITLE
      |--------------------------------------------------------------------------
      */

      if (
        !featuredDraft
          .title
          .trim()
      ) {

        setSectionError(
          "Section title is required."
        );

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | MAX
      |--------------------------------------------------------------------------
      */

      const maxCategories =
        Number(
          featuredDraft
            .max_categories
        );


      if (
        maxCategories < 1 ||
        maxCategories > 20
      ) {

        setSectionError(
          "Max categories must be between 1 and 20."
        );

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | SAVE
      |--------------------------------------------------------------------------
      */

      const response =
        await api.post(
          "/admin/home-sections/featured_categories/update",
          {

            title:
              featuredDraft
                .title
                .trim(),

            settings: {

              category_source:
                featuredDraft
                  .category_source,

              max_categories:
                maxCategories,

            },

          }
        );


      updateLocalSection(
        "featured_categories",
        response.data
          ?.section
      );


      setSuccessMessage(
        response.data
          ?.message ||
        "Featured Categories settings saved successfully."
      );

  };


  /* ==========================================================================
     SAVE PRODUCTS ON SALE
  ============================================================================ */

  const saveProductsOnSale =
    async () => {

      /*
      |--------------------------------------------------------------------------
      | TITLE
      |--------------------------------------------------------------------------
      */

      if (
        !productsOnSaleDraft
          .title
          .trim()
      ) {

        setSectionError(
          "Section title is required."
        );

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | MAX PRODUCTS
      |--------------------------------------------------------------------------
      */

      const maxProducts =
        Number(
          productsOnSaleDraft
            .max_products
        );


      if (
        maxProducts < 1 ||
        maxProducts > 24
      ) {

        setSectionError(
          "Max products must be between 1 and 24."
        );

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | DESKTOP CARDS
      |--------------------------------------------------------------------------
      */

      const desktopCards =
        Number(
          productsOnSaleDraft
            .desktop_cards_per_row
        );


      if (
        desktopCards < 2 ||
        desktopCards > 6
      ) {

        setSectionError(
          "Desktop cards per row must be between 2 and 6."
        );

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | SAVE
      |--------------------------------------------------------------------------
      */

      const response =
        await api.post(
          "/admin/home-sections/products_on_sale/update",
          {

            title:
              productsOnSaleDraft
                .title
                .trim(),

            settings: {

              subtitle:
                productsOnSaleDraft
                  .subtitle
                  .trim(),

              product_source:
                productsOnSaleDraft
                  .product_source,

              max_products:
                maxProducts,

              desktop_cards_per_row:
                desktopCards,

            },

          }
        );


      updateLocalSection(
        "products_on_sale",
        response.data
          ?.section
      );


      setSuccessMessage(
        response.data
          ?.message ||
        "Products on Sale settings saved successfully."
      );

  };


  /* ==========================================================================
     SAVE PROMOTIONS & OFFERS
  ============================================================================ */

 const savePromotions =
  async () => {

    if (
      !promotionsDraft
        .title
        .trim()
    ) {
      setSectionError(
        "Section title is required."
      );

      return;
    }


    const cards =
      Array.isArray(
        promotionsDraft.cards
      )
        ? promotionsDraft.cards
        : [];


    const formattedCards =
      cards.map(
        (card) => ({
          layout:
            card.layout || "",

          image_url:
            card.saved_image_url ||
            (
              card.image_url
                ?.startsWith("blob:")
                ? ""
                : card.image_url || ""
            ),

          image_alt:
            card.image_alt || "",

          link:
            card.link || "/products",
        })
      );


    const response =
      await api.post(
        "/admin/home-sections/promotions/update",
        {
          title:
            promotionsDraft
              .title
              .trim(),

          settings: {
            cards:
              formattedCards,
          },
        }
      );


    updateLocalSection(
      "promotions",
      response.data?.section
    );


    /*
    |--------------------------------------------------------------------------
    | REFRESH DRAFT WITH SAVED DATA
    |--------------------------------------------------------------------------
    */

    setPromotionsDraft(
      getPromotionsSettings(
        response.data?.section
      )
    );


    setSectionError("");


    setSuccessMessage(
      response.data?.message ||
      "Promotions & Offers saved successfully."
    );
  };


  /* ==========================================================================
     SAVE ACTIVE SECTION
  ============================================================================ */

  const handleSave =
    async () => {

      if (saving) {
        return;
      }


      /*
      |--------------------------------------------------------------------------
      | HERO SAVES INSIDE HERO EDITOR
      |--------------------------------------------------------------------------
      */

      if (
        activeEditor ===
        "hero"
      ) {

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | NOTHING OPEN
      |--------------------------------------------------------------------------
      */

      if (
        !activeEditor
      ) {

        return;

      }


      try {

        setSaving(
          true
        );

        setSectionError("");

        setSuccessMessage("");


        /*
        |--------------------------------------------------------------------------
        | FEATURED CATEGORIES
        |--------------------------------------------------------------------------
        */

        if (
          activeEditor ===
          "featured_categories"
        ) {

          await saveFeaturedCategories();

          return;

        }


        /*
        |--------------------------------------------------------------------------
        | PRODUCTS ON SALE
        |--------------------------------------------------------------------------
        */

        if (
          activeEditor ===
          "products_on_sale"
        ) {

          await saveProductsOnSale();

          return;

        }


        /*
        |--------------------------------------------------------------------------
        | PROMOTIONS
        |--------------------------------------------------------------------------
        */

        if (
          activeEditor ===
          "promotions"
        ) {

          await savePromotions();

          return;

        }

      } catch (error) {

        console.error(
          "Home section save error:",
          error
        );


        /*
        |--------------------------------------------------------------------------
        | 422 VALIDATION
        |--------------------------------------------------------------------------
        */

        if (
          error.response
            ?.status ===
          422
        ) {

          const errors =
            error.response
              ?.data
              ?.errors ||
            {};


          const firstError =
            Object.values(
              errors
            )
              .flat()
              .find(
                Boolean
              );


          setSectionError(
            firstError ||
            error.response
              ?.data
              ?.message ||
            "Please check the section settings."
          );

        }

        /*
        |--------------------------------------------------------------------------
        | GENERAL ERROR
        |--------------------------------------------------------------------------
        */

        else {

          setSectionError(
            error.response
              ?.data
              ?.message ||
            "Unable to save section settings."
          );

        }

      } finally {

        setSaving(
          false
        );

      }

    };


  /* ==========================================================================
     PREVIEW WEBSITE
  ============================================================================ */

  const handlePreview =
    () => {

      window.open(
        "/",
        "_blank",
        "noopener,noreferrer"
      );

  };


  /* ==========================================================================
     HERO FULL PAGE EDITOR
  ============================================================================ */

  if (
    activeEditor ===
    "hero"
  ) {

    return (

      <HeroSliderEditor
        onBack={() => {

          setActiveEditor(
            null
          );

          setSuccessMessage("");

          setSectionError("");

        }}
      />

    );

  }


  /* ==========================================================================
     SAVE BUTTON ENABLED
  ============================================================================ */

  const canSave =
    [
      "featured_categories",
      "products_on_sale",
      "promotions",
    ].includes(
      activeEditor
    );


  /* ==========================================================================
     PAGE BUILDER UI
  ============================================================================ */

  return (

    <div
      className="
        min-h-[calc(100vh-74px)]

        bg-[#f6f7f8]

        px-6
        py-6
      "
    >

      <div
        className="
          max-w-[1125px]

          mx-auto
        "
      >

        {/* =====================================================
            PAGE BUILDER HEADER
        ====================================================== */}

        <div
          className="
            bg-white

            border
            border-[#e4e5e8]

            rounded-[16px]

            shadow-[0_3px_10px_rgba(0,0,0,0.04)]

            px-[22px]
            py-[20px]

            flex
            items-center
            justify-between

            gap-5
          "
        >

          {/* LEFT */}

          <div>

            <h1
              className="
                text-[24px]
                leading-[1.2]

                font-bold

                tracking-[-0.5px]

                text-[#111]
              "
            >
              Page Builder
            </h1>


            <p
              className="
                mt-[7px]

                text-[15px]

                text-[#6b6f76]
              "
            >
              Drag to reorder - toggle visibility - edit content
            </p>

          </div>


          {/* RIGHT */}

          <div
            className="
              flex
              items-center

              gap-[10px]
            "
          >

            {/* PREVIEW */}

            <button
              type="button"

              onClick={
                handlePreview
              }

              className="
                h-[38px]
                px-[16px]

                rounded-[8px]

                border
                border-[#dedfe3]

                bg-white

                flex
                items-center
                justify-center

                gap-[8px]

                text-[14px]
                font-medium

                text-[#222]

                hover:bg-[#f8f8f9]

                transition-colors
              "
            >

              <ExternalLink
                size={16}
              />

              Preview

            </button>


            {/* SAVE */}

            <button
              type="button"

              onClick={
                handleSave
              }

              disabled={
                saving ||
                !canSave
              }

              className="
                h-[38px]
                px-[17px]

                rounded-[8px]

                bg-[#2065D1]

                text-white

                flex
                items-center
                justify-center

                gap-[8px]

                text-[14px]
                font-semibold

                hover:bg-[#1858bb]

                transition-colors

                disabled:bg-[#82a9e4]
                disabled:cursor-not-allowed
              "
            >

              {saving ? (

                <LoaderCircle
                  size={16}

                  className="
                    animate-spin
                  "
                />

              ) : (

                <Save
                  size={16}
                />

              )}


              {saving
                ? "Saving..."
                : "Save"}

            </button>

          </div>

        </div>


        {/* =====================================================
            SUCCESS
        ====================================================== */}

        {successMessage && (

          <div
            className="
              mt-4

              rounded-[10px]

              border
              border-green-200

              bg-green-50

              px-4
              py-3

              text-[12px]
              text-green-700
            "
          >
            {successMessage}
          </div>

        )}


        {/* =====================================================
            ERROR
        ====================================================== */}

        {sectionError && (

          <div
            className="
              mt-4

              rounded-[10px]

              border
              border-red-200

              bg-red-50

              px-4
              py-3

              text-[12px]
              text-red-600
            "
          >
            {sectionError}
          </div>

        )}


        {/* =====================================================
            LOADING
        ====================================================== */}

        {sectionsLoading ? (

          <div
            className="
              mt-[22px]

              min-h-[300px]

              bg-white

              border
              border-[#e2e3e6]

              rounded-[16px]

              flex
              flex-col
              items-center
              justify-center
            "
          >

            <LoaderCircle
              size={28}

              className="
                animate-spin

                text-[#2065D1]
              "
            />


            <p
              className="
                mt-3

                text-[13px]

                text-[#777]
              "
            >
              Loading homepage sections...
            </p>

          </div>

        ) : sections.length ===
          0 ? (

          /* ===================================================
              EMPTY
          ==================================================== */

          <div
            className="
              mt-[22px]

              min-h-[220px]

              bg-white

              border
              border-[#e2e3e6]

              rounded-[16px]

              flex
              items-center
              justify-center

              text-[13px]
              text-[#777]
            "
          >
            No homepage sections found.
          </div>

        ) : (

          /* ===================================================
              SECTIONS
          ==================================================== */

          <div
            className="
              mt-[22px]

              space-y-[12px]
            "
          >

            {sections.map(
              (section) => {

                /*
                |--------------------------------------------------------------------------
                | FEATURED CATEGORIES
                |--------------------------------------------------------------------------
                */

                const isFeaturedEditor =
                  section.section_key ===
                    "featured_categories" &&
                  activeEditor ===
                    "featured_categories";


                /*
                |--------------------------------------------------------------------------
                | PRODUCTS ON SALE
                |--------------------------------------------------------------------------
                */

                const isProductsOnSaleEditor =
                  section.section_key ===
                    "products_on_sale" &&
                  activeEditor ===
                    "products_on_sale";


                /*
                |--------------------------------------------------------------------------
                | PROMOTIONS
                |--------------------------------------------------------------------------
                */

                const isPromotionsEditor =
                  section.section_key ===
                    "promotions" &&
                  activeEditor ===
                    "promotions";


                /*
                |--------------------------------------------------------------------------
                | EDITOR OPEN
                |--------------------------------------------------------------------------
                */

                const editorOpen =
                  isFeaturedEditor ||
                  isProductsOnSaleEditor ||
                  isPromotionsEditor;


                /*
                |--------------------------------------------------------------------------
                | EDITOR COMPONENT
                |--------------------------------------------------------------------------
                */

                let editorComponent =
                  null;


                /*
                |--------------------------------------------------------------------------
                | FEATURED CATEGORIES COMPONENT
                |--------------------------------------------------------------------------
                */

                if (
                  isFeaturedEditor
                ) {

                  editorComponent = (

                    <FeaturedCategoriesEditor
                      value={
                        featuredDraft
                      }

                      onChange={
                        handleFeaturedChange
                      }
                    />

                  );

                }


                /*
                |--------------------------------------------------------------------------
                | PRODUCTS ON SALE COMPONENT
                |--------------------------------------------------------------------------
                */

                if (
                  isProductsOnSaleEditor
                ) {

                  editorComponent = (

                    <ProductsOnSaleEditor
                      value={
                        productsOnSaleDraft
                      }

                      onChange={
                        handleProductsOnSaleChange
                      }
                    />

                  );

                }


                /*
                |--------------------------------------------------------------------------
                | PROMOTIONS COMPONENT
                |--------------------------------------------------------------------------
                */

                if (
                  isPromotionsEditor
                ) {

                  editorComponent = (

                    <PromotionsOffersEditor
                      value={
                        promotionsDraft
                      }

                      onChange={
                        handlePromotionsChange
                      }

                      onImageSelect={
                        handlePromotionImageSelect
                      }

                      onOpenAi={
                        handlePromotionAiOpen
                      }
                    />

                  );

                }


                /*
                |--------------------------------------------------------------------------
                | PAGE BUILDER ITEM
                |--------------------------------------------------------------------------
                */

                return (

                  <PageBuilderItem
                    key={
                      section.id
                    }

                    section={
                      section
                    }

                    toggling={
                      togglingSection ===
                      section.section_key
                    }

                    onToggle={() =>
                      handleToggleSection(
                        section
                      )
                    }

                    onEdit={() =>
                      handleEditSection(
                        section
                      )
                    }

                    editorOpen={
                      editorOpen
                    }

                    editor={
                      editorComponent
                    }
                  />

                );

              }
            )}

          </div>

        )}

      </div>

    </div>

  );

};


export default AdminHomePage;