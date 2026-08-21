import {
    Search,
} from "lucide-react";


const InboxSidebar = ({
    conversations = [],
    selectedId,
    onSelect,
    search = "",
    setSearch = () => {},
    loading = false,
}) => {


    const filteredConversations =
        Array.isArray(conversations)
            ? conversations.filter((item) => {

                const name =
                    item.customer?.name ||
                    item.user?.name ||
                    item.customer?.email ||
                    "";


                return name
                    .toLowerCase()
                    .includes(
                        (search || "").toLowerCase()
                    );

            })
            : [];



    return (

        <aside
            className="
            flex
            w-[320px]
            flex-col
            border-r
            border-[#e5e5e5]
            bg-white
            "
        >


            <div
                className="
                border-b
                border-[#e5e5e5]
                p-4
                "
            >

                <h2
                    className="
                    mb-3
                    text-[18px]
                    font-semibold
                    text-[#222]
                    "
                >
                    Inbox
                </h2>


                <div
                    className="
                    flex
                    h-[38px]
                    items-center
                    gap-2
                    rounded-lg
                    border
                    border-[#dddddd]
                    px-3
                    "
                >

                    <Search
                        size={15}
                        className="text-[#888]"
                    />


                    <input
                        value={search}
                        onChange={(event) =>
                            setSearch(
                                event.target.value
                            )
                        }
                        placeholder="Search conversations..."
                        className="
                        w-full
                        bg-transparent
                        text-[13px]
                        text-[#333]
                        outline-none
                        placeholder:text-[#999]
                        "
                    />

                </div>

            </div>



            <div
                className="
                flex-1
                overflow-y-auto
                "
            >

                {loading ? (

                    <div
                        className="
                        p-5
                        text-center
                        text-[13px]
                        text-[#999]
                        "
                    >
                        Loading...
                    </div>

                ) : filteredConversations.length === 0 ? (

                    <div
                        className="
                        p-5
                        text-center
                        text-[13px]
                        text-[#999]
                        "
                    >
                        No conversations found.
                    </div>

                ) : (

                    filteredConversations.map(
                        (conversation) => {


                            const active =
                                Number(selectedId) ===
                                Number(conversation.id);


                            const customer =
                                conversation.customer ||
                                conversation.user ||
                                null;


                            const name =
                                customer?.name ||
                                customer?.first_name ||
                                customer?.email ||
                                "Customer";


                            const lastMessage =
                                conversation.latest_message?.message ||
                                "No messages yet";


                            const unread =
                                conversation.customer_unread_count ||
                                conversation.vendor_unread_count ||
                                0;



                            return (

                                <button

                                    key={
                                        conversation.id
                                    }

                                    type="button"

                                    onClick={() =>
                                        onSelect(
                                            conversation
                                        )
                                    }

                                    className={`
                                    flex
                                    w-full
                                    items-start
                                    gap-3
                                    border-b
                                    border-[#f0f0f0]
                                    px-4
                                    py-4
                                    text-left
                                    transition

                                    ${
                                        active
                                            ? "bg-[#f4f8ff]"
                                            : "hover:bg-[#fafafa]"
                                    }
                                    `}

                                >


                                    <div
                                        className="
                                        flex
                                        h-[38px]
                                        w-[38px]
                                        shrink-0
                                        items-center
                                        justify-center
                                        rounded-full
                                        bg-[#eef4ff]
                                        text-[14px]
                                        font-semibold
                                        text-[#2065D1]
                                        "
                                    >

                                        {
                                            name
                                                .charAt(0)
                                                .toUpperCase()
                                        }

                                    </div>



                                    <div
                                        className="
                                        min-w-0
                                        flex-1
                                        "
                                    >

                                        <div
                                            className="
                                            flex
                                            items-center
                                            justify-between
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
                                                {name}
                                            </h3>


                                            {unread > 0 && (

                                                <span
                                                    className="
                                                    rounded-full
                                                    bg-[#2065D1]
                                                    px-2
                                                    py-[2px]
                                                    text-[10px]
                                                    text-white
                                                    "
                                                >
                                                    {unread}
                                                </span>

                                            )}

                                        </div>



                                        <p
                                            className="
                                            mt-1
                                            truncate
                                            text-[12px]
                                            text-[#777]
                                            "
                                        >
                                            {lastMessage}
                                        </p>


                                    </div>


                                </button>

                            );

                        }
                    )

                )}

            </div>


        </aside>

    );

};


export default InboxSidebar;