import {
  useEffect,
  useState,
} from "react";

import {
  NavLink,
  useLocation,
} from "react-router-dom";

import {
  LayoutGrid,
  BarChart3,
  ClipboardList,
  Box,
  Sparkles,
  Bot,
  Users,
  Store,
  UserCog,
  WalletCards,
  Percent,
  FileText,
  MessageSquare,
  ShoppingBag,
  Monitor,
  Settings,
  ChevronDown,
  ChevronRight,
} from "lucide-react";


const AdminSidebar = () => {

  const location = useLocation();


  /*
  |--------------------------------------------------------------------------
  | PRODUCTS TOGGLE
  |--------------------------------------------------------------------------
  */

  const isProductsRoute =
    location.pathname.startsWith(
      "/admin/products"
    );


  const [
    productsOpen,
    setProductsOpen,
  ] = useState(isProductsRoute);


  /*
  |--------------------------------------------------------------------------
  | ONLINE STORE TOGGLE
  |--------------------------------------------------------------------------
  */

  const isOnlineStoreRoute =
    location.pathname.startsWith(
      "/admin/online-store"
    );


  const [
    onlineStoreOpen,
    setOnlineStoreOpen,
  ] = useState(isOnlineStoreRoute);


  /*
  |--------------------------------------------------------------------------
  | AUTO OPEN BASED ON CURRENT ROUTE
  |--------------------------------------------------------------------------
  */

  useEffect(() => {

    if (isProductsRoute) {
      setProductsOpen(true);
    }

  }, [isProductsRoute]);


  useEffect(() => {

    if (isOnlineStoreRoute) {
      setOnlineStoreOpen(true);
    }

  }, [isOnlineStoreRoute]);


  /*
  |--------------------------------------------------------------------------
  | MAIN NAV ITEM CLASS
  |--------------------------------------------------------------------------
  */

  const navItemClass = ({
    isActive,
  }) => {

    return `
      min-h-[42px]
      px-[14px]
      rounded-[10px]
      flex
      items-center
      gap-[11px]

      text-[14px]
      font-medium

      transition-all
      duration-150

      ${
        isActive
          ? "bg-[#edf3ff] text-[#2065D1]"
          : "text-[#4d5562] hover:bg-[#f5f6f8] hover:text-[#111827]"
      }
    `;

  };


  /*
  |--------------------------------------------------------------------------
  | SUB MENU CLASS
  |--------------------------------------------------------------------------
  */

  const subMenuClass = ({
    isActive,
  }) => {

    return `
      relative
      min-h-[35px]
      px-[12px]
      rounded-[9px]

      flex
      items-center

      text-[13px]
      font-medium

      transition-all
      duration-150

      ${
        isActive
          ? "bg-[#eeeeef] text-[#222]"
          : "text-[#74777d] hover:bg-[#f5f5f6] hover:text-[#222]"
      }
    `;

  };


  return (
    <aside
      className="
        w-[230px]
        min-w-[230px]
        h-screen
        sticky
        top-0

        bg-white
        border-r
        border-[#e7e8eb]

        flex
        flex-col

        font-['Inter']
      "
    >

      {/* =====================================================
          LOGO
      ====================================================== */}

      <div
        className="
          h-[74px]
          px-[20px]
          flex
          items-center
          border-b
          border-[#eeeeef]
          shrink-0
        "
      >

        <NavLink
          to="/admin/dashboard"
          className="
            flex
            items-center
            gap-[9px]
          "
        >

          <div
            className="
              w-[29px]
              h-[33px]
              rounded-[7px]
              border-2
              border-[#4d83ed]
              text-[#2065D1]

              flex
              items-center
              justify-center

              text-[17px]
              font-semibold
            "
          >
            S
          </div>


          <span
            className="
              text-[21px]
              font-bold
              tracking-[-0.7px]
              text-[#2065D1]
            "
          >
            Storify
          </span>

        </NavLink>

      </div>


      {/* =====================================================
          SCROLLABLE MENU
      ====================================================== */}

      <div
        className="
          flex-1
          overflow-y-auto
          px-[12px]
          py-[14px]

          scrollbar-thin
          scrollbar-thumb-[#b6b7ba]
          scrollbar-track-transparent
        "
      >

        <nav className="space-y-[3px]">


          {/* OVERVIEW */}

          <NavLink
            to="/admin/dashboard"
            className={navItemClass}
          >

            <LayoutGrid size={18} />

            <span>Overview</span>

          </NavLink>


          {/* ANALYTICS */}

          <NavLink
            to="/admin/analytics"
            className={navItemClass}
          >

            <BarChart3 size={18} />

            <span>Analytics</span>

          </NavLink>


          {/* ORDERS */}

          <NavLink
            to="/admin/orders"
            className={navItemClass}
          >

            <ClipboardList size={18} />

            <span className="flex-1">
              Orders
            </span>

            <ChevronRight size={16} />

          </NavLink>


          {/* =================================================
              PRODUCTS
          ================================================== */}

          <div>

            <button
              type="button"
              onClick={() =>
                setProductsOpen(
                  (prev) => !prev
                )
              }
              className={`
                w-full
                min-h-[42px]
                px-[14px]
                rounded-[10px]

                flex
                items-center
                gap-[11px]

                text-[14px]
                font-medium

                transition-all
                duration-150

                ${
                  isProductsRoute
                    ? "bg-[#f5f5f5] text-[#111]"
                    : "text-[#4d5562] hover:bg-[#f5f6f8] hover:text-[#111827]"
                }
              `}
            >

              <Box size={18} />

              <span className="flex-1 text-left">
                Products
              </span>


              <ChevronDown
                size={16}
                className={`
                  transition-transform
                  duration-200

                  ${
                    productsOpen
                      ? "rotate-0"
                      : "-rotate-90"
                  }
                `}
              />

            </button>


            {/* PRODUCT SUB MENU */}

            <div
              className={`
                grid
                transition-all
                duration-200
                ease-in-out

                ${
                  productsOpen
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }
              `}
            >

              <div className="overflow-hidden">

                <div
                  className="
                    relative
                    ml-[31px]
                    mt-[5px]
                    pl-[12px]
                    pb-[4px]
                    space-y-[1px]

                    border-l
                    border-[#dedfe2]
                  "
                >

                  <ProductSubItem
                    to="/admin/products"
                    label="All Products"
                    end
                    className={subMenuClass}
                  />


                  <ProductSubItem
                    to="/admin/products/global-variants"
                    label="Global Variants"
                    className={subMenuClass}
                  />


                  <ProductSubItem
                    to="/admin/products/collections"
                    label="Collections"
                    className={subMenuClass}
                  />


                  <ProductSubItem
                    to="/admin/products/categories"
                    label="Categories"
                    className={subMenuClass}
                  />


                  <ProductSubItem
                    to="/admin/products/brands"
                    label="Brands"
                    className={subMenuClass}
                  />


                  <ProductSubItem
                    to="/admin/products/inventory"
                    label="Inventory"
                    className={subMenuClass}
                  />


                  <ProductSubItem
                    to="/admin/products/transfers"
                    label="Transfers"
                    className={subMenuClass}
                  />


                  <ProductSubItem
                    to="/admin/products/reviews"
                    label="Reviews"
                    className={subMenuClass}
                  />

                </div>

              </div>

            </div>

          </div>


          {/* AI STUDIO */}

          <NavLink
            to="/admin/ai-studio"
            className={navItemClass}
          >

            <Sparkles size={18} />

            <span>AI Studio</span>

          </NavLink>


          {/* SALES AGENT */}

          <NavLink
            to="/admin/sales-agent"
            className={navItemClass}
          >

            <Bot size={18} />

            <span>Sales Agent</span>

          </NavLink>


          {/* CUSTOMERS */}

          <NavLink
            to="/admin/customers"
            className={navItemClass}
          >

            <Users size={18} />

            <span>Customers</span>

          </NavLink>


          {/* VENDORS */}

          <NavLink
            to="/admin/vendors"
            className={navItemClass}
          >

            <Store size={18} />

            <span className="flex-1">
              Vendors
            </span>

            <ChevronRight size={16} />

          </NavLink>


          {/* STAFF */}

          <NavLink
            to="/admin/staff"
            className={navItemClass}
          >

            <UserCog size={18} />

            <span>Staff</span>

          </NavLink>


          {/* PAYMENTS */}

          <NavLink
            to="/admin/payments"
            className={navItemClass}
          >

            <WalletCards size={18} />

            <span className="flex-1">
              Payments
            </span>

            <ChevronRight size={16} />

          </NavLink>


          {/* DISCOUNTS */}

          <NavLink
            to="/admin/discounts"
            className={navItemClass}
          >

            <Percent size={18} />

            <span>Discounts</span>

          </NavLink>


          {/* CONTENT */}

          <NavLink
            to="/admin/content"
            className={navItemClass}
          >

            <FileText size={18} />

            <span className="flex-1">
              Content
            </span>

            <ChevronRight size={16} />

          </NavLink>


          {/* INBOX */}

          <NavLink
            to="/admin/inbox"
            className={navItemClass}
          >

            <MessageSquare size={18} />

            <span>Inbox</span>

          </NavLink>

        </nav>


        {/* =====================================================
            SALES CHANNELS
        ====================================================== */}

        <div
          className="
            mt-[28px]
            mb-[8px]
            px-[10px]

            text-[10px]
            font-semibold
            tracking-[0.12em]
            text-[#a1a4aa]
          "
        >
          SALES CHANNELS
        </div>


        {/* =====================================================
            ONLINE STORE
        ====================================================== */}

        <div>

          <button
            type="button"
            onClick={() =>
              setOnlineStoreOpen(
                (prev) => !prev
              )
            }
            className={`
              w-full
              min-h-[42px]
              px-[14px]
              rounded-[10px]

              flex
              items-center
              gap-[11px]

              text-[14px]
              font-medium

              transition-all

              ${
                isOnlineStoreRoute
                  ? "bg-[#eaf1ff] text-[#2065D1]"
                  : "text-[#4d5562] hover:bg-[#f5f6f8]"
              }
            `}
          >

            <ShoppingBag size={18} />

            <span className="flex-1 text-left">
              Online Store
            </span>


            <ChevronDown
              size={16}
              className={`
                transition-transform
                duration-200

                ${
                  onlineStoreOpen
                    ? "rotate-0"
                    : "-rotate-90"
                }
              `}
            />

          </button>


          <div
            className={`
              grid
              transition-all
              duration-200

              ${
                onlineStoreOpen
                  ? "grid-rows-[1fr] opacity-100"
                  : "grid-rows-[0fr] opacity-0"
              }
            `}
          >

            <div className="overflow-hidden">

              <div
                className="
                  ml-[31px]
                  mt-[5px]
                  pl-[12px]
                  pb-[4px]
                  border-l
                  border-[#dedfe2]
                  space-y-[1px]
                "
              >

                <NavLink
                  to="/admin/online-store/themes"
                  className={subMenuClass}
                >
                  Themes
                </NavLink>


                <NavLink
                  to="/admin/online-store/home-page"
                  className={subMenuClass}
                >
                  Home
                </NavLink>


                <NavLink
                  to="/admin/online-store/pages"
                  className={subMenuClass}
                >
                  Pages
                </NavLink>


                <NavLink
                  to="/admin/online-store/menus"
                  className={subMenuClass}
                >
                  Menus
                </NavLink>

              </div>

            </div>

          </div>

        </div>


        {/* POINT OF SALE */}

        <NavLink
          to="/admin/point-of-sale"
          className={navItemClass}
        >

          <Monitor size={18} />

          <span>Point of Sale</span>

        </NavLink>

      </div>


      {/* =====================================================
          SETTINGS
      ====================================================== */}

      <div
        className="
          shrink-0
          px-[12px]
          py-[12px]
          border-t
          border-[#eeeeef]
          bg-white
        "
      >

        <NavLink
          to="/admin/settings"
          className={navItemClass}
        >

          <Settings size={18} />

          <span>Settings</span>

        </NavLink>

      </div>

    </aside>
  );
};


/* ==========================================================================
   PRODUCT SUB ITEM
============================================================================ */

const ProductSubItem = ({
  to,
  label,
  className,
  end = false,
}) => {

  return (
    <NavLink
      to={to}
      end={end}
      className={className}
    >
      {label}
    </NavLink>
  );

};


export default AdminSidebar;