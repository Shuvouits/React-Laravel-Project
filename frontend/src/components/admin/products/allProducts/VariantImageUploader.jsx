import {
  ImagePlus,
  LoaderCircle,
  RefreshCw,
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
  context = "admin",
  className = "",
}) => {
  const fileInputRef = useRef(null);
  const localPreviewRef = useRef(null);

  const [preview, setPreview] = useState(
    variant?.pending_image_preview ||
    variant?.image_url ||
    variant?.media?.image_url ||
    variant?.media?.file_url ||
    null
  );

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const isSavedVariant = Boolean(
    productId &&
    variant?.id
  );


  useEffect(() => {
    setPreview(
      variant?.pending_image_preview ||
      variant?.image_url ||
      variant?.media?.image_url ||
      variant?.media?.file_url ||
      null
    );
  }, [
    variant?.pending_image_preview,
    variant?.image_url,
    variant?.media?.image_url,
    variant?.media?.file_url,
  ]);


  useEffect(() => {
    return () => {
      if (localPreviewRef.current) {
        URL.revokeObjectURL(
          localPreviewRef.current
        );
      }
    };
  }, []);


  const openFilePicker = () => {
    if (uploading) {
      return;
    }

    fileInputRef.current?.click();
  };


  const validateFile = (file) => {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return "Only JPG, JPEG, PNG, and WebP images are allowed.";
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return "Image must be smaller than 5MB.";
    }

    return null;
  };


  const handleFileChange = async (event) => {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) {
      return;
    }

    const validationError =
      validateFile(file);

    if (validationError) {
      setError(validationError);
      return;
    }

    setError("");


    if (localPreviewRef.current) {
      URL.revokeObjectURL(
        localPreviewRef.current
      );
    }

    const temporaryPreview =
      URL.createObjectURL(file);

    localPreviewRef.current =
      temporaryPreview;

    setPreview(
      temporaryPreview
    );


    if (!isSavedVariant) {
      onUpdated?.({
        ...variant,

        pending_image_file: file,

        pending_image_preview:
          temporaryPreview,

        image_url:
          temporaryPreview,
      });

      return;
    }


    try {
      setUploading(true);

      const formData =
        new FormData();

      formData.append(
        "image",
        file
      );

      const prefix =
        context === "vendor"
          ? "/vendor"
          : "/admin";

      const response =
        await api.post(
          `${prefix}/products/${productId}/variants/${variant.id}/image`,
          formData
        );

      const updatedVariant =
        response.data?.variant || {};

      const serverImage =
        updatedVariant.image_url ||
        temporaryPreview;

      setPreview(
        serverImage
      );

      onUpdated?.({
        ...variant,
        ...updatedVariant,

        pending_image_file: null,

        pending_image_preview: null,

        image_url:
          serverImage,
      });


      if (
        updatedVariant.image_url &&
        localPreviewRef.current
      ) {
        URL.revokeObjectURL(
          localPreviewRef.current
        );

        localPreviewRef.current =
          null;
      }

    } catch (error) {
      console.error(
        "Variant image upload error:",
        error
      );

      if (
        error.response?.status === 422
      ) {
        const errors =
          error.response?.data?.errors ||
          {};

        const firstError =
          Object.values(errors)
            .flat()
            .find(Boolean);

        setError(
          firstError ||
          "Unable to upload variant image."
        );
      } else {
        setError(
          error.response?.data?.message ||
          "Unable to upload variant image."
        );
      }


      setPreview(
        variant?.pending_image_preview ||
        variant?.image_url ||
        variant?.media?.image_url ||
        variant?.media?.file_url ||
        null
      );


      if (localPreviewRef.current) {
        URL.revokeObjectURL(
          localPreviewRef.current
        );

        localPreviewRef.current =
          null;
      }

    } finally {
      setUploading(false);
    }
  };


  return (
    <div className={className}>
      <button
        type="button"
        onClick={openFilePicker}
        disabled={uploading}
        title={
          preview
            ? "Change variant image"
            : "Select variant image"
        }
        className="
          group
          relative
          flex
          h-[64px]
          w-[64px]
          shrink-0
          items-center
          justify-center
          overflow-hidden
          rounded-[10px]
          border
          border-[#dedfe3]
          bg-[#f7f7f8]
          transition-all
          hover:border-[#b7b9bf]
          hover:bg-[#f3f4f6]
          disabled:cursor-not-allowed
          disabled:opacity-60
        "
      >
        {preview ? (
          <>
            <img
              src={preview}
              alt={
                variant?.title ||
                variant?.name ||
                "Variant"
              }
              className="
                h-full
                w-full
                object-contain
                p-[5px]
              "
            />

            {!uploading && (
              <div
                className="
                  absolute
                  inset-0
                  flex
                  items-center
                  justify-center
                  bg-black/45
                  opacity-0
                  transition-opacity
                  group-hover:opacity-100
                "
              >
                <RefreshCw
                  size={18}
                  className="text-white"
                />
              </div>
            )}
          </>
        ) : (
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


        {uploading && (
          <div
            className="
              absolute
              inset-0
              flex
              items-center
              justify-center
              bg-white/85
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


      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />


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


      {!isSavedVariant &&
        preview && (
          <p
            className="
              mt-[5px]
              max-w-[180px]
              text-[9px]
              leading-[1.35]
              text-[#28a36a]
            "
          >
            Image selected. It will upload when you save the product.
          </p>
        )}
    </div>
  );
};


export default VariantImageUploader;
