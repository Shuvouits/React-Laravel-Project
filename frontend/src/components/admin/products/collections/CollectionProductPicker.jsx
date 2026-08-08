import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  GripVertical,
  LoaderCircle,
  Search,
  X,
  Package,
} from "lucide-react";

import api from "../../../../api/axios";

import {
  COLLECTION_API,
} from "./collectionConfig";


const CollectionProductPicker = ({
  products = [],
  onChange,
}) => {

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    results,
    setResults,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    open,
    setOpen,
  ] = useState(false);

  const [
    dragIndex,
    setDragIndex,
  ] = useState(null);

  const wrapperRef =
    useRef(null);


  /*
  |--------------------------------------------------------------------------
  | PRODUCT SEARCH
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const query =
      search.trim();


    if (!query) {

      setResults([]);
      setOpen(false);

      return;
    }


    const timer =
      setTimeout(
        async () => {

          try {

            setLoading(true);


            const response =
              await api.get(
                COLLECTION_API.productSearch,
                {
                  params: {
                    search:
                      query,
                  },
                }
              );


            const rows =
              response.data?.products;


            setResults(
              Array.isArray(rows)
                ? rows
                : []
            );


            setOpen(true);

          } catch (error) {

            console.error(
              "Product search error:",
              error
            );

            setResults([]);

          } finally {

            setLoading(false);

          }

        },
        300
      );


    return () =>
      clearTimeout(timer);

  }, [search]);


  /*
  |--------------------------------------------------------------------------
  | CLICK OUTSIDE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const handleClickOutside = (
      event
    ) => {

      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {

        setOpen(false);

      }

    };


    document.addEventListener(
      "mousedown",
      handleClickOutside
    );


    return () =>
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );

  }, []);


  /*
  |--------------------------------------------------------------------------
  | ADD PRODUCT
  |--------------------------------------------------------------------------
  */

  const addProduct = (
    product
  ) => {

    const exists =
      products.some(
        (item) =>
          Number(item.id) ===
          Number(product.id)
      );


    if (exists) {

      setSearch("");
      setOpen(false);

      return;
    }


    const next = [
      ...products,
      {
        ...product,

        sort_order:
          products.length,
      },
    ];


    onChange(next);

    setSearch("");
    setOpen(false);

  };


  /*
  |--------------------------------------------------------------------------
  | REMOVE PRODUCT
  |--------------------------------------------------------------------------
  */

  const removeProduct = (
    productId
  ) => {

    const next =
      products
        .filter(
          (item) =>
            Number(item.id) !==
            Number(productId)
        )
        .map(
          (item, index) => ({
            ...item,
            sort_order: index,
          })
        );


    onChange(next);

  };


  /*
  |--------------------------------------------------------------------------
  | DRAG REORDER
  |--------------------------------------------------------------------------
  */

  const handleDrop = (
    targetIndex
  ) => {

    if (
      dragIndex === null ||
      dragIndex === targetIndex
    ) {

      setDragIndex(null);

      return;

    }


    const next = [
      ...products,
    ];


    const [moved] =
      next.splice(
        dragIndex,
        1
      );


    next.splice(
      targetIndex,
      0,
      moved
    );


    onChange(
      next.map(
        (item, index) => ({
          ...item,
          sort_order: index,
        })
      )
    );


    setDragIndex(null);

  };


  return (
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
          text-[15px]
          font-bold
        "
      >
        Products in Collection
      </h2>


      {/* =====================================================
          SEARCH
      ====================================================== */}

      <div
        ref={wrapperRef}

        className="
          relative
          mt-[20px]
        "
      >

        <Search
          size={16}

          className="
            absolute
            left-[13px]
            top-[12px]

            text-[#8b9098]
          "
        />


        <input
          type="text"

          value={search}

          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }

          onFocus={() => {

            if (
              results.length
            ) {

              setOpen(true);

            }

          }}

          placeholder="Search products to add..."

          className="
            w-full
            h-[40px]

            rounded-[11px]

            border
            border-[#dedfe2]

            pl-[39px]
            pr-[42px]

            text-[13px]

            outline-none

            focus:border-[#2065D1]
          "
        />


        {loading && (

          <LoaderCircle
            size={15}

            className="
              absolute
              right-[14px]
              top-[12px]

              animate-spin
              text-[#2065D1]
            "
          />

        )}


        {/* SEARCH RESULTS */}

        {open && (

          <div
            className="
              absolute
              left-0
              right-0
              top-[46px]

              z-40

              max-h-[300px]
              overflow-y-auto

              rounded-[11px]

              border
              border-[#dedfe2]

              bg-white

              shadow-[0_10px_30px_rgba(0,0,0,0.10)]
            "
          >

            {results.length === 0 ? (

              <div
                className="
                  px-4
                  py-5

                  text-center
                  text-[12px]
                  text-[#777]
                "
              >
                No products found.
              </div>

            ) : (

              results.map(
                (product) => {

                  const selected =
                    products.some(
                      (item) =>
                        Number(
                          item.id
                        ) ===
                        Number(
                          product.id
                        )
                    );


                  return (
                    <button
                      key={
                        product.id
                      }

                      type="button"

                      disabled={
                        selected
                      }

                      onClick={() =>
                        addProduct(
                          product
                        )
                      }

                      className="
                        w-full

                        px-[12px]
                        py-[10px]

                        border-b
                        border-[#f0f0f0]

                        last:border-0

                        flex
                        items-center
                        gap-[10px]

                        text-left

                        hover:bg-[#f8f9fb]

                        disabled:opacity-50
                      "
                    >

                      <ProductImage
                        product={
                          product
                        }
                      />


                      <div
                        className="
                          min-w-0
                          flex-1
                        "
                      >

                        <p
                          className="
                            truncate

                            text-[12px]
                            font-medium
                          "
                        >
                          {
                            product.title
                          }
                        </p>


                        <p
                          className="
                            mt-[2px]

                            text-[11px]
                            text-[#777]
                          "
                        >
                          {
                            product.formatted_price ||
                            "No price"
                          }
                        </p>

                      </div>


                      {selected && (

                        <span
                          className="
                            text-[10px]
                            text-[#2065D1]
                            font-medium
                          "
                        >
                          Added
                        </span>

                      )}

                    </button>
                  );

                }
              )

            )}

          </div>

        )}

      </div>


      {/* =====================================================
          SELECTED HEADER
      ====================================================== */}

      <div
        className="
          mt-[20px]

          flex
          items-center
          justify-between
        "
      >

        <p
          className="
            text-[12px]
            font-medium
          "
        >
          Selected Products ({products.length})
        </p>


        {products.length > 0 && (

          <button
            type="button"

            onClick={() =>
              onChange([])
            }

            className="
              text-[11px]
              font-medium

              text-[#111]

              hover:text-red-500
            "
          >
            Clear all
          </button>

        )}

      </div>


      {/* =====================================================
          SELECTED PRODUCTS
      ====================================================== */}

      {products.length > 0 ? (

        <div
          className="
            mt-[10px]

            rounded-[12px]

            border
            border-[#dedfe2]

            overflow-hidden
          "
        >

          {products.map(
            (
              product,
              index
            ) => (

              <div
                key={
                  product.id
                }

                draggable

                onDragStart={() =>
                  setDragIndex(
                    index
                  )
                }

                onDragOver={(e) =>
                  e.preventDefault()
                }

                onDrop={() =>
                  handleDrop(
                    index
                  )
                }

                className={`
                  min-h-[58px]

                  px-[10px]

                  flex
                  items-center
                  gap-[9px]

                  border-b
                  border-[#e7e8ea]

                  last:border-0

                  bg-white

                  ${
                    dragIndex === index
                      ? "opacity-50"
                      : ""
                  }
                `}
              >

                <GripVertical
                  size={15}

                  className="
                    shrink-0

                    cursor-grab
                    text-[#999]
                  "
                />


                <ProductImage
                  product={
                    product
                  }
                />


                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >

                  <p
                    className="
                      truncate

                      text-[12px]
                      font-medium
                    "
                  >
                    {
                      product.title
                    }
                  </p>


                  <p
                    className="
                      mt-[2px]

                      text-[11px]
                      text-[#777]
                    "
                  >
                    {
                      product.formatted_price ||
                      (
                        product.price !==
                        null &&
                        product.price !==
                        undefined

                          ? `$${Number(
                              product.price
                            ).toFixed(2)}`

                          : "No price"
                      )
                    }
                  </p>

                </div>


                <button
                  type="button"

                  onClick={() =>
                    removeProduct(
                      product.id
                    )
                  }

                  className="
                    w-[30px]
                    h-[30px]

                    rounded-[7px]

                    flex
                    items-center
                    justify-center

                    text-[#555]

                    hover:bg-red-50
                    hover:text-red-500
                  "
                >

                  <X
                    size={14}
                  />

                </button>

              </div>

            )
          )}

        </div>

      ) : (

        <div
          className="
            mt-[10px]

            rounded-[11px]

            border
            border-dashed
            border-[#d6d8dc]

            p-8

            text-center

            text-[12px]
            text-[#888]
          "
        >
          No products selected.
        </div>

      )}

    </div>
  );

};


const ProductImage = ({
  product,
}) => (

  <div
    className="
      w-[38px]
      h-[38px]

      rounded-[8px]

      border
      border-[#e5e6e8]

      bg-[#f7f7f7]

      overflow-hidden

      flex
      items-center
      justify-center

      shrink-0
    "
  >

    {product.cover_url ? (

      <img
        src={
          product.cover_url
        }

        alt={
          product.title
        }

        className="
          w-full
          h-full

          object-contain

          p-[2px]
        "
      />

    ) : (

      <Package
        size={16}

        className="
          text-[#999]
        "
      />

    )}

  </div>

);


export default CollectionProductPicker;