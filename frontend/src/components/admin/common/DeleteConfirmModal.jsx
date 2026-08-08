import {
  useEffect,
} from "react";

import {
  LoaderCircle,
  Trash2,
  X,
} from "lucide-react";


const DeleteConfirmModal = ({
  open = false,

  title = "Delete Item",

  itemName = "",

  description = "",

  cancelText = "Cancel",

  confirmText = "Delete",

  loading = false,

  onClose,

  onConfirm,
}) => {

  /*
  |--------------------------------------------------------------------------
  | ESC KEY
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (!open) {
      return;
    }


    const handleKeyDown = (
      event
    ) => {

      if (
        event.key === "Escape" &&
        !loading
      ) {
        onClose?.();
      }

    };


    document.addEventListener(
      "keydown",
      handleKeyDown
    );


    /*
    |--------------------------------------------------------------------------
    | LOCK BODY SCROLL
    |--------------------------------------------------------------------------
    */

    const oldOverflow =
      document.body.style.overflow;


    document.body.style.overflow =
      "hidden";


    return () => {

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );


      document.body.style.overflow =
        oldOverflow;

    };

  }, [
    open,
    loading,
    onClose,
  ]);


  if (!open) {
    return null;
  }


  return (

    <div
      className="
        fixed
        inset-0
        z-[99999]

        bg-black/55

        flex
        items-center
        justify-center

        px-4

        backdrop-blur-[1px]
      "

      onMouseDown={(event) => {

        if (
          event.target ===
            event.currentTarget &&
          !loading
        ) {
          onClose?.();
        }

      }}
    >

      {/* =====================================================
          MODAL
      ====================================================== */}

      <div
        className="
          relative

          w-full
          max-w-[510px]

          overflow-hidden

          rounded-[24px]

          bg-white

          shadow-[0_24px_80px_rgba(0,0,0,0.32)]

          animate-[deleteModalIn_0.18s_ease-out]
        "
      >

        {/* =================================================
            RED TOP BORDER
        ================================================== */}

        <div
          className="
            absolute
            left-0
            top-0

            w-full
            h-[3px]

            bg-[#ff3b3b]
          "
        />


        {/* =================================================
            CLOSE
        ================================================== */}

        <button
          type="button"

          disabled={loading}

          onClick={() =>
            onClose?.()
          }

          className="
            absolute
            right-[18px]
            top-[18px]

            w-[30px]
            h-[30px]

            rounded-full

            flex
            items-center
            justify-center

            text-[#8b8b8b]

            hover:bg-[#f3f4f5]
            hover:text-[#333]

            transition-colors

            disabled:opacity-40
            disabled:cursor-not-allowed
          "
        >
          <X size={18} />
        </button>


        <div
          className="
            px-[28px]
            pt-[30px]
            pb-[28px]
          "
        >

          {/* =================================================
              DELETE ICON
          ================================================== */}

          <div
            className="
              mx-auto

              w-[56px]
              h-[56px]

              rounded-full

              bg-[#ffe5e5]

              flex
              items-center
              justify-center

              text-[#ff1919]
            "
          >
            <Trash2
              size={24}
              strokeWidth={2}
            />
          </div>


          {/* =================================================
              TITLE
          ================================================== */}

          <h2
            className="
              mt-[18px]

              text-center

              text-[22px]
              font-semibold

              text-[#252525]
            "
          >
            {title}
          </h2>


          {/* =================================================
              MESSAGE
          ================================================== */}

          <div
            className="
              mt-[9px]

              text-center

              text-[16px]
              leading-[1.55]

              text-[#787878]
            "
          >

            {description ? (

              <p>
                {description}
              </p>

            ) : (

              <>
                <p>
                  Are you sure you want to delete{" "}
                  {itemName ? (
                    <span>
                      "{itemName}"
                    </span>
                  ) : (
                    "this item"
                  )}
                  ?
                </p>

                <p>
                  This action cannot be undone.
                </p>
              </>

            )}

          </div>


          {/* =================================================
              BUTTONS
          ================================================== */}

          <div
            className="
              mt-[28px]

              grid
              grid-cols-2

              gap-[14px]
            "
          >

            {/* CANCEL */}

            <button
              type="button"

              disabled={loading}

              onClick={() =>
                onClose?.()
              }

              className="
                h-[44px]

                rounded-[15px]

                border
                border-[#dedede]

                bg-white

                text-[16px]
                font-medium

                text-[#222]

                shadow-[0_2px_5px_rgba(0,0,0,0.04)]

                hover:bg-[#f8f8f8]

                transition-colors

                disabled:opacity-50
                disabled:cursor-not-allowed
              "
            >
              {cancelText}
            </button>


            {/* DELETE */}

            <button
              type="button"

              disabled={loading}

              onClick={() =>
                onConfirm?.()
              }

              className="
                h-[44px]

                rounded-[15px]

                bg-[#f5000b]

                text-white

                flex
                items-center
                justify-center
                gap-[8px]

                text-[16px]
                font-semibold

                hover:bg-[#db0009]

                transition-colors

                disabled:opacity-70
                disabled:cursor-not-allowed
              "
            >

              {loading ? (

                <>
                  <LoaderCircle
                    size={17}
                    className="
                      animate-spin
                    "
                  />

                  Deleting...
                </>

              ) : (

                confirmText

              )}

            </button>

          </div>

        </div>

      </div>


      {/* =====================================================
          ANIMATION
      ====================================================== */}

      <style>
        {`
          @keyframes deleteModalIn {
            from {
              opacity: 0;
              transform: translateY(8px) scale(0.97);
            }

            to {
              opacity: 1;
              transform: translateY(0) scale(1);
            }
          }
        `}
      </style>

    </div>

  );
};


export default DeleteConfirmModal;