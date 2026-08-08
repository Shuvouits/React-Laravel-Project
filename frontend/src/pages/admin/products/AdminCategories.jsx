import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  Plus,
  Search,
  FolderTree,
  BadgeCheck,
  Ban,
  Layers3,
  Boxes,
  ArrowUpDown,
  Pencil,
  Star,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  ChevronsUpDown,
} from "lucide-react";

import api from "../../../api/axios";

import {
  normalizeBoolean,
} from "../../../components/admin/categories/categoryConfig";

import DeleteConfirmModal from "../../../components/admin/common/DeleteConfirmModal";


/* ==========================================================================
   ROUTES
============================================================================ */

const CATEGORY_ROUTES = {
  index:
    "/admin/products/categories",

  create:
    "/admin/products/categories/new",

  edit: (id) =>
    `/admin/products/categories/${id}/edit`,
};


/* ==========================================================================
   TABS
============================================================================ */

const TABS = [
  {
    key: "all",
    label: "All",
  },
  {
    key: "active",
    label: "Active",
  },
  {
    key: "featured",
    label: "Featured",
  },
  {
    key: "inactive",
    label: "Inactive",
  },
];


/* ==========================================================================
   DEFAULT DATA
============================================================================ */

const DEFAULT_STATS = {
  total: 0,
  active: 0,
  inactive: 0,
  parents: 0,
  assigned_products: 0,
};


const DEFAULT_PAGINATION = {
  current_page: 1,
  last_page: 1,
  from: 0,
  to: 0,
  total: 0,
};


/* ==========================================================================
   PRODUCT COUNT HELPER
============================================================================ */

const getProductsCount = (
  category
) => {

  /*
  |--------------------------------------------------------------------------
  | NORMAL LARAVEL withCount()
  |--------------------------------------------------------------------------
  */

  if (
    category?.products_count !==
    undefined
  ) {

    return Number(
      category.products_count
    ) || 0;
  }


  /*
  |--------------------------------------------------------------------------
  | OPTIONAL CAMEL CASE FALLBACK
  |--------------------------------------------------------------------------
  */

  if (
    category?.productsCount !==
    undefined
  ) {

    return Number(
      category.productsCount
    ) || 0;
  }


  /*
  |--------------------------------------------------------------------------
  | RELATION ARRAY FALLBACK
  |--------------------------------------------------------------------------
  */

  if (
    Array.isArray(
      category?.products
    )
  ) {

    return category
      .products
      .length;
  }


  return 0;
};


/* ==========================================================================
   ADMIN CATEGORIES
============================================================================ */

const AdminCategories = () => {

  /*
  |--------------------------------------------------------------------------
  | DATA
  |--------------------------------------------------------------------------
  */

  const [
    categories,
    setCategories,
  ] = useState([]);


  const [
    stats,
    setStats,
  ] = useState({
    ...DEFAULT_STATS,
  });


  /*
  |--------------------------------------------------------------------------
  | FILTERS
  |--------------------------------------------------------------------------
  */

  const [
    activeTab,
    setActiveTab,
  ] = useState("all");


  const [
    search,
    setSearch,
  ] = useState("");


  /*
  |--------------------------------------------------------------------------
  | PAGINATION
  |--------------------------------------------------------------------------
  */

  const [
    page,
    setPage,
  ] = useState(1);


  const [
    pagination,
    setPagination,
  ] = useState({
    ...DEFAULT_PAGINATION,
  });


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    actionLoading,
    setActionLoading,
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | DELETE MODAL
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
  | ERROR
  |--------------------------------------------------------------------------
  */

  const [
    error,
    setError,
  ] = useState("");


  /* ==========================================================================
     FETCH CATEGORIES
  ============================================================================ */

  const fetchCategories =
    useCallback(
      async () => {

        try {

          setLoading(true);
          setError("");


          const response =
            await api.get(
              "/admin/categories",
              {
                params: {
                  tab:
                    activeTab,

                  search:
                    search.trim(),

                  page,
                },
              }
            );


          const responseData =
            response.data || {};


          const categoryData =
            responseData.categories || {};


          const rows =
            Array.isArray(
              categoryData.data
            )
              ? categoryData.data
              : [];


          /*
          |--------------------------------------------------------------------------
          | NORMALIZE ROWS
          |--------------------------------------------------------------------------
          */

          const normalizedRows =
            rows.map(
              (category) => ({

                ...category,

                is_featured:
                  normalizeBoolean(
                    category.is_featured
                  ),

                products_count:
                  getProductsCount(
                    category
                  ),

              })
            );


          setCategories(
            normalizedRows
          );


          /*
          |--------------------------------------------------------------------------
          | STATS
          |--------------------------------------------------------------------------
          */

          setStats({
            ...DEFAULT_STATS,

            ...(
              responseData.stats ||
              {}
            ),

            assigned_products:
              Number(
                responseData
                  ?.stats
                  ?.assigned_products
              ) || 0,
          });


          /*
          |--------------------------------------------------------------------------
          | PAGINATION
          |--------------------------------------------------------------------------
          */

          setPagination({

            current_page:
              Number(
                categoryData.current_page
              ) || 1,

            last_page:
              Number(
                categoryData.last_page
              ) || 1,

            from:
              Number(
                categoryData.from
              ) || 0,

            to:
              Number(
                categoryData.to
              ) || 0,

            total:
              Number(
                categoryData.total
              ) || 0,

          });

        } catch (error) {

          console.error(
            "Categories fetch error:",
            error
          );


          setCategories([]);


          setError(
            error.response?.data
              ?.message ||
            "Unable to load categories."
          );

        } finally {

          setLoading(false);

        }

      },
      [
        activeTab,
        search,
        page,
      ]
    );


  /* ==========================================================================
     SEARCH DEBOUNCE
  ============================================================================ */

  useEffect(() => {

    const timer =
      setTimeout(
        () => {
          fetchCategories();
        },
        300
      );


    return () =>
      clearTimeout(timer);

  }, [
    fetchCategories,
  ]);


  /* ==========================================================================
     TAB CHANGE
  ============================================================================ */

  const handleTabChange = (
    tab
  ) => {

    setActiveTab(tab);

    setPage(1);
  };


  /* ==========================================================================
     SEARCH
  ============================================================================ */

  const handleSearch = (
    event
  ) => {

    setSearch(
      event.target.value
    );


    setPage(1);
  };


  /* ==========================================================================
     FEATURED
  ============================================================================ */

  const handleFeatured =
    async (
      category
    ) => {

      if (
        actionLoading ||
        deletingId
      ) {
        return;
      }


      try {

        setActionLoading(
          `feature-${category.id}`
        );


        const response =
          await api.post(
            `/admin/categories/${category.id}/toggle-featured`
          );


        const newValue =
          normalizeBoolean(
            response.data
              ?.category
              ?.is_featured
          );


        /*
        |--------------------------------------------------------------------------
        | UPDATE CURRENT ROW
        |--------------------------------------------------------------------------
        */

        setCategories(
          (previous) =>
            previous.map(
              (item) =>
                Number(item.id) ===
                Number(category.id)

                  ? {
                      ...item,

                      is_featured:
                        newValue,
                    }

                  : item
            )
        );


        /*
        |--------------------------------------------------------------------------
        | FEATURED TAB
        |--------------------------------------------------------------------------
        */

        if (
          activeTab ===
            "featured" &&
          !newValue
        ) {

          await fetchCategories();

        }

      } catch (error) {

        window.alert(
          error.response?.data
            ?.message ||
          "Unable to update featured status."
        );

      } finally {

        setActionLoading(null);

      }

    };


  /* ==========================================================================
     OPEN DELETE MODAL
  ============================================================================ */

  const handleDeleteClick = (
    category
  ) => {

    if (
      actionLoading ||
      deletingId
    ) {
      return;
    }


    setDeleteTarget(
      category
    );
  };


  /* ==========================================================================
     CLOSE DELETE MODAL
  ============================================================================ */

  const closeDeleteModal = () => {

    if (deletingId) {
      return;
    }


    setDeleteTarget(null);
  };


  /* ==========================================================================
     CONFIRM DELETE
  ============================================================================ */

  const confirmDeleteCategory =
    async () => {

      if (
        !deleteTarget ||
        deletingId
      ) {
        return;
      }


      const category =
        deleteTarget;


      try {

        setDeletingId(
          category.id
        );


        /*
        |--------------------------------------------------------------------------
        | DELETE API
        |--------------------------------------------------------------------------
        */

        await api.delete(
          `/admin/categories/${category.id}`
        );


        /*
        |--------------------------------------------------------------------------
        | CLOSE MODAL
        |--------------------------------------------------------------------------
        */

        setDeleteTarget(null);


        /*
        |--------------------------------------------------------------------------
        | REMOVE IMMEDIATELY
        |--------------------------------------------------------------------------
        */

        setCategories(
          (previous) =>
            previous.filter(
              (item) =>
                Number(item.id) !==
                Number(
                  category.id
                )
            )
        );


        /*
        |--------------------------------------------------------------------------
        | IF LAST ROW ON CURRENT PAGE
        |--------------------------------------------------------------------------
        */

        if (
          categories.length === 1 &&
          page > 1
        ) {

          setPage(
            (previous) =>
              previous - 1
          );

          return;
        }


        /*
        |--------------------------------------------------------------------------
        | REFRESH STATS + LIST
        |--------------------------------------------------------------------------
        */

        await fetchCategories();

      } catch (error) {

        console.error(
          "Category delete error:",
          error
        );


        window.alert(
          error.response?.data
            ?.message ||
          "Unable to delete category."
        );

      } finally {

        setDeletingId(null);

      }

    };


  /* ==========================================================================
     PAGE
  ============================================================================ */

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
            max-w-[1280px]
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

              bg-white

              border
              border-[#dedfe3]

              rounded-[14px]

              overflow-hidden

              shadow-[0_2px_7px_rgba(0,0,0,0.04)]
            "
          >

            <StatCard
              title="Total Categories"

              value={
                stats.total
              }

              description="All category records"

              icon={
                <FolderTree
                  size={19}
                />
              }

              iconClass="
                bg-blue-100
                text-blue-600
              "
            />


            <StatCard
              title="Active Categories"

              value={
                stats.active
              }

              description="Visible in storefront"

              icon={
                <BadgeCheck
                  size={19}
                />
              }

              iconClass="
                bg-green-100
                text-green-600
              "
            />


            <StatCard
              title="Inactive Categories"

              value={
                stats.inactive
              }

              description="Hidden from customers"

              icon={
                <Ban
                  size={19}
                />
              }

              iconClass="
                bg-red-100
                text-red-500
              "
            />


            <StatCard
              title="Parent Categories"

              value={
                stats.parents
              }

              description="Top-level taxonomy"

              icon={
                <Layers3
                  size={19}
                />
              }

              iconClass="
                bg-indigo-100
                text-indigo-600
              "
            />


            <StatCard
              title="Assigned Products"

              value={
                stats.assigned_products
              }

              description="Products mapped to categories"

              icon={
                <Boxes
                  size={19}
                />
              }

              iconClass="
                bg-purple-100
                text-purple-600
              "

              last
            />

          </div>


          {/* =====================================================
              MAIN CARD
          ====================================================== */}

          <div
            className="
              mt-[16px]

              bg-white

              border
              border-[#dedfe3]

              rounded-[14px]

              shadow-[0_2px_7px_rgba(0,0,0,0.035)]
            "
          >

            {/* =================================================
                HEADER
            ================================================== */}

            <div
              className="
                px-[22px]
                pt-[22px]
                pb-[15px]

                flex
                items-center
                justify-between
              "
            >

              <h1
                className="
                  text-[20px]
                  font-bold
                "
              >
                Categories
              </h1>


              <Link
                to={
                  CATEGORY_ROUTES.create
                }

                className="
                  h-[38px]
                  px-[15px]

                  rounded-[9px]

                  bg-[#2065D1]
                  text-white

                  flex
                  items-center
                  gap-[7px]

                  text-[13px]
                  font-semibold

                  hover:bg-[#1858bb]
                "
              >

                <Plus
                  size={16}
                />

                Add Category

              </Link>

            </div>


            {/* =================================================
                TABLE AREA
            ================================================== */}

            <div
              className="
                mx-[22px]
                mb-[22px]

                border
                border-[#e2e3e6]

                rounded-[12px]

                overflow-hidden
              "
            >

              {/* =================================================
                  TABS
              ================================================== */}

              <div
                className="
                  h-[56px]

                  px-[17px]

                  border-b
                  border-[#e6e7e9]

                  flex
                  justify-between
                  items-center
                "
              >

                <div
                  className="
                    h-full

                    flex
                    items-center
                    gap-[24px]
                  "
                >

                  {TABS.map(
                    (tab) => {

                      const active =
                        activeTab ===
                        tab.key;


                      return (

                        <button
                          key={
                            tab.key
                          }

                          type="button"

                          onClick={() =>
                            handleTabChange(
                              tab.key
                            )
                          }

                          className={`
                            relative

                            h-full

                            text-[13px]
                            font-medium

                            ${
                              active
                                ? "text-[#111]"
                                : "text-[#686d75]"
                            }
                          `}
                        >

                          {tab.label}


                          {active && (

                            <span
                              className="
                                absolute

                                bottom-0
                                left-0
                                right-0

                                h-[2px]

                                bg-[#111]
                              "
                            />

                          )}

                        </button>

                      );

                    }
                  )}

                </div>


                <ArrowUpDown
                  size={16}

                  className="
                    text-[#777]
                  "
                />

              </div>


              {/* =================================================
                  SEARCH
              ================================================== */}

              <div
                className="
                  px-[16px]
                  py-[10px]

                  border-b
                  border-[#e6e7e9]

                  flex
                  items-center
                  justify-between
                  gap-4
                "
              >

                <div
                  className="
                    relative

                    w-full
                    max-w-[500px]
                  "
                >

                  <Search
                    size={16}

                    className="
                      absolute

                      left-[12px]
                      top-1/2

                      -translate-y-1/2

                      text-[#92969d]
                    "
                  />


                  <input
                    type="search"

                    value={
                      search
                    }

                    onChange={
                      handleSearch
                    }

                    placeholder="Search categories..."

                    className="
                      w-full
                      h-[36px]

                      rounded-[9px]

                      border
                      border-[#dedfe2]

                      pl-[38px]
                      pr-[12px]

                      text-[13px]

                      outline-none

                      focus:border-[#2065D1]
                    "
                  />

                </div>


                <button
                  type="button"

                  className="
                    h-[36px]
                    px-[13px]

                    rounded-[9px]

                    border
                    border-[#dedfe2]

                    flex
                    items-center
                    gap-[7px]

                    text-[12px]
                    font-medium

                    shrink-0
                  "
                >

                  <ChevronsUpDown
                    size={14}
                  />

                  Import / Export

                </button>

              </div>


              {/* =================================================
                  ERROR
              ================================================== */}

              {error && (

                <div
                  className="
                    px-4
                    py-3

                    bg-red-50

                    text-[12px]
                    text-red-600
                  "
                >
                  {error}
                </div>

              )}


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
                    min-w-[900px]
                  "
                >

                  <thead>

                    <tr
                      className="
                        border-b
                        border-[#e6e7e9]
                      "
                    >

                      <th
                        className="
                          w-[55px]

                          px-5
                          py-4
                        "
                      >

                        <input
                          type="checkbox"

                          className="
                            accent-[#2065D1]
                          "
                        />

                      </th>


                      <TableHead>
                        Category
                      </TableHead>


                      <TableHead>
                        Products
                      </TableHead>


                      <TableHead>
                        Featured
                      </TableHead>


                      <TableHead>
                        Status
                      </TableHead>


                      <TableHead
                        className="
                          text-right
                        "
                      >
                        Actions
                      </TableHead>

                    </tr>

                  </thead>


                  <tbody>

                    {loading ? (

                      /* =================================================
                          LOADING
                      ================================================== */

                      <tr>

                        <td
                          colSpan={6}

                          className="
                            h-[180px]
                          "
                        >

                          <LoaderCircle
                            size={25}

                            className="
                              mx-auto

                              animate-spin

                              text-[#2065D1]
                            "
                          />

                        </td>

                      </tr>

                    ) : categories.length ===
                      0 ? (

                      /* =================================================
                          EMPTY
                      ================================================== */

                      <tr>

                        <td
                          colSpan={6}

                          className="
                            py-[60px]

                            text-center

                            text-[13px]
                            text-[#777]
                          "
                        >
                          No categories found.
                        </td>

                      </tr>

                    ) : (

                      /* =================================================
                          ROWS
                      ================================================== */

                      categories.map(
                        (category) => (

                          <CategoryRow
                            key={
                              category.id
                            }

                            category={
                              category
                            }

                            actionLoading={
                              actionLoading
                            }

                            deletingId={
                              deletingId
                            }

                            onFeatured={
                              handleFeatured
                            }

                            onDelete={
                              handleDeleteClick
                            }
                          />

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </div>


            {/* =================================================
                PAGINATION
            ================================================== */}

            <div
              className="
                px-[22px]
                pb-[20px]

                flex
                items-center
                justify-between
              "
            >

              <p
                className="
                  text-[12px]
                  text-[#6f747b]
                "
              >

                Showing{" "}
                {pagination.from} to{" "}
                {pagination.to} of{" "}
                {pagination.total} results

              </p>


              <div
                className="
                  flex
                  items-center
                  gap-[6px]
                "
              >

                {/* PREVIOUS */}

                <button
                  type="button"

                  disabled={
                    page <= 1 ||
                    loading
                  }

                  onClick={() =>
                    setPage(
                      (previous) =>
                        Math.max(
                          1,
                          previous - 1
                        )
                    )
                  }

                  className="
                    w-[34px]
                    h-[34px]

                    rounded-full

                    border
                    border-[#e1e2e5]

                    flex
                    items-center
                    justify-center

                    disabled:opacity-40
                  "
                >

                  <ChevronLeft
                    size={16}
                  />

                </button>


                {/* CURRENT */}

                <span
                  className="
                    min-w-[34px]
                    h-[34px]

                    rounded-full

                    bg-[#2065D1]
                    text-white

                    flex
                    items-center
                    justify-center

                    text-[12px]
                    font-semibold
                  "
                >
                  {
                    pagination.current_page
                  }
                </span>


                {/* NEXT */}

                <button
                  type="button"

                  disabled={
                    page >=
                      pagination.last_page ||
                    loading
                  }

                  onClick={() =>
                    setPage(
                      (previous) =>
                        previous + 1
                    )
                  }

                  className="
                    w-[34px]
                    h-[34px]

                    rounded-full

                    border
                    border-[#e1e2e5]

                    flex
                    items-center
                    justify-center

                    disabled:opacity-40
                  "
                >

                  <ChevronRight
                    size={16}
                  />

                </button>

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

        title="Delete Category"

        itemName={
          deleteTarget
            ?.name || ""
        }

        cancelText="Cancel"

        confirmText="Delete"

        loading={
          Boolean(
            deletingId
          )
        }

        onClose={
          closeDeleteModal
        }

        onConfirm={
          confirmDeleteCategory
        }
      />

    </>
  );
};


/* ==========================================================================
   CATEGORY ROW
============================================================================ */

const CategoryRow = ({
  category,

  actionLoading,

  deletingId,

  onFeatured,

  onDelete,
}) => {

  /*
  |--------------------------------------------------------------------------
  | FEATURED
  |--------------------------------------------------------------------------
  */

  const isFeatured =
    normalizeBoolean(
      category.is_featured
    );


  /*
  |--------------------------------------------------------------------------
  | PRODUCT COUNT
  |--------------------------------------------------------------------------
  */

  const productsCount =
    getProductsCount(
      category
    );


  /*
  |--------------------------------------------------------------------------
  | LOADING
  |--------------------------------------------------------------------------
  */

  const featureLoading =
    actionLoading ===
    `feature-${category.id}`;


  const deleteLoading =
    Number(deletingId) ===
    Number(category.id);


  const busy =
    Boolean(
      actionLoading ||
      deletingId
    );


  return (

    <tr
      className="
        border-b
        border-[#eceef0]

        last:border-b-0

        hover:bg-[#fafbfc]
      "
    >

      {/* CHECKBOX */}

      <td
        className="
          px-5
          py-[14px]
        "
      >

        <input
          type="checkbox"

          className="
            accent-[#2065D1]
          "
        />

      </td>


      {/* =====================================================
          CATEGORY
      ====================================================== */}

      <td
        className="
          px-[14px]
          py-[14px]
        "
      >

        <div
          className="
            flex
            items-center
            gap-[12px]
          "
        >

          <div
            className="
              w-[48px]
              h-[48px]

              rounded-[10px]

              bg-[#f5f5f5]

              border
              border-[#e7e7e7]

              overflow-hidden

              flex
              items-center
              justify-center

              shrink-0
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
                  text-[#8b9098]
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
                text-[13px]
                font-semibold

                text-[#111]
              "
            >
              {category.name}
            </p>


            <p
              className="
                mt-[2px]

                text-[11px]
                text-[#7d8188]
              "
            >
              /{category.slug}
            </p>

          </div>

        </div>

      </td>


      {/* =====================================================
          PRODUCT COUNT
      ====================================================== */}

      <td
        className="
          px-[14px]
          py-[14px]

          text-[13px]
          font-medium

          text-[#252525]
        "
      >
        {productsCount}
      </td>


      {/* =====================================================
          FEATURED
      ====================================================== */}

      <td
        className="
          px-[14px]
          py-[14px]
        "
      >

        {isFeatured ? (

          <span
            className="
              inline-flex
              items-center
              gap-[4px]

              rounded-full

              bg-[#8B5CF6]
              text-white

              px-[9px]
              py-[3px]

              text-[10px]
              font-semibold
            "
          >

            <Star
              size={11}
              fill="currentColor"
            />

            Featured

          </span>

        ) : (

          <span
            className="
              text-[11px]
              text-[#999]
            "
          >
            —
          </span>

        )}

      </td>


      {/* =====================================================
          STATUS
      ====================================================== */}

      <td
        className="
          px-[14px]
          py-[14px]
        "
      >

        <span
          className={`
            inline-flex

            rounded-full

            px-[9px]
            py-[3px]

            text-[10px]
            font-semibold

            capitalize

            ${
              category.status ===
              "active"

                ? `
                  bg-[#2065D1]
                  text-white
                `

                : `
                  bg-[#eceef1]
                  text-[#666]
                `
            }
          `}
        >

          {category.status}

        </span>

      </td>


      {/* =====================================================
          ACTIONS
      ====================================================== */}

      <td
        className="
          px-[18px]
          py-[14px]
        "
      >

        <div
          className="
            flex
            justify-end
          "
        >

          <div
            className="
              inline-flex

              rounded-[9px]

              border
              border-[#dedfe2]

              overflow-hidden

              bg-white
            "
          >

            {/* EDIT */}

            <Link
              to={
                CATEGORY_ROUTES.edit(
                  category.id
                )
              }

              className="
                w-[32px]
                h-[32px]

                border-r
                border-[#dedfe2]

                flex
                items-center
                justify-center

                text-[#74777d]

                hover:bg-[#f5f7fa]
                hover:text-[#2065D1]
              "
            >

              <Pencil
                size={14}
              />

            </Link>


            {/* FEATURE */}

            <button
              type="button"

              disabled={busy}

              onClick={() =>
                onFeatured(
                  category
                )
              }

              title={
                isFeatured
                  ? "Remove featured"
                  : "Mark as featured"
              }

              className={`
                w-[32px]
                h-[32px]

                border-r
                border-[#dedfe2]

                flex
                items-center
                justify-center

                transition-colors

                ${
                  isFeatured

                    ? `
                      bg-[#FFF4CC]
                      text-[#D99A00]
                    `

                    : `
                      text-[#777]
                      hover:bg-[#fff9e7]
                      hover:text-[#D99A00]
                    `
                }

                disabled:opacity-50
              `}
            >

              {featureLoading ? (

                <LoaderCircle
                  size={13}

                  className="
                    animate-spin
                  "
                />

              ) : (

                <Star
                  size={14}

                  fill={
                    isFeatured
                      ? "currentColor"
                      : "none"
                  }
                />

              )}

            </button>


            {/* DELETE */}

            <button
              type="button"

              disabled={busy}

              onClick={() =>
                onDelete(
                  category
                )
              }

              title="Delete category"

              className="
                w-[32px]
                h-[32px]

                flex
                items-center
                justify-center

                text-[#777]

                hover:bg-red-50
                hover:text-red-500

                transition-colors

                disabled:opacity-50
              "
            >

              {deleteLoading ? (

                <LoaderCircle
                  size={13}

                  className="
                    animate-spin
                  "
                />

              ) : (

                <Trash2
                  size={14}
                />

              )}

            </button>

          </div>

        </div>

      </td>

    </tr>
  );
};


/* ==========================================================================
   STAT CARD
============================================================================ */

const StatCard = ({
  title,
  value,
  description,
  icon,
  iconClass,
  last = false,
}) => (

  <div
    className={`
      relative

      min-h-[125px]

      px-[22px]
      py-[20px]

      ${
        last
          ? ""
          : `
            xl:border-r
            border-[#e4e5e8]
          `
      }
    `}
  >

    <div
      className={`
        absolute

        right-[18px]
        top-[15px]

        w-[40px]
        h-[40px]

        rounded-full

        flex
        items-center
        justify-center

        ${iconClass}
      `}
    >
      {icon}
    </div>


    <p
      className="
        text-[14px]
        font-medium
      "
    >
      {title}
    </p>


    <h3
      className="
        mt-[7px]

        text-[24px]
        font-bold

        leading-none
      "
    >
      {Number(value) || 0}
    </h3>


    <p
      className="
        mt-[11px]

        text-[12px]
        text-[#777b82]
      "
    >
      {description}
    </p>

  </div>

);


/* ==========================================================================
   TABLE HEAD
============================================================================ */

const TableHead = ({
  children,
  className = "",
}) => (

  <th
    className={`
      px-[14px]
      py-[14px]

      text-left

      text-[12px]
      font-medium

      text-[#656970]

      ${className}
    `}
  >
    {children}
  </th>

);


export default AdminCategories;