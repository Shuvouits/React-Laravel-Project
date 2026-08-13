import { useEffect, useRef, useState } from "react";
import {
    ChevronLeft,
    ChevronRight,
    Heart,
    Star,
} from "lucide-react";

import api from "../../api/axios";

const TopVendors = ({ section }) => {
    const sliderRef = useRef(null);

    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);

    const title = section?.title || "Top Vendors";
    const maxVendors = Number(section?.settings?.max_vendors || 8);

    useEffect(() => {
        fetchVendors();
    }, [maxVendors]);

    // Fetch vendors
    const fetchVendors = async () => {
        try {
            setLoading(true);

            const response = await api.get("/top-vendors", {
                params: {
                    limit: maxVendors,
                },
            });

            setVendors(response.data?.vendors || []);
        } catch (error) {
            console.error("Unable to load top vendors.", error);
            setVendors([]);
        } finally {
            setLoading(false);
        }
    };

    // Scroll slider
    const scrollSlider = (direction) => {
        if (!sliderRef.current) {
            return;
        }

        const scrollAmount = 370;

        sliderRef.current.scrollBy({
            left: direction === "next" ? scrollAmount : -scrollAmount,
            behavior: "smooth",
        });
    };

    if (loading) {
        return <TopVendorsLoading title={title} />;
    }

    if (vendors.length === 0) {
        return null;
    }

    return (
        <section className="bg-white py-[42px] font-['Inter']">
            <div className="mx-auto max-w-[1500px] px-[24px]">

                {/* Header */}
                <div className="mb-[32px] flex items-center justify-between">
                    <h2 className="text-[28px] font-semibold tracking-[-0.5px] text-[#111]">
                        {title}
                    </h2>

                    <div className="flex items-center gap-[10px]">
                        <button
                            type="button"
                            onClick={() => scrollSlider("prev")}
                            className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#e4e4e4] bg-white text-[#222] transition hover:bg-[#f7f7f7]"
                        >
                            <ChevronLeft size={19} />
                        </button>

                        <button
                            type="button"
                            onClick={() => scrollSlider("next")}
                            className="flex h-[42px] w-[42px] items-center justify-center rounded-full border border-[#e4e4e4] bg-white text-[#222] transition hover:bg-[#f7f7f7]"
                        >
                            <ChevronRight size={19} />
                        </button>
                    </div>
                </div>

                {/* Vendors */}
                <div
                    ref={sliderRef}
                    className="flex gap-[22px] overflow-x-auto scroll-smooth pb-[4px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {vendors.map((vendor) => (
                        <VendorCard
                            key={vendor.id}
                            vendor={vendor}
                        />
                    ))}
                </div>

            </div>
        </section>
    );
};

// Vendor card
const VendorCard = ({ vendor }) => {
    const banner = getImageUrl(vendor.banner);
    const logo = getImageUrl(vendor.logo);
    const initial = vendor.store_name?.charAt(0)?.toUpperCase() || "V";

    const description = vendor.description || "Visit this store to explore available products.";

    return (
        <div className="w-[345px] shrink-0 rounded-[24px] border border-[#e1e1e1] bg-white p-[13px]">

            {/* Banner */}
            <div className="relative h-[150px] overflow-hidden rounded-[20px] bg-[#f4f4f4]">
                {banner && (
                    <img
                        src={banner}
                        alt={`${vendor.store_name} banner`}
                        className="h-full w-full object-cover"
                    />
                )}
            </div>

            {/* Logo */}
            <div className="relative -mt-[27px] ml-[4px]">
                {logo ? (
                    <img
                        src={logo}
                        alt={vendor.store_name}
                        className="h-[56px] w-[56px] rounded-full border-[4px] border-white bg-white object-cover"
                    />
                ) : (
                    <div className="flex h-[56px] w-[56px] items-center justify-center rounded-full border-[4px] border-white bg-[#111] text-[17px] font-semibold text-white">
                        {initial}
                    </div>
                )}
            </div>

            {/* Store */}
            <div className="mt-[8px] flex items-start justify-between gap-[15px] px-[5px]">
                <div className="min-w-0">
                    <h3 className="truncate text-[18px] font-semibold text-[#171717]">
                        {vendor.store_name}
                    </h3>

                    <p className="mt-[3px] truncate text-[13px] text-[#777]">
                        {description}
                    </p>
                </div>

                <button
                    type="button"
                    className="flex h-[37px] w-[37px] shrink-0 items-center justify-center rounded-full border border-[#dedede] text-[#555] transition hover:border-[#222] hover:text-[#111]"
                >
                    <Heart size={18} />
                </button>
            </div>

            {/* Stats */}
            <div className="mt-[20px] grid grid-cols-3 rounded-[20px] bg-[#fafafa] px-[10px] py-[14px]">

                <VendorStat
                    icon={<Star size={15} fill="#f7b500" className="text-[#f7b500]" />}
                    value={Number(vendor.rating || 0).toFixed(1)}
                    label="Rating"
                />

                <VendorStat
                    value={Number(vendor.sold || 0)}
                    label="Sold"
                    border
                />

                <VendorStat
                    value="$$$"
                    label="Price"
                    border
                />

            </div>

            {/* Shop */}
            <a
                href={`/shop/${vendor.slug}`}
                className="mt-[18px] flex h-[50px] items-center justify-center rounded-full bg-[#171717] text-[15px] font-semibold text-white transition hover:bg-black"
            >
                Go to Shop
            </a>

        </div>
    );
};

// Vendor stat
const VendorStat = ({ icon, value, label, border = false }) => {
    return (
        <div className={`flex flex-col items-center justify-center ${border ? "border-l border-[#dedede]" : ""}`}>
            <div className="flex items-center gap-[4px] text-[15px] font-semibold text-[#222]">
                {icon}
                {value}
            </div>

            <span className="mt-[4px] text-[10px] uppercase tracking-[0.04em] text-[#888]">
                {label}
            </span>
        </div>
    );
};

// Loading
const TopVendorsLoading = ({ title }) => {
    return (
        <section className="bg-white py-[42px] font-['Inter']">
            <div className="mx-auto max-w-[1500px] px-[24px]">
                <h2 className="text-[28px] font-semibold text-[#111]">
                    {title}
                </h2>

                <div className="mt-[32px] flex gap-[22px] overflow-hidden">
                    {[1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="h-[420px] w-[345px] shrink-0 animate-pulse rounded-[24px] bg-[#f3f3f3]"
                        />
                    ))}
                </div>
            </div>
        </section>
    );
};

// Image URL
const getImageUrl = (path) => {
    if (!path) {
        return "";
    }

    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }

    const apiBase = api.defaults.baseURL || "";
    const backendBase = apiBase.replace(/\/api\/?$/, "");

    return `${backendBase}/${path.replace(/^\/+/, "")}`;
};

export default TopVendors;