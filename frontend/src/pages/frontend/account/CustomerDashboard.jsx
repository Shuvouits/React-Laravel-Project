import {
    useEffect,
    useState,
} from "react";


import {
    useLocation,
} from "react-router-dom";


import {
    Box,
    ChevronRight,
    Clock3,
    DollarSign,
    Heart,
    LoaderCircle,
    Package,
    Star,
} from "lucide-react";


import {
    Link,
} from "react-router-dom";



import api from "../../../api/axios";


import CustomerSidebar from "../../../components/frontend/account/CustomerSidebar";


import CustomerInbox from "../../../components/frontend/customer/inbox/CustomerInbox";





const CustomerDashboard = () => {


    const location =
        useLocation();



    const pathname =
        location.pathname;





    const [dashboard, setDashboard] =
        useState(null);



    const [loading, setLoading] =
        useState(true);



    const [error, setError] =
        useState("");







    useEffect(() => {


        fetchDashboard();


    }, []);








    const fetchDashboard = async () => {


        try {


            setLoading(true);

            setError("");



            const response =
                await api.get(
                    "/account/overview"
                );



            setDashboard(
                response.data || null
            );



        } catch(error) {


            console.error(

                "Customer dashboard error:",

                error.response?.data ||
                error.message

            );



            setError(

                error.response?.data?.message ||

                "Unable to load your account overview."

            );


        } finally {


            setLoading(false);


        }


    };








    if(loading){


        return <DashboardLoader />;


    }







    if(error){


        return (

            <DashboardError

                message={error}

                onRetry={fetchDashboard}

            />

        );


    }







    const customer =
        dashboard?.customer || {};



    const statsData =
        dashboard?.stats || {};



    const recentOrders =
        dashboard?.recent_orders || [];



    const sidebar =
        dashboard?.sidebar || {};







    const stats = [


        {
            title:"Total Orders",
            value:formatNumber(
                statsData.total_orders
            ),
            icon:Package,
        },


        {
            title:"Total Spent",
            value:formatMoney(
                statsData.total_spent
            ),
            icon:DollarSign,
        },


        {
            title:"Pending Orders",
            value:formatNumber(
                statsData.pending_orders
            ),
            icon:Clock3,
        },


        {
            title:"Wishlist Items",
            value:formatNumber(
                statsData.wishlist_items
            ),
            icon:Heart,
        },


    ];









    const isInbox =
        pathname.includes(
            "/account/inbox"
        );







    return (

        <main

            className="
            min-h-screen
            bg-white
            font-['Inter']
            "

        >



            <div

                className="
                mx-auto
                max-w-[1330px]
                px-5
                pb-[70px]
                pt-[32px]
                "

            >



                <Breadcrumb />





                <div

                    className="
                    mt-[28px]
                    grid
                    grid-cols-1
                    gap-[32px]
                    lg:grid-cols-[250px_minmax(0,1fr)]
                    "

                >




                    <CustomerSidebar

                        customer={customer}

                        ordersCount={
                            sidebar.orders_count || 0
                        }

                        wishlistCount={
                            sidebar.wishlist_count || 0
                        }

                    />







                    <div

                        className="
                        min-w-0
                        "

                    >



                        {
                            isInbox ? (


                                <CustomerInbox

                                    customer={
                                        customer
                                    }

                                />


                            ) : (



                                <>


                                    <DashboardHeader

                                        customer={
                                            customer
                                        }

                                        loyalty={
                                            dashboard?.loyalty
                                        }

                                    />






                                    <div

                                        className="
                                        mt-[25px]
                                        grid
                                        grid-cols-1
                                        gap-[15px]
                                        sm:grid-cols-2
                                        xl:grid-cols-4
                                        "

                                    >


                                        {
                                            stats.map(
                                                (stat)=>(

                                                    <StatCard

                                                        key={
                                                            stat.title
                                                        }

                                                        stat={
                                                            stat
                                                        }

                                                    />

                                                )
                                            )
                                        }


                                    </div>






                                    <RecentOrders

                                        orders={
                                            recentOrders
                                        }

                                    />


                                </>


                            )
                        }




                    </div>





                </div>




            </div>



        </main>


    );

};







const Breadcrumb = () => {


    return (

        <div

            className="
            flex
            items-center
            gap-[10px]
            text-[14px]
            text-[#777]
            "

        >


            <Link

                to="/"

                className="
                hover:text-[#2065D1]
                "

            >

                Home

            </Link>



            <ChevronRight

                size={15}

                strokeWidth={1.7}

            />



            <span

                className="
                font-medium
                text-[#171717]
                "

            >

                Account

            </span>


        </div>

    );

};







const DashboardHeader = ({
    loyalty,
}) => {


    return (

        <div

            className="
            flex
            flex-wrap
            items-start
            justify-between
            gap-[20px]
            "

        >

            <div>


                <h1

                    className="
                    text-[26px]
                    font-semibold
                    text-[#171717]
                    "

                >

                    Overview

                </h1>



                <p

                    className="
                    mt-[6px]
                    text-[16px]
                    text-[#777]
                    "

                >

                    Your account at a glance

                </p>


            </div>





            {
                loyalty && (

                    <div

                        className="
                        flex
                        items-center
                        gap-[9px]
                        "

                    >


                        <span

                            className="
                            rounded-full
                            border
                            border-[#f59e0b]
                            bg-[#fff8ed]
                            px-[10px]
                            py-[4px]
                            text-[12px]
                            text-[#b35b00]
                            "

                        >

                            <Star

                                size={13}

                                fill="currentColor"

                            />


                            {loyalty.tier || "Bronze"}


                        </span>



                    </div>

                )
            }



        </div>

    );

};







const StatCard = ({
    stat,
}) => {


    const Icon =
        stat.icon;



    return (

        <div

            className="
            rounded-[12px]
            border
            border-[#dedede]
            bg-white
            px-[20px]
            py-[19px]
            "

        >

            <Icon

                size={20}

                className="text-[#777]"

            />


            <p

                className="
                mt-3
                text-[26px]
                font-semibold
                text-[#171717]
                "

            >

                {stat.value}

            </p>



            <p

                className="
                mt-2
                text-[14px]
                text-[#777]
                "

            >

                {stat.title}

            </p>


        </div>

    );

};







const RecentOrders = ({
    orders,
}) => {


    return (

        <section
            className="
            mt-[24px]
            rounded-[12px]
            border
            border-[#dedede]
            bg-white
            p-[24px]
            "
        >


            <div
                className="
                flex
                items-center
                justify-between
                "
            >

                <h2
                    className="
                    text-[17px]
                    font-semibold
                    text-[#171717]
                    "
                >
                    Recent Orders
                </h2>


                <Link
                    to="/account/orders"
                    className="
                    text-[14px]
                    text-[#171717]
                    hover:text-[#2065D1]
                    "
                >
                    View All →
                </Link>


            </div>





            {
                orders.length === 0 ? (

                    <p
                        className="
                        mt-5
                        text-[14px]
                        text-[#777]
                        "
                    >
                        No recent orders found.
                    </p>

                ) : (


                    <div
                        className="
                        mt-5
                        space-y-3
                        "
                    >


                        {
                            orders.map(
                                (order)=>(


                                    <Link
                                        key={
                                            order.id
                                        }

                                        to={
                                            `/account/orders/${order.id}`
                                        }

                                        className="
                                        flex
                                        items-center
                                        justify-between
                                        rounded-[10px]
                                        border
                                        border-[#ededed]
                                        px-5
                                        py-4
                                        transition
                                        hover:bg-[#fafafa]
                                        "
                                    >



                                        <div
                                            className="
                                            flex
                                            items-center
                                            gap-4
                                            "
                                        >



                                            <div
                                                className="
                                                flex
                                                h-[42px]
                                                w-[42px]
                                                items-center
                                                justify-center
                                                rounded-lg
                                                bg-[#f5f6f8]
                                                "
                                            >

                                                <Package
                                                    size={20}
                                                    className="text-[#777]"
                                                />


                                            </div>





                                            <div>


                                                <p
                                                    className="
                                                    text-[14px]
                                                    font-medium
                                                    text-[#171717]
                                                    "
                                                >

                                                    #
                                                    {
                                                        order.order_no
                                                    }


                                                </p>



                                                <p
                                                    className="
                                                    mt-1
                                                    text-[13px]
                                                    text-[#777]
                                                    "
                                                >

                                                    {
                                                        new Date(
                                                            order.placed_at
                                                        )
                                                        .toLocaleDateString(
                                                            "en-US",
                                                            {
                                                                month:"short",
                                                                day:"numeric",
                                                                year:"numeric"
                                                            }
                                                        )
                                                    }

                                                </p>



                                            </div>


                                        </div>





                                        <div
                                            className="
                                            flex
                                            items-center
                                            gap-4
                                            "
                                        >



                                            <span
                                                className={`
                                                rounded-full
                                                px-3
                                                py-1
                                                text-[12px]
                                                font-medium
                                                capitalize
                                                ${
                                                    order.status === "processing"
                                                    ?
                                                    "bg-[#fff4cc] text-[#9a6700]"
                                                    :
                                                    order.status === "delivered"
                                                    ?
                                                    "bg-[#dcfce7] text-[#15803d]"
                                                    :
                                                    "bg-[#f1f5f9] text-[#475569]"
                                                }
                                                `}
                                            >

                                                {
                                                    order.status
                                                }


                                            </span>





                                            <p
                                                className="
                                                text-[15px]
                                                font-semibold
                                                text-[#171717]
                                                "
                                            >

                                                {
                                                    formatMoney(
                                                        order.total
                                                    )
                                                }

                                            </p>





                                            <ChevronRight
                                                size={18}
                                                className="text-[#777]"
                                            />



                                        </div>




                                    </Link>


                                )
                            )
                        }


                    </div>


                )
            }


        </section>

    );

};







const DashboardLoader = () => (

    <main className="flex min-h-[600px] items-center justify-center">

        <LoaderCircle

            size={30}

            className="animate-spin text-[#2065D1]"

        />

    </main>

);







const DashboardError = ({
    message,
    onRetry,
}) => (

    <div className="p-10 text-center">

        <p>{message}</p>

        <button

            onClick={onRetry}

            className="
            mt-4
            rounded
            bg-[#2065D1]
            px-5
            py-2
            text-white
            "

        >

            Try Again

        </button>


    </div>

);







const formatMoney = (
    value
) => {


    return new Intl.NumberFormat(
        "en-US",
        {
            style:"currency",
            currency:"USD",
        }
    ).format(
        Number(value || 0)
    );


};







const formatNumber = (
    value
)=>{


    return new Intl.NumberFormat(
        "en-US"
    ).format(
        Number(value || 0)
    );


};




export default CustomerDashboard;