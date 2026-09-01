import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

import api from "../../api/axios";

const AdminNavbar = () => {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");

      return storedUser
        ? JSON.parse(storedUser)
        : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    fetchAdminProfile();

    const handleProfileUpdated = () => {
      fetchAdminProfile();
    };

    window.addEventListener(
      "admin-profile-updated",
      handleProfileUpdated
    );

    return () => {
      window.removeEventListener(
        "admin-profile-updated",
        handleProfileUpdated
      );
    };
  }, []);

  const fetchAdminProfile = async () => {
    try {
      const response = await api.get(
        "/admin/profile"
      );

      const profile =
        response.data?.user ||
        response.data?.admin ||
        response.data?.profile ||
        response.data?.data ||
        response.data;

      if (
        !profile ||
        typeof profile !== "object"
      ) {
        return;
      }

      setUser(profile);
      setAvatarError(false);

      localStorage.setItem(
        "user",
        JSON.stringify(profile)
      );
    } catch (error) {
      console.error(
        "Admin profile fetch error:",
        error.response?.data ||
        error.message
      );
    }
  };

  const handleProfile = () => {
    setProfileOpen(false);
    navigate("/admin/profile");
  };

  const handleSettings = () => {
    setProfileOpen(false);
    navigate("/admin/settings");
  };

  const handlePos = () => {
    navigate("/admin/pos");
  };

  const handleBrowseWebsite = () => {
    window.open(
      window.location.origin,
      "_blank",
      "noopener,noreferrer"
    );
  };

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
        error.response?.data ||
        error.message
      );
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      setProfileOpen(false);
      setLogoutLoading(false);

      navigate("/login", {
        replace: true,
      });
    }
  };

  const fullName = getAdminName(user);
  const avatarUrl = getAdminAvatar(user);
  const initials = getInitials(fullName);

  const roleName = formatRole(
    user?.role ||
    user?.user_role ||
    "admin"
  );

  return (
    <header className="relative z-50 flex h-[74px] items-center justify-between border-b border-[#e8e8ee] bg-white px-6">
      {/* Left */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Toggle sidebar"
          className="flex h-[32px] w-[32px] items-center justify-center rounded-[10px] border border-[#e6e8ef] text-[#333] transition-colors hover:bg-[#f7f8fc]"
        >
          <Menu size={17} />
        </button>

        <div className="relative w-[96px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9aa1b1]"
          />

          <input
            type="text"
            placeholder="⌘K"
            className="h-[36px] w-full rounded-full border border-[#e6e8ef] bg-[#fbfbfd] pb-0 pl-9 pr-3 pt-0 text-[13px] text-[#444] outline-none focus:border-[#2f6bdb]"
          />
        </div>
      </div>

      {/* Center */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePos}
          className="flex h-[36px] items-center gap-2 rounded-full border border-[#dbe5fb] bg-[#f4f8ff] px-4 text-[14px] font-medium text-[#2f6bdb] transition-colors hover:bg-[#eaf2ff]"
        >
          <ShoppingCart size={16} />
          POS
        </button>

        <button
          type="button"
          onClick={handleBrowseWebsite}
          className="flex h-[36px] items-center gap-2 rounded-full border border-[#e6e8ef] bg-white px-4 text-[14px] font-medium text-[#222] transition-colors hover:bg-[#f7f8fc]"
        >
          <Globe size={16} />
          Browse Website
        </button>
      </div>

      {/* Right */}
      <div className="flex items-center gap-4">
        <img
          src="https://flagcdn.com/us.svg"
          alt="US Flag"
          className="h-[16px] w-[22px] rounded-[2px] object-cover"
        />

        <button
          type="button"
          aria-label="Notifications"
          className="relative text-[#666] transition-colors hover:text-[#111]"
        >
          <Bell size={19} />

          <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff4d4f] px-1 text-[10px] font-semibold text-white">
            9+
          </span>
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen(
                (previous) => !previous
              );
            }}
            aria-label="Open profile menu"
            className="block rounded-full"
          >
            <AdminAvatar
              image={avatarUrl}
              name={fullName}
              initials={initials}
              imageError={avatarError}
              onImageError={() =>
                setAvatarError(true)
              }
              size="small"
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-[48px] z-[100] w-[250px] overflow-hidden rounded-[20px] border border-[#ececf2] bg-white shadow-[0_18px_35px_rgba(17,24,39,0.12)]">
              {/* Dynamic user information */}
              <div className="flex items-center gap-3 border-b border-[#ececf2] px-4 py-4">
                <AdminAvatar
                  image={avatarUrl}
                  name={fullName}
                  initials={initials}
                  imageError={avatarError}
                  onImageError={() =>
                    setAvatarError(true)
                  }
                  size="large"
                />

                <div className="min-w-0">
                  <p className="truncate text-[15px] font-semibold text-[#222]">
                    {fullName}
                  </p>

                  <p className="truncate text-[12px] text-[#7a8191]">
                    {user?.email ||
                    "No email available"}
                  </p>

                  <p className="mt-[3px] text-[11px] font-medium text-[#2f6bdb]">
                    {roleName}
                  </p>
                </div>
              </div>

              <div className="py-1">
                <DropdownItem
                  icon={User}
                  label="Profile"
                  onClick={handleProfile}
                />

                <DropdownItem
                  icon={Settings}
                  label="Settings"
                  onClick={handleSettings}
                />
              </div>

              <div className="border-t border-[#ececf2] py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={logoutLoading}
                  className="flex h-[42px] w-full items-center gap-3 px-4 text-[15px] text-[#ef4444] transition-colors hover:bg-[#fff5f5] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {logoutLoading ? (
                    <>
                      <span className="h-[16px] w-[16px] animate-spin rounded-full border-2 border-red-200 border-t-[#ef4444]" />
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

const AdminAvatar = ({
  image,
  name,
  initials,
  imageError,
  onImageError,
  size,
}) => {
  const sizeClass =
    size === "large"
      ? "h-[44px] w-[44px]"
      : "h-[36px] w-[36px]";

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#e1e5ee] bg-[#edf3ff] ${sizeClass}`}
    >
      {image && !imageError ? (
        <img
          src={image}
          alt={name}
          onError={onImageError}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="text-[12px] font-semibold uppercase text-[#2f6bdb]">
          {initials}
        </span>
      )}
    </div>
  );
};

const DropdownItem = ({
  icon: Icon,
  label,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[42px] w-full items-center gap-3 px-4 text-[15px] text-[#333b4a] transition-colors hover:bg-[#f8f9fc]"
    >
      <Icon
        size={17}
        strokeWidth={1.9}
      />

      {label}
    </button>
  );
};

const getAdminName = (user) => {
  if (!user) {
    return "Admin";
  }

  if (user.full_name) {
    return user.full_name;
  }

  if (user.name) {
    return user.name;
  }

  const name = [
    user.first_name,
    user.middle_name,
    user.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  return name || "Admin";
};

const getAdminAvatar = (user) => {
  if (!user) {
    return "";
  }

  const photo =
    user.photo_url ||
    user.avatar_url ||
    user.profile_photo_url ||
    user.photo ||
    user.avatar ||
    user.profile_photo ||
    "";

  if (!photo) {
    return "";
  }

  if (
    photo.startsWith("http://") ||
    photo.startsWith("https://") ||
    photo.startsWith("data:")
  ) {
    return photo;
  }

  const apiBase =
    api.defaults.baseURL || "";

  const backendBase = apiBase.replace(
    /\/api\/?$/,
    ""
  );

  return `${backendBase}/${photo.replace(
    /^\/+/,
    ""
  )}`;
};

const getInitials = (name) => {
  const parts = String(name || "Admin")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "A";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
};

const formatRole = (role) => {
  return String(role || "admin")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase()
    );
};

export default AdminNavbar;