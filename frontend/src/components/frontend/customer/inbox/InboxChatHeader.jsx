import {
    Circle,
} from "lucide-react";



const InboxChatHeader = ({
    conversation,
}) => {


    if(!conversation){

        return (

            <div
                className="
                flex
                h-[72px]
                items-center
                justify-center
                border-b
                border-[#e5e5e5]
                text-[13px]
                text-[#999]
                "
            >

                Select a conversation

            </div>

        );

    }




    const storeName =
        conversation.vendor?.store_name ||
        conversation.vendor?.name ||
        "Store";



    return (

        <div

            className="
            flex
            h-[72px]
            items-center
            gap-3
            border-b
            border-[#e5e5e5]
            px-5
            "

        >


            <div

                className="
                flex
                h-[38px]
                w-[38px]
                items-center
                justify-center
                rounded-full
                bg-[#eef4ff]
                text-[13px]
                font-semibold
                text-[#2065D1]
                "

            >

                {
                    storeName
                        .charAt(0)
                        .toUpperCase()
                }


            </div>




            <div
                className="
                flex-1
                "
            >


                <h3

                    className="
                    text-[15px]
                    font-semibold
                    text-[#222]
                    "

                >

                    {storeName}

                </h3>



                <div

                    className="
                    mt-1
                    flex
                    items-center
                    gap-2
                    "

                >

                    <span

                        className="
                        text-[11px]
                        text-[#777]
                        "

                    >

                        Live chat

                    </span>




                    <span

                        className="
                        flex
                        items-center
                        gap-1
                        rounded-full
                        bg-[#ecfdf3]
                        px-2
                        py-0.5
                        text-[10px]
                        font-medium
                        text-[#16a34a]
                        "

                    >

                        <Circle
                            size={6}
                            fill="currentColor"
                        />

                        {
                            conversation.status ||
                            "Open"
                        }


                    </span>


                </div>


            </div>



        </div>

    );

};


export default InboxChatHeader;