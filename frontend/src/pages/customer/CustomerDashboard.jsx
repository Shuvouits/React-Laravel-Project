import { useNavigate } from "react-router-dom";

const CustomerDashboard = () => {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user")
  );

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] font-['Inter']">

      {/* Header */}
      <header className="bg-white border-b border-[#e9e9e9]">
        <div className="max-w-[1200px] mx-auto px-5 h-[70px] flex items-center justify-between">

          <div>
            <h1 className="text-[20px] font-bold text-[#171717]">
              Customer Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">

            <div className="text-right">
              <p className="text-[13px] font-medium text-[#222]">
                {user?.name}
              </p>

              <p className="text-[11px] text-[#777] capitalize">
                {user?.role}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="
                px-5
                h-[38px]
                rounded-full
                bg-[#2065D1]
                hover:bg-[#1958ba]
                text-white
                text-[13px]
                font-medium
                transition-colors
              "
            >
              Logout
            </button>

          </div>
        </div>
      </header>


      {/* Content */}
      <main className="max-w-[1200px] mx-auto px-5 py-10">

        <div className="mb-8">
          <p className="text-[14px] text-[#777]">
            Welcome back,
          </p>

          <h2 className="mt-1 text-[28px] font-bold text-[#171717]">
            {user?.name}
          </h2>

          <p className="mt-2 text-[14px] text-[#666]">
            Manage your orders, wishlist and account information.
          </p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

          <DashboardCard
            title="My Orders"
            description="View and manage your recent orders."
          />

          <DashboardCard
            title="Wishlist"
            description="View products you have saved."
          />

          <DashboardCard
            title="My Profile"
            description="Manage your personal information."
          />

        </div>

      </main>
    </div>
  );
};


const DashboardCard = ({
  title,
  description
}) => {
  return (
    <div
      className="
        bg-white
        border
        border-[#e7e7e7]
        rounded-[16px]
        p-6
        shadow-[0_3px_12px_rgba(0,0,0,0.04)]
      "
    >
      <h3 className="text-[17px] font-semibold text-[#171717]">
        {title}
      </h3>

      <p className="mt-2 text-[13px] leading-6 text-[#777]">
        {description}
      </p>

      <button
        type="button"
        className="mt-5 text-[13px] font-medium text-[#2065D1] hover:underline"
      >
        View Details
      </button>
    </div>
  );
};

export default CustomerDashboard;