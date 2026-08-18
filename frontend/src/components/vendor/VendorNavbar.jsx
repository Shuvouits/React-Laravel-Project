import {
    Bell,
    Globe,
    Menu,
    Moon,
    ShoppingCart,
    Store,
    Sun,
} from "lucide-react";

const VendorNavbar = () => {
    return (
        <header className="relative z-50 flex h-[74px] items-center justify-between border-b border-[#e8e8ee] bg-white px-6">
            <div className="flex items-center gap-4">
                <button
                    type="button"
                    className="flex h-[32px] w-[32px] items-center justify-center rounded-[9px] text-[#444444] transition hover:bg-[#f7f7f8]"
                >
                    <Menu
                        size={18}
                        strokeWidth={1.8}
                    />
                </button>

                <div className="flex items-center gap-2">
                    <Store
                        size={20}
                        strokeWidth={1.8}
                        className="text-[#2563eb]"
                    />

                    <span className="text-[18px] font-semibold text-[#222222]">
                        Storify Vendor Store
                    </span>
                </div>
            </div>

            <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-3">
                <button
                    type="button"
                    className="flex h-[36px] items-center gap-2 rounded-full border border-[#dbe5fb] bg-[#f4f8ff] px-4 text-[14px] font-medium text-[#2f6bdb]"
                >
                    <ShoppingCart
                        size={16}
                        strokeWidth={1.8}
                    />

                    POS
                </button>

                <button
                    type="button"
                    className="flex h-[36px] items-center gap-2 rounded-full border border-[#e6e8ef] bg-white px-4 text-[14px] font-medium text-[#222222] transition hover:bg-[#f8f8f8]"
                >
                    <Globe
                        size={16}
                        strokeWidth={1.8}
                    />

                    Browse Website
                </button>
            </div>

            <div className="flex items-center gap-4">
                <img
                    src="https://flagcdn.com/us.svg"
                    alt="US Flag"
                    className="h-[16px] w-[22px] rounded-[2px] object-cover"
                />

                <button
                    type="button"
                    className="relative text-[#666666] transition hover:text-[#111111]"
                >
                    <Bell
                        size={19}
                        strokeWidth={1.8}
                    />

                    <span className="absolute -right-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#ff4d4f] px-1 text-[10px] font-semibold text-white">
                        9+
                    </span>
                </button>

                <button
                    type="button"
                    className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-[#555555] transition hover:bg-[#f6f6f6]"
                >
                    <Sun
                        size={18}
                        strokeWidth={1.8}
                    />
                </button>

                <button
                    type="button"
                    className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[#e5e9f5] bg-[#eef4ff] text-[#2563eb]"
                >
                    <Moon
                        size={17}
                        strokeWidth={2}
                    />
                </button>
            </div>
        </header>
    );
};

export default VendorNavbar;