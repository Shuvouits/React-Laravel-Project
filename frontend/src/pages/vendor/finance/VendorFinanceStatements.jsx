import {
    ChevronLeft,
    ChevronRight,
    Download,
    LoaderCircle,
    ReceiptText,
} from "lucide-react";

import {
    useEffect,
    useState,
} from "react";

import api from "../../../api/axios";

const VendorFinanceStatements = () => {
    const [entries, setEntries] = useState([]);

    const [pagination, setPagination] = useState({
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
        from: 0,
        to: 0,
    });

    const [range, setRange] = useState("30_days");
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchStatements(1);
    }, [range]);

    const fetchStatements = async (page = 1) => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(
                "/vendor/finance/statements",
                {
                    params: {
                        range,
                        page,
                        per_page: 20,
                    },
                }
            );

            const statementResponse =
                response.data?.entries || {};

            setEntries(
                statementResponse.data || []
            );

            setPagination({
                current_page:
                    statementResponse.current_page || 1,

                last_page:
                    statementResponse.last_page || 1,

                per_page:
                    statementResponse.per_page || 20,

                total:
                    statementResponse.total || 0,

                from:
                    statementResponse.from || 0,

                to:
                    statementResponse.to || 0,
            });
        } catch (error) {
            console.error(
                "Finance statements error:",
                error.response?.data ||
                error.message
            );

            setError(
                error.response?.data?.message ||
                "Statements load করা সম্ভব হয়নি।"
            );

            setEntries([]);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page) => {
        if (
            page < 1 ||
            page > pagination.last_page
        ) {
            return;
        }

        fetchStatements(page);
    };

    const handleDownload = async () => {
        try {
            setDownloading(true);

            const response = await api.get(
                "/vendor/finance/statements",
                {
                    params: {
                        range,
                        page: 1,
                        per_page: 100,
                    },
                }
            );

            const statementEntries =
                response.data?.entries?.data || [];

            if (statementEntries.length === 0) {
                window.alert(
                    "Download করার মতো কোনো statement পাওয়া যায়নি।"
                );

                return;
            }

            const csvRows = [
                [
                    "Date",
                    "Type",
                    "Reference",
                    "Held for you",
                    "You owe",
                    "Currency",
                    "Description",
                ],
            ];

            statementEntries.forEach((entry) => {
                csvRows.push([
                    formatCsvDate(
                        entry.occurred_at
                    ),
                    formatType(entry.type),
                    entry.reference || "",
                    entry.held_amount || 0,
                    entry.owed_amount || 0,
                    entry.currency || "USD",
                    entry.description || "",
                ]);
            });

            const csvContent = csvRows
                .map((row) =>
                    row
                        .map(escapeCsvValue)
                        .join(",")
                )
                .join("\n");

            const blob = new Blob(
                [csvContent],
                {
                    type:
                        "text/csv;charset=utf-8;",
                }
            );

            const url =
                window.URL.createObjectURL(
                    blob
                );

            const link =
                document.createElement("a");

            link.href = url;
            link.download =
                `finance-statements-${range}.csv`;

            document.body.appendChild(link);
            link.click();
            link.remove();

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(
                "Statement download error:",
                error.response?.data ||
                error.message
            );

            window.alert(
                "Statement download করা সম্ভব হয়নি।"
            );
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f7f7f8] p-[28px]">
            <div className="mx-auto max-w-[1600px]">
                <div className="flex items-end justify-between gap-[20px]">
                    <div>
                        <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[#111111]">
                            Statements
                        </h1>

                        <p className="mt-[4px] text-[14px] text-[#6f6f6f]">
                            Every sale, refund and payout that moved your balance.
                        </p>
                    </div>

                    <div className="flex items-center gap-[10px]">
                        <button
                            type="button"
                            disabled={downloading}
                            onClick={handleDownload}
                            className="flex h-[42px] items-center gap-[8px] rounded-[12px] border border-[#dedede] bg-white px-[17px] text-[14px] font-medium text-[#171717] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {downloading ? (
                                <LoaderCircle
                                    size={17}
                                    className="animate-spin"
                                />
                            ) : (
                                <Download size={17} />
                            )}

                            Download
                        </button>

                        <select
                            value={range}
                            onChange={(event) =>
                                setRange(
                                    event.target.value
                                )
                            }
                            className="h-[42px] min-w-[180px] rounded-[12px] border border-[#dedede] bg-white px-[15px] text-[14px] text-[#222222] outline-none focus:border-[#2563eb]"
                        >
                            <option value="7_days">
                                Last 7 days
                            </option>

                            <option value="30_days">
                                Last 30 days
                            </option>

                            <option value="90_days">
                                Last 90 days
                            </option>

                            <option value="year">
                                This year
                            </option>

                            <option value="all">
                                All time
                            </option>
                        </select>
                    </div>
                </div>

                {error && (
                    <div className="mt-[16px] rounded-[12px] border border-red-200 bg-red-50 px-[16px] py-[12px] text-[13px] text-red-600">
                        {error}
                    </div>
                )}

                <section className="mt-[22px] rounded-[16px] border border-[#dedede] bg-white p-[16px] shadow-sm">
                    <div className="overflow-hidden rounded-[14px] border border-[#dedede]">
                        <div className="grid grid-cols-[220px_275px_minmax(240px,1fr)_230px_230px] border-b border-[#dedede] bg-[#fcfcfc] px-[18px] py-[14px] text-[13px] font-semibold text-[#222222]">
                            <span>Date</span>
                            <span>Type</span>
                            <span>Reference</span>
                            <span className="text-right">
                                Held for you
                            </span>
                            <span className="text-right">
                                You owe
                            </span>
                        </div>

                        {loading ? (
                            <LoadingState />
                        ) : entries.length === 0 ? (
                            <EmptyState />
                        ) : (
                            entries.map((entry) => (
                                <StatementRow
                                    key={entry.id}
                                    entry={entry}
                                />
                            ))
                        )}
                    </div>

                    {!loading &&
                        pagination.total > 0 && (
                            <Pagination
                                pagination={
                                    pagination
                                }
                                onPageChange={
                                    handlePageChange
                                }
                            />
                        )}
                </section>
            </div>
        </div>
    );
};

const StatementRow = ({
    entry,
}) => {
    const heldAmount = Number(
        entry.held_amount || 0
    );

    const owedAmount = Number(
        entry.owed_amount || 0
    );

    const currency =
        entry.currency || "USD";

    return (
        <div className="grid min-h-[54px] grid-cols-[220px_275px_minmax(240px,1fr)_230px_230px] items-center border-b border-[#e7e7e7] px-[18px] text-[13px] last:border-b-0 hover:bg-[#fafafa]">
            <span className="text-[#222222]">
                {formatDate(
                    entry.occurred_at
                )}
            </span>

            <div>
                <TypeBadge
                    type={entry.type}
                />
            </div>

            <span className="truncate pr-[15px] text-[#707070]">
                {entry.reference || "—"}
            </span>

            <span
                className={`text-right font-medium ${
                    heldAmount < 0
                        ? "text-red-600"
                        : heldAmount > 0
                            ? "text-[#111111]"
                            : "text-[#777777]"
                }`}
            >
                {heldAmount !== 0
                    ? formatSignedMoney(
                          heldAmount,
                          currency
                      )
                    : "—"}
            </span>

            <span
                className={`text-right font-medium ${
                    owedAmount < 0
                        ? "text-green-600"
                        : owedAmount > 0
                            ? "text-[#e66d00]"
                            : "text-[#777777]"
                }`}
            >
                {owedAmount !== 0
                    ? formatSignedMoney(
                          owedAmount,
                          currency
                      )
                    : "—"}
            </span>
        </div>
    );
};

const TypeBadge = ({
    type,
}) => {
    const styles = {
        sale:
            "bg-[#dcfce7] text-[#08783e]",

        refund:
            "bg-[#fee2e2] text-[#c92525]",

        commission:
            "bg-[#edf2f8] text-[#334155]",

        commission_refund:
            "bg-[#f3e8ff] text-[#7e22ce]",

        payout:
            "bg-[#dbeafe] text-[#1d4ed8]",

        adjustment:
            "bg-[#fff3cd] text-[#946200]",
    };

    return (
        <span
            className={`inline-flex rounded-full px-[10px] py-[4px] text-[11px] font-medium ${
                styles[type] ||
                styles.adjustment
            }`}
        >
            {formatType(type)}
        </span>
    );
};

const LoadingState = () => {
    return (
        <div className="flex min-h-[250px] flex-col items-center justify-center">
            <LoaderCircle
                size={28}
                className="animate-spin text-[#2467d5]"
            />

            <p className="mt-[10px] text-[13px] text-[#777777]">
                Loading statements...
            </p>
        </div>
    );
};

const EmptyState = () => {
    return (
        <div className="flex min-h-[250px] flex-col items-center justify-center px-[20px] text-center">
            <ReceiptText
                size={34}
                strokeWidth={1.5}
                className="text-[#929292]"
            />

            <p className="mt-[12px] text-[14px] font-medium text-[#555555]">
                No statements found
            </p>

            <p className="mt-[4px] text-[12px] text-[#888888]">
                Paid sales, refunds, commissions and payouts will appear here.
            </p>
        </div>
    );
};

const Pagination = ({
    pagination,
    onPageChange,
}) => {
    return (
        <div className="mt-[18px] flex items-center justify-between px-[4px]">
            <p className="text-[13px] text-[#686868]">
                Showing {pagination.from || 0} to{" "}
                {pagination.to || 0} of{" "}
                {pagination.total || 0} results
            </p>

            <div className="flex items-center gap-[8px]">
                <button
                    type="button"
                    disabled={
                        pagination.current_page <= 1
                    }
                    onClick={() =>
                        onPageChange(
                            pagination.current_page - 1
                        )
                    }
                    className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#dedede] bg-white text-[#696969] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronLeft size={17} />
                </button>

                <span className="flex h-[36px] min-w-[36px] items-center justify-center rounded-full bg-[#2467d5] px-[10px] text-[13px] font-semibold text-white">
                    {pagination.current_page}
                </span>

                <button
                    type="button"
                    disabled={
                        pagination.current_page >=
                        pagination.last_page
                    }
                    onClick={() =>
                        onPageChange(
                            pagination.current_page + 1
                        )
                    }
                    className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#dedede] bg-white text-[#696969] transition hover:bg-[#f7f7f7] disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <ChevronRight size={17} />
                </button>
            </div>
        </div>
    );
};

const formatType = (type) => {
    const labels = {
        sale: "Sale",
        refund: "Refund",
        commission: "Commission",
        commission_refund:
            "Commission refund",
        payout: "Payout",
        adjustment: "Adjustment",
    };

    return labels[type] || type || "Unknown";
};

const formatMoney = (
    value,
    currency = "USD"
) => {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency,
        }
    ).format(
        Number(value || 0)
    );
};

const formatSignedMoney = (
    value,
    currency
) => {
    const amount = Number(value || 0);

    if (amount < 0) {
        return `-${formatMoney(
            Math.abs(amount),
            currency
        )}`;
    }

    return formatMoney(
        amount,
        currency
    );
};

const formatDate = (value) => {
    if (!value) {
        return "—";
    }

    return new Date(value)
        .toLocaleDateString(
            "en-US",
            {
                month: "short",
                day: "numeric",
                year: "numeric",
            }
        );
};

const formatCsvDate = (value) => {
    if (!value) {
        return "";
    }

    return new Date(value)
        .toISOString()
        .slice(0, 10);
};

const escapeCsvValue = (value) => {
    const text = String(
        value ?? ""
    );

    return `"${text.replaceAll(
        '"',
        '""'
    )}"`;
};

export default VendorFinanceStatements;