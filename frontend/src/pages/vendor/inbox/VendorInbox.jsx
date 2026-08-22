import {
    useEffect,
    useRef,
    useState,
} from "react";

import api from "../../../api/axios";

import InboxSidebar from "../../../components/inbox/InboxSidebar";
import ConversationHeader from "../../../components/inbox/ConversationHeader";
import MessageThread from "../../../components/inbox/MessageThread";
import ConversationComposer from "../../../components/inbox/ConversationComposer";
import ContextPanel from "../../../components/inbox/ContextPanel";


const VendorInbox = () => {


    const [conversations, setConversations] =
        useState([]);


    const [selectedConversation, setSelectedConversation] =
        useState(null);


    const [messages, setMessages] =
        useState([]);


    const [message, setMessage] =
        useState("");


    const [selectedFile, setSelectedFile] =
        useState(null);


    const [search, setSearch] =
        useState("");


    const [loading, setLoading] =
        useState(false);


    const [loadingMessages, setLoadingMessages] =
        useState(false);


    const [sending, setSending] =
        useState(false);


    const [error, setError] =
        useState("");


    const messagesEndRef =
        useRef(null);


    const activeConversationId =
        selectedConversation?.id;





    const loadConversations = async () => {

        try {

            setLoading(true);


            const response = await api.get(
                "/vendor/inbox"
            );


            setConversations(
                response.data.conversations?.data || []
            );


        } catch(error){

            console.error(error);

        } finally {

            setLoading(false);

        }

    };






    const loadMessages = async (conversation) => {

        if(!conversation){

            return;

        }


        try {

            setLoadingMessages(true);


            const response = await api.get(
                `/vendor/inbox/${conversation.id}`
            );


            setSelectedConversation(prev => ({
                ...prev,
                ...response.data.conversation
            }));


            setMessages(
                response.data.conversation?.messages || []
            );


        } catch(error){

            console.error(error);

        } finally {

            setLoadingMessages(false);

        }

    };







    const refreshMessages = async () => {

        if(!activeConversationId){

            return;

        }


        try {


            const response = await api.get(
                `/vendor/inbox/${activeConversationId}`
            );


            setMessages(
                response.data.conversation?.messages || []
            );


            setSelectedConversation(prev => ({
                ...prev,
                ...response.data.conversation
            }));


        } catch(error){

            console.error(error);

        }

    };







    useEffect(()=>{

        loadConversations();

    },[]);







    useEffect(()=>{


        if(selectedConversation){

            loadMessages(
                selectedConversation
            );

        }


    },[
        selectedConversation?.id
    ]);







    // realtime silent refresh

    useEffect(()=>{


        if(!activeConversationId){

            return;

        }


        const interval = setInterval(()=>{

            refreshMessages();

        },3000);



        return ()=>{

            clearInterval(interval);

        };


    },[
        activeConversationId
    ]);








    useEffect(()=>{


        messagesEndRef.current?.scrollIntoView({

            behavior:"smooth"

        });


    },[
        messages
    ]);








    const handleSelectConversation = (conversation)=>{


        setSelectedConversation(
            conversation
        );


    };







    const handleFileSelect = (event)=>{


        const file =
            event.target.files[0];


        if(!file){

            return;

        }



        if(
            file.size >
            5 * 1024 * 1024
        ){

            setError(
                "File size must be below 5MB."
            );

            return;

        }



        setSelectedFile(
            file
        );


    };








    const handleSend = async ()=>{


        if(
            sending ||
            (
                !message.trim() &&
                !selectedFile
            ) ||
            !selectedConversation
        ){

            return;

        }



        try {


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

                `/vendor/inbox/${selectedConversation.id}/messages`,

                formData,

                {

                    headers:{

                        "Content-Type":
                        "multipart/form-data",

                    },

                }

            );






            setMessage("");

            setSelectedFile(null);





            await loadMessages(
                selectedConversation
            );


            await loadConversations();




        } catch(error){

            console.error(error);

        } finally {

            setSending(false);

        }


    };








    return (

        <div

            className="
            flex
            h-[calc(100vh-74px)]
            overflow-hidden
            bg-[#f7f8fa]
            "

        >


            <InboxSidebar

                conversations={
                    conversations
                }

                selectedId={
                    selectedConversation?.id
                }

                onSelect={
                    handleSelectConversation
                }

                search={
                    search
                }

                setSearch={
                    setSearch
                }

                loading={
                    loading
                }

            />





            <div

                className="
                flex
                flex-1
                flex-col
                bg-white
                "

            >



                <ConversationHeader

                    conversation={
                        selectedConversation
                    }

                />





                <MessageThread

                    messages={
                        messages
                    }

                    loading={
                        loadingMessages
                    }

                    currentUserId={
                        JSON.parse(
                            localStorage.getItem(
                                "user"
                            )
                        )?.id
                    }

                    messagesEndRef={
                        messagesEndRef
                    }

                />





                <ConversationComposer

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





            <ContextPanel

                conversation={
                    selectedConversation
                }

            />



        </div>

    );

};


export default VendorInbox;