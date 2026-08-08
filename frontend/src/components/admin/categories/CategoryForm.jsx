import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  EyeOff,
  LoaderCircle,
  Plus,
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import api from "../../../api/axios";

import BrandAITexterPopup
  from "../brands/BrandAITexterPopup";

import BrandImageStudio
  from "../brands/BrandImageStudio";

import {
  EMPTY_CATEGORY_FORM,
  normalizeBoolean,
  slugify,
} from "./categoryConfig";


/* ==========================================================================
   CATEGORY FORM
============================================================================ */

const CategoryForm = ({
  mode = "create",
  initialData = null,
}) => {

  const navigate =
    useNavigate();


  const imageInputRef =
    useRef(null);

  const descriptionAiRef =
    useRef(null);

  const seoAiRef =
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
    ...EMPTY_CATEGORY_FORM,
  });


  /*
  |--------------------------------------------------------------------------
  | PARENTS
  |--------------------------------------------------------------------------
  */

  const [
    parents,
    setParents,
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
  | DESCRIPTION AI
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
  ] = useState("default");


  const [
    descriptionToneOpen,
    setDescriptionToneOpen,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | SEO AI
  |--------------------------------------------------------------------------
  */

  const [
    seoAiOpen,
    setSeoAiOpen,
  ] = useState(false);


  const [
    seoPrompt,
    setSeoPrompt,
  ] = useState("");


  const [
    seoTone,
    setSeoTone,
  ] = useState("default");


  const [
    seoToneOpen,
    setSeoToneOpen,
  ] = useState(false);


  const [
    seoVisible,
    setSeoVisible,
  ] = useState(true);


  /*
  |--------------------------------------------------------------------------
  | AI
  |--------------------------------------------------------------------------
  */

  const [
    aiLoading,
    setAiLoading,
  ] = useState(null);


  const [
    aiError,
    setAiError,
  ] = useState("");


  const [
    aiMessage,
    setAiMessage,
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
  | TAG INPUT
  |--------------------------------------------------------------------------
  */

  const [
    tagInput,
    setTagInput,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | LOAD EDIT DATA
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

      name:
        initialData.name || "",

      description:
        initialData.description || "",

      parent_id:
        initialData.parent_id || "",

      status:
        initialData.status ||
        "active",

      is_featured:
        normalizeBoolean(
          initialData.is_featured
        ),

      display_order:
        initialData.display_order ??
        0,

      seo_title:
        initialData.seo_title ||
        "",

      seo_description:
        initialData.seo_description ||
        "",

      slug:
        initialData.slug || "",

      tags:
        Array.isArray(
          initialData.tags
        )
          ? initialData.tags
          : [],

    });


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
        initialData.seo_description
      )
    );

  }, [
    mode,
    initialData,
  ]);


  /*
  |--------------------------------------------------------------------------
  | LOAD PARENTS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const loadParents =
      async () => {

        try {

          const response =
            await api.get(
              "/admin/categories/parents",
              {
                params:
                  mode === "edit" &&
                  initialData?.id

                    ? {
                        exclude:
                          initialData.id,
                      }

                    : {},
              }
            );


          setParents(
            response.data
              ?.categories ||
            []
          );

        } catch (error) {

          console.error(
            "Parent category error:",
            error
          );

        }

      };


    loadParents();

  }, [
    mode,
    initialData?.id,
  ]);


  /*
  |--------------------------------------------------------------------------
  | CLICK OUTSIDE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const handler = (
      event
    ) => {

      if (
        descriptionAiRef.current &&
        !descriptionAiRef.current
          .contains(
            event.target
          )
      ) {

        setDescriptionAiOpen(
          false
        );

        setDescriptionToneOpen(
          false
        );

      }


      if (
        seoAiRef.current &&
        !seoAiRef.current
          .contains(
            event.target
          )
      ) {

        setSeoAiOpen(false);

        setSeoToneOpen(false);

      }

    };


    document.addEventListener(
      "mousedown",
      handler
    );


    return () =>
      document.removeEventListener(
        "mousedown",
        handler
      );

  }, []);


  /*
  |--------------------------------------------------------------------------
  | CHANGE
  |--------------------------------------------------------------------------
  */

  const handleChange = (
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
          field === "name"
        ) {

          if (!slugEdited) {

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
  | PARENT NAME FOR AI
  |--------------------------------------------------------------------------
  */

  const selectedParentName =
    parents.find(
      (parent) =>
        String(parent.id) ===
        String(form.parent_id)
    )?.name || "";


  /*
  |--------------------------------------------------------------------------
  | AI
  |--------------------------------------------------------------------------
  */

  const generateAI = async ({
    target,
    prompt = "",
    tone = "default",
  }) => {

    if (
      !form.name.trim()
    ) {

      setAiError(
        "Please enter a category name first."
      );

      return false;

    }


    try {

      setAiLoading(target);

      setAiError("");

      setAiMessage("");


      const response =
        await api.post(
          "/admin/ai/category-content",
          {

            name:
              form.name.trim(),

            description:
              form.description.trim(),

            parent_category:
              selectedParentName,

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
            target ===
            "description"
          ) {

            if (
              generated.description
            ) {

              next.description =
                generated.description
                  .slice(
                    0,
                    500
                  );


              if (!metaEdited) {

                next.seo_description =
                  generated.description
                    .slice(
                      0,
                      160
                    );

              }

            }

          }


          if (
            target === "seo"
          ) {

            if (
              generated.seo_title
            ) {

              next.seo_title =
                generated.seo_title
                  .slice(
                    0,
                    70
                  );

            }


            if (
              generated
                .seo_description
            ) {

              next.seo_description =
                generated
                  .seo_description
                  .slice(
                    0,
                    160
                  );

            }


            if (
              generated.slug
            ) {

              next.slug =
                slugify(
                  generated.slug
                );

            }

          }


          if (
            target === "tags" &&
            Array.isArray(
              generated.tags
            )
          ) {

            next.tags =
              generated.tags;

          }


          return next;

        }
      );


      if (
        target === "seo"
      ) {

        setSeoTitleEdited(true);
        setMetaEdited(true);
        setSlugEdited(true);

      }


      setAiMessage(
        target === "description"
          ? "Category description generated successfully."
          : target === "seo"
            ? "SEO content generated successfully."
            : "Tags generated successfully."
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


    const accepted = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];


    if (
      !accepted.includes(
        file.type
      )
    ) {

      setMessage(
        "Please select JPG, PNG or WebP."
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

  };


  const resetImage = () => {

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


    setImagePreview(
      mode === "edit"
        ? initialData?.image_url ||
          null
        : null
    );

  };


  /*
  |--------------------------------------------------------------------------
  | TAGS
  |--------------------------------------------------------------------------
  */

  const addTag = () => {

    const tag =
      tagInput.trim();


    if (!tag) {
      return;
    }


    if (
      form.tags.some(
        (item) =>
          item.toLowerCase() ===
          tag.toLowerCase()
      )
    ) {

      setTagInput("");

      return;

    }


    setForm(
      (prev) => ({
        ...prev,

        tags: [
          ...prev.tags,
          tag,
        ],
      })
    );


    setTagInput("");

  };


  const removeTag = (
    tag
  ) => {

    setForm(
      (prev) => ({
        ...prev,

        tags:
          prev.tags.filter(
            (item) =>
              item !== tag
          ),
      })
    );

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
          "name",
          form.name
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
          "parent_id",
          form.parent_id ||
          ""
        );


        data.append(
          "status",
          form.status
        );


        data.append(
          "is_featured",
          form.is_featured
            ? "1"
            : "0"
        );


        data.append(
          "display_order",
          form.display_order
        );


        data.append(
          "seo_title",
          form.seo_title
        );


        data.append(
          "seo_description",
          form.seo_description
        );


        data.append(
          "tags",
          JSON.stringify(
            form.tags
          )
        );


        if (image) {

          data.append(
            "image",
            image
          );

        }


        if (
          mode === "edit"
        ) {

          await api.post(
            `/admin/categories/${initialData.id}/update`,
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
            "/admin/categories",
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
          "/admin/products/categories"
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
            "Unable to save category."
          );

        }

      } finally {

        setSaving(false);

      }

    };


  const previewTitle =
    form.seo_title ||
    form.name ||
    "Untitled Category";


  const previewDescription =
    form.seo_description ||
    form.description ||
    "No description available.";


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
            max-w-[1060px]
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
              items-center
              justify-between
            "
          >

            <div
              className="
                flex
                items-center
                gap-[8px]
              "
            >

              <h1
                className="
                  text-[20px]
                  font-bold
                "
              >
                {mode === "edit"
                  ? form.name ||
                    "Edit category"
                  : "Add category"}
              </h1>


              <StatusPill
                status={
                  form.status
                }
              />


              {form.is_featured && (

                <span
                  className="
                    px-[9px]
                    py-[3px]

                    rounded-full

                    bg-[#8B5CF6]
                    text-white

                    text-[10px]
                    font-semibold
                  "
                >
                  Featured
                </span>

              )}

            </div>


            <div
              className="
                flex
                gap-[9px]
              "
            >

              <button
                type="submit"

                disabled={
                  saving ||
                  Boolean(aiLoading)
                }

                className="
                  h-[38px]
                  px-[16px]

                  rounded-[9px]

                  bg-[#2065D1]
                  text-white

                  flex
                  items-center
                  gap-[6px]

                  text-[13px]
                  font-semibold

                  disabled:opacity-50
                "
              >

                {saving && (

                  <LoaderCircle
                    size={14}
                    className="
                      animate-spin
                    "
                  />

                )}

                Save

              </button>


              <button
                type="button"

                onClick={() =>
                  navigate(
                    "/admin/products/categories"
                  )
                }

                className="
                  h-[38px]
                  px-[14px]

                  rounded-[9px]

                  border
                  border-[#dedfe2]

                  bg-white

                  flex
                  items-center
                  gap-[6px]

                  text-[13px]
                "
              >

                <ArrowLeft
                  size={14}
                />

                Back

              </button>

            </div>

          </div>


          {message && (

            <Message
              error
              text={message}
            />

          )}


          {aiError && (

            <Message
              error
              text={aiError}
            />

          )}


          {aiMessage && (

            <Message
              text={aiMessage}
            />

          )}


          {/* =================================================
              GRID
          ================================================== */}

          <div
            className="
              grid
              grid-cols-1

              xl:grid-cols-[minmax(0,2fr)_365px]

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

                <Title>
                  Details
                </Title>


                <Label>
                  Name *
                </Label>


                <Input
                  value={
                    form.name
                  }

                  onChange={(e) =>
                    handleChange(
                      "name",
                      e.target.value
                    )
                  }

                  error={
                    errors.name?.[0]
                  }
                />


                {/* DESCRIPTION */}

                <div
                  ref={
                    descriptionAiRef
                  }

                  className="
                    relative
                    mt-[18px]
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


                    <AIButton
                      loading={
                        aiLoading ===
                        "description"
                      }

                      onClick={() =>
                        setDescriptionAiOpen(
                          (prev) =>
                            !prev
                        )
                      }
                    />

                  </div>


                  <textarea
                    value={
                      form.description
                    }

                    maxLength={500}

                    onChange={(e) =>
                      handleChange(
                        "description",
                        e.target.value
                      )
                    }

                    placeholder="Describe this category..."

                    className="
                      w-full
                      h-[96px]

                      rounded-[11px]

                      border
                      border-[#dedfe2]

                      p-[13px]

                      text-[13px]

                      outline-none
                      resize-none

                      focus:border-[#2065D1]
                    "
                  />


                  <Counter
                    current={
                      form.description
                        .length
                    }
                    max={500}
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

                      placeholder="Describe this category in a sentence or two..."

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

              </Card>


              {/* =============================================
                  MEDIA
              ============================================== */}

              <Card>

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >

                  <Title>
                    Media
                  </Title>


                  <button
                    type="button"

                    onClick={() =>
                      setStudioOpen(true)
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

                      text-[11px]
                      font-semibold
                    "
                  >

                    <Sparkles
                      size={12}
                    />

                    AI Studio

                  </button>

                </div>


                {!imagePreview ? (

                  <button
                    type="button"

                    onClick={() =>
                      imageInputRef
                        .current
                        ?.click()
                    }

                    className="
                      mt-[18px]

                      w-full
                      min-h-[165px]

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
                      size={28}
                      className="
                        text-[#777]
                      "
                    />


                    <span
                      className="
                        text-[13px]
                        font-medium
                      "
                    >
                      Drag and drop files here, or click to browse
                    </span>


                    <span
                      className="
                        text-[11px]
                        text-[#888]
                      "
                    >
                      Images only. PNG, JPG or WebP.
                    </span>

                  </button>

                ) : (

                  <div
                    className="
                      relative

                      mt-[18px]

                      w-[165px]
                      h-[165px]

                      rounded-[12px]

                      border
                      border-[#dedfe2]

                      bg-[#fafafa]

                      overflow-hidden

                      flex
                      items-center
                      justify-center
                    "
                  >

                    <img
                      src={
                        imagePreview
                      }

                      alt={
                        form.name ||
                        "Category"
                      }

                      className="
                        w-full
                        h-full

                        object-contain
                        p-[8px]
                      "
                    />


                    <span
                      className="
                        absolute
                        bottom-[7px]
                        left-[7px]

                        rounded-[5px]

                        bg-[#444]
                        text-white

                        px-[7px]
                        py-[3px]

                        text-[9px]
                        font-semibold
                      "
                    >
                      ★ Cover
                    </span>


                    {image && (

                      <button
                        type="button"

                        onClick={
                          resetImage
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

                    )}

                  </div>

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
                      e.target.files?.[0]
                    )
                  }
                />


                <p
                  className="
                    mt-[12px]

                    text-[11px]
                    leading-[1.5]

                    text-[#777]
                  "
                >
                  Small icon shown in the header, megamenu, and category navigation. Use a transparent square image for best results.
                </p>

              </Card>


              {/* =============================================
                  VARIANTS
              ============================================== */}

              <Card>

                <Title>
                  Variants
                </Title>


                <button
                  type="button"

                  className="
                    flex
                    items-center
                    gap-[7px]

                    text-[13px]
                    font-medium
                  "
                >

                  <span
                    className="
                      w-[18px]
                      h-[18px]

                      rounded-full

                      border
                      border-[#777]

                      flex
                      items-center
                      justify-center
                    "
                  >
                    +
                  </span>

                  Add options like size or color

                </button>

              </Card>


              {/* =============================================
                  SEO
              ============================================== */}

              <Card noPadding>

                <div
                  ref={
                    seoAiRef
                  }

                  className="
                    relative
                  "
                >

                  <div
                    className="
                      px-[18px]
                      py-[15px]

                      border-b
                      border-[#e4e5e8]

                      flex
                      items-start
                      justify-between
                    "
                  >

                    <div>

                      <Title>
                        Search Engine Listing
                      </Title>


                      <p
                        className="
                          text-[12px]
                          text-[#777]
                        "
                      >
                        Auto-filled from title & excerpt. Customize to override.
                      </p>

                    </div>


                    <div
                      className="
                        flex
                        items-center
                        gap-[8px]
                      "
                    >

                      <AIButton
                        loading={
                          aiLoading ===
                          "seo"
                        }

                        onClick={() =>
                          setSeoAiOpen(
                            (prev) =>
                              !prev
                          )
                        }
                      />


                      <button
                        type="button"

                        onClick={() =>
                          setSeoVisible(
                            (prev) =>
                              !prev
                          )
                        }

                        className="
                          h-[32px]
                          px-[10px]

                          rounded-[7px]

                          border
                          border-[#dedfe2]

                          flex
                          items-center
                          gap-[5px]

                          text-[11px]
                        "
                      >

                        <EyeOff
                          size={13}
                        />

                        {seoVisible
                          ? "Hide SEO"
                          : "Show SEO"}

                      </button>

                    </div>

                  </div>


                  {seoAiOpen && (

                    <BrandAITexterPopup
                      prompt={
                        seoPrompt
                      }

                      setPrompt={
                        setSeoPrompt
                      }

                      tone={
                        seoTone
                      }

                      setTone={
                        setSeoTone
                      }

                      toneOpen={
                        seoToneOpen
                      }

                      setToneOpen={
                        setSeoToneOpen
                      }

                      placeholder="Describe the SEO you want — keywords to target, tone, focus..."

                      loading={
                        aiLoading ===
                        "seo"
                      }

                      onGenerate={
                        async () => {

                          const success =
                            await generateAI({
                              target: "seo",
                              prompt:
                                seoPrompt,
                              tone:
                                seoTone,
                            });


                          if (success) {

                            setSeoAiOpen(
                              false
                            );

                          }

                        }
                      }

                      onAutoGenerate={
                        async () => {

                          const success =
                            await generateAI({
                              target: "seo",
                              tone:
                                seoTone,
                            });


                          if (success) {

                            setSeoAiOpen(
                              false
                            );

                          }

                        }
                      }

                      className="
                        top-[70px]
                        right-[15px]
                      "
                    />

                  )}


                  {seoVisible && (

                    <div
                      className="
                        p-[18px]
                      "
                    >

                      {/* GOOGLE PREVIEW */}

                      <div
                        className="
                          rounded-[12px]

                          border
                          border-[#dedfe2]

                          bg-[#f7f7f8]

                          p-[16px]
                        "
                      >

                        <p
                          className="
                            text-[12px]
                            font-semibold
                          "
                        >
                          Storify
                        </p>


                        <p
                          className="
                            mt-1

                            text-[11px]
                            text-[#666]
                          "
                        >
                          {window.location.host}
                          {" › categories › "}
                          {form.slug ||
                            "category-handle"}
                        </p>


                        <p
                          className="
                            mt-1

                            text-[16px]
                            text-[#1a0dab]
                          "
                        >
                          {previewTitle}
                        </p>


                        <p
                          className="
                            mt-1

                            text-[12px]
                            text-[#666]
                          "
                        >
                          {previewDescription}
                        </p>

                      </div>


                      <Label
                        className="
                          mt-[18px]
                        "
                      >
                        Page title
                      </Label>


                      <Input
                        value={
                          form.seo_title
                        }

                        maxLength={70}

                        onChange={(e) => {

                          setSeoTitleEdited(
                            true
                          );


                          handleChange(
                            "seo_title",
                            e.target.value
                          );

                        }}
                      />


                      <Counter
                        current={
                          form.seo_title
                            .length
                        }
                        max={70}
                      />


                      <Label
                        className="
                          mt-[17px]
                        "
                      >
                        Meta description
                      </Label>


                      <textarea
                        value={
                          form.seo_description
                        }

                        maxLength={160}

                        onChange={(e) => {

                          setMetaEdited(
                            true
                          );


                          handleChange(
                            "seo_description",
                            e.target.value
                          );

                        }}

                        placeholder="Enter meta description for search engines"

                        className="
                          w-full
                          h-[80px]

                          rounded-[11px]

                          border
                          border-[#dedfe2]

                          p-[13px]

                          resize-none
                          outline-none

                          text-[13px]
                        "
                      />


                      <Counter
                        current={
                          form.seo_description
                            .length
                        }

                        max={160}
                      />


                      {/* URL */}

                      <Label
                        className="
                          mt-[17px]
                        "
                      >
                        URL handle
                      </Label>


                      <div
                        className="
                          h-[38px]

                          rounded-[11px]

                          border
                          border-[#dedfe2]

                          overflow-hidden

                          flex
                        "
                      >

                        <span
                          className="
                            px-[12px]

                            bg-[#fafafa]

                            flex
                            items-center

                            text-[12px]
                            text-[#666]
                          "
                        >
                          categories/
                        </span>


                        <input
                          value={
                            form.slug
                          }

                          onChange={(e) => {

                            setSlugEdited(
                              true
                            );


                            handleChange(
                              "slug",
                              slugify(
                                e.target.value
                              )
                            );

                          }}

                          className="
                            flex-1

                            px-[12px]

                            outline-none

                            text-[13px]
                          "
                        />

                      </div>


                      {/* TAGS */}

                      <div
                        className="
                          mt-[17px]

                          flex
                          items-center
                          justify-between
                        "
                      >

                        <Label noMargin>
                          Tags
                        </Label>


                        <button
                          type="button"

                          disabled={
                            aiLoading ===
                            "tags"
                          }

                          onClick={() =>
                            generateAI({
                              target:
                                "tags",
                            })
                          }

                          className="
                            h-[27px]
                            px-[9px]

                            rounded-[6px]

                            bg-gradient-to-r
                            from-[#ff53c7]
                            to-[#39d9e6]

                            text-white

                            flex
                            items-center
                            gap-[4px]

                            text-[10px]
                            font-semibold
                          "
                        >

                          {aiLoading ===
                          "tags" ? (

                            <LoaderCircle
                              size={11}
                              className="
                                animate-spin
                              "
                            />

                          ) : (

                            <Sparkles
                              size={11}
                            />

                          )}

                          Generate Tags

                        </button>

                      </div>


                      <div
                        className="
                          mt-[7px]

                          flex
                          gap-[7px]
                        "
                      >

                        <input
                          value={
                            tagInput
                          }

                          onChange={(e) =>
                            setTagInput(
                              e.target.value
                            )
                          }

                          onKeyDown={(e) => {

                            if (
                              e.key ===
                              "Enter"
                            ) {

                              e.preventDefault();

                              addTag();

                            }

                          }}

                          placeholder="Add a tag and press Enter"

                          className="
                            flex-1
                            h-[38px]

                            rounded-[11px]

                            border
                            border-[#dedfe2]

                            px-[12px]

                            text-[13px]

                            outline-none
                          "
                        />


                        <button
                          type="button"

                          onClick={addTag}

                          className="
                            w-[38px]
                            h-[38px]

                            rounded-[10px]

                            border
                            border-[#dedfe2]

                            flex
                            items-center
                            justify-center
                          "
                        >

                          <Plus size={16} />

                        </button>

                      </div>


                      {form.tags.length >
                        0 && (

                        <div
                          className="
                            mt-[10px]

                            flex
                            flex-wrap
                            gap-[6px]
                          "
                        >

                          {form.tags.map(
                            (tag) => (

                              <span
                                key={tag}

                                className="
                                  rounded-full

                                  bg-[#eef3ff]
                                  text-[#2065D1]

                                  px-[9px]
                                  py-[5px]

                                  flex
                                  items-center
                                  gap-[5px]

                                  text-[10px]
                                  font-medium
                                "
                              >

                                {tag}


                                <button
                                  type="button"

                                  onClick={() =>
                                    removeTag(
                                      tag
                                    )
                                  }
                                >

                                  <X
                                    size={11}
                                  />

                                </button>

                              </span>

                            )
                          )}

                        </div>

                      )}


                      {/* SEO CHECKLIST */}

                      <div
                        className="
                          mt-[18px]

                          min-h-[42px]

                          rounded-[11px]

                          border
                          border-[#dedfe2]

                          px-[13px]

                          flex
                          items-center
                          gap-[8px]
                        "
                      >

                        <span
                          className={`
                            w-[7px]
                            h-[7px]

                            rounded-full

                            ${
                              form.seo_title &&
                              form.seo_description &&
                              form.slug

                                ? "bg-green-500"

                                : "bg-red-500"
                            }
                          `}
                        />


                        <Search
                          size={14}
                        />


                        <span
                          className="
                            text-[12px]
                            font-semibold
                          "
                        >
                          SEO checklist
                        </span>

                      </div>

                    </div>

                  )}

                </div>

              </Card>

            </div>


            {/* ===============================================
                RIGHT
            ================================================ */}

            <div
              className="
                space-y-[16px]
              "
            >

              {/* STATUS */}

              <Card>

                <Title>
                  Status
                </Title>


                <Label>
                  Status
                </Label>


                <select
                  value={
                    form.status
                  }

                  onChange={(e) =>
                    handleChange(
                      "status",
                      e.target.value
                    )
                  }

                  className="
                    w-full
                    h-[38px]

                    rounded-[11px]

                    border
                    border-[#dedfe2]

                    px-[12px]

                    bg-white

                    text-[13px]

                    outline-none
                  "
                >

                  <option
                    value="active"
                  >
                    Active
                  </option>

                  <option
                    value="inactive"
                  >
                    Inactive
                  </option>

                </select>


                <div
                  className="
                    mt-[16px]

                    rounded-[12px]

                    border
                    border-[#dedfe2]

                    p-[13px]

                    flex
                    items-center
                    justify-between

                    gap-3
                  "
                >

                  <div>

                    <p
                      className="
                        text-[13px]
                        font-medium
                      "
                    >
                      Featured category
                    </p>


                    <p
                      className="
                        mt-1

                        text-[11px]
                        leading-[1.4]

                        text-[#777]
                      "
                    >
                      Show this category in the storefront featured categories section.
                    </p>

                  </div>


                  <Toggle
                    active={
                      form.is_featured
                    }

                    onClick={() =>
                      handleChange(
                        "is_featured",
                        !form.is_featured
                      )
                    }
                  />

                </div>

              </Card>


              {/* ORGANIZATION */}

              <Card>

                <Title>
                  Organization
                </Title>


                <Label>
                  Parent category
                </Label>


                <select
                  value={
                    form.parent_id
                  }

                  onChange={(e) =>
                    handleChange(
                      "parent_id",
                      e.target.value
                    )
                  }

                  className="
                    w-full
                    h-[38px]

                    rounded-[11px]

                    border
                    border-[#dedfe2]

                    px-[12px]

                    bg-white

                    text-[13px]

                    outline-none
                  "
                >

                  <option value="">
                    None (root category)
                  </option>


                  {parents.map(
                    (parent) => (

                      <option
                        key={
                          parent.id
                        }

                        value={
                          parent.id
                        }
                      >
                        {parent.name}
                      </option>

                    )
                  )}

                </select>


                <p
                  className="
                    mt-[7px]

                    text-[11px]
                    text-[#777]
                  "
                >
                  Select a parent to create a sub-category.
                </p>


                <Label
                  className="
                    mt-[17px]
                  "
                >
                  Display order
                </Label>


                <Input
                  type="number"

                  min="0"

                  value={
                    form.display_order
                  }

                  onChange={(e) =>
                    handleChange(
                      "display_order",
                      e.target.value
                    )
                  }
                />


                <p
                  className="
                    mt-[7px]

                    text-[11px]
                    text-[#777]
                  "
                >
                  Lower numbers appear first.
                </p>


                {mode === "edit" && (

                  <div
                    className="
                      mt-[16px]

                      rounded-[12px]

                      border
                      border-[#dedfe2]

                      p-[13px]

                      flex
                      items-center
                      justify-between
                    "
                  >

                    <div>

                      <p
                        className="
                          text-[13px]
                          font-medium
                        "
                      >
                        Products
                      </p>


                      <p
                        className="
                          mt-1

                          text-[11px]
                          text-[#777]
                        "
                      >
                        Products assigned to this category.
                      </p>

                    </div>


                    <strong
                      className="
                        text-[13px]
                      "
                    >
                      {
                        initialData
                          ?.products_count ??
                        0
                      }
                    </strong>

                  </div>

                )}

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
            form.name
          }

          initialPreview={
            imagePreview
          }

          onClose={() =>
            setStudioOpen(
              false
            )
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
   UI COMPONENTS
============================================================================ */

const Card = ({
  children,
  noPadding = false,
}) => (
  <div
    className={`
      bg-white

      border
      border-[#dedfe2]

      rounded-[15px]

      shadow-[0_2px_7px_rgba(0,0,0,0.035)]

      ${
        noPadding
          ? ""
          : "p-[18px]"
      }
    `}
  >
    {children}
  </div>
);


const Title = ({
  children,
}) => (
  <h2
    className="
      mb-[14px]

      text-[15px]
      font-bold
    "
  >
    {children}
  </h2>
);


const Label = ({
  children,
  className = "",
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

      text-[13px]
      font-medium

      ${className}
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
        h-[38px]

        rounded-[11px]

        border

        ${
          error
            ? "border-red-400"
            : "border-[#dedfe2]"
        }

        px-[13px]

        text-[13px]

        outline-none

        focus:border-[#2065D1]
      `}
    />


    {error && (

      <p
        className="
          mt-1

          text-[11px]
          text-red-500
        "
      >
        {error}
      </p>

    )}
  </>
);


const AIButton = ({
  onClick,
  loading,
}) => (
  <button
    type="button"

    onClick={onClick}

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

    {loading ? (

      <LoaderCircle
        size={14}
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
);


const Counter = ({
  current,
  max,
}) => (
  <p
    className="
      mt-[5px]

      text-[10px]
      text-[#777]
    "
  >
    {current}/{max}
  </p>
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

      w-[36px]
      h-[20px]

      rounded-full

      shrink-0

      ${
        active
          ? "bg-[#2065D1]"
          : "bg-[#dddfe3]"
      }
    `}
  >

    <span
      className={`
        absolute
        top-[3px]

        w-[14px]
        h-[14px]

        rounded-full

        bg-white

        transition-all

        ${
          active
            ? "left-[19px]"
            : "left-[3px]"
        }
      `}
    />

  </button>
);


const StatusPill = ({
  status,
}) => (
  <span
    className={`
      px-[9px]
      py-[3px]

      rounded-full

      text-[10px]
      font-semibold

      capitalize

      ${
        status === "active"
          ? "bg-[#2065D1] text-white"
          : "bg-[#e8e9eb] text-[#666]"
      }
    `}
  >
    {status}
  </span>
);


const Message = ({
  text,
  error = false,
}) => (
  <div
    className={`
      mb-4

      rounded-[10px]

      border

      px-4
      py-3

      flex
      items-center
      gap-[8px]

      text-[12px]

      ${
        error
          ? "border-red-200 bg-red-50 text-red-600"
          : "border-green-200 bg-green-50 text-green-700"
      }
    `}
  >

    {error ? (

      <AlertCircle
        size={15}
      />

    ) : (

      <CheckCircle2
        size={15}
      />

    )}

    {text}

  </div>
);


export default CategoryForm;