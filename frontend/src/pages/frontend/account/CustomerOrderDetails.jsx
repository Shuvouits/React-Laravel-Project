import {
    useEffect,
    useState,
} from "react";

import {
    Link,
    useParams,
} from "react-router-dom";

import {
    MapPin,
    CreditCard,
    Download,
    Clock
} from "lucide-react";


import api from "../../../api/axios";

import CustomerSidebar from "../../../components/frontend/account/CustomerSidebar";








const CustomerOrderDetails = () => {


    const { id } = useParams();


    const [order, setOrder] = useState(null);

    const [loading, setLoading] = useState(true);



    useEffect(() => {

        loadOrder();

    }, []);



    const loadOrder = async () => {

        try {

            const res = await api.get(
                `/account/orders/${id}`
            );


            setOrder(
                res.data.order
            );


        } catch (error) {

            console.log(error);

        }
        finally {

            setLoading(false);

        }

    };





    if (loading) {

        return (
            <div className="p-10 text-center">
                Loading...
            </div>
        );

    }



    if (!order) {

        return (
            <div className="p-10">
                Order not found
            </div>
        );

    }



   const cancelOrder = async()=>{

    try{

        const response = await api.post(
            `/account/orders/${id}/cancel`
        );


        if(response.data.success){

            setOrder({

                ...order,

                status:"cancelled"

            });

        }


    }catch(error){

        console.log(
            error
        );

    }

};



const downloadInvoice = async()=>{

    try{

        const response = await api.get(
            `/account/orders/${id}/invoice`,
            {
                responseType:"blob"
            }
        );


        const url = window.URL.createObjectURL(
            new Blob([
                response.data
            ])
        );


        const link = document.createElement("a");


        link.href = url;


        link.setAttribute(
            "download",
            `${order.order_no}.pdf`
        );


        document.body.appendChild(link);


        link.click();


        link.remove();


    }catch(error){

        console.log(
            error
        );

    }

};






    return (

        <main className="
            min-h-screen
            bg-[#f7f8fa]
        ">



            <div className="
                max-w-[1330px]
                mx-auto
                px-5
                py-8
            ">


                <div className="
                    grid
                    lg:grid-cols-[230px_1fr]
                    gap-8
                ">


                    <CustomerSidebar />



                    <div>



                        {/* HEADER */}

                        <div className="
                            flex
                            justify-between
                            items-start
                        ">


                            <div>


                                <Link
                                    to="/account/orders"
                                    className="
                                        text-sm
                                        text-gray-700
                                        flex
                                        items-center
                                        gap-2
                                        mb-8
                                    "
                                >
                                    ← Back to Orders
                                </Link>




                                <h1 className="
                                    text-[26px]
                                    font-semibold
                                    text-gray-900
                                ">
                                    {order.order_no}
                                </h1>



                                <p className="
                                    mt-2
                                    text-gray-500
                                ">
                                    Placed on{" "}
                                    {
                                        new Date(
                                            order.placed_at
                                        ).toLocaleString(
                                            "en-US",
                                            {
                                                dateStyle: "long",
                                                timeStyle: "short"
                                            }
                                        )
                                    }
                                </p>



                            </div>





                            <div className="
                                flex
                                gap-3
                                mt-16
                            ">


                                <span className="
                                    h-[38px]
                                    px-5
                                    rounded-full
                                    border
                                    flex
                                    items-center
                                    gap-2
                                    text-sm
                                ">

                                    <Clock size={15} />

                                    {order.status}

                                </span>




                               <button
    onClick={downloadInvoice}
    className="
        h-[38px]
        px-5
        border
        rounded-lg
        bg-white
        flex
        items-center
        gap-2
        text-sm
        hover:bg-gray-50
    "
>
    <Download size={16} />

    Invoice

</button>



                                <button

                                    onClick={cancelOrder}

                                    disabled={
                                        ![
                                            "pending",
                                            "processing"
                                        ].includes(order.status)
                                    }

                                    className="
    h-[38px]
    px-5
    border
    
    rounded-lg
    bg-white
    text-sm
    disabled:opacity-50
"

                                >

                                    Cancel Order

                                </button>



                            </div>


                        </div>









                        {/* ADDRESS */}

                        <div className="
                            mt-8
                            grid
                            md:grid-cols-3
                            gap-5
                        ">



                            <AddressCard
                                title="Shipping Address"
                                data={order.shipping_address}
                                icon={<MapPin size={18} />}
                            />



                            <AddressCard
                                title="Billing Address"
                                data={order.billing_address}
                                icon={<MapPin size={18} />}
                            />



                            <PaymentCard
                                payment={order.payment}
                            />



                        </div>










                        {/* ITEMS */}


                        <div className="
                            mt-6
                            bg-white
                            border
                            border-[#e8e8e8]
                            rounded-xl
                            shadow-sm
                            p-6
                        ">



                            <h2 className="
                                text-[18px]
                                font-semibold
                            ">
                                Order Items
                            </h2>



                            <p className="
                                text-sm
                                text-gray-500
                                mt-1
                            ">
                                {order.items.length} item
                            </p>





                            {
                                order.items.map(item => (


                                    <div
                                        key={item.id}
                                        className="
                                            mt-6
                                            pb-6
                                            border-b
                                            flex
                                            justify-between
                                            items-center
                                        "
                                    >



                                        <div className="
                                            flex
                                            items-center
                                            gap-4
                                        ">


                                            <div className="
                                                w-[64px]
                                                h-[64px]
                                                rounded-lg
                                                bg-gray-100
                                                overflow-hidden
                                            ">


                                                {
                                                    item.image_url &&

                                                    <img
                                                        src={item.image_url}
                                                        className="
                                                            w-full
                                                            h-full
                                                            object-cover
                                                        "
                                                    />

                                                }


                                            </div>



                                            <div>


                                                <h3 className="
                                                    font-medium
                                                ">
                                                    {item.product_name}
                                                </h3>



                                                <p className="
                                                    text-sm
                                                    text-gray-500
                                                ">
                                                    Qty: {item.qty}
                                                </p>


                                            </div>


                                        </div>






                                        <div className="
                                            text-right
                                        ">


                                            <p className="
                                                font-semibold
                                            ">
                                                ${item.line_total}
                                            </p>



                                            <p className="
                                                text-sm
                                                text-gray-500
                                            ">
                                                ${item.price} each
                                            </p>


                                        </div>



                                    </div>


                                ))
                            }








                            {/* SUMMARY */}


                            <div className="
                                mt-6
                                space-y-3
                                max-w-full
                            ">


                                <Row
                                    label="Subtotal"
                                    value={order.subtotal}
                                />


                                <Row
                                    label="Shipping"
                                    value={order.shipping}
                                />


                                <Row
                                    label="Tax"
                                    value={order.tax}
                                />



                                <div className="
                                    pt-4
                                    mt-4
                                    border-t
                                    border-[#eeeeee]
                                    flex
                                    justify-between
                                    text-lg
                                    font-semibold
                                ">

                                    <span>
                                        Total
                                    </span>


                                    <span>
                                        ${order.total}
                                    </span>


                                </div>


                            </div>






                        </div>





                    </div>



                </div>



            </div>



        </main>

    );

};









const AddressCard = ({
    title,
    data,
    icon
}) => {


    return (

        <div className="
            bg-white
            rounded-xl
            border
            border-[#e8e8e8]
            shadow-sm
            p-6
            min-h-[190px]
        ">


            <h3 className="
                font-semibold
                flex
                items-center
                gap-2
            ">

                {icon}

                {title}

            </h3>




            <div className="
                mt-5
                text-sm
                text-gray-600
                leading-6
            ">


                <p className="
                    text-gray-900
                    font-medium
                ">

                    {data?.first_name}
                    {" "}
                    {data?.last_name}

                </p>



                <p>
                    {data?.address_line1}
                </p>



                <p>
                    {data?.city},
                    {" "}
                    {data?.country}
                </p>



                <p>
                    {data?.phone}
                </p>



            </div>



        </div>

    );

};









const PaymentCard = ({
    payment
}) => {


    return (

        <div className="
            bg-white
            rounded-xl
            border
            border-[#e8e8e8]
            shadow-sm
            p-6
            min-h-[190px]
        ">



            <h3 className="
                font-semibold
                flex
                items-center
                gap-2
            ">

                <CreditCard size={18} />

                Payment Method

            </h3>




            <div className="
                mt-5
                text-sm
            ">


                <div className="
                    flex
                    justify-between
                ">

                    <span className="text-gray-500">
                        Method
                    </span>


                    <span>
                        {payment?.method}
                    </span>


                </div>




                <div className="
                    flex
                    justify-between
                    mt-4
                    items-center
                ">

                    <span className="text-gray-500">
                        Status
                    </span>


                    <span className="
                        border
                        rounded-full
                        px-3
                        py-1
                        text-xs
                    ">
                        {payment?.status}
                    </span>


                </div>



            </div>



        </div>

    );

};








const Row = ({
    label,
    value
}) => {


    return (

        <div className="
            flex
            justify-between
            text-sm
        ">

            <span>
                {label}
            </span>


            <span>
                ${value ?? 0}
            </span>


        </div>

    );

};





export default CustomerOrderDetails;