import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  LoaderCircle,
  Save,
  Eye,
  EyeOff,
} from "lucide-react";

import api from "../../../../api/axios";


/* ==========================================================================
   HERO SLIDER EDITOR
============================================================================ */

const HeroSliderEditor = ({
  onBack,
}) => {

  /*
  |--------------------------------------------------------------------------
  | REFS
  |--------------------------------------------------------------------------
  */

  const addSlideInputRef =
    useRef(null);


  /*
  |--------------------------------------------------------------------------
  | STATES
  |--------------------------------------------------------------------------
  */

  const [
    slides,
    setSlides,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    addingSlide,
    setAddingSlide,
  ] = useState(false);


  const [
    savingAll,
    setSavingAll,
  ] = useState(false);


  const [
    message,
    setMessage,
  ] = useState("");


  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");


  /* ==========================================================================
     LOAD SLIDES
  ============================================================================ */

  const fetchSlides =
    async () => {

      try {

        setLoading(true);

        setErrorMessage("");


        const response =
          await api.get(
            "/admin/hero-slides"
          );


        const apiSlides =
          response.data.slides ||
          [];


        setSlides(
          apiSlides.map(
            (slide) => ({

              ...slide,

              image_alt:
                slide.image_alt ||
                "",

              link:
                slide.link ||
                "",

              saving:
                false,

              deleting:
                false,

              toggling:
                false,

            })
          )
        );

      } catch (error) {

        console.error(
          "Hero slides error:",
          error
        );


        setErrorMessage(
          error.response?.data
            ?.message ||
          "Unable to load hero slides."
        );

      } finally {

        setLoading(false);

      }

    };


  /* ==========================================================================
     INITIAL LOAD
  ============================================================================ */

  useEffect(() => {

    fetchSlides();

  }, []);


  /* ==========================================================================
     LOCAL INPUT CHANGE
  ============================================================================ */

  const handleSlideChange = (
    id,
    field,
    value
  ) => {

    setSlides(
      (previous) =>
        previous.map(
          (slide) =>

            Number(slide.id) ===
            Number(id)

              ? {
                  ...slide,

                  [field]:
                    value,
                }

              : slide
        )
    );

  };


  /* ==========================================================================
     ADD SLIDE BUTTON
  ============================================================================ */

  const handleAddSlideClick =
    () => {

      addSlideInputRef
        .current
        ?.click();

    };


  /* ==========================================================================
     ADD NEW SLIDE
  ============================================================================ */

  const handleAddSlide =
    async (
      event
    ) => {

      const file =
        event.target
          .files?.[0];


      if (!file) {

        return;

      }


      try {

        setAddingSlide(true);

        setErrorMessage("");

        setMessage("");


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


        formData.append(
          "image_alt",
          ""
        );


        formData.append(
          "link",
          ""
        );


        formData.append(
          "is_active",
          "1"
        );


        /*
        |--------------------------------------------------------------------------
        | CREATE
        |--------------------------------------------------------------------------
        */

        await api.post(
          "/admin/hero-slides",
          formData,
          {
            headers: {

              "Content-Type":
                "multipart/form-data",

            },
          }
        );


        setMessage(
          "New slide added successfully."
        );


        /*
        |--------------------------------------------------------------------------
        | REFRESH
        |--------------------------------------------------------------------------
        */

        await fetchSlides();

      } catch (error) {

        console.error(
          "Add hero slide error:",
          error
        );


        if (
          error.response
            ?.status === 422
        ) {

          const errors =
            error.response
              .data
              .errors;


          setErrorMessage(
            errors?.image?.[0] ||
            "Please select a valid image."
          );

        } else {

          setErrorMessage(
            error.response?.data
              ?.message ||
            "Unable to add slide."
          );

        }

      } finally {

        setAddingSlide(false);


        event.target.value =
          "";

      }

    };


  /* ==========================================================================
     UPDATE SINGLE SLIDE
  ============================================================================ */

  const updateSlide =
    async (
      slide,
      imageFile = null
    ) => {

      /*
      |--------------------------------------------------------------------------
      | SAVING STATE
      |--------------------------------------------------------------------------
      */

      setSlides(
        (previous) =>
          previous.map(
            (item) =>

              Number(item.id) ===
              Number(slide.id)

                ? {
                    ...item,

                    saving:
                      true,
                  }

                : item
          )
      );


      try {

        /*
        |--------------------------------------------------------------------------
        | FORM DATA
        |--------------------------------------------------------------------------
        */

        const formData =
          new FormData();


        formData.append(
          "image_alt",
          slide.image_alt ||
          ""
        );


        formData.append(
          "link",
          slide.link ||
          ""
        );


        formData.append(
          "sort_order",
          slide.sort_order
        );


        formData.append(
          "is_active",
          slide.is_active
            ? "1"
            : "0"
        );


        if (imageFile) {

          formData.append(
            "image",
            imageFile
          );

        }


        /*
        |--------------------------------------------------------------------------
        | UPDATE API
        |--------------------------------------------------------------------------
        */

        const response =
          await api.post(
            `/admin/hero-slides/${slide.id}/update`,
            formData,
            {
              headers: {

                "Content-Type":
                  "multipart/form-data",

              },
            }
          );


        const updatedSlide =
          response.data.slide;


        /*
        |--------------------------------------------------------------------------
        | UPDATE LOCAL STATE
        |--------------------------------------------------------------------------
        */

        setSlides(
          (previous) =>
            previous.map(
              (item) =>

                Number(item.id) ===
                Number(slide.id)

                  ? {
                      ...item,

                      ...updatedSlide,

                      saving:
                        false,

                      deleting:
                        item.deleting ||
                        false,

                      toggling:
                        item.toggling ||
                        false,
                    }

                  : item
            )
        );


        return true;

      } catch (error) {

        console.error(
          "Update hero slide error:",
          error
        );


        setErrorMessage(
          error.response?.data
            ?.message ||
          "Unable to save slide."
        );


        setSlides(
          (previous) =>
            previous.map(
              (item) =>

                Number(item.id) ===
                Number(slide.id)

                  ? {
                      ...item,

                      saving:
                        false,
                    }

                  : item
            )
        );


        return false;

      }

    };


  /* ==========================================================================
     SAVE ALL SLIDES
  ============================================================================ */

  const handleSaveAll =
    async () => {

      if (savingAll) {

        return;

      }


      if (
        slides.length === 0
      ) {

        return;

      }


      setSavingAll(true);

      setMessage("");

      setErrorMessage("");


      try {

        let allSuccessful =
          true;


        for (
          const slide
          of slides
        ) {

          const success =
            await updateSlide(
              slide
            );


          if (!success) {

            allSuccessful =
              false;

            break;

          }

        }


        if (allSuccessful) {

          setMessage(
            "Hero slider saved successfully."
          );

        }

      } finally {

        setSavingAll(false);

      }

    };


  /* ==========================================================================
     REPLACE IMAGE
  ============================================================================ */

  const handleReplaceImage =
    async (
      slide,
      file
    ) => {

      if (!file) {

        return;

      }


      setMessage("");

      setErrorMessage("");


      const success =
        await updateSlide(
          slide,
          file
        );


      if (success) {

        setMessage(
          "Cover image updated successfully."
        );

      }

    };


  /* ==========================================================================
     DELETE SLIDE
  ============================================================================ */

  const handleDelete =
    async (
      slide
    ) => {

      const confirmDelete =
        window.confirm(
          `Delete Slide ${slide.sort_order}?`
        );


      if (!confirmDelete) {

        return;

      }


      /*
      |--------------------------------------------------------------------------
      | DELETE LOADING
      |--------------------------------------------------------------------------
      */

      setSlides(
        (previous) =>
          previous.map(
            (item) =>

              Number(item.id) ===
              Number(slide.id)

                ? {
                    ...item,

                    deleting:
                      true,
                  }

                : item
          )
      );


      try {

        /*
        |--------------------------------------------------------------------------
        | DELETE API
        |--------------------------------------------------------------------------
        */

        await api.delete(
          `/admin/hero-slides/${slide.id}`
        );


        /*
        |--------------------------------------------------------------------------
        | REMOVE FROM UI
        |--------------------------------------------------------------------------
        */

        setSlides(
          (previous) =>
            previous.filter(
              (item) =>
                Number(item.id) !==
                Number(slide.id)
            )
        );


        setMessage(
          "Slide deleted successfully."
        );


        setErrorMessage("");

      } catch (error) {

        console.error(
          "Delete hero slide error:",
          error
        );


        setErrorMessage(
          error.response?.data
            ?.message ||
          "Unable to delete slide."
        );


        setSlides(
          (previous) =>
            previous.map(
              (item) =>

                Number(item.id) ===
                Number(slide.id)

                  ? {
                      ...item,

                      deleting:
                        false,
                    }

                  : item
            )
        );

      }

    };


  /* ==========================================================================
     SLIDE VISIBILITY
  ============================================================================ */

  const handleToggle =
    async (
      slide
    ) => {

      /*
      |--------------------------------------------------------------------------
      | TOGGLE LOADING
      |--------------------------------------------------------------------------
      */

      setSlides(
        (previous) =>
          previous.map(
            (item) =>

              Number(item.id) ===
              Number(slide.id)

                ? {
                    ...item,

                    toggling:
                      true,
                  }

                : item
          )
      );


      try {

        /*
        |--------------------------------------------------------------------------
        | TOGGLE API
        |--------------------------------------------------------------------------
        */

        const response =
          await api.post(
            `/admin/hero-slides/${slide.id}/toggle`
          );


        /*
        |--------------------------------------------------------------------------
        | UPDATE LOCAL STATE
        |--------------------------------------------------------------------------
        */

        setSlides(
          (previous) =>
            previous.map(
              (item) =>

                Number(item.id) ===
                Number(slide.id)

                  ? {
                      ...item,

                      is_active:
                        response.data
                          .is_active,

                      toggling:
                        false,
                    }

                  : item
            )
        );

      } catch (error) {

        console.error(
          "Toggle hero slide error:",
          error
        );


        setErrorMessage(
          error.response?.data
            ?.message ||
          "Unable to change slide visibility."
        );


        setSlides(
          (previous) =>
            previous.map(
              (item) =>

                Number(item.id) ===
                Number(slide.id)

                  ? {
                      ...item,

                      toggling:
                        false,
                    }

                  : item
            )
        );

      }

    };


  /* ==========================================================================
     UI
  ============================================================================ */

  return (

    <div
      className="
        min-h-[calc(100vh-74px)]

        bg-[#f6f7f8]

        px-6
        py-5
      "
    >

      <div
        className="
          max-w-[1125px]
          mx-auto
        "
      >

        {/* =====================================================
            HEADER
        ====================================================== */}

        <div
          className="
            bg-white

            border
            border-[#e4e5e8]

            rounded-[15px]

            px-[18px]
            py-[15px]

            flex
            items-center
            justify-between

            gap-4
          "
        >

          <div
            className="
              flex
              items-center

              gap-3
            "
          >

            {/* BACK */}

            <button
              type="button"

              onClick={
                onBack
              }

              className="
                w-[36px]
                h-[36px]

                rounded-[9px]

                border
                border-[#e2e3e6]

                bg-white

                flex
                items-center
                justify-center

                text-[#555]

                hover:bg-[#f6f6f7]

                transition-colors
              "
            >

              <ArrowLeft
                size={17}
              />

            </button>


            <div>

              <h1
                className="
                  text-[20px]
                  font-bold

                  text-[#111]
                "
              >
                Hero Slider
              </h1>


              <p
                className="
                  mt-[2px]

                  text-[12px]

                  text-[#777]
                "
              >
                Manage homepage hero slides
              </p>

            </div>

          </div>


          {/* SAVE */}

          <button
            type="button"

            onClick={
              handleSaveAll
            }

            disabled={
              savingAll ||
              loading ||
              slides.length === 0
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

              gap-2

              text-[13px]
              font-semibold

              hover:bg-[#1858bb]

              transition-colors

              disabled:opacity-60
              disabled:cursor-not-allowed
            "
          >

            {savingAll ? (

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


            {savingAll
              ? "Saving..."
              : "Save changes"}

          </button>

        </div>


        {/* =====================================================
            SUCCESS MESSAGE
        ====================================================== */}

        {message && (

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
            {message}
          </div>

        )}


        {/* =====================================================
            ERROR MESSAGE
        ====================================================== */}

        {errorMessage && (

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
            {errorMessage}
          </div>

        )}


        {/* =====================================================
            HERO SLIDES CARD
        ====================================================== */}

        <div
          className="
            mt-4

            bg-white

            border
            border-[#e1e2e5]

            rounded-[14px]

            px-[15px]
            pt-[12px]
            pb-[16px]
          "
        >

          {/* =================================================
              SECTION HEADER
          ================================================== */}

          <div
            className="
              flex
              items-center
              justify-between

              gap-4

              mb-[12px]
            "
          >

            <p
              className="
                text-[11px]
                font-semibold

                tracking-[0.2em]
                uppercase

                text-[#656a72]
              "
            >
              Hero Slides
            </p>


            <div
              className="
                flex
                items-center
              "
            >

              <button
                type="button"

                onClick={
                  handleAddSlideClick
                }

                disabled={
                  addingSlide
                }

                className="
                  h-[34px]
                  px-[13px]

                  rounded-[7px]

                  border
                  border-[#dedfe3]

                  bg-white

                  flex
                  items-center

                  gap-[7px]

                  text-[13px]
                  font-medium

                  text-[#222]

                  hover:bg-[#f8f8f9]

                  transition-colors

                  disabled:opacity-60
                  disabled:cursor-not-allowed
                "
              >

                {addingSlide ? (

                  <LoaderCircle
                    size={15}

                    className="
                      animate-spin
                    "
                  />

                ) : (

                  <Plus
                    size={16}
                  />

                )}


                {addingSlide
                  ? "Adding..."
                  : "Add slide"}

              </button>


              <input
                ref={
                  addSlideInputRef
                }

                type="file"

                accept="
                  image/png,
                  image/jpeg,
                  image/webp
                "

                onChange={
                  handleAddSlide
                }

                className="
                  hidden
                "
              />

            </div>

          </div>


          {/* =================================================
              LOADING
          ================================================== */}

          {loading && (

            <div
              className="
                min-h-[250px]

                flex
                flex-col
                items-center
                justify-center

                text-[#777]
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
                "
              >
                Loading hero slides...
              </p>

            </div>

          )}


          {/* =================================================
              EMPTY STATE
          ================================================== */}

          {!loading &&
            slides.length === 0 && (

              <div
                className="
                  min-h-[250px]

                  border
                  border-dashed
                  border-[#d9dce2]

                  rounded-[12px]

                  flex
                  flex-col
                  items-center
                  justify-center
                "
              >

                <div
                  className="
                    w-[48px]
                    h-[48px]

                    rounded-full

                    bg-[#f0f4fc]
                    text-[#2065D1]

                    flex
                    items-center
                    justify-center
                  "
                >

                  <ImageIcon
                    size={21}
                  />

                </div>


                <h3
                  className="
                    mt-4

                    text-[15px]
                    font-semibold

                    text-[#222]
                  "
                >
                  No hero slides yet
                </h3>


                <p
                  className="
                    mt-1

                    text-[12px]

                    text-[#777]
                  "
                >
                  Add your first homepage cover image.
                </p>


                <button
                  type="button"

                  onClick={
                    handleAddSlideClick
                  }

                  className="
                    mt-4

                    h-[36px]
                    px-[15px]

                    rounded-[8px]

                    bg-[#2065D1]
                    text-white

                    text-[13px]
                    font-medium
                  "
                >
                  Add slide
                </button>

              </div>

            )}


          {/* =================================================
              SLIDES GRID
          ================================================== */}

          {!loading &&
            slides.length > 0 && (

              <div
                className="
                  grid
                  grid-cols-1
                  xl:grid-cols-2

                  gap-[12px]
                "
              >

                {slides.map(
                  (
                    slide,
                    index
                  ) => (

                    <HeroSlideCard
                      key={
                        slide.id
                      }

                      slide={
                        slide
                      }

                      slideNumber={
                        index + 1
                      }

                      onChange={
                        handleSlideChange
                      }

                      onDelete={
                        handleDelete
                      }

                      onToggle={
                        handleToggle
                      }

                      onReplaceImage={
                        handleReplaceImage
                      }
                    />

                  )
                )}

              </div>

            )}

        </div>

      </div>

    </div>

  );

};


/* ==========================================================================
   HERO SLIDE CARD
============================================================================ */

const HeroSlideCard = ({
  slide,
  slideNumber,

  onChange,
  onDelete,
  onToggle,
  onReplaceImage,
}) => {

  /*
  |--------------------------------------------------------------------------
  | IMAGE INPUT
  |--------------------------------------------------------------------------
  */

  const imageInputRef =
    useRef(null);


  return (

    <div
      className={`
        rounded-[14px]

        border

        bg-white

        px-[12px]
        pt-[13px]
        pb-[12px]

        transition-all

        ${
          slide.is_active

            ? `
              border-[#e0e1e4]
              opacity-100
            `

            : `
              border-[#e3e3e3]
              opacity-60
            `
        }
      `}
    >

      {/* =====================================================
          CARD HEADER
      ====================================================== */}

      <div
        className="
          flex
          items-center
          justify-between

          gap-4
        "
      >

        <span
          className="
            inline-flex
            items-center

            min-h-[22px]

            px-[10px]

            rounded-full

            bg-[#8954f5]
            text-white

            text-[11px]
            font-semibold
          "
        >
          Slide {slideNumber}
        </span>


        <div
          className="
            flex
            items-center

            gap-1
          "
        >

          {/* =================================================
              VISIBILITY
          ================================================== */}

          <button
            type="button"

            onClick={() =>
              onToggle(
                slide
              )
            }

            disabled={
              slide.toggling ||
              slide.deleting
            }

            title={
              slide.is_active
                ? "Hide slide"
                : "Show slide"
            }

            className="
              w-[30px]
              h-[30px]

              rounded-full

              flex
              items-center
              justify-center

              text-[#7b7d82]

              hover:bg-[#f4f4f5]
              hover:text-[#2065D1]

              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >

            {slide.toggling ? (

              <LoaderCircle
                size={15}

                className="
                  animate-spin
                "
              />

            ) : slide.is_active ? (

              <Eye
                size={16}
              />

            ) : (

              <EyeOff
                size={16}
              />

            )}

          </button>


          {/* =================================================
              DELETE
          ================================================== */}

          <button
            type="button"

            onClick={() =>
              onDelete(
                slide
              )
            }

            disabled={
              slide.deleting ||
              slide.saving
            }

            title="Delete slide"

            className="
              w-[30px]
              h-[30px]

              rounded-full

              flex
              items-center
              justify-center

              text-[#777]

              hover:bg-red-50
              hover:text-red-500

              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >

            {slide.deleting ? (

              <LoaderCircle
                size={15}

                className="
                  animate-spin
                "
              />

            ) : (

              <Trash2
                size={15}
              />

            )}

          </button>

        </div>

      </div>


      {/* =====================================================
          COVER IMAGE LABEL
      ====================================================== */}

      <div
        className="
          mt-[16px]
          mb-[8px]

          flex
          items-center
          justify-between

          gap-3
        "
      >

        <label
          className="
            text-[13px]
            font-medium

            text-[#111]
          "
        >
          Cover image
        </label>


        <button
          type="button"

          className="
            h-[30px]
            px-[10px]

            rounded-[7px]

            bg-gradient-to-r
            from-[#ff55c4]
            via-[#aa64ff]
            to-[#39d7e7]

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


      {/* =====================================================
          IMAGE PREVIEW
      ====================================================== */}

      <div
        className="
          relative

          w-full
          h-[115px]

          rounded-[12px]

          overflow-hidden

          border
          border-[#e2e3e5]

          bg-[#f5f5f6]
        "
      >

        {slide.image_url ? (

          <img
            src={
              slide.image_url
            }

            alt={
              slide.image_alt ||
              `Hero slide ${slideNumber}`
            }

            className="
              w-full
              h-full

              object-cover
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

              text-[#999]
            "
          >

            <ImageIcon
              size={24}
            />

          </div>

        )}


        {/* REPLACE IMAGE */}

        <button
          type="button"

          onClick={() =>
            imageInputRef
              .current
              ?.click()
          }

          disabled={
            slide.saving ||
            slide.deleting
          }

          title="Replace cover image"

          className="
            absolute

            right-[7px]
            bottom-[7px]

            w-[27px]
            h-[27px]

            rounded-[5px]

            border
            border-[#d7d8db]

            bg-white/95

            flex
            items-center
            justify-center

            text-[#333]

            hover:text-[#2065D1]

            transition-colors

            disabled:opacity-60
            disabled:cursor-not-allowed
          "
        >

          {slide.saving ? (

            <LoaderCircle
              size={14}

              className="
                animate-spin
              "
            />

          ) : (

            <ImageIcon
              size={14}
            />

          )}

        </button>


        <input
          ref={
            imageInputRef
          }

          type="file"

          accept="
            image/png,
            image/jpeg,
            image/webp
          "

          className="
            hidden
          "

          onChange={(event) => {

            const file =
              event.target
                .files?.[0];


            if (file) {

              onReplaceImage(
                slide,
                file
              );

            }


            event.target.value =
              "";

          }}
        />

      </div>


      {/* =====================================================
          IMAGE ALT
      ====================================================== */}

      <input
        type="text"

        value={
          slide.image_alt
        }

        onChange={(event) =>
          onChange(
            slide.id,
            "image_alt",
            event.target.value
          )
        }

        placeholder="Image alt"

        className="
          mt-[12px]

          w-full
          h-[36px]

          rounded-full

          border
          border-[#dedfe2]

          bg-white

          px-[13px]

          text-[13px]
          text-[#333]

          outline-none

          placeholder:text-[#858585]

          focus:border-[#2065D1]
          focus:ring-[2px]
          focus:ring-[#2065D1]/10

          transition-all
        "
      />


      {/* =====================================================
          SLIDE LINK
      ====================================================== */}

      <input
        type="text"

        value={
          slide.link
        }

        onChange={(event) =>
          onChange(
            slide.id,
            "link",
            event.target.value
          )
        }

        placeholder="/products/example-product"

        className="
          mt-[10px]

          w-full
          h-[36px]

          rounded-full

          border
          border-[#dedfe2]

          bg-white

          px-[13px]

          text-[13px]
          text-[#222]

          outline-none

          placeholder:text-[#858585]

          focus:border-[#2065D1]
          focus:ring-[2px]
          focus:ring-[#2065D1]/10

          transition-all
        "
      />

    </div>

  );

};


export default HeroSliderEditor;