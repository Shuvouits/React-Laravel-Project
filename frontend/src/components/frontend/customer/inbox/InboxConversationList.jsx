import {
    Search,
    MessageCircle,
} from "lucide-react";


const InboxConversationList = ({
    conversations = [],
    selectedConversation,
    setSelectedConversation,
    search = "",
    setSearch,
    loading,
}) => {


    const safeConversations =
        Array.isArray(conversations)
            ? conversations
            : [];



    const filteredConversations =
        safeConversations.filter((conversation)=>{


            const keyword =
                search.toLowerCase();



            const vendorName =
                conversation.vendor?.store_name ||
                conversation.vendor?.name ||
                "";



            const subject =
                conversation.subject ||
                "";



            return (

                vendorName
                    .toLowerCase()
                    .includes(keyword)

                ||

                subject
                    .toLowerCase()
                    .includes(keyword)

            );


        });





    return (

        <div

            className="
            flex
            h-full
            min-w-0
            flex-col
            border-r
            border-[#e5e5e5]
            "

        >


            <div

                className="
                px-4
                pt-4
                "

            >

                <h2

                    className="
                    text-[17px]
                    font-semibold
                    text-[#222]
                    "

                >

                    Store conversations

                </h2>


                <p

                    className="
                    mt-1
                    text-[12px]
                    text-[#777]
                    "

                >

                    {safeConversations.length} conversations

                </p>


            </div>





            <div

                className="
                px-4
                py-4
                "

            >

                <div

                    className="
                    flex
                    h-[38px]
                    items-center
                    gap-2
                    rounded-lg
                    border
                    border-[#dedede]
                    px-3
                    "

                >

                    <Search
                        size={15}
                        className="text-[#999]"
                    />


                    <input

                        value={search}

                        onChange={(e)=>
                            setSearch(
                                e.target.value
                            )
                        }

                        placeholder="Search conversations"

                        className="
                        w-full
                        bg-transparent
                        text-[13px]
                        outline-none
                        "

                    />

                </div>


            </div>







            <div

                className="
                flex
                gap-2
                overflow-x-auto
                border-b
                border-[#eeeeee]
                px-4
                pb-3
                "

            >

                {
                    [
                        "All",
                        "Unread",
                        "Open",
                        "Pending",
                        "Resolved",
                    ].map((item)=>(

                        <button

                            key={item}

                            className={`
                            whitespace-nowrap
                            rounded-full
                            px-3
                            py-1.5
                            text-[12px]

                            ${
                                item === "All"
                                ?
                                "bg-[#2065D1] text-white"
                                :
                                "bg-[#f5f5f5] text-[#666]"
                            }
                            `}

                        >

                            {item}

                        </button>

                    ))
                }


            </div>







            <div

                className="
                flex-1
                overflow-y-auto
                "

            >


                {
                    loading ? (

                        <div

                            className="
                            p-5
                            text-center
                            text-[13px]
                            text-[#777]
                            "

                        >

                            Loading...

                        </div>


                    ) : filteredConversations.length === 0 ? (


                        <div

                            className="
                            flex
                            h-full
                            flex-col
                            items-center
                            justify-center
                            gap-3
                            text-center
                            "

                        >

                            <MessageCircle

                                size={32}

                                className="text-[#aaa]"

                            />


                            <p

                                className="
                                text-[13px]
                                text-[#777]
                                "

                            >

                                No conversations found.

                            </p>


                        </div>


                    ) : (


                        filteredConversations.map((conversation)=>(


                            <button

                                key={
                                    conversation.id
                                }

                                type="button"

                                onClick={()=>


                                    setSelectedConversation(

                                        conversation

                                    )

                                }


                                className={`

                                flex
                                w-full
                                gap-3
                                border-b
                                border-[#eeeeee]
                                px-4
                                py-4
                                text-left

                                ${
                                    selectedConversation?.id === conversation.id

                                    ?

                                    "bg-[#eef4ff]"

                                    :

                                    "hover:bg-[#fafafa]"

                                }

                                `}

                            >



                              <div
    className="
    flex
    h-[40px]
    w-[40px]
    shrink-0
    overflow-hidden
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

    conversation.vendor?.logo_url ? (

        <img

            src={
                conversation.vendor.logo_url
            }

            alt={
                conversation.vendor.store_name
            }

            className="
            h-full
            w-full
            object-cover
            "
            
            onError={(e)=>{

                e.currentTarget.style.display="none";

            }}

        />

    ) : (

        (
            conversation.vendor?.store_name ||
            "S"
        )
        .charAt(0)
        .toUpperCase()

    )

}

</div>





                                <div

                                    className="
                                    min-w-0
                                    flex-1
                                    "

                                >

                                    <h3

                                        className="
                                        truncate
                                        text-[14px]
                                        font-medium
                                        text-[#222]
                                        "

                                    >

                                        {
                                            conversation.vendor?.store_name ||
                                            conversation.vendor?.name ||
                                            "Store"
                                        }

                                    </h3>



                                    <p

                                        className="
                                        mt-1
                                        truncate
                                        text-[12px]
                                        text-[#777]
                                        "

                                    >

                                        {
                                            conversation.subject ||
                                            "Live chat"
                                        }

                                    </p>


                                </div>



                            </button>


                        ))

                    )

                }


            </div>



        </div>


    );

};


export default InboxConversationList;