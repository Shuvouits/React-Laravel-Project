import { useEffect, useMemo, useState } from "react";
import {
    ArrowDownRight,
    ArrowLeftRight,
    ArrowUpRight,
    LoaderCircle,
    RefreshCw,
} from "lucide-react";

import api from "../../../api/axios";

const AdminFinanceReceivables = () => {
    const [summary, setSummary] = useState({
        owed_to_vendors: 0,
        commission_owed_to_admin: 0,
        net_to_settle: 0,
        currency: "USD",
    });

    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState("");

    const fetchReceivables = async (isRefresh = false) => {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        try {
            const response = await api.get(
                "/admin/finance/receivables"
            );

            const responseData = response.data?.data || response.data;

            setSummary({
                owed_to_vendors:
                    responseData?.summary?.owed_to_vendors ??
                    responseData?.owed_to_vendors ??
                    0,

                commission_owed_to_admin:
                    responseData?.summary?.commission_owed_to_admin ??
                    responseData?.summary?.commission_owed_to_you ??
                    responseData?.commission_owed_to_admin ??
                    responseData?.commission_owed_to_you ??
                    0,

                net_to_settle:
                    responseData?.summary?.net_to_settle ??
                    responseData?.net_to_settle ??
                    0,

                currency:
                    responseData?.summary?.currency ??
                    responseData?.currency ??
                    "USD",
            });

            setVendors(
                responseData?.vendors ||
                responseData?.receivables ||
                responseData?.items ||
                []
            );
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Unable to load finance receivables."
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchReceivables();
    }, []);

    const calculatedSummary = useMemo(() => {
        if (!vendors.length) {
            return summary;
        }

        const totalOwedToVendors = vendors.reduce(
            (total, vendor) =>
                total + Number(getOwedToVendor(vendor)),
            0
        );

        const totalCommission = vendors.reduce(
            (total, vendor) =>
                total + Number(getCommission(vendor)),
            0
        );

        const totalNet = vendors.reduce(
            (total, vendor) =>
                total + Number(getNetToSettle(vendor)),
            0
        );

        return {
            owed_to_vendors:
                summary.owed_to_vendors !== null &&
                summary.owed_to_vendors !== undefined
                    ? summary.owed_to_vendors
                    : totalOwedToVendors,

            commission_owed_to_admin:
                summary.commission_owed_to_admin !== null &&
                summary.commission_owed_to_admin !== undefined
                    ? summary.commission_owed_to_admin
                    : totalCommission,

            net_to_settle:
                summary.net_to_settle !== null &&
                summary.net_to_settle !== undefined
                    ? summary.net_to_settle
                    : totalNet,

            currency: summary.currency || "USD",
        };
    }, [summary, vendors]);

    const formatMoney = (amount, currency = "USD") => {
        const numericAmount = Number(amount || 0);

        try {
            return new Intl.NumberFormat("en-US", {
                style: "currency",
                currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }).format(numericAmount);
        } catch {
            return `$${numericAmount.toFixed(2)}`;
        }
    };

    const getVendorName = (vendor) => {
        return (
            vendor?.store_name ||
            vendor?.vendor_name ||
            vendor?.vendor?.store_name ||
            vendor?.vendor?.name ||
            vendor?.vendor?.user?.name ||
            vendor?.user?.name ||
            "Unknown vendor"
        );
    };

    const getOwedToVendor = (vendor) => {
        return (
            vendor?.owed_to_vendor ??
            vendor?.owed_to_vendors ??
            vendor?.held_amount ??
            0
        );
    };

    const getCommission = (vendor) => {
        return (
            vendor?.commission_owed_to_admin ??
            vendor?.commission_owed_to_you ??
            vendor?.commission_amount ??
            vendor?.owed_amount ??
            0
        );
    };

    const getNetToSettle = (vendor) => {
        if (
            vendor?.net_to_settle !== null &&
            vendor?.net_to_settle !== undefined
        ) {
            return vendor.net_to_settle;
        }

        return (
            Number(getOwedToVendor(vendor)) -
            Number(getCommission(vendor))
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-[520px] items-center justify-center bg-[#f6f7f9]">
                <LoaderCircle
                    size={36}
                    className="animate-spin text-blue-600"
                />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f7f9] p-5 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px]">
                <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                            Owed to and from vendors
                        </h1>

                        <p className="mt-1 max-w-3xl text-sm text-gray-600 sm:text-base">
                            Money held on a vendor&apos;s behalf against
                            commission owed on orders they collected
                            themselves.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => fetchReceivables(true)}
                        disabled={refreshing}
                        className="inline-flex h-10 w-fit items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-800 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw
                            size={17}
                            className={refreshing ? "animate-spin" : ""}
                        />

                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <SummaryCard
                        label="Owed to vendors"
                        value={formatMoney(
                            calculatedSummary.owed_to_vendors,
                            calculatedSummary.currency
                        )}
                        currency={calculatedSummary.currency}
                        icon={ArrowUpRight}
                        iconClassName="text-gray-500"
                    />

                    <SummaryCard
                        label="Commission owed to you"
                        value={formatMoney(
                            calculatedSummary.commission_owed_to_admin,
                            calculatedSummary.currency
                        )}
                        currency={calculatedSummary.currency}
                        icon={ArrowDownRight}
                        iconClassName="text-gray-500"
                    />

                    <SummaryCard
                        label="Net to settle"
                        value={formatMoney(
                            calculatedSummary.net_to_settle,
                            calculatedSummary.currency
                        )}
                        currency={calculatedSummary.currency}
                        icon={ArrowLeftRight}
                        iconClassName="text-gray-500"
                    />
                </div>

                <div className="mt-7 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/60 text-left text-sm text-gray-700">
                                    <th className="px-5 py-4 font-semibold sm:px-6">
                                        Vendor
                                    </th>

                                    <th className="px-5 py-4 text-right font-semibold">
                                        Owed to vendors
                                    </th>

                                    <th className="px-5 py-4 text-right font-semibold">
                                        Commission owed to you
                                    </th>

                                    <th className="px-5 py-4 text-right font-semibold sm:px-6">
                                        Net to settle
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {vendors.length > 0 ? (
                                    vendors.map((vendor, index) => {
                                        const vendorCurrency =
                                            vendor.currency ||
                                            calculatedSummary.currency;

                                        const commission =
                                            getCommission(vendor);

                                        const netToSettle =
                                            getNetToSettle(vendor);

                                        return (
                                            <tr
                                                key={
                                                    vendor.vendor_id ||
                                                    vendor.id ||
                                                    index
                                                }
                                                className="border-b border-gray-100 text-sm last:border-b-0 hover:bg-gray-50/70"
                                            >
                                                <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-950 sm:px-6">
                                                    {getVendorName(vendor)}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-right text-gray-900">
                                                    {formatMoney(
                                                        getOwedToVendor(vendor),
                                                        vendorCurrency
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-right">
                                                    <span className="inline-flex rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-700">
                                                        {formatMoney(
                                                            commission,
                                                            vendorCurrency
                                                        )}
                                                    </span>
                                                </td>

                                                <td
                                                    className={`whitespace-nowrap px-5 py-4 text-right font-semibold sm:px-6 ${
                                                        Number(netToSettle) < 0
                                                            ? "text-red-600"
                                                            : "text-gray-950"
                                                    }`}
                                                >
                                                    {formatMoney(
                                                        netToSettle,
                                                        vendorCurrency
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="px-6 py-20 text-center"
                                        >
                                            <ArrowLeftRight
                                                size={36}
                                                className="mx-auto text-gray-300"
                                            />

                                            <h3 className="mt-4 font-semibold text-gray-900">
                                                No vendor balance found
                                            </h3>

                                            <p className="mt-1 text-sm text-gray-500">
                                                Vendor balances will appear
                                                here after finance entries are
                                                recorded.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <p className="mt-6 text-sm text-gray-500">
                    These balances are adjusted when a payout is created,
                    completed, cancelled, or a commission payment is settled.
                </p>
            </div>
        </div>
    );
};

const SummaryCard = ({
    label,
    value,
    currency,
    icon: Icon,
    iconClassName,
}) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-600">
                        {label}
                    </p>

                    <h2 className="mt-3 text-2xl font-semibold text-gray-950">
                        {value}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                        {currency}
                    </p>
                </div>

                <Icon
                    size={21}
                    className={iconClassName}
                />
            </div>
        </div>
    );
};

export default AdminFinanceReceivables;