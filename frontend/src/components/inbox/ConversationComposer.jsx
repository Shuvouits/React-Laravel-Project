import {
    Paperclip,
    Send,
    X,
} from "lucide-react";


const ConversationComposer = ({
    message,
    setMessage,
    selectedFile,
    setSelectedFile,
    handleFileSelect,
    onSend,
    sending,
}) => {


    return (
        <div className="border-t border-[#e5e5e5] bg-white p-[12px]">


            {selectedFile && (

                <div
                    className="
                    mb-2
                    flex
                    items-center
                    justify-between
                    rounded-[10px]
                    bg-[#f6f7f9]
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

                        <Paperclip
                            size={14}
                            className="text-[#666]"
                        />


                        <span
                            className="
                            max-w-[240px]
                            truncate
                            text-[12px]
                            text-[#555]
                            "
                        >
                            {selectedFile.name}
                        </span>

                    </div>


                    <button
                        type="button"
                        onClick={() =>
                            setSelectedFile(null)
                        }
                        className="
                        text-[#ff3b30]
                        hover:text-[#d92d20]
                        "
                    >

                        <X size={14}/>

                    </button>


                </div>

            )}



            <div
                className="
                flex
                items-end
                gap-2
                rounded-[22px]
                border
                border-[#dddddd]
                bg-white
                px-3
                py-2
                focus-within:border-[#aac1e6]
                "
            >


                <textarea

                    value={message}

                    onChange={(event) =>
                        setMessage(
                            event.target.value
                        )
                    }

                    rows={1}

                    placeholder="Write a reply..."

                    className="
                    max-h-[100px]
                    min-h-[38px]
                    flex-1
                    resize-none
                    bg-transparent
                    px-2
                    py-2
                    text-[14px]
                    leading-[22px]
                    text-[#333]
                    outline-none
                    placeholder:text-[#999]
                    "

                />



                <label
                    className="
                    flex
                    h-[32px]
                    w-[32px]
                    cursor-pointer
                    items-center
                    justify-center
                    rounded-full
                    text-[#777]
                    hover:bg-[#f5f5f5]
                    "
                >

                    <Paperclip size={16}/>


                    <input

                        type="file"

                        hidden

                        accept="
                            image/*,
                            .pdf,
                            .doc,
                            .docx
                        "

                        onChange={
                            handleFileSelect
                        }

                    />


                </label>



                <button

                    type="button"

                    onClick={onSend}

                    disabled={
                        sending ||
                        (
                            !message.trim() &&
                            !selectedFile
                        )
                    }

                    className="
                    flex
                    h-[36px]
                    w-[36px]
                    items-center
                    justify-center
                    rounded-full
                    bg-[#2065D1]
                    text-white
                    transition
                    hover:bg-[#1958ba]
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    "

                >

                    <Send size={15}/>

                </button>


            </div>


        </div>
    );
};


export default ConversationComposer;