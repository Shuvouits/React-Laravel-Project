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
  Search,
  Sparkles,
  Upload,
  X,
} from "lucide-react";

import api from "../../../api/axios";

import BrandAITexterPopup
  from "./BrandAITexterPopup";

import BrandImageStudio
  from "./BrandImageStudio";

import {
  EMPTY_BRAND_FORM,
  slugify,
} from "./brandConfig";


const BrandForm = ({
  mode = "create",
  initialData = null,
}) => {

  const navigate =
    useNavigate();


  const logoInputRef =
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

  const [form, setForm] =
    useState({
      ...EMPTY_BRAND_FORM,
    });


  /*
  |--------------------------------------------------------------------------
  | LOGO
  |--------------------------------------------------------------------------
  */

  const [logo, setLogo] =
    useState(null);

  const [
    logoPreview,
    setLogoPreview,
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  const [saving, setSaving] =
    useState(false);

  const [errors, setErrors] =
    useState({});

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | AUTO FIELD CONTROL
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
  | IMAGE STUDIO
  |--------------------------------------------------------------------------
  */

  const [
    studioOpen,
    setStudioOpen,
  ] = useState(false);


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

      website:
        initialData.website || "",

      status:
        initialData.status ||
        "active",

      is_featured:
        Boolean(
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

    });


    setLogoPreview(
      initialData.logo_url ||
      null
    );


    /*
    |--------------------------------------------------------------------------
    | DON'T AUTO OVERWRITE SAVED SEO
    |--------------------------------------------------------------------------
    */

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
  | OUTSIDE CLICK
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

        setSeoAiOpen(
          false
        );

        setSeoToneOpen(
          false
        );

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


    if (
      errors[field]
    ) {

      setErrors(
        (prev) => ({
          ...prev,
          [field]: null,
        })
      );

    }

  };


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
        "Please enter a brand name before using AI."
      );

      return false;

    }


    try {

      setAiLoading(
        target
      );

      setAiError("");

      setAiMessage("");


      const response =
        await api.post(
          "/admin/ai/brand-content",
          {
            name:
              form.name.trim(),

            description:
              form.description.trim(),

            website:
              form.website.trim(),

            target,
            prompt,
            tone,
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


              if (
                !metaEdited
              ) {

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


          return next;

        }
      );


      if (
        target === "seo"
      ) {

        setSeoTitleEdited(
          true
        );

        setMetaEdited(
          true
        );

        setSlugEdited(
          true
        );

      }


      setAiMessage(
        target === "seo"
          ? "SEO content generated successfully."
          : "Brand description generated successfully."
      );


      return true;

    } catch (error) {

      setAiError(
        error.response?.data?.message ||
        error.message ||
        "Unable to generate content."
      );


      return false;

    } finally {

      setAiLoading(
        null
      );

    }

  };


  /*
  |--------------------------------------------------------------------------
  | LOGO
  |--------------------------------------------------------------------------
  */

  const selectLogo = (
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
      ].includes(
        file.type
      )
    ) {

      setErrors(
        (prev) => ({
          ...prev,
          logo: [
            "Please select JPG, PNG or WebP.",
          ],
        })
      );

      return;

    }


    if (
      file.size >
      3 * 1024 * 1024
    ) {

      setErrors(
        (prev) => ({
          ...prev,
          logo: [
            "Logo must be smaller than 3MB.",
          ],
        })
      );

      return;

    }


    setLogo(file);


    if (
      logoPreview?.startsWith(
        "blob:"
      )
    ) {

      URL.revokeObjectURL(
        logoPreview
      );

    }


    setLogoPreview(
      URL.createObjectURL(
        file
      )
    );

  };


  /*
  |--------------------------------------------------------------------------
  | RESET NEW LOGO
  |--------------------------------------------------------------------------
  */

  const resetLogo = () => {

    setLogo(null);


    if (
      logoPreview?.startsWith(
        "blob:"
      )
    ) {

      URL.revokeObjectURL(
        logoPreview
      );

    }


    /*
    |--------------------------------------------------------------------------
    | EDIT MODE → BACK TO ORIGINAL LOGO
    |--------------------------------------------------------------------------
    */

    setLogoPreview(
      mode === "edit"
        ? initialData?.logo_url ||
          null
        : null
    );

  };


  /*
  |--------------------------------------------------------------------------
  | SUBMIT
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

        setErrorMessage("");


        const data =
          new FormData();


        Object.entries(
          form
        ).forEach(
          ([key, value]) => {

            if (
              key ===
              "is_featured"
            ) {

              data.append(
                key,
                value
                  ? "1"
                  : "0"
              );

            } else {

              data.append(
                key,
                value ?? ""
              );

            }

          }
        );


        if (logo) {

          data.append(
            "logo",
            logo
          );

        }


        if (
          mode === "edit"
        ) {

          await api.post(
            `/admin/brands/${initialData.id}/update`,
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
            "/admin/brands",
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
          "/admin/products/brands"
        );

      } catch (error) {

        if (
          error.response
            ?.status ===
          422
        ) {

          setErrors(
            error.response
              .data
              .errors ||
            {}
          );

        } else {

          setErrorMessage(
            error.response
              ?.data
              ?.message ||
            "Unable to save brand."
          );

        }

      } finally {

        setSaving(
          false
        );

      }

    };


  const previewTitle =
    form.seo_title ||
    form.name ||
    "Untitled Brand";


  const previewDescription =
    form.seo_description ||
    form.description ||
    "No description available.";


  const previewSlug =
    form.slug ||
    "brand-handle";


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

          {/* HEADER */}

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
                gap-[10px]
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
                    "Edit brand"
                  : "Add brand"}
              </h1>


              <span
                className="
                  px-[9px]
                  py-[3px]

                  rounded-full

                  bg-[#2065D1]
                  text-white

                  text-[10px]
                  font-semibold

                  capitalize
                "
              >
                {form.status}
              </span>

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
                  Boolean(
                    aiLoading
                  )
                }

                className="
                  h-[38px]
                  px-[16px]

                  rounded-[9px]

                  bg-[#2065D1]
                  text-white

                  text-[13px]
                  font-semibold

                  flex
                  items-center
                  gap-[6px]

                  disabled:opacity-50
                "
              >

                {saving && (
                  <LoaderCircle
                    size={14}
                    className="animate-spin"
                  />
                )}

                Save

              </button>


              <button
                type="button"

                onClick={() =>
                  navigate(
                    "/admin/products/brands"
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


          {errorMessage && (
            <Message
              error
              text={
                errorMessage
              }
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

              {/* DETAILS */}

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

                    <Label
                      noMargin
                    >
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

                    placeholder="Describe this brand..."

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
                    "
                  />


                  <SmallCounter
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

                      placeholder="Describe this brand in a sentence or two..."

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


                <Label
                  className="
                    mt-[17px]
                  "
                >
                  Website
                </Label>


                <Input
                  value={
                    form.website
                  }

                  placeholder="https://brand.com"

                  onChange={(e) =>
                    handleChange(
                      "website",
                      e.target.value
                    )
                  }

                  error={
                    errors.website?.[0]
                  }
                />


                <p
                  className="
                    mt-[7px]
                    text-[11px]
                    text-[#777]
                  "
                >
                  Optional link to the brand's official website.
                </p>

              </Card>


              {/* LOGO */}

              <Card>

                <div
                  className="
                    flex
                    items-center
                    justify-between
                  "
                >

                  <Title>
                    Logo
                  </Title>


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


                {!logoPreview ? (

                  <button
                    type="button"

                    onClick={() =>
                      logoInputRef
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
                      PNG, JPG or WebP
                    </span>

                  </button>

                ) : (

                  <div
                    className="
                      relative

                      mt-[18px]

                      h-[180px]

                      rounded-[12px]

                      border
                      border-[#dedfe2]

                      flex
                      items-center
                      justify-center
                    "
                  >

                    <img
                      src={
                        logoPreview
                      }

                      alt={
                        form.name ||
                        "Brand"
                      }

                      className="
                        max-h-[140px]
                        max-w-[240px]

                        object-contain
                      "
                    />


                    {logo && (

                      <button
                        type="button"

                        onClick={
                          resetLogo
                        }

                        className="
                          absolute
                          top-[10px]
                          right-[10px]

                          w-[30px]
                          h-[30px]

                          rounded-full

                          border
                          border-[#ddd]

                          bg-white

                          flex
                          items-center
                          justify-center
                        "
                      >
                        <X
                          size={14}
                        />
                      </button>

                    )}

                  </div>

                )}


                <input
                  ref={
                    logoInputRef
                  }

                  type="file"

                  accept="
                    image/jpeg,
                    image/png,
                    image/webp
                  "

                  className="hidden"

                  onChange={(e) =>
                    selectLogo(
                      e.target.files?.[0]
                    )
                  }
                />

              </Card>


              {/* SEO */}

              <Card noPadding>

                <div
                  ref={seoAiRef}
                  className="relative"
                >

                  <div
                    className="
                      px-[18px]
                      py-[15px]

                      border-b
                      border-[#e4e5e8]

                      flex
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
                          h-[30px]
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
                              target:
                                "seo",
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
                              target:
                                "seo",
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

                      {/* PREVIEW */}

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
                          {" › brands › "}
                          {previewSlug}
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


                      <SmallCounter
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
                          form
                            .seo_description
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


                      <SmallCounter
                        current={
                          form
                            .seo_description
                            .length
                        }
                        max={160}
                      />


                      <Label
                        className="
                          mt-[17px]
                        "
                      >
                        URL handle
                      </Label>


                      <div
                        className="
                          flex
                          h-[38px]

                          rounded-[11px]

                          border
                          border-[#dedfe2]

                          overflow-hidden
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
                          brands/
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


                      <div
                        className="
                          mt-[18px]

                          h-[42px]

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


            {/* RIGHT */}

            <div
              className="
                space-y-[16px]
              "
            >

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
                  "
                >

                  <option value="active">
                    Active
                  </option>

                  <option value="inactive">
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
                  "
                >

                  <div>

                    <p
                      className="
                        text-[13px]
                        font-medium
                      "
                    >
                      Featured brand
                    </p>

                    <p
                      className="
                        mt-1

                        text-[11px]
                        text-[#777]
                      "
                    >
                      Highlight this brand on the storefront.
                    </p>

                  </div>


                  <button
                    type="button"

                    onClick={() =>
                      handleChange(
                        "is_featured",
                        !form.is_featured
                      )
                    }

                    className={`
                      relative

                      w-[36px]
                      h-[20px]

                      rounded-full

                      ${
                        form.is_featured
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
                          form.is_featured
                            ? "left-[19px]"
                            : "left-[3px]"
                        }
                      `}
                    />

                  </button>

                </div>

              </Card>


              <Card>

                <Title>
                  Organization
                </Title>


                <Label>
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
                        Products assigned to this brand.
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


      {studioOpen && (

        <BrandImageStudio
          brandName={
            form.name
          }

          initialPreview={
            logoPreview
          }

          onClose={() =>
            setStudioOpen(
              false
            )
          }

          onSave={(file) => {

            selectLogo(
              file
            );

            setStudioOpen(
              false
            );

          }}
        />

      )}

    </>
  );
};


/* ==========================================================================
   SMALL SHARED UI
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


const SmallCounter = ({
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
        className="animate-spin"
      />
    ) : (
      <Sparkles
        size={14}
      />
    )}
  </button>
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


export default BrandForm;