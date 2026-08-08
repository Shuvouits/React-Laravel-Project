import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  LoaderCircle,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import api from "../../../../api/axios";



import BrandImageStudio
  from "../../brands/BrandImageStudio";

import CollectionProductPicker
  from "./CollectionProductPicker";

import CollectionSEO
  from "./CollectionSEO";

import {
  COLLECTION_API,
  COLLECTION_ROUTES,
  EMPTY_COLLECTION,
  SORT_OPTIONS,
  normalizeBoolean,
  slugify,
} from "./collectionConfig";

import BrandAITexterPopup
  from "../../brands/BrandAITexterPopup";


const CollectionForm = ({
  mode = "create",
  initialData = null,
}) => {

  const navigate =
    useNavigate();


  const imageInputRef =
    useRef(null);

  const descriptionAiRef =
    useRef(null);


  /*
  |--------------------------------------------------------------------------
  | FORM
  |--------------------------------------------------------------------------
  */

  const [
    form,
    setForm,
  ] = useState({
    ...EMPTY_COLLECTION,
  });


  /*
  |--------------------------------------------------------------------------
  | PRODUCTS
  |--------------------------------------------------------------------------
  */

  const [
    products,
    setProducts,
  ] = useState([]);


  /*
  |--------------------------------------------------------------------------
  | IMAGE
  |--------------------------------------------------------------------------
  */

  const [
    image,
    setImage,
  ] = useState(null);

  const [
    imagePreview,
    setImagePreview,
  ] = useState(null);

  const [
    removeImage,
    setRemoveImage,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    message,
    setMessage,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | AUTO FIELDS
  |--------------------------------------------------------------------------
  */

  const [
    slugEdited,
    setSlugEdited,
  ] = useState(false);

  const [
    seoTitleEdited,
    setSeoTitleEdited,
  ] = useState(false);

  const [
    metaEdited,
    setMetaEdited,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | AI DESCRIPTION
  |--------------------------------------------------------------------------
  */

  const [
    descriptionAiOpen,
    setDescriptionAiOpen,
  ] = useState(false);

  const [
    descriptionPrompt,
    setDescriptionPrompt,
  ] = useState("");

  const [
    descriptionTone,
    setDescriptionTone,
  ] = useState(
    "default"
  );

  const [
    descriptionToneOpen,
    setDescriptionToneOpen,
  ] = useState(false);


  const [
    aiLoading,
    setAiLoading,
  ] = useState(null);

  const [
    aiError,
    setAiError,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | IMAGE STUDIO
  |--------------------------------------------------------------------------
  */

  const [
    studioOpen,
    setStudioOpen,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | INITIAL DATA
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (
      mode !== "edit" ||
      !initialData
    ) {

      return;

    }


    setForm({

      title:
        initialData.title || "",

      slug:
        initialData.slug || "",

      description:
        initialData.description || "",

      status:
        initialData.status ||
        "active",

      online_store:
        normalizeBoolean(
          initialData.online_store
        ),

      point_of_sale:
        normalizeBoolean(
          initialData.point_of_sale
        ),

      collection_type:
        initialData.collection_type ||
        "manual",

      sort_order:
        initialData.sort_order ||
        "manual",

      display_position:
        initialData
          .display_position ??
        0,

      seo_title:
        initialData.seo_title ||
        "",

      seo_description:
        initialData
          .seo_description ||
        "",

    });


    setProducts(
      Array.isArray(
        initialData.products
      )
        ? initialData.products
        : []
    );


    setImagePreview(
      initialData.image_url ||
      null
    );


    setSlugEdited(
      Boolean(
        initialData.slug
      )
    );


    setSeoTitleEdited(
      Boolean(
        initialData.seo_title
      )
    );


    setMetaEdited(
      Boolean(
        initialData
          .seo_description
      )
    );

  }, [
    mode,
    initialData,
  ]);


  /*
  |--------------------------------------------------------------------------
  | FIELD CHANGE
  |--------------------------------------------------------------------------
  */

  const updateField = (
    field,
    value
  ) => {

    setForm(
      (prev) => {

        const next = {
          ...prev,
          [field]: value,
        };


        if (
          field === "title"
        ) {

          if (
            !slugEdited
          ) {

            next.slug =
              slugify(value);

          }


          if (
            !seoTitleEdited
          ) {

            next.seo_title =
              value.slice(
                0,
                70
              );

          }

        }


        if (
          field ===
            "description" &&
          !metaEdited
        ) {

          next.seo_description =
            value.slice(
              0,
              160
            );

        }


        return next;

      }
    );

  };


  /*
  |--------------------------------------------------------------------------
  | AI
  |--------------------------------------------------------------------------
  */

  const generateAI =
    async ({
      target,
      prompt = "",
      tone = "default",
    }) => {

      if (
        !form.title.trim()
      ) {

        setAiError(
          "Please enter a collection title first."
        );

        return false;

      }


      try {

        setAiLoading(
          target
        );

        setAiError("");


        const response =
          await api.post(
            COLLECTION_API.ai,
            {

              title:
                form.title.trim(),

              description:
                form.description,

              collection_type:
                form.collection_type,

              product_names:
                products.map(
                  (product) =>
                    product.title
                ),

              prompt,
              tone,
              target,

            }
          );


        const generated =
          response.data?.data;


        if (!generated) {

          throw new Error(
            "Invalid AI response."
          );

        }


        setForm(
          (prev) => {

            const next = {
              ...prev,
            };


            if (
              generated.description !==
              undefined
            ) {

              next.description =
                generated.description;

            }


            if (
              generated.seo_title
            ) {

              next.seo_title =
                generated.seo_title;

            }


            if (
              generated.seo_description
            ) {

              next.seo_description =
                generated.seo_description;

            }


            if (
              generated.slug
            ) {

              next.slug =
                slugify(
                  generated.slug
                );

            }


            return next;

          }
        );


        return true;

      } catch (error) {

        setAiError(
          error.response?.data
            ?.message ||
          error.message ||
          "Unable to generate AI content."
        );


        return false;

      } finally {

        setAiLoading(null);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | IMAGE
  |--------------------------------------------------------------------------
  */

  const selectImage = (
    file
  ) => {

    if (!file) {
      return;
    }


    if (
      ![
        "image/jpeg",
        "image/png",
        "image/webp",
      ].includes(file.type)
    ) {

      setMessage(
        "Please select JPG, PNG or WebP image."
      );

      return;
    }


    if (
      imagePreview?.startsWith(
        "blob:"
      )
    ) {

      URL.revokeObjectURL(
        imagePreview
      );

    }


    setImage(file);

    setImagePreview(
      URL.createObjectURL(
        file
      )
    );

    setRemoveImage(false);

  };


  const clearImage = () => {

    if (
      imagePreview?.startsWith(
        "blob:"
      )
    ) {

      URL.revokeObjectURL(
        imagePreview
      );

    }


    setImage(null);

    setImagePreview(null);

    setRemoveImage(true);

  };


  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  const handleSubmit =
    async (
      event
    ) => {

      event.preventDefault();


      if (saving) {
        return;
      }


      try {

        setSaving(true);

        setErrors({});

        setMessage("");


        const data =
          new FormData();


        data.append(
          "title",
          form.title
        );

        data.append(
          "slug",
          form.slug
        );

        data.append(
          "description",
          form.description
        );

        data.append(
          "status",
          form.status
        );

        data.append(
          "online_store",
          form.online_store
            ? "1"
            : "0"
        );

        data.append(
          "point_of_sale",
          form.point_of_sale
            ? "1"
            : "0"
        );

        data.append(
          "collection_type",
          form.collection_type
        );

        data.append(
          "sort_order",
          form.sort_order
        );

        data.append(
          "display_position",
          form.display_position
        );

        data.append(
          "seo_title",
          form.seo_title
        );

        data.append(
          "seo_description",
          form.seo_description
        );


        /*
        |--------------------------------------------------------------------------
        | PRODUCTS
        |--------------------------------------------------------------------------
        */

        data.append(
          "products",
          JSON.stringify(
            form.collection_type ===
            "manual"

              ? products.map(
                  (
                    product,
                    index
                  ) => ({
                    id:
                      product.id,

                    sort_order:
                      index,
                  })
                )

              : []
          )
        );


        if (image) {

          data.append(
            "image",
            image
          );

        }


        if (
          removeImage
        ) {

          data.append(
            "remove_image",
            "1"
          );

        }


        if (
          mode === "edit"
        ) {

          await api.post(
            COLLECTION_API.update(
              initialData.id
            ),
            data,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        } else {

          await api.post(
            COLLECTION_API.create,
            data,
            {
              headers: {
                "Content-Type":
                  "multipart/form-data",
              },
            }
          );

        }


        navigate(
          COLLECTION_ROUTES.index
        );

      } catch (error) {

        if (
          error.response?.status ===
          422
        ) {

          setErrors(
            error.response.data
              ?.errors ||
            {}
          );

        } else {

          setMessage(
            error.response?.data
              ?.message ||
            "Unable to save collection."
          );

        }

      } finally {

        setSaving(false);

      }

    };


  return (
    <>

      <form
        onSubmit={
          handleSubmit
        }

        className="
          min-h-[calc(100vh-74px)]

          bg-[#f6f7f8]

          px-6
          py-5

          font-['Inter']
        "
      >

        <div
          className="
            max-w-[1080px]
            mx-auto
          "
        >

          {/* =================================================
              HEADER
          ================================================== */}

          <div
            className="
              mb-[24px]

              flex
              items-start
              justify-between
              gap-5
            "
          >

            <div>

              <h1
                className="
                  text-[19px]
                  font-bold
                "
              >
                {mode === "edit"
                  ? "Edit Collection"
                  : "Create Collection"}
              </h1>


              <p
                className="
                  mt-[3px]

                  text-[12px]
                  text-[#777]
                "
              >
                {mode === "edit"
                  ? "Update collection details and visibility"
                  : "Create and organize a new product collection"}
              </p>

            </div>


            <div
              className="
                flex
                items-center
                gap-[8px]
              "
            >

              <button
                type="submit"

                disabled={saving}

                className="
                  min-h-[37px]

                  rounded-[19px]

                  bg-[#2065D1]
                  text-white

                  px-[16px]

                  flex
                  items-center
                  gap-[6px]

                  text-[12px]
                  font-semibold

                  disabled:opacity-50
                "
              >

                {saving && (

                  <LoaderCircle
                    size={13}
                    className="
                      animate-spin
                    "
                  />

                )}


                {mode === "edit"
                  ? "Update Collection"
                  : "Create Collection"}

              </button>


              <button
                type="button"

                onClick={() =>
                  navigate(
                    COLLECTION_ROUTES.index
                  )
                }

                className="
                  min-h-[37px]

                  rounded-[19px]

                  border
                  border-[#dedfe2]

                  bg-white

                  px-[15px]

                  text-[12px]
                "
              >
                Cancel
              </button>

            </div>

          </div>


          {message && (

            <ErrorBox
              text={message}
            />

          )}


          {aiError && (

            <ErrorBox
              text={aiError}
            />

          )}


          {/* =================================================
              TWO COLUMN
          ================================================== */}

          <div
            className="
              grid
              grid-cols-1

              xl:grid-cols-[minmax(0,2fr)_360px]

              gap-[16px]

              items-start
            "
          >

            {/* LEFT */}

            <div
              className="
                space-y-[16px]
              "
            >

              {/* =============================================
                  DETAILS
              ============================================== */}

              <Card>

                <h2
                  className="
                    text-[15px]
                    font-bold
                  "
                >
                  Collection Details
                </h2>


                <p
                  className="
                    mt-[3px]
                    mb-[18px]

                    text-[12px]
                    text-[#777]
                  "
                >
                  Basic information about the collection
                </p>


                <Label>
                  Title *
                </Label>


                <Input
                  value={
                    form.title
                  }

                  onChange={(e) =>
                    updateField(
                      "title",
                      e.target.value
                    )
                  }

                  error={
                    errors.title?.[0]
                  }
                />


                {/* DESCRIPTION */}

                <div
                  ref={
                    descriptionAiRef
                  }

                  className="
                    relative

                    mt-[17px]
                  "
                >

                  <div
                    className="
                      mb-[7px]

                      flex
                      items-center
                      justify-between
                    "
                  >

                    <Label noMargin>
                      Description
                    </Label>


                    <button
                      type="button"

                      onClick={() =>
                        setDescriptionAiOpen(
                          (prev) =>
                            !prev
                        )
                      }

                      className="
                        w-[28px]
                        h-[28px]

                        rounded-[6px]

                        bg-gradient-to-br
                        from-[#ff53c7]
                        via-[#ae65ff]
                        to-[#39d9e6]

                        text-white

                        flex
                        items-center
                        justify-center
                      "
                    >

                      {aiLoading ===
                      "description" ? (

                        <LoaderCircle
                          size={13}
                          className="
                            animate-spin
                          "
                        />

                      ) : (

                        <Sparkles
                          size={14}
                        />

                      )}

                    </button>

                  </div>


                  <textarea
                    value={
                      form.description
                    }

                    onChange={(e) =>
                      updateField(
                        "description",
                        e.target.value
                      )
                    }

                    placeholder="Describe this collection..."

                    className="
                      w-full
                      h-[90px]

                      rounded-[11px]

                      border
                      border-[#dedfe2]

                      p-[12px]

                      text-[13px]

                      resize-none
                      outline-none

                      focus:border-[#2065D1]
                    "
                  />


                  {descriptionAiOpen && (

                    <BrandAITexterPopup
                      prompt={
                        descriptionPrompt
                      }

                      setPrompt={
                        setDescriptionPrompt
                      }

                      tone={
                        descriptionTone
                      }

                      setTone={
                        setDescriptionTone
                      }

                      toneOpen={
                        descriptionToneOpen
                      }

                      setToneOpen={
                        setDescriptionToneOpen
                      }

                      placeholder="Describe this collection in a sentence or two..."

                      loading={
                        aiLoading ===
                        "description"
                      }

                      onGenerate={
                        async () => {

                          const success =
                            await generateAI({
                              target:
                                "description",

                              prompt:
                                descriptionPrompt,

                              tone:
                                descriptionTone,
                            });


                          if (success) {

                            setDescriptionAiOpen(
                              false
                            );

                          }

                        }
                      }

                      onAutoGenerate={
                        async () => {

                          const success =
                            await generateAI({
                              target:
                                "description",

                              tone:
                                descriptionTone,
                            });


                          if (success) {

                            setDescriptionAiOpen(
                              false
                            );

                          }

                        }
                      }

                      className="
                        top-[35px]
                        right-[10px]
                      "
                    />

                  )}

                </div>


                {/* IMAGE */}

                <div
                  className="
                    mt-[17px]
                  "
                >

                  <div
                    className="
                      flex
                      items-center
                      justify-between
                    "
                  >

                    <Label noMargin>
                      Collection Image
                    </Label>


                    <button
                      type="button"

                      onClick={() =>
                        setStudioOpen(
                          true
                        )
                      }

                      className="
                        h-[30px]
                        px-[10px]

                        rounded-[7px]

                        bg-gradient-to-r
                        from-[#ff53c7]
                        via-[#ae65ff]
                        to-[#39d9e6]

                        text-white

                        flex
                        items-center
                        gap-[5px]

                        text-[10px]
                        font-semibold
                      "
                    >

                      <Sparkles
                        size={11}
                      />

                      AI Studio

                    </button>

                  </div>


                  {imagePreview ? (

                    <div
                      className="
                        relative

                        mt-[15px]

                        w-[165px]
                        h-[165px]

                        rounded-[12px]

                        border
                        border-[#dedfe2]

                        bg-[#f6f6f6]

                        overflow-hidden
                      "
                    >

                      <img
                        src={
                          imagePreview
                        }

                        alt={
                          form.title ||
                          "Collection"
                        }

                        className="
                          w-full
                          h-full

                          object-cover
                        "
                      />


                      <span
                        className="
                          absolute
                          bottom-[7px]
                          left-[7px]

                          rounded-[5px]

                          bg-[#333]
                          text-white

                          px-[7px]
                          py-[3px]

                          text-[9px]
                          font-semibold
                        "
                      >
                        ★ Cover
                      </span>


                      <button
                        type="button"

                        onClick={
                          clearImage
                        }

                        className="
                          absolute
                          top-[7px]
                          right-[7px]

                          w-[27px]
                          h-[27px]

                          rounded-full

                          bg-white

                          border
                          border-[#ddd]

                          flex
                          items-center
                          justify-center
                        "
                      >

                        <X
                          size={13}
                        />

                      </button>

                    </div>

                  ) : (

                    <button
                      type="button"

                      onClick={() =>
                        imageInputRef
                          .current
                          ?.click()
                      }

                      className="
                        mt-[15px]

                        w-full
                        min-h-[145px]

                        rounded-[12px]

                        border
                        border-dashed
                        border-[#ced1d7]

                        flex
                        flex-col
                        items-center
                        justify-center

                        gap-[8px]
                      "
                    >

                      <Upload
                        size={26}
                        className="
                          text-[#777]
                        "
                      />


                      <span
                        className="
                          text-[12px]
                          font-medium
                        "
                      >
                        Drag and drop files here, or click to browse
                      </span>


                      <span
                        className="
                          text-[10px]
                          text-[#888]
                        "
                      >
                        JPG, PNG or WebP
                      </span>

                    </button>

                  )}


                  <input
                    ref={
                      imageInputRef
                    }

                    type="file"

                    accept="
                      image/jpeg,
                      image/png,
                      image/webp
                    "

                    className="hidden"

                    onChange={(e) =>
                      selectImage(
                        e.target
                          .files?.[0]
                      )
                    }
                  />

                </div>

              </Card>


              {/* =============================================
                  COLLECTION TYPE
              ============================================== */}

              <Card>

                <h2
                  className="
                    text-[15px]
                    font-bold
                  "
                >
                  Collection Type
                </h2>


                <p
                  className="
                    mt-[3px]
                    mb-[18px]

                    text-[12px]
                    text-[#777]
                  "
                >
                  Choose how products are added to this collection
                </p>


                <div
                  className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2

                    gap-[12px]
                  "
                >

                  <CollectionTypeButton
                    active={
                      form.collection_type ===
                      "manual"
                    }

                    title="Manual"
                    description="Add products one by one"

                    onClick={() =>
                      updateField(
                        "collection_type",
                        "manual"
                      )
                    }
                  />


                  <CollectionTypeButton
                    active={
                      form.collection_type ===
                      "automated"
                    }

                    title="Automated"
                    description="Products added by conditions"

                    onClick={() =>
                      updateField(
                        "collection_type",
                        "automated"
                      )
                    }
                  />

                </div>

              </Card>


              {/* =============================================
                  PRODUCTS
              ============================================== */}

              {form.collection_type ===
              "manual" ? (

                <CollectionProductPicker
                  products={
                    products
                  }

                  onChange={
                    setProducts
                  }
                />

              ) : (

                <Card>

                  <h2
                    className="
                      text-[15px]
                      font-bold
                    "
                  >
                    Automated Collection
                  </h2>


                  <p
                    className="
                      mt-[7px]

                      text-[12px]
                      leading-[1.6]

                      text-[#777]
                    "
                  >
                    Automated collection conditions will be configured in the next stage.
                  </p>

                </Card>

              )}


              {/* =============================================
                  SEO
              ============================================== */}

              <CollectionSEO
                form={form}
                setForm={setForm}

                generateAI={
                  generateAI
                }

                aiLoading={
                  aiLoading
                }

                slugEdited={
                  slugEdited
                }

                setSlugEdited={
                  setSlugEdited
                }

                seoTitleEdited={
                  seoTitleEdited
                }

                setSeoTitleEdited={
                  setSeoTitleEdited
                }

                metaEdited={
                  metaEdited
                }

                setMetaEdited={
                  setMetaEdited
                }
              />

            </div>


            {/* RIGHT */}

            <div
              className="
                space-y-[16px]
              "
            >

              {/* STATUS */}

              <Card>

                <h2
                  className="
                    mb-[18px]

                    text-[15px]
                    font-bold
                  "
                >
                  Status
                </h2>


                <select
                  value={
                    form.status
                  }

                  onChange={(e) =>
                    updateField(
                      "status",
                      e.target.value
                    )
                  }

                  className="
                    w-full
                    h-[39px]

                    rounded-[11px]

                    border
                    border-[#dedfe2]

                    bg-white

                    px-[12px]

                    text-[13px]

                    outline-none
                  "
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
                    Inactive
                  </option>

                </select>

              </Card>


              {/* PUBLISHING */}

              <Card>

                <h2
                  className="
                    mb-[17px]

                    text-[15px]
                    font-bold
                  "
                >
                  Publishing
                </h2>


                <ToggleRow
                  label="Online Store"

                  active={
                    form.online_store
                  }

                  onClick={() =>
                    updateField(
                      "online_store",
                      !form.online_store
                    )
                  }
                />


                <ToggleRow
                  label="Point of Sale"

                  active={
                    form.point_of_sale
                  }

                  onClick={() =>
                    updateField(
                      "point_of_sale",
                      !form.point_of_sale
                    )
                  }

                  className="
                    mt-[10px]
                  "
                />

              </Card>


              {/* SORT */}

              <Card>

                <h2
                  className="
                    mb-[17px]

                    text-[15px]
                    font-bold
                  "
                >
                  Sort Order
                </h2>


                <select
                  value={
                    form.sort_order
                  }

                  onChange={(e) =>
                    updateField(
                      "sort_order",
                      e.target.value
                    )
                  }

                  className="
                    w-full
                    h-[39px]

                    rounded-[11px]

                    border
                    border-[#dedfe2]

                    bg-white

                    px-[12px]

                    text-[13px]

                    outline-none
                  "
                >

                  {SORT_OPTIONS.map(
                    (option) => (

                      <option
                        key={
                          option.value
                        }

                        value={
                          option.value
                        }
                      >
                        {
                          option.label
                        }
                      </option>

                    )
                  )}

                </select>

              </Card>


              {/* POSITION */}

              <Card>

                <h2
                  className="
                    mb-[17px]

                    text-[15px]
                    font-bold
                  "
                >
                  Display Position
                </h2>


                <input
                  type="number"
                  min="0"

                  value={
                    form.display_position
                  }

                  onChange={(e) =>
                    updateField(
                      "display_position",
                      e.target.value
                    )
                  }

                  className="
                    w-full
                    h-[39px]

                    rounded-[11px]

                    border
                    border-[#dedfe2]

                    px-[12px]

                    text-[13px]

                    outline-none
                  "
                />


                <p
                  className="
                    mt-[8px]

                    text-[11px]
                    text-[#777]
                  "
                >
                  Lower numbers appear first
                </p>

              </Card>

            </div>

          </div>

        </div>

      </form>


      {/* =====================================================
          IMAGE STUDIO
      ====================================================== */}

      {studioOpen && (

        <BrandImageStudio
          brandName={
            form.title
          }

          initialPreview={
            imagePreview
          }

          onClose={() =>
            setStudioOpen(false)
          }

          onSave={(file) => {

            selectImage(file);

            setStudioOpen(false);

          }}
        />

      )}

    </>
  );

};


/* ==========================================================================
   SMALL COMPONENTS
============================================================================ */

const Card = ({
  children,
}) => (

  <div
    className="
      rounded-[15px]

      border
      border-[#dedfe2]

      bg-white

      p-[20px]

      shadow-[0_2px_7px_rgba(0,0,0,0.035)]
    "
  >
    {children}
  </div>

);


const Label = ({
  children,
  noMargin = false,
}) => (

  <label
    className={`
      block

      ${
        noMargin
          ? ""
          : "mb-[7px]"
      }

      text-[12px]
      font-medium
    `}
  >
    {children}
  </label>

);


const Input = ({
  error,
  ...props
}) => (
  <>

    <input
      {...props}

      className={`
        w-full
        h-[39px]

        rounded-[11px]

        border

        ${
          error
            ? "border-red-400"
            : "border-[#dedfe2]"
        }

        px-[12px]

        text-[13px]

        outline-none

        focus:border-[#2065D1]
      `}
    />


    {error && (

      <p
        className="
          mt-[5px]

          text-[11px]
          text-red-500
        "
      >
        {error}
      </p>

    )}

  </>
);


const ToggleRow = ({
  label,
  active,
  onClick,
  className = "",
}) => (

  <div
    className={`
      min-h-[45px]

      rounded-[11px]

      border
      border-[#dedfe2]

      px-[12px]

      flex
      items-center
      justify-between

      ${className}
    `}
  >

    <span
      className="
        text-[12px]
        font-medium
      "
    >
      {label}
    </span>


    <Toggle
      active={active}
      onClick={onClick}
    />

  </div>

);


const Toggle = ({
  active,
  onClick,
}) => (

  <button
    type="button"

    onClick={onClick}

    className={`
      relative

      w-[34px]
      h-[19px]

      rounded-full

      ${
        active
          ? "bg-[#2065D1]"
          : "bg-[#e1e3e6]"
      }
    `}
  >

    <span
      className={`
        absolute
        top-[3px]

        w-[13px]
        h-[13px]

        rounded-full

        bg-white

        transition-all

        ${
          active
            ? "left-[18px]"
            : "left-[3px]"
        }
      `}
    />

  </button>

);


const CollectionTypeButton = ({
  active,
  title,
  description,
  onClick,
}) => (

  <button
    type="button"

    onClick={onClick}

    className={`
      min-h-[82px]

      rounded-[12px]

      border-2

      px-[15px]

      text-center

      ${
        active
          ? `
            border-[#2065D1]
            bg-[#fbfdff]
          `
          : `
            border-[#e5e6e8]
            bg-white
          `
      }
    `}
  >

    <p
      className="
        text-[16px]
        font-semibold
      "
    >
      {title}
    </p>


    <p
      className="
        mt-[5px]

        text-[12px]
        text-[#777]
      "
    >
      {description}
    </p>

  </button>

);


const ErrorBox = ({
  text,
}) => (

  <div
    className="
      mb-[16px]

      rounded-[10px]

      border
      border-red-200

      bg-red-50

      px-[14px]
      py-[10px]

      text-[11px]
      text-red-600
    "
  >
    {text}
  </div>

);


export default CollectionForm;