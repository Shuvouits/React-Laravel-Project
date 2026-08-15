import { useEffect, useState } from "react";
import {
    LoaderCircle,
    MapPin,
    Plus,
} from "lucide-react";

import api from "../../../api/axios";
import CheckoutAddressModal from "./CheckoutAddressModal";
import CheckoutAddressPickerModal from "./CheckoutAddressPickerModal";

const ADDRESS_API = "/customer/addresses";

const CheckoutDeliveryAddress = ({
    onAddressChange,
}) => {
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [addressErrors, setAddressErrors] = useState({});

    const [pickerOpen, setPickerOpen] = useState(false);
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => {
        fetchAddresses();
    }, []);

    useEffect(() => {
        onAddressChange?.(selectedAddress);
    }, [selectedAddress, onAddressChange]);

    const fetchAddresses = async (
        selectNewest = false
    ) => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                ADDRESS_API
            );

            const list = getAddressList(
                response.data
            );

            setAddresses(list);

            if (!list.length) {
                setSelectedAddress(null);
                return;
            }

            if (selectNewest) {
                const newest = getNewestAddress(
                    list
                );

                setSelectedAddress(newest);
                return;
            }

            const defaultAddress =
                getDefaultAddress(list);

            setSelectedAddress(
                defaultAddress || list[0]
            );
        } catch (error) {
            console.error(
                "Address loading error:",
                error.response?.data || error.message
            );

            setError(
                error.response?.data?.message ||
                "Unable to load your saved addresses."
            );
        } finally {
            setLoading(false);
        }
    };

    const createAddress = async (form) => {
        try {
            setSaving(true);
            setError("");
            setAddressErrors({});

            const response = await api.post(
                ADDRESS_API,
                form
            );

            const createdAddress =
                getCreatedAddress(
                    response.data
                );

            if (!createdAddress) {
                setCreateOpen(false);

                await fetchAddresses(true);

                return;
            }

            setAddresses((current) => {
                let updated = current;

                if (
                    isDefaultAddress(
                        createdAddress
                    )
                ) {
                    updated = current.map(
                        (address) => ({
                            ...address,
                            is_default: false,
                        })
                    );
                }

                return [
                    ...updated,
                    createdAddress,
                ];
            });

            setSelectedAddress(
                createdAddress
            );

            setCreateOpen(false);
        } catch (error) {
            console.error(
                "Address create error:",
                error.response?.data || error.message
            );

            if (error.response?.status === 422) {
                setAddressErrors(
                    error.response?.data?.errors || {}
                );

                return;
            }

            setError(
                error.response?.data?.message ||
                "Unable to save the address."
            );
        } finally {
            setSaving(false);
        }
    };

    const selectAddress = (address) => {
        setSelectedAddress(address);
        setPickerOpen(false);
    };

    const openNewAddress = () => {
        setAddressErrors({});
        setPickerOpen(false);
        setCreateOpen(true);
    };

    if (loading) {
        return (
            <section>
                <h2 className="text-[18px] font-semibold text-[#171717]">
                    Delivery
                </h2>

                <div className="mt-[18px] flex h-[90px] items-center justify-center rounded-[14px] border border-[#dedede]">
                    <LoaderCircle
                        size={22}
                        className="animate-spin text-[#2065D1]"
                    />
                </div>
            </section>
        );
    }

    return (
        <>
            <section>

                <h2 className="text-[18px] font-semibold text-[#171717]">
                    Delivery
                </h2>

                <p className="mt-[14px] text-[14px] font-semibold text-[#333]">
                    Saved address
                </p>

                {error && (
                    <div className="mt-[11px] rounded-[10px] border border-red-200 bg-red-50 px-[14px] py-[10px] text-[13px] text-red-600">
                        {error}
                    </div>
                )}

                {selectedAddress ? (
                    <SelectedAddress
                        address={selectedAddress}
                    />
                ) : (
                    <NoAddress />
                )}

                <div className="mt-[13px] flex flex-wrap items-center gap-[12px]">

                    {addresses.length > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                setPickerOpen(true);
                            }}
                            className="rounded-full border border-[#dedede] bg-white px-[16px] py-[9px] text-[14px] font-medium text-[#222] transition hover:border-[#2065D1] hover:text-[#2065D1]"
                        >
                            Change address
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={openNewAddress}
                        className="flex items-center gap-[6px] px-[4px] py-[9px] text-[14px] font-medium text-[#222] transition hover:text-[#2065D1]"
                    >
                        <Plus size={15} />
                        Use a new address
                    </button>

                </div>

            </section>

            <CheckoutAddressPickerModal
                open={pickerOpen}
                addresses={addresses}
                selectedAddress={selectedAddress}
                onSelect={selectAddress}
                onAddNew={openNewAddress}
                onClose={() => {
                    setPickerOpen(false);
                }}
            />

            <CheckoutAddressModal
                open={createOpen}
                saving={saving}
                errors={addressErrors}
                defaultChecked={
                    addresses.length === 0
                }
                onSave={createAddress}
                onClose={() => {
                    if (!saving) {
                        setCreateOpen(false);
                    }
                }}
            />
        </>
    );
};

const SelectedAddress = ({
    address,
}) => {
    const name = getFullName(address);

    return (
        <div className="mt-[11px] rounded-[14px] border border-[#2065D1] bg-[#f5f8ff] px-[16px] py-[15px]">

            <div className="flex items-center justify-between gap-[10px]">

                <div className="flex items-center gap-[8px]">

                    <MapPin
                        size={16}
                        className="text-[#2065D1]"
                    />

                    <span className="text-[14px] font-medium capitalize text-[#222]">
                        {address.type || "Address"}
                    </span>

                </div>

                {isDefaultAddress(address) && (
                    <span className="rounded-full bg-[#e3edff] px-[9px] py-[3px] text-[11px] font-medium text-[#2065D1]">
                        Default
                    </span>
                )}

            </div>

            <p className="mt-[8px] text-[14px] font-medium text-[#333]">
                {name}
            </p>

            <p className="mt-[4px] text-[14px] leading-[21px] text-[#777]">
                {address.address_line1}
            </p>

            {address.address_line2 && (
                <p className="text-[14px] leading-[21px] text-[#777]">
                    {address.address_line2}
                </p>
            )}

            <p className="text-[14px] leading-[21px] text-[#777]">
                {formatLocation(address)}
            </p>

            {address.phone && (
                <p className="mt-[5px] text-[13px] text-[#777]">
                    {address.phone}
                </p>
            )}

        </div>
    );
};

const NoAddress = () => {
    return (
        <div className="mt-[11px] rounded-[14px] border border-dashed border-[#cfd2d7] bg-[#fafafa] px-[18px] py-[22px] text-center">

            <MapPin
                size={22}
                className="mx-auto text-[#999]"
            />

            <p className="mt-[8px] text-[14px] font-medium text-[#333]">
                No saved address
            </p>

            <p className="mt-[3px] text-[13px] text-[#777]">
                Add an address to continue with delivery.
            </p>

        </div>
    );
};

const getAddressList = (data) => {
    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data?.addresses)) {
        return data.addresses;
    }

    if (Array.isArray(data?.data)) {
        return data.data;
    }

    return [];
};

const getCreatedAddress = (data) => {
    if (data?.address) {
        return data.address;
    }

    if (
        data?.data &&
        !Array.isArray(data.data)
    ) {
        return data.data;
    }

    return null;
};

const getDefaultAddress = (addresses) => {
    return addresses.find((address) => {
        return isDefaultAddress(address);
    });
};

const getNewestAddress = (addresses) => {
    return [...addresses].sort((a, b) => {
        return Number(b.id) - Number(a.id);
    })[0];
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

    const location = [
        cityState,
        address.postal_code,
        address.country,
    ]
        .filter(Boolean);

    return location.join(", ");
};

export default CheckoutDeliveryAddress;