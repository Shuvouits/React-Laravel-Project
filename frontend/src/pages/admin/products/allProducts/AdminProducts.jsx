import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  Boxes,
  CircleCheck,
  Eye,
  Filter,
  LoaderCircle,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  Warehouse,
} from "lucide-react";

import api from "../../../../api/axios";

import {
  money,
  PRODUCT_API,
  PRODUCT_ROUTES,
} from "../../../../components/admin/products/allProducts/productConfig";

import DeleteConfirmModal from "../../../../components/admin/common/DeleteConfirmModal";


const AdminProducts = () => {

  const navigate = useNavigate();


  /*
  |--------------------------------------------------------------------------
  | STATES
  |--------------------------------------------------------------------------
  */

  const [
    products,
    setProducts,
  ] = useState([]);


  const [
    stats,
    setStats,
  ] = useState({
    total: 0,
    active: 0,
    draft: 0,
    out_of_stock: 0,
    inventory_units: 0,
  });


  const [
    tab,
    setTab,
  ] = useState("all");


  const [
    search,
    setSearch,
  ] = useState("");


  const [
    loading,
    setLoading,
  ] = useState(true);


  /*
  |--------------------------------------------------------------------------
  | DELETE STATES
  |--------------------------------------------------------------------------
  */

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);


  const [
    deletingId,
    setDeletingId,
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | LOAD PRODUCTS
  |--------------------------------------------------------------------------
  */

  const loadProducts = useCallback(
    async () => {

      try {

        setLoading(true);


        const response = await api.get(
          PRODUCT_API.index,
          {
            params: {
              tab,
              search: search.trim(),
            },
          }
        );


        setProducts(
          response.data
            ?.products
            ?.data || []
        );


        setStats({
          total:
            response.data
              ?.stats
              ?.total || 0,

          active:
            response.data
              ?.stats
              ?.active || 0,

          draft:
            response.data
              ?.stats
              ?.draft || 0,

          out_of_stock:
            response.data
              ?.stats
              ?.out_of_stock || 0,

          inventory_units:
            response.data
              ?.stats
              ?.inventory_units || 0,
        });

      } catch (error) {

        console.error(
          "Products error:",
          error
        );

      } finally {

        setLoading(false);

      }

    },
    [
      tab,
      search,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | SEARCH DEBOUNCE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    const timer = setTimeout(
      () => {
        loadProducts();
      },
      250
    );


    return () =>
      clearTimeout(timer);

  }, [
    loadProducts,
  ]);


  /*
  |--------------------------------------------------------------------------
  | VIEW PRODUCT
  |--------------------------------------------------------------------------
  */

  const handleView = (
    event,
    product
  ) => {

    event.stopPropagation();


    const url =
      `${window.location.origin}/products/${product.slug}`;


    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };


  /*
  |--------------------------------------------------------------------------
  | EDIT PRODUCT
  |--------------------------------------------------------------------------
  */

  const handleEdit = (
    event,
    product
  ) => {

    event.stopPropagation();


    navigate(
      PRODUCT_ROUTES.edit(
        product.id
      )
    );
  };


  /*
  |--------------------------------------------------------------------------
  | OPEN DELETE MODAL
  |--------------------------------------------------------------------------
  */

  const handleDeleteClick = (
    event,
    product
  ) => {

    event.stopPropagation();


    setDeleteTarget(
      product
    );
  };


  /*
  |--------------------------------------------------------------------------
  | CLOSE DELETE MODAL
  |--------------------------------------------------------------------------
  */

  const closeDeleteModal = () => {

    if (deletingId) {
      return;
    }


    setDeleteTarget(null);
  };


  /*
  |--------------------------------------------------------------------------
  | CONFIRM DELETE PRODUCT
  |--------------------------------------------------------------------------
  */

  const confirmDeleteProduct = async () => {

    if (
      !deleteTarget ||
      deletingId
    ) {
      return;
    }


    const product =
      deleteTarget;


    try {

      setDeletingId(
        product.id
      );


      await api.delete(
        PRODUCT_API.delete(
          product.id
        )
      );


      /*
      |--------------------------------------------------------------------------
      | CLOSE MODAL
      |--------------------------------------------------------------------------
      */

      setDeleteTarget(null);


      /*
      |--------------------------------------------------------------------------
      | REMOVE FROM CURRENT UI
      |--------------------------------------------------------------------------
      */

      setProducts(
        (previous) =>
          previous.filter(
            (item) =>
              Number(item.id) !==
              Number(product.id)
          )
      );


      /*
      |--------------------------------------------------------------------------
      | REFRESH LIST + STATS
      |--------------------------------------------------------------------------
      */

      await loadProducts();

    } catch (error) {

      console.error(
        "Delete product error:",
        error
      );


      alert(
        error.response?.data
          ?.message ||
        "Unable to delete product."
      );

    } finally {

      setDeletingId(null);

    }

  };


  /*
  |--------------------------------------------------------------------------
  | PAGE
  |--------------------------------------------------------------------------
  */

  return (
    <>

      <div
        className="
          min-h-[calc(100vh-74px)]

          bg-[#f6f7f8]

          px-6
          py-6

          font-['Inter']
        "
      >

        <div
          className="
            max-w-[1320px]
            mx-auto
          "
        >

          {/* =====================================================
              STATS
          ====================================================== */}

          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              xl:grid-cols-5

              rounded-[14px]

              border
              border-[#dedfe2]

              bg-white

              overflow-hidden
            "
          >

            <Stat
              title="Total Products"

              value={
                stats.total
              }

              text="All catalog products"

              icon={
                <Boxes
                  size={18}
                />
              }
            />


            <Stat
              title="Active Listings"

              value={
                stats.active
              }

              text="Live on storefront"

              icon={
                <CircleCheck
                  size={18}
                />
              }
            />


            <Stat
              title="Draft Products"

              value={
                stats.draft
              }

              text="Pending publish"

              icon={
                <Package
                  size={18}
                />
              }
            />


            <Stat
              title="Out of Stock"

              value={
                stats.out_of_stock
              }

              text="Need replenishment"

              icon={
                <Package
                  size={18}
                />
              }
            />


            <Stat
              title="Inventory Units"

              value={
                Number(
                  stats.inventory_units
                ).toLocaleString()
              }

              text="Total sellable stock"

              icon={
                <Warehouse
                  size={18}
                />
              }

              last
            />

          </div>


          {/* =====================================================
              PRODUCTS CARD
          ====================================================== */}

          <div
            className="
              mt-[16px]

              rounded-[14px]

              border
              border-[#dedfe2]

              bg-white

              p-[22px]
            "
          >

            {/* =================================================
                TITLE
            ================================================== */}

            <div
              className="
                flex
                items-center
                justify-between
                gap-[16px]
              "
            >

              <h1
                className="
                  text-[20px]
                  font-bold
                "
              >
                Products
              </h1>


              <Link
                to={
                  PRODUCT_ROUTES.create
                }

                className="
                  h-[38px]
                  px-[15px]

                  rounded-[10px]

                  bg-[#2065D1]
                  text-white

                  flex
                  items-center
                  gap-[7px]

                  text-[12px]
                  font-semibold

                  hover:bg-[#1758bc]

                  transition-colors
                "
              >

                <Plus
                  size={15}
                />

                Add Product

              </Link>

            </div>


            {/* =================================================
                TABLE WRAPPER
            ================================================== */}

            <div
              className="
                mt-[16px]

                rounded-[12px]

                border
                border-[#dedfe2]

                overflow-hidden
              "
            >

              {/* =================================================
                  TABS
              ================================================== */}

              <div
                className="
                  h-[54px]

                  px-[16px]

                  border-b
                  border-[#e5e6e8]

                  flex
                  items-center
                  gap-[25px]
                "
              >

                {[
                  ["all", "All"],
                  ["active", "Active"],
                  ["draft", "Draft"],
                  ["archived", "Archived"],
                ].map(
                  ([key, label]) => (

                    <button
                      key={key}

                      type="button"

                      onClick={() =>
                        setTab(key)
                      }

                      className={`
                        relative

                        h-full

                        text-[12px]

                        transition-colors

                        ${
                          tab === key
                            ? "font-semibold text-[#111]"
                            : "text-[#666] hover:text-[#111]"
                        }
                      `}
                    >

                      {label}


                      {tab === key && (

                        <span
                          className="
                            absolute

                            left-0
                            right-0
                            bottom-0

                            h-[2px]

                            bg-[#111]
                          "
                        />

                      )}

                    </button>

                  )
                )}

              </div>


              {/* =================================================
                  SEARCH / FILTER
              ================================================== */}

              <div
                className="
                  px-[16px]
                  py-[10px]

                  border-b
                  border-[#e5e6e8]

                  flex
                  items-center
                  justify-between
                  gap-[12px]
                "
              >

                <div
                  className="
                    relative

                    max-w-[510px]
                    flex-1
                  "
                >

                  <Search
                    size={15}

                    className="
                      absolute

                      left-[12px]
                      top-1/2

                      -translate-y-1/2

                      text-[#999]

                      pointer-events-none
                    "
                  />


                  <input
                    value={search}

                    onChange={(event) =>
                      setSearch(
                        event.target.value
                      )
                    }

                    placeholder="Search products"

                    className="
                      w-full
                      h-[36px]

                      rounded-[9px]

                      border
                      border-[#dedfe2]

                      pl-[36px]
                      pr-[12px]

                      text-[12px]

                      outline-none

                      focus:border-[#2065D1]
                    "
                  />

                </div>


                <div
                  className="
                    flex
                    items-center
                    gap-[8px]
                  "
                >

                  <button
                    type="button"

                    className="
                      h-[36px]

                      px-[12px]

                      rounded-[9px]

                      border
                      border-[#dedfe2]

                      bg-white

                      flex
                      items-center
                      gap-[6px]

                      text-[11px]

                      hover:bg-[#f7f8fa]
                    "
                  >
                    ↕ Import / Export
                  </button>


                  <button
                    type="button"

                    className="
                      h-[36px]

                      px-[12px]

                      rounded-[9px]

                      border
                      border-[#dedfe2]

                      bg-white

                      flex
                      items-center
                      gap-[6px]

                      text-[11px]

                      hover:bg-[#f7f8fa]
                    "
                  >

                    <Filter
                      size={13}
                    />

                    Filter

                  </button>

                </div>

              </div>


              {/* =================================================
                  TABLE
              ================================================== */}

              <div
                className="
                  overflow-x-auto
                "
              >

                <table
                  className="
                    w-full

                    min-w-[1220px]

                    table-auto
                  "
                >

                  <thead>

                    <tr
                      className="
                        border-b
                        border-[#e5e6e8]

                        bg-white
                      "
                    >

                      <Th>
                        Product
                      </Th>

                      <Th>
                        Category
                      </Th>

                      <Th>
                        StoreName
                      </Th>

                      <Th>
                        Source
                      </Th>

                      <Th>
                        Status
                      </Th>

                      <Th>
                        Inventory
                      </Th>

                      <Th>
                        Price
                      </Th>

                      <Th>
                        Available In
                      </Th>

                      <Th
                        align="right"
                      >
                        Actions
                      </Th>

                    </tr>

                  </thead>


                  <tbody>

                    {/* =================================================
                        LOADING
                    ================================================== */}

                    {loading ? (

                      <tr>

                        <td
                          colSpan={9}

                          className="
                            py-[65px]

                            text-center

                            text-[12px]
                            text-[#777]
                          "
                        >

                          <div
                            className="
                              flex
                              items-center
                              justify-center
                              gap-[8px]
                            "
                          >

                            <LoaderCircle
                              size={17}

                              className="
                                animate-spin
                                text-[#2065D1]
                              "
                            />

                            Loading products...

                          </div>

                        </td>

                      </tr>

                    ) : products.length === 0 ? (

                      /* =================================================
                          EMPTY
                      ================================================== */

                      <tr>

                        <td
                          colSpan={9}

                          className="
                            py-[65px]

                            text-center

                            text-[12px]
                            text-[#777]
                          "
                        >
                          No products found.
                        </td>

                      </tr>

                    ) : (

                      /* =================================================
                          PRODUCT ROWS
                      ================================================== */

                      products.map(
                        (product) => (

                          <tr
                            key={
                              product.id
                            }

                            onClick={() =>
                              navigate(
                                PRODUCT_ROUTES.edit(
                                  product.id
                                )
                              )
                            }

                            className="
                              border-b
                              border-[#eceef0]

                              last:border-0

                              cursor-pointer

                              hover:bg-[#fafbfc]

                              transition-colors
                            "
                          >

                            {/* =================================================
                                PRODUCT
                            ================================================== */}

                            <td
                              className="
                                px-[16px]
                                py-[12px]
                              "
                            >

                              <div
                                className="
                                  flex
                                  items-center
                                  gap-[11px]
                                "
                              >

                                <div
                                  className="
                                    w-[46px]
                                    h-[46px]

                                    rounded-[10px]

                                    border
                                    border-[#eeeeef]

                                    bg-[#f4f5f6]

                                    overflow-hidden

                                    shrink-0

                                    flex
                                    items-center
                                    justify-center
                                  "
                                >

                                  {product.image_url ? (

                                    <img
                                      src={
                                        product.image_url
                                      }

                                      alt={
                                        product.title
                                      }

                                      className="
                                        w-full
                                        h-full

                                        object-contain

                                        p-[3px]
                                      "
                                    />

                                  ) : (

                                    <Package
                                      size={18}

                                      className="
                                        text-[#aaa]
                                      "
                                    />

                                  )}

                                </div>


                                <div
                                  className="
                                    min-w-0
                                  "
                                >

                                  <p
                                    className="
                                      max-w-[210px]

                                      truncate

                                      text-[12px]
                                      font-medium

                                      text-[#111]
                                    "
                                  >
                                    {product.title}
                                  </p>


                                  {product.slug && (

                                    <p
                                      className="
                                        max-w-[210px]

                                        mt-[2px]

                                        truncate

                                        text-[9px]
                                        text-[#8b8e94]
                                      "
                                    >
                                      /{product.slug}
                                    </p>

                                  )}

                                </div>

                              </div>

                            </td>


                            {/* =================================================
                                CATEGORY
                            ================================================== */}

                            <Td>

                              {product
                                .category
                                ?.name ||
                                "Uncategorized"}

                            </Td>


                            {/* =================================================
                                STORE
                            ================================================== */}

                            <Td>

                              {product.store_name ||
                                "Storify"}

                            </Td>


                            {/* =================================================
                                SOURCE
                            ================================================== */}

                            <Td>

                              <span
                                className={`
                                  inline-flex

                                  rounded-full

                                  px-[8px]
                                  py-[4px]

                                  text-[9px]
                                  font-medium

                                  ${
                                    product.source === "vendor"
                                      ? "border border-[#81e4d4] bg-[#effdfa] text-[#149984]"
                                      : "bg-[#eef1f5] text-[#536273]"
                                  }
                                `}
                              >

                                {product.source === "vendor"
                                  ? "Vendor"
                                  : "Admin"}

                              </span>

                            </Td>


                            {/* =================================================
                                STATUS
                            ================================================== */}

                            <Td>

                              <Status
                                value={
                                  product.status
                                }
                              />

                            </Td>


                            {/* =================================================
                                INVENTORY
                            ================================================== */}

                            <Td>

                              <span
                                className={
                                  Number(
                                    product.inventory
                                  ) <= 0
                                    ? "text-red-500"
                                    : ""
                                }
                              >

                                {product.inventory} in stock

                              </span>

                            </Td>


                            {/* =================================================
                                PRICE
                            ================================================== */}

                            <Td>

                              <span
                                className="
                                  whitespace-nowrap
                                "
                              >

                                {product.formatted_price ||
                                  money(
                                    product.price
                                  )}

                              </span>

                            </Td>


                            {/* =================================================
                                AVAILABLE
                            ================================================== */}

                            <Td>

                              <div
                                className="
                                  flex
                                  items-center
                                  gap-[5px]
                                  flex-wrap
                                "
                              >

                                {product.point_of_sale && (

                                  <Badge
                                    type="store"
                                  >
                                    In store
                                  </Badge>

                                )}


                                {product.online_store && (

                                  <Badge
                                    type="online"
                                  >
                                    Online
                                  </Badge>

                                )}


                                {!product.point_of_sale &&
                                  !product.online_store && (

                                  <span
                                    className="
                                      text-[10px]
                                      text-[#999]
                                    "
                                  >
                                    —
                                  </span>

                                )}

                              </div>

                            </Td>


                            {/* =================================================
                                ACTIONS
                            ================================================== */}

                            <td
                              className="
                                px-[16px]
                                py-[12px]

                                text-right

                                whitespace-nowrap
                              "
                            >

                              <div
                                className="
                                  inline-flex

                                  rounded-[9px]

                                  border
                                  border-[#dedfe2]

                                  bg-white

                                  overflow-hidden
                                "
                              >

                                {/* VIEW */}

                                <ActionButton
                                  title="View product"

                                  onClick={(event) =>
                                    handleView(
                                      event,
                                      product
                                    )
                                  }
                                >

                                  <Eye
                                    size={14}
                                  />

                                </ActionButton>


                                {/* EDIT */}

                                <ActionButton
                                  title="Edit product"

                                  border

                                  onClick={(event) =>
                                    handleEdit(
                                      event,
                                      product
                                    )
                                  }
                                >

                                  <Pencil
                                    size={14}
                                  />

                                </ActionButton>


                                {/* DELETE */}

                                <ActionButton
                                  title="Delete product"

                                  border

                                  danger

                                  disabled={
                                    deletingId ===
                                    product.id
                                  }

                                  onClick={(event) =>
                                    handleDeleteClick(
                                      event,
                                      product
                                    )
                                  }
                                >

                                  <Trash2
                                    size={14}
                                  />

                                </ActionButton>

                              </div>

                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </div>

        </div>

      </div>


      {/* =====================================================
          DELETE CONFIRMATION MODAL
      ====================================================== */}

      <DeleteConfirmModal
        open={
          Boolean(
            deleteTarget
          )
        }

        title="Delete Product"

        itemName={
          deleteTarget
            ?.title || ""
        }

        loading={
          Boolean(
            deletingId
          )
        }

        cancelText="Cancel"

        confirmText="Delete"

        onClose={
          closeDeleteModal
        }

        onConfirm={
          confirmDeleteProduct
        }
      />

    </>
  );
};


/*
|--------------------------------------------------------------------------
| STAT CARD
|--------------------------------------------------------------------------
*/

const Stat = ({
  title,
  value,
  text,
  icon,
  last,
}) => (

  <div
    className={`
      min-h-[125px]

      px-[20px]
      py-[18px]

      ${
        last
          ? ""
          : "xl:border-r border-[#e5e6e8]"
      }
    `}
  >

    <div
      className="
        flex
        items-start
        justify-between
      "
    >

      <div>

        <p
          className="
            text-[13px]
            font-medium
          "
        >
          {title}
        </p>


        <p
          className="
            mt-[7px]

            text-[23px]
            font-bold
          "
        >
          {value}
        </p>

      </div>


      <div
        className="
          w-[38px]
          h-[38px]

          rounded-full

          bg-[#edf3ff]
          text-[#2065D1]

          flex
          items-center
          justify-center
        "
      >
        {icon}
      </div>

    </div>


    <p
      className="
        mt-[8px]

        text-[11px]
        text-[#777]
      "
    >
      {text}
    </p>

  </div>

);


/*
|--------------------------------------------------------------------------
| TABLE HEADER
|--------------------------------------------------------------------------
*/

const Th = ({
  children,
  align = "left",
}) => (

  <th
    className={`
      px-[16px]
      py-[13px]

      ${
        align === "right"
          ? "text-right"
          : "text-left"
      }

      text-[11px]
      font-medium

      text-[#666]
    `}
  >
    {children}
  </th>

);


/*
|--------------------------------------------------------------------------
| TABLE CELL
|--------------------------------------------------------------------------
*/

const Td = ({
  children,
}) => (

  <td
    className="
      px-[16px]
      py-[12px]

      text-[11px]
      text-[#444]
    "
  >
    {children}
  </td>

);


/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

const Status = ({
  value,
}) => (

  <span
    className={`
      inline-flex

      rounded-full

      px-[8px]
      py-[4px]

      text-[9px]
      font-semibold

      capitalize

      ${
        value === "active"
          ? "bg-[#2065D1] text-white"
          : value === "draft"
          ? "bg-[#fff0bd] text-[#9a6c00]"
          : "bg-[#eceef1] text-[#666]"
      }
    `}
  >
    {value}
  </span>

);


/*
|--------------------------------------------------------------------------
| AVAILABLE BADGE
|--------------------------------------------------------------------------
*/

const Badge = ({
  children,
  type,
}) => (

  <span
    className={`
      whitespace-nowrap

      rounded-full

      px-[8px]
      py-[4px]

      text-[9px]

      ${
        type === "online"
          ? "bg-[#ebfbf8] text-[#258c7f]"
          : "bg-[#fff3f8] text-[#bf4c7d]"
      }
    `}
  >
    {children}
  </span>

);


/*
|--------------------------------------------------------------------------
| ACTION BUTTON
|--------------------------------------------------------------------------
*/

const ActionButton = ({
  children,
  title,
  onClick,
  border = false,
  danger = false,
  disabled = false,
}) => (

  <button
    type="button"

    title={title}

    disabled={disabled}

    onClick={onClick}

    className={`
      w-[34px]
      h-[32px]

      flex
      items-center
      justify-center

      bg-white

      transition-colors

      ${
        border
          ? "border-l border-[#dedfe2]"
          : ""
      }

      ${
        danger
          ? "text-[#777] hover:bg-red-50 hover:text-red-500"
          : "text-[#6d7278] hover:bg-[#f4f6f8] hover:text-[#2065D1]"
      }

      disabled:opacity-50
      disabled:cursor-not-allowed
    `}
  >
    {children}
  </button>

);


export default AdminProducts;