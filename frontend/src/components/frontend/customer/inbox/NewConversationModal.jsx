import {
    X,
    Send,
    Search,
    Store,
    ChevronDown,
} from "lucide-react";

import {
    useEffect,
    useRef,
    useState,
} from "react";


const NewConversationModal = ({
    open,
    onClose,
    vendors,
    onSubmit,
}) => {


    const [vendorId, setVendorId] = useState("");

    const [subject, setSubject] = useState("");

    const [message, setMessage] = useState("");

    const [vendorOpen, setVendorOpen] = useState(false);

    const [search, setSearch] = useState("");


    const dropdownRef = useRef(null);



    const selectedVendor =
        vendors?.find(
            vendor =>
            String(vendor.id) === String(vendorId)
        );



    useEffect(()=>{

        const handleClickOutside = (e)=>{

            if(
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target)
            ){

                setVendorOpen(false);

            }

        };


        document.addEventListener(
            "mousedown",
            handleClickOutside
        );


        return ()=>{

            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );

        };


    },[]);





    if(!open){

        return null;

    }





    const filteredVendors =
        vendors?.filter(
            vendor =>
            vendor.store_name
            ?.toLowerCase()
            .includes(
                search.toLowerCase()
            )
        );





    const handleSubmit = ()=>{


        if(
            !vendorId ||
            !message.trim()
        ){

            return;

        }



        onSubmit({

            vendor_id: vendorId,

            subject,

            message

        });


    };






    return (

        <div

            className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            bg-black/40
            backdrop-blur-sm
            "

        >



            <div

                className="
                w-full
                max-w-[560px]
                rounded-[18px]
                bg-white
                shadow-[0_25px_70px_rgba(0,0,0,0.18)]
                "

            >



                {/* Header */}

                <div

                    className="
                    flex
                    items-start
                    justify-between
                    border-b
                    border-[#ededed]
                    px-7
                    py-6
                    "

                >

                    <div>

                        <h2
                            className="
                            text-[20px]
                            font-semibold
                            text-[#171717]
                            "
                        >

                            New message

                        </h2>


                        <p
                            className="
                            mt-1
                            text-[13px]
                            text-[#777]
                            "
                        >

                            Contact a store regarding your order or question

                        </p>

                    </div>



                    <button

                        onClick={onClose}

                        className="
                        flex
                        h-8
                        w-8
                        items-center
                        justify-center
                        rounded-full
                        text-[#777]
                        hover:bg-[#f5f5f5]
                        "

                    >

                        <X size={18}/>

                    </button>


                </div>






                <div

                    className="
                    space-y-5
                    px-7
                    py-6
                    "

                >





                    {/* Vendor Picker */}


                    <div
                        ref={dropdownRef}
                        className="relative"
                    >

                        <label
                            className="
                            mb-2
                            block
                            text-[13px]
                            font-medium
                            text-[#444]
                            "
                        >

                            Select store

                        </label>



                        <button

                            type="button"

                            onClick={()=>
                                setVendorOpen(
                                    !vendorOpen
                                )
                            }


                            className="
                            flex
                            h-[48px]
                            w-full
                            items-center
                            justify-between
                            rounded-[10px]
                            border
                            border-[#dcdcdc]
                            bg-white
                            px-4
                            "

                        >


                            <div className="
                            flex
                            items-center
                            gap-3
                            ">


                                {
                                    selectedVendor ? (

                                        <>
                                            <div
                                                className="
                                                h-7
                                                w-7
                                                overflow-hidden
                                                rounded-full
                                                bg-[#f1f1f1]
                                                "
                                            >

                                                {
                                                    selectedVendor.logo_url ? (

                                                        <img
                                                            src={selectedVendor.logo_url}
                                                            className="
                                                            h-full
                                                            w-full
                                                            object-cover
                                                            "
                                                        />

                                                    ) : (

                                                        <Store size={14}/>

                                                    )
                                                }

                                            </div>


                                            <span
                                                className="
                                                text-[14px]
                                                text-[#333]
                                                "
                                            >

                                                {selectedVendor.store_name}

                                            </span>

                                        </>


                                    ) : (

                                        <>

                                            <Search
                                                size={16}
                                                className="text-[#999]"
                                            />

                                            <span
                                                className="
                                                text-[14px]
                                                text-[#999]
                                                "
                                            >

                                                Search and select vendor

                                            </span>

                                        </>

                                    )
                                }


                            </div>



                            <ChevronDown
                                size={16}
                                className="text-[#777]"
                            />


                        </button>





                        {
                            vendorOpen && (

                                <div

                                    className="
                                    absolute
                                    left-0
                                    top-[76px]
                                    z-50
                                    w-full
                                    overflow-hidden
                                    rounded-[12px]
                                    border
                                    border-[#e5e7eb]
                                    bg-white
                                    shadow-[0_15px_40px_rgba(0,0,0,0.12)]
                                    "

                                >



                                    <div
                                        className="
                                        border-b
                                        border-[#eee]
                                        p-3
                                        "
                                    >

                                        <div
                                            className="
                                            flex
                                            items-center
                                            gap-2
                                            rounded-[8px]
                                            bg-[#f7f7f7]
                                            px-3
                                            "
                                        >

                                            <Search
                                                size={15}
                                                className="text-[#999]"
                                            />


                                            <input

                                                value={search}

                                                onChange={
                                                    e =>
                                                    setSearch(
                                                        e.target.value
                                                    )
                                                }

                                                placeholder="Search store..."

                                                className="
                                                h-[36px]
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
                                        max-h-[220px]
                                        overflow-y-auto
                                        "
                                    >

                                        {
                                            filteredVendors?.map(
                                                vendor=>(


                                                    <button

                                                        key={vendor.id}

                                                        type="button"

                                                        onClick={()=>{

                                                            setVendorId(
                                                                String(vendor.id)
                                                            );

                                                            setVendorOpen(false);

                                                            setSearch("");

                                                        }}


                                                        className="
                                                        flex
                                                        w-full
                                                        items-center
                                                        gap-3
                                                        px-4
                                                        py-3
                                                        hover:bg-[#f7f8ff]
                                                        "

                                                    >


                                                        <div
                                                            className="
                                                            flex
                                                            h-9
                                                            w-9
                                                            overflow-hidden
                                                            items-center
                                                            justify-center
                                                            rounded-full
                                                            bg-[#f2f2f2]
                                                            "
                                                        >

                                                            {
                                                                vendor.logo_url ? (

                                                                    <img
                                                                        src={vendor.logo_url}
                                                                        className="
                                                                        h-full
                                                                        w-full
                                                                        object-cover
                                                                        "
                                                                    />

                                                                ) : (

                                                                    <Store size={16}/>

                                                                )
                                                            }

                                                        </div>



                                                        <div
                                                            className="text-left"
                                                        >

                                                            <p
                                                                className="
                                                                text-[14px]
                                                                font-medium
                                                                text-[#222]
                                                                "
                                                            >

                                                                {vendor.store_name}

                                                            </p>


                                                            <p
                                                                className="
                                                                text-[12px]
                                                                text-[#888]
                                                                "
                                                            >

                                                                Vendor store

                                                            </p>


                                                        </div>


                                                    </button>


                                                )
                                            )
                                        }


                                    </div>



                                </div>

                            )
                        }



                    </div>









                    <div>

                        <label className="
                        mb-2
                        block
                        text-[13px]
                        font-medium
                        text-[#444]
                        ">

                            Subject

                        </label>


                        <input

                            value={subject}

                            onChange={
                                e =>
                                setSubject(
                                    e.target.value
                                )
                            }

                            placeholder="What is your question about?"

                            className="
                            h-[46px]
                            w-full
                            rounded-[10px]
                            border
                            border-[#dcdcdc]
                            px-4
                            text-[14px]
                            outline-none
                            focus:border-[#2065D1]
                            "

                        />


                    </div>







                    <div>

                        <label className="
                        mb-2
                        block
                        text-[13px]
                        font-medium
                        text-[#444]
                        ">

                            Message

                        </label>


                        <textarea

                            value={message}

                            onChange={
                                e =>
                                setMessage(
                                    e.target.value
                                )
                            }

                            rows="5"

                            placeholder="Write your message..."

                            className="
                            w-full
                            resize-none
                            rounded-[10px]
                            border
                            border-[#dcdcdc]
                            px-4
                            py-3
                            text-[14px]
                            outline-none
                            focus:border-[#2065D1]
                            "

                        />


                    </div>




                </div>






                <div

                    className="
                    flex
                    justify-end
                    gap-3
                    border-t
                    border-[#ededed]
                    px-7
                    py-5
                    "

                >


                    <button

                        onClick={onClose}

                        className="
                        rounded-[10px]
                        border
                        border-[#dcdcdc]
                        px-5
                        py-2.5
                        text-[14px]
                        font-medium
                        "

                    >

                        Cancel

                    </button>




                    <button

                        onClick={handleSubmit}

                        className="
                        flex
                        items-center
                        gap-2
                        rounded-[10px]
                        bg-[#2065D1]
                        px-6
                        py-2.5
                        text-[14px]
                        font-medium
                        text-white
                        "

                    >

                        Send message

                        <Send size={16}/>

                    </button>


                </div>



            </div>



        </div>


    );

};


export default NewConversationModal;