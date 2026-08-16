import {
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import api from "../../api/axios";


const Hero = () => {

  /*
  |--------------------------------------------------------------------------
  | STATES
  |--------------------------------------------------------------------------
  */

  const [slides, setSlides] = useState([]);

  const [currentSlide, setCurrentSlide] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [isHovered, setIsHovered] =
    useState(false);

  /*
  |--------------------------------------------------------------------------
  | ENTIRE HERO SECTION VISIBILITY
  |--------------------------------------------------------------------------
  */

  const [heroEnabled, setHeroEnabled] =
    useState(true);


  /*
  |--------------------------------------------------------------------------
  | LOAD HERO SECTION + HERO SLIDES
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const fetchHeroData = async () => {

      try {

        setLoading(true);
        setError("");


        /*
        |--------------------------------------------------------------------------
        | LOAD BOTH APIS
        |--------------------------------------------------------------------------
        */

        const [
          sectionsResponse,
          slidesResponse,
        ] = await Promise.all([

          api.get(
            "/home/sections"
          ),

          api.get(
            "/home/hero-slides"
          ),

        ]);


        /*
        |--------------------------------------------------------------------------
        | HERO SECTION STATUS
        |--------------------------------------------------------------------------
        */

        const sections =
          sectionsResponse.data.sections || [];


        const heroSection =
          sections.find(
            (section) =>
              section.section_key === "hero"
          );


        /*
        |--------------------------------------------------------------------------
        | IF HERO EXISTS, USE DATABASE STATUS
        |--------------------------------------------------------------------------
        */

        if (heroSection) {

          const isHeroActive =
            heroSection.is_active === true ||
            heroSection.is_active === 1 ||
            heroSection.is_active === "1";


          setHeroEnabled(
            isHeroActive
          );

        } else {

          /*
          |--------------------------------------------------------------------------
          | FALLBACK
          |--------------------------------------------------------------------------
          */

          setHeroEnabled(true);

        }


        /*
        |--------------------------------------------------------------------------
        | HERO SLIDES
        |--------------------------------------------------------------------------
        */

        const data =
          slidesResponse.data.slides || [];


        /*
        |--------------------------------------------------------------------------
        | ONLY ACTIVE SLIDES
        |--------------------------------------------------------------------------
        */

        const activeSlides = data
          .filter(
            (slide) =>
              slide.is_active === true ||
              slide.is_active === 1 ||
              slide.is_active === "1"
          )
          .sort(
            (a, b) =>
              Number(a.sort_order) -
              Number(b.sort_order)
          );


        setSlides(activeSlides);

        setCurrentSlide(0);

      } catch (error) {

        console.error(
          "Hero slider error:",
          error
        );


        setError(
          error.response?.data?.message ||
          "Unable to load hero slider."
        );

      } finally {

        setLoading(false);

      }

    };


    fetchHeroData();

  }, []);


  /*
  |--------------------------------------------------------------------------
  | AUTO SLIDER
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    /*
    |--------------------------------------------------------------------------
    | DON'T RUN IF:
    |
    | Hero hidden
    | One slide only
    | User hovering
    |--------------------------------------------------------------------------
    */

    if (
      !heroEnabled ||
      slides.length <= 1 ||
      isHovered
    ) {
      return;
    }


    const interval = setInterval(
      () => {

        setCurrentSlide(
          (prev) =>
            (prev + 1) %
            slides.length
        );

      },
      4000
    );


    return () => {
      clearInterval(interval);
    };

  }, [
    slides.length,
    isHovered,
    heroEnabled,
  ]);


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  if (loading) {

    return (
      <section className="w-full">

        <div
          className="
            max-w-[1280px]
            mx-auto
            px-5
            pt-[22px]
          "
        >

          <div
            className="
              w-full
              h-[300px]
              rounded-[16px]
              bg-[#f3f4f6]
              animate-pulse
            "
          />

        </div>

      </section>
    );

  }


  /*
  |--------------------------------------------------------------------------
  | HERO SECTION DISABLED FROM ADMIN
  |--------------------------------------------------------------------------
  */

  if (!heroEnabled) {

    return null;

  }


  /*
  |--------------------------------------------------------------------------
  | ERROR / NO ACTIVE SLIDES
  |--------------------------------------------------------------------------
  */

  if (
    error ||
    slides.length === 0
  ) {

    return null;

  }


  /*
  |--------------------------------------------------------------------------
  | FRONTEND HERO
  |--------------------------------------------------------------------------
  */

  return (
    <section className="w-full">

      <div
        className="
          max-w-[1280px]
          mx-auto
          px-5
          pt-[22px]
        "
      >

        {/* =====================================================
            HERO SLIDER
        ====================================================== */}

        <div
          className="
            relative
            w-full
            h-[300px]
            rounded-[16px]
            overflow-hidden
            bg-[#f4f4f4]
          "
          onMouseEnter={() =>
            setIsHovered(true)
          }
          onMouseLeave={() =>
            setIsHovered(false)
          }
        >

          {/* =================================================
              SLIDES
          ================================================== */}

          {slides.map(
            (slide, index) => {

              const isActive =
                index === currentSlide;


              return (
                <div
                  key={slide.id}
                  className={`
                    absolute
                    inset-0

                    transition-all
                    duration-700
                    ease-in-out

                    ${
                      isActive
                        ? "opacity-100 translate-x-0 z-10"
                        : "opacity-0 translate-x-[20px] z-0 pointer-events-none"
                    }
                  `}
                >

                  <SlideLink
                    link={slide.link}
                    className="
                      block
                      w-full
                      h-full
                    "
                  >

                    <img
                      src={slide.image_url}
                      alt={
                        slide.image_alt ||
                        `Hero slide ${index + 1}`
                      }
                      className="
                        w-full
                        h-full
                        object-cover
                        object-center
                      "
                    />

                  </SlideLink>

                </div>
              );

            }
          )}


          {/* =================================================
              DOT NAVIGATION
          ================================================== */}

          {slides.length > 1 && (

            <div
              className="
                absolute
                right-[18px]
                bottom-[16px]
                z-30

                flex
                items-center
                gap-[6px]

                px-[8px]
                py-[6px]

                rounded-full
              "
            >

              {slides.map(
                (slide, index) => {

                  const isActive =
                    currentSlide === index;


                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() =>
                        setCurrentSlide(index)
                      }
                      aria-label={
                        `Go to slide ${index + 1}`
                      }
                      className={`
                        h-[6px]
                        rounded-full

                        transition-all
                        duration-300

                        ${
                          isActive
                            ? "w-[22px] bg-[#202020]"
                            : "w-[6px] bg-[#a8a8a8] hover:bg-[#777777]"
                        }
                      `}
                    />
                  );

                }
              )}

            </div>

          )}

        </div>

      </div>

    </section>
  );
};


/* ==========================================================================
   SLIDE LINK
============================================================================ */

const SlideLink = ({
  link,
  children,
  className = "",
}) => {

  /*
  |--------------------------------------------------------------------------
  | NO LINK
  |--------------------------------------------------------------------------
  */

  if (!link) {

    return (
      <div className={className}>
        {children}
      </div>
    );

  }


  /*
  |--------------------------------------------------------------------------
  | EXTERNAL LINK
  |--------------------------------------------------------------------------
  */

  const isExternal =
    link.startsWith("http://") ||
    link.startsWith("https://");


  if (isExternal) {

    return (
      <a
        href={link}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {children}
      </a>
    );

  }


  /*
  |--------------------------------------------------------------------------
  | INTERNAL REACT ROUTER LINK
  |--------------------------------------------------------------------------
  */

  return (
    <Link
      to={link}
      className={className}
    >
      {children}
    </Link>
  );
};


export default Hero;