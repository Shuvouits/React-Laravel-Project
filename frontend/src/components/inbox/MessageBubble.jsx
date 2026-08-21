import MessageAttachment from "./MessageAttachment";


const MessageBubble = ({
    message,
    currentUserId,
}) => {

    const isMine =
        Number(message.sender_user_id) ===
        Number(currentUserId);


    const senderName =
        message.sender?.name ||
        message.sender?.first_name ||
        "User";


    return (

        <div
            className={`
                flex
                mb-4
                ${
                    isMine
                        ? "justify-end"
                        : "justify-start"
                }
            `}
        >

            <div
                className={`
                    max-w-[75%]
                    ${
                        isMine
                            ? "items-end"
                            : "items-start"
                    }
                    flex
                    flex-col
                `}
            >


                {!isMine && (

                    <span
                        className="
                        mb-1
                        text-[12px]
                        text-[#777]
                        "
                    >
                        {senderName}
                    </span>

                )}



                <div
                    className={`
                        rounded-[14px]
                        px-4
                        py-3
                        text-[14px]
                        leading-[22px]
                        whitespace-pre-wrap
                        break-words

                        ${
                            isMine
                                ? `
                                bg-[#2065D1]
                                text-white
                                `
                                : `
                                bg-[#f3f4f6]
                                text-[#333]
                                `
                        }
                    `}
                >


                    {message.message && (

                        <p>
                            {message.message}
                        </p>

                    )}



                    <MessageAttachment

                        attachments={
                            message.attachments || []
                        }

                    />


                </div>



                <span
                    className={`
                        mt-1
                        text-[10px]
                        ${
                            isMine
                                ? "text-right"
                                : "text-left"
                        }
                        text-[#999]
                    `}
                >

                    {message.created_at}

                </span>


            </div>


        </div>

    );

};


export default MessageBubble;