import { useEffect, useState } from "react";
import {
    Check,
    MapPin,
    Plus,
    X,
} from "lucide-react";

const CheckoutAddressPickerModal = ({
    open,
    addresses,
    selectedAddress,
    onSelect,
    onAddNew,
    onClose,
}) => {
    const [selectedId, setSelectedId] =
        useState(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        setSelectedId(
            selectedAddress?.id || null
        );
    }, [open, selectedAddress]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const oldOverflow =
            document.body.style.overflow;

        document.body.style.overflow =
            "hidden";

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.body.style.overflow =
                oldOverflow;

            window.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, [open, onClose]);

    const useAddress = () => {
        const address = addresses.find(
            (item) => {
                return item.id === selectedId;
            }
        );

        if (!address) {
            return;
        }

        onSelect(address);
    };

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-[25px]">

            <button
                type="button"
                aria-label="Close modal"
                onClick={onClose}
                className="absolute inset-0 bg-black/50"
            />

            <div className="relative z-10 max-h-[calc(100vh-50px)] w-full max-w-[500px] overflow-y-auto rounded-[16px] bg-white shadow-[0_25px_70px_rgba(0,0,0,0.22)]">

                <div className="flex items-start justify-between border-b border-[#eeeeee] px-[24px] py-[20px]">

                    <div>
                        <h2 className="text-[20px] font-semibold text-[#171717]">
                            Choose Delivery Address
                        </h2>

                        <p className="mt-[4px] text-[13px] text-[#777]">
                            Select one of your saved addresses.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="flex h-[32px] w-[32px] items-center justify-center rounded-full text-[#666] hover:bg-[#f5f5f5]"
                    >
                        <X size={18} />
                    </button>

                </div>

                <div className="space-y-[10px] px-[24px] py-[20px]">

                    {addresses.map((address) => (
                        <AddressOption
                            key={address.id}
                            address={address}
                            active={
                                address.id ===
                                selectedId
                            }
                            onClick={() => {
                                setSelectedId(
                                    address.id
                                );
                            }}
                        />
                    ))}

                    <button
                        type="button"
                        onClick={onAddNew}
                        className="flex w-full items-center justify-center gap-[7px] rounded-[10px] border border-dashed border-[#c8ccd1] px-[14px] py-[13px] text-[14px] font-medium text-[#555] transition hover:border-[#2065D1] hover:text-[#2065D1]"
                    >
                        <Plus size={16} />
                        Add New Address
                    </button>

                </div>

                <div className="flex justify-end gap-[10px] border-t border-[#eeeeee] px-[24px] py-[18px]">

                    <button
                        type="button"
                        onClick={onClose}
                        className="h-[40px] rounded-full border border-[#dedede] px-[18px] text-[14px] font-medium text-[#333] hover:bg-[#f7f7f7]"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={useAddress}
                        disabled={!selectedId}
                        className="h-[40px] rounded-full bg-[#2065D1] px-[20px] text-[14px] font-semibold text-white hover:bg-[#1858bb] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Use This Address
                    </button>

                </div>

            </div>

        </div>
    );
};

const AddressOption = ({
    address,
    active,
    onClick,
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-[12px] border px-[15px] py-[14px] text-left transition ${
                active
                    ? "border-[#2065D1] bg-[#f5f8ff]"
                    : "border-[#dedede] bg-white hover:border-[#bfc7d5]"
            }`}
        >

            <div className="flex items-start gap-[12px]">

                <span
                    className={`mt-[2px] flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-full border ${
                        active
                            ? "border-[#2065D1] bg-[#2065D1] text-white"
                            : "border-[#bbbbbb] bg-white"
                    }`}
                >
                    {active && (
                        <Check size={12} />
                    )}
                </span>

                <div className="min-w-0 flex-1">

                    <div className="flex items-center gap-[8px]">

                        <MapPin
                            size={15}
                            className="text-[#777]"
                        />

                        <span className="text-[14px] font-semibold capitalize text-[#222]">
                            {address.type || "Address"}
                        </span>

                        {isDefaultAddress(address) && (
                            <span className="rounded-full bg-[#e8f1ff] px-[8px] py-[2px] text-[10px] font-medium text-[#2065D1]">
                                Default
                            </span>
                        )}

                    </div>

                    <p className="mt-[7px] text-[14px] font-medium text-[#333]">
                        {getFullName(address)}
                    </p>

                    <p className="mt-[3px] text-[13px] leading-[20px] text-[#777]">
                        {address.address_line1}
                    </p>

                    <p className="text-[13px] leading-[20px] text-[#777]">
                        {formatLocation(address)}
                    </p>

                </div>

            </div>

        </button>
    );
};

const isDefaultAddress = (address) => {
    return (
        address?.is_default === true ||
        Number(address?.is_default) === 1
    );
};

const getFullName = (address) => {
    return [
        address.first_name,
        address.last_name,
    ]
        .filter(Boolean)
        .join(" ");
};

const formatLocation = (address) => {
    const cityState = [
        address.city,
        address.state,
    ]
        .filter(Boolean)
        .join(", ");

    return [
        cityState,
        address.postal_code,
        address.country,
    ]
        .filter(Boolean)
        .join(", ");
};

export default CheckoutAddressPickerModal;