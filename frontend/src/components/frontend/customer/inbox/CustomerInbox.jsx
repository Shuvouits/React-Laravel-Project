import {
    useEffect,
    useRef,
    useState,
} from "react";


import api from "../../../../api/axios";


import CustomerSidebar from "../../account/CustomerSidebar";


import InboxConversationList from "./InboxConversationList";
import InboxChatHeader from "./InboxChatHeader";
import InboxMessageThread from "./InboxMessageThread";
import InboxComposer from "./InboxComposer";
import InboxContextPanel from "./InboxContextPanel";
import NewConversationModal from "./NewConversationModal";




const CustomerInbox = () => {


    const [conversations, setConversations] =
        useState([]);

        const [search, setSearch] = useState("");


    const [selectedConversation, setSelectedConversation] =
        useState(null);



    const [messages, setMessages] =
        useState([]);



    const [message, setMessage] =
        useState("");



    const [selectedFile, setSelectedFile] =
        useState(null);



    const [loading, setLoading] =
        useState(false);



    const [loadingMessages, setLoadingMessages] =
        useState(false);



    const [sending, setSending] =
        useState(false);



    const [showModal, setShowModal] =
        useState(false);



    const [vendors, setVendors] =
        useState([]);




    const messagesEndRef =
        useRef(null);








    const fetchConversations = async()=>{


        try{


            setLoading(true);


          const response =
    await api.get(
        "/customer/messages"
    );


const data =
    response.data?.conversations ||
    response.data?.data?.conversations ||
    response.data?.data ||
    [];


setConversations(
    Array.isArray(data)
        ? data
        : []
);


        }catch(error){


            console.log(error);


        }finally{


            setLoading(false);


        }


    };









    const fetchVendors = async()=>{

    try{

        const response =
            await api.get(
                "/customer/messages/vendors"
            );


        console.log(
            "VENDOR RESPONSE:",
            response.data
        );


        const data =
            response.data?.vendors || [];


        console.log(
            "FINAL VENDORS:",
            data
        );


        setVendors(data);



    }catch(error){


        console.log(
            "Vendor load error:",
            error.response?.data ||
            error.message
        );


    }


};








   const fetchMessages = async(conversation)=>{


    if(!conversation){

        return;

    }



    try{


        setLoadingMessages(true);



        const response =
            await api.get(
                `/customer/messages/${conversation.id}`
            );



        setMessages(

            response.data?.conversation?.messages || []

        );



    }catch(error){


        console.log(

            "Fetch messages error:",

            error.response?.data ||
            error.message

        );


    }finally{


        setLoadingMessages(false);


    }


};









    useEffect(()=>{


        fetchConversations();


    },[]);







    useEffect(()=>{


        if(showModal){

            fetchVendors();

        }


    },[
        showModal
    ]);








    useEffect(()=>{


        fetchMessages(
            selectedConversation
        );


    },[
        selectedConversation?.id
    ]);








    useEffect(()=>{


        messagesEndRef.current?.scrollIntoView({

            behavior:"smooth"

        });


    },[
        messages
    ]);









  const handleSend = async()=>{


    if(
        sending ||
        !selectedConversation ||
        (
            !message.trim() &&
            !selectedFile
        )
    ){

        return;

    }




    try{


        setSending(true);



        const formData =
            new FormData();



        formData.append(
            "message",
            message || "Attachment"
        );



        if(selectedFile){


            formData.append(
                "attachment",
                selectedFile
            );


        }





        await api.post(


            `/customer/messages/${selectedConversation.id}/messages`,


            formData,


            {

                headers:{

                    "Content-Type":
                    "multipart/form-data"

                }

            }


        );





        setMessage("");

        setSelectedFile(null);




        await fetchMessages(
            selectedConversation
        );



        await fetchConversations();




    }catch(error){



        console.log(

            "Send message error:",

            error.response?.data ||
            error.message

        );



    }finally{


        setSending(false);


    }


};








    const handleFileSelect = (event)=>{


        const file =
            event.target.files[0];


        if(file){

            setSelectedFile(file);

        }


    };









   const handleNewConversation = async(data)=>{


    try{


        const response =
            await api.post(

                "/customer/messages",

                data

            );




        setShowModal(false);



        await fetchConversations();




        if(
            response.data?.conversation_id
        ){


            const conversationResponse =
                await api.get(

                    `/customer/messages/${response.data.conversation_id}`

                );



            setSelectedConversation(

                conversationResponse.data.conversation

            );


        }




    }catch(error){



        console.log(

            "Create conversation error:",

            error.response?.data ||
            error.message

        );



    }


};









    const user =
        JSON.parse(
            localStorage.getItem("user")
        );









    return (

        <main

            className="
            min-h-screen
            bg-[#f7f8fa]
            "

        >



            <div

                className="
                mx-auto
                flex
                max-w-[1320px]
                gap-[30px]
                px-5
                py-6
                "

            >



                <CustomerSidebar />






                <div

                    className="
                    min-w-0
                    flex-1
                    "

                >




                    <div

                        className="
                        mb-5
                        flex
                        items-start
                        justify-between
                        "

                    >



                        <div>


                            <h1

                                className="
                                text-[22px]
                                font-semibold
                                text-[#171717]
                                "

                            >

                                Inbox

                            </h1>



                            <p

                                className="
                                mt-1
                                text-[14px]
                                text-[#777]
                                "

                            >

                                Continue your conversations with stores.

                            </p>


                        </div>





                        <button

                            onClick={()=>setShowModal(true)}

                            className="
                            rounded-[8px]
                            bg-[#2065D1]
                            px-4
                            py-2
                            text-[14px]
                            font-medium
                            text-white
                            "

                        >

                            + New Message


                        </button>




                    </div>









                    <div

                        className="
                        flex
                        h-[calc(100vh-230px)]
                        min-h-[600px]
                        max-h-[760px]
                        overflow-hidden
                        rounded-[12px]
                        border
                        border-[#dedede]
                        bg-white
                        "

                    >






                        <div

                            className="
                            w-[320px]
                            shrink-0
                            border-r
                            border-[#e5e5e5]
                            "

                        >



                          <InboxConversationList

    conversations={conversations}

    selectedConversation={selectedConversation}

    setSelectedConversation={setSelectedConversation}

    search={search}

    setSearch={setSearch}

    loading={loading}

/>


                        </div>









                        <div

                            className="
                            
                             flex
    min-w-0
    min-h-0
    flex-1
    flex-col
    overflow-hidden

                            "

                        >



                            <InboxChatHeader

                                conversation={
                                    selectedConversation
                                }

                            />




                            <div

                                className="
                                
                                 min-h-0
    flex-1
    overflow-hidden
    
                                "

                            >


                                <InboxMessageThread

                                    messages={
                                        messages
                                    }


                                    loading={
                                        loadingMessages
                                    }


                                    currentUserId={
                                        user?.id
                                    }


                                    messagesEndRef={
                                        messagesEndRef
                                    }


                                />



                            </div>







                            <InboxComposer


                                message={
                                    message
                                }


                                setMessage={
                                    setMessage
                                }


                                selectedFile={
                                    selectedFile
                                }


                                setSelectedFile={
                                    setSelectedFile
                                }


                                handleFileSelect={
                                    handleFileSelect
                                }


                                onSend={
                                    handleSend
                                }


                                sending={
                                    sending
                                }


                            />





                        </div>







                        <InboxContextPanel

                            conversation={
                                selectedConversation
                            }

                        />






                    </div>



                </div>



            </div>







            <NewConversationModal

                open={
                    showModal
                }


                onClose={()=>
                    setShowModal(false)
                }


                vendors={
                    vendors
                }


                onSubmit={
                    handleNewConversation
                }


            />




        </main>


    );


};



export default CustomerInbox;