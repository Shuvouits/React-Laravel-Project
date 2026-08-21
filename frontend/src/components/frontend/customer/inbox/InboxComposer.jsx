import {
    Paperclip,
    Send,
    X,
    Image as ImageIcon,
    FileText,
} from "lucide-react";



const InboxComposer = ({
    message,
    setMessage,
    selectedFile,
    setSelectedFile,
    handleFileSelect,
    onSend,
    sending,
}) => {



    const handleKeyDown = (
        event
    ) => {


        if(
            event.key === "Enter" &&
            !event.shiftKey
        ){

            event.preventDefault();

            onSend();

        }

    };





    return (

        <div

            className="
            border-t
            border-[#e5e5e5]
            bg-white
            px-5
            py-4
            "

        >



            {
                selectedFile && (

                    <div

                        className="
                        mb-3
                        flex
                        items-center
                        justify-between
                        rounded-lg
                        border
                        border-[#dedede]
                        bg-[#f8f9fb]
                        px-3
                        py-2
                        "

                    >



                        <div

                            className="
                            flex
                            min-w-0
                            items-center
                            gap-2
                            "

                        >

                            {
                                selectedFile.type.startsWith(
                                    "image"
                                )
                                ?

                                <ImageIcon
                                    size={15}
                                    className="text-[#2065D1]"
                                />

                                :

                                <FileText
                                    size={15}
                                    className="text-[#777]"
                                />

                            }



                            <span

                                className="
                                max-w-[300px]
                                truncate
                                text-[12px]
                                text-[#555]
                                "

                            >

                                {
                                    selectedFile.name
                                }

                            </span>


                        </div>




                        <button

                            type="button"

                            onClick={() =>
                                setSelectedFile(
                                    null
                                )
                            }

                            className="
                            text-red-500
                            "

                        >

                            <X
                                size={15}
                            />

                        </button>


                    </div>

                )
            }







            <div

                className="
                flex
                items-end
                gap-3
                "

            >



                <label

                    className="
                    flex
                    h-[42px]
                    w-[42px]
                    cursor-pointer
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-[#dedede]
                    text-[#666]
                    transition
                    hover:bg-[#f5f5f5]
                    "

                >

                    <Paperclip
                        size={18}
                    />



                    <input

                        type="file"

                        hidden

                        accept="
                        image/*,
                        application/pdf,
                        .doc,
                        .docx
                        "

                        onChange={
                            handleFileSelect
                        }

                    />


                </label>






              <textarea

    value={message}

    onChange={(event)=>
        setMessage(
            event.target.value
        )
    }

    onKeyDown={
        handleKeyDown
    }

    rows={1}

    placeholder="Write a reply..."

    className="
    h-[42px]
    max-h-[42px]
    flex-1
    resize-none
    overflow-hidden
    rounded-[10px]
    border
    border-[#dedede]
    px-4
    py-2.5
    text-[14px]
    leading-[20px]
    text-[#222]
    outline-none
    placeholder:text-[#999]
    focus:border-[#2065D1]
    "

/>






                <button

                    type="button"

                    onClick={
                        onSend
                    }

                    disabled={
                        sending
                    }

                    className="
                    flex
                    h-[42px]
                    w-[42px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#2065D1]
                    text-white
                    transition
                    hover:bg-[#1958ba]
                    disabled:opacity-50
                    "

                >

                    <Send
                        size={18}
                    />

                </button>



            </div>


        </div>

    );

};


export default InboxComposer;