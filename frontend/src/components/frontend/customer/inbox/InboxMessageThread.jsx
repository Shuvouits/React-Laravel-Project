import {
    FileText,
} from "lucide-react";


const InboxMessageThread = ({
    messages = [],
    loading,
    currentUserId,
    messagesEndRef,
}) => {


    const formatTime = (date) => {

        if (!date) {
            return "";
        }

        return new Date(date).toLocaleTimeString(
            [],
            {
                hour: "2-digit",
                minute: "2-digit",
            }
        );

    };



    return (

        <div
            className="
            h-full
            min-h-0
            overflow-y-auto
            bg-white
            px-5
            py-5
            "
        >


            {
                loading ? (

                    <div
                        className="
                        flex
                        h-full
                        items-center
                        justify-center
                        text-sm
                        text-gray-400
                        "
                    >
                        Loading messages...
                    </div>


                )

                :

                messages.length === 0 ? (


                    <div
                        className="
                        flex
                        h-full
                        items-center
                        justify-center
                        text-sm
                        text-gray-400
                        "
                    >
                        No messages yet.
                    </div>


                )

                :

                (

                    <div
                        className="
                        space-y-5
                        "
                    >


                        {
                            messages.map((item)=>{


                                const isMine =
                                    Number(item.sender_user_id)
                                    ===
                                    Number(currentUserId);



                                return (

                                    <div
                                        key={item.id}
                                        className={`
                                        flex
                                        w-full
                                        ${
                                            isMine
                                            ?
                                            "justify-end"
                                            :
                                            "justify-start"
                                        }
                                        `}
                                    >


                                        <div
                                            className="
                                            flex
                                            max-w-[70%]
                                            flex-col
                                            gap-2
                                            "
                                        >



                                            {
                                                item.message &&
                                                item.message !== "Attachment"
                                                &&

                                                (

                                                    <div

                                                        className={`
                                                        rounded-[14px]
                                                        px-4
                                                        py-2.5
                                                        text-[14px]

                                                        ${
                                                            isMine
                                                            ?
                                                            "bg-[#2065D1] text-white"
                                                            :
                                                            "bg-[#f3f4f6] text-[#222]"
                                                        }

                                                        `}
                                                    >

                                                        {item.message}

                                                    </div>

                                                )

                                            }




                                            {
                                                item.attachments &&
                                                item.attachments.length > 0

                                                &&

                                                (

                                                    <div
                                                        className="
                                                        space-y-2
                                                        "
                                                    >

                                                        {
                                                            item.attachments.map(
                                                                (file)=>(


                                                                    <div
                                                                        key={
                                                                            file.id
                                                                        }
                                                                    >

                                                                        {

                                                                            file.file_type?.startsWith(
                                                                                "image"
                                                                            )

                                                                            ?

                                                                            (

                                                                                <a

                                                                                    href={
                                                                                        file.file_url
                                                                                        ||
                                                                                        file.file_path
                                                                                    }

                                                                                    target="_blank"

                                                                                    rel="noreferrer"

                                                                                >

                                                                                    <img

                                                                                        src={
                                                                                            file.file_url
                                                                                            ||
                                                                                            file.file_path
                                                                                        }

                                                                                        alt={
                                                                                            file.file_name
                                                                                        }


                                                                                        className="
                                                                                        max-h-[220px]
                                                                                        max-w-[260px]
                                                                                        rounded-lg
                                                                                        border
                                                                                        border-gray-200
                                                                                        object-cover
                                                                                        "

                                                                                    />

                                                                                </a>

                                                                            )

                                                                            :

                                                                            (

                                                                                <a

                                                                                    href={
                                                                                        file.file_url
                                                                                        ||
                                                                                        file.file_path
                                                                                    }

                                                                                    target="_blank"

                                                                                    rel="noreferrer"

                                                                                    className="
                                                                                    flex
                                                                                    items-center
                                                                                    gap-2
                                                                                    rounded-lg
                                                                                    border
                                                                                    border-gray-200
                                                                                    bg-white
                                                                                    px-3
                                                                                    py-2
                                                                                    text-sm
                                                                                    text-gray-700
                                                                                    "

                                                                                >

                                                                                    <FileText
                                                                                        size={
                                                                                            16
                                                                                        }
                                                                                    />

                                                                                    {
                                                                                        file.file_name
                                                                                    }


                                                                                </a>

                                                                            )

                                                                        }


                                                                    </div>


                                                                )
                                                            )
                                                        }


                                                    </div>

                                                )

                                            }




                                            <span
                                                className="
                                                text-[10px]
                                                text-gray-400
                                                "
                                            >

                                                {
                                                    formatTime(
                                                        item.created_at
                                                    )
                                                }

                                            </span>



                                        </div>



                                    </div>

                                );


                            })
                        }


                    </div>

                )

            }



            <div
                ref={messagesEndRef}
            />


        </div>

    );

};


export default InboxMessageThread;