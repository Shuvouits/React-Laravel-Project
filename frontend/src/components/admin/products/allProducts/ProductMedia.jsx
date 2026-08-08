import {
  useRef,
  useState,
} from "react";

import {
  Image as ImageIcon,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

import BrandImageStudio
  from "../../brands/BrandImageStudio";


const ProductMedia = ({
  title,

  existingMedia,
  setExistingMedia,

  newMedia,
  setNewMedia,

  deletedMediaIds,
  setDeletedMediaIds,

  cover,
  setCover,
}) => {

  const inputRef =
    useRef(null);

  const [
    studioOpen,
    setStudioOpen,
  ] = useState(false);


  const addFiles = (
    files
  ) => {
    const selected =
      Array.from(
        files || []
      );


    const allowed =
      selected
        .filter(
          (file) =>
            file.type.startsWith(
              "image/"
            ) ||
            file.type.startsWith(
              "video/"
            )
        )
        .slice(
          0,
          Math.max(
            0,
            10 -
              existingMedia.length -
              newMedia.length
          )
        );


    const next =
      allowed.map(
        (file) => ({
          file,

          preview:
            URL.createObjectURL(
              file
            ),

          media_type:
            file.type.startsWith(
              "video/"
            )
              ? "video"
              : "image",

          alt_text: "",
        })
      );


    const start =
      newMedia.length;


    setNewMedia([
      ...newMedia,
      ...next,
    ]);


    if (
      !cover &&
      existingMedia.length === 0 &&
      next.length > 0
    ) {
      setCover({
        type: "new",
        index: start,
      });
    }
  };


  const removeExisting = (
    media
  ) => {
    setDeletedMediaIds([
      ...deletedMediaIds,
      media.id,
    ]);


    const remaining =
      existingMedia.filter(
        (item) =>
          item.id !== media.id
      );


    setExistingMedia(
      remaining
    );


    if (
      cover?.type ===
        "existing" &&
      Number(cover.id) ===
        Number(media.id)
    ) {

      if (remaining[0]) {
        setCover({
          type: "existing",
          id: remaining[0].id,
        });
      } else if (
        newMedia[0]
      ) {
        setCover({
          type: "new",
          index: 0,
        });
      } else {
        setCover(null);
      }
    }
  };


  const removeNew = (
    index
  ) => {
    const removed =
      newMedia[index];


    if (
      removed?.preview?.startsWith(
        "blob:"
      )
    ) {
      URL.revokeObjectURL(
        removed.preview
      );
    }


    const next =
      newMedia.filter(
        (_, itemIndex) =>
          itemIndex !== index
      );


    setNewMedia(next);


    if (
      cover?.type === "new"
    ) {

      if (
        cover.index === index
      ) {

        if (
          existingMedia[0]
        ) {
          setCover({
            type: "existing",
            id:
              existingMedia[0].id,
          });
        } else if (next[0]) {
          setCover({
            type: "new",
            index: 0,
          });
        } else {
          setCover(null);
        }

      } else if (
        cover.index > index
      ) {

        setCover({
          type: "new",
          index:
            cover.index - 1,
        });

      }
    }
  };


  const isCoverExisting = (
    id
  ) =>
    cover?.type ===
      "existing" &&
    Number(cover.id) ===
      Number(id);


  const isCoverNew = (
    index
  ) =>
    cover?.type === "new" &&
    cover.index === index;


  return (
    <>
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

        <div
          className="
            flex
            items-center
            justify-between
          "
        >

          <h2
            className="
              text-[15px]
              font-bold
            "
          >
            Media
          </h2>


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

              text-[10px]
              font-semibold
            "
          >
            <Sparkles size={11} />
            AI Studio
          </button>

        </div>


        {/* DROP ZONE */}

        <button
          type="button"

          onClick={() =>
            inputRef.current?.click()
          }

          onDragOver={(event) =>
            event.preventDefault()
          }

          onDrop={(event) => {
            event.preventDefault();

            addFiles(
              event.dataTransfer.files
            );
          }}

          className="
            mt-[16px]

            w-full
            min-h-[165px]

            rounded-[13px]

            border
            border-dashed
            border-[#cfd2d7]

            flex
            flex-col
            items-center
            justify-center

            text-center
          "
        >

          <Upload
            size={28}
            className="
              text-[#777]
            "
          />


          <p
            className="
              mt-[10px]

              text-[12px]
              font-semibold
            "
          >
            Drag and drop files here, or click to browse
          </p>


          <p
            className="
              mt-[5px]

              text-[10px]
              text-[#777]
            "
          >
            Images, videos and 3D media. Maximum 10 files.
          </p>

        </button>


        <input
          ref={inputRef}

          type="file"

          multiple

          accept="
            image/jpeg,
            image/png,
            image/webp,
            video/mp4,
            video/webm
          "

          className="hidden"

          onChange={(event) => {
            addFiles(
              event.target.files
            );

            event.target.value =
              "";
          }}
        />


        {/* MEDIA CARDS */}

        {(existingMedia.length >
          0 ||
          newMedia.length > 0) && (

          <div
            className="
              mt-[16px]

              flex
              flex-wrap
              gap-[12px]
            "
          >

            {existingMedia.map(
              (media) => (

                <MediaCard
                  key={`existing-${media.id}`}

                  src={media.url}
                  type={
                    media.media_type
                  }

                  cover={
                    isCoverExisting(
                      media.id
                    )
                  }

                  onCover={() =>
                    setCover({
                      type:
                        "existing",

                      id: media.id,
                    })
                  }

                  onDelete={() =>
                    removeExisting(
                      media
                    )
                  }
                />

              )
            )}


            {newMedia.map(
              (
                media,
                index
              ) => (

                <MediaCard
                  key={`new-${index}`}

                  src={
                    media.preview
                  }

                  type={
                    media.media_type
                  }

                  cover={
                    isCoverNew(
                      index
                    )
                  }

                  onCover={() =>
                    setCover({
                      type: "new",
                      index,
                    })
                  }

                  onDelete={() =>
                    removeNew(index)
                  }
                />

              )
            )}

          </div>

        )}


        <p
          className="
            mt-[10px]

            text-[10px]
            text-[#777]
          "
        >
          {existingMedia.length +
            newMedia.length} / 10 files · Cover image is used on the storefront.
        </p>

      </div>


      {studioOpen && (

        <BrandImageStudio
          brandName={
            title ||
            "Product"
          }

          initialPreview={
            cover?.type ===
            "existing"
              ? existingMedia.find(
                  (item) =>
                    Number(
                      item.id
                    ) ===
                    Number(
                      cover.id
                    )
                )?.url
              : cover?.type ===
                "new"
              ? newMedia[
                  cover.index
                ]?.preview
              : null
          }

          onClose={() =>
            setStudioOpen(false)
          }

          onSave={(file) => {
            if (file) {
              addFiles([file]);
            }

            setStudioOpen(false);
          }}
        />

      )}

    </>
  );
};


const MediaCard = ({
  src,
  type,
  cover,
  onCover,
  onDelete,
}) => (

  <div
    className="
      relative

      w-[165px]
      h-[165px]

      rounded-[12px]

      border
      border-[#dedfe2]

      bg-[#f5f5f5]

      overflow-hidden
    "
  >

    {type === "video" ? (

      <video
        src={src}
        muted
        className="
          w-full
          h-full

          object-cover
        "
      />

    ) : src ? (

      <img
        src={src}
        alt=""
        className="
          w-full
          h-full

          object-contain
        "
      />

    ) : (

      <div
        className="
          w-full
          h-full

          flex
          items-center
          justify-center
        "
      >
        <ImageIcon
          size={30}
          className="
            text-[#999]
          "
        />
      </div>

    )}


    {cover && (
      <span
        className="
          absolute
          left-[7px]
          bottom-[7px]

          rounded-[5px]

          bg-[#333]
          text-white

          px-[6px]
          py-[3px]

          flex
          items-center
          gap-[4px]

          text-[9px]
        "
      >
        <Star size={9} />
        Cover
      </span>
    )}


    <div
      className="
        absolute
        top-[7px]
        right-[7px]

        flex
        gap-[5px]
      "
    >

      {!cover && (
        <button
          type="button"

          onClick={onCover}

          title="Set cover"

          className="
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
          <Star size={12} />
        </button>
      )}


      <button
        type="button"

        onClick={onDelete}

        className="
          w-[27px]
          h-[27px]

          rounded-full

          bg-white

          border
          border-[#ddd]

          flex
          items-center
          justify-center

          hover:text-red-500
        "
      >
        <Trash2 size={12} />
      </button>

    </div>

  </div>
);


export default ProductMedia;