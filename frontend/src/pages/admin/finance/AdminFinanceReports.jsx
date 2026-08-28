import { useEffect, useMemo, useState } from "react";
import {
    Download,
    FileLock2,
    LoaderCircle,
    LockKeyhole,
    RotateCcw,
    X,
} from "lucide-react";

import api from "../../../api/axios";

const AdminFinanceReports = () => {
    const currentYear = new Date().getFullYear();

    const [summary, setSummary] = useState({
        tax_collected: 0,
        tax_refunded: 0,
        tax_owed_onward: 0,
        currency: "USD",
    });

    const [closedMonths, setClosedMonths] = useState([]);
    const [year, setYear] = useState(currentYear);
    const [selectedMonth, setSelectedMonth] = useState("");

    const [loading, setLoading] = useState(true);
    const [closing, setClosing] = useState(false);
    const [downloading, setDownloading] = useState("");
    const [confirmModalOpen, setConfirmModalOpen] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const years = useMemo(() => {
        const yearList = [];

        for (let item = currentYear; item >= currentYear - 5; item -= 1) {
            yearList.push(item);
        }

        return yearList;
    }, [currentYear]);

    const availableMonths = useMemo(() => {
        const months = [];
        const now = new Date();

        for (let month = 1; month <= 12; month += 1) {
            const monthDate = new Date(year, month - 1, 1);

            if (monthDate > now) {
                continue;
            }

            const monthValue = `${year}-${String(month).padStart(2, "0")}`;

            const alreadyClosed = closedMonths.some((item) => {
                return getMonthValue(item) === monthValue;
            });

            months.push({
                value: monthValue,
                label: monthDate.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                }),
                closed: alreadyClosed,
            });
        }

        return months;
    }, [year, closedMonths]);

    useEffect(() => {
        fetchReport();
    }, [year]);

    useEffect(() => {
        const firstOpenMonth = [...availableMonths]
            .reverse()
            .find((month) => !month.closed);

        setSelectedMonth(firstOpenMonth?.value || "");
    }, [availableMonths]);

    const fetchReport = async () => {
        setLoading(true);
        setError("");

        try {
            const response = await api.get(
                "/admin/finance/reports",
                {
                    params: { year },
                }
            );

            const data = response.data?.data || response.data;

            setSummary({
                tax_collected:
                    data?.summary?.tax_collected ??
                    data?.tax_collected ??
                    0,

                tax_refunded:
                    data?.summary?.tax_refunded ??
                    data?.tax_refunded ??
                    0,

                tax_owed_onward:
                    data?.summary?.tax_owed_onward ??
                    data?.summary?.owed_onward ??
                    data?.tax_owed_onward ??
                    data?.owed_onward ??
                    0,

                currency:
                    data?.summary?.currency ??
                    data?.currency ??
                    "USD",
            });

            setClosedMonths(
                data?.closed_months ||
                data?.period_closures ||
                data?.closures ||
                []
            );
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Unable to load finance reports."
            );
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCloseModal = () => {
        setError("");
        setSuccess("");

        if (!selectedMonth) {
            setError("Please select an open month.");
            return;
        }

        setConfirmModalOpen(true);
    };

    const handleCloseMonth = async () => {
        if (!selectedMonth) {
            return;
        }

        setClosing(true);
        setError("");
        setSuccess("");

        try {
            const response = await api.post(
                "/admin/finance/reports/close-month",
                {
                    month: selectedMonth,
                }
            );

            setSuccess(
                response.data?.message ||
                `${formatMonth(selectedMonth)} closed successfully.`
            );

            setConfirmModalOpen(false);
            await fetchReport();
        } catch (requestError) {
            const validationErrors =
                requestError.response?.data?.errors;

            if (validationErrors) {
                const firstError = Object.values(validationErrors)
                    .flat()
                    .find(Boolean);

                setError(firstError || "Validation failed.");
            } else {
                setError(
                    requestError.response?.data?.message ||
                    "Unable to close the selected month."
                );
            }

            setConfirmModalOpen(false);
        } finally {
            setClosing(false);
        }
    };

    const handleDownload = async (type) => {
        setDownloading(type);
        setError("");

        const endpoint =
            type === "ledger"
                ? "/admin/finance/reports/ledger-csv"
                : "/admin/finance/reports/expenses-csv";

        try {
            const response = await api.get(endpoint, {
                params: { year },
                responseType: "blob",
            });

            const contentDisposition =
                response.headers?.["content-disposition"];

            const fallbackName =
                type === "ledger"
                    ? `finance-ledger-${year}.csv`
                    : `finance-expenses-${year}.csv`;

            const fileName = getDownloadFileName(
                contentDisposition,
                fallbackName
            );

            const blobUrl = window.URL.createObjectURL(
                new Blob([response.data], {
                    type:
                        response.headers?.["content-type"] ||
                        "text/csv;charset=utf-8;",
                })
            );

            const downloadLink = document.createElement("a");

            downloadLink.href = blobUrl;
            downloadLink.setAttribute("download", fileName);

            document.body.appendChild(downloadLink);
            downloadLink.click();
            downloadLink.remove();

            window.URL.revokeObjectURL(blobUrl);
        } catch (requestError) {
            setError(
                requestError.response?.data?.message ||
                "Unable to download the CSV report."
            );
        } finally {
            setDownloading("");
        }
    };

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

    const formatDateTime = (date) => {
        if (!date) {
            return "—";
        }

        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
        }).format(new Date(date));
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
        <>
            <div className="min-h-screen bg-[#f6f7f9] p-5 sm:p-6 lg:p-8">
                <div className="mx-auto max-w-[1600px]">
                    <div className="mb-7 flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-950 sm:text-3xl">
                                Reports
                            </h1>

                            <p className="mt-1 text-sm text-gray-600 sm:text-base">
                                Financial records for accountants and
                                closed reporting periods.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    handleDownload("ledger")
                                }
                                disabled={downloading !== ""}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {downloading === "ledger" ? (
                                    <LoaderCircle
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Download size={17} />
                                )}

                                Ledger CSV
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    handleDownload("expenses")
                                }
                                disabled={downloading !== ""}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {downloading === "expenses" ? (
                                    <LoaderCircle
                                        size={17}
                                        className="animate-spin"
                                    />
                                ) : (
                                    <Download size={17} />
                                )}

                                Expenses CSV
                            </button>

                            <select
                                value={year}
                                onChange={(event) =>
                                    setYear(Number(event.target.value))
                                }
                                className="h-10 min-w-36 rounded-xl border border-gray-300 bg-white px-4 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                            >
                                {years.map((yearOption) => (
                                    <option
                                        key={yearOption}
                                        value={yearOption}
                                    >
                                        {yearOption === currentYear
                                            ? "This year"
                                            : yearOption}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {success && (
                        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {success}
                        </div>
                    )}

                    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-950">
                                Tax collected
                            </h2>

                            <p className="mt-1 text-sm text-gray-600">
                                Money collected from buyers and owed
                                onward. These figures are records for
                                financial and tax reporting.
                            </p>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                            <TaxSummaryCard
                                label="Collected"
                                value={formatMoney(
                                    summary.tax_collected,
                                    summary.currency
                                )}
                                currency={summary.currency}
                                icon={FileLock2}
                            />

                            <TaxSummaryCard
                                label="Refunded"
                                value={formatMoney(
                                    summary.tax_refunded,
                                    summary.currency
                                )}
                                currency={summary.currency}
                                icon={RotateCcw}
                            />

                            <TaxSummaryCard
                                label="Owed onward"
                                value={formatMoney(
                                    summary.tax_owed_onward,
                                    summary.currency
                                )}
                                currency={summary.currency}
                                icon={LockKeyhole}
                            />
                        </div>
                    </section>

                    <section className="mt-7">
                        <div className="mb-4 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-950">
                                    Closed months
                                </h2>

                                <p className="mt-1 text-sm text-gray-600">
                                    Closing a month stores its final
                                    financial figures for reporting.
                                </p>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <select
                                    value={selectedMonth}
                                    onChange={(event) =>
                                        setSelectedMonth(
                                            event.target.value
                                        )
                                    }
                                    disabled={!availableMonths.length}
                                    className="h-11 min-w-44 rounded-xl border border-gray-300 bg-white px-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100"
                                >
                                    {!selectedMonth && (
                                        <option value="">
                                            No open month
                                        </option>
                                    )}

                                    {availableMonths.map((month) => (
                                        <option
                                            key={month.value}
                                            value={month.value}
                                            disabled={month.closed}
                                        >
                                            {month.label}
                                            {month.closed
                                                ? " - Closed"
                                                : ""}
                                        </option>
                                    ))}
                                </select>

                                <button
                                    type="button"
                                    onClick={handleOpenCloseModal}
                                    disabled={!selectedMonth}
                                    className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <LockKeyhole size={17} />
                                    Close month
                                </button>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50/60 text-left text-sm text-gray-700">
                                            <th className="px-5 py-4 font-semibold sm:px-6">
                                                Month
                                            </th>

                                            <th className="px-5 py-4 font-semibold">
                                                Closed
                                            </th>

                                            <th className="px-5 py-4 text-right font-semibold">
                                                Income
                                            </th>

                                            <th className="px-5 py-4 text-right font-semibold">
                                                Costs
                                            </th>

                                            <th className="px-5 py-4 text-right font-semibold sm:px-6">
                                                Net at close
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {closedMonths.length > 0 ? (
                                            closedMonths.map(
                                                (closure, index) => (
                                                    <tr
                                                        key={
                                                            closure.id ||
                                                            getMonthValue(
                                                                closure
                                                            ) ||
                                                            index
                                                        }
                                                        className="border-b border-gray-100 text-sm last:border-b-0"
                                                    >
                                                        <td className="whitespace-nowrap px-5 py-4 font-medium text-gray-950 sm:px-6">
                                                            {formatMonth(
                                                                getMonthValue(
                                                                    closure
                                                                )
                                                            )}
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                                            {formatDateTime(
                                                                closure.closed_at ||
                                                                    closure.created_at
                                                            )}
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4 text-right text-gray-900">
                                                            {formatMoney(
                                                                closure.income_amount ??
                                                                    closure.income ??
                                                                    0,
                                                                closure.currency ||
                                                                    summary.currency
                                                            )}
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4 text-right text-gray-900">
                                                            {formatMoney(
                                                                closure.cost_amount ??
                                                                    closure.costs ??
                                                                    0,
                                                                closure.currency ||
                                                                    summary.currency
                                                            )}
                                                        </td>

                                                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-950 sm:px-6">
                                                            {formatMoney(
                                                                closure.net_amount ??
                                                                    closure.net_at_close ??
                                                                    0,
                                                                closure.currency ||
                                                                    summary.currency
                                                            )}
                                                        </td>
                                                    </tr>
                                                )
                                            )
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="5"
                                                    className="px-6 py-20 text-center"
                                                >
                                                    <LockKeyhole
                                                        size={40}
                                                        className="mx-auto text-gray-400"
                                                    />

                                                    <h3 className="mt-4 font-semibold text-gray-900">
                                                        No month has been
                                                        closed
                                                    </h3>

                                                    <p className="mx-auto mt-1 max-w-xl text-sm text-gray-500">
                                                        Closing a month
                                                        stores its final
                                                        figures so later
                                                        payments or corrected
                                                        expenses do not change
                                                        that report.
                                                    </p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {confirmModalOpen && (
                <CloseMonthModal
                    month={selectedMonth}
                    loading={closing}
                    onCancel={() => {
                        if (!closing) {
                            setConfirmModalOpen(false);
                        }
                    }}
                    onConfirm={handleCloseMonth}
                />
            )}
        </>
    );
};

const TaxSummaryCard = ({
    label,
    value,
    currency,
    icon: Icon,
}) => {
    return (
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm text-gray-600">
                        {label}
                    </p>

                    <h3 className="mt-3 text-2xl font-semibold text-gray-950">
                        {value}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                        {currency}
                    </p>
                </div>

                <Icon
                    size={21}
                    className="text-gray-500"
                />
            </div>
        </div>
    );
};

const CloseMonthModal = ({
    month,
    loading,
    onCancel,
    onConfirm,
}) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "Escape" && !loading) {
                onCancel();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

            document.body.style.overflow = "";
        };
    }, [loading, onCancel]);

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !loading
                ) {
                    onCancel();
                }
            }}
        >
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="h-1 bg-blue-600" />

                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="absolute right-4 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:cursor-not-allowed"
                >
                    <X size={20} />
                </button>

                <div className="px-6 pb-5 pt-7">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        <LockKeyhole size={27} />
                    </div>

                    <h2 className="mt-5 text-xl font-semibold text-gray-950">
                        Close {formatMonth(month)}?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                        This will store the month&apos;s current finance
                        totals as a closed accounting period. Check all
                        payments, refunds and expenses before continuing.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3 border-t border-gray-200 bg-gray-50 px-6 py-5">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={loading}
                        className="h-11 rounded-xl border border-gray-300 bg-white text-sm font-semibold text-gray-800 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={loading}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading && (
                            <LoaderCircle
                                size={17}
                                className="animate-spin"
                            />
                        )}

                        Close month
                    </button>
                </div>
            </div>
        </div>
    );
};

const getMonthValue = (closure) => {
    const monthValue =
        closure?.month ||
        closure?.period_month ||
        closure?.month_key;

    if (monthValue) {
        return String(monthValue).slice(0, 7);
    }

    if (closure?.period_start) {
        return String(closure.period_start).slice(0, 7);
    }

    return "";
};

const formatMonth = (month) => {
    if (!month) {
        return "Selected month";
    }

    const [year, monthNumber] = month.split("-");

    const date = new Date(
        Number(year),
        Number(monthNumber) - 1,
        1
    );

    return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
    });
};

const getDownloadFileName = (
    contentDisposition,
    fallbackName
) => {
    if (!contentDisposition) {
        return fallbackName;
    }

    const utfMatch = contentDisposition.match(
        /filename\*=UTF-8''([^;]+)/
    );

    if (utfMatch?.[1]) {
        return decodeURIComponent(utfMatch[1]);
    }

    const regularMatch = contentDisposition.match(
        /filename="?([^"]+)"?/
    );

    return regularMatch?.[1] || fallbackName;
};

export default AdminFinanceReports;