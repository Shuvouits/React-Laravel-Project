import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

const PosDiscountModal = ({
    cartTotals,
    discount,
    formatMoney,
    onClose,
    onApply,
}) => {
    const valueInputRef = useRef(null);

    const existingType =
        discount?.type === "fixed"
            ? "fixed"
            : "percentage";

    const existingValue = Number(
        discount?.value || 0
    );

    const [type, setType] = useState(existingType);

    const [value, setValue] = useState(
        existingValue > 0
            ? String(existingValue)
            : ""
    );

    const [reason, setReason] = useState(
        discount?.reason || ""
    );

    const [note, setNote] = useState(
        discount?.note || ""
    );

    const subtotal = Number(
        cartTotals?.subtotal || 0
    );

    const numericValue = Number(value || 0);

    const hasExistingDiscount =
        existingValue > 0;

    const discountAmount = useMemo(() => {
        if (numericValue <= 0) {
            return 0;
        }

        if (type === "percentage") {
            return Math.min(
                subtotal,
                (subtotal * numericValue) / 100
            );
        }

        return Math.min(
            subtotal,
            numericValue
        );
    }, [
        numericValue,
        subtotal,
        type,
    ]);

    const newTotal = Math.max(
        subtotal - discountAmount,
        0
    );

    const money = (amount) => {
        if (formatMoney) {
            return formatMoney(amount);
        }

        return `$${Number(amount || 0).toFixed(2)}`;
    };

    useEffect(() => {
        const focusTimer = window.setTimeout(() => {
            valueInputRef.current?.focus();
        }, 120);

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        document.body.style.overflow = "hidden";

        return () => {
            window.clearTimeout(focusTimer);

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

            document.body.style.overflow = "";
        };
    }, [onClose]);

    const changeType = (nextType) => {
        if (nextType === type) {
            return;
        }

        setType(nextType);
        setValue("");

        window.setTimeout(() => {
            valueInputRef.current?.focus();
        }, 50);
    };

    const handleValueChange = (event) => {
        const rawValue = event.target.value;

        if (rawValue === "") {
            setValue("");
            return;
        }

        let nextValue = Number(rawValue);

        if (!Number.isFinite(nextValue)) {
            return;
        }

        nextValue = Math.max(0, nextValue);

        if (type === "percentage") {
            nextValue = Math.min(100, nextValue);
        } else {
            nextValue = Math.min(
                subtotal,
                nextValue
            );
        }

        setValue(String(nextValue));
    };

    const handleApply = (event) => {
        event.preventDefault();

        if (
            numericValue <= 0 ||
            discountAmount <= 0
        ) {
            return;
        }

        onApply({
            type,
            value: numericValue,
            reason,
            note: note.trim(),
        });
    };

    const handleRemove = () => {
        onApply({
            type: null,
            value: 0,
            reason: "",
            note: "",
        });
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
            onMouseDown={onClose}
        >
            <form
                onSubmit={handleApply}
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
                className="
                    flex
                    max-h-[calc(100dvh-48px)]
                    w-full
                    max-w-[504px]
                    flex-col
                    overflow-hidden
                    rounded-[26px]
                    !border
                    !border-solid
                    !border-white/80
                    bg-white
                    shadow-[0_28px_90px_rgba(15,23,42,0.32)]
                "
            >
                {/* HEADER */}

                <div
                    className="
                        flex
                        shrink-0
                        items-center
                        justify-between
                        !border-b
                        !border-solid
                        !border-[#e7e8eb]
                        px-6
                        py-5
                    "
                >
                    <h2 className="text-[18px] font-semibold leading-6 text-[#202126]">
                        Order-level discount
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="
                            flex
                            h-8
                            w-8
                            items-center
                            justify-center
                            rounded-full
                            !border-0
                            bg-transparent
                            p-0
                            text-[#555861]
                            transition
                            hover:bg-[#f2f3f5]
                            hover:text-[#111214]
                        "
                        aria-label="Close discount modal"
                    >
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                {/* SCROLLABLE BODY */}

                <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
                    {/* DISCOUNT TYPE */}

                    <div className="grid grid-cols-2 rounded-[16px] bg-[#f5f6f8] p-1">
                        <button
                            type="button"
                            onClick={() =>
                                changeType("percentage")
                            }
                            className={`
                                h-[43px]
                                rounded-[13px]
                                !border-0
                                px-4
                                text-[15px]
                                font-medium
                                transition
                                ${
                                    type === "percentage"
                                        ? "bg-white text-[#202126] shadow-[0_1px_4px_rgba(15,23,42,0.12)]"
                                        : "bg-transparent text-[#777a82] hover:text-[#202126]"
                                }
                            `}
                        >
                            Percent
                        </button>

                        <button
                            type="button"
                            onClick={() =>
                                changeType("fixed")
                            }
                            className={`
                                h-[43px]
                                rounded-[13px]
                                !border-0
                                px-4
                                text-[15px]
                                font-medium
                                transition
                                ${
                                    type === "fixed"
                                        ? "bg-white text-[#202126] shadow-[0_1px_4px_rgba(15,23,42,0.12)]"
                                        : "bg-transparent text-[#777a82] hover:text-[#202126]"
                                }
                            `}
                        >
                            Amount
                        </button>
                    </div>

                    {/* QUICK PERCENTAGES */}

                    {type === "percentage" && (
                        <div className="mt-6 grid grid-cols-4 gap-2">
                            {[5, 10, 15, 20].map(
                                (percentage) => {
                                    const isSelected =
                                        numericValue === percentage;

                                    return (
                                        <button
                                            key={percentage}
                                            type="button"
                                            onClick={() =>
                                                setValue(
                                                    String(percentage)
                                                )
                                            }
                                            className={`
                                                h-[46px]
                                                rounded-full
                                                !border
                                                !border-solid
                                                px-3
                                                text-[15px]
                                                font-medium
                                                transition
                                                ${
                                                    isSelected
                                                        ? "!border-[#2f76e8] bg-[#edf4ff] text-[#2468d8]"
                                                        : "!border-[#e1e3e7] bg-white text-[#292b31] hover:!border-[#c9ccd2] hover:bg-[#fafafa]"
                                                }
                                            `}
                                        >
                                            {percentage}%
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    )}

                    {/* DISCOUNT VALUE */}

                    <div className="mt-6">
                        <label
                            htmlFor="pos-discount-value"
                            className="
                                mb-2
                                block
                                text-[12px]
                                font-medium
                                uppercase
                                tracking-[0.025em]
                                text-[#777a82]
                            "
                        >
                            {type === "percentage"
                                ? "Percent off"
                                : "Amount off"}
                        </label>

                        <div className="relative">
                            <span
                                className="
                                    pointer-events-none
                                    absolute
                                    left-4
                                    top-1/2
                                    z-10
                                    -translate-y-1/2
                                    text-[15px]
                                    text-[#777a82]
                                "
                            >
                                {type === "percentage"
                                    ? "%"
                                    : "$"}
                            </span>

                            <input
                                ref={valueInputRef}
                                id="pos-discount-value"
                                type="number"
                                inputMode="decimal"
                                min="0"
                                max={
                                    type === "percentage"
                                        ? 100
                                        : subtotal
                                }
                                step="0.01"
                                value={value}
                                onChange={handleValueChange}
                                placeholder="0"
                                className="
                                    block
                                    h-[52px]
                                    w-full
                                    appearance-none
                                    rounded-[16px]
                                    !border
                                    !border-solid
                                    !border-[#dfe1e5]
                                    bg-white
                                    pb-0
                                    pl-10
                                    pr-4
                                    pt-0
                                    text-[15px]
                                    font-normal
                                    text-[#202126]
                                    outline-none
                                    transition
                                    placeholder:text-[#a2a5ac]
                                    focus:!border-[#4f8ef7]
                                    focus:!ring-4
                                    focus:!ring-[#2563eb]/10
                                "
                            />
                        </div>
                    </div>

                    {/* TOTAL PREVIEW */}

                    <div className="mt-6 flex items-center justify-between px-4">
                        <div>
                            <p className="text-[15px] text-[#777a82]">
                                New total
                            </p>

                            <p className="mt-1 text-[13px] text-[#92949b]">
                                You save
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-[18px] font-semibold leading-6 text-[#202126]">
                                {money(newTotal)}
                            </p>

                            <p className="mt-1 text-[13px] text-[#777a82]">
                                {money(discountAmount)}
                            </p>
                        </div>
                    </div>

                    {/* REASON */}

                    <div className="mt-7">
                        <label
                            htmlFor="pos-discount-reason"
                            className="
                                mb-2
                                block
                                text-[12px]
                                font-medium
                                uppercase
                                tracking-[0.025em]
                                text-[#777a82]
                            "
                        >
                            Reason
                        </label>

                        <div className="relative">
                            <select
                                id="pos-discount-reason"
                                value={reason}
                                onChange={(event) =>
                                    setReason(
                                        event.target.value
                                    )
                                }
                                className="
                                    block
                                    h-[50px]
                                    w-full
                                    appearance-none
                                    rounded-[16px]
                                    !border
                                    !border-solid
                                    !border-[#dfe1e5]
                                    bg-white
                                    pb-0
                                    pl-4
                                    pr-11
                                    pt-0
                                    text-[14px]
                                    font-normal
                                    text-[#292b31]
                                    outline-none
                                    transition
                                    focus:!border-[#4f8ef7]
                                    focus:!ring-4
                                    focus:!ring-[#2563eb]/10
                                "
                            >
                                <option value="">
                                    No reason
                                </option>

                                <option value="damaged_item">
                                    Damaged item
                                </option>

                                <option value="customer_request">
                                    Customer request
                                </option>

                                <option value="promotion">
                                    Promotion
                                </option>

                                <option value="staff_discount">
                                    Staff discount
                                </option>

                                <option value="price_match">
                                    Price match
                                </option>

                                <option value="manager_discount">
                                    Manager discount
                                </option>

                                <option value="other">
                                    Other
                                </option>
                            </select>

                            <ChevronDown
                                size={17}
                                strokeWidth={1.8}
                                className="
                                    pointer-events-none
                                    absolute
                                    right-4
                                    top-1/2
                                    -translate-y-1/2
                                    text-[#555861]
                                "
                            />
                        </div>
                    </div>

                    {/* NOTE */}

                    <div className="mt-6">
                        <label
                            htmlFor="pos-discount-note"
                            className="
                                mb-2
                                block
                                text-[12px]
                                font-medium
                                uppercase
                                tracking-[0.025em]
                                text-[#777a82]
                            "
                        >
                            Note (optional)
                        </label>

                        <input
                            id="pos-discount-note"
                            type="text"
                            value={note}
                            onChange={(event) =>
                                setNote(event.target.value)
                            }
                            maxLength={250}
                            placeholder="Add a short note"
                            className="
                                block
                                h-[50px]
                                w-full
                                rounded-[16px]
                                !border
                                !border-solid
                                !border-[#dfe1e5]
                                bg-white
                                pb-0
                                pl-4
                                pr-4
                                pt-0
                                text-[14px]
                                font-normal
                                text-[#292b31]
                                outline-none
                                transition
                                placeholder:text-[#a2a5ac]
                                focus:!border-[#4f8ef7]
                                focus:!ring-4
                                focus:!ring-[#2563eb]/10
                            "
                        />
                    </div>
                </div>

                {/* FOOTER */}

                <div
                    className="
                        flex
                        shrink-0
                        items-center
                        !border-t
                        !border-solid
                        !border-[#e7e8eb]
                        bg-[#fcfcfd]
                        px-6
                        py-[18px]
                    "
                >
                    <div className="flex-1">
                        {hasExistingDiscount && (
                            <button
                                type="button"
                                onClick={handleRemove}
                                className="
                                    h-[42px]
                                    rounded-[13px]
                                    !border-0
                                    bg-transparent
                                    px-4
                                    text-[14px]
                                    font-medium
                                    text-[#ef3038]
                                    transition
                                    hover:bg-[#fff0f1]
                                "
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="
                                h-[42px]
                                rounded-[13px]
                                !border-0
                                bg-transparent
                                px-5
                                text-[14px]
                                font-medium
                                text-[#292b31]
                                transition
                                hover:bg-[#f0f1f3]
                            "
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={
                                numericValue <= 0 ||
                                discountAmount <= 0
                            }
                            className="
                                flex
                                h-[42px]
                                items-center
                                justify-center
                                gap-2
                                rounded-[14px]
                                !border-0
                                bg-[#2468d8]
                                px-6
                                text-[14px]
                                font-semibold
                                text-white
                                shadow-[0_2px_5px_rgba(36,104,216,0.22)]
                                transition
                                hover:bg-[#1d5fc9]
                                active:scale-[0.98]
                                disabled:cursor-not-allowed
                                disabled:bg-[#cdd7e8]
                                disabled:shadow-none
                            "
                        >
                            <Check
                                size={16}
                                strokeWidth={2.2}
                            />

                            Apply
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default PosDiscountModal;