import {
    FileText,
    Download,
} from "lucide-react";


const MessageAttachment = ({
    attachments = [],
}) => {

    if (
        !attachments ||
        attachments.length === 0
    ) {
        return null;
    }


    return (

        <div className="mt-3 space-y-2">

            {attachments.map(
                (file, index) => {

                    const url =
                        file.file_url ||
                        file.preview_url ||
                        file.url ||
                        "#";


                    const name =
                        file.file_name ||
                        file.name ||
                        "Attachment";


                    const type =
                        file.file_type ||
                        file.type ||
                        "";


                    const isImage =
                        type.startsWith(
                            "image"
                        );


                    return (

                        <div
                            key={
                                file.id ||
                                index
                            }
                        >

                            {isImage ? (

                                <a
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                >

                                    <img

                                        src={url}

                                        alt={name}

                                        className="
                                        max-w-[240px]
                                        rounded-[12px]
                                        border
                                        border-[#e5e5e5]
                                        object-cover
                                        "

                                    />

                                </a>

                            ) : (

                                <a

                                    href={url}

                                    target="_blank"

                                    rel="noreferrer"

                                    className="
                                    flex
                                    items-center
                                    gap-2
                                    rounded-[10px]
                                    border
                                    border-[#e5e5e5]
                                    bg-[#fafafa]
                                    px-3
                                    py-2
                                    text-[13px]
                                    text-[#333]
                                    "

                                >

                                    <FileText
                                        size={16}
                                        className="text-[#2563eb]"
                                    />


                                    <span
                                        className="
                                        max-w-[180px]
                                        truncate
                                        "
                                    >
                                        {name}
                                    </span>


                                    <Download
                                        size={14}
                                        className="ml-auto text-[#777]"
                                    />

                                </a>

                            )}

                        </div>

                    );

                }

            )}

        </div>

    );

};


export default MessageAttachment;