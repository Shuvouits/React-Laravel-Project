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
  Tag,
  BadgeCheck,
  Ban,
  Clock3,
  Star,
  ArrowUpDown,
  Pencil,
  Archive,
  Trash2,
  Package,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";

import api from "../../../api/axios";

import DeleteConfirmModal from "../../../components/admin/common/DeleteConfirmModal";


/* ==========================================================================
   ROUTES
============================================================================ */

const BRAND_ROUTES = {

  index:
    "/admin/products/brands",

  create:
    "/admin/products/brands/new",

  edit: (id) =>
    `/admin/products/brands/${id}/edit`,

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
    key: "pending",
    label: "Pending",
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

  {
    key: "rejected",
    label: "Rejected",
  },

  {
    key: "archived",
    label: "Archived",
  },

];


/* ==========================================================================
   DEFAULT VALUES
============================================================================ */

const DEFAULT_STATS = {

  total: 0,

  active: 0,

  inactive: 0,

  pending: 0,

  featured: 0,

};


const DEFAULT_PAGINATION = {

  current_page: 1,

  last_page: 1,

  from: 0,

  to: 0,

  total: 0,

};


/* ==========================================================================
   BOOLEAN NORMALIZER
============================================================================ */

const normalizeBoolean = (
  value
) => {

  return (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  );

};


/* ==========================================================================
   PRODUCT COUNT HELPER
============================================================================ */

const getProductsCount = (
  brand
) => {

  /*
  |--------------------------------------------------------------------------
  | LARAVEL withCount('products')
  |--------------------------------------------------------------------------
  */

  if (
    brand?.products_count !==
    undefined
  ) {

    return Number(
      brand.products_count
    ) || 0;

  }


  /*
  |--------------------------------------------------------------------------
  | CAMEL CASE FALLBACK
  |--------------------------------------------------------------------------
  */

  if (
    brand?.productsCount !==
    undefined
  ) {

    return Number(
      brand.productsCount
    ) || 0;

  }


  /*
  |--------------------------------------------------------------------------
  | RELATION ARRAY FALLBACK
  |--------------------------------------------------------------------------
  */

  if (
    Array.isArray(
      brand?.products
    )
  ) {

    return brand.products.length;

  }


  return 0;

};


/* ==========================================================================
   ADMIN BRANDS
============================================================================ */

const AdminBrands = () => {

  /* --------------------------------------------------------------------------
     DATA
  -------------------------------------------------------------------------- */

  const [
    brands,
    setBrands,
  ] = useState([]);


  const [
    stats,
    setStats,
  ] = useState({
    ...DEFAULT_STATS,
  });


  /* --------------------------------------------------------------------------
     FILTERS
  -------------------------------------------------------------------------- */

  const [
    activeTab,
    setActiveTab,
  ] = useState("all");


  const [
    search,
    setSearch,
  ] = useState("");


  /* --------------------------------------------------------------------------
     LOADING
  -------------------------------------------------------------------------- */

  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    actionLoading,
    setActionLoading,
  ] = useState(null);


  const [
    error,
    setError,
  ] = useState("");


  /* --------------------------------------------------------------------------
     DELETE MODAL
  -------------------------------------------------------------------------- */

  const [
    deleteTarget,
    setDeleteTarget,
  ] = useState(null);


  const [
    deletingId,
    setDeletingId,
  ] = useState(null);


  /* --------------------------------------------------------------------------
     PAGINATION
  -------------------------------------------------------------------------- */

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


  /* ==========================================================================
     FETCH BRANDS
  ============================================================================ */

  const fetchBrands =
    useCallback(
      async () => {

        try {

          setLoading(true);

          setError("");


          const response =
            await api.get(
              "/admin/brands",
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


          const brandData =
            responseData.brands || {};


          const rows =
            Array.isArray(
              brandData.data
            )
              ? brandData.data
              : [];


          /* ------------------------------------------------------------------
             NORMALIZE ROWS
          ------------------------------------------------------------------ */

          const normalizedRows =
            rows.map(
              (brand) => ({

                ...brand,

                is_featured:
                  normalizeBoolean(
                    brand.is_featured
                  ),

                products_count:
                  getProductsCount(
                    brand
                  ),

              })
            );


          setBrands(
            normalizedRows
          );


          /* ------------------------------------------------------------------
             STATS
          ------------------------------------------------------------------ */

          setStats({
            ...DEFAULT_STATS,

            ...(
              responseData.stats ||
              {}
            ),
          });


          /* ------------------------------------------------------------------
             PAGINATION
          ------------------------------------------------------------------ */

          setPagination({

            current_page:
              Number(
                brandData.current_page
              ) || 1,

            last_page:
              Number(
                brandData.last_page
              ) || 1,

            from:
              Number(
                brandData.from
              ) || 0,

            to:
              Number(
                brandData.to
              ) || 0,

            total:
              Number(
                brandData.total
              ) || 0,

          });

        } catch (error) {

          console.error(
            "Brands fetch error:",
            error
          );


          setBrands([]);


          setError(
            error.response?.data
              ?.message ||
            "Unable to load brands."
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
     LOAD / SEARCH
  ============================================================================ */

  useEffect(() => {

    const timer =
      setTimeout(
        () => {

          fetchBrands();

        },
        300
      );


    return () => {

      clearTimeout(
        timer
      );

    };

  }, [
    fetchBrands,
  ]);


  /* ==========================================================================
     TAB CHANGE
  ============================================================================ */

  const handleTabChange = (
    tab
  ) => {

    if (
      tab === activeTab
    ) {

      return;

    }


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
     REFRESH AFTER REMOVE
  ============================================================================ */

  const refreshAfterRemove =
    async () => {

      if (
        brands.length === 1 &&
        page > 1
      ) {

        setPage(
          (prev) =>
            prev - 1
        );


        return;

      }


      await fetchBrands();

    };


  /* ==========================================================================
     TOGGLE FEATURED
  ============================================================================ */

  const handleFeatured =
    async (
      brand
    ) => {

      if (
        actionLoading ||
        deletingId
      ) {

        return;

      }


      try {

        setActionLoading(
          `feature-${brand.id}`
        );


        const wasFeatured =
          normalizeBoolean(
            brand.is_featured
          );


        const response =
          await api.post(
            `/admin/brands/${brand.id}/toggle-featured`
          );


        const newFeaturedValue =
          normalizeBoolean(
            response.data
              ?.brand
              ?.is_featured
          );


        /* ------------------------------------------------------------------
           UPDATE ROW
        ------------------------------------------------------------------ */

        setBrands(
          (prev) =>
            prev.map(
              (item) => {

                if (
                  Number(item.id) !==
                  Number(brand.id)
                ) {

                  return item;

                }


                return {

                  ...item,

                  is_featured:
                    newFeaturedValue,

                };

              }
            )
        );


        /* ------------------------------------------------------------------
           UPDATE STAT
        ------------------------------------------------------------------ */

        setStats(
          (prev) => ({

            ...prev,

            featured:
              newFeaturedValue

                ? Number(
                    prev.featured ||
                    0
                  ) +
                  (
                    wasFeatured
                      ? 0
                      : 1
                  )

                : Math.max(
                    0,

                    Number(
                      prev.featured ||
                      0
                    ) -
                    (
                      wasFeatured
                        ? 1
                        : 0
                    )
                  ),

          })
        );


        if (
          activeTab ===
            "featured" &&
          !newFeaturedValue
        ) {

          await fetchBrands();

        }

      } catch (error) {

        console.error(
          "Featured update error:",
          error
        );


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
     ARCHIVE
  ============================================================================ */

  const handleArchive =
    async (
      brand
    ) => {

      if (
        actionLoading ||
        deletingId
      ) {

        return;

      }


      const confirmed =
        window.confirm(
          `Archive "${brand.name}"?`
        );


      if (!confirmed) {

        return;

      }


      try {

        setActionLoading(
          `archive-${brand.id}`
        );


        await api.post(
          `/admin/brands/${brand.id}/archive`
        );


        await refreshAfterRemove();

      } catch (error) {

        console.error(
          "Archive brand error:",
          error
        );


        window.alert(
          error.response?.data
            ?.message ||
          "Unable to archive brand."
        );

      } finally {

        setActionLoading(null);

      }

    };


  /* ==========================================================================
     OPEN DELETE MODAL
  ============================================================================ */

  const handleDeleteClick = (
    brand
  ) => {

    if (
      actionLoading ||
      deletingId
    ) {

      return;

    }


    setDeleteTarget(
      brand
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

  const confirmDeleteBrand =
    async () => {

      if (
        !deleteTarget ||
        deletingId
      ) {

        return;

      }


      const brand =
        deleteTarget;


      try {

        setDeletingId(
          brand.id
        );


        await api.delete(
          `/admin/brands/${brand.id}`
        );


        /*
        |--------------------------------------------------------------------------
        | CLOSE MODAL
        |--------------------------------------------------------------------------
        */

        setDeleteTarget(null);


        /*
        |--------------------------------------------------------------------------
        | REMOVE ROW IMMEDIATELY
        |--------------------------------------------------------------------------
        */

        setBrands(
          (previous) =>
            previous.filter(
              (item) =>
                Number(item.id) !==
                Number(brand.id)
            )
        );


        /*
        |--------------------------------------------------------------------------
        | PAGE ADJUSTMENT
        |--------------------------------------------------------------------------
        */

        if (
          brands.length === 1 &&
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
        | REFRESH STATS + DATA
        |--------------------------------------------------------------------------
        */

        await fetchBrands();

      } catch (error) {

        console.error(
          "Delete brand error:",
          error
        );


        window.alert(
          error.response?.data
            ?.message ||
          "Unable to delete brand."
        );

      } finally {

        setDeletingId(null);

      }

    };


  /* ==========================================================================
     UI
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
              title="Total brands"

              value={
                stats.total
              }

              description="All brands in your catalog"

              icon={
                <Tag
                  size={19}
                />
              }

              iconClass="
                bg-blue-100
                text-blue-600
              "
            />


            <StatCard
              title="Active brands"

              value={
                stats.active
              }

              description="Visible on the storefront"

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
              title="Inactive brands"

              value={
                stats.inactive
              }

              description="Hidden from the storefront"

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
              title="Pending approval"

              value={
                stats.pending
              }

              description="Vendor brands awaiting review"

              icon={
                <Clock3
                  size={19}
                />
              }

              iconClass="
                bg-orange-100
                text-orange-500
              "
            />


            <StatCard
              title="Featured brands"

              value={
                stats.featured
              }

              description="Highlighted on the storefront"

              icon={
                <Star
                  size={19}
                  fill="currentColor"
                />
              }

              iconClass="
                bg-[#FFF3C4]
                text-[#D99A00]
              "

              last
            />

          </div>


          {/* =====================================================
              BRANDS CARD
          ====================================================== */}

          <div
            className="
              mt-[16px]

              bg-white

              border
              border-[#dedfe3]

              rounded-[14px]

              shadow-[0_2px_7px_rgba(0,0,0,0.035)]

              overflow-hidden
            "
          >

            {/* HEADER */}

            <div
              className="
                px-[22px]
                pt-[22px]
                pb-[15px]

                flex
                items-center
                justify-between
                gap-5
              "
            >

              <h1
                className="
                  text-[20px]
                  font-bold
                  text-[#111]
                "
              >
                Brands
              </h1>


              <Link
                to={
                  BRAND_ROUTES.create
                }

                className="
                  h-[38px]
                  px-[15px]

                  rounded-[9px]

                  bg-[#2065D1]
                  text-white

                  flex
                  items-center
                  justify-center
                  gap-[7px]

                  text-[13px]
                  font-semibold

                  hover:bg-[#1858bb]

                  transition-colors
                "
              >

                <Plus
                  size={16}
                />

                Add Brand

              </Link>

            </div>


            {/* ===================================================
                TABLE CONTAINER
            ==================================================== */}

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

              {/* TABS */}

              <div
                className="
                  min-h-[56px]

                  px-[17px]

                  border-b
                  border-[#e6e7e9]

                  flex
                  items-center
                  justify-between
                  gap-3
                "
              >

                <div
                  className="
                    flex
                    items-center
                    gap-[22px]

                    h-[56px]

                    overflow-x-auto
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

                            shrink-0

                            text-[13px]
                            font-medium

                            transition-colors

                            ${
                              active
                                ? "text-[#111]"
                                : "text-[#686d75] hover:text-[#111]"
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
                    shrink-0
                    text-[#777]
                  "
                />

              </div>


              {/* SEARCH */}

              <div
                className="
                  px-[16px]
                  py-[10px]

                  border-b
                  border-[#e6e7e9]
                "
              >

                <div
                  className="
                    relative
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

                      pointer-events-none
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

                    placeholder="Search brands..."

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

                      placeholder:text-[#92969d]

                      focus:border-[#2065D1]
                      focus:ring-2
                      focus:ring-[#2065D1]/10
                    "
                  />

                </div>

              </div>


              {/* ERROR */}

              {error && (

                <div
                  className="
                    px-4
                    py-3

                    bg-red-50

                    border-b
                    border-red-100

                    text-[12px]
                    text-red-600
                  "
                >
                  {error}
                </div>

              )}


              {/* TABLE */}

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

                          aria-label="Select all brands"

                          className="
                            accent-[#2065D1]
                          "
                        />

                      </th>


                      <TableHead>
                        Brand
                      </TableHead>


                      <TableHead>
                        Products
                      </TableHead>


                      <TableHead>
                        Source
                      </TableHead>


                      <TableHead>
                        Approval
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

                      <tr>

                        <td
                          colSpan={7}

                          className="
                            h-[180px]
                            text-center
                          "
                        >

                          <LoaderCircle
                            size={25}

                            className="
                              animate-spin
                              mx-auto
                              text-[#2065D1]
                            "
                          />

                        </td>

                      </tr>

                    ) : brands.length === 0 ? (

                      <tr>

                        <td
                          colSpan={7}

                          className="
                            py-[60px]

                            text-center

                            text-[13px]
                            text-[#777]
                          "
                        >
                          No brands found.
                        </td>

                      </tr>

                    ) : (

                      brands.map(
                        (brand) => (

                          <BrandRow
                            key={
                              brand.id
                            }

                            brand={
                              brand
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

                            onArchive={
                              handleArchive
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


            {/* PAGINATION */}

            <div
              className="
                px-[22px]
                pb-[20px]

                flex
                items-center
                justify-between
                gap-4
              "
            >

              <p
                className="
                  text-[12px]
                  text-[#6f747b]
                "
              >

                Showing{" "}

                {pagination.from}

                {" "}to{" "}

                {pagination.to}

                {" "}of{" "}

                {pagination.total}

                {" "}results

              </p>


              <div
                className="
                  flex
                  items-center
                  gap-[6px]
                "
              >

                <button
                  type="button"

                  aria-label="Previous page"

                  disabled={
                    page <= 1 ||
                    loading
                  }

                  onClick={() =>
                    setPage(
                      (prev) =>
                        Math.max(
                          1,
                          prev - 1
                        )
                    )
                  }

                  className="
                    w-[34px]
                    h-[34px]

                    border
                    border-[#e1e2e5]

                    rounded-full

                    flex
                    items-center
                    justify-center

                    hover:bg-[#f7f7f8]

                    disabled:opacity-40
                    disabled:cursor-not-allowed
                  "
                >

                  <ChevronLeft
                    size={16}
                  />

                </button>


                <span
                  className="
                    min-w-[34px]
                    h-[34px]

                    px-2

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

                  {pagination.current_page}

                </span>


                <button
                  type="button"

                  aria-label="Next page"

                  disabled={
                    page >=
                      pagination.last_page ||
                    loading
                  }

                  onClick={() =>
                    setPage(
                      (prev) =>
                        prev + 1
                    )
                  }

                  className="
                    w-[34px]
                    h-[34px]

                    border
                    border-[#e1e2e5]

                    rounded-full

                    flex
                    items-center
                    justify-center

                    hover:bg-[#f7f7f8]

                    disabled:opacity-40
                    disabled:cursor-not-allowed
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
          DELETE BRAND MODAL
      ====================================================== */}

      <DeleteConfirmModal
        open={
          Boolean(
            deleteTarget
          )
        }

        title="Delete Brand"

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
          confirmDeleteBrand
        }
      />

    </>
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
}) => {

  return (

    <div
      className={`
        relative

        min-h-[125px]

        px-[22px]
        py-[20px]

        ${
          last
            ? ""
            : "xl:border-r border-[#e4e5e8]"
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
          text-[#222]
        "
      >
        {title}
      </p>


      <h3
        className="
          mt-[7px]

          text-[24px]
          leading-none
          font-bold

          text-[#111]
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

};


/* ==========================================================================
   TABLE HEAD
============================================================================ */

const TableHead = ({
  children,
  className = "",
}) => {

  return (

    <th
      className={`
        px-[14px]
        py-[14px]

        text-left

        text-[12px]
        font-medium

        text-[#656970]

        whitespace-nowrap

        ${className}
      `}
    >
      {children}
    </th>

  );

};


/* ==========================================================================
   BRAND ROW
============================================================================ */

const BrandRow = ({
  brand,

  actionLoading,

  deletingId,

  onFeatured,

  onArchive,

  onDelete,
}) => {

  const isFeatured =
    normalizeBoolean(
      brand.is_featured
    );


  const productsCount =
    getProductsCount(
      brand
    );


  const isActionBusy =
    Boolean(
      actionLoading ||
      deletingId
    );


  const deleteLoading =
    Number(
      deletingId
    ) ===
    Number(
      brand.id
    );


  return (

    <tr
      className="
        border-b
        border-[#eceef0]

        last:border-b-0

        hover:bg-[#fcfcfd]

        transition-colors
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

          aria-label={
            `Select ${brand.name}`
          }

          className="
            accent-[#2065D1]
          "
        />

      </td>


      {/* =====================================================
          BRAND
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
              relative

              w-[52px]
              h-[52px]

              rounded-[10px]

              border
              border-[#e5e7eb]

              bg-white

              overflow-hidden

              flex
              items-center
              justify-center

              shrink-0

              shadow-[0_1px_3px_rgba(0,0,0,0.04)]
            "
          >

            {brand.logo_url ? (

              <img
                src={
                  brand.logo_url
                }

                alt={
                  brand.name
                    ? `${brand.name} logo`
                    : "Brand logo"
                }

                className="
                  w-full
                  h-full

                  object-contain

                  p-[4px]
                "

                onError={(event) => {

                  event.currentTarget
                    .style
                    .display =
                    "none";

                }}
              />

            ) : (

              <div
                className="
                  w-full
                  h-full

                  bg-[#f6f7f8]

                  flex
                  items-center
                  justify-center
                "
              >

                <Package
                  size={18}

                  strokeWidth={1.7}

                  className="
                    text-[#8b9098]
                  "
                />

              </div>

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

                truncate
              "
            >
              {brand.name}
            </p>


            <p
              className="
                mt-[2px]

                text-[11px]
                text-[#7d8188]

                truncate
              "
            >

              /{brand.slug}

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

          text-[#222]
        "
      >
        {productsCount}
      </td>


      {/* =====================================================
          SOURCE
      ====================================================== */}

      <td
        className="
          px-[14px]
          py-[14px]
        "
      >

        {brand.source ===
        "vendor" ? (

          <Badge>
            Vendor
          </Badge>

        ) : (

          <span
            className="
              text-[12px]
              text-[#70747b]
            "
          >
            Official
          </span>

        )}

      </td>


      {/* =====================================================
          APPROVAL
      ====================================================== */}

      <td
        className="
          px-[14px]
          py-[14px]
        "
      >

        <ApprovalBadge
          status={
            brand.approval_status
          }
        />

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

        <StatusBadge
          status={
            brand.status
          }
        />

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
            items-center
            justify-end
          "
        >

          <div
            className="
              inline-flex

              border
              border-[#dedfe2]

              rounded-[9px]

              overflow-hidden

              bg-[#fafafa]
            "
          >

            {/* EDIT */}

            <Link
              to={
                BRAND_ROUTES.edit(
                  brand.id
                )
              }

              title="Edit"

              aria-label={
                `Edit ${brand.name}`
              }

              className="
                w-[32px]
                h-[32px]

                flex
                items-center
                justify-center

                text-[#74777d]

                border-r
                border-[#dedfe2]

                hover:bg-white
                hover:text-[#2065D1]

                transition-colors
              "
            >

              <Pencil
                size={14}
              />

            </Link>


            {/* FEATURE */}

            <ActionIcon
              title={
                isFeatured
                  ? "Remove from featured"
                  : "Add to featured"
              }

              featured={
                isFeatured
              }

              disabled={
                isActionBusy
              }

              loading={
                actionLoading ===
                `feature-${brand.id}`
              }

              onClick={() =>
                onFeatured(
                  brand
                )
              }
            >

              <Star
                size={15}

                strokeWidth={1.8}

                fill={
                  isFeatured
                    ? "currentColor"
                    : "none"
                }
              />

            </ActionIcon>


            {/* ARCHIVE */}

            <ActionIcon
              title="Archive"

              disabled={
                isActionBusy
              }

              loading={
                actionLoading ===
                `archive-${brand.id}`
              }

              onClick={() =>
                onArchive(
                  brand
                )
              }
            >

              <Archive
                size={14}
              />

            </ActionIcon>


            {/* DELETE */}

            <ActionIcon
              title="Delete"

              danger

              disabled={
                isActionBusy
              }

              loading={
                deleteLoading
              }

              onClick={() =>
                onDelete(
                  brand
                )
              }
            >

              <Trash2
                size={14}
              />

            </ActionIcon>

          </div>

        </div>

      </td>

    </tr>

  );

};


/* ==========================================================================
   ACTION ICON
============================================================================ */

const ActionIcon = ({
  children,
  title,
  onClick,

  loading = false,
  disabled = false,

  danger = false,

  featured = false,
}) => {

  return (

    <button
      type="button"

      title={
        title
      }

      aria-label={
        title
      }

      onClick={
        onClick
      }

      disabled={
        disabled ||
        loading
      }

      className={`
        w-[32px]
        h-[32px]

        flex
        items-center
        justify-center

        border-r
        last:border-r-0

        border-[#dedfe2]

        transition-all
        duration-200

        disabled:opacity-45
        disabled:cursor-not-allowed

        ${
          featured

            ? `
              bg-[#FFF4CC]
              text-[#D99A00]

              hover:bg-[#FFE9A3]
              hover:text-[#C88700]
            `

            : danger

              ? `
                bg-[#fafafa]
                text-[#74777d]

                hover:bg-red-50
                hover:text-red-500
              `

              : `
                bg-[#fafafa]
                text-[#74777d]

                hover:bg-white
                hover:text-[#2065D1]
              `
        }
      `}
    >

      {loading ? (

        <LoaderCircle
          size={13}

          className="
            animate-spin
          "
        />

      ) : (

        children

      )}

    </button>

  );

};


/* ==========================================================================
   BADGE
============================================================================ */

const Badge = ({
  children,
}) => {

  return (

    <span
      className="
        inline-flex

        px-[8px]
        py-[3px]

        rounded-full

        border
        border-[#dedfe2]

        text-[10px]
        font-medium
      "
    >
      {children}
    </span>

  );

};


/* ==========================================================================
   APPROVAL BADGE
============================================================================ */

const ApprovalBadge = ({
  status,
}) => {

  if (
    status ===
    "approved"
  ) {

    return (

      <span
        className="
          inline-flex

          px-[9px]
          py-[3px]

          rounded-full

          bg-[#2065D1]
          text-white

          text-[10px]
          font-semibold

          whitespace-nowrap
        "
      >
        ✓ Approved
      </span>

    );

  }


  if (
    status ===
    "rejected"
  ) {

    return (

      <span
        className="
          inline-flex

          px-[9px]
          py-[3px]

          rounded-full

          bg-red-100
          text-red-600

          text-[10px]
          font-semibold
        "
      >
        Rejected
      </span>

    );

  }


  return (

    <span
      className="
        inline-flex

        px-[9px]
        py-[3px]

        rounded-full

        bg-orange-100
        text-orange-600

        text-[10px]
        font-semibold
      "
    >
      Pending
    </span>

  );

};


/* ==========================================================================
   STATUS BADGE
============================================================================ */

const StatusBadge = ({
  status,
}) => {

  const styles = {

    active:
      "bg-[#2065D1] text-white",

    inactive:
      "bg-[#eceef1] text-[#666]",

    archived:
      "bg-[#f1f1f1] text-[#888]",

  };


  const normalizedStatus =
    status ||
    "inactive";


  return (

    <span
      className={`
        inline-flex

        px-[9px]
        py-[3px]

        rounded-full

        text-[10px]
        font-semibold

        capitalize

        ${
          styles[
            normalizedStatus
          ] ||
          styles.inactive
        }
      `}
    >

      {normalizedStatus}

    </span>

  );

};


export default AdminBrands;