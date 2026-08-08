import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  CirclePlus,
  LoaderCircle,
} from "lucide-react";

import api
  from "../../../../api/axios";

import GlobalVariantCard
  from "../../../../components/admin/products/globalVariants/GlobalVariantCard";

import GlobalVariantForm
  from "../../../../components/admin/products/globalVariants/GlobalVariantForm";

import {
  GLOBAL_VARIANT_API,
  normalizeVariant,
} from "../../../../components/admin/products/globalVariants/globalVariantConfig";


/* ==========================================================================
   ADMIN GLOBAL VARIANTS
============================================================================ */

const AdminGlobalVariants = () => {

  /*
  |--------------------------------------------------------------------------
  | VARIANTS
  |--------------------------------------------------------------------------
  */

  const [
    variants,
    setVariants,
  ] = useState([]);


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | EDITOR
  |--------------------------------------------------------------------------
  |
  | editorMode:
  |
  | null
  | create
  | edit
  |
  */

  const [
    editorMode,
    setEditorMode,
  ] = useState(null);


  const [
    editingVariantId,
    setEditingVariantId,
  ] = useState(null);


  const [
    saving,
    setSaving,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | FETCH VARIANTS
  |--------------------------------------------------------------------------
  */

  const fetchVariants =
    useCallback(
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await api.get(
              GLOBAL_VARIANT_API.index
            );


          const data =
            response.data?.variants;


          const rows =
            Array.isArray(
              data
            )
              ? data
              : [];


          setVariants(
            rows.map(
              normalizeVariant
            )
          );

        } catch (error) {

          console.error(
            "Global variants fetch error:",
            error
          );


          setVariants([]);


          setError(
            error.response?.data
              ?.message ||
            "Unable to load global variants."
          );

        } finally {

          setLoading(false);

        }

      },
      []
    );


  /*
  |--------------------------------------------------------------------------
  | INITIAL LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    fetchVariants();

  }, [
    fetchVariants,
  ]);


  /*
  |--------------------------------------------------------------------------
  | CREATE
  |--------------------------------------------------------------------------
  */

  const openCreate = () => {

    setEditorMode(
      "create"
    );


    setEditingVariantId(
      null
    );


    /*
    |--------------------------------------------------------------------------
    | SCROLL FORM INTO VIEW
    |--------------------------------------------------------------------------
    */

    setTimeout(
      () => {

        document
          .getElementById(
            "global-variant-create-form"
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

      },
      80
    );

  };


  /*
  |--------------------------------------------------------------------------
  | EDIT
  |--------------------------------------------------------------------------
  */

  const openEdit = (
    variant
  ) => {

    setEditorMode(
      "edit"
    );


    setEditingVariantId(
      variant.id
    );


    setTimeout(
      () => {

        document
          .getElementById(
            `global-variant-edit-${variant.id}`
          )
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });

      },
      80
    );

  };


  /*
  |--------------------------------------------------------------------------
  | CLOSE EDITOR
  |--------------------------------------------------------------------------
  */

  const closeEditor = () => {

    setEditorMode(null);

    setEditingVariantId(null);

  };


  /*
  |--------------------------------------------------------------------------
  | CREATE VARIANT
  |--------------------------------------------------------------------------
  */

  const createVariant =
    async (
      payload
    ) => {

      try {

        setSaving(true);


        const response =
          await api.post(
            GLOBAL_VARIANT_API.create,
            payload
          );


        const newVariant =
          response.data?.variant;


        if (!newVariant) {

          throw new Error(
            "Invalid server response."
          );

        }


        /*
        |--------------------------------------------------------------------------
        | INSERT NEW VARIANT
        |--------------------------------------------------------------------------
        */

        setVariants(
          (prev) => [
            ...prev,
            normalizeVariant(
              newVariant
            ),
          ]
        );


        closeEditor();


        return {
          success: true,
        };

      } catch (error) {

        console.error(
          "Create global variant error:",
          error
        );


        return {

          success: false,

          message:
            error.response?.data
              ?.message ||
            error.message ||
            "Unable to create global variant.",

          errors:
            error.response?.data
              ?.errors ||
            {},

        };

      } finally {

        setSaving(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | UPDATE VARIANT
  |--------------------------------------------------------------------------
  */

  const updateVariant =
    async (
      variantId,
      payload
    ) => {

      try {

        setSaving(true);


        const response =
          await api.post(
            GLOBAL_VARIANT_API.update(
              variantId
            ),
            payload
          );


        const updated =
          response.data?.variant;


        if (!updated) {

          throw new Error(
            "Invalid server response."
          );

        }


        /*
        |--------------------------------------------------------------------------
        | UPDATE LOCAL LIST
        |--------------------------------------------------------------------------
        */

        setVariants(
          (prev) =>
            prev.map(
              (variant) =>
                variant.id ===
                variantId

                  ? normalizeVariant(
                      updated
                    )

                  : variant
            )
        );


        closeEditor();


        return {
          success: true,
        };

      } catch (error) {

        console.error(
          "Update global variant error:",
          error
        );


        return {

          success: false,

          message:
            error.response?.data
              ?.message ||
            error.message ||
            "Unable to update global variant.",

          errors:
            error.response?.data
              ?.errors ||
            {},

        };

      } finally {

        setSaving(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | DELETE VARIANT
  |--------------------------------------------------------------------------
  */

  const deleteVariant =
    async (
      variant
    ) => {

      if (!variant?.id) {

        closeEditor();

        return;

      }


      const confirmed =
        window.confirm(
          `Delete "${variant.name}" and all of its option values?`
        );


      if (!confirmed) {
        return;
      }


      try {

        setSaving(true);


        await api.delete(
          GLOBAL_VARIANT_API.delete(
            variant.id
          )
        );


        /*
        |--------------------------------------------------------------------------
        | REMOVE FROM UI
        |--------------------------------------------------------------------------
        */

        setVariants(
          (prev) =>
            prev.filter(
              (item) =>
                item.id !==
                variant.id
            )
        );


        closeEditor();

      } catch (error) {

        console.error(
          "Delete global variant error:",
          error
        );


        window.alert(
          error.response?.data
            ?.message ||
          "Unable to delete global variant."
        );

      } finally {

        setSaving(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | GET EDITING VARIANT
  |--------------------------------------------------------------------------
  */

  const editingVariant =
    variants.find(
      (variant) =>
        variant.id ===
        editingVariantId
    ) || null;


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="
        min-h-[calc(100vh-74px)]

        bg-[#f6f7f8]

        px-6
        py-6

        font-['Inter']
      "
    >

      <div
        className="
          max-w-[760px]
          mx-auto
        "
      >

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div
          className="
            rounded-[20px]

            border
            border-[#dedfe3]

            bg-white

            px-[23px]
            py-[22px]

            shadow-[0_2px_7px_rgba(0,0,0,0.04)]
          "
        >

          <h1
            className="
              text-[23px]
              leading-none
              font-bold

              text-[#111827]
            "
          >
            Global Variants
          </h1>


          <p
            className="
              mt-[10px]

              text-[13px]
              text-[#747982]
            "
          >
            Create one variant once and use it to any product in the store.
          </p>

        </div>


        {/* =====================================================
            ERROR
        ====================================================== */}

        {error && (

          <div
            className="
              mt-[16px]

              rounded-[12px]

              border
              border-red-200

              bg-red-50

              px-[15px]
              py-[12px]

              text-[12px]
              text-red-600
            "
          >
            {error}
          </div>

        )}


        {/* =====================================================
            LOADING
        ====================================================== */}

        {loading ? (

          <div
            className="
              min-h-[250px]

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

                text-[12px]
                text-[#777]
              "
            >
              Loading global variants...
            </p>

          </div>

        ) : (

          <div
            className="
              mt-[16px]

              space-y-[11px]
            "
          >

            {/* =================================================
                VARIANTS
            ================================================== */}

            {variants.map(
              (variant) => {

                const isEditing =
                  editorMode ===
                    "edit" &&
                  editingVariantId ===
                    variant.id;


                /*
                |--------------------------------------------------------------------------
                | EDIT FORM
                |--------------------------------------------------------------------------
                */

                if (isEditing) {

                  return (
                    <div
                      key={
                        variant.id
                      }

                      id={
                        `global-variant-edit-${variant.id}`
                      }
                    >

                      <GlobalVariantForm
                        mode="edit"

                        variant={
                          variant
                        }

                        saving={
                          saving
                        }

                        onSave={(
                          payload
                        ) =>
                          updateVariant(
                            variant.id,
                            payload
                          )
                        }

                        onDelete={() =>
                          deleteVariant(
                            variant
                          )
                        }

                        onCancel={
                          closeEditor
                        }
                      />

                    </div>
                  );

                }


                /*
                |--------------------------------------------------------------------------
                | NORMAL CARD
                |--------------------------------------------------------------------------
                */

                return (
                  <GlobalVariantCard
                    key={
                      variant.id
                    }

                    variant={
                      variant
                    }

                    onEdit={
                      openEdit
                    }
                  />
                );

              }
            )}


            {/* =================================================
                CREATE FORM
            ================================================== */}

            {editorMode ===
            "create" ? (

              <div
                id="
                  global-variant-create-form
                "
              >

                <GlobalVariantForm
                  mode="create"

                  saving={
                    saving
                  }

                  onSave={
                    createVariant
                  }

                  onDelete={
                    closeEditor
                  }

                  onCancel={
                    closeEditor
                  }
                />

              </div>

            ) : (

              /* =================================================
                  CREATE VARIANT BUTTON
              ================================================== */

              <button
                type="button"

                onClick={
                  openCreate
                }

                className="
                  w-full
                  min-h-[57px]

                  rounded-[18px]

                  border
                  border-[#dedfe3]

                  bg-white

                  px-[20px]

                  flex
                  items-center
                  gap-[8px]

                  text-left

                  shadow-[0_2px_6px_rgba(0,0,0,0.025)]

                  hover:border-[#cfd2d7]
                  hover:bg-[#fdfdfd]

                  transition-all
                "
              >

                <CirclePlus
                  size={19}

                  strokeWidth={1.7}

                  className="
                    text-[#555b63]
                  "
                />


                <span
                  className="
                    text-[15px]
                    font-semibold

                    text-[#111827]
                  "
                >
                  Create Variant
                </span>

              </button>

            )}

          </div>

        )}

      </div>

    </div>
  );

};


export default AdminGlobalVariants;