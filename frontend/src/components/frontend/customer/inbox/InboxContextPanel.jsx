import {
    Store,
    Package,
    FileImage,
    ShoppingBag,
} from "lucide-react";



const InboxContextPanel = ({
    conversation,
}) => {



    if(!conversation){

        return (

            <aside

                className="
                hidden
                border-l
                border-[#e5e5e5]
                bg-white
                p-5
                xl:block
                "

            >

                <p

                    className="
                    text-[13px]
                    text-[#999]
                    "

                >

                    Select a conversation

                </p>


            </aside>

        );

    }





    const storeName =

        conversation.vendor?.store_name ||

        conversation.vendor?.name ||

        "Store";




    const product =
        conversation.product;



    const order =
        conversation.order;



    const messages =
        conversation.messages || [];




    const mediaFiles = messages.flatMap(

        (item)=>

            item.attachments || []

    );






    return (

        <aside

            className="
            hidden
            w-[260px]
            shrink-0
            border-l
            border-[#e5e5e5]
            bg-white
            p-5
            xl:block
            "

        >




            {/* Store */}

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

                    <Store
                        size={20}
                    />


                </div>



                <div>

                    <h3

                        className="
                        text-[15px]
                        font-semibold
                        text-[#222]
                        "

                    >

                        {storeName}

                    </h3>


                    <p

                        className="
                        text-[12px]
                        text-[#777]
                        "

                    >

                        Vendor

                    </p>


                </div>


            </div>







            {/* Subject */}

            <div

                className="
                mt-6
                border-t
                border-[#eeeeee]
                pt-5
                "

            >

                <p

                    className="
                    text-[12px]
                    font-medium
                    uppercase
                    text-[#999]
                    "

                >

                    Subject

                </p>


                <p

                    className="
                    mt-2
                    text-[14px]
                    font-medium
                    text-[#222]
                    "

                >

                    {
                        conversation.subject ||
                        "Live chat"
                    }

                </p>


            </div>








            {/* Product */}

            {
                product && (

                    <div

                        className="
                        mt-5
                        border-t
                        border-[#eeeeee]
                        pt-5
                        "

                    >

                        <div

                            className="
                            flex
                            items-center
                            gap-2
                            "

                        >

                            <Package
                                size={16}
                                className="text-[#555]"
                            />


                            <p

                                className="
                                text-[12px]
                                font-medium
                                uppercase
                                text-[#999]
                                "

                            >

                                Product Context

                            </p>


                        </div>




                        <div

                            className="
                            mt-3
                            rounded-lg
                            border
                            border-[#e5e5e5]
                            p-3
                            "

                        >

                            <p

                                className="
                                text-[13px]
                                font-medium
                                text-[#222]
                                "

                            >

                                {
                                    product.name
                                }

                            </p>



                            {
                                product.price && (

                                    <p

                                        className="
                                        mt-1
                                        text-[12px]
                                        text-[#777]
                                        "

                                    >

                                        $
                                        {
                                            product.price
                                        }

                                    </p>

                                )
                            }


                        </div>


                    </div>

                )

            }







            {/* Order */}

            {
                order && (

                    <div

                        className="
                        mt-5
                        border-t
                        border-[#eeeeee]
                        pt-5
                        "

                    >

                        <div

                            className="
                            flex
                            items-center
                            gap-2
                            "

                        >

                            <ShoppingBag

                                size={16}

                                className="text-[#555]"

                            />


                            <p

                                className="
                                text-[12px]
                                font-medium
                                uppercase
                                text-[#999]
                                "

                            >

                                Order

                            </p>


                        </div>



                        <p

                            className="
                            mt-2
                            text-[14px]
                            font-medium
                            text-[#222]
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








            {/* Media Files */}

            <div

                className="
                mt-5
                border-t
                border-[#eeeeee]
                pt-5
                "

            >

                <div

                    className="
                    flex
                    items-center
                    gap-2
                    "

                >

                    <FileImage

                        size={16}

                        className="text-[#555]"

                    />


                    <p

                        className="
                        text-[12px]
                        font-medium
                        uppercase
                        text-[#999]
                        "

                    >

                        Media Files

                    </p>


                </div>





                {
                    mediaFiles.length === 0 ? (

                        <p

                            className="
                            mt-3
                            text-[12px]
                            text-[#999]
                            "

                        >

                            No media files

                        </p>


                    ) : (


                        <div

                            className="
                            mt-3
                            grid
                            grid-cols-2
                            gap-2
                            "

                        >

                            {
                                mediaFiles.map(

                                    (file)=>(

                                        <img

                                            key={
                                                file.id
                                            }

                                            src={
                                                file.file_url ||
                                                file.file_path
                                            }

                                            alt={
                                                file.file_name
                                            }

                                            className="
                                            h-[70px]
                                            w-full
                                            rounded-md
                                            object-cover
                                            "

                                        />

                                    )

                                )
                            }


                        </div>


                    )

                }


            </div>





        </aside>

    );

};


export default InboxContextPanel;