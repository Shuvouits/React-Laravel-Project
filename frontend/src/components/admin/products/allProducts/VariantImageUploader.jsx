import {
  ImagePlus,
  LoaderCircle,
  RefreshCw,
  Upload,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../../../../api/axios";


const VariantImageUploader = ({
  productId,
  variant,
  onUpdated,
  className = "",
}) => {

  /*
  |--------------------------------------------------------------------------
  | FILE INPUT
  |--------------------------------------------------------------------------
  */

  const fileInputRef =
    useRef(null);


  /*
  |--------------------------------------------------------------------------
  | STATE
  |--------------------------------------------------------------------------
  */

  const [
    preview,
    setPreview,
  ] = useState(
    variant?.image_url ||
    variant?.media?.image_url ||
    variant?.media?.file_url ||
    null
  );


  const [
    uploading,
    setUploading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | SYNC VARIANT IMAGE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    setPreview(
      variant?.image_url ||
      variant?.media?.image_url ||
      variant?.media?.file_url ||
      null
    );

  }, [
    variant?.image_url,
    variant?.media?.image_url,
    variant?.media?.file_url,
  ]);


  /*
  |--------------------------------------------------------------------------
  | CAN UPLOAD
  |--------------------------------------------------------------------------
  */

  const canUpload =
    Boolean(
      productId &&
      variant?.id
    );


  /*
  |--------------------------------------------------------------------------
  | OPEN FILE PICKER
  |--------------------------------------------------------------------------
  */

  const openFilePicker =
    () => {

      if (
        uploading ||
        !canUpload
      ) {
        return;
      }


      fileInputRef
        .current
        ?.click();

    };


  /*
  |--------------------------------------------------------------------------
  | VALIDATE FILE
  |--------------------------------------------------------------------------
  */

  const validateFile = (
    file
  ) => {

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];


    if (
      !allowedTypes.includes(
        file.type
      )
    ) {

      return "Only JPG, JPEG, PNG, and WebP images are allowed.";

    }


    const maxSize =
      5 * 1024 * 1024;


    if (
      file.size >
      maxSize
    ) {

      return "Image must be smaller than 5MB.";

    }


    return null;

  };


  /*
  |--------------------------------------------------------------------------
  | UPLOAD IMAGE
  |--------------------------------------------------------------------------
  */

  const handleFileChange =
    async (event) => {

      const file =
        event.target
          .files?.[0];


      if (!file) {
        return;
      }


      /*
      |--------------------------------------------------------------------------
      | RESET INPUT
      |--------------------------------------------------------------------------
      */

      event.target.value =
        "";


      /*
      |--------------------------------------------------------------------------
      | PRODUCT / VARIANT CHECK
      |--------------------------------------------------------------------------
      */

      if (
        !productId ||
        !variant?.id
      ) {

        setError(
          "Save the product and variant before uploading a variant image."
        );

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | VALIDATION
      |--------------------------------------------------------------------------
      */

      const validationError =
        validateFile(
          file
        );


      if (
        validationError
      ) {

        setError(
          validationError
        );

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | LOCAL PREVIEW
      |--------------------------------------------------------------------------
      */

      const temporaryPreview =
        URL.createObjectURL(
          file
        );


      setPreview(
        temporaryPreview
      );


      setError("");

      setUploading(true);


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
        | API REQUEST
        |--------------------------------------------------------------------------
        */

        const response =
          await api.post(

            `/admin/products/${productId}/variants/${variant.id}/image`,

            formData

          );


        /*
        |--------------------------------------------------------------------------
        | RESPONSE VARIANT
        |--------------------------------------------------------------------------
        */

        const updatedVariant =
          response.data
            ?.variant ||
          {};


        /*
        |--------------------------------------------------------------------------
        | SERVER IMAGE
        |--------------------------------------------------------------------------
        */

        const serverImage =
          updatedVariant
            ?.image_url ||
          temporaryPreview;


        setPreview(
          serverImage
        );


        /*
        |--------------------------------------------------------------------------
        | UPDATE PARENT STATE
        |--------------------------------------------------------------------------
        */

        onUpdated?.({

          ...variant,

          ...updatedVariant,

          image_url:
            serverImage,

        });


      } catch (error) {

        console.error(
          "Variant image upload error:",
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


          setError(
            firstError ||
            "Unable to upload variant image."
          );

        } else {

          setError(
            error.response
              ?.data
              ?.message ||
            "Unable to upload variant image."
          );

        }


        /*
        |--------------------------------------------------------------------------
        | RESTORE OLD IMAGE
        |--------------------------------------------------------------------------
        */

        setPreview(
          variant?.image_url ||
          variant?.media
            ?.image_url ||
          variant?.media
            ?.file_url ||
          null
        );


      } finally {

        setUploading(
          false
        );


        URL.revokeObjectURL(
          temporaryPreview
        );

      }

    };


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (

    <div
      className={`
        ${className}
      `}
    >

      {/* =====================================================
          IMAGE BOX
      ====================================================== */}

      <button
        type="button"

        onClick={
          openFilePicker
        }

        disabled={
          uploading ||
          !canUpload
        }

        title={
          preview
            ? "Change variant image"
            : "Upload variant image"
        }

        className="
          group

          relative

          w-[64px]
          h-[64px]

          shrink-0

          overflow-hidden

          rounded-[10px]

          border
          border-[#dedfe3]

          bg-[#f7f7f8]

          flex
          items-center
          justify-center

          transition-all

          hover:border-[#b7b9bf]
          hover:bg-[#f3f4f6]

          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >

        {/* =================================================
            IMAGE EXISTS
        ================================================== */}

        {preview ? (

          <>
            <img
              src={
                preview
              }

              alt={
                variant?.title ||
                variant?.name ||
                "Variant"
              }

              className="
                w-full
                h-full

                object-contain

                p-[5px]
              "
            />


            {/* HOVER OVERLAY */}

            {!uploading && (

              <div
                className="
                  absolute
                  inset-0

                  bg-black/45

                  opacity-0

                  group-hover:opacity-100

                  flex
                  items-center
                  justify-center

                  transition-opacity
                "
              >

                <RefreshCw
                  size={18}

                  className="
                    text-white
                  "
                />

              </div>

            )}

          </>

        ) : (

          /* =================================================
             NO IMAGE
          ================================================== */

          <div
            className="
              flex
              flex-col
              items-center
              justify-center

              gap-[3px]

              text-[#777]
            "
          >

            <ImagePlus
              size={20}

              strokeWidth={1.7}
            />

            <span
              className="
                text-[9px]
                leading-none
              "
            >
              Image
            </span>

          </div>

        )}


        {/* =================================================
            UPLOADING
        ================================================== */}

        {uploading && (

          <div
            className="
              absolute
              inset-0

              bg-white/85

              flex
              items-center
              justify-center
            "
          >

            <LoaderCircle
              size={20}

              className="
                animate-spin

                text-[#2065D1]
              "
            />

          </div>

        )}

      </button>


      {/* =====================================================
          HIDDEN INPUT
      ====================================================== */}

      <input
        ref={
          fileInputRef
        }

        type="file"

        accept="
          image/jpeg,
          image/jpg,
          image/png,
          image/webp
        "

        onChange={
          handleFileChange
        }

        className="
          hidden
        "
      />


      {/* =====================================================
          ERROR
      ====================================================== */}

      {error && (

        <p
          className="
            mt-[5px]

            max-w-[180px]

            text-[10px]
            leading-[1.35]

            text-red-500
          "
        >
          {error}
        </p>

      )}


      {/* =====================================================
          UNSAVED VARIANT
      ====================================================== */}

      {!canUpload && (

        <p
          className="
            mt-[5px]

            max-w-[180px]

            text-[10px]
            leading-[1.35]

            text-[#999]
          "
        >
          Save variant first to add an image.
        </p>

      )}

    </div>

  );

};


export default VariantImageUploader;