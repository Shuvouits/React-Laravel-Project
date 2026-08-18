import {
  useEffect,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  Eye,
  LoaderCircle,
  Trash2,
} from "lucide-react";

import api
  from "../../../../api/axios";

import ProductDetails
  from "./ProductDetails";

import ProductOrganization
  from "./ProductOrganization";

import ProductMedia
  from "./ProductMedia";

import ProductCommerce
  from "./ProductCommerce";

import ProductVariants
  from "./ProductVariants";

import ProductSEO
  from "./ProductSEO";

import {
  EMPTY_PRODUCT,
  normalizeBoolean,
  PRODUCT_API,
  PRODUCT_ROUTES,
  slugify,
} from "./productConfig";


const ProductForm = ({
  mode = "create",
  initialData = null,
  context = "admin",
}) => {

  const navigate =
    useNavigate();


  const isVendor =
    context === "vendor";


  const productApi =
    isVendor
      ? {
          formOptions:
            "/vendor/products/form-options",

          ai:
            "/vendor/ai/product-content",

          create:
            "/vendor/products",

          update: (id) =>
            `/vendor/products/${id}/update`,

          delete: (id) =>
            `/vendor/products/${id}`,
        }
      : PRODUCT_API;


  const productRoutes =
    isVendor
      ? {
          index:
            "/vendor/products",

          edit: (id) =>
            `/vendor/products/${id}/edit`,
        }
      : PRODUCT_ROUTES;


  /*
  |--------------------------------------------------------------------------
  | BASIC FORM
  |--------------------------------------------------------------------------
  */

  const [
    form,
    setForm,
  ] = useState({
    ...EMPTY_PRODUCT,
  });


  /*
  |--------------------------------------------------------------------------
  | FORM OPTIONS
  |--------------------------------------------------------------------------
  */

  const [
    formOptions,
    setFormOptions,
  ] = useState({
    categories: [],
    brands: [],
    collections: [],
    global_variants: [],
  });


  const [
    optionsLoading,
    setOptionsLoading,
  ] = useState(true);


  /*
  |--------------------------------------------------------------------------
  | VARIANTS
  |--------------------------------------------------------------------------
  */

  const [
    options,
    setOptions,
  ] = useState([]);

  const [
    variants,
    setVariants,
  ] = useState([]);


  /*
  |--------------------------------------------------------------------------
  | MEDIA
  |--------------------------------------------------------------------------
  */

  const [
    existingMedia,
    setExistingMedia,
  ] = useState([]);

  const [
    newMedia,
    setNewMedia,
  ] = useState([]);

  const [
    deletedMediaIds,
    setDeletedMediaIds,
  ] = useState([]);

  const [
    cover,
    setCover,
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | SYSTEM
  |--------------------------------------------------------------------------
  */

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deleting,
    setDeleting,
  ] = useState(false);

  const [
    errors,
    setErrors,
  ] = useState({});

  const [
    message,
    setMessage,
  ] = useState("");

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
  | AUTO FIELD FLAGS
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
    seoDescriptionEdited,
    setSeoDescriptionEdited,
  ] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | LOAD FORM OPTIONS
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const loadOptions =
      async () => {

        try {

          setOptionsLoading(true);


          const response =
            await api.get(
              productApi
                .formOptions
            );


          setFormOptions({
            categories:
              response.data
                ?.categories ||
              [],

            brands:
              response.data
                ?.brands ||
              [],

            collections:
              response.data
                ?.collections ||
              [],

            global_variants:
              response.data
                ?.global_variants ||
              [],
          });

        } catch (error) {

          console.error(
            "Product form options error:",
            error
          );

        } finally {

          setOptionsLoading(false);

        }

      };


    loadOptions();

  }, []);


  /*
  |--------------------------------------------------------------------------
  | INITIAL EDIT DATA
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

      summary:
        initialData.summary || "",

      description:
        initialData.description ||
        "",

      specifications:
        initialData
          .specifications || "",

      status:
        initialData.status ||
        "active",

      is_featured:
        normalizeBoolean(
          initialData
            .is_featured
        ),

      online_store:
        normalizeBoolean(
          initialData
            .online_store
        ),

      point_of_sale:
        normalizeBoolean(
          initialData
            .point_of_sale
        ),

      category_id:
        initialData
          .category_id || "",

      brand_id:
        initialData.brand_id ||
        "",

      type:
        initialData.type || "",

      tags:
        Array.isArray(
          initialData.tags
        )
          ? initialData.tags
          : [],

      collection_ids:
        Array.isArray(
          initialData
            .collection_ids
        )
          ? initialData
              .collection_ids
              .map(Number)
          : [],

      product_format:
        initialData
          .product_format ||
        "physical",

      preorder_enabled:
        normalizeBoolean(
          initialData
            .preorder_enabled
        ),

      price:
        initialData.price ?? "",

      compare_at_price:
        initialData
          .compare_at_price ??
        "",

      cost_per_item:
        initialData
          .cost_per_item ??
        "",

      sku:
        initialData.sku || "",

      barcode:
        initialData.barcode ||
        "",

      quantity:
        initialData.quantity ??
        0,

      track_quantity:
        normalizeBoolean(
          initialData
            .track_quantity
        ),

      continue_selling_when_out_of_stock:
        normalizeBoolean(
          initialData
            .continue_selling_when_out_of_stock
        ),

      weight:
        initialData.weight ?? 0,

      weight_unit:
        initialData
          .weight_unit ||
        "kg",

      country_of_origin:
        initialData
          .country_of_origin ||
        "",

      hs_code:
        initialData.hs_code ||
        "",

      customs_description:
        initialData
          .customs_description ||
        "",

      seo_title:
        initialData
          .seo_title ||
        "",

      seo_description:
        initialData
          .seo_description ||
        "",
    });


    setOptions(
      Array.isArray(
        initialData.options
      )
        ? initialData.options.map(
            (
              option,
              index
            ) => ({
              ...option,

              sort_order:
                option.sort_order ??
                index,

              values:
                Array.isArray(
                  option.values
                )
                  ? option.values
                  : [],
            })
          )
        : []
    );


    setVariants(
      Array.isArray(
        initialData.variants
      )
        ? initialData.variants.map(
            (
              variant,
              index
            ) => ({
              ...variant,

              global_variant_value_ids:
                Array.isArray(
                  variant
                    .global_variant_value_ids
                )
                  ? variant
                      .global_variant_value_ids
                      .map(Number)
                  : [],

              is_active:
                normalizeBoolean(
                  variant.is_active
                ),

              quantity:
                Number(
                  variant.quantity ||
                  0
                ),

              sort_order:
                variant.sort_order ??
                index,
            })
          )
        : []
    );


    const media =
      Array.isArray(
        initialData.media
      )
        ? initialData.media
        : [];


    setExistingMedia(
      media
    );


    const existingCover =
      media.find(
        (item) =>
          normalizeBoolean(
            item.is_cover
          )
      );


    if (existingCover) {
      setCover({
        type: "existing",
        id: existingCover.id,
      });
    }


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

    setSeoDescriptionEdited(
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
  | UPDATE FIELD
  |--------------------------------------------------------------------------
  */

  const updateField = (
    field,
    value,
    manual = false
  ) => {

    if (
      field === "slug" &&
      manual
    ) {
      setSlugEdited(true);

      value =
        slugify(value);
    }


    if (
      field ===
        "seo_title" &&
      manual
    ) {
      setSeoTitleEdited(
        true
      );
    }


    if (
      field ===
        "seo_description" &&
      manual
    ) {
      setSeoDescriptionEdited(
        true
      );
    }


    setForm(
      (previous) => {

        const next = {
          ...previous,
          [field]: value,
        };


        if (
          field === "title"
        ) {

          if (!slugEdited) {
            next.slug =
              slugify(value);
          }


          if (
            !seoTitleEdited
          ) {
            next.seo_title =
              String(value)
                .slice(0, 70);
          }

        }


        if (
          field === "summary" &&
          !seoDescriptionEdited
        ) {

          next.seo_description =
            String(value)
              .replace(
                /<[^>]*>/g,
                ""
              )
              .slice(0, 160);

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
          "Please enter the product title first."
        );

        return false;
      }


      try {

        setAiLoading(
          target
        );

        setAiError("");


        const category =
          formOptions.categories.find(
            (item) =>
              Number(item.id) ===
              Number(
                form.category_id
              )
          );


        const brand =
          formOptions.brands.find(
            (item) =>
              Number(item.id) ===
              Number(
                form.brand_id
              )
          );


        const response =
          await api.post(
            productApi.ai,
            {
              title:
                form.title,

              summary:
                form.summary,

              description:
                form.description,

              specifications:
                form.specifications,

              category_name:
                category?.name ||
                "",

              brand_name:
                brand?.name ||
                "",

              type:
                form.type,

              tags:
                form.tags,

              variant_names:
                variants.map(
                  (variant) =>
                    variant.title
                ),

              prompt,
              tone,
              target,
            }
          );


        const data =
          response.data?.data;


        if (!data) {
          throw new Error(
            "Invalid AI response."
          );
        }


        setForm(
          (previous) => ({
            ...previous,

            ...(data.summary !==
            undefined
              ? {
                  summary:
                    data.summary,
                }
              : {}),

            ...(data.description !==
            undefined
              ? {
                  description:
                    data.description,
                }
              : {}),

            ...(data.specifications !==
            undefined
              ? {
                  specifications:
                    data.specifications,
                }
              : {}),

            ...(data.seo_title !==
            undefined
              ? {
                  seo_title:
                    data.seo_title,
                }
              : {}),

            ...(data.seo_description !==
            undefined
              ? {
                  seo_description:
                    data.seo_description,
                }
              : {}),

            ...(data.slug !==
            undefined
              ? {
                  slug:
                    slugify(
                      data.slug
                    ),
                }
              : {}),
          })
        );


        if (
          data.slug !==
          undefined
        ) {
          setSlugEdited(true);
        }

        if (
          data.seo_title !==
          undefined
        ) {
          setSeoTitleEdited(
            true
          );
        }

        if (
          data.seo_description !==
          undefined
        ) {
          setSeoDescriptionEdited(
            true
          );
        }


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


        const append =
          (
            key,
            value
          ) => {

            if (
              value === null ||
              value === undefined
            ) {
              return;
            }

            data.append(
              key,
              value
            );

          };


        append(
          "title",
          form.title
        );

        append(
          "slug",
          form.slug
        );

        append(
          "summary",
          form.summary
        );

        append(
          "description",
          form.description
        );

        append(
          "specifications",
          form.specifications
        );


        append(
          "status",
          form.status
        );

        append(
          "is_featured",
          form.is_featured
            ? "1"
            : "0"
        );


        append(
          "online_store",
          form.online_store
            ? "1"
            : "0"
        );

        append(
          "point_of_sale",
          form.point_of_sale
            ? "1"
            : "0"
        );


        append(
          "category_id",
          form.category_id
        );

        if (
          form.brand_id
        ) {
          append(
            "brand_id",
            form.brand_id
          );
        }


        append(
          "type",
          form.type
        );


        append(
          "tags",
          JSON.stringify(
            form.tags
          )
        );


        append(
          "collection_ids",
          JSON.stringify(
            form.collection_ids
          )
        );


        append(
          "product_format",
          form.product_format
        );


        append(
          "preorder_enabled",
          form.preorder_enabled
            ? "1"
            : "0"
        );


        append(
          "price",
          form.price
        );

        append(
          "compare_at_price",
          form.compare_at_price
        );

        append(
          "cost_per_item",
          form.cost_per_item
        );


        append(
          "sku",
          form.sku
        );

        append(
          "barcode",
          form.barcode
        );

        append(
          "quantity",
          form.quantity
        );


        append(
          "track_quantity",
          form.track_quantity
            ? "1"
            : "0"
        );

        append(
          "continue_selling_when_out_of_stock",
          form.continue_selling_when_out_of_stock
            ? "1"
            : "0"
        );


        append(
          "weight",
          form.weight
        );

        append(
          "weight_unit",
          form.weight_unit
        );

        append(
          "country_of_origin",
          form.country_of_origin
        );

        append(
          "hs_code",
          form.hs_code
        );

        append(
          "customs_description",
          form.customs_description
        );


        append(
          "seo_title",
          form.seo_title
        );

        append(
          "seo_description",
          form.seo_description
        );


        /*
        |--------------------------------------------------------------------------
        | OPTIONS
        |--------------------------------------------------------------------------
        */

        append(
          "options",
          JSON.stringify(
            options.map(
              (
                option,
                index
              ) => ({
                global_variant_id:
                  option.global_variant_id,

                sort_order:
                  index,

                values:
                  option.values.map(
                    (
                      value,
                      valueIndex
                    ) => ({
                      global_variant_value_id:
                        value
                          .global_variant_value_id,

                      sort_order:
                        valueIndex,
                    })
                  ),
              })
            )
          )
        );


        /*
        |--------------------------------------------------------------------------
        | VARIANT MEDIA
        |--------------------------------------------------------------------------
        |
        | Unsaved variants cannot upload their image immediately because they
        | do not have a database ID yet. Keep those files in the variant state,
        | append them to media[], and send the matching media_index so the
        | backend can attach the uploaded ProductMedia row to the new variant.
        |
        */

        const variantMediaUploads = [];
        const variantMediaIndexMap = {};


        variants.forEach(
          (
            variant,
            index
          ) => {

            const file =
              variant
                ?.pending_image_file;


            if (
              !(file instanceof File)
            ) {
              return;
            }


            const mediaIndex =
              newMedia.length +
              variantMediaUploads.length;


            variantMediaIndexMap[
              index
            ] =
              mediaIndex;


            variantMediaUploads.push({
              file,

              alt_text:
                variant.title ||
                form.title ||
                "",
            });

          }
        );


        if (
          newMedia.length +
          variantMediaUploads.length >
          10
        ) {

          setMessage(
            "A maximum of 10 new media files can be uploaded at once, including variant images."
          );

          return;
        }


        /*
        |--------------------------------------------------------------------------
        | VARIANTS
        |--------------------------------------------------------------------------
        */

        append(
          "variants",
          JSON.stringify(
            variants.map(
              (
                variant,
                index
              ) => ({
                id:
                  variant.id ||
                  null,

                title:
                  variant.title,

                global_variant_value_ids:
                  variant.global_variant_value_ids,

                price:
                  variant.price ===
                  ""
                    ? null
                    : variant.price,

                compare_at_price:
                  variant.compare_at_price ===
                  ""
                    ? null
                    : variant.compare_at_price,

                cost_per_item:
                  variant.cost_per_item ===
                  ""
                    ? null
                    : variant.cost_per_item,

                sku:
                  variant.sku ||
                  null,

                barcode:
                  variant.barcode ||
                  null,

                quantity:
                  Number(
                    variant.quantity ||
                    0
                  ),

                is_active:
                  variant.is_active
                    ? "1"
                    : "0",

                product_media_id:
                  variant.product_media_id ||
                  null,

                media_index:
                  Object.prototype
                    .hasOwnProperty.call(
                      variantMediaIndexMap,
                      index
                    )
                    ? variantMediaIndexMap[
                        index
                      ]
                    : null,

                sort_order:
                  index,
              })
            )
          )
        );


        /*
        |--------------------------------------------------------------------------
        | MEDIA
        |--------------------------------------------------------------------------
        */

        newMedia.forEach(
          (media) => {

            data.append(
              "media[]",
              media.file
            );

          }
        );


        variantMediaUploads.forEach(
          (media) => {

            data.append(
              "media[]",
              media.file
            );

          }
        );


        append(
          "media_alt_texts",
          JSON.stringify([
            ...newMedia.map(
              (media) =>
                media.alt_text ||
                ""
            ),

            ...variantMediaUploads.map(
              (media) =>
                media.alt_text ||
                ""
            ),
          ])
        );


        append(
          "deleted_media_ids",
          JSON.stringify(
            deletedMediaIds
          )
        );


        if (
          cover?.type ===
          "existing"
        ) {

          append(
            "cover_media_id",
            cover.id
          );

        }


        if (
          cover?.type === "new"
        ) {

          append(
            "cover_media_index",
            cover.index
          );

        }


        /*
        |--------------------------------------------------------------------------
        | API
        |--------------------------------------------------------------------------
        */

        let response;


        if (
          mode === "edit"
        ) {

          response =
            await api.post(
              productApi.update(
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

          response =
            await api.post(
              productApi.create,
              data,
              {
                headers: {
                  "Content-Type":
                    "multipart/form-data",
                },
              }
            );

        }


        const saved =
          response.data
            ?.product;


      





        if (
  mode === "create" &&
  saved?.id
) {

  /*
  |--------------------------------------------------------------------------
  | VENDOR CREATE
  |--------------------------------------------------------------------------
  */

  if (isVendor) {

    setForm({
      ...EMPTY_PRODUCT,

      tags: [],
      collection_ids: [],
    });

    setOptions([]);
    setVariants([]);

    setExistingMedia([]);
    setNewMedia([]);
    setDeletedMediaIds([]);

    setCover(null);

    setSlugEdited(false);
    setSeoTitleEdited(false);
    setSeoDescriptionEdited(false);

    setErrors({});
    setAiError("");

    setMessage(
      "Product created successfully."
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | ADMIN CREATE
  |--------------------------------------------------------------------------
  */

  navigate(
    productRoutes.edit(
      saved.id
    ),
    {
      replace: true,
    }
  );

  return;
}


        if (
          saved &&
          mode === "edit"
        ) {

          setMessage(
            "Product saved successfully."
          );


          setExistingMedia(
            saved.media || []
          );

          setNewMedia([]);
          setDeletedMediaIds([]);


          setOptions(
            Array.isArray(
              saved.options
            )
              ? saved.options.map(
                  (
                    option,
                    index
                  ) => ({
                    ...option,

                    sort_order:
                      option.sort_order ??
                      index,

                    values:
                      Array.isArray(
                        option.values
                      )
                        ? option.values
                        : [],
                  })
                )
              : []
          );


          setVariants(
            Array.isArray(
              saved.variants
            )
              ? saved.variants.map(
                  (
                    variant,
                    index
                  ) => ({
                    ...variant,

                    global_variant_value_ids:
                      Array.isArray(
                        variant
                          .global_variant_value_ids
                      )
                        ? variant
                            .global_variant_value_ids
                            .map(Number)
                        : [],

                    is_active:
                      normalizeBoolean(
                        variant.is_active
                      ),

                    quantity:
                      Number(
                        variant.quantity ||
                        0
                      ),

                    pending_image_file:
                      null,

                    pending_image_preview:
                      null,

                    sort_order:
                      variant.sort_order ??
                      index,
                  })
                )
              : []
          );


          const savedCover =
            saved.media?.find(
              (item) =>
                normalizeBoolean(
                  item.is_cover
                )
            );


          if (savedCover) {
            setCover({
              type: "existing",
              id: savedCover.id,
            });
          }

        }

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

          setMessage(
            "Please check the highlighted fields."
          );

        } else {

          setMessage(
            error.response?.data
              ?.message ||
            "Unable to save product."
          );

        }

      } finally {

        setSaving(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | DELETE PRODUCT
  |--------------------------------------------------------------------------
  */

  const deleteProduct =
    async () => {

      if (
        mode !== "edit" ||
        !initialData?.id
      ) {
        return;
      }


      if (
        !window.confirm(
          `Delete "${form.title}"?`
        )
      ) {
        return;
      }


      try {

        setDeleting(true);


        await api.delete(
          productApi.delete(
            initialData.id
          )
        );


        navigate(
          productRoutes.index,
          {
            replace: true,
          }
        );

      } catch (error) {

        setMessage(
          error.response?.data
            ?.message ||
          "Unable to delete product."
        );

      } finally {

        setDeleting(false);

      }

    };


  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  if (
    optionsLoading &&
    mode === "create"
  ) {

    return (
      <LoadingPage />
    );
  }


  return (
    <form
      onSubmit={
        handleSubmit
      }

      className="
        min-h-[calc(100vh-74px)]

        bg-[#f6f7f8]

        px-5
        py-5

        font-['Inter']
      "
    >

      <div
        className="
          max-w-[1120px]
          mx-auto
        "
      >

        {/* HEADER */}

        <div
          className="
            mb-[20px]

            flex
            items-center
            justify-between
            gap-[16px]
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
                text-[18px]
                font-bold
              "
            >
              {form.title ||
                (mode === "edit"
                  ? "Edit Product"
                  : "Add product")}
            </h1>


            <StatusPill
              status={
                form.status
              }
            />

          </div>


          <div
            className="
              flex
              items-center
              gap-[8px]
            "
          >

            {mode === "edit" && (

              <>
                <button
                  type="button"

                  className="
                    h-[36px]
                    px-[13px]

                    rounded-full

                    border
                    border-[#dedfe2]

                    bg-white

                    flex
                    items-center
                    gap-[6px]

                    text-[12px]
                  "
                >
                  <Eye size={14} />
                  View
                </button>


                <button
                  type="button"

                  onClick={
                    deleteProduct
                  }

                  disabled={
                    deleting
                  }

                  className="
                    h-[36px]
                    px-[13px]

                    rounded-full

                    border
                    border-red-300

                    bg-white

                    flex
                    items-center
                    gap-[6px]

                    text-[12px]
                    text-red-500
                  "
                >
                  {deleting ? (
                    <LoaderCircle
                      size={13}
                      className="
                        animate-spin
                      "
                    />
                  ) : (
                    <Trash2
                      size={13}
                    />
                  )}

                  Delete product
                </button>
              </>

            )}


            <button
              type="submit"

              disabled={saving}

              className="
                h-[37px]
                px-[16px]

                rounded-full

                bg-[#2065D1]
                text-white

                flex
                items-center
                gap-[6px]

                text-[12px]
                font-semibold

                disabled:opacity-60
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

              Save
            </button>


            <button
              type="button"

              onClick={() =>
                navigate(
                  productRoutes.index
                )
              }

              className="
                h-[37px]
                px-[15px]

                rounded-full

                border
                border-[#dedfe2]

                bg-white

                text-[12px]
              "
            >
              ← Back
            </button>

          </div>

        </div>


        {message && (
          <Notice>
            {message}
          </Notice>
        )}


        {aiError && (
          <Notice>
            {aiError}
          </Notice>
        )}


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

            <ProductDetails
              form={form}

              updateField={
                updateField
              }

              generateAI={
                generateAI
              }

              aiLoading={
                aiLoading
              }

              errors={errors}
            />


            <ProductCommerce
              form={form}

              updateField={
                updateField
              }

              variants={
                variants
              }
            />


            <ProductMedia
              title={
                form.title
              }

              existingMedia={
                existingMedia
              }

              setExistingMedia={
                setExistingMedia
              }

              newMedia={
                newMedia
              }

              setNewMedia={
                setNewMedia
              }

              deletedMediaIds={
                deletedMediaIds
              }

              setDeletedMediaIds={
                setDeletedMediaIds
              }

              cover={cover}
              setCover={setCover}
            />


            
            <ProductVariants
  productId={
    initialData?.id ||
    null
  }

  context={
    context
  }

  globalVariants={
    formOptions
      .global_variants
  }

  options={
    options
  }

  setOptions={
    setOptions
  }

  variants={
    variants
  }

  setVariants={
    setVariants
  }
/>


            <ProductSEO
              form={form}

              updateField={
                updateField
              }

              generateAI={
                generateAI
              }

              aiLoading={
                aiLoading
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

            <SideCard
              title="Status"
            >

              <label
                className="
                  block
                  mb-[7px]

                  text-[12px]
                  font-medium
                "
              >
                Status
              </label>


              <select
                value={
                  form.status
                }

                onChange={(event) =>
                  updateField(
                    "status",
                    event.target.value
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

                  text-[12px]
                "
              >
                <option value="active">
                  Active
                </option>

                <option value="draft">
                  Draft
                </option>

                <option value="archived">
                  Archived
                </option>
              </select>


              <ToggleRow
                label="Featured"

                active={
                  form.is_featured
                }

                onClick={() =>
                  updateField(
                    "is_featured",
                    !form.is_featured
                  )
                }

                className="
                  mt-[12px]
                "
              />

            </SideCard>


            {/* PUBLISHING */}

            <SideCard
              title="Publishing"
            >

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

            </SideCard>


            <ProductOrganization
              form={form}

              updateField={
                updateField
              }

              categories={
                formOptions.categories
              }

              brands={
                formOptions.brands
              }

              collections={
                formOptions.collections
              }
            />

          </div>

        </div>

      </div>

    </form>
  );
};


const SideCard = ({
  title,
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
    <h2
      className="
        mb-[16px]

        text-[15px]
        font-bold
      "
    >
      {title}
    </h2>

    {children}
  </div>
);


const ToggleRow = ({
  label,
  active,
  onClick,
  className = "",
}) => (
  <div
    className={`
      min-h-[44px]

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

          ${
            active
              ? "left-[18px]"
              : "left-[3px]"
          }
        `}
      />

    </button>

  </div>
);


const StatusPill = ({
  status,
}) => (
  <span
    className={`
      rounded-full

      px-[8px]
      py-[4px]

      text-[9px]
      font-semibold

      capitalize

      ${
        status === "active"
          ? "bg-[#2065D1] text-white"
          : status === "draft"
          ? "bg-[#fff2cc] text-[#9a6d00]"
          : "bg-[#eceef1] text-[#666]"
      }
    `}
  >
    {status}
  </span>
);


const Notice = ({
  children,
}) => (
  <div
    className="
      mb-[15px]

      rounded-[10px]

      border
      border-[#d9dde5]

      bg-white

      px-[13px]
      py-[10px]

      text-[11px]
    "
  >
    {children}
  </div>
);


const LoadingPage = () => (
  <div
    className="
      min-h-[calc(100vh-74px)]

      bg-[#f6f7f8]

      flex
      items-center
      justify-center
    "
  >
    <LoaderCircle
      size={30}
      className="
        animate-spin
        text-[#2065D1]
      "
    />
  </div>
);


export default ProductForm;