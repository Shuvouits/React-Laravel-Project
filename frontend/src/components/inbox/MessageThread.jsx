import {
    LoaderCircle,
} from "lucide-react";

import MessageBubble from "./MessageBubble";


const MessageThread = ({
    messages = [],
    loading = false,
    currentUserId,
    messagesEndRef,
}) => {


    if (loading) {

        return (

            <div
                className="
                flex
                h-full
                items-center
                justify-center
                "
            >

                <LoaderCircle
                    size={22}
                    className="
                    animate-spin
                    text-[#2065D1]
                    "
                />

            </div>

        );

    }



    if (
        !messages ||
        messages.length === 0
    ) {

        return (

            <div
                className="
                flex
                h-full
                items-center
                justify-center
                text-[14px]
                text-[#999]
                "
            >

                No messages yet.

            </div>

        );

    }



    return (

        <div
            className="
            flex-1
            overflow-y-auto
            bg-white
            px-5
            py-5
            "
        >

            {messages.map(
                (message) => (

                    <MessageBubble

                        key={
                            message.id
                        }

                        message={
                            message
                        }

                        currentUserId={
                            currentUserId
                        }

                    />

                )
            )}



            <div
                ref={
                    messagesEndRef
                }
            />

        </div>

    );

};


export default MessageThread;