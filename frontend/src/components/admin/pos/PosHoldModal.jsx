import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

const PosHoldModal = ({
    open,
    onClose,
    onConfirm,
}) => {
    const [label, setLabel] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (!open) {
            setLabel("");
            return;
        }

        const focusTimer = window.setTimeout(() => {
            inputRef.current?.focus();
        }, 100);

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";

        return () => {
            window.clearTimeout(focusTimer);
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    const handleClose = () => {
        setLabel("");
        onClose();
    };

    const handleSubmit = (event) => {
        event.preventDefault();

        onConfirm(label.trim());
        setLabel("");
    };

    if (!open) {
        return null;
    }

    return (
        <div
            className="
                fixed
                inset-0
                z-[9999]
                flex
                items-center
                justify-center
                bg-[#111827]/45
                px-4
                backdrop-blur-[3px]
            "
            onMouseDown={handleClose}
        >
            <form
                onSubmit={handleSubmit}
                onMouseDown={(event) => event.stopPropagation()}
                className="
                    w-full
                    max-w-[504px]
                    overflow-hidden
                    rounded-[26px]
                    border
                    border-white/70
                    bg-white
                    shadow-[0_24px_80px_rgba(15,23,42,0.30)]
                "
            >
                {/* HEADER */}

                <div className="flex items-start justify-between gap-6 px-6 pb-4 pt-6">
                    <div className="min-w-0">
                        <h2 className="text-[18px] font-semibold leading-6 text-[#202126]">
                            Hold this order
                        </h2>

                        <p className="mt-1 max-w-[390px] text-[14px] leading-[20px] text-[#777a82]">
                            Optional label – table number, customer name,
                            anything you'll recognize.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-full
                            text-[#34363c]
                            transition
                            hover:bg-[#f2f3f5]
                            hover:text-black
                        "
                        aria-label="Close hold order modal"
                    >
                        <X size={18} strokeWidth={2} />
                    </button>
                </div>

                {/* INPUT */}

                <div className="px-6 pb-6">
                    <input
                        ref={inputRef}
                        type="text"
                        value={label}
                        onChange={(event) => setLabel(event.target.value)}
                        placeholder="e.g. Table 5 · Mrs. Patel · Pickup order"
                        maxLength={100}
                        className="
                            h-[50px]
                            w-full
                            rounded-[16px]
                            border
                            border-[#8db9ff]
                            bg-white
                            px-4
                            text-[15px]
                            text-[#202126]
                            outline-none
                            transition
                            placeholder:text-[#858790]
                            focus:border-[#4f8ef7]
                            focus:ring-4
                            focus:ring-[#2563eb]/10
                        "
                    />
                </div>

                {/* FOOTER */}

                <div className="flex items-center justify-end gap-3 border-t border-[#e7e8eb] bg-[#fcfcfd] px-6 py-[18px]">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="
                            flex
                            h-[42px]
                            items-center
                            justify-center
                            rounded-[13px]
                            px-5
                            text-[15px]
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
                        className="
                            flex
                            h-[42px]
                            items-center
                            justify-center
                            rounded-[14px]
                            bg-[#2468d8]
                            px-6
                            text-[15px]
                            font-semibold
                            text-white
                            shadow-sm
                            transition
                            hover:bg-[#1d5fc9]
                            active:scale-[0.98]
                        "
                    >
                        Hold order
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PosHoldModal;