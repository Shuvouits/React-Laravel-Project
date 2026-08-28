import {
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    ArrowUpRight,
} from "lucide-react";

import {
    Link,
} from "react-router-dom";

import api from "../../api/axios";

const DEFAULT_SETTINGS = {
    title: "Start Selling With Us Today",
    subtitle:
        "Join our marketplace, manage products easily, accept secure payments, and grow your business faster.",
    button_label: "Become a Vendor",
    button_link: "/become-vendor",
    image_url: "",
    image_alt: "Start selling with us",
};

const BecomeVendorSection = () => {
    const [section, setSection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [imageFailed, setImageFailed] = useState(false);

    useEffect(() => {
        let mounted = true;

        const fetchSection = async () => {
            try {
                const response = await api.get(
                    "/home/sections"
                );

                const sections =
                    response.data?.sections || [];

                const becomeVendorSection =
                    sections.find(
                        (item) =>
                            item.section_key ===
                            "become_a_vendor"
                    ) || null;

                if (mounted) {
                    setSection(becomeVendorSection);
                }
            } catch (error) {
                console.error(
                    "Failed to load Become a Vendor section:",
                    error
                );

                if (mounted) {
                    setSection(null);
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        fetchSection();

        return () => {
            mounted = false;
        };
    }, []);

    const settings = useMemo(() => {
        return {
            ...DEFAULT_SETTINGS,
            ...(section?.settings || {}),
        };
    }, [section]);

    const isActive =
        section?.is_active === true ||
        section?.is_active === 1 ||
        section?.is_active === "1";

    const imageUrl =
        settings.image_url ||
        settings.saved_image_url ||
        "";

    const buttonLink =
        settings.button_link ||
        "/become-vendor";

    const isExternalLink =
        buttonLink.startsWith("http://") ||
        buttonLink.startsWith("https://");

    const buttonContent = (
        <>
            <span>
                {settings.button_label ||
                    "Become a Vendor"}
            </span>

            <span
                className="
                    flex
                    h-8
                    w-8
                    items-center
                    justify-center
                    rounded-full
                    bg-white/15
                    transition-transform
                    duration-300
                    group-hover:translate-x-0.5
                    group-hover:-translate-y-0.5
                "
            >
                <ArrowUpRight
                    size={16}
                    strokeWidth={2}
                />
            </span>
        </>
    );

    if (
        loading ||
        !section ||
        !isActive
    ) {
        return null;
    }

    return (
        <section
            className="
                bg-white
                px-4
                py-10
                sm:px-6
                sm:py-12
                lg:px-8
                lg:py-16
            "
        >
            <div
                className="
                    mx-auto
                    max-w-[1440px]
                    overflow-hidden
                    rounded-[26px]
                    border
                    border-[#dce7ff]
                    bg-[#eef4ff]
                    shadow-[0_18px_60px_rgba(20,67,153,0.08)]
                "
            >
                <div
                    className={`
                        grid
                        min-h-[430px]
                        items-stretch
                        ${
                            imageUrl && !imageFailed
                                ? "lg:grid-cols-[0.78fr_1.22fr]"
                                : "lg:grid-cols-1"
                        }
                    `}
                >
                    {/* Content */}
                    <div
                        className="
                            relative
                            z-10
                            flex
                            flex-col
                            items-start
                            justify-center
                            px-6
                            py-12
                            sm:px-10
                            sm:py-14
                            lg:px-14
                            lg:py-16
                            xl:px-[72px]
                        "
                    >
                        <span
                            className="
                                mb-5
                                inline-flex
                                items-center
                                rounded-full
                                border
                                border-[#c6d8ff]
                                bg-white/75
                                px-4
                                py-2
                                text-[12px]
                                font-semibold
                                uppercase
                                tracking-[0.1em]
                                text-[#1769ff]
                            "
                        >
                            Sell with Storify
                        </span>

                        <h2
                            className="
                                max-w-[560px]
                                text-[32px]
                                font-semibold
                                leading-[1.12]
                                tracking-[-0.035em]
                                text-[#111827]
                                sm:text-[40px]
                                lg:text-[46px]
                            "
                        >
                            {settings.title}
                        </h2>

                        {settings.subtitle && (
                            <p
                                className="
                                    mt-5
                                    max-w-[590px]
                                    text-[15px]
                                    leading-7
                                    text-[#5f6673]
                                    sm:text-[16px]
                                "
                            >
                                {settings.subtitle}
                            </p>
                        )}

                        <div className="mt-8">
                            {isExternalLink ? (
                                <a
                                    href={buttonLink}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="
                                        group
                                        inline-flex
                                        min-h-[52px]
                                        items-center
                                        justify-center
                                        gap-3
                                        rounded-full
                                        bg-[#1769ff]
                                        px-6
                                        py-3
                                        text-[14px]
                                        font-semibold
                                        text-white
                                        shadow-[0_10px_30px_rgba(23,105,255,0.25)]
                                        transition-all
                                        duration-300
                                        hover:-translate-y-0.5
                                        hover:bg-[#0f5bea]
                                        hover:shadow-[0_14px_34px_rgba(23,105,255,0.32)]
                                    "
                                >
                                    {buttonContent}
                                </a>
                            ) : (
                                <Link
                                    to={buttonLink}
                                    className="
                                        group
                                        inline-flex
                                        min-h-[52px]
                                        items-center
                                        justify-center
                                        gap-3
                                        rounded-full
                                        bg-[#1769ff]
                                        px-6
                                        py-3
                                        text-[14px]
                                        font-semibold
                                        text-white
                                        shadow-[0_10px_30px_rgba(23,105,255,0.25)]
                                        transition-all
                                        duration-300
                                        hover:-translate-y-0.5
                                        hover:bg-[#0f5bea]
                                        hover:shadow-[0_14px_34px_rgba(23,105,255,0.32)]
                                    "
                                >
                                    {buttonContent}
                                </Link>
                            )}
                        </div>

                        {/* Decorations */}
                        <div
                            className="
                                pointer-events-none
                                absolute
                                -bottom-24
                                -left-20
                                h-56
                                w-56
                                rounded-full
                                bg-[#cfe0ff]/70
                                blur-3xl
                            "
                        />

                        <div
                            className="
                                pointer-events-none
                                absolute
                                -right-12
                                -top-16
                                h-48
                                w-48
                                rounded-full
                                bg-white/70
                                blur-3xl
                            "
                        />
                    </div>

                    {/* Image */}
                    {imageUrl && !imageFailed && (
                        <div
                            className="
                                relative
                                min-h-[310px]
                                overflow-hidden
                                sm:min-h-[380px]
                                lg:min-h-[430px]
                            "
                        >
                            <img
                                src={imageUrl}
                                alt={
                                    settings.image_alt ||
                                    settings.title ||
                                    "Become a vendor"
                                }
                                onError={() =>
                                    setImageFailed(true)
                                }
                                className="
                                    absolute
                                    inset-0
                                    h-full
                                    w-full
                                    object-cover
                                    object-center
                                "
                            />

                            <div
                                className="
                                    pointer-events-none
                                    absolute
                                    inset-y-0
                                    left-0
                                    hidden
                                    w-28
                                    bg-gradient-to-r
                                    from-[#eef4ff]
                                    to-transparent
                                    lg:block
                                "
                            />

                            <div
                                className="
                                    pointer-events-none
                                    absolute
                                    inset-x-0
                                    bottom-0
                                    h-20
                                    bg-gradient-to-t
                                    from-black/5
                                    to-transparent
                                "
                            />
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
};

export default BecomeVendorSection;