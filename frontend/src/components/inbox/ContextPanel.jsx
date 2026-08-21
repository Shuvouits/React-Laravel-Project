import {
    User,
    Package,
    ShoppingBag,
    Image,
} from "lucide-react";


const ContextPanel = ({
    conversation,
}) => {


    if (!conversation) {

        return null;

    }


    const customer =
        conversation.customer ||
        null;


    const product =
        conversation.product ||
        null;


    const order =
        conversation.order ||
        null;


    const mediaCount =
        conversation.messages?.reduce(
            (total, message) =>
                total +
                (
                    message.attachments?.length ||
                    0
                ),
            0
        ) || 0;



    return (

        <aside
            className="
            w-[300px]
            border-l
            border-[#e5e5e5]
            bg-white
            p-5
            "
        >


            <div
                className="
                mb-6
                "
            >

                <h3
                    className="
                    mb-4
                    text-[15px]
                    font-semibold
                    text-[#222]
                    "
                >
                    Customer
                </h3>


                <div
                    className="
                    flex
                    items-center
                    gap-3
                    "
                >

                    <div
                        className="
                        flex
                        h-[42px]
                        w-[42px]
                        items-center
                        justify-center
                        rounded-full
                        bg-[#eef4ff]
                        text-[#2065D1]
                        "
                    >

                        <User size={18}/>

                    </div>


                    <div>

                        <p
                            className="
                            text-[14px]
                            font-medium
                            text-[#222]
                            "
                        >
                            {
                                customer?.name ||
                                "Customer"
                            }
                        </p>


                        <p
                            className="
                            text-[12px]
                            text-[#777]
                            "
                        >
                            {
                                customer?.email ||
                                ""
                            }
                        </p>

                    </div>


                </div>


            </div>



            {
                product && (

                    <div
                        className="
                        mb-6
                        border-t
                        border-[#eeeeee]
                        pt-5
                        "
                    >

                        <h3
                            className="
                            mb-4
                            flex
                            items-center
                            gap-2
                            text-[15px]
                            font-semibold
                            text-[#222]
                            "
                        >

                            <Package size={16}/>

                            Product

                        </h3>


                        <p
                            className="
                            text-[14px]
                            font-medium
                            text-[#333]
                            "
                        >
                            {
                                product.name
                            }
                        </p>


                    </div>

                )

            }



            {
                order && (

                    <div
                        className="
                        mb-6
                        border-t
                        border-[#eeeeee]
                        pt-5
                        "
                    >

                        <h3
                            className="
                            mb-4
                            flex
                            items-center
                            gap-2
                            text-[15px]
                            font-semibold
                            text-[#222]
                            "
                        >

                            <ShoppingBag size={16}/>

                            Order

                        </h3>


                        <p
                            className="
                            text-[14px]
                            text-[#333]
                            "
                        >
                            #

                            {
                                order.id
                            }

                        </p>


                    </div>

                )

            }



            <div
                className="
                border-t
                border-[#eeeeee]
                pt-5
                "
            >

                <h3
                    className="
                    mb-3
                    flex
                    items-center
                    gap-2
                    text-[15px]
                    font-semibold
                    text-[#222]
                    "
                >

                    <Image size={16}/>

                    Media & files

                </h3>


                <p
                    className="
                    text-[14px]
                    text-[#777]
                    "
                >

                    {
                        mediaCount
                    }
                    {" "}
                    files

                </p>


            </div>


        </aside>

    );

};


export default ContextPanel;