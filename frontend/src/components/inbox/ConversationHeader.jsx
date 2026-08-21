import {
    User,
    Circle,
} from "lucide-react";


const ConversationHeader = ({
    conversation,
}) => {


    if (!conversation) {

        return null;

    }


    const customer =
        conversation.customer ||
        conversation.user ||
        null;


    const name =
        customer?.name ||
        customer?.first_name ||
        "Customer";


    const email =
        customer?.email ||
        "";


    const photo =
        customer?.photo_url ||
        customer?.photo ||
        null;


    const status =
        conversation.status ||
        "open";


    return (

        <div
            className="
            flex
            h-[64px]
            items-center
            justify-between
            border-b
            border-[#e5e5e5]
            bg-white
            px-5
            "
        >


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
                    h-[38px]
                    w-[38px]
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-full
                    bg-[#eef4ff]
                    text-[#2065D1]
                    "
                >

                    {photo ? (

                        <img
                            src={photo}
                            alt={name}
                            className="
                            h-full
                            w-full
                            object-cover
                            "
                        />

                    ) : (

                        <User
                            size={18}
                        />

                    )}

                </div>



                <div>

                    <h3
                        className="
                        text-[15px]
                        font-semibold
                        text-[#222]
                        "
                    >
                        {name}
                    </h3>


                    <p
                        className="
                        text-[12px]
                        text-[#777]
                        "
                    >
                        {email}
                    </p>


                </div>


            </div>



            <div
                className="
                flex
                items-center
                gap-2
                rounded-full
                bg-[#f5f8ff]
                px-3
                py-1
                "
            >

                <Circle
                    size={8}
                    fill={
                        status === "open"
                            ? "#22c55e"
                            : "#999"
                    }
                    className={
                        status === "open"
                            ? "text-green-500"
                            : "text-gray-400"
                    }
                />


                <span
                    className="
                    text-[12px]
                    font-medium
                    capitalize
                    text-[#555]
                    "
                >
                    {status}
                </span>


            </div>


        </div>

    );

};


export default ConversationHeader;