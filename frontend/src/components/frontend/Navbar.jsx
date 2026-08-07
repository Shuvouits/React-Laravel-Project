import { useState } from "react";
import { Link, NavLink } from "react-router-dom";

const Navbar = () => {
  const [categoryOpen, setCategoryOpen] = useState(false);

  const menuClass = ({ isActive }) =>
    `
      text-[14px]
      font-normal
      whitespace-nowrap
      transition-colors
      duration-200
      ${
        isActive
          ? "text-[#2065D1]"
          : "text-[#333333] hover:text-[#2065D1]"
      }
    `;

  return (
    <header className="w-full bg-white border-b border-[#eeeeee] shadow-[0_2px_10px_rgba(0,0,0,0.03)] font-['Inter']">
      <div className="max-w-[1280px] mx-auto px-5">

        {/* =====================================================
            TOP NAVBAR
        ====================================================== */}
        <div className="h-[62px] flex items-center gap-8">

          {/* ================= LOGO ================= */}
          <Link to="/" className="flex items-center shrink-0">
            <div className="flex items-center gap-[8px]">

              <div className="relative w-[31px] h-[34px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#27b4f5] via-[#6378f7] to-[#b54df5] rounded-[7px]" />

                <div className="absolute inset-[3px] bg-white rounded-[5px] flex items-center justify-center">
                  <span className="text-[18px] font-bold bg-gradient-to-r from-[#337bea] to-[#8554ee] bg-clip-text text-transparent">
                    S
                  </span>
                </div>

                <span className="absolute -top-[3px] left-[7px] w-[5px] h-[5px] rounded-full bg-[#ffd93d]" />
              </div>

              <span className="text-[22px] font-bold tracking-[-0.7px] text-[#3478ea]">
                Storify
              </span>
            </div>
          </Link>


          {/* ================= SEARCH ================= */}
          <div className="flex-1">
            <div
              className="
                w-full
                h-[38px]
                border
                border-[#dddddd]
                rounded-full
                flex
                items-center
                px-[15px]
                bg-white
                transition-all
                duration-200
                focus-within:border-[#2065D1]
                focus-within:ring-[2px]
                focus-within:ring-[#2065D1]/10
              "
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-[#181818] shrink-0"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>

              <input
                type="text"
                placeholder="Search products..."
                className="
                  w-full
                  h-full
                  bg-transparent
                  outline-none
                  border-none
                  px-3
                  text-[14px]
                  font-normal
                  text-[#252525]
                  placeholder:text-[#666666]
                "
              />

              <button
                type="button"
                aria-label="Search"
                className="
                  w-[27px]
                  h-[27px]
                  shrink-0
                  rounded-full
                  bg-[#6957e9]
                  hover:bg-[#2065D1]
                  text-white
                  flex
                  items-center
                  justify-center
                  transition-colors
                  duration-200
                "
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 4V20M4 12H20"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />

                  <path
                    d="M18.5 5.5L19.5 4.5M18.5 18.5L19.5 19.5M5.5 5.5L4.5 4.5M5.5 18.5L4.5 19.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>


          {/* ================= RIGHT SIDE ================= */}
          <div className="flex items-center gap-[25px] shrink-0">

            {/* Dark Mode */}
            <button
              type="button"
              aria-label="Dark mode"
              className="text-[#191919] hover:text-[#2065D1] transition-colors duration-200"
            >
              <svg
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9" />
              </svg>
            </button>


            {/* =================================================
                LOGIN / USER DROPDOWN
            ================================================== */}
            <div className="relative group">

              {/* Trigger */}
              <div className="flex items-center gap-[9px] cursor-pointer py-[10px]">

                <div className="text-[#181818] group-hover:text-[#2065D1] transition-colors duration-200">
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21a8 8 0 0 0-16 0" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                <div className="leading-[1.15]">
                  <p className="text-[11px] font-normal text-[#777777]">
                    Welcome
                  </p>

                  <p
                    className="
                      text-[13px]
                      font-medium
                      text-[#171717]
                      whitespace-nowrap
                      group-hover:text-[#2065D1]
                      transition-colors
                      duration-200
                    "
                  >
                    Login / Register
                  </p>
                </div>

                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="
                    text-[#777777]
                    transition-all
                    duration-200
                    group-hover:rotate-180
                    group-hover:text-[#2065D1]
                  "
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </div>


              {/* Hover Bridge */}
              <div
                className="
                  absolute
                  top-full
                  right-0
                  w-[315px]
                  h-[10px]
                  invisible
                  group-hover:visible
                "
              />


              {/* Dropdown */}
              <div
                className="
                  absolute
                  right-0
                  top-[52px]
                  z-[100]
                  w-[315px]
                  bg-white
                  rounded-[28px]
                  px-[22px]
                  pt-[17px]
                  pb-[20px]
                  shadow-[0_10px_40px_rgba(0,0,0,0.12)]
                  border
                  border-[#f0f0f0]

                  opacity-0
                  invisible
                  translate-y-[-5px]

                  group-hover:opacity-100
                  group-hover:visible
                  group-hover:translate-y-0

                  transition-all
                  duration-200
                "
              >

                {/* SIGN IN */}
                <Link
                  to="/login"
                  className="
                    w-full
                    h-[42px]
                    rounded-full
                    bg-[#2065D1]
                    hover:bg-[#1858bb]
                    text-white
                    text-[14px]
                    font-semibold
                    flex
                    items-center
                    justify-center
                    transition-colors
                    duration-200
                  "
                >
                  Sign in
                </Link>


                {/* REGISTER */}
                <Link
                  to="/register"
                  className="
                    h-[47px]
                    flex
                    items-center
                    justify-center
                    text-[15px]
                    font-normal
                    text-[#555555]
                    hover:text-[#2065D1]
                    transition-colors
                    duration-200
                  "
                >
                  Register
                </Link>


                <div className="w-full h-px bg-[#dddddd] mb-[10px]" />


                <DropdownItem to="/dashboard">
                  <DashboardIcon />
                  <span>Dashboard</span>
                </DropdownItem>

                <DropdownItem to="/orders">
                  <OrderIcon />
                  <span>My Orders</span>
                </DropdownItem>

                <DropdownItem to="/wishlist">
                  <WishlistIcon />
                  <span>Wishlist</span>
                </DropdownItem>

                <DropdownItem to="/profile">
                  <ProfileIcon />
                  <span>Profile</span>
                </DropdownItem>

              </div>
            </div>


            {/* ================= CART ================= */}
            <Link
              to="/cart"
              className="relative text-[#111111] hover:text-[#2065D1] transition-colors duration-200"
              aria-label="Shopping cart"
            >
              <svg
                width="25"
                height="25"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="20" r="1" />
                <circle cx="19" cy="20" r="1" />
                <path d="M3 4h2l2.5 11h11l2-8H6" />
              </svg>

              <span
                className="
                  absolute
                  -top-[10px]
                  -right-[9px]
                  min-w-[19px]
                  h-[19px]
                  px-[4px]
                  rounded-full
                  bg-[#2065D1]
                  text-white
                  text-[10px]
                  font-semibold
                  flex
                  items-center
                  justify-center
                "
              >
                8
              </span>
            </Link>

          </div>
        </div>


        {/* =====================================================
            SECOND NAVBAR
        ====================================================== */}
        <div className="h-[58px] flex items-center justify-between">

          {/* LEFT MENU */}
          <nav className="flex items-center gap-[28px]">

            {/* ================= ALL CATEGORIES ================= */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoryOpen((prev) => !prev)}
                className="
                  min-w-[214px]
                  h-[42px]
                  px-[17px]
                  rounded-full
                  bg-[#f7f7f7]
                  hover:bg-[#f1f1f1]
                  flex
                  items-center
                  justify-between
                  transition-colors
                  duration-200
                "
              >
                <div className="flex items-center gap-[12px]">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    className="text-[#222222]"
                  >
                    <path d="M4 6h16" />
                    <path d="M4 12h16" />
                    <path d="M4 18h16" />
                  </svg>

                  <span className="text-[14px] font-medium text-[#222222]">
                    All Categories
                  </span>
                </div>

                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={`
                    transition-transform
                    duration-200
                    ${categoryOpen ? "rotate-180" : ""}
                  `}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>


              {/* Category Dropdown */}
              {categoryOpen && (
                <div
                  className="
                    absolute
                    left-0
                    top-[48px]
                    z-[100]
                    w-[235px]
                    py-2
                    bg-white
                    rounded-[12px]
                    border
                    border-[#eeeeee]
                    shadow-[0_12px_30px_rgba(0,0,0,0.10)]
                  "
                >
                  <CategoryLink
                    to="/category/accessories"
                    onClick={() => setCategoryOpen(false)}
                  >
                    Accessories
                  </CategoryLink>

                  <CategoryLink
                    to="/category/bags"
                    onClick={() => setCategoryOpen(false)}
                  >
                    Bags
                  </CategoryLink>

                  <CategoryLink
                    to="/category/cameras"
                    onClick={() => setCategoryOpen(false)}
                  >
                    Cameras
                  </CategoryLink>

                  <CategoryLink
                    to="/category/furniture"
                    onClick={() => setCategoryOpen(false)}
                  >
                    Furniture
                  </CategoryLink>

                  <CategoryLink
                    to="/category/headphones"
                    onClick={() => setCategoryOpen(false)}
                  >
                    Headphones
                  </CategoryLink>

                  <CategoryLink
                    to="/category/shoes"
                    onClick={() => setCategoryOpen(false)}
                  >
                    Shoes
                  </CategoryLink>

                  <CategoryLink
                    to="/category/smart-watches"
                    onClick={() => setCategoryOpen(false)}
                  >
                    Smart Watches
                  </CategoryLink>

                  <CategoryLink
                    to="/category/electronics"
                    onClick={() => setCategoryOpen(false)}
                  >
                    Electronics
                  </CategoryLink>
                </div>
              )}
            </div>


            {/* COLLECTIONS */}
            <NavLink
              to="/collections"
              className={({ isActive }) =>
                `
                  flex
                  items-center
                  gap-[4px]
                  text-[14px]
                  font-semibold
                  whitespace-nowrap
                  transition-colors
                  duration-200

                  ${
                    isActive
                      ? "text-[#2065D1]"
                      : "text-[#222222] hover:text-[#2065D1]"
                  }
                `
              }
            >
              Collections

              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </NavLink>


            <NavLink to="/brands" className={menuClass}>
              Brands
            </NavLink>

            <NavLink to="/pre-order" className={menuClass}>
              Pre-order
            </NavLink>

            <NavLink to="/products" className={menuClass}>
              Products
            </NavLink>

          </nav>


          {/* ================= RIGHT MENU ================= */}
          <nav className="flex items-center gap-[25px]">

            {/* Track Order */}
            <NavLink
              to="/track-order"
              className={({ isActive }) =>
                `
                  flex
                  items-center
                  gap-[8px]
                  text-[14px]
                  whitespace-nowrap
                  transition-colors
                  duration-200

                  ${
                    isActive
                      ? "text-[#2065D1]"
                      : "text-[#333333] hover:text-[#2065D1]"
                  }
                `
              }
            >
              <svg
                width="17"
                height="17"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
                <path d="m4 7.5 8 4.5 8-4.5" />
                <path d="M12 12v9" />
              </svg>

              Track Order
            </NavLink>


            {/* Blog */}
            <NavLink
              to="/blog"
              className={({ isActive }) =>
                `
                  flex
                  items-center
                  gap-[8px]
                  text-[14px]
                  whitespace-nowrap
                  transition-colors
                  duration-200

                  ${
                    isActive
                      ? "text-[#2065D1]"
                      : "text-[#333333] hover:text-[#2065D1]"
                  }
                `
              }
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              >
                <path d="M5 11a8 8 0 0 1 8 8" />
                <path d="M5 5a14 14 0 0 1 14 14" />
                <circle cx="5" cy="19" r="1" />
              </svg>

              Blog
            </NavLink>


            <NavLink to="/contact-us" className={menuClass}>
              Contact Us
            </NavLink>

            <NavLink to="/vendor/register" className={menuClass}>
              Become a Vendor
            </NavLink>

          </nav>
        </div>
      </div>
    </header>
  );
};


/* =========================================================
   CATEGORY LINK
========================================================= */

const CategoryLink = ({ to, children, onClick }) => {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="
        block
        px-[17px]
        py-[10px]
        text-[14px]
        text-[#333333]
        hover:text-[#2065D1]
        hover:bg-[#f8faff]
        transition-colors
        duration-150
      "
    >
      {children}
    </Link>
  );
};


/* =========================================================
   DROPDOWN ITEM
========================================================= */

const DropdownItem = ({ to, children }) => {
  return (
    <Link
      to={to}
      className="
        min-h-[43px]
        flex
        items-center
        gap-[11px]
        px-[4px]
        text-[14px]
        font-normal
        text-[#3e3e3e]
        hover:text-[#2065D1]
        transition-colors
        duration-200
      "
    >
      {children}
    </Link>
  );
};


/* =========================================================
   DROPDOWN ICONS
========================================================= */

const DashboardIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
  >
    <rect x="4" y="4" width="6" height="6" rx="1" />
    <rect x="14" y="4" width="6" height="6" rx="1" />
    <rect x="4" y="14" width="6" height="6" rx="1" />
    <rect x="14" y="14" width="6" height="6" rx="1" />
  </svg>
);


const OrderIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="m4 7.5 8 4.5 8-4.5" />
    <path d="M12 12v9" />
  </svg>
);


const WishlistIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.8 4.6c-1.5-1.5-4-1.5-5.5 0L12 7.9 8.7 4.6c-1.5-1.5-4-1.5-5.5 0s-1.5 4 0 5.5L12 18.9l8.8-8.8c1.5-1.5 1.5-4 0-5.5Z" />
  </svg>
);


const ProfileIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2" />
  </svg>
);


export default Navbar;