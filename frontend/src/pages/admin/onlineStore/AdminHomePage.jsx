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

import {
  getFeaturedCategoriesSettings,
  getProductsOnSaleSettings,
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
     SAVE STATE
  ============================================================================ */

  const [
    saving,
    setSaving,
  ] = useState(false);


  /* ==========================================================================
     FETCH HOME SECTIONS
  ============================================================================ */

  const fetchSections =
    async () => {

      try {

        setSectionsLoading(true);

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
                  section.is_active === true ||
                  section.is_active === 1 ||
                  section.is_active === "1",

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
          error.response?.data
            ?.message ||
          "Unable to load homepage sections."
        );

      } finally {

        setSectionsLoading(false);

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
                      ?.is_active === true ||
                    updatedSection
                      ?.is_active === 1 ||
                    updatedSection
                      ?.is_active === "1",

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
          error.response?.data
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

  const handleEditSection = (
    section
  ) => {

    setSuccessMessage("");

    setSectionError("");


    /*
    |--------------------------------------------------------------------------
    | HERO SLIDER
    |--------------------------------------------------------------------------
    */

    if (
      section.section_key ===
      "hero"
    ) {

      setActiveEditor(
        "hero"
      );

      return;

    }


    /*
    |--------------------------------------------------------------------------
    | FEATURED CATEGORIES
    |--------------------------------------------------------------------------
    */

    if (
      section.section_key ===
      "featured_categories"
    ) {

      if (
        activeEditor ===
        "featured_categories"
      ) {

        setActiveEditor(null);

        return;

      }


      setFeaturedDraft(
        getFeaturedCategoriesSettings(
          section
        )
      );


      setActiveEditor(
        "featured_categories"
      );

      return;

    }


    /*
    |--------------------------------------------------------------------------
    | PRODUCTS ON SALE
    |--------------------------------------------------------------------------
    */

    if (
      section.section_key ===
      "products_on_sale"
    ) {

      if (
        activeEditor ===
        "products_on_sale"
      ) {

        setActiveEditor(null);

        return;

      }


      setProductsOnSaleDraft(
        getProductsOnSaleSettings(
          section
        )
      );


      setActiveEditor(
        "products_on_sale"
      );

      return;

    }


    /*
    |--------------------------------------------------------------------------
    | OTHER SECTIONS
    |--------------------------------------------------------------------------
    */

    console.log(
      `Editor not added yet: ${section.section_key}`
    );

  };


  /* ==========================================================================
     FEATURED CATEGORIES INPUT CHANGE
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
     PRODUCTS ON SALE INPUT CHANGE
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
     UPDATE LOCAL SECTION AFTER SAVE
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
      | VALIDATE TITLE
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
      | VALIDATE MAX CATEGORIES
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
      | VALIDATE TITLE
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
     SAVE ACTIVE SECTION
  ============================================================================ */

  const handleSave =
    async () => {

      if (
        saving
      ) {
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

        setSaving(true);

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

      } catch (error) {

        console.error(
          "Home section save error:",
          error
        );


        /*
        |--------------------------------------------------------------------------
        | VALIDATION ERROR
        |--------------------------------------------------------------------------
        */

        if (
          error.response
            ?.status === 422
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

        } else {

          setSectionError(
            error.response
              ?.data
              ?.message ||
            "Unable to save section settings."
          );

        }

      } finally {

        setSaving(false);

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

          setActiveEditor(null);

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
            SUCCESS MESSAGE
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
            ERROR MESSAGE
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
                | FEATURED CATEGORIES EDITOR
                |--------------------------------------------------------------------------
                */

                const isFeaturedEditor =
                  section.section_key ===
                    "featured_categories" &&
                  activeEditor ===
                    "featured_categories";


                /*
                |--------------------------------------------------------------------------
                | PRODUCTS ON SALE EDITOR
                |--------------------------------------------------------------------------
                */

                const isProductsOnSaleEditor =
                  section.section_key ===
                    "products_on_sale" &&
                  activeEditor ===
                    "products_on_sale";


                /*
                |--------------------------------------------------------------------------
                | EDITOR OPEN
                |--------------------------------------------------------------------------
                */

                const editorOpen =
                  isFeaturedEditor ||
                  isProductsOnSaleEditor;


                /*
                |--------------------------------------------------------------------------
                | EDITOR COMPONENT
                |--------------------------------------------------------------------------
                */

                let editorComponent =
                  null;


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