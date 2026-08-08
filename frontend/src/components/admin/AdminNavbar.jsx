import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../api/axios";

import {
  Search,
  ShoppingCart,
  Globe,
  Bell,
  LogOut,
  User,
  Settings,
  Menu,
} from "lucide-react";


const AdminNavbar = () => {

  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);


  /*
  |--------------------------------------------------------------------------
  | LOGGED IN USER
  |--------------------------------------------------------------------------
  */

  let user = null;

  try {

    const storedUser =
      localStorage.getItem("user");

    if (storedUser) {
      user = JSON.parse(storedUser);
    }

  } catch {
    user = null;
  }


  /*
  |--------------------------------------------------------------------------
  | LOGOUT
  |--------------------------------------------------------------------------
  */

  const handleLogout = async () => {

    if (logoutLoading) {
      return;
    }

    setLogoutLoading(true);

    try {

      await api.post("/auth/logout");

    } catch (error) {

      console.error(
        "Logout error:",
        error.response?.data || error.message
      );

    } finally {

      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setProfileOpen(false);

      navigate("/login", {
        replace: true,
      });

      setLogoutLoading(false);
    }
  };


  return (
    <header
      className="
        relative
        h-[74px]
        bg-white
        border-b
        border-[#e8e8ee]
        px-6
        flex
        items-center
        justify-between
        z-50
      "
    >

      {/* =============================
          LEFT
      ============================== */}

      <div className="flex items-center gap-4">

        <button
          type="button"
          className="
            w-[32px]
            h-[32px]
            rounded-[10px]
            border
            border-[#e6e8ef]
            flex
            items-center
            justify-center
            text-[#333]
            hover:bg-[#f7f8fc]
          "
        >
          <Menu size={17} />
        </button>


        <div className="relative w-[96px]">

          <Search
            size={16}
            className="
              absolute
              left-3
              top-1/2
              -translate-y-1/2
              text-[#9aa1b1]
            "
          />

          <input
            type="text"
            placeholder="⌘K"
            className="
              w-full
              h-[36px]
              rounded-full
              border
              border-[#e6e8ef]
              bg-[#fbfbfd]
              pl-9
              pr-3
              text-[13px]
              text-[#444]
              outline-none
            "
          />

        </div>

      </div>


      {/* =============================
          CENTER
      ============================== */}

      <div className="flex items-center gap-3">

        <button
          type="button"
          className="
            h-[36px]
            px-4
            rounded-full
            border
            border-[#dbe5fb]
            bg-[#f4f8ff]
            text-[#2f6bdb]
            text-[14px]
            font-medium
            flex
            items-center
            gap-2
          "
        >

          <ShoppingCart size={16} />

          POS

        </button>


        <button
          type="button"
          className="
            h-[36px]
            px-4
            rounded-full
            border
            border-[#e6e8ef]
            bg-white
            text-[#222]
            text-[14px]
            font-medium
            flex
            items-center
            gap-2
          "
        >

          <Globe size={16} />

          Browse Website

        </button>

      </div>


      {/* =============================
          RIGHT
      ============================== */}

      <div className="flex items-center gap-4">

        <img
          src="https://flagcdn.com/us.svg"
          alt="US Flag"
          className="
            w-[22px]
            h-[16px]
            rounded-[2px]
            object-cover
          "
        />


        {/* Notification */}

        <button
          type="button"
          className="
            relative
            text-[#666]
            hover:text-[#111]
          "
        >

          <Bell size={19} />

          <span
            className="
              absolute
              -top-2
              -right-2
              min-w-[18px]
              h-[18px]
              px-1
              rounded-full
              bg-[#ff4d4f]
              text-white
              text-[10px]
              font-semibold
              flex
              items-center
              justify-center
            "
          >
            9+
          </span>

        </button>


        {/* =============================
            PROFILE
        ============================== */}

        <div className="relative">

          <button
            type="button"
            onClick={() =>
              setProfileOpen(
                (prev) => !prev
              )
            }
          >

            <div
              className="
                w-[36px]
                h-[36px]
                rounded-full
                overflow-hidden
                border
                border-[#ececf1]
                bg-[#f1f3f8]
                flex
                items-center
                justify-center
              "
            >

              <img
                src="https://i.pravatar.cc/100?img=12"
                alt="Admin Avatar"
                className="w-full h-full object-cover"
              />

            </div>

          </button>


          {/* =============================
              PROFILE DROPDOWN
          ============================== */}

          {profileOpen && (

            <div
              className="
                absolute
                right-0
                top-[48px]
                z-[100]
                w-[220px]
                rounded-[20px]
                border
                border-[#ececf2]
                bg-white
                shadow-[0_18px_35px_rgba(17,24,39,0.12)]
                overflow-hidden
              "
            >

              {/* User */}

              <div className="px-4 py-4 border-b border-[#ececf2]">

                <p className="text-[16px] font-semibold text-[#222]">
                  {user?.name || "Admin"}
                </p>

                <p className="text-[13px] text-[#7a8191]">
                  {user?.email || ""}
                </p>

              </div>


              {/* Actions */}

              <div className="py-1">

                <DropdownItem
                  icon={User}
                  label="Profile"
                />

                <DropdownItem
                  icon={Settings}
                  label="Settings"
                />

              </div>


              {/* Logout */}

              <div className="border-t border-[#ececf2] py-1">

                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="
                    w-full
                    px-4
                    h-[42px]
                    flex
                    items-center
                    gap-3
                    text-[15px]
                    text-[#ef4444]
                    hover:bg-[#fff5f5]
                    transition-colors
                    disabled:opacity-60
                    disabled:cursor-not-allowed
                  "
                >

                  {logoutLoading ? (
                    <>

                      <span
                        className="
                          w-[16px]
                          h-[16px]
                          rounded-full
                          border-2
                          border-red-200
                          border-t-[#ef4444]
                          animate-spin
                        "
                      />

                      Logging out...

                    </>
                  ) : (
                    <>

                      <LogOut
                        size={17}
                        strokeWidth={1.9}
                      />

                      Logout

                    </>
                  )}

                </button>

              </div>

            </div>

          )}

        </div>

      </div>

    </header>
  );
};


const DropdownItem = ({
  icon: Icon,
  label,
}) => {

  return (
    <button
      type="button"
      className="
        w-full
        px-4
        h-[42px]
        flex
        items-center
        gap-3
        text-[15px]
        text-[#333b4a]
        hover:bg-[#f8f9fc]
        transition-colors
      "
    >

      <Icon
        size={17}
        strokeWidth={1.9}
      />

      {label}

    </button>
  );
};


export default AdminNavbar;