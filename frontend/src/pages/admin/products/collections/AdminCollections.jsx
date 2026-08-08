import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  Archive,
  Boxes,
  Layers3,
  LoaderCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";

import api from "../../../../api/axios";

import {
  COLLECTION_API,
  COLLECTION_ROUTES,
} from "../../../../components/admin/products/collections/collectionConfig";


const TABS = [
  ["all", "All"],
  ["active", "Active"],
  ["inactive", "Inactive"],
  ["manual", "Manual"],
  ["automated", "Automated"],
];


const AdminCollections = () => {

  const [
    collections,
    setCollections,
  ] = useState([]);

  const [
    stats,
    setStats,
  ] = useState({
    total: 0,
    active: 0,
    manual: 0,
    automated: 0,
    assigned_products: 0,
  });

  const [
    activeTab,
    setActiveTab,
  ] = useState("all");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    deleting,
    setDeleting,
  ] = useState(null);


  /*
  |--------------------------------------------------------------------------
  | FETCH
  |--------------------------------------------------------------------------
  */

  const fetchCollections =
    useCallback(
      async () => {

        try {

          setLoading(true);


          const response =
            await api.get(
              COLLECTION_API.index,
              {
                params: {
                  tab:
                    activeTab,

                  search:
                    search.trim(),
                },
              }
            );


          setCollections(
            response.data
              ?.collections
              ?.data ||
            []
          );


          setStats({
            total:
              response.data
                ?.stats?.total ||
              0,

            active:
              response.data
                ?.stats?.active ||
              0,

            manual:
              response.data
                ?.stats?.manual ||
              0,

            automated:
              response.data
                ?.stats
                ?.automated ||
              0,

            assigned_products:
              response.data
                ?.stats
                ?.assigned_products ||
              0,
          });

        } catch (error) {

          console.error(
            error
          );

          setCollections([]);

        } finally {

          setLoading(false);

        }

      },
      [
        activeTab,
        search,
      ]
    );


  useEffect(() => {

    const timer =
      setTimeout(
        fetchCollections,
        250
      );


    return () =>
      clearTimeout(timer);

  }, [
    fetchCollections,
  ]);


  /*
  |--------------------------------------------------------------------------
  | DELETE
  |--------------------------------------------------------------------------
  */

  const handleDelete =
    async (
      collection
    ) => {

      if (
        !window.confirm(
          `Delete "${collection.title}" collection?`
        )
      ) {

        return;

      }


      try {

        setDeleting(
          collection.id
        );


        await api.delete(
          COLLECTION_API.delete(
            collection.id
          )
        );


        await fetchCollections();

      } catch (error) {

        window.alert(
          error.response?.data
            ?.message ||
          "Unable to delete collection."
        );

      } finally {

        setDeleting(null);

      }

    };


  return (
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

        {/* STATS */}

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
            title="Total Collections"
            value={stats.total}
            text="All collection records"
            icon={<Layers3 size={18} />}
          />


          <Stat
            title="Active Collections"
            value={stats.active}
            text="Visible collections"
            icon={<Boxes size={18} />}
          />


          <Stat
            title="Manual Collections"
            value={stats.manual}
            text="Products selected manually"
            icon={<Archive size={18} />}
          />


          <Stat
            title="Automated Collections"
            value={stats.automated}
            text="Products added by rules"
            icon={<Layers3 size={18} />}
          />


          <Stat
            title="Assigned Products"
            value={
              stats.assigned_products
            }
            text="Products in collections"
            icon={<Boxes size={18} />}
            last
          />

        </div>


        {/* MAIN */}

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

          <div
            className="
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
              Collections
            </h1>


            <Link
              to={
                COLLECTION_ROUTES.create
              }

              className="
                h-[38px]
                px-[15px]

                rounded-[9px]

                bg-[#2065D1]
                text-white

                flex
                items-center
                gap-[6px]

                text-[12px]
                font-semibold
              "
            >

              <Plus size={15} />

              Add Collection

            </Link>

          </div>


          <div
            className="
              mt-[16px]

              rounded-[12px]

              border
              border-[#dedfe2]

              overflow-hidden
            "
          >

            {/* TABS */}

            <div
              className="
                h-[54px]

                px-[16px]

                border-b
                border-[#e4e5e8]

                flex
                items-center
                gap-[22px]
              "
            >

              {TABS.map(
                ([key, label]) => (

                  <button
                    key={key}

                    type="button"

                    onClick={() =>
                      setActiveTab(
                        key
                      )
                    }

                    className={`
                      relative
                      h-full

                      text-[12px]

                      ${
                        activeTab ===
                        key
                          ? "text-[#111] font-semibold"
                          : "text-[#6d7279]"
                      }
                    `}
                  >

                    {label}


                    {activeTab ===
                      key && (

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


            {/* SEARCH */}

            <div
              className="
                px-[16px]
                py-[10px]

                border-b
                border-[#e4e5e8]
              "
            >

              <div
                className="
                  relative
                  max-w-[500px]
                "
              >

                <Search
                  size={15}

                  className="
                    absolute
                    left-[12px]
                    top-[11px]

                    text-[#999]
                  "
                />


                <input
                  value={search}

                  onChange={(e) =>
                    setSearch(
                      e.target.value
                    )
                  }

                  placeholder="Search collections..."

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

            </div>


            {/* TABLE */}

            <div
              className="
                overflow-x-auto
              "
            >

              <table
                className="
                  w-full
                  min-w-[850px]
                "
              >

                <thead>

                  <tr
                    className="
                      border-b
                      border-[#e4e5e8]
                    "
                  >

                    <Th>
                      Collection
                    </Th>

                    <Th>
                      Type
                    </Th>

                    <Th>
                      Products
                    </Th>

                    <Th>
                      Status
                    </Th>

                    <Th>
                      Publishing
                    </Th>

                    <Th right>
                      Actions
                    </Th>

                  </tr>

                </thead>


                <tbody>

                  {loading ? (

                    <tr>

                      <td
                        colSpan={6}

                        className="
                          h-[180px]
                        "
                      >

                        <LoaderCircle
                          size={24}

                          className="
                            mx-auto

                            animate-spin
                            text-[#2065D1]
                          "
                        />

                      </td>

                    </tr>

                  ) : collections.length ===
                    0 ? (

                    <tr>

                      <td
                        colSpan={6}

                        className="
                          py-[60px]

                          text-center

                          text-[12px]
                          text-[#777]
                        "
                      >
                        No collections found.
                      </td>

                    </tr>

                  ) : (

                    collections.map(
                      (collection) => (

                        <tr
                          key={
                            collection.id
                          }

                          className="
                            border-b
                            border-[#eceef0]

                            last:border-0
                          "
                        >

                          <td
                            className="
                              px-[16px]
                              py-[13px]
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
                                  w-[45px]
                                  h-[45px]

                                  rounded-[9px]

                                  border
                                  border-[#e5e6e8]

                                  bg-[#f7f7f7]

                                  overflow-hidden

                                  shrink-0
                                "
                              >

                                {collection.image_url && (

                                  <img
                                    src={
                                      collection.image_url
                                    }

                                    alt={
                                      collection.title
                                    }

                                    className="
                                      w-full
                                      h-full

                                      object-cover
                                    "
                                  />

                                )}

                              </div>


                              <div>

                                <p
                                  className="
                                    text-[12px]
                                    font-semibold
                                  "
                                >
                                  {
                                    collection.title
                                  }
                                </p>


                                <p
                                  className="
                                    mt-[2px]

                                    text-[10px]
                                    text-[#777]
                                  "
                                >
                                  /{
                                    collection.slug
                                  }
                                </p>

                              </div>

                            </div>

                          </td>


                          <td
                            className="
                              px-[16px]
                              py-[13px]

                              text-[12px]
                              capitalize
                            "
                          >
                            {
                              collection.collection_type
                            }
                          </td>


                          <td
                            className="
                              px-[16px]
                              py-[13px]

                              text-[12px]
                            "
                          >
                            {
                              collection.products_count ||
                              0
                            }
                          </td>


                          <td
                            className="
                              px-[16px]
                              py-[13px]
                            "
                          >

                            <StatusBadge
                              status={
                                collection.status
                              }
                            />

                          </td>


                          <td
                            className="
                              px-[16px]
                              py-[13px]
                            "
                          >

                            <div
                              className="
                                flex
                                gap-[5px]
                                flex-wrap
                              "
                            >

                              {collection.online_store && (

                                <SmallBadge>
                                  Online
                                </SmallBadge>

                              )}


                              {collection.point_of_sale && (

                                <SmallBadge>
                                  POS
                                </SmallBadge>

                              )}

                            </div>

                          </td>


                          <td
                            className="
                              px-[16px]
                              py-[13px]
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

                                  rounded-[8px]

                                  border
                                  border-[#dedfe2]

                                  overflow-hidden
                                "
                              >

                                <Link
                                  to={
                                    COLLECTION_ROUTES.edit(
                                      collection.id
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

                                    text-[#777]

                                    hover:text-[#2065D1]
                                  "
                                >

                                  <Pencil
                                    size={14}
                                  />

                                </Link>


                                <button
                                  type="button"

                                  onClick={() =>
                                    handleDelete(
                                      collection
                                    )
                                  }

                                  className="
                                    w-[32px]
                                    h-[32px]

                                    flex
                                    items-center
                                    justify-center

                                    text-[#777]

                                    hover:bg-red-50
                                    hover:text-red-500
                                  "
                                >

                                  {deleting ===
                                  collection.id ? (

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
  );

};


const Stat = ({
  title,
  value,
  text,
  icon,
  last,
}) => (

  <div
    className={`
      min-h-[120px]

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
            mt-[8px]

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


const Th = ({
  children,
  right,
}) => (

  <th
    className={`
      px-[16px]
      py-[14px]

      text-[11px]
      font-medium

      text-[#666]

      ${
        right
          ? "text-right"
          : "text-left"
      }
    `}
  >
    {children}
  </th>

);


const StatusBadge = ({
  status,
}) => (

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
        status === "active"
          ? "bg-[#2065D1] text-white"
          : "bg-[#eceef1] text-[#666]"
      }
    `}
  >
    {status}
  </span>

);


const SmallBadge = ({
  children,
}) => (

  <span
    className="
      rounded-full

      bg-[#eef3ff]
      text-[#2065D1]

      px-[8px]
      py-[3px]

      text-[9px]
      font-medium
    "
  >
    {children}
  </span>

);


export default AdminCollections;