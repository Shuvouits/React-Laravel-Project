import { useNavigate } from "react-router-dom";
import {
    Bell,
    Calculator,
    Camera,
    ChevronDown,
    Globe2,
    Grid2X2,
    Keyboard,
    Maximize,
    ScanLine,
    Search,
    Settings,
    UserRound,
} from "lucide-react";

const PosHeader = ({ search, setSearch }) => {
    const navigate = useNavigate();

    const handleBrowseWebsite = () => {
        window.open("/", "_blank", "noopener,noreferrer");
    };

    return (
        <header className="border-b border-[#e7e8eb] bg-[#f7f7f8]">
            {/* TOP POS HEADER */}
            <div className="grid min-h-[72px] grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-[#eceef1] bg-white px-4 sm:px-6">
                {/* BRAND + SHORTCUT */}
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-[#387cff] bg-[#edf4ff] text-[19px] font-bold text-[#2878e8]">
                            S
                        </div>

                        <span className="text-[22px] font-semibold tracking-[-0.7px] text-[#2878e8]">
                            Storify
                        </span>
                    </div>

                    <button
                        type="button"
                        aria-label="Keyboard shortcuts"
                        className="hidden h-10 items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 text-[#737985] transition hover:bg-[#f2f4f7] sm:flex"
                    >
                        <Search size={16} />
                        <Keyboard size={15} />
                        <span className="text-[11px] font-medium">⌘K</span>
                    </button>
                </div>

                {/* CENTER ACTIONS */}
                <div className="flex items-center justify-center gap-2">
                    <button
                        type="button"
                        onClick={() => navigate("/admin/dashboard")}
                        className="flex h-10 items-center gap-2 rounded-full border border-[#e2e5e9] bg-[#fbfbfc] px-4 text-[13px] font-semibold text-[#1f2329] shadow-sm transition hover:bg-[#f2f4f7]"
                    >
                        <Grid2X2 size={16} />
                        <span className="hidden sm:inline">
                            Back to Dashboard
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={handleBrowseWebsite}
                        className="flex h-10 items-center gap-2 rounded-full border border-[#e2e5e9] bg-[#fbfbfc] px-4 text-[13px] font-semibold text-[#1f2329] shadow-sm transition hover:bg-[#f2f4f7]"
                    >
                        <Globe2 size={16} />
                        <span className="hidden sm:inline">
                            Browse Website
                        </span>
                    </button>
                </div>

                {/* RIGHT ACTIONS */}
                <div className="flex items-center justify-end gap-2">
                    <button
                        type="button"
                        aria-label="Change language"
                        className="flex h-10 w-10 items-center justify-center rounded-full text-[18px] transition hover:bg-[#f4f5f7]"
                    >
                        🇺🇸
                    </button>

                    <button
                        type="button"
                        aria-label="Notifications"
                        className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#5d6470] transition hover:bg-[#f4f5f7]"
                    >
                        <Bell size={18} />

                        <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff3b5f] px-1 text-[9px] font-bold text-white">
                            9+
                        </span>
                    </button>

                    <button
                        type="button"
                        aria-label="Settings"
                        className="hidden h-10 w-10 items-center justify-center rounded-full text-[#5d6470] transition hover:bg-[#f4f5f7] sm:flex"
                    >
                        <Settings size={18} />
                    </button>

                    <button
                        type="button"
                        aria-label="Profile"
                        className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-[#e2e5e9] bg-[#f2f4f7] text-[#596170] transition hover:bg-[#e9edf2]"
                    >
                        <UserRound size={18} />
                    </button>
                </div>
            </div>

            {/* POS SEARCH / ACTION BAR */}
            <div className="p-3">
                <div className="flex items-center gap-3 rounded-[24px] border border-[#e2e5e9] bg-white px-3 py-2 shadow-[0_2px_8px_rgba(15,23,42,0.06)]">
                    {/* BRANCH */}
                    <button
                        type="button"
                        className="flex h-11 shrink-0 items-center gap-2 rounded-full border border-[#a9cef9] bg-[#f5f9ff] px-4 text-[13px] font-semibold text-[#1f2937]"
                    >
                        <span className="h-2.5 w-2.5 rounded-full bg-[#2878e8]" />
                        <span>Main Branch</span>
                        <ChevronDown
                            size={15}
                            className="text-[#68707d]"
                        />
                    </button>

                    {/* PRODUCT SEARCH */}
                    <div className="relative min-w-0 flex-1">
                        <Search
                            size={18}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa0aa]"
                        />

                        <input
                            type="text"
                            value={search}
                            onChange={(event) =>
                                setSearch(event.target.value)
                            }
                            placeholder="Search products by name / SKU..."
                            className="h-11 w-full rounded-full border border-[#e0e4e9] bg-white pl-11 pr-4 text-[13px] text-[#20242c] outline-none transition placeholder:text-[#9ca3af] focus:border-[#2878e8] focus:ring-2 focus:ring-[#2878e8]/10"
                        />
                    </div>

                    {/* BARCODE */}
                    <div className="relative hidden w-[250px] shrink-0 xl:block">
                        <ScanLine
                            size={17}
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9aa0aa]"
                        />

                        <input
                            type="text"
                            placeholder="Scan SKU or barcode..."
                            className="h-11 w-full rounded-full border border-[#e0e4e9] bg-white pl-11 pr-12 text-[13px] text-[#20242c] outline-none placeholder:text-[#9ca3af]"
                        />

                        <span className="absolute right-3 top-1/2 flex h-7 -translate-y-1/2 items-center rounded-md bg-[#f3f4f6] px-2 text-[10px] font-semibold text-[#737985]">
                            F8
                        </span>
                    </div>

                    {/* CAMERA */}
                    <button
                        type="button"
                        title="Camera scanner"
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e0e4e9] bg-white text-[#555b66] transition hover:bg-[#f6f7f9]"
                    >
                        <Camera size={18} />
                    </button>

                    {/* CALCULATOR */}
                    <button
                        type="button"
                        title="Calculator"
                        className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e0e4e9] bg-white text-[#555b66] transition hover:bg-[#f6f7f9] lg:flex"
                    >
                        <Calculator size={18} />
                    </button>

                    {/* FULLSCREEN */}
                    <button
                        type="button"
                        title="Fullscreen POS"
                        className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#e0e4e9] bg-white text-[#555b66] transition hover:bg-[#f6f7f9] lg:flex"
                    >
                        <Maximize size={18} />
                    </button>

                    {/* SCAN STATUS */}
                    <button
                        type="button"
                        className="hidden h-11 shrink-0 items-center gap-2 rounded-full border border-[#9fe8d5] bg-[#edfff9] px-4 text-[12px] font-semibold text-[#009b78] md:flex"
                    >
                        <span className="h-2.5 w-2.5 rounded-full bg-[#16c79a]" />
                        Ready to scan
                    </button>

                    {/* STOCK FILTER */}
                    <button
                        type="button"
                        className="hidden h-11 w-[150px] shrink-0 items-center justify-between rounded-full border border-[#e0e4e9] bg-white px-4 text-[13px] font-medium text-[#343841] xl:flex"
                    >
                        <span>All stock</span>
                        <ChevronDown
                            size={15}
                            className="text-[#777d87]"
                        />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default PosHeader;