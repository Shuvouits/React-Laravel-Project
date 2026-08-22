import {
    useEffect,
    useState,
} from "react";


import {
    Link,
} from "react-router-dom";


import api from "../../../api/axios";


import CustomerSidebar from "../../../components/frontend/account/CustomerSidebar";


const CustomerOrders = () => {


    const [
        orders,
        setOrders
    ] = useState([]);



    const [
        loading,
        setLoading
    ] = useState(true);





    useEffect(()=>{

        fetchOrders();

    },[]);





    const fetchOrders = async()=>{

        try{


            const response =
                await api.get(
                    "/account/orders"
                );


            setOrders(
                response.data.orders || []
            );


        }
        catch(error){

            console.error(error);

        }
        finally{

            setLoading(false);

        }

    };





    if(loading){

        return (

            <div
                className="
                p-10
                text-center
                text-gray-500
                "
            >
                Loading orders...

            </div>

        );

    }





    return (

        <main
            className="
            min-h-screen
            bg-[#f7f8fa]
            "
        >


            <div
                className="
                mx-auto
                max-w-[1330px]
                px-5
                py-8
                "
            >



                <div
                    className="
                    grid
                    grid-cols-1
                    gap-8
                    lg:grid-cols-[230px_1fr]
                    "
                >



                    <CustomerSidebar />





                    <div>


                        <div
                            className="
                            rounded-[12px]
                            border
                            border-[#dedede]
                            bg-white
                            p-6
                            "
                        >


                            <h1
                                className="
                                text-[24px]
                                font-semibold
                                "
                            >
                                My Orders
                            </h1>



                            <p
                                className="
                                mt-2
                                text-[14px]
                                text-gray-500
                                "
                            >
                                View and manage your recent purchases.

                            </p>





                            <div
                                className="
                                mt-6
                                space-y-4
                                "
                            >


                            {
                                orders.length === 0 ? (

                                    <p>
                                        No orders found.
                                    </p>

                                ) : (


                                    orders.map((order)=>(


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
                                            rounded-[12px]
                                            border
                                            border-[#e5e5e5]
                                            p-5
                                            transition
                                            hover:bg-[#fafafa]
                                            "
                                        >



                                            <div>


                                                <h3
                                                    className="
                                                    text-[15px]
                                                    font-semibold
                                                    "
                                                >

                                                    #
                                                    {
                                                        order.order_no
                                                    }

                                                </h3>



                                                <p
                                                    className="
                                                    mt-2
                                                    text-[13px]
                                                    text-gray-500
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





                                            <div
                                                className="
                                                flex
                                                items-center
                                                gap-5
                                                "
                                            >



                                                <span
                                                    className={`
                                                    rounded-full
                                                    px-4
                                                    py-1
                                                    text-[12px]
                                                    font-medium
                                                    capitalize

                                                    ${
                                                        order.status === "processing"

                                                        ?

                                                        "bg-[#fff4cc] text-[#946200]"

                                                        :

                                                        order.status === "cancelled"

                                                        ?

                                                        "bg-[#fee2e2] text-[#b91c1c]"

                                                        :

                                                        "bg-[#dcfce7] text-[#166534]"
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
                                                    "
                                                >

                                                    {
                                                        order.currency
                                                    }

                                                    {" "}

                                                    {
                                                        order.total
                                                    }

                                                </p>




                                                <span
                                                    className="
                                                    text-gray-400
                                                    text-xl
                                                    "
                                                >
                                                    →
                                                </span>


                                            </div>




                                        </Link>


                                    ))

                                )

                            }


                            </div>



                        </div>



                    </div>



                </div>


            </div>


        </main>

    );

};


export default CustomerOrders;