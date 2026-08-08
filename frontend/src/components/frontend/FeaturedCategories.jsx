import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  LoaderCircle,
} from "lucide-react";

import {
  Link,
} from "react-router-dom";

import api from "../../api/axios";


const FeaturedCategories = () => {

  /*
  |--------------------------------------------------------------------------
  | STATES
  |--------------------------------------------------------------------------
  */

  const [
    section,
    setSection,
  ] = useState(null);


  const [
    categories,
    setCategories,
  ] = useState([]);


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
  | SCROLL REF
  |--------------------------------------------------------------------------
  */

  const scrollRef =
    useRef(null);


  /*
  |--------------------------------------------------------------------------
  | LOAD FEATURED CATEGORIES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const fetchCategories =
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await api.get(
              "/home/featured-categories"
            );


          setSection(
            response.data
              ?.section ||
            null
          );


          setCategories(
            response.data
              ?.categories ||
            []
          );

        } catch (error) {

          console.error(
            "Featured categories error:",
            error
          );


          setError(
            error.response?.data
              ?.message ||
            "Unable to load categories."
          );

        } finally {

          setLoading(false);

        }

      };


    fetchCategories();

  }, []);


  /*
  |--------------------------------------------------------------------------
  | SCROLL
  |--------------------------------------------------------------------------
  */

  const handleScroll = (
    direction
  ) => {

    if (
      !scrollRef.current
    ) {
      return;
    }


    scrollRef.current.scrollBy({
      left:
        direction === "left"
          ? -350
          : 350,

      behavior:
        "smooth",
    });

  };


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {

    return (

      <section
        className="
          w-full

          mt-[48px]
        "
      >

        <div
          className="
            max-w-[1280px]
            mx-auto
            px-5
          "
        >

          <div
            className="
              w-[220px]
              h-[28px]

              rounded-[7px]

              bg-[#eeeeef]

              animate-pulse
            "
          />


          <div
            className="
              mt-[24px]

              grid
              grid-cols-4
              md:grid-cols-6
              xl:grid-cols-8

              gap-[30px]
            "
          >

            {Array.from({
              length: 8,
            }).map(
              (_, index) => (

                <div
                  key={index}

                  className="
                    flex
                    flex-col
                    items-center
                  "
                >

                  <div
                    className="
                      w-[90px]
                      h-[90px]

                      rounded-[16px]

                      bg-[#f2f2f3]

                      animate-pulse
                    "
                  />


                  <div
                    className="
                      mt-[12px]

                      w-[72px]
                      h-[13px]

                      rounded

                      bg-[#eeeeef]

                      animate-pulse
                    "
                  />

                </div>

              )
            )}

          </div>

        </div>

      </section>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | HIDDEN / EMPTY / ERROR
  |--------------------------------------------------------------------------
  */

  if (
    error ||
    !section ||
    section.is_active === false ||
    categories.length === 0
  ) {

    return null;

  }


  /*
  |--------------------------------------------------------------------------
  | UI
  |--------------------------------------------------------------------------
  */

  return (

    <section
      className="
        w-full

        mt-[48px]
      "
    >

      <div
        className="
          max-w-[1280px]
          mx-auto
          px-5
        "
      >

        {/* =====================================================
            TITLE
        ====================================================== */}

        <h2
          className="
            text-[24px]
            leading-[1.2]

            font-bold

            tracking-[-0.5px]

            text-[#111]
          "
        >
          {section.title ||
            "Featured Categories"}
        </h2>


        {/* =====================================================
            CATEGORY AREA
        ====================================================== */}

        <div
          className="
            relative

            mt-[22px]
          "
        >

          {/* =================================================
              CATEGORIES
          ================================================== */}

          <div
            ref={
              scrollRef
            }

            className="
              flex
              items-start

              gap-[46px]

              overflow-x-auto

              scroll-smooth

              pb-[10px]

              [scrollbar-width:none]

              [&::-webkit-scrollbar]:hidden
            "
          >

            {categories.map(
              (category) => (

                <CategoryItem
                  key={
                    category.id
                  }

                  category={
                    category
                  }
                />

              )
            )}

          </div>


          {/* =================================================
              DESKTOP SCROLL BUTTONS
          ================================================== */}

          {categories.length > 8 && (

            <div
              className="
                mt-[20px]

                hidden
                md:flex

                items-center
                justify-end

                gap-[8px]
              "
            >

              <button
                type="button"

                onClick={() =>
                  handleScroll(
                    "left"
                  )
                }

                className="
                  w-[34px]
                  h-[34px]

                  rounded-full

                  border
                  border-[#e5e5e5]

                  bg-white

                  flex
                  items-center
                  justify-center

                  text-[#777]

                  hover:bg-[#f7f7f7]
                  hover:text-[#111]

                  transition-colors
                "
              >

                <ChevronLeft
                  size={16}
                />

              </button>


              <button
                type="button"

                onClick={() =>
                  handleScroll(
                    "right"
                  )
                }

                className="
                  w-[34px]
                  h-[34px]

                  rounded-full

                  border
                  border-[#e5e5e5]

                  bg-white

                  flex
                  items-center
                  justify-center

                  text-[#777]

                  hover:bg-[#f7f7f7]
                  hover:text-[#111]

                  transition-colors
                "
              >

                <ChevronRight
                  size={16}
                />

              </button>

            </div>

          )}

        </div>

      </div>

    </section>

  );

};


/* ==========================================================================
   CATEGORY ITEM
============================================================================ */

const CategoryItem = ({
  category,
}) => {

  return (

    <Link
      to={
        `/products?category=${encodeURIComponent(
          category.slug
        )}`
      }

      className="
        group

        w-[115px]

        shrink-0

        flex
        flex-col
        items-center

        text-center
      "
    >

      {/* =====================================================
          IMAGE
      ====================================================== */}

      <div
        className="
          w-[105px]
          h-[105px]

          flex
          items-center
          justify-center
        "
      >

        {category.image_url ? (

          <img
            src={
              category.image_url
            }

            alt={
              category.name
            }

            loading="lazy"

            className="
              max-w-full
              max-h-full

              w-auto
              h-auto

              object-contain

              transition-transform
              duration-300

              group-hover:scale-[1.06]
            "
          />

        ) : (

          <div
            className="
              w-[78px]
              h-[78px]

              rounded-[14px]

              bg-[#f4f5f6]

              flex
              items-center
              justify-center

              text-[#aaa]
            "
          >

            <ImageIcon
              size={24}
            />

          </div>

        )}

      </div>


      {/* =====================================================
          NAME
      ====================================================== */}

      <p
        className="
          mt-[8px]

          w-full

          truncate

          text-[14px]
          font-semibold

          text-[#171717]

          transition-colors

          group-hover:text-[#2065D1]
        "
      >
        {category.name}
      </p>

    </Link>

  );

};


export default FeaturedCategories;