import { useEffect, useMemo, useRef, useState } from "react";
import {
    Banknote,
    Check,
    CheckCircle2,
    CreditCard,
    Landmark,
    Radio,
    Tag,
    WalletCards,
    X,
} from "lucide-react";

const paymentMethods = [
    {
        id: "cash",
        title: "Cash",
        description: "With change",
        icon: Banknote,
    },
    {
        id: "card",
        title: "Card",
        description: "Touch or Stripe",
        icon: CreditCard,
    },
    {
        id: "bank",
        title: "Bank Transfer",
        description: "With reference",
        icon: Landmark,
    },
    {
        id: "manual",
        title: "Manual",
        description: "Custom method",
        icon: Tag,
    },
];

const PosPaymentModal = ({
    onClose,
    onConfirmPayment,
    cart,
    cartTotals,
    discount,
    selectedCustomer,
    formatMoney,
}) => {
    const inputRef = useRef(null);

    const [method, setMethod] = useState("cash");
    const [cashGiven, setCashGiven] = useState("");
    const [cardMode, setCardMode] = useState("touch");
    const [reference, setReference] = useState("");
    const [manualMethod, setManualMethod] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const subtotal = Number(
        cartTotals?.subtotal || 0
    );

    const discountAmount = Number(
        cartTotals?.discountAmount || 0
    );

    const totalDue = Number(
        cartTotals?.grandTotal ??
        cartTotals?.total ??
        Math.max(subtotal - discountAmount, 0)
    );

    const itemCount = Number(
        cartTotals?.itemCount ??
        cart?.length ??
        0
    );

    const receivedAmount = Number(
        cashGiven || 0
    );

    const changeDue = Math.max(
        receivedAmount - totalDue,
        0
    );

    const cashIsValid =
        receivedAmount >= totalDue &&
        totalDue > 0;

    const canSubmit = useMemo(() => {
        if (submitting || totalDue <= 0) {
            return false;
        }

        if (method === "cash") {
            return cashIsValid;
        }

        if (method === "manual") {
            return manualMethod.trim().length > 0;
        }

        return true;
    }, [
        cashIsValid,
        manualMethod,
        method,
        submitting,
        totalDue,
    ]);

    const money = (amount) => {
        if (formatMoney) {
            return formatMoney(amount);
        }

        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 2,
        }).format(Number(amount || 0));
    };

    const quickCashAmounts = useMemo(() => {
        const candidates = [
            totalDue,
            Math.ceil(totalDue / 10) * 10,
            Math.ceil(totalDue / 50) * 50,
            Math.ceil(totalDue / 100) * 100,
            Math.ceil(totalDue / 200) * 200,
        ];

        return [...new Set(
            candidates
                .filter((amount) => amount >= totalDue)
                .map((amount) => Number(amount.toFixed(2)))
        )].slice(0, 4);
    }, [totalDue]);

    useEffect(() => {
        const handleEscape = (event) => {
            if (event.key === "Escape" && !submitting) {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener(
                "keydown",
                handleEscape
            );

            document.body.style.overflow = "";
        };
    }, [onClose, submitting]);

    useEffect(() => {
        setError("");

        if (method === "cash") {
            setCashGiven(totalDue.toFixed(2));
        }

        const focusTimer = window.setTimeout(() => {
            inputRef.current?.focus();
        }, 100);

        return () => {
            window.clearTimeout(focusTimer);
        };
    }, [method, totalDue]);

    const selectMethod = (nextMethod) => {
        setMethod(nextMethod);
        setReference("");
        setManualMethod("");
        setError("");
    };

    const handleCashChange = (event) => {
        const rawValue = event.target.value;

        if (rawValue === "") {
            setCashGiven("");
            return;
        }

        const value = Number(rawValue);

        if (!Number.isFinite(value) || value < 0) {
            return;
        }

        setCashGiven(rawValue);
    };

    const getButtonLabel = () => {
        if (submitting) {
            return "Processing payment...";
        }

        if (method === "cash") {
            return "Accept cash";
        }

        if (
            method === "card" &&
            cardMode === "touch"
        ) {
            return `Charge ${money(totalDue)} on reader`;
        }

        return `Charge ${money(totalDue)}`;
    };

    const handleSubmit = async () => {
        if (!canSubmit) {
            if (method === "cash") {
                setError(
                    `Cash given must be at least ${money(totalDue)}.`
                );
            }

            return;
        }

        const paymentReference =
            reference.trim() || null;

        const paymentMetadata = {};

        if (method === "card") {
            paymentMetadata.card_mode = cardMode;
        }

        if (method === "manual") {
            paymentMetadata.manual_method =
                manualMethod.trim();
        }

        const paymentAmount =
            method === "cash"
                ? receivedAmount
                : totalDue;

        const paymentData = {
            payment_method: method,
            gateway:
                method === "card"
                    ? cardMode
                    : method,
            customer_id:
                selectedCustomer?.id || null,
            amount: totalDue,
            amount_received: paymentAmount,
            change_amount:
                method === "cash"
                    ? changeDue
                    : 0,
            reference: paymentReference,
            payments: [
                {
                    method,
                    amount: paymentAmount,
                    reference: paymentReference,
                    last_four: null,
                    metadata: paymentMetadata,
                },
            ],
        };

        try {
            setSubmitting(true);
            setError("");

            await onConfirmPayment?.(paymentData);
        } catch (paymentError) {
            setError(
                paymentError?.response?.data?.message ||
                paymentError?.message ||
                "Payment could not be completed."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const renderCash = () => {
        return (
            <>
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.03em] text-[#777a82]">
                    Cash given
                </label>

                <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] text-[#777a82]">
                        $
                    </span>

                    <input
                        ref={inputRef}
                        type="number"
                        min="0"
                        step="0.01"
                        value={cashGiven}
                        onChange={handleCashChange}
                        className="
                            block
                            h-[54px]
                            w-full
                            rounded-[17px]
                            !border
                            !border-solid
                            !border-[#dfe1e5]
                            bg-white
                            pl-10
                            pr-4
                            text-[15px]
                            font-semibold
                            text-[#202126]
                            outline-none
                            focus:!border-[#4f8ef7]
                            focus:!ring-4
                            focus:!ring-[#2563eb]/10
                        "
                    />
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2">
                    {quickCashAmounts.map((amount) => {
                        const active =
                            receivedAmount === amount;

                        return (
                            <button
                                key={amount}
                                type="button"
                                onClick={() =>
                                    setCashGiven(
                                        amount.toFixed(2)
                                    )
                                }
                                className={`
                                    h-[46px]
                                    rounded-full
                                    !border
                                    !border-solid
                                    text-[14px]
                                    font-medium
                                    transition
                                    ${
                                        active
                                            ? "!border-[#75a9fb] bg-[#edf4ff] text-[#1764df]"
                                            : "!border-[#e2e3e7] bg-white text-[#292b31] hover:bg-[#fafafa]"
                                    }
                                `}
                            >
                                {money(amount)}
                            </button>
                        );
                    })}
                </div>

                <div className="mt-4 flex h-[58px] items-center justify-between rounded-[17px] !border !border-solid !border-[#e3e5e8] bg-[#fcfcfd] px-4">
                    <span className="text-[12px] font-medium uppercase tracking-[0.03em] text-[#777a82]">
                        Change due
                    </span>

                    <span className="text-[17px] font-semibold text-[#202126]">
                        {money(changeDue)}
                    </span>
                </div>
            </>
        );
    };

    const renderCard = () => {
        return (
            <>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() =>
                            setCardMode("touch")
                        }
                        className={`
                            flex
                            h-[64px]
                            items-center
                            gap-3
                            rounded-[18px]
                            !border
                            !border-solid
                            px-3
                            text-left
                            transition
                            ${
                                cardMode === "touch"
                                    ? "!border-[#80adf4] bg-[#f3f7ff]"
                                    : "!border-[#e2e3e7] bg-white hover:bg-[#fafafa]"
                            }
                        `}
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e7f0ff] text-[#1764df]">
                            <Radio size={19} />
                        </span>

                        <span>
                            <span className="block text-[14px] font-medium text-[#202126]">
                                Touch
                            </span>

                            <span className="mt-0.5 block truncate text-[11px] text-[#858790]">
                                Tap or insert card
                            </span>
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() =>
                            setCardMode("stripe")
                        }
                        className={`
                            flex
                            h-[64px]
                            items-center
                            gap-3
                            rounded-[18px]
                            !border
                            !border-solid
                            px-3
                            text-left
                            transition
                            ${
                                cardMode === "stripe"
                                    ? "!border-[#80adf4] bg-[#f3f7ff]"
                                    : "!border-[#e2e3e7] bg-white hover:bg-[#fafafa]"
                            }
                        `}
                    >
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f4f4f5] text-[#666970]">
                            <WalletCards size={18} />
                        </span>

                        <span>
                            <span className="block text-[14px] font-medium text-[#202126]">
                                Stripe
                            </span>

                            <span className="mt-0.5 block text-[11px] text-[#858790]">
                                Card details form
                            </span>
                        </span>
                    </button>
                </div>

                {cardMode === "touch" && (
                    <div className="mt-4 flex h-[164px] flex-col items-center justify-center rounded-[20px] !border !border-dashed !border-[#dfe1e5] bg-[#fdfdfd]">
                        <Radio
                            size={25}
                            strokeWidth={1.5}
                            className="text-[#a8abb1]"
                        />

                        <p className="mt-6 text-[14px] font-semibold text-[#202126]">
                            Ready for tap or insert
                        </p>

                        <p className="mt-2 text-[12px] text-[#858790]">
                            Customer taps or inserts their card on the reader.
                        </p>
                    </div>
                )}

                {cardMode === "stripe" && (
                    <div className="mt-4 rounded-[20px] !border !border-solid !border-[#e2e3e7] bg-[#fafbfc] p-5 text-center">
                        <CreditCard
                            size={24}
                            className="mx-auto text-[#1764df]"
                        />

                        <p className="mt-3 text-[14px] font-semibold text-[#202126]">
                            Stripe card payment
                        </p>

                        <p className="mt-1 text-[12px] text-[#858790]">
                            Stripe payment form can be connected here.
                        </p>
                    </div>
                )}

                <PaymentReference
                    inputRef={inputRef}
                    value={reference}
                    onChange={setReference}
                    placeholder="Transaction ID, auth code, etc."
                />
            </>
        );
    };

    const renderBank = () => {
        return (
            <PaymentReference
                inputRef={inputRef}
                value={reference}
                onChange={setReference}
                placeholder="Transaction ID, authorization code, etc."
            />
        );
    };

    const renderManual = () => {
        return (
            <>
                <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.03em] text-[#777a82]">
                    Payment method
                </label>

                <input
                    ref={inputRef}
                    type="text"
                    value={manualMethod}
                    onChange={(event) =>
                        setManualMethod(event.target.value)
                    }
                    placeholder="e.g. Gift card, store credit"
                    className="
                        block
                        h-[50px]
                        w-full
                        rounded-[16px]
                        !border
                        !border-solid
                        !border-[#dfe1e5]
                        bg-white
                        px-4
                        text-[14px]
                        text-[#292b31]
                        outline-none
                        focus:!border-[#4f8ef7]
                        focus:!ring-4
                        focus:!ring-[#2563eb]/10
                    "
                />

                <PaymentReference
                    value={reference}
                    onChange={setReference}
                    placeholder="Reference or authorization code"
                />
            </>
        );
    };

    return (
        <div
            className="
                fixed
                inset-0
                z-[9999]
                flex
                items-center
                justify-center
                bg-[#101318]/50
                px-4
                py-6
                backdrop-blur-[4px]
            "
            onMouseDown={() => {
                if (!submitting) {
                    onClose();
                }
            }}
        >
            <div
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
                className="
                    flex
                    max-h-[calc(100dvh-48px)]
                    w-full
                    max-w-[756px]
                    flex-col
                    overflow-hidden
                    rounded-[26px]
                    !border
                    !border-solid
                    !border-white/80
                    bg-white
                    shadow-[0_28px_90px_rgba(15,23,42,0.34)]
                "
            >
                {/* HEADER */}

                <div className="flex shrink-0 items-center justify-between !border-b !border-solid !border-[#e7e8eb] px-7 py-5">
                    <div>
                        <h2 className="text-[18px] font-semibold text-[#202126]">
                            Take payment
                        </h2>

                        <p className="mt-1 text-[12px] text-[#858790]">
                            Draft · {itemCount}{" "}
                            {itemCount === 1 ? "item" : "items"}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="flex h-8 w-8 items-center justify-center rounded-full !border-0 bg-transparent text-[#34363c] hover:bg-[#f2f3f5]"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* BODY */}

                <div className="grid min-h-0 flex-1 grid-cols-[270px_minmax(0,1fr)]">
                    {/* PAYMENT METHODS */}

                    <div className="!border-r !border-solid !border-[#e7e8eb] px-6 py-4">
                        <div className="space-y-1">
                            {paymentMethods.map((item) => {
                                const Icon = item.icon;
                                const selected =
                                    method === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onClick={() =>
                                            selectMethod(item.id)
                                        }
                                        className="
                                            flex
                                            w-full
                                            items-center
                                            gap-3
                                            rounded-[14px]
                                            !border-0
                                            bg-transparent
                                            px-1
                                            py-3
                                            text-left
                                        "
                                    >
                                        <span
                                            className={`
                                                flex
                                                h-9
                                                w-9
                                                shrink-0
                                                items-center
                                                justify-center
                                                rounded-full
                                                ${
                                                    selected
                                                        ? "bg-[#e9f1ff] text-[#1764df]"
                                                        : "bg-transparent text-[#70737a]"
                                                }
                                            `}
                                        >
                                            <Icon
                                                size={17}
                                                strokeWidth={1.8}
                                            />
                                        </span>

                                        <span className="min-w-0 flex-1">
                                            <span className="block text-[14px] font-medium text-[#202126]">
                                                {item.title}
                                            </span>

                                            <span className="mt-0.5 block text-[12px] text-[#858790]">
                                                {item.description}
                                            </span>
                                        </span>

                                        {selected && (
                                            <CheckCircle2
                                                size={17}
                                                className="text-[#1764df]"
                                            />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* PAYMENT DETAILS */}

                    <div className="min-h-0 overflow-y-auto px-7 py-6">
                        <div className="flex items-center justify-between">
                            <span className="text-[12px] font-medium uppercase tracking-[0.04em] text-[#777a82]">
                                Total due
                            </span>

                            <span className="text-[27px] font-semibold tracking-[-0.03em] text-[#111214]">
                                {money(totalDue)}
                            </span>
                        </div>

                        {discountAmount > 0 && (
                            <div className="mt-4 flex h-[40px] items-center gap-2 rounded-full !border !border-solid !border-[#bfd5fa] bg-[#f3f7ff] px-4 text-[13px] font-medium text-[#1764df]">
                                <Tag size={15} />
                                {money(discountAmount)} discount applied
                            </div>
                        )}

                        <div className="mt-5">
                            {method === "cash" && renderCash()}
                            {method === "card" && renderCard()}
                            {method === "bank" && renderBank()}
                            {method === "manual" && renderManual()}
                        </div>

                        {error && (
                            <div className="mt-4 rounded-[12px] bg-[#fff1f2] px-4 py-3 text-[12px] text-[#c62828]">
                                {error}
                            </div>
                        )}
                    </div>
                </div>

                {/* FOOTER */}

                <div className="shrink-0 !border-t !border-solid !border-[#e7e8eb] bg-[#fcfcfd] px-7 py-[14px]">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="
                            flex
                            h-[54px]
                            w-full
                            items-center
                            justify-center
                            gap-2
                            rounded-[17px]
                            !border-0
                            bg-[#2468d8]
                            text-[15px]
                            font-semibold
                            text-white
                            transition
                            hover:bg-[#1d5fc9]
                            disabled:cursor-not-allowed
                            disabled:bg-[#cdd7e8]
                        "
                    >
                        {method === "card" &&
                            cardMode === "touch" &&
                            !submitting && (
                                <Radio size={17} />
                            )}

                        {getButtonLabel()}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PaymentReference = ({
    inputRef,
    value,
    onChange,
    placeholder,
}) => {
    return (
        <div className="mt-5">
            <label className="mb-2 block text-[12px] font-medium uppercase tracking-[0.03em] text-[#777a82]">
                Reference (optional)
            </label>

            <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(event) =>
                    onChange(event.target.value)
                }
                placeholder={placeholder}
                className="
                    block
                    h-[50px]
                    w-full
                    rounded-[16px]
                    !border
                    !border-solid
                    !border-[#dfe1e5]
                    bg-white
                    px-4
                    text-[14px]
                    text-[#292b31]
                    outline-none
                    placeholder:text-[#9a9da4]
                    focus:!border-[#4f8ef7]
                    focus:!ring-4
                    focus:!ring-[#2563eb]/10
                "
            />
        </div>
    );
};

export default PosPaymentModal;