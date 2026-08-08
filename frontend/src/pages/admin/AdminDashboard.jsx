import {
  Store,
  Globe,
  FileText,
  Percent,
  Users,
  RotateCcw,
  CalendarDays,
  ChevronRight,
  ChevronDown,
  CreditCard,
  ChartNoAxesColumn,
  Sparkles,
} from "lucide-react";


const AdminDashboard = () => {

  const statCards = [
    {
      title: "In-store sales",
      value: "$540,063.74",
      sub: "239 orders",
      change: "85%",
      icon: Store,
    },

    {
      title: "Website sales",
      value: "$73,581.07",
      sub: "70 orders",
      change: "99%",
      icon: Globe,
    },

    {
      title: "Total orders",
      value: "309",
      sub: "309 orders",
      change: "86%",
      icon: FileText,
    },

    {
      title: "Discount",
      value: "$3,952.13",
      sub: "22 orders",
      change: "91%",
      icon: Percent,
    },

    {
      title: "Customers",
      value: "104",
      sub: "8 new this month",
      change: "90%",
      icon: Users,
    },

    {
      title: "Refunds",
      value: "$225.00",
      sub: "1 cases",
      change: "",
      icon: RotateCcw,
    },
  ];


  const chartBars = [
    { month: "Sep", blue: 0, gray: 0 },
    { month: "Oct", blue: 0, gray: 0 },
    { month: "Nov", blue: 0, gray: 0 },
    { month: "Dec", blue: 0, gray: 0 },
    { month: "Jan", blue: 0, gray: 0 },
    { month: "Feb", blue: 0, gray: 0 },
    { month: "Mar", blue: 0, gray: 0 },
    { month: "Apr", blue: 0, gray: 0 },
    { month: "May", blue: 12, gray: 54 },
    { month: "Jun", blue: 130, gray: 38 },
    { month: "Jul", blue: 340, gray: 58 },
    { month: "Aug", blue: 48, gray: 9 },
  ];


  return (
    <div className="px-6 py-6">


      {/* =============================
          HEADING
      ============================== */}

      <div className="flex items-start justify-between gap-4">

        <div>

          <h1
            className="
              text-[22px]
              md:text-[24px]
              font-bold
              tracking-[-0.4px]
              text-[#111827]
            "
          >
            Good afternoon, Storify.
          </h1>

          <p className="mt-1 text-[14px] text-[#6b7280]">
            Here's what's happening with your store today.
          </p>

        </div>


        <div className="flex items-center gap-3">

          <button
            type="button"
            className="
              h-[36px]
              px-4
              rounded-[12px]
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

            <ChartNoAxesColumn size={16} />

            Analytics

            <ChevronRight size={15} />

          </button>


          <button
            type="button"
            className="
              h-[36px]
              px-4
              rounded-[12px]
              bg-[#2f6bdb]
              text-white
              text-[14px]
              font-medium
              flex
              items-center
              gap-2
            "
          >

            <CreditCard size={16} />

            Orders

            <ChevronRight size={15} />

          </button>

        </div>

      </div>


      {/* =============================
          STAT CARDS
      ============================== */}

      <div
        className="
          mt-5
          grid
          grid-cols-1
          sm:grid-cols-2
          xl:grid-cols-3
          2xl:grid-cols-6
          gap-4
        "
      >

        {statCards.map((item) => (

          <StatCard
            key={item.title}
            item={item}
          />

        ))}

      </div>


      {/* =============================
          ORDERS
      ============================== */}

      <div
        className="
          mt-5
          bg-white
          border
          border-[#e8e8ee]
          rounded-[20px]
          overflow-hidden
        "
      >

        <div
          className="
            grid
            grid-cols-1
            xl:grid-cols-[1fr_310px]
          "
        >


          {/* =============================
              CHART
          ============================== */}

          <div className="p-5 border-r border-[#ececf2]">

            <div className="flex items-center justify-between gap-4">

              <h2 className="text-[18px] font-semibold text-[#111827]">
                Orders
              </h2>


              <div className="flex items-center gap-3">

                <button
                  type="button"
                  className="
                    h-[34px]
                    px-3
                    rounded-[10px]
                    border
                    border-[#e6e8ef]
                    bg-white
                    text-[13px]
                    text-[#333]
                    flex
                    items-center
                    gap-2
                  "
                >

                  <CalendarDays size={15} />

                  Sep 1, 2025 - Aug 31, 2026

                  <ChevronDown size={15} />

                </button>


                <button
                  type="button"
                  className="
                    h-[34px]
                    px-4
                    rounded-[10px]
                    border
                    border-[#e6e8ef]
                    bg-white
                    text-[13px]
                    text-[#333]
                  "
                >
                  + Add activity
                </button>

              </div>

            </div>


            {/* Chart */}

            <div className="mt-8">

              <div className="relative h-[360px]">


                {/* Grid */}

                <div
                  className="
                    absolute
                    inset-0
                    flex
                    flex-col
                    justify-between
                    pointer-events-none
                  "
                >

                  {[200, 150, 100, 50, 0].map((line) => (

                    <div
                      key={line}
                      className="relative border-t border-[#edf0f5]"
                    >

                      <span
                        className="
                          absolute
                          -left-1
                          -top-[10px]
                          text-[12px]
                          text-[#8a92a3]
                          bg-white
                          pr-2
                        "
                      >
                        {line}
                      </span>

                    </div>

                  ))}

                </div>


                {/* Bars */}

                <div
                  className="
                    absolute
                    inset-0
                    flex
                    items-end
                    justify-between
                    gap-3
                    pt-2
                    pb-7
                    pl-10
                    pr-4
                  "
                >

                  {chartBars.map((bar) => (

                    <div
                      key={bar.month}
                      className="
                        flex-1
                        h-full
                        flex
                        flex-col
                        items-center
                        justify-end
                      "
                    >

                      <div className="h-full flex items-end gap-[6px]">

                        <div
                          className="
                            w-[20px]
                            rounded-t-[4px]
                            bg-[#2f6bdb]
                          "
                          style={{
                            height: `${bar.blue}px`
                          }}
                        />

                        <div
                          className="
                            w-[20px]
                            rounded-t-[4px]
                            bg-[#bcbec6]
                          "
                          style={{
                            height: `${bar.gray}px`
                          }}
                        />

                      </div>


                      <p className="mt-3 text-[12px] text-[#7b8392]">
                        {bar.month}
                      </p>

                    </div>

                  ))}

                </div>

              </div>


              {/* Legend */}

              <div className="mt-2 flex items-center justify-center gap-6">

                <div className="flex items-center gap-2 text-[14px] text-[#5f6777]">

                  <span className="w-[10px] h-[10px] rounded-[2px] bg-[#2f6bdb]" />

                  In-store

                </div>


                <div className="flex items-center gap-2 text-[14px] text-[#5f6777]">

                  <span className="w-[10px] h-[10px] rounded-[2px] bg-[#bcbec6]" />

                  Online

                </div>

              </div>

            </div>

          </div>


          {/* =============================
              RIGHT PANEL
          ============================== */}

          <div className="p-5">

            <div className="flex items-center gap-6 border-b border-[#ececf2] pb-3">

              <button
                type="button"
                className="
                  text-[15px]
                  font-semibold
                  text-[#111827]
                  border-b-2
                  border-[#111827]
                  pb-2
                "
              >
                Orders
              </button>


              <button
                type="button"
                className="
                  text-[15px]
                  text-[#777f8f]
                  pb-2
                "
              >
                Sales
              </button>

            </div>


            <div className="mt-5">

              <h3 className="text-[18px] font-semibold text-[#111827]">
                309
              </h3>


              <div
                className="
                  mt-4
                  h-[6px]
                  rounded-full
                  bg-[#eceef4]
                  overflow-hidden
                "
              >

                <div
                  className="
                    h-full
                    w-[62%]
                    bg-[#2f6bdb]
                    rounded-full
                  "
                />

              </div>


              <div
                className="
                  mt-2
                  flex
                  items-center
                  justify-between
                  text-[13px]
                  text-[#8a92a3]
                "
              >

                <span>0.00</span>

                <span>500</span>

              </div>


              <p className="mt-6 text-[14px] leading-7 text-[#6b7280]">
                A project-wise breakdown of total orders completed by
                detailed insights.
              </p>

            </div>


            <div className="mt-6 space-y-3">

              <InsightButton
                label="Show all highlights"
              />

              <InsightButton
                label="Show all sales data"
              />

            </div>

          </div>

        </div>

      </div>

    </div>
  );
};


/* =============================
   STAT CARD
============================== */

const StatCard = ({ item }) => {

  const Icon = item.icon;

  return (
    <div
      className="
        rounded-[16px]
        border
        border-[#e8e8ee]
        bg-white
        p-5
      "
    >

      <div className="flex items-start justify-between gap-3">

        <div>

          <p className="text-[14px] text-[#7b8392]">
            {item.title}
          </p>

          <h3
            className="
              mt-2
              text-[18px]
              md:text-[20px]
              font-bold
              text-[#111827]
            "
          >
            {item.value}
          </h3>

        </div>


        <div className="text-[#7b8392]">

          <Icon
            size={18}
            strokeWidth={1.9}
          />

        </div>

      </div>


      <div className="mt-2 flex items-center gap-2 text-[14px]">

        <span className="text-[#6b7280]">
          {item.sub}
        </span>


        {item.change && (

          <span className="text-[#ff4d4f] font-medium">
            {item.change} ↘
          </span>

        )}

      </div>

    </div>
  );
};


/* =============================
   INSIGHT BUTTON
============================== */

const InsightButton = ({ label }) => {

  return (
    <button
      type="button"
      className="
        w-full
        h-[48px]
        px-4
        rounded-[16px]
        border
        border-[#e8e8ee]
        bg-white
        flex
        items-center
        justify-between
        text-left
        hover:bg-[#fafbff]
        transition-colors
      "
    >

      <span className="flex items-center gap-3">

        <span
          className="
            w-[32px]
            h-[32px]
            rounded-full
            bg-[#eef3ff]
            text-[#2f6bdb]
            flex
            items-center
            justify-center
          "
        >

          <Sparkles size={16} />

        </span>


        <span className="text-[15px] font-medium text-[#222b3b]">
          {label}
        </span>

      </span>


      <ChevronRight
        size={16}
        className="text-[#7b8392]"
      />

    </button>
  );
};


export default AdminDashboard;