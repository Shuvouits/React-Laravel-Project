import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import api from "../../../api/axios";

import ProductCard from "./ProductCard";

import ProductQuickViewModal from "./ProductQuickViewModal";


const ProductsOnSale = () => {

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
    products,
    setProducts,
  ] = useState([]);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    error,
    setError,
  ] = useState("");


  const [
    quickViewProduct,
    setQuickViewProduct,
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | SLIDER
  |--------------------------------------------------------------------------
  */

  const sliderRef =
    useRef(null);


  /*
  |--------------------------------------------------------------------------
  | LOAD
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const fetchProducts =
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await api.get(
              "/home/products-on-sale"
            );


          setSection(
            response.data
              ?.section ||
            null
          );


          setProducts(
            response.data
              ?.products ||
            []
          );

        } catch (error) {

          console.error(
            "Products on Sale error:",
            error
          );


          setError(
            error.response?.data
              ?.message ||
            "Unable to load products."
          );

        } finally {

          setLoading(false);

        }

      };


    fetchProducts();

  }, []);


  /*
  |--------------------------------------------------------------------------
  | SCROLL
  |--------------------------------------------------------------------------
  */

  const scrollSlider = (
    direction
  ) => {

    if (!sliderRef.current) {
      return;
    }


    const amount =
      sliderRef.current
        .clientWidth *
      0.9;


    sliderRef.current.scrollBy({

      left:
        direction === "right"
          ? amount
          : -amount,

      behavior:
        "smooth",

    });

  };


  /*
  |--------------------------------------------------------------------------
  | QUICK VIEW
  |--------------------------------------------------------------------------
  */

  const openQuickView = (
    product
  ) => {

    setQuickViewProduct(
      product
    );

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
          mt-[55px]
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
              flex
              justify-center

              py-[70px]
            "
          >

            <LoaderCircle
              size={28}

              className="
                animate-spin

                text-[#2065D1]
              "
            />

          </div>

        </div>

      </section>

    );

  }


  /*
  |--------------------------------------------------------------------------
  | HIDDEN
  |--------------------------------------------------------------------------
  */

  if (
    error ||
    !section ||
    section.is_active === false ||
    products.length === 0
  ) {

    return null;

  }


  /*
  |--------------------------------------------------------------------------
  | SETTINGS
  |--------------------------------------------------------------------------
  */

  const desktopCards =
    Math.min(
      Math.max(
        Number(
          section.settings
            ?.desktop_cards_per_row ||
          4
        ),
        2
      ),
      6
    );


  const desktopGap =
    16;


  const cardWidth =
    `calc((100% - ${
      (
        desktopCards -
        1
      ) *
      desktopGap
    }px) / ${desktopCards})`;


  return (

    <>

      <section
        className="
          mt-[55px]

          w-full
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
              HEADER
          ====================================================== */}

          <div
            className="
              flex
              items-end
              justify-between

              gap-4
            "
          >

            <div>

              <h2
                className="
                  text-[27px]
                  leading-[1.2]

                  font-bold

                  tracking-[-0.6px]

                  text-[#171717]
                "
              >
                {section.title ||
                  "Product on Sale"}
              </h2>


              {section.settings
                ?.subtitle && (

                <p
                  className="
                    mt-[6px]

                    text-[13px]
                    text-[#777]
                  "
                >
                  {
                    section.settings
                      .subtitle
                  }
                </p>

              )}

            </div>


            {/* SLIDER BUTTONS */}

            <div
              className="
                flex
                items-center

                gap-[7px]
              "
            >

              <button
                type="button"

                onClick={() =>
                  scrollSlider(
                    "left"
                  )
                }

                className="
                  w-[36px]
                  h-[36px]

                  rounded-full

                  border
                  border-[#e6e6e6]

                  bg-white

                  flex
                  items-center
                  justify-center

                  text-[#777]

                  hover:bg-[#f7f7f7]
                  hover:text-[#111]
                "
              >

                <ChevronLeft
                  size={18}
                />

              </button>


              <button
                type="button"

                onClick={() =>
                  scrollSlider(
                    "right"
                  )
                }

                className="
                  w-[36px]
                  h-[36px]

                  rounded-full

                  border
                  border-[#e6e6e6]

                  bg-white

                  flex
                  items-center
                  justify-center

                  text-[#777]

                  hover:bg-[#f7f7f7]
                  hover:text-[#111]
                "
              >

                <ChevronRight
                  size={18}
                />

              </button>

            </div>

          </div>


          {/* =====================================================
              PRODUCTS
          ====================================================== */}

          <div
            ref={
              sliderRef
            }

            style={{
              "--desktop-product-width":
                cardWidth,
            }}

            className="
              mt-[27px]

              flex
              items-start

              gap-[16px]

              overflow-x-auto

              scroll-smooth

              snap-x
              snap-mandatory

              pb-[10px]

              [scrollbar-width:none]

              [&::-webkit-scrollbar]:hidden
            "
          >

            {products.map(
              (product) => (

                <div
                  key={
                    product.id
                  }

                  className="
                    shrink-0

                    basis-[82%]
                    sm:basis-[47%]
                    md:basis-[31%]
                    lg:basis-[var(--desktop-product-width)]

                    snap-start
                  "
                >

                  <ProductCard
                    product={
                      product
                    }

                    onQuickView={
                      openQuickView
                    }

                    onChooseOptions={
                      openQuickView
                    }
                  />

                </div>

              )
            )}

          </div>

        </div>

      </section>


      {/* =====================================================
          REUSABLE QUICK VIEW MODAL
      ====================================================== */}

      <ProductQuickViewModal
        open={
          Boolean(
            quickViewProduct
          )
        }

        product={
          quickViewProduct
        }

        onClose={() =>
          setQuickViewProduct(
            null
          )
        }
      />

    </>

  );

};


export default ProductsOnSale;