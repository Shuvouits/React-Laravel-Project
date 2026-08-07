import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
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

          <h1 className="text-[20px] font-bold text-[#171717]">
            Admin Dashboard
          </h1>

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
            Marketplace administration
          </p>

          <h2 className="mt-1 text-[28px] font-bold text-[#171717]">
            Welcome, {user?.name}
          </h2>

          <p className="mt-2 text-[14px] text-[#666]">
            Manage customers, vendors, products and marketplace orders.
          </p>

        </div>


        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

          <AdminCard
            title="Customers"
            value="0"
          />

          <AdminCard
            title="Vendors"
            value="0"
          />

          <AdminCard
            title="Products"
            value="0"
          />

          <AdminCard
            title="Orders"
            value="0"
          />

        </div>

      </main>
    </div>
  );
};


const AdminCard = ({
  title,
  value
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
      <p className="text-[13px] text-[#777]">
        {title}
      </p>

      <h3 className="mt-3 text-[28px] font-bold text-[#171717]">
        {value}
      </h3>

      <button
        type="button"
        className="mt-4 text-[12px] font-medium text-[#2065D1] hover:underline"
      >
        Manage
      </button>
    </div>
  );
};

export default AdminDashboard;