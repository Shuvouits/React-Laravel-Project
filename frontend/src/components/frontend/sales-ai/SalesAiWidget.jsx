import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";
import { Link } from "react-router-dom";
import {
    Bot,
    ExternalLink,
    LoaderCircle,
    MessageCircle,
    Send,
    ShoppingCart,
    Sparkles,
    X,
} from "lucide-react";
import Swal from "sweetalert2";

import api from "../../../api/axios";
import { useCart } from "../../../context/CartContext";

const CONVERSATION_KEY =
    "sales_ai_conversation_uuid";

const GUEST_TOKEN_KEY =
    "sales_ai_guest_token";

const SalesAiWidget = () => {
    const { addToCart, openCart } = useCart();

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const sendingRef = useRef(false);
    const activeRequestRef = useRef(null);

    const [config, setConfig] = useState(null);
    const [open, setOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");

    const [conversationUuid, setConversationUuid] =
        useState(() =>
            localStorage.getItem(
                CONVERSATION_KEY
            )
        );

    const [guestToken, setGuestToken] =
        useState(() =>
            localStorage.getItem(
                GUEST_TOKEN_KEY
            )
        );

    const [configLoading, setConfigLoading] =
        useState(true);

    const [historyLoading, setHistoryLoading] =
        useState(false);

    const [sending, setSending] =
        useState(false);

    useEffect(() => {
        fetchConfig();
    }, []);

    useEffect(() => {
        if (
            !config ||
            !conversationUuid
        ) {
            return;
        }

        fetchConversationHistory();
    }, [
        config,
        conversationUuid,
    ]);

    useEffect(() => {
        scrollToBottom();
    }, [messages, sending, open]);

    useEffect(() => {
        if (!open) {
            return;
        }

        window.setTimeout(() => {
            inputRef.current?.focus();
        }, 220);
    }, [open]);

    useEffect(() => {
    const handleOpenSalesAi = () => {
        setOpen(true);

        window.setTimeout(() => {
            inputRef.current?.focus();
        }, 250);
    };

    window.addEventListener(
        "storify:sales-ai-open",
        handleOpenSalesAi
    );

    return () => {
        window.removeEventListener(
            "storify:sales-ai-open",
            handleOpenSalesAi
        );
    };
}, []);

    const fetchConfig = async () => {
        try {
            setConfigLoading(true);

            const response = await api.get(
                "/sales-ai/config"
            );

            if (
                response.data?.active === false
            ) {
                setConfig(null);
                return;
            }

            const chatbot =
                response.data?.chatbot ||
                null;

            setConfig(chatbot);

            if (
                chatbot &&
                !conversationUuid
            ) {
                setMessages([
                    makeWelcomeMessage(
                        chatbot
                            .welcome_message
                    ),
                ]);
            }
        } catch (error) {
            console.error(
                "Sales AI config error:",
                error
            );

            setConfig(null);
        } finally {
            setConfigLoading(false);
        }
    };

    const fetchConversationHistory =
        async () => {
            try {
                setHistoryLoading(true);

                const response = await api.get(
                    `/sales-ai/conversations/${conversationUuid}/messages`,
                    {
                        params: guestToken
                            ? {
                                guest_token:
                                    guestToken,
                            }
                            : {},
                        headers: guestToken
                            ? {
                                "X-Sales-AI-Guest-Token":
                                    guestToken,
                            }
                            : {},
                    }
                );

                const history =
                    response.data?.messages ||
                    [];

                if (history.length) {
                    setMessages(history);
                } else {
                    setMessages([
                        makeWelcomeMessage(
                            config
                                ?.welcome_message
                        ),
                    ]);
                }
            } catch (error) {
                if (
                    error.response?.status ===
                    404
                ) {
                    clearStoredConversation();

                    setMessages([
                        makeWelcomeMessage(
                            config
                                ?.welcome_message
                        ),
                    ]);

                    return;
                }

                console.error(
                    "Sales AI history error:",
                    error
                );
            } finally {
                setHistoryLoading(false);
            }
        };

    const startConversation =
        async () => {
            const response = await api.post(
                "/sales-ai/conversations",
                {
                    page_url:
                        window.location.href,
                    locale:
                        document.documentElement
                            .lang || "en",
                    guest_token:
                        guestToken || undefined,
                }
            );

            const conversation =
                response.data?.conversation;

            if (!conversation?.uuid) {
                throw new Error(
                    "Conversation could not be created."
                );
            }

            const nextGuestToken =
                conversation.guest_token ||
                null;

            setConversationUuid(
                conversation.uuid
            );

            localStorage.setItem(
                CONVERSATION_KEY,
                conversation.uuid
            );

            if (nextGuestToken) {
                setGuestToken(
                    nextGuestToken
                );

                localStorage.setItem(
                    GUEST_TOKEN_KEY,
                    nextGuestToken
                );
            } else {
                setGuestToken(null);

                localStorage.removeItem(
                    GUEST_TOKEN_KEY
                );
            }

            return {
                uuid: conversation.uuid,
                guestToken:
                    nextGuestToken,
            };
        };




    const sendMessage = async (
        customMessage = null
    ) => {
        const messageText = String(
            customMessage ?? input
        ).trim();

        if (
            !messageText ||
            sendingRef.current
        ) {
            return;
        }

        const requestId =
            createChatRequestId();

        sendingRef.current = true;
        activeRequestRef.current =
            requestId;

        setInput("");
        setSending(true);

        const temporaryUserMessage = {
            id: `user-${requestId}`,
            request_id: requestId,
            role: "user",
            content: messageText,
            content_type: "text",
            structured_data: null,
            pending: true,
            created_at:
                new Date().toISOString(),
        };

        setMessages((current) => [
            ...current,
            temporaryUserMessage,
        ]);

        try {
            let activeConversationUuid =
                conversationUuid;

            let activeGuestToken =
                guestToken;

            if (!activeConversationUuid) {
                const conversation =
                    await startConversation();

                activeConversationUuid =
                    conversation.uuid;

                activeGuestToken =
                    conversation.guestToken;
            }

            const response = await api.post(
                "/sales-ai/chat",
                {
                    conversation_uuid:
                        activeConversationUuid,

                    guest_token:
                        activeGuestToken ||
                        undefined,

                    message:
                        messageText,

                    request_id:
                        requestId,

                    page_url:
                        window.location.href,

                    locale:
                        document.documentElement
                            .lang || "en",
                },
                {
                    headers:
                        activeGuestToken
                            ? {
                                "X-Sales-AI-Guest-Token":
                                    activeGuestToken,
                            }
                            : {},
                }
            );

            /*
             * অন্য কোনো পুরোনো request-এর response
             * হলে বর্তমান UI-তে বসবে না।
             */
            if (
                activeRequestRef.current !==
                requestId
            ) {
                return;
            }

            const responseRequestId =
                response.data?.request_id ||
                requestId;

            if (
                responseRequestId !==
                requestId
            ) {
                console.warn(
                    "Ignored mismatched Sales AI response.",
                    {
                        expected:
                            requestId,
                        received:
                            responseRequestId,
                    }
                );

                return;
            }

            const assistantMessage =
                response.data
                    ?.assistant_message || {
                    id:
                        `assistant-${requestId}`,

                    role:
                        "assistant",

                    content:
                        response.data?.reply ||
                        "I could not complete that request.",

                    content_type:
                        response.data
                            ?.content_type ||
                        "text",

                    structured_data:
                        response.data
                            ?.structured_data ||
                        null,

                    created_at:
                        new Date().toISOString(),
                };

            const normalizedAssistantMessage = {
                ...assistantMessage,

                request_id:
                    requestId,

                structured_data:
                    assistantMessage
                        .structured_data ??
                    response.data
                        ?.structured_data ??
                    null,
            };

            const action =
                normalizedAssistantMessage
                    .structured_data
                    ?.action ||
                null;

            /*
             * Reset command আগের visible messages
             * সরিয়ে নতুন reset confirmation রাখবে।
             */
            if (
                action ===
                "reset_context"
            ) {
                setMessages([
                    normalizedAssistantMessage,
                ]);
            } else {
                setMessages((current) =>
                    insertAssistantResponse(
                        current,
                        requestId,
                        normalizedAssistantMessage
                    )
                );
            }

            if (action === "open_cart") {
                openCart();
            }
        } catch (error) {
            if (
                activeRequestRef.current !==
                requestId
            ) {
                return;
            }

            console.error(
                "Sales AI chat error:",
                error
            );

            const errorMessage =
                error.response?.data?.message ||
                "Sales AI is temporarily unavailable.";

            const status =
                error.response?.status;

            /*
             * Backend lock response হলে temporary
             * user message সরিয়ে দেওয়া হবে।
             */
            if (status === 409) {
                setMessages((current) =>
                    current.filter(
                        (message) =>
                            message.request_id !==
                            requestId
                    )
                );

                showToast(
                    "warning",
                    errorMessage
                );

                return;
            }

            const assistantErrorMessage = {
                id:
                    `error-${requestId}`,

                request_id:
                    requestId,

                role:
                    "assistant",

                content:
                    errorMessage,

                content_type:
                    "error",

                structured_data:
                    null,

                created_at:
                    new Date().toISOString(),
            };

            setMessages((current) =>
                insertAssistantResponse(
                    current,
                    requestId,
                    assistantErrorMessage
                )
            );

            showToast(
                "error",
                errorMessage
            );
        } finally {
            if (
                activeRequestRef.current ===
                requestId
            ) {
                activeRequestRef.current =
                    null;

                sendingRef.current =
                    false;

                setSending(false);

                window.setTimeout(() => {
                    inputRef.current?.focus();
                }, 100);
            }
        }
    };




    const handleSubmit = (event) => {
        event.preventDefault();
        sendMessage();
    };

    const handleAddToCart = (
        cartPayload
    ) => {
        if (!cartPayload?.product_id) {
            return;
        }

        if (
            cartPayload.in_stock ===
            false
        ) {
            showToast(
                "error",
                "This product is currently out of stock."
            );

            return;
        }

        addToCart({
            ...cartPayload,
            quantity: Math.max(
                1,
                Number(
                    cartPayload.quantity ||
                    1
                )
            ),
        });

        openCart();

        showToast(
            "success",
            `${cartPayload.title} added to cart.`
        );
    };

    const clearStoredConversation =
        () => {
            setConversationUuid(null);
            setGuestToken(null);

            localStorage.removeItem(
                CONVERSATION_KEY
            );

            localStorage.removeItem(
                GUEST_TOKEN_KEY
            );
        };

    const scrollToBottom = () => {
        window.setTimeout(() => {
            messagesEndRef.current
                ?.scrollIntoView({
                    behavior: "smooth",
                    block: "end",
                });
        }, 80);
    };

    if (
        configLoading ||
        !config
    ) {
        return null;
    }

    const theme = {
        primary:
            config.theme
                ?.primary_color ||
            "#3424F4",

        secondary:
            config.theme
                ?.secondary_color ||
            "#A34CF4",

        panel:
            config.theme
                ?.panel_background ||
            "#FFFFFF",
    };

    return (
        <>
            <button
                type="button"
                onClick={() =>
                    setOpen(true)
                }
                aria-label="Open Sales AI"
                className={`fixed bottom-[24px] right-[24px] z-[1100] flex h-[58px] w-[58px] items-center justify-center rounded-full text-white shadow-[0_18px_40px_rgba(48,36,244,0.32)] transition duration-200 hover:scale-105 ${open
                        ? "pointer-events-none scale-90 opacity-0"
                        : "scale-100 opacity-100"
                    }`}
                style={{
                    background:
                        `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                }}
            >
                <MessageCircle
                    size={25}
                    strokeWidth={1.9}
                />
            </button>

            <section
                className={`fixed z-[1200] flex overflow-hidden border border-[#e4e5e8] bg-white shadow-[0_25px_70px_rgba(15,23,42,0.22)] transition-all duration-300 max-sm:inset-[10px] max-sm:rounded-[18px] sm:bottom-[22px] sm:right-[22px] sm:h-[680px] sm:w-[430px] sm:rounded-[24px] ${open
                        ? "translate-y-0 scale-100 opacity-100"
                        : "pointer-events-none translate-y-[25px] scale-[0.96] opacity-0"
                    }`}
                style={{
                    backgroundColor:
                        theme.panel,
                }}
            >
                <div className="flex min-h-0 w-full flex-col">
                    <SalesAiHeader
                        config={config}
                        theme={theme}
                        onClose={() =>
                            setOpen(false)
                        }
                    />

                    <div className="relative flex min-h-0 flex-1 flex-col">
                        <div className="flex-1 overflow-y-auto px-[15px] py-[18px] [scrollbar-color:#d7d9de_transparent] [scrollbar-width:thin]">
                            {historyLoading ? (
                                <HistoryLoader
                                    color={
                                        theme.primary
                                    }
                                />
                            ) : (
                                <>
                                    {messages.map(
                                        (
                                            message
                                        ) => (
                                            <ChatMessage
                                                key={
                                                    message.id
                                                }
                                                message={
                                                    message
                                                }
                                                theme={
                                                    theme
                                                }
                                                onAddToCart={
                                                    handleAddToCart
                                                }
                                            />
                                        )
                                    )}

                                    {sending && (
                                        <TypingIndicator
                                            theme={
                                                theme
                                            }
                                        />
                                    )}

                                    <div
                                        ref={
                                            messagesEndRef
                                        }
                                    />
                                </>
                            )}
                        </div>

                        {!historyLoading &&
                            messages.length <=
                            1 &&
                            !sending && (
                                <StarterSuggestions
                                    suggestions={
                                        config
                                            .starter_suggestions ||
                                        []
                                    }
                                    onSelect={
                                        sendMessage
                                    }
                                />
                            )}

                        <SalesAiInput
                            input={input}
                            sending={sending}
                            placeholder={
                                config
                                    .input_placeholder ||
                                "Type a message..."
                            }
                            primaryColor={
                                theme.primary
                            }
                            inputRef={
                                inputRef
                            }
                            onChange={
                                setInput
                            }
                            onSubmit={
                                handleSubmit
                            }
                        />

                        <div className="pb-[10px] text-center text-[10px] text-[#8a8a8a]">
                            Powered by Storify
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

const SalesAiHeader = ({
    config,
    theme,
    onClose,
}) => {
    return (
        <header className="shrink-0 px-[14px] pt-[14px]">
            <div
                className="relative flex h-[54px] items-center rounded-[18px] px-[17px] text-white"
                style={{
                    background:
                        `linear-gradient(110deg, ${theme.primary}, ${theme.secondary})`,
                }}
            >
                <div className="flex min-w-0 items-center gap-[10px]">
                    <Sparkles
                        size={18}
                        className="shrink-0"
                    />

                    <div className="min-w-0">
                        <h2 className="truncate text-[15px] font-bold">
                            {config.name ||
                                "Sales AI"}
                        </h2>

                        <div className="mt-[1px] flex items-center gap-[5px] text-[10px] text-white/80">
                            <span className="h-[6px] w-[6px] rounded-full bg-[#50e58b]" />
                            Online
                        </div>
                    </div>
                </div>

                <div className="absolute left-1/2 top-full z-10 flex h-[54px] w-[54px] -translate-x-1/2 -translate-y-[17px] items-center justify-center rounded-full border-[4px] border-white bg-white shadow-[0_5px_18px_rgba(15,23,42,0.15)]">
                    <div
                        className="flex h-full w-full items-center justify-center rounded-full text-white"
                        style={{
                            background:
                                `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                        }}
                    >
                        <Bot size={23} />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    className="ml-auto flex h-[33px] w-[33px] items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                >
                    <X size={17} />
                </button>
            </div>
        </header>
    );
};

const ChatMessage = ({
    message,
    theme,
    onAddToCart,
}) => {
    const isUser =
        message.role === "user";

    return (
        <div
            className={`mb-[15px] flex items-end gap-[8px] ${isUser
                    ? "justify-end"
                    : "justify-start"
                }`}
        >
            {!isUser && (
                <div
                    className="mb-[2px] flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-white"
                    style={{
                        background:
                            `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    }}
                >
                    <Sparkles size={14} />
                </div>
            )}

            <div
                className={`min-w-0 ${isUser
                        ? "max-w-[82%]"
                        : "max-w-[calc(100%-38px)]"
                    }`}
            >
                {message.content && (
                    <div
                        className={`whitespace-pre-wrap rounded-[20px] px-[15px] py-[11px] text-[13px] leading-[1.65] ${isUser
                                ? "rounded-br-[6px] text-white"
                                : message.content_type ===
                                    "error"
                                    ? "rounded-bl-[6px] border border-red-200 bg-red-50 text-red-600"
                                    : "rounded-bl-[6px] bg-[#f2f2f3] text-[#333]"
                            }`}
                        style={
                            isUser
                                ? {
                                    backgroundColor:
                                        theme.primary,
                                }
                                : undefined
                        }
                    >
                        {message.content}
                    </div>
                )}

                {!isUser &&
                    message.structured_data && (
                        <StructuredResult
                            data={
                                message
                                    .structured_data
                            }
                            theme={theme}
                            onAddToCart={
                                onAddToCart
                            }
                        />
                    )}

                <p
                    className={`mt-[4px] px-[5px] text-[9px] text-[#a0a0a0] ${isUser
                            ? "text-right"
                            : "text-left"
                        }`}
                >
                    {formatMessageTime(
                        message.created_at
                    )}
                </p>
            </div>
        </div>
    );
};

const StructuredResult = ({
    data,
    theme,
    onAddToCart,
}) => {
    const products = useMemo(
        () =>
            getStructuredProducts(
                data
            ),
        [data]
    );

    if (!products.length) {
        return null;
    }

    const isComparison =
        data.content_type ===
        "product_comparison";

    return (
        <div className="mt-[9px] space-y-[9px]">
            {isComparison && (
                <p className="px-[2px] text-[10px] font-semibold uppercase tracking-[0.08em] text-[#888]">
                    Product comparison
                </p>
            )}

            {products.map((product) => (
                <AiProductCard
                    key={product.id}
                    product={product}
                    theme={theme}
                    comparison={
                        isComparison
                    }
                    onAddToCart={
                        onAddToCart
                    }
                />
            ))}
        </div>
    );
};

const AiProductCard = ({
    product,
    theme,
    comparison,
    onAddToCart,
}) => {
    const variants =
        product.variants || [];

    const initialVariant =
        variants.find(
            (variant) =>
                variant.in_stock
        ) ||
        variants[0] ||
        null;

    const [
        selectedVariantId,
        setSelectedVariantId,
    ] = useState(
        initialVariant?.id || ""
    );

    const selectedVariant =
        variants.find(
            (variant) =>
                Number(variant.id) ===
                Number(selectedVariantId)
        ) || null;

    const activePrice = Number(
        selectedVariant?.price ??
        product.price ??
        0
    );

    const comparePrice = Number(
        selectedVariant
            ?.compare_at_price ??
        product.compare_at_price ??
        0
    );

    const cartPayload =
        selectedVariant?.cart_payload ||
        product.cart_payload ||
        null;

    const requiresVariant =
        product.has_variants &&
        !selectedVariant &&
        !product.cart_payload;

    const isInStock =
        selectedVariant
            ? selectedVariant.in_stock
            : product.in_stock;

    return (
        <article className="overflow-hidden rounded-[14px] border border-[#e5e6e9] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
            <div className="flex gap-[11px] p-[11px]">
                <Link
                    to={
                        product.product_url ||
                        `/products/${product.slug}`
                    }
                    className="flex h-[78px] w-[78px] shrink-0 items-center justify-center overflow-hidden rounded-[11px] bg-[#f2f3f5]"
                >
                    {product.image_url ? (
                        <img
                            src={
                                selectedVariant
                                    ?.image_url ||
                                product.image_url
                            }
                            alt={product.title}
                            className="h-full w-full object-contain p-[6px]"
                        />
                    ) : (
                        <ShoppingCart
                            size={23}
                            className="text-[#9a9da3]"
                        />
                    )}
                </Link>

                <div className="min-w-0 flex-1">
                    {product.brand?.name && (
                        <p className="truncate text-[9px] font-medium uppercase tracking-[0.06em] text-[#8a8a8a]">
                            {
                                product.brand
                                    .name
                            }
                        </p>
                    )}

                    <Link
                        to={
                            product.product_url ||
                            `/products/${product.slug}`
                        }
                        className="mt-[2px] line-clamp-2 text-[12px] font-bold leading-[1.4] text-[#202124] hover:text-[#2065D1]"
                    >
                        {product.title}
                    </Link>

                    <div className="mt-[6px] flex flex-wrap items-center gap-[6px]">
                        <span className="text-[13px] font-bold text-[#00a76f]">
                            $
                            {activePrice.toFixed(
                                2
                            )}
                        </span>

                        {comparePrice >
                            activePrice && (
                                <span className="text-[10px] text-[#999] line-through">
                                    $
                                    {comparePrice.toFixed(
                                        2
                                    )}
                                </span>
                            )}

                        <span
                            className={`ml-auto h-[7px] w-[7px] rounded-full ${isInStock
                                    ? "bg-emerald-500"
                                    : "bg-red-500"
                                }`}
                            title={
                                isInStock
                                    ? "In stock"
                                    : "Out of stock"
                            }
                        />
                    </div>

                    {comparison &&
                        product.rating >
                        0 && (
                            <p className="mt-[4px] text-[10px] text-[#777]">
                                ★{" "}
                                {product.rating} (
                                {product.reviews_count ||
                                    0}
                                )
                            </p>
                        )}
                </div>
            </div>

            {variants.length > 0 && (
                <div className="border-t border-[#ececee] px-[11px] py-[9px]">
                    <select
                        value={
                            selectedVariantId
                        }
                        onChange={(event) =>
                            setSelectedVariantId(
                                event.target
                                    .value
                            )
                        }
                        className="h-[34px] w-full rounded-[8px] border border-[#dedfe3] bg-white px-[9px] text-[10px] text-[#444] outline-none focus:border-[#3424F4]"
                    >
                        {variants.map(
                            (variant) => (
                                <option
                                    key={
                                        variant.id
                                    }
                                    value={
                                        variant.id
                                    }
                                    disabled={
                                        !variant.in_stock
                                    }
                                >
                                    {
                                        variant.title
                                    }
                                    {!variant.in_stock
                                        ? " - Out of stock"
                                        : ""}
                                </option>
                            )
                        )}
                    </select>
                </div>
            )}

            <div className="grid grid-cols-2 gap-[8px] border-t border-[#ececee] p-[10px]">
                <Link
                    to={
                        product.product_url ||
                        `/products/${product.slug}`
                    }
                    className="flex h-[35px] items-center justify-center gap-[5px] rounded-[8px] border border-[#dfe0e4] text-[10px] font-semibold text-[#45484e] transition hover:bg-[#f5f5f6]"
                >
                    View product
                    <ExternalLink size={12} />
                </Link>

                <button
                    type="button"
                    disabled={
                        !isInStock ||
                        requiresVariant ||
                        !cartPayload
                    }
                    onClick={() =>
                        onAddToCart(
                            cartPayload
                        )
                    }
                    className="flex h-[35px] items-center justify-center gap-[5px] rounded-[8px] text-[10px] font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-[#c5c7cc]"
                    style={
                        isInStock &&
                            cartPayload
                            ? {
                                backgroundColor:
                                    theme.primary,
                            }
                            : undefined
                    }
                >
                    <ShoppingCart
                        size={13}
                    />

                    {!isInStock
                        ? "Out of stock"
                        : variants.length
                            ? "Add variant"
                            : "Add to cart"}
                </button>
            </div>
        </article>
    );
};

const StarterSuggestions = ({
    suggestions,
    onSelect,
}) => {
    if (!suggestions.length) {
        return null;
    }

    return (
        <div className="shrink-0 border-t border-[#eeeeef] px-[14px] py-[10px]">
            <div className="flex gap-[7px] overflow-x-auto pb-[2px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {suggestions.map(
                    (suggestion) => (
                        <button
                            key={suggestion}
                            type="button"
                            onClick={() =>
                                onSelect(
                                    suggestion
                                )
                            }
                            className="shrink-0 rounded-full border border-[#dedfe3] bg-white px-[11px] py-[7px] text-[10px] font-medium text-[#555] transition hover:border-[#3424F4] hover:text-[#3424F4]"
                        >
                            {suggestion}
                        </button>
                    )
                )}
            </div>
        </div>
    );
};

const SalesAiInput = ({
    input,
    sending,
    placeholder,
    primaryColor,
    inputRef,
    onChange,
    onSubmit,
}) => {
    return (
        <form
            onSubmit={onSubmit}
            className="shrink-0 px-[14px] pb-[8px] pt-[10px]"
        >
            <div
                className="flex min-h-[52px] items-end gap-[8px] rounded-[27px] border-2 bg-white py-[6px] pl-[16px] pr-[6px] transition"
                style={{
                    borderColor:
                        primaryColor,
                }}
            >
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(event) =>
                        onChange(
                            event.target.value
                        )
                    }
                    onKeyDown={(event) => {
                        if (
                            event.key ===
                            "Enter" &&
                            !event.shiftKey
                        ) {
                            event.preventDefault();

                            if (
                                input.trim() &&
                                !sending
                            ) {
                                event.currentTarget
                                    .form
                                    ?.requestSubmit();
                            }
                        }
                    }}
                    rows={1}
                    placeholder={placeholder}
                    disabled={sending}
                    className="max-h-[92px] min-h-[36px] flex-1 resize-none bg-transparent py-[8px] text-[13px] leading-[1.45] text-[#252525] outline-none placeholder:text-[#999]"
                />

                <button
                    type="submit"
                    disabled={
                        sending ||
                        !input.trim()
                    }
                    className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                    style={{
                        backgroundColor:
                            primaryColor,
                    }}
                >
                    {sending ? (
                        <LoaderCircle
                            size={17}
                            className="animate-spin"
                        />
                    ) : (
                        <Send size={16} />
                    )}
                </button>
            </div>
        </form>
    );
};

const TypingIndicator = ({
    theme,
}) => {
    return (
        <div className="mb-[15px] flex items-end gap-[8px]">
            <div
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-white"
                style={{
                    background:
                        `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                }}
            >
                <Sparkles size={14} />
            </div>

            <div className="flex items-center gap-[4px] rounded-[18px] rounded-bl-[6px] bg-[#f2f2f3] px-[15px] py-[14px]">
                {[0, 1, 2].map(
                    (item) => (
                        <span
                            key={item}
                            className="h-[6px] w-[6px] animate-bounce rounded-full bg-[#929292]"
                            style={{
                                animationDelay:
                                    `${item * 120}ms`,
                            }}
                        />
                    )
                )}
            </div>
        </div>
    );
};

const HistoryLoader = ({ color }) => {
    return (
        <div className="flex h-full min-h-[320px] items-center justify-center">
            <LoaderCircle
                size={27}
                className="animate-spin"
                style={{
                    color,
                }}
            />
        </div>
    );
};

const getStructuredProducts = (
    data
) => {
    if (
        data.content_type ===
        "products" &&
        Array.isArray(data.products)
    ) {
        return data.products;
    }

    if (
        data.content_type ===
        "product_details" &&
        data.product
    ) {
        return [data.product];
    }

    if (
        data.content_type ===
        "product_comparison" &&
        Array.isArray(data.products)
    ) {
        return data.products;
    }

    return [];
};

const makeWelcomeMessage = (
    content
) => ({
    id: "sales-ai-welcome",
    role: "assistant",
    content:
        content ||
        "Hi! How can I help you today?",
    content_type: "text",
    structured_data: null,
    created_at:
        new Date().toISOString(),
});

const formatMessageTime = (
    value
) => {
    if (!value) {
        return "";
    }

    return new Date(
        value
    ).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
};

const showToast = (
    icon,
    title
) => {
    Swal.fire({
        toast: true,
        position: "top-end",
        icon,
        title,
        showConfirmButton: false,
        timer: 2600,
        timerProgressBar: true,
    });
};





const createChatRequestId = () => {
    if (
        typeof crypto !==
            "undefined" &&
        typeof crypto.randomUUID ===
            "function"
    ) {
        return crypto.randomUUID();
    }

    return [
        Date.now(),
        Math.random()
            .toString(36)
            .slice(2),
    ].join("-");
};

const insertAssistantResponse = (
    currentMessages,
    requestId,
    assistantMessage
) => {
    const cleanedMessages =
        currentMessages.filter(
            (message) => {
                const isSameRequest =
                    message.request_id ===
                    requestId;

                const isAssistant =
                    message.role ===
                    "assistant";

                /*
                 * একই request-এর পুরোনো assistant
                 * response duplicate হবে না।
                 */
                return !(
                    isSameRequest &&
                    isAssistant
                );
            }
        );

    const userMessageIndex =
        cleanedMessages.findIndex(
            (message) =>
                message.request_id ===
                    requestId &&
                message.role ===
                    "user"
        );

    if (userMessageIndex === -1) {
        return [
            ...cleanedMessages,
            assistantMessage,
        ];
    }

    const nextMessages = [
        ...cleanedMessages,
    ];

    nextMessages[
        userMessageIndex
    ] = {
        ...nextMessages[
            userMessageIndex
        ],
        pending: false,
    };

    nextMessages.splice(
        userMessageIndex + 1,
        0,
        assistantMessage
    );

    return nextMessages;
};

export default SalesAiWidget;